import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { mongoose } from "../lib/mongodb";
import { User, Purchase, Transfer, PriceAlert, type IUser } from "../lib/models";
import { requireAdmin } from "../middlewares/requireAdmin";
import { getSetting, upsertSetting } from "./settings";
import { sendBroadcastEmail, getSmtpStatus, sendPriceAlertEmail, sendSharesCreditedEmail, sendPaymentInstructionsEmail, sendInternalTransferCompletedEmail, sendPurchaseRejectedEmail, sendTransferStatusUpdateEmail } from "../lib/email";
import { createAdminSession, destroyAdminSession } from "../lib/adminSessions";
import { computeSyncedPrice } from "./price";

const router: IRouter = Router();

function formatUser(u: IUser, sharePrice: number) {
  return {
    id: (u as IUser & { _id: mongoose.Types.ObjectId })._id.toString(),
    fullName: u.fullName,
    email: u.email,
    phone: u.phone ?? null,
    accreditedStatus: u.accreditedStatus,
    totalSharesCredited: u.totalSharesCredited,
    totalUsdValue: u.totalSharesCredited * sharePrice,
    isEnabled: u.isEnabled,
    createdAt: u.createdAt,
  };
}

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string };

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    res.status(503).json({ success: false, message: "Admin credentials not configured" });
    return;
  }

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  const token = createAdminSession();

  res.cookie("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, message: "Logged in" });
});

router.get("/admin/me", requireAdmin, (_req: Request, res: Response): void => {
  res.json({ ok: true });
});

router.post("/admin/logout", (req: Request, res: Response): void => {
  const token = req.cookies?.["admin_session"] as string | undefined;
  destroyAdminSession(token);
  res.clearCookie("admin_session");
  res.json({ success: true });
});

router.get("/admin/stats", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const allUsers = await User.find();
  const allPurchases = await Purchase.find();

  const totalSharesCredited = allUsers.reduce((acc, u) => acc + u.totalSharesCredited, 0);
  const sharePrice = Number((await getSetting("share_price")) ?? "130");

  res.json({
    totalUsers: allUsers.length,
    totalSharesCredited,
    totalUsdValue: totalSharesCredited * sharePrice,
    pendingPurchases: allPurchases.filter((p) => p.status === "pending_review").length,
    confirmedPurchases: allPurchases.filter((p) => p.status === "confirmed").length,
    accreditedUsers: allUsers.filter((u) => u.accreditedStatus === "yes").length,
  });
});

router.get("/admin/users", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const users = await User.find().sort({ createdAt: -1 });
  const sharePrice = Number((await getSetting("share_price")) ?? "130");
  res.json(users.map((u) => formatUser(u, sharePrice)));
});

router.post("/admin/users/:id/generate-code", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const user = await User.findByIdAndUpdate(rawId, { accessCode: code }, { new: true });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ code, userId: user._id.toString(), email: user.email, fullName: user.fullName });
});

router.patch("/admin/users/:id/access", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const { enabled } = req.body as { enabled: boolean };
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "enabled must be a boolean" });
    return;
  }

  const user = await User.findByIdAndUpdate(rawId, { isEnabled: enabled }, { new: true });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const sharePrice = Number((await getSetting("share_price")) ?? "130");
  res.json(formatUser(user, sharePrice));
});

router.post("/admin/users/:id/credit", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const { shares } = req.body as { shares: number };
  if (!shares || Number(shares) <= 0) {
    res.status(400).json({ error: "Shares must be a positive number" });
    return;
  }

  const updated = await User.findByIdAndUpdate(
    rawId,
    { $inc: { totalSharesCredited: Number(shares) } },
    { new: true }
  );

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const sharePrice = Number((await getSetting("share_price")) ?? "130");
  const amountUsd = Number(shares) * sharePrice;
  const platformUrl = process.env.PLATFORM_URL || "https://spacexrocket.space";

  sendSharesCreditedEmail({
    to: updated.email,
    fullName: updated.fullName,
    requestedShares: Number(shares),
    pricePerShare: sharePrice,
    amountUsd,
    platformUrl,
  }).catch(() => {});

  res.json(formatUser(updated, sharePrice));
});

