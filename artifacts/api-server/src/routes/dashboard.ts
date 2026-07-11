import { Router, type IRouter, type Request, type Response } from "express";
import { mongoose } from "../lib/mongodb";
import { User, Purchase, Transfer, TransferOtp, type IUser } from "../lib/models";
import { requireAuth, requireEnabledUser } from "../middlewares/requireAuth";
import { getSetting } from "./settings";
import {
  sendTransferRequestNotificationToAdmin,
  sendTransferConfirmationToUser,
  sendTransferVerificationCode,
} from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Transfer identity-verification OTP ───────────────────────────────────────
// Codes are persisted in MongoDB (TransferOtp) rather than kept in memory, so
// they survive dev-server restarts/redeploys and work across multiple server
// instances. A code is valid for 20 minutes; resend is rate-limited to once
// every 10 seconds per user.
const OTP_TTL_MS = 20 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 10 * 1000;

function generateRequestId(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `TRF-${dateStr}-${suffix}`;
}

router.get("/dashboard/summary", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const sharePriceStr = await getSetting("share_price");
  const systemMode = await getSetting("system_mode");
  const sharePrice = Number(sharePriceStr ?? "130.00");
  const totalShares = user.totalSharesCredited;
  const totalUsdValue = totalShares * sharePrice;

  const purchases = await Purchase.find({ userId: user._id });

  const pendingPurchases = purchases.filter((p) => p.status === "pending_review").length;
  const confirmedPurchases = purchases.filter((p) => p.status === "confirmed").length;

  res.json({
    totalShares,
    sharePrice,
    totalUsdValue,
    systemMode: systemMode ?? "pre_ipo",
    pendingPurchases,
    confirmedPurchases,
  });
});

// ── Send OTP for transfer verification ─────────────────────────────────────
router.post("/dashboard/transfers/send-otp", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;

  const user = await User.findById(userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const existing = await TransferOtp.findOne({ userId });
  if (existing && Date.now() - existing.sentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.sentAt.getTime())) / 1000);
    res.status(429).json({ error: `Please wait ${waitSeconds}s before requesting a new code.` });
    return;
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date();
  await TransferOtp.findOneAndUpdate(
    { userId },
    { userId, otp, sentAt: now, expiresAt: new Date(now.getTime() + OTP_TTL_MS) },
    { upsert: true }
  );

  try {
    await sendTransferVerificationCode(user.email, user.fullName, otp);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to send transfer OTP");
    res.status(500).json({ error: "Failed to send verification code. Please try again." });
  }
});

// ── List transfers ──────────────────────────────────────────────────────────
router.get("/dashboard/transfers", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [sent, received] = await Promise.all([
    Transfer.find({ userId: user._id }).sort({ createdAt: -1 }),
    Transfer.find({ mode: "internal", recipientEmail: user.email.trim().toLowerCase(), status: "completed" })
      .sort({ createdAt: -1 })
      .populate<{ userId: IUser }>("userId"),
  ]);

  const sentOut = sent.map((t) => ({
    id: t._id.toString(),
    userId: t.userId.toString(),
    direction: "sent" as const,
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
    counterpartyEmail: t.mode === "internal" ? (t.recipientEmail ?? null) : null,
    status: t.status,
    createdAt: t.createdAt,
  }));

  const receivedIn = received.map((t) => {
    const sender = t.userId as unknown as IUser & { _id: mongoose.Types.ObjectId };
    return {
      id: `${t._id.toString()}-received`,
      userId: user._id.toString(),
      direction: "received" as const,
      mode: t.mode ?? "internal",
      requestId: t.requestId ?? "",
      brokerageName: "",
      brokerageAccountNumber: "",
      accountHolderName: "",
      emailAddress: null,
      amountToTransfer: t.amountToTransfer ?? null,
      asset: t.asset ?? null,
      transferSubType: t.transferSubType ?? null,
      notes: t.notes ?? null,
      recipientEmail: user.email,
      counterpartyEmail: sender?.email ?? null,
      status: t.status,
      createdAt: t.createdAt,
    };
  });

  const merged = [...sentOut, ...receivedIn].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json(merged);
});

