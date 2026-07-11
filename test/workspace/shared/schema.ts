import { z } from "zod";

// User schemas
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().or(z.date()),
  profilePhoto: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Wallet schemas
export const insertWalletSchema = z.object({
  userId: z.string(),
  address: z.string(),
  encryptedMnemonic: z.string(),
  name: z.string().default("My Wallet"),
});

// Chain schema
export const insertChainSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  networkStandard: z.string(),
  icon: z.string(),
  rpcUrl: z.string(),
  explorerUrl: z.string(),
  chainId: z.number(),
  isTestnet: z.boolean().optional(),
});

// Token schema
export const insertTokenSchema = z.object({
  walletId: z.string(),
  chainId: z.string(),
  contractAddress: z.string().nullable().optional(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number().default(18),
  balance: z.string().default("0"),
  icon: z.string().nullable().optional(),
  isNative: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  displayOrder: z.number().default(999).optional(),
  lastInboundAt: z.date().nullable().optional(),
});

// Transaction schema
export const insertTransactionSchema = z.object({
  walletId: z.string(),
  chainId: z.string(),
  hash: z.string(),
  from: z.string(),
  to: z.string(),
  value: z.string(),
  tokenSymbol: z.string(),
  status: z.string(),
  gasUsed: z.string().nullable().optional(),
  type: z.string(),
  senderWalletAddress: z.string().nullable().optional(),
  fiatValue: z.string().default("0"),
});

// Transaction Fee schema
export const insertTransactionFeeSchema = z.object({
  tokenSymbol: z.string(),
  feeAmount: z.string(),
  feePercentage: z.number().default(0),
  updatedBy: z.string().optional(),
});

// Types
export type User = {
  _id?: string;
  userId?: string | null;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  profilePhoto?: string | null;
  isAdmin?: boolean;
  canSendCrypto?: boolean;
  useFixedFee?: boolean;
  language?: string;
  fiatCurrency?: string;
  theme?: "light" | "dark";
  plainPassword?: string | null;
  createdAt?: Date;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type Wallet = {
  _id?: string;
  userId: string;
  address: string;
  encryptedMnemonic: string;
  name: string;
  createdAt?: Date;
};

export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Chain = {
  _id?: string;
  id: string;
  name: string;
  symbol: string;
  networkStandard: string;
  icon: string;
  rpcUrl: string;
  explorerUrl: string;
  chainId: number;
  isTestnet?: boolean;
};

export type InsertChain = z.infer<typeof insertChainSchema>;

export type Token = {
  _id?: string;
  walletId: string;
  chainId: string;
  contractAddress?: string | null;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  icon?: string | null;
  isNative?: boolean;
  isVisible?: boolean;
  displayOrder?: number;
  lastInboundAt?: Date | null;
};

export type InsertToken = z.infer<typeof insertTokenSchema>;

export type Transaction = {
  _id?: string;
  walletId: string;
  chainId: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  status: string;
  timestamp?: Date;
  gasUsed?: string | null;
  type: string;
  senderWalletAddress?: string | null;
  fiatValue?: string;
};

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TransactionFee = {
  _id?: string;
  tokenSymbol: string;
  feeAmount: string;
  feePercentage: number;
  updatedAt?: Date;
  updatedBy?: string;
};

export type InsertTransactionFee = z.infer<typeof insertTransactionFeeSchema>;

// User-specific Transaction Fee schema (per-user custom fees)
export const insertUserTransactionFeeSchema = z.object({
  userId: z.string(),
  tokenSymbol: z.string(),
  chainId: z.string(),
  feeAmount: z.string(),
  feePercentage: z.number().default(0),
  updatedBy: z.string().optional(),
});

export type UserTransactionFee = {
  _id?: string;
  userId: string;
  tokenSymbol: string;
  chainId: string;
  feeAmount: string;
  feePercentage: number;
  updatedAt?: Date;
  updatedBy?: string;
};

export type InsertUserTransactionFee = z.infer<typeof insertUserTransactionFeeSchema>;

// Swap Order schema (real-time swap order details)
export const insertSwapOrderSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  walletId: z.string(),
  sourceToken: z.string(),
  sourceAmount: z.string(),
  destToken: z.string(),
  destAmount: z.string().nullable().optional(),
  chainId: z.string(),
  status: z.enum(["pending", "processing", "completed", "suspended", "failed"]).default("pending"),
  failureReason: z.string().nullable().optional(),
  orderTime: z.date().default(() => new Date()),
  receivingAddress: z.string(),
  sendToAddress: z.string().nullable().optional(),
  sendTxHash: z.string().nullable().optional(),
  receiveTxHash: z.string().nullable().optional(),
  txid: z.string().nullable().optional(),
  provider: z.string().default("Binance"),
  rate: z.string().nullable().optional(),
});

export type SwapOrder = {
  _id?: string;
  orderId: string;
  userId: string;
  walletId: string;
  sourceToken: string;
  sourceAmount: string;
  destToken: string;
  destAmount: string | null;
  chainId: string;
  status: "pending" | "processing" | "completed" | "suspended" | "failed";
  failureReason: string | null;
  orderTime: Date;
  receivingAddress: string;
  sendToAddress?: string | null;
  sendTxHash?: string | null;
  receiveTxHash?: string | null;
  txid: string | null;
  provider: string;
  rate: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InsertSwapOrder = z.infer<typeof insertSwapOrderSchema>;

// Notification schema
export const insertNotificationSchema = z.object({
  walletId: z.string(),
  category: z.enum(["Transaction", "System"]),
  type: z.enum(["sent", "received", "system"]),
  title: z.string(),
  description: z.string(),
  timestamp: z.date().default(() => new Date()),
  transactionId: z.string().nullable().optional(),
  isRead: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

export type Notification = {
  _id: string;
  walletId: string;
  category: "Transaction" | "System";
  type: "sent" | "received" | "system";
  title: string;
  description: string;
  timestamp: string | Date;
  transactionId?: {
    _id: string;
    hash: string;
    type: string;
    value: string;
    tokenSymbol: string;
  } | null;
  isRead: boolean;
  metadata?: {
    // Transaction metadata
    amount?: string;
    tokenSymbol?: string;
    chainId?: string;
    fiatValue?: string;
    walletAddress?: string;
    to?: string;
    // Swap metadata
    orderId?: string;
    fromToken?: string;
    toToken?: string;
    destAmount?: string;
    // Any other metadata
    [key: string]: any;
  };
};

export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Client-side types for wallet operations
export type WalletCreateRequest = {
  password: string;
};

export type WalletImportRequest = {
  mnemonic: string;
  password: string;
};

export type SendTransactionRequest = {
  to: string;
  amount: string;
  tokenSymbol: string;
  chainId: string;
};

export type SwapRequest = {
  fromToken: string;
  toToken: string;
  amount: string;
  chainId: string;
};

// Admin types
export type AdminAddCryptoRequest = {
  userId: string;
  tokenSymbol: string;
  amount: string;
  chainId: string;
  senderWalletAddress?: string;
};

export type AdminSearchRequest = {
  searchQuery: string;
};

export type AdminUpdateFeeRequest = {
  tokenSymbol: string;
  feeAmount: string;
  feePercentage?: number;
};