router.get("/admin/purchases", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const purchases = await Purchase.find().sort({ createdAt: -1 }).populate<{ userId: IUser }>("userId");

  res.json(
    purchases.map((p) => {
      const user = p.userId as IUser & { _id: mongoose.Types.ObjectId };
      return {
        id: p._id.toString(),
        userId: user._id.toString(),
        userFullName: user.fullName,
        userEmail: user.email,
        amountUsd: p.amountUsd,
        requestedShares: p.requestedShares,
        pricePerShare: p.pricePerShare,
        status: p.status,
        discountPercent: p.discountPercent ?? 0,
        originalAmountUsd: p.originalAmountUsd ?? p.amountUsd,
        discountAmountUsd: p.discountAmountUsd ?? 0,
        createdAt: p.createdAt,
      };
    })
  );
});

router.patch("/admin/purchases/:id/status", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    res.status(400).json({ error: "Invalid purchase ID" });
    return;
  }

  const { status } = req.body as { status: "pending_review" | "confirmed" | "rejected" };
  const validStatuses = ["pending_review", "confirmed", "rejected"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const purchase = await Purchase.findById(rawId).populate<{ userId: IUser }>("userId");
  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  const prevStatus = purchase.status;
  const user = purchase.userId as IUser & { _id: mongoose.Types.ObjectId };

  purchase.status = status;
  await purchase.save();

  if (status === "confirmed" && prevStatus !== "confirmed") {
    await User.findByIdAndUpdate(user._id, { $inc: { totalSharesCredited: purchase.requestedShares } });

    const sharePrice = Number((await getSetting("share_price")) ?? "130");
    const platformUrl = process.env.PLATFORM_URL || "https://spacexrocket.space";
    sendSharesCreditedEmail({
      to: user.email,
      fullName: user.fullName,
      requestedShares: purchase.requestedShares,
      pricePerShare: sharePrice,
      amountUsd: purchase.amountUsd,
      platformUrl,
    }).catch(() => {});
  }

  if (status !== "confirmed" && prevStatus === "confirmed") {
    await User.findByIdAndUpdate(user._id, { $inc: { totalSharesCredited: -purchase.requestedShares } });
  }

  if (status === "rejected" && prevStatus !== "rejected") {
    const platformUrl = process.env.PLATFORM_URL || "https://spacexrocket.space";
    sendPurchaseRejectedEmail({
      to: user.email,
      fullName: user.fullName,
      requestedShares: purchase.requestedShares,
      amountUsd: purchase.amountUsd,
      platformUrl,
    }).catch((err: unknown) => {
      console.error("Purchase rejection email failed:", err);
    });
  }

  res.json({
    id: purchase._id.toString(),
    userId: user._id.toString(),
    userFullName: user.fullName,
    userEmail: user.email,
    amountUsd: purchase.amountUsd,
    requestedShares: purchase.requestedShares,
    pricePerShare: purchase.pricePerShare,
    status: purchase.status,
    discountPercent: purchase.discountPercent ?? 0,
    originalAmountUsd: purchase.originalAmountUsd ?? purchase.amountUsd,
    discountAmountUsd: purchase.discountAmountUsd ?? 0,
    createdAt: purchase.createdAt,
  });
});

