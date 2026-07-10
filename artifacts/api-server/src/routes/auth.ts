import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { User, PendingRegistration } from "../lib/models";
import { requireAuth } from "../middlewares/requireAuth";
import { sendWelcomeEmail, sendInvestApplicationCode, sendSignInCode, sendPasswordResetCode } from "../lib/email";
import { signToken } from "../lib/jwt";

const loginOtpStore = new Map<string, { otp: string; expiresAt: number }>();
const resetOtpStore = new Map<string, { otp: string; expiresAt: number }>();

function cleanStore<T extends { expiresAt: number }>(store: Map<string, T>) {
  const now = Date.now();
  for (const [k, v] of store) if (v.expiresAt < now) store.delete(k);
}

const router: IRouter = Router();

function formatUser(user: InstanceType<typeof User>) {
  return {
    id: (user as { _id: { toString(): string } })._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    accreditedStatus: user.accreditedStatus,
    totalSharesCredited: user.totalSharesCredited,
    isEnabled: user.isEnabled,
    createdAt: user.createdAt,
  };
}

router.get("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/auth/profile", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const { fullName, phone } = req.body as { fullName?: string; phone?: string };
  const updates: Record<string, string> = {};
  if (fullName) updates["fullName"] = fullName;
  if (phone) updates["phone"] = phone;
  const user = await User.findByIdAndUpdate(userId, updates, { new: true });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.post("/auth/activate", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const { code } = req.body as { code?: string };
  if (!code || typeof code !== "string") { res.status(400).json({ error: "Access code is required" }); return; }
  const user = await User.findById(userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!user.accessCode || user.accessCode.trim().toUpperCase() !== code.trim().toUpperCase()) {
    res.status(400).json({ error: "Invalid access code" });
    return;
  }
  const updated = await User.findByIdAndUpdate(userId, { isEnabled: true, accessCode: null }, { new: true });
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(updated));
});

// ── CREATE ACCOUNT ─────────────────────────────────────────────────────────

router.post("/auth/create-account", async (req: Request, res: Response): Promise<void> => {
  const {
    email, fullName, phone,
    dateOfBirth, nationality, citizenship, country,
    streetAddress, city, stateProvince, postalCode,
    annualIncome, investmentAmount, accreditationStatus,
    employmentStatus, sourceOfFunds, investmentPurpose,
    investmentExperience, netWorthRange, hearAboutUs,
  } = req.body as {
    email?: string; fullName?: string; phone?: string;
    dateOfBirth?: string; nationality?: string; citizenship?: string; country?: string;
    streetAddress?: string; city?: string; stateProvince?: string; postalCode?: string;
    annualIncome?: string; investmentAmount?: string; accreditationStatus?: string;
    employmentStatus?: string; sourceOfFunds?: string; investmentPurpose?: string;
    investmentExperience?: string; netWorthRange?: string; hearAboutUs?: string;
  };

  if (!email || !fullName || !dateOfBirth || !country || !annualIncome ||
    !investmentAmount || !accreditationStatus || !employmentStatus || !sourceOfFunds ||
    !investmentExperience || !hearAboutUs) {
    res.status(400).json({ error: "All required fields must be completed." });
    return;
  }

  const key = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const pendingData = {
    email: key,
    otp,
    fullName: fullName.trim(),
    phone: (phone || "").trim(),
    dateOfBirth: dateOfBirth.trim(),
    nationality: (nationality || citizenship || "").trim(),
    citizenship: (citizenship || nationality || "").trim(),
    streetAddress: (streetAddress || "").trim(),
    city: (city || "").trim(),
    stateProvince: (stateProvince || "").trim(),
    postalCode: (postalCode || "").trim(),
    country: country.trim(),
    annualIncome: annualIncome.trim(),
    investmentAmount: investmentAmount.trim(),
    accreditationStatus: accreditationStatus.trim(),
    employmentStatus: employmentStatus.trim(),
    sourceOfFunds: sourceOfFunds.trim(),
    investmentPurpose: (investmentPurpose || "").trim(),
    investmentExperience: investmentExperience.trim(),
    netWorthRange: (netWorthRange || "").trim(),
    hearAboutUs: hearAboutUs.trim(),
    expiresAt,
  };

  try {
    await PendingRegistration.findOneAndUpdate(
      { email: key },
      pendingData,
      { upsert: true, new: true }
    );
  } catch {
    res.status(500).json({ error: "Failed to store registration. Please try again." });
    return;
  }

  try {
    await sendInvestApplicationCode(key, fullName.trim(), otp);
    res.json({ ok: true });
  } catch {
    await PendingRegistration.deleteOne({ email: key }).catch(() => {});
    res.status(500).json({ error: "Failed to send verification email. Please try again." });
  }
});

