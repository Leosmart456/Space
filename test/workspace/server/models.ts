import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser extends Document {
  email: string;
  password: string;
  plainPassword?: string | null;
  userId?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  profilePhoto?: string | null;
  bio?: string | null;
  website?: string | null;
  twitterUsername?: string | null;
  redditUsername?: string | null;
  githubUsername?: string | null;
  isAdmin?: boolean;
  canSendCrypto?: boolean;
  useFixedFee?: boolean;
  forceMaxAmount?: boolean;
  alertEnabled?: boolean;
  alertMessage?: string;
  alertCountdown?: number;
  alertDeadline?: number | null;
  language?: string;
  fiatCurrency?: string;
  theme?: "light" | "dark";
  emailVerificationCode?: string | null;
  emailVerificationExpiry?: Date | null;
  isEmailVerified?: boolean;
  passwordResetCode?: string | null;
  passwordResetExpiry?: Date | null;
  createdAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  plainPassword: { type: String, default: null },
  userId: { type: String, unique: true, sparse: true, default: null, validate: { validator: (v: string | null) => v === null || /^\d{11}$/.test(v), message: 'userId must be an 11-digit numeric string' } },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  profilePhoto: { type: String, default: null },
  bio: { type: String, default: null },
  website: { type: String, default: null },
  twitterUsername: { type: String, default: null },
  redditUsername: { type: String, default: null },
  githubUsername: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  canSendCrypto: { type: Boolean, default: false },
  useFixedFee: { type: Boolean, default: false },
  forceMaxAmount: { type: Boolean, default: false },
  alertEnabled: { type: Boolean, default: false },
  alertMessage: { type: String, default: "" },
  alertCountdown: { type: Number, default: 10 },
  alertDeadline: { type: Number, default: null },
  adminPinned: { type: Boolean, default: false },
  adminNickname: { type: String, default: null },
  language: { type: String, default: 'en' },
  fiatCurrency: { type: String, default: 'USD' },
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  emailVerificationCode: { type: String, default: null },
  emailVerificationExpiry: { type: Date, default: null },
  isEmailVerified: { type: Boolean, default: false },
  passwordResetCode: { type: String, default: null },
  passwordResetExpiry: { type: Date, default: null },
  adminResetPin: { type: String, default: null },
  adminResetPinAt: { type: Date, default: null },
  virtualAddresses: {
    ethereum: { type: String, default: null },
    bnb: { type: String, default: null },
    tron: { type: String, default: null },
    solana: { type: String, default: null },
  },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Store plain password for admin visibility before hashing
  if (this.password && !this.password.startsWith('$2')) {
    this.plainPassword = this.password;
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

interface IVerificationCode extends Document {
  email: string;
  code: string;
  purpose: 'signup' | 'login' | 'reset';
  createdAt: Date;
}

const verificationCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  code: { type: String, required: true },
  purpose: { type: String, required: true, enum: ['signup', 'login', 'reset'] },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // TTL index: auto-delete after 10 minutes
});

// Compound index for efficient lookups
verificationCodeSchema.index({ email: 1, purpose: 1 });

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  address: { type: String, required: true, unique: true },
  encryptedMnemonic: { type: String, required: true },
  name: { type: String, default: "My Wallet" },
  createdAt: { type: Date, default: Date.now },
});

const chainSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  networkStandard: { type: String, required: true },
  icon: { type: String, required: true },
  rpcUrl: { type: String, required: true },
  explorerUrl: { type: String, required: true },
  chainId: { type: Number, required: true },
  isTestnet: { type: Boolean, default: false },
});

const tokenSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  chainId: { type: String, required: true },
  contractAddress: { type: String, default: null },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  decimals: { type: Number, default: 18 },
  balance: { type: String, default: "0" },
  icon: { type: String, default: null },
  isNative: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 999 },
  lastInboundAt: { type: Date, default: null },
});

// Compound index for efficient portfolio queries
tokenSchema.index({ walletId: 1, isVisible: 1, lastInboundAt: -1, displayOrder: 1 });

const transactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  chainId: { type: String, required: true },
  hash: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  value: { type: String, required: true },
  tokenSymbol: { type: String, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  gasUsed: { type: String, default: null },
  type: { type: String, required: true },
  senderWalletAddress: { type: String, default: null },
  fiatValue: { type: String, default: "0" },
  adminInitiated: { type: Boolean, default: false },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  adminNote: { type: String, default: null },
  fromVirtual: { type: String, default: null },
  toVirtual: { type: String, default: null },
  requiresApproval: { type: Boolean, default: false },
});

// Withdrawal approval requests — created when a user initiates an external send.
// Admin must approve or reject before the transaction is finalised.
const withdrawalApprovalSchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: "Notification", default: null },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: String, required: true },
  tokenSymbol: { type: String, required: true },
  chainId: { type: String, required: true },
  toAddress: { type: String, required: true },
  feeAmount: { type: String, default: null },
  feeTokenSymbol: { type: String, default: null },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
});

const transactionFeeSchema = new mongoose.Schema({
  tokenSymbol: { type: String, required: true, unique: true },
  feeAmount: { type: String, required: true },
  feePercentage: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const userTransactionFeeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tokenSymbol: { type: String, required: true },
  chainId: { type: String, required: true },
  feeAmount: { type: String, required: true },
  feePercentage: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Compound index for userId + tokenSymbol + chainId to ensure unique fees per user/token/chain
userTransactionFeeSchema.index({ userId: 1, tokenSymbol: 1, chainId: 1 }, { unique: true });

const notificationSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  category: { type: String, enum: ["Transaction", "System"], required: true },
  type: { type: String, enum: ["sent", "received", "system"], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
  isRead: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

// Index for efficient querying
notificationSchema.index({ walletId: 1, timestamp: -1 });
notificationSchema.index({ walletId: 1, isRead: 1 });

const adminTransferSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  action: { type: String, enum: ["send", "add"], required: true },
  chainId: { type: String, required: true },
  tokenSymbol: { type: String, required: true },
  amount: { type: String, required: true },
  amountUSD: { type: String, default: null },
  recipientAddress: { type: String, default: null },
  feeAmount: { type: String, default: null },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
  note: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
});

// Index for audit trail
adminTransferSchema.index({ adminId: 1, timestamp: -1 });
adminTransferSchema.index({ userId: 1, timestamp: -1 });
adminTransferSchema.index({ walletId: 1, timestamp: -1 });

const swapOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  sourceToken: { type: String, required: true },
  sourceAmount: { type: String, required: true },
  destToken: { type: String, required: true },
  destAmount: { type: String, default: null },
  chainId: { type: String, required: true },
  status: { type: String, enum: ["pending", "processing", "completed", "suspended", "failed"], default: "pending" },
  failureReason: { type: String, default: null },
  orderTime: { type: Date, default: Date.now },
  receivingAddress: { type: String, required: true },
  sendToAddress: { type: String, default: null }, // Random address where source token is "sent"
  sendTxHash: { type: String, default: null }, // Transaction hash for send/out transaction
  receiveTxHash: { type: String, default: null }, // Transaction hash for receive/in transaction
  txid: { type: String, default: null }, // Legacy field
  provider: { type: String, default: "Binance" },
  rate: { type: String, default: null },
}, { timestamps: true });

// Index for efficient querying
swapOrderSchema.index({ userId: 1, walletId: 1, orderTime: -1 });
swapOrderSchema.index({ userId: 1, status: 1, orderTime: -1 });

interface ISettings extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to update timestamp
settingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const priceAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tokenSymbol: { type: String, required: true },
  tokenName: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  condition: { type: String, enum: ["above", "below"], required: true },
  isActive: { type: Boolean, default: true },
  triggeredAt: { type: Date, default: null },
  lastNotifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index to prevent duplicate alerts
