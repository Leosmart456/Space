import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  citizenship?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
  annualIncome?: string | null;
  investmentAmount?: string | null;
  accreditedStatus: "pending" | "yes" | "no";
  employmentStatus?: string | null;
  sourceOfFunds?: string | null;
  investmentPurpose?: string | null;
  investmentExperience?: string | null;
  netWorthRange?: string | null;
  hearAboutUs?: string | null;
  totalSharesCredited: number;
  isEnabled: boolean;
  accessCode?: string | null;
  passwordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    nationality: { type: String, default: null },
    citizenship: { type: String, default: null },
    streetAddress: { type: String, default: null },
    city: { type: String, default: null },
    stateProvince: { type: String, default: null },
    postalCode: { type: String, default: null },
    country: { type: String, default: null },
    annualIncome: { type: String, default: null },
    investmentAmount: { type: String, default: null },
    accreditedStatus: { type: String, enum: ["pending", "yes", "no"], default: "pending" },
    employmentStatus: { type: String, default: null },
    sourceOfFunds: { type: String, default: null },
    investmentPurpose: { type: String, default: null },
    investmentExperience: { type: String, default: null },
    netWorthRange: { type: String, default: null },
    hearAboutUs: { type: String, default: null },
    totalSharesCredited: { type: Number, default: 0 },
    isEnabled: { type: Boolean, default: false },
    accessCode: { type: String, default: null },
    passwordHash: { type: String, default: null },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (mongoose.models["User"] as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema);

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  amountUsd: number;
  requestedShares: number;
  pricePerShare: number;
  status: "pending_review" | "confirmed" | "rejected";
  // Bulk-purchase discount (20% off orders of more than 20 shares)
  discountPercent: number;
  originalAmountUsd: number;
  discountAmountUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountUsd: { type: Number, required: true },
    requestedShares: { type: Number, required: true },
    pricePerShare: { type: Number, required: true },
    status: { type: String, enum: ["pending_review", "confirmed", "rejected"], default: "pending_review" },
    discountPercent: { type: Number, default: 0 },
    originalAmountUsd: { type: Number, default: 0 },
    discountAmountUsd: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Purchase: Model<IPurchase> =
  (mongoose.models["Purchase"] as Model<IPurchase>) ?? mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export interface ITransfer extends Document {
  userId: mongoose.Types.ObjectId;
  mode: "brokerage" | "internal";
  requestId: string;
  // Brokerage transfer fields
  brokerageName: string;
  brokerageAccountNumber: string;
  accountHolderName: string;
  emailAddress?: string | null;
  amountToTransfer?: number | null;
  asset?: string | null;
  transferSubType?: "full" | "partial" | null;
  notes?: string | null;
  // Internal transfer fields
  recipientEmail?: string | null;
  status: "queued" | "transfer_requested" | "pending_review" | "under_review" | "awaiting_documents" | "approved" | "processing" | "completed" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["brokerage", "internal"], default: "internal" },
    requestId: { type: String, default: "" },
    brokerageName: { type: String, default: "" },
    brokerageAccountNumber: { type: String, default: "" },
    accountHolderName: { type: String, default: "" },
    emailAddress: { type: String, default: null },
    amountToTransfer: { type: Number, default: null },
    asset: { type: String, default: null },
    transferSubType: { type: String, enum: ["full", "partial", null], default: null },
    notes: { type: String, default: null },
    recipientEmail: { type: String, default: null },
    status: {
      type: String,
      enum: ["queued", "transfer_requested", "pending_review", "under_review", "awaiting_documents", "approved", "processing", "completed", "rejected"],
      default: "pending_review",
    },
  },
  { timestamps: true }
);

export const Transfer: Model<ITransfer> =
  (mongoose.models["Transfer"] as Model<ITransfer>) ?? mongoose.model<ITransfer>("Transfer", TransferSchema);

// ── Transfer identity-verification OTP ───────────────────────────────────────
// Persisted in the DB (not in-memory) so codes survive server restarts/redeploys
// and work across multiple server instances.
export interface ITransferOtp extends Document {
  userId: mongoose.Types.ObjectId;
  otp: string;
  sentAt: Date;
  expiresAt: Date;
}

const TransferOtpSchema = new Schema<ITransferOtp>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  otp: { type: String, required: true },
  sentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

export const TransferOtp: Model<ITransferOtp> =
  (mongoose.models["TransferOtp"] as Model<ITransferOtp>) ?? mongoose.model<ITransferOtp>("TransferOtp", TransferOtpSchema);

export interface ISetting extends Document {
  key: string;
  value: string;
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

export const Setting: Model<ISetting> =
  (mongoose.models["Setting"] as Model<ISetting>) ?? mongoose.model<ISetting>("Setting", SettingSchema);

export interface IPriceAlert extends Document {
  userId: mongoose.Types.ObjectId;
  targetPrice: number;
  direction: boolean;
  triggered: boolean;
  triggeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PriceAlertSchema = new Schema<IPriceAlert>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetPrice: { type: Number, required: true },
    direction: { type: Boolean, required: true },
    triggered: { type: Boolean, default: false },
    triggeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PriceAlert: Model<IPriceAlert> =
  (mongoose.models["PriceAlert"] as Model<IPriceAlert>) ?? mongoose.model<IPriceAlert>("PriceAlert", PriceAlertSchema);

export interface IPendingRegistration extends Document {
  email: string;
  otp: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  citizenship: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  annualIncome: string;
  investmentAmount: string;
  accreditationStatus: string;
  employmentStatus: string;
  sourceOfFunds: string;
  investmentPurpose: string;
  investmentExperience: string;
  netWorthRange: string;
  hearAboutUs: string;
  expiresAt: Date;
}

const PendingRegistrationSchema = new Schema<IPendingRegistration>({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, default: "" },
  dateOfBirth: { type: String, default: "" },
  nationality: { type: String, default: "" },
  citizenship: { type: String, default: "" },
  streetAddress: { type: String, default: "" },
  city: { type: String, default: "" },
  stateProvince: { type: String, default: "" },
  postalCode: { type: String, default: "" },
  country: { type: String, default: "" },
  annualIncome: { type: String, default: "" },
  investmentAmount: { type: String, default: "" },
  accreditationStatus: { type: String, default: "" },
  employmentStatus: { type: String, default: "" },
  sourceOfFunds: { type: String, default: "" },
  investmentPurpose: { type: String, default: "" },
  investmentExperience: { type: String, default: "" },
  netWorthRange: { type: String, default: "" },
  hearAboutUs: { type: String, default: "" },
  expiresAt: { type: Date, required: true },
});

PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingRegistration: Model<IPendingRegistration> =
  (mongoose.models["PendingRegistration"] as Model<IPendingRegistration>) ??
  mongoose.model<IPendingRegistration>("PendingRegistration", PendingRegistrationSchema);