// ── RESEND VERIFICATION CODE ────────────────────────────────────────────────

router.post("/auth/create-account/resend", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const key = email.toLowerCase().trim();
  const pending = await PendingRegistration.findOne({ email: key });

  if (!pending || pending.expiresAt < new Date()) {
    res.status(400).json({ error: "No pending registration found. Please submit the application form again.", code: "NO_PENDING" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await PendingRegistration.findOneAndUpdate({ email: key }, { otp, expiresAt });

  try {
    await sendInvestApplicationCode(key, pending.fullName, otp);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to resend verification email. Please try again." });
  }
});

// ── VERIFY CREATE ACCOUNT OTP ───────────────────────────────────────────────

router.post("/auth/create-account/verify", async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) { res.status(400).json({ error: "Email and code are required" }); return; }

  const key = email.toLowerCase().trim();
  const entry = await PendingRegistration.findOne({ email: key });

  if (!entry || entry.expiresAt < new Date()) {
    res.status(400).json({ error: "Your verification code has expired. Please submit the application form again.", code: "EXPIRED" });
    return;
  }

  if (entry.otp !== code.trim()) {
    res.status(400).json({ error: "Invalid verification code. Please check your email and try again." });
    return;
  }

  try {
    // Look up or create the user BEFORE deleting the pending entry
    let user = await User.findOne({ email: key });
    let isNew = false;

    if (!user) {
      try {
        user = await User.create({
          fullName: entry.fullName,
          email: key,
          phone: entry.phone || undefined,
          dateOfBirth: entry.dateOfBirth || undefined,
          nationality: entry.nationality || undefined,
          citizenship: entry.citizenship || undefined,
          streetAddress: entry.streetAddress || undefined,
          city: entry.city || undefined,
          stateProvince: entry.stateProvince || undefined,
          postalCode: entry.postalCode || undefined,
          country: entry.country || undefined,
          annualIncome: entry.annualIncome || undefined,
          investmentAmount: entry.investmentAmount || undefined,
          accreditedStatus: "pending",
          employmentStatus: entry.employmentStatus || undefined,
          sourceOfFunds: entry.sourceOfFunds || undefined,
          investmentPurpose: entry.investmentPurpose || undefined,
          investmentExperience: entry.investmentExperience || undefined,
          netWorthRange: entry.netWorthRange || undefined,
          hearAboutUs: entry.hearAboutUs || undefined,
          totalSharesCredited: 0,
          isEnabled: false,
        });
        isNew = true;
      } catch (createErr: unknown) {
        // Duplicate key — another process may have created the user between findOne and create
        const mongoErr = createErr as { code?: number };
        if (mongoErr?.code === 11000) {
          user = await User.findOne({ email: key });
        }
        if (!user) {
          console.error("User.create failed and findOne retry returned null:", createErr);
          res.status(500).json({ error: "Failed to create account. Please try again." });
          return;
        }
      }
    }

    if (!isNew) {
      await User.findByIdAndUpdate(user._id, {
        fullName: entry.fullName,
        ...(entry.phone && { phone: entry.phone }),
        ...(entry.dateOfBirth && { dateOfBirth: entry.dateOfBirth }),
        ...(entry.nationality && { nationality: entry.nationality }),
        ...(entry.citizenship && { citizenship: entry.citizenship }),
        ...(entry.streetAddress && { streetAddress: entry.streetAddress }),
        ...(entry.city && { city: entry.city }),
        ...(entry.stateProvince && { stateProvince: entry.stateProvince }),
        ...(entry.postalCode && { postalCode: entry.postalCode }),
        ...(entry.country && { country: entry.country }),
        ...(entry.annualIncome && { annualIncome: entry.annualIncome }),
        ...(entry.investmentAmount && { investmentAmount: entry.investmentAmount }),
        ...(entry.employmentStatus && { employmentStatus: entry.employmentStatus }),
        ...(entry.sourceOfFunds && { sourceOfFunds: entry.sourceOfFunds }),
        ...(entry.investmentPurpose && { investmentPurpose: entry.investmentPurpose }),
        ...(entry.investmentExperience && { investmentExperience: entry.investmentExperience }),
        ...(entry.netWorthRange && { netWorthRange: entry.netWorthRange }),
        ...(entry.hearAboutUs && { hearAboutUs: entry.hearAboutUs }),
      });
    }

    // Only delete the pending entry now that the user is safely created/updated
    await PendingRegistration.deleteOne({ email: key });

    if (isNew) {
      sendWelcomeEmail(key, entry.fullName).catch(() => {});
    }

    const token = signToken({
      userId: (user as { _id: { toString(): string } })._id.toString(),
      email: key,
    });

    res.json({ token, fullName: entry.fullName, phone: entry.phone });
  } catch (err: unknown) {
    console.error("create-account/verify error:", err);
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

// ── LOGIN ───────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }

  const key = email.toLowerCase().trim();
  const user = await User.findOne({ email: key });

  if (!user) {
    // Check if they have a pending (unverified) registration
    const pending = await PendingRegistration.findOne({ email: key });
    if (pending && pending.expiresAt > new Date()) {
      res.status(401).json({
        error: "Please verify your email first. Check your inbox for the 6-digit code we sent you.",
        code: "PENDING_VERIFICATION",
      });
      return;
    }
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "No password set for this account. Use email code instead.", code: "NO_PASSWORD" });
    return;
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) { res.status(401).json({ error: "Incorrect email or password." }); return; }

  const token = signToken({
    userId: (user as { _id: { toString(): string } })._id.toString(),
    email: key,
  });
  res.json({ token });
});