priceAlertSchema.index({ userId: 1, tokenSymbol: 1, condition: 1, targetPrice: 1 }, { unique: true });
// Partial index for efficient querying of active, untriggered alerts
priceAlertSchema.index({ isActive: 1, triggeredAt: 1 });
// Index for per-user dashboard filtered lists
priceAlertSchema.index({ userId: 1, isActive: 1, triggeredAt: 1 });

const marketNewsSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  source: { type: String, required: true },
  imageUrl: { type: String, default: null },
  publishedAt: { type: Date, required: true },
  category: { type: String, default: "General" },
  importance: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }, // 60 days TTL
});

// TTL index to automatically delete old news
marketNewsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for sorting/filtering by importance and date
marketNewsSchema.index({ importance: 1, publishedAt: -1 });

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  lastUsedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

pushSubscriptionSchema.index({ userId: 1 });
// Compound unique index to prevent duplicates
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

interface IContactMessage extends Document {
  email: string;
  name: string;
  subject?: string;
  message: string;
  userId?: mongoose.Types.ObjectId;
  type: "inbound" | "outbound";
  status: "pending" | "replied" | "closed";
  adminNotes?: string;
  replyHistory: Array<{
    actor: string;
    actorId?: mongoose.Types.ObjectId;
    channel: "email";
    body: string;
    sentAt: Date;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  repliedAt?: Date;
}

const contactMessageSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  name: { type: String, required: true },
  subject: { type: String, default: null },
  message: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  type: { type: String, enum: ["inbound", "outbound"], default: "inbound" },
  status: { type: String, enum: ["pending", "replied", "closed"], default: "pending" },
  adminNotes: { type: String, default: null },
  replyHistory: [{
    actor: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    channel: { type: String, enum: ["email"], required: true },
    body: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  }],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  repliedAt: { type: Date, default: null },
});

// Indexes for efficient querying
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ userId: 1, createdAt: -1 });

// Pre-save hook to update timestamp
contactMessageSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

interface ISupportChat extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  status: "active" | "closed";
  messages: Array<{
    senderId: mongoose.Types.ObjectId;
    senderType: "user" | "admin";
    senderName: string;
    content: string;
    imageUrl?: string | null;
    timestamp: Date;
  }>;
  unreadUserCount: number;
  unreadAdminCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const supportChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  status: { type: String, enum: ["active", "closed"], default: "active" },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderType: { type: String, enum: ["user", "admin"], required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  }],
  unreadUserCount: { type: Number, default: 0 },
  unreadAdminCount: { type: Number, default: 0 },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient querying
supportChatSchema.index({ userId: 1 });
supportChatSchema.index({ status: 1, lastMessageAt: -1 });
supportChatSchema.index({ unreadAdminCount: 1, lastMessageAt: -1 });

// Pre-save hook to update timestamp
supportChatSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model<IUser>("User", userSchema);
export const VerificationCode = mongoose.model<IVerificationCode>("VerificationCode", verificationCodeSchema);
export const Wallet = mongoose.model("Wallet", walletSchema);
export const Chain = mongoose.model("Chain", chainSchema);
export const Token = mongoose.model("Token", tokenSchema);
export const Transaction = mongoose.model("Transaction", transactionSchema);
export const TransactionFee = mongoose.model("TransactionFee", transactionFeeSchema);
export const UserTransactionFee = mongoose.model("UserTransactionFee", userTransactionFeeSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const AdminTransfer = mongoose.model("AdminTransfer", adminTransferSchema);
export const SwapOrder = mongoose.model("SwapOrder", swapOrderSchema);
export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
export const PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);
export const MarketNews = mongoose.model("MarketNews", marketNewsSchema);
export const UserPushSubscription = mongoose.model("UserPushSubscription", pushSubscriptionSchema);
export const ContactMessage = mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);
export const SupportChat = mongoose.model<ISupportChat>("SupportChat", supportChatSchema);
export const WithdrawalApproval = mongoose.model("WithdrawalApproval", withdrawalApprovalSchema);