// ── Create transfer ─────────────────────────────────────────────────────────
router.post("/dashboard/transfers", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;

  const {
    otpCode,
    mode,
    amountToTransfer,
    asset,
    transferSubType,
    notes,
    // Internal fields
    recipientEmail,
    // Brokerage fields
    brokerageName,
    brokerageAccountNumber,
    accountHolderName,
  } = req.body as {
    otpCode?: string;
    mode?: "internal" | "brokerage";
    amountToTransfer?: number;
    asset?: string;
    transferSubType?: "full" | "partial";
    notes?: string;
    recipientEmail?: string;
    brokerageName?: string;
    brokerageAccountNumber?: string;
    accountHolderName?: string;
  };

  const transferMode: "internal" | "brokerage" = mode === "brokerage" ? "brokerage" : "internal";

  const otpEntry = await TransferOtp.findOne({ userId });
  if (!otpEntry || !otpCode || otpEntry.otp !== otpCode.trim() || otpEntry.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "Invalid or expired verification code. Please request a new code." });
    return;
  }
  await TransferOtp.deleteOne({ userId });

  const user = await User.findById(userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (transferMode === "internal" && !recipientEmail) {
    res.status(400).json({ error: "Recipient email is required for internal transfers" });
    return;
  }
  if (transferMode === "brokerage" && (!brokerageName || !accountHolderName || !brokerageAccountNumber)) {
    res.status(400).json({ error: "Brokerage name, account holder name, and account number are required for brokerage transfers" });
    return;
  }

  const requestId = generateRequestId();

  const transfer = await Transfer.create({
    userId: user._id,
    mode: transferMode,
    requestId,
    brokerageName: transferMode === "brokerage" ? brokerageName : "",
    brokerageAccountNumber: transferMode === "brokerage" ? brokerageAccountNumber : "",
    accountHolderName: transferMode === "brokerage" ? accountHolderName : "",
    amountToTransfer: amountToTransfer ?? null,
    asset: asset ?? "SPCX",
    transferSubType: transferSubType ?? null,
    notes: notes ?? null,
    recipientEmail: transferMode === "internal" ? (recipientEmail ?? null) : null,
    status: "pending_review",
  });

  // Send confirmation to user (fire-and-forget)
  sendTransferConfirmationToUser({
    to: user.email,
    fullName: user.fullName,
    requestId,
    mode: transferMode,
    brokerageName: transferMode === "brokerage" ? (brokerageName ?? "") : "",
    asset: asset ?? "SPCX",
    amountToTransfer: amountToTransfer ?? null,
    transferSubType: transferSubType ?? null,
    recipientEmail: recipientEmail ?? null,
  }).catch((err: unknown) => {
    logger.error({ err }, "Failed to send transfer confirmation email to user");
  });

  // Notify admin (fire-and-forget)
  sendTransferRequestNotificationToAdmin({
    userFullName: user.fullName,
    userEmail: user.email,
    requestId,
    mode: transferMode,
    brokerageName: transferMode === "brokerage" ? (brokerageName ?? "") : undefined,
    brokerageAccountNumber: transferMode === "brokerage" ? (brokerageAccountNumber ?? "") : undefined,
    accountHolderName: transferMode === "brokerage" ? (accountHolderName ?? "") : undefined,
    amountToTransfer: amountToTransfer ?? null,
    asset: asset ?? "SPCX",
    transferSubType: transferSubType ?? null,
    notes: notes ?? null,
    recipientEmail: recipientEmail ?? null,
  }).catch((err: unknown) => {
    logger.error({ err }, "Failed to send transfer notification email to admin");
  });

  res.status(201).json({
    id: transfer._id.toString(),
    userId: transfer.userId.toString(),
    mode: transfer.mode,
    requestId: transfer.requestId,
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

export default router;