router.patch("/admin/settings", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { sharePrice, systemMode, minInvestment, ipoTargetDate, btcAddress, ethAddress } = req.body as {
    sharePrice?: number;
    systemMode?: "pre_ipo" | "post_ipo";
    minInvestment?: number;
    ipoTargetDate?: string | null;
    btcAddress?: string;
    ethAddress?: string;
  };

  if (sharePrice !== undefined) {
    if (Number(sharePrice) <= 0) {
      res.status(400).json({ error: "Share price must be positive" });
      return;
    }
    await upsertSetting("share_price", String(sharePrice));

    const newPrice = Number(sharePrice);
    const activeAlerts = await PriceAlert.find({ triggered: false }).populate<{ userId: IUser }>("userId");

    for (const alert of activeAlerts) {
      const target = alert.targetPrice;
      const shouldTrigger = alert.direction ? newPrice >= target : newPrice <= target;
      if (shouldTrigger) {
        const alertUser = alert.userId as IUser;
        sendPriceAlertEmail(alertUser.email, alertUser.fullName, alert.targetPrice, newPrice, alert.direction).catch((err: unknown) => {
          // Fire-and-forget: log but don't fail the price update — alert is already marked triggered
          console.error("Failed to send price alert email:", err);
        });
        await PriceAlert.findByIdAndUpdate(alert._id, { triggered: true, triggeredAt: new Date() });
      }
    }
  }

  if (systemMode !== undefined) {
    if (!["pre_ipo", "post_ipo"].includes(systemMode)) {
      res.status(400).json({ error: "Invalid system mode" });
      return;
    }
    await upsertSetting("system_mode", systemMode);
  }

  if (minInvestment !== undefined) {
    if (Number(minInvestment) <= 0) {
      res.status(400).json({ error: "Minimum investment must be positive" });
      return;
    }
    await upsertSetting("min_investment", String(minInvestment));
  }

  if (ipoTargetDate !== undefined) {
    await upsertSetting("ipo_target_date", ipoTargetDate ?? "");
  }

  if (btcAddress !== undefined && btcAddress.trim()) {
    await upsertSetting("btc_address", btcAddress.trim());
  }

  if (ethAddress !== undefined && ethAddress.trim()) {
    await upsertSetting("eth_address", ethAddress.trim());
  }

  const finalPrice = await getSetting("share_price");
  const finalMode = await getSetting("system_mode");
  const finalMin = await getSetting("min_investment");
  const finalIpoDate = await getSetting("ipo_target_date");
  const finalBtc = await getSetting("btc_address");
  const finalEth = await getSetting("eth_address");

  res.json({
    sharePrice: Number(finalPrice ?? "130"),
    systemMode: finalMode ?? "post_ipo",
    minInvestment: Number(finalMin ?? "2000"),
    ipoTargetDate: finalIpoDate || null,
    btcAddress: finalBtc ?? "bc1qx2vuy9ndykk7h5u57pun9xd8pknq6jfp4km82t",
    ethAddress: finalEth ?? "0xCBF1857DD3A4C30A6972c2d35e9EED19728cea57",
  });
});

// Sync the platform share price to the current live NASDAQ:SPCX price from Yahoo Finance (same source as TradingView)
router.post("/admin/sync-price", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const newPrice = await computeSyncedPrice();
    await upsertSetting("share_price", String(newPrice));

    // Trigger any matching price alerts
    const activeAlerts = await PriceAlert.find({ triggered: false }).populate<{ userId: IUser }>("userId");
    for (const alert of activeAlerts) {
      const shouldTrigger = alert.direction
        ? newPrice >= alert.targetPrice
        : newPrice <= alert.targetPrice;
      if (shouldTrigger) {
        const alertUser = alert.userId as IUser;
        sendPriceAlertEmail(alertUser.email, alertUser.fullName, alert.targetPrice, newPrice, alert.direction).catch((err: unknown) => {
          console.error("Price alert email failed:", err);
        });
        await PriceAlert.findByIdAndUpdate(alert._id, { triggered: true, triggeredAt: new Date() });
      }
    }

    res.json({ ok: true, price: newPrice });
  } catch (err) {
    res.status(503).json({ error: "Could not fetch live SPCX price from Yahoo Finance.", detail: (err as Error).message });
  }
});

