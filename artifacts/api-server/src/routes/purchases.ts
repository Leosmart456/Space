import { Router, type IRouter, type Request, type Response } from "express";
import { User, Purchase } from "../lib/models";
import { requireEnabledUser } from "../middlewares/requireAuth";
import { getSetting } from "./settings";
import { sendPurchaseNotificationToAdmin, sendPaymentInstructionsEmail } from "../lib/email";

const router: IRouter = Router();

// Bulk-purchase discount: orders of more than 20 shares get 20% off automatically.
const BULK_DISCOUNT_MIN_SHARES = 20;
const BULK_DISCOUNT_PERCENT = 20;

router.get("/purchases", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const purchases = await Purchase.find({ userId: user._id }).sort({ createdAt: -1 });

  res.json(
    purchases.map((p) => ({
      id: p._id.toString(),
      userId: p.userId.toString(),
      amountUsd: p.amountUsd,
      requestedShares: p.requestedShares,
      pricePerShare: p.pricePerShare,
      status: p.status,
      discountPercent: p.discountPercent ?? 0,
      originalAmountUsd: p.originalAmountUsd ?? p.amountUsd,
      discountAmountUsd: p.discountAmountUsd ?? 0,
      createdAt: p.createdAt,
    }))
  );
});

router.post("/purchases", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const {
    requestedShares,
    agreedToTerms,
    fullName: formFullName,
    phone: formPhone,
    dateOfBirth,
    nationality,
    streetAddress,
    city,
    stateProvince,
    postalCode,
    country,
    sourceOfFunds,
    investmentPurpose,
    annualIncomeRange,
    netWorthRange,
    paymentMethod,
  } = req.body as {
    requestedShares: number;
    agreedToTerms: boolean;
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    streetAddress?: string;
    city?: string;
    stateProvince?: string;
    postalCode?: string;
    country?: string;
    sourceOfFunds?: string;
    investmentPurpose?: string;
    annualIncomeRange?: string;
    netWorthRange?: string;
    paymentMethod?: string;
  };

  if (!requestedShares || Number(requestedShares) <= 0) {
    res.status(400).json({ error: "Number of shares must be greater than 0" });
    return;
  }

  if (!agreedToTerms) {
    res.status(400).json({ error: "You must agree to the terms" });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const sharePriceStr = await getSetting("share_price");
  const pricePerShare = Number(sharePriceStr ?? "150.00");
  const shares = Number(requestedShares);
  const originalAmountUsd = shares * pricePerShare;

  const minInvestmentStr = await getSetting("min_investment");
  const minInvestment = Number(minInvestmentStr ?? "2000");

  if (originalAmountUsd < minInvestment) {
    res.status(400).json({
      error: `Minimum investment is ${minInvestment.toLocaleString()} (${Math.ceil(minInvestment / pricePerShare)} shares at current price)`,
    });
    return;
  }

  // Bulk-purchase discount: >20 shares gets an automatic 20% discount off the order total.
  const discountApplies = shares > BULK_DISCOUNT_MIN_SHARES;
  const discountPercent = discountApplies ? BULK_DISCOUNT_PERCENT : 0;
  const discountAmountUsd = discountApplies ? Math.round(originalAmountUsd * (BULK_DISCOUNT_PERCENT / 100) * 100) / 100 : 0;
  const amountUsd = Math.round((originalAmountUsd - discountAmountUsd) * 100) / 100;

  const purchase = await Purchase.create({
    userId: user._id,
    amountUsd,
    requestedShares: shares,
    pricePerShare,
    status: "pending_review",
    discountPercent,
    originalAmountUsd,
    discountAmountUsd,
  });

  sendPurchaseNotificationToAdmin({
    userFullName: formFullName || user.fullName,
    userEmail: user.email,
    userPhone: formPhone || user.phone,
    amountUsd,
    requestedShares: shares,
    pricePerShare,
    extra: {
      dateOfBirth,
      nationality,
      streetAddress,
      city,
      stateProvince,
      postalCode,
      country,
      sourceOfFunds,
      investmentPurpose,
      annualIncomeRange,
      netWorthRange,
      paymentMethod,
      ...(discountApplies
        ? { discountApplied: `${discountPercent}% bulk discount (saved ${discountAmountUsd.toLocaleString()} off ${originalAmountUsd.toLocaleString()})` }
        : {}),
    },
  }).catch(() => {});

  // Send payment instructions email to user with BTC address + live BTC price conversion
  (async () => {
    try {
      const btcAddressSetting = await getSetting("btc_address");
      const btcAddress = btcAddressSetting ?? "bc1qx2vuy9ndykk7h5u57pun9xd8pknq6jfp4km82t";
      let btcAmount = "~see below~";
      try {
        let btcUsd = 0;
        // Try Binance first (no auth, reliable)
        try {
          const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", { signal: AbortSignal.timeout(5000) });
          if (r.ok) { const d = await r.json() as { price?: string }; btcUsd = parseFloat(d.price ?? "0"); }
        } catch { /* try next */ }
        // Fallback: Kraken
        if (!btcUsd) {
          try {
            const r = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", { signal: AbortSignal.timeout(5000) });
            if (r.ok) { const d = await r.json() as { result?: { XXBTZUSD?: { c?: string[] } } }; btcUsd = parseFloat(d.result?.XXBTZUSD?.c?.[0] ?? "0"); }
          } catch { /* try next */ }
        }
        // Fallback: CoinGecko
        if (!btcUsd) {
          try {
            const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: AbortSignal.timeout(5000) });
            if (r.ok) { const d = await r.json() as { bitcoin?: { usd?: number } }; btcUsd = d.bitcoin?.usd ?? 0; }
          } catch { /* all failed */ }
        }
        if (btcUsd > 0) btcAmount = (amountUsd / btcUsd).toFixed(8);
      } catch { /* never block */ }
      await sendPaymentInstructionsEmail({
        to: user.email,
        fullName: formFullName || user.fullName,
        requestedShares: shares,
        amountUsd,
        btcAddress,
        btcAmount,
      });
    } catch { /* never block the response */ }
  })();

  res.status(201).json({
    id: purchase._id.toString(),
    userId: purchase.userId.toString(),
    amountUsd: purchase.amountUsd,
    requestedShares: purchase.requestedShares,
    pricePerShare: purchase.pricePerShare,
    status: purchase.status,
    discountPercent: purchase.discountPercent,
    originalAmountUsd: purchase.originalAmountUsd,
    discountAmountUsd: purchase.discountAmountUsd,
    createdAt: purchase.createdAt,
  });
});

export default router;