router.post("/auth/login/otp", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const key = email.toLowerCase().trim();
  const user = await User.findOne({ email: key });

  if (!user) {
    // Check if they have a pending (unverified) registration
    const pending = await PendingRegistration.findOne({ email: key });
    if (pending && pending.expiresAt > new Date()) {
      res.status(401).json({
        error: "Please verify your email first. Check your inbox for the 6-digit code we sent you.",
        code: "PENDING_VERIFICATION",
      });
      return;
    }
    res.status(404).json({ error: "No account found with that email. Please create an account first." });
    return;
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  cleanStore(loginOtpStore);
  loginOtpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  try {
    await sendSignInCode(key, otp);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to send sign-in code. Please try again or use password login." });
  }
});

router.post("/auth/login/verify", async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) { res.status(400).json({ error: "Email and code are required" }); return; }

  const key = email.toLowerCase().trim();
  cleanStore(loginOtpStore);
  const entry = loginOtpStore.get(key);

  if (!entry || entry.otp !== code.trim() || entry.expiresAt < Date.now()) {
    res.status(400).json({ error: "Invalid or expired code. Please try again." });
    return;
  }
  loginOtpStore.delete(key);

  const user = await User.findOne({ email: key });
  if (!user) { res.status(404).json({ error: "Account not found." }); return; }

  const token = signToken({
    userId: (user as { _id: { toString(): string } })._id.toString(),
    email: key,
  });
  res.json({ token });
});

// ── FORGOT / RESET PASSWORD ─────────────────────────────────────────────────

router.post("/auth/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const key = email.toLowerCase().trim();
  const user = await User.findOne({ email: key });
  if (!user) { res.json({ ok: true }); return; }

  cleanStore(resetOtpStore);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  resetOtpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  // Security: always return ok to avoid email enumeration — but log failures
  sendPasswordResetCode(key, otp).catch((err: unknown) => {
    console.error("Failed to send password reset code:", err);
  });
  res.json({ ok: true });
});

router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { email, code, newPassword } = req.body as { email?: string; code?: string; newPassword?: string };
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Email, code, and new password are required" });
    return;
  }
  if (newPassword.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }

  const key = email.toLowerCase().trim();
  cleanStore(resetOtpStore);
  const entry = resetOtpStore.get(key);
  if (!entry || entry.otp !== code.trim() || entry.expiresAt < Date.now()) {
    res.status(400).json({ error: "Invalid or expired code. Please try again." });
    return;
  }

  const user = await User.findOne({ email: key });
  if (!user) { res.status(404).json({ error: "Account not found." }); return; }

  const hash = await bcrypt.hash(newPassword, 12);
  await User.findOneAndUpdate({ email: key }, { passwordHash: hash });
  resetOtpStore.delete(key);
  res.json({ ok: true });
});

// ── SET PASSWORD (first-time, after email verify) ───────────────────────────

router.post("/auth/set-password", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const { password } = req.body as { password?: string };
  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  await User.findByIdAndUpdate(userId, { passwordHash: hash });
  res.json({ ok: true });
});

export default router;