router.get("/admin/transfers", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const transfers = await Transfer.find().sort({ createdAt: -1 }).populate<{ userId: IUser }>("userId");

  res.json(
    transfers.map((t) => {
      const user = t.userId as IUser & { _id: mongoose.Types.ObjectId };
      return {
        id: t._id.toString(),
        userId: user._id.toString(),
        userFullName: user.fullName,
        userEmail: user.email,
        mode: t.mode ?? "brokerage",
        requestId: t.requestId ?? "",
        brokerageName: t.brokerageName,
        brokerageAccountNumber: t.brokerageAccountNumber,
        accountHolderName: t.accountHolderName,
        emailAddress: t.emailAddress ?? null,
        amountToTransfer: t.amountToTransfer ?? null,
        asset: t.asset ?? null,
        transferSubType: t.transferSubType ?? null,
        notes: t.notes ?? null,
        recipientEmail: t.recipientEmail ?? null,
        status: t.status,
        createdAt: t.createdAt,
      };
    })
  );
});

router.patch("/admin/transfers/:id/status", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    res.status(400).json({ error: "Invalid transfer ID" });
    return;
  }

  const { status } = req.body as { status: "queued" | "transfer_requested" | "pending_review" | "under_review" | "awaiting_documents" | "approved" | "processing" | "completed" | "rejected" };
  const valid = ["queued", "transfer_requested", "pending_review", "under_review", "awaiting_documents", "approved", "processing", "completed", "rejected"];
  if (!valid.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const existingTransfer = await Transfer.findById(rawId);
  if (!existingTransfer) {
    res.status(404).json({ error: "Transfer not found" });
    return;
  }
  const prevTransferStatus = existingTransfer.status;

  const transfer = await Transfer.findByIdAndUpdate(rawId, { status }, { new: true }).populate<{ userId: IUser }>("userId");

  if (!transfer) {
    res.status(404).json({ error: "Transfer not found" });
    return;
  }

  const user = transfer.userId as IUser & { _id: mongoose.Types.ObjectId };

  if (transfer.mode === "internal" && status === "completed" && prevTransferStatus !== "completed" && transfer.recipientEmail) {
    const sender = await User.findById(user._id);
    const recipient = await User.findOne({ email: transfer.recipientEmail.trim().toLowerCase() });

    if (sender && recipient) {
      const sharesToMove =
        transfer.transferSubType === "full" || transfer.amountToTransfer == null
          ? sender.totalSharesCredited
          : Math.min(transfer.amountToTransfer, sender.totalSharesCredited);

      if (sharesToMove > 0) {
        await User.findByIdAndUpdate(sender._id, { $inc: { totalSharesCredited: -sharesToMove } });
        await User.findByIdAndUpdate(recipient._id, { $inc: { totalSharesCredited: sharesToMove } });
      }

      const platformUrl = process.env.PLATFORM_URL || "https://spacexrocket.space";

      sendInternalTransferCompletedEmail({
        to: sender.email,
        fullName: sender.fullName,
        role: "sender",
        counterpartyEmail: recipient.email,
        shares: sharesToMove,
        requestId: transfer.requestId ?? "",
        platformUrl,
      }).catch((err: unknown) => {
        console.error("Internal transfer completion email (sender) failed:", err);
      });

      sendInternalTransferCompletedEmail({
        to: recipient.email,
        fullName: recipient.fullName,
        role: "recipient",
        counterpartyEmail: sender.email,
        shares: sharesToMove,
        requestId: transfer.requestId ?? "",
        platformUrl,
      }).catch((err: unknown) => {
        console.error("Internal transfer completion email (recipient) failed:", err);
      });
    }
  } else if (status !== prevTransferStatus && status !== "completed" && ["under_review", "awaiting_documents", "approved", "processing", "rejected"].includes(status)) {
    const platformUrl = process.env.PLATFORM_URL || "https://spacexrocket.space";
    sendTransferStatusUpdateEmail({
      to: user.email,
      fullName: user.fullName,
      requestId: transfer.requestId ?? "",
      status,
      platformUrl,
    }).catch((err: unknown) => {
      console.error("Transfer status update email failed:", err);
    });
  }

  res.json({
    id: transfer._id.toString(),
    userId: user._id.toString(),
    userFullName: user.fullName,
    userEmail: user.email,
    mode: transfer.mode ?? "brokerage",
    requestId: transfer.requestId ?? "",
    brokerageName: transfer.brokerageName,
    brokerageAccountNumber: transfer.brokerageAccountNumber,
    accountHolderName: transfer.accountHolderName,
    emailAddress: transfer.emailAddress ?? null,
    amountToTransfer: transfer.amountToTransfer ?? null,
    asset: transfer.asset ?? null,
    transferSubType: transfer.transferSubType ?? null,
    notes: transfer.notes ?? null,
    recipientEmail: transfer.recipientEmail ?? null,
    status: transfer.status,
    createdAt: transfer.createdAt,
  });
});

