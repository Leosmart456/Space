import { Router, type IRouter, type Request, type Response } from "express";
import { User } from "../lib/models";
import { requireAuth } from "../middlewares/requireAuth";
import { sendOnboardingNotificationToAdmin } from "../lib/email";

const router: IRouter = Router();

router.post("/investor/verify", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;

  const body = req.body as {
    isAccredited: boolean;
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
  };

  if (typeof body.isAccredited !== "boolean") {
    res.status(400).json({ error: "isAccredited must be a boolean" });
    return;
  }

  const existing = await User.findById(userId);

  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (existing.accreditedStatus !== "pending") {
    res.status(409).json({ error: "Already verified" });
    return;
  }

  const status = body.isAccredited ? "yes" : "no";

  const updates: Record<string, string> = { accreditedStatus: status };
  if (body.fullName) updates["fullName"] = body.fullName;
  if (body.phone) updates["phone"] = body.phone;

  const user = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true }
  );

  if (!user) {
    res.status(409).json({ error: "Already verified" });
    return;
  }

  sendOnboardingNotificationToAdmin({
    userFullName: user.fullName || body.fullName || "Unknown",
    userEmail: user.email || "",
    userPhone: user.phone || body.phone,
    isAccredited: body.isAccredited,
    dateOfBirth: body.dateOfBirth,
    nationality: body.nationality,
    streetAddress: body.streetAddress,
    city: body.city,
    stateProvince: body.stateProvince,
    postalCode: body.postalCode,
    country: body.country,
    sourceOfFunds: body.sourceOfFunds,
    investmentPurpose: body.investmentPurpose,
    annualIncomeRange: body.annualIncomeRange,
    netWorthRange: body.netWorthRange,
  }).catch(() => {});

  res.json({
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    accreditedStatus: user.accreditedStatus,
    totalSharesCredited: user.totalSharesCredited,
    createdAt: user.createdAt,
  });
});

export default router;