router.post("/admin/purchases/:id/resend-instructions", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    res.status(400).json({ error: "Invalid purchase ID" });
    return;
  }

  const purchase = await Purchase.findById(rawId).populate<{ userId: IUser }>("userId");
  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  const user = purchase.userId as IUser & { _id: mongoose.Types.ObjectId };
  const btcAddressSetting = await getSetting("btc_address");
  const btcAddress = btcAddressSetting ?? "bc1qx2vuy9ndykk7h5u57pun9xd8pknq6jfp4km82t";

  let btcAmount = "~see below~";
  // Try Binance → Kraken → CoinGecko for BTC price
  try {
    let btcUsd = 0;
    try {
      const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", { signal: AbortSignal.timeout(5000) });
      if (r.ok) { const d = await r.json() as { price?: string }; btcUsd = parseFloat(d.price ?? "0"); }
    } catch { /* try next */ }
    if (!btcUsd) {
      try {
        const r = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", { signal: AbortSignal.timeout(5000) });
        if (r.ok) { const d = await r.json() as { result?: { XXBTZUSD?: { c?: string[] } } }; btcUsd = parseFloat(d.result?.XXBTZUSD?.c?.[0] ?? "0"); }
      } catch { /* try next */ }
    }
    if (!btcUsd) {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: AbortSignal.timeout(5000) });
        if (r.ok) { const d = await r.json() as { bitcoin?: { usd?: number } }; btcUsd = d.bitcoin?.usd ?? 0; }
      } catch { /* all failed */ }
    }
    if (btcUsd > 0) btcAmount = (purchase.amountUsd / btcUsd).toFixed(8);
  } catch { /* fall back to placeholder */ }

  await sendPaymentInstructionsEmail({
    to: user.email,
    fullName: user.fullName,
    requestedShares: purchase.requestedShares,
    amountUsd: purchase.amountUsd,
    btcAddress,
    btcAmount,
  });

  res.json({ ok: true });
});

router.get("/admin/smtp-status", requireAdmin, (_req: Request, res: Response): void => {
  res.json(getSmtpStatus());
});

router.post("/admin/broadcast", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { subject, body } = req.body as { subject: string; body: string };

  if (!subject || !body) {
    res.status(400).json({ error: "Subject and body are required" });
    return;
  }

  const users = await User.find({}, { email: 1 });
  const emails = users.map((u) => u.email).filter(Boolean);

  const sent = await sendBroadcastEmail(emails, subject, body);

  res.json({ sent, message: `Broadcast sent to ${sent} users` });
});

router.post("/admin/users/:id/set-password", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.findByIdAndUpdate(rawId, { passwordHash }, { new: true });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ ok: true, userId: user._id.toString(), email: user.email });
});

export default router;
