import {
  type User as UserType,
  type Wallet as WalletType,
  type InsertWallet,
  type Chain as ChainType,
  type InsertChain,
  type Token as TokenType,
  type InsertToken,
  type Transaction as TransactionType,
  type InsertTransaction,
  type TransactionFee as TransactionFeeType,
  type InsertTransactionFee,
  type UserTransactionFee as UserTransactionFeeType,
  type InsertUserTransactionFee,
  type SwapOrder as SwapOrderType,
  type InsertSwapOrder,
} from "@shared/schema";
import { User, Wallet, Chain, Token, Transaction, TransactionFee, UserTransactionFee, SwapOrder } from "./models";
import { generateAddressForChain } from "./utils/address-generator";
import { ETHEREUM_TOKENS } from "@shared/ethereum-tokens";
import { BNB_TOKENS } from "@shared/bnb-tokens";
import { TRON_TOKENS } from "@shared/tron-tokens";
import { SOLANA_TOKENS } from "@shared/solana-tokens";
import mongoose from "mongoose";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserType | undefined>;
  getUserByEmail(email: string): Promise<UserType | undefined>;
  createUser(userData: any): Promise<UserType>;
  updateUserProfilePhoto(userId: string, photoUrl: string): Promise<UserType | undefined>;
  updateUserFeeMethod(userId: string, useFixedFee: boolean): Promise<UserType | undefined>;
  updateUserTheme(userId: string, theme: "light" | "dark"): Promise<UserType | undefined>;
  getAllUsers(): Promise<UserType[]>;
  searchUsers(query: string): Promise<UserType[]>;

  // Wallet operations
  getWallet(id: string): Promise<WalletType | undefined>;
  getWalletByAddress(address: string): Promise<WalletType | undefined>;
  getWalletsByUser(userId: string): Promise<WalletType[]>;
  createWallet(wallet: InsertWallet): Promise<WalletType>;
  getAllWallets(): Promise<WalletType[]>;

  // Chain operations
  getAllChains(): Promise<ChainType[]>;
  getChain(id: string): Promise<ChainType | undefined>;
  
  // Token operations
  getTokensByWallet(walletId: string): Promise<TokenType[]>;
  getTokensByChain(walletId: string, chainId: string): Promise<TokenType[]>;
  getTokenBySymbol(walletId: string, symbol: string): Promise<TokenType | undefined>;
  getTokenBySymbolAndChain(walletId: string, symbol: string, chainId: string): Promise<TokenType | undefined>;
  createToken(token: InsertToken): Promise<TokenType>;
  updateTokenBalance(id: string, balance: string): Promise<TokenType | undefined>;
  updateTokenVisibility(id: string, isVisible: boolean): Promise<TokenType | undefined>;
  updateTokenDisplayOrder(id: string, displayOrder: number): Promise<TokenType | undefined>;
  
  // Transaction operations
  getTransaction(id: string): Promise<TransactionType | undefined>;
  getTransactionsByWallet(walletId: string): Promise<TransactionType[]>;
  createTransaction(transaction: InsertTransaction): Promise<TransactionType>;
  updateTransactionStatus(id: string, status: string): Promise<TransactionType | undefined>;

  // Transaction Fee operations
  getTransactionFee(tokenSymbol: string): Promise<TransactionFeeType | undefined>;
  getAllTransactionFees(): Promise<TransactionFeeType[]>;
  upsertTransactionFee(fee: InsertTransactionFee): Promise<TransactionFeeType>;

  // User Transaction Fee operations (per-user custom fees)
  getUserTransactionFee(userId: string, tokenSymbol: string, chainId: string): Promise<UserTransactionFeeType | undefined>;
  getUserTransactionFees(userId: string): Promise<UserTransactionFeeType[]>;
  upsertUserTransactionFee(fee: InsertUserTransactionFee): Promise<UserTransactionFeeType>;
  deleteUserTransactionFee(userId: string, tokenSymbol: string, chainId: string): Promise<boolean>;

  // Swap Order operations (real-time swap order tracking)
  createSwapOrder(order: InsertSwapOrder): Promise<SwapOrderType>;
  getSwapOrder(orderId: string): Promise<SwapOrderType | undefined>;
  getActiveSwapOrders(userId: string): Promise<SwapOrderType[]>;
  getAllSwapOrders(userId: string): Promise<SwapOrderType[]>;
  updateSwapOrder(orderId: string, updates: Partial<SwapOrderType>): Promise<SwapOrderType | undefined>;
}

// Default token display order
const DEFAULT_TOKEN_ORDER = [
  { symbol: "BTCB", chainId: "bnb", order: 1 },
  { symbol: "ETH", chainId: "ethereum", order: 2 },
  { symbol: "BNB", chainId: "bnb", order: 3 },
  { symbol: "USDT", chainId: "ethereum", order: 4 },
  { symbol: "SOL", chainId: "solana", order: 5 },
  { symbol: "TRX", chainId: "tron", order: 6 },
  { symbol: "USDT", chainId: "bnb", order: 7 },
  { symbol: "USDT", chainId: "tron", order: 8 },
  { symbol: "ETH", chainId: "bnb", order: 9 },
  { symbol: "USDC", chainId: "ethereum", order: 10 },
  { symbol: "ETH", chainId: "tron", order: 11 },
  { symbol: "ETH", chainId: "solana", order: 12 },
  { symbol: "DAI", chainId: "ethereum", order: 13 },
];

export class MongoStorage implements IStorage {
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    try {
      await this.initializeChains();
      await this.migrateChainSymbols(); // Fix existing chain symbols
      await this.initializeAdmin();
      await this.initializeTransactionFees();
      await this.clearSwapHistory();
      await this.migrateTokens();
      await this.backfillUserIds();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw new Error("Database initialization failed");
    }
  }

  static generateUserId(): string {
    // Generate a unique 11-digit numeric string
    const min = 10000000000;
    const max = 99999999999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  private async backfillUserIds() {
    try {
      const usersWithoutId = await User.find({ userId: null });
      let count = 0;
      for (const user of usersWithoutId) {
        const MAX_RETRIES = 5;
        let assigned = false;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          const uid = MongoStorage.generateUserId();
          try {
            await User.findByIdAndUpdate(user._id, { userId: uid }, { runValidators: true });
            assigned = true;
            count++;
            break;
          } catch (err: any) {
            if (err?.code === 11000 && err?.keyPattern?.userId) {
              console.warn(`[Migration] userId collision during backfill, retrying (attempt ${attempt + 1})`);
            } else {
              throw err;
            }
          }
        }
        if (!assigned) {
          console.error(`[Migration] Failed to assign userId to user ${user._id} after ${MAX_RETRIES} attempts`);
        }
      }
      if (count > 0) {
        console.log(`[Migration] Backfilled 11-digit userId for ${count} users`);
      }
    } catch (err) {
      console.error("[Migration] Failed to backfill userIds:", err);
    }
  }

  private async migrateTokens() {
    try {
      // REMOVED: This migration was incorrectly setting chain symbols to network standards
      // Chain symbols should be native asset symbols (ETH, BNB, TRX, SOL), not network standards (ERC-20, BEP-20, etc.)
      // The correct symbols are now set in initializeChains() and migrateChainSymbols()
      
      // Migrate WETH → ETH for TRON chain
      const tronWethUpdate = await Token.updateMany(
        { symbol: "WETH", chainId: "tron" },
        { 
          $set: { 
            symbol: "ETH",
            name: "Ethereum",
            icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
          } 
        }
      );
      if (tronWethUpdate.modifiedCount > 0) {
        console.log(`[Migration] Updated ${tronWethUpdate.modifiedCount} WETH → ETH tokens on TRON`);
      }

      // Migrate WETH → ETH for Solana chain
      const solanaWethUpdate = await Token.updateMany(
        { symbol: "WETH", chainId: "solana" },
        { 
          $set: { 
            symbol: "ETH",
            name: "Ethereum",
            icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
          } 
        }
      );
      if (solanaWethUpdate.modifiedCount > 0) {
        console.log(`[Migration] Updated ${solanaWethUpdate.modifiedCount} WETH → ETH tokens on Solana`);
      }

      // Set default display order for key tokens
      // This migration makes default tokens visible and sets their display order
      let updatedCount = 0;
      for (const defaultToken of DEFAULT_TOKEN_ORDER) {
        const result = await Token.updateMany(
          { 
            symbol: defaultToken.symbol, 
            chainId: defaultToken.chainId,
            $or: [
              { displayOrder: { $exists: false } }, // Tokens without displayOrder
              { displayOrder: { $gte: 999 } } // Or tokens with default high order
            ]
          },
          { 
            $set: { 
              displayOrder: defaultToken.order,
              isVisible: true // Ensure default tokens are visible
            } 
          }
        );
        updatedCount += result.modifiedCount;
      }
      
      // Hide all non-default tokens for existing wallets
      // Build list of default token combinations to exclude
      const defaultTokenCombinations = DEFAULT_TOKEN_ORDER.map(t => ({
        symbol: t.symbol,
        chainId: t.chainId
      }));
      
      // Set isVisible=false for all tokens NOT in the default list
      const hideResult = await Token.updateMany(
        {
          $and: [
            // Must not match any of the default token combinations
            {
              $nor: defaultTokenCombinations.map(combo => ({
                symbol: combo.symbol,
                chainId: combo.chainId
              }))
            },
            // Only update if currently visible
            { isVisible: true }
          ]
        },
        { 
          $set: { 
            isVisible: false,
            displayOrder: 999 // Set high order for non-default tokens
          } 
        }
      );
      
      console.log(`[Migration] Set default displayOrder for ${DEFAULT_TOKEN_ORDER.length} token types (${updatedCount} tokens updated)`);
      console.log(`[Migration] Hidden ${hideResult.modifiedCount} non-default tokens`);
    } catch (error) {
      console.error("Failed to migrate tokens:", error);
    }
  }

  private async clearSwapHistory() {
    try {
      const result = await Transaction.deleteMany({ type: "swap" });
      console.log(`Cleared ${result.deletedCount} swap history entries`);
    } catch (error) {
      console.error("Failed to clear swap history:", error);
    }
  }

  private async initializeAdmin() {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        console.warn("ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set. Admin user will not be created.");
        return;
      }

      const existingAdmin = await User.findOne({ email: adminEmail });
      
      if (!existingAdmin) {
        await User.create({
          email: adminEmail,
          password: adminPassword,
          firstName: "Admin",
          lastName: "User",
          dateOfBirth: new Date("1990-01-01"),
          isAdmin: true,
        });
        console.log("Admin user created successfully");
      } else {
        // Update admin password if it already exists (in case ADMIN_PASSWORD secret was changed)
        existingAdmin.password = adminPassword;
        // Ensure all required fields are set
        if (!existingAdmin.dateOfBirth) {
          existingAdmin.dateOfBirth = new Date("1990-01-01");
        }
        if (!existingAdmin.firstName) {
          existingAdmin.firstName = "Admin";
        }
        if (!existingAdmin.lastName) {
          existingAdmin.lastName = "User";
        }
        // CRITICAL: Ensure isAdmin flag is set to true
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log("Admin password updated successfully");
      }
    } catch (error) {
      console.error("Failed to initialize admin:", error);
    }
  }

  private async initializeChains() {
    try {
      const existingChains = await Chain.find();
      
      if (existingChains.length === 0) {
        const chainsToInsert: InsertChain[] = [
          {
            id: "ethereum",
            name: "Ethereum",
            symbol: "ETH", // Native chain symbol (not ERC-20)
            networkStandard: "ERC-20",
            icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
            rpcUrl: "https://mainnet.infura.io/v3/",
            explorerUrl: "https://etherscan.io",
            chainId: 1,
            isTestnet: false,
          },
          {
            id: "bnb",
            name: "BNB Smart Chain",
            symbol: "BNB", // Native chain symbol (not BEP-20)
            networkStandard: "BEP-20",
            icon: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
            rpcUrl: "https://bsc-dataseed.binance.org/",
            explorerUrl: "https://bscscan.com",
            chainId: 56,
            isTestnet: false,
          },
          {
            id: "tron",
            name: "TRON",
            symbol: "TRX", // Native chain symbol (not TRC-20)
            networkStandard: "TRC-20",
            icon: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
            rpcUrl: "https://api.trongrid.io",
            explorerUrl: "https://tronscan.org",
            chainId: 0,
            isTestnet: false,
          },
          {
            id: "solana",
            name: "Solana",
            symbol: "SOL", // Native chain symbol (not "Solana")
            networkStandard: "SPL",
            icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
            rpcUrl: "https://api.mainnet-beta.solana.com",
            explorerUrl: "https://explorer.solana.com",
            chainId: 0,
            isTestnet: false,
          },
        ];

        await Chain.insertMany(chainsToInsert);
      }
    } catch (error) {
      console.error("Failed to initialize chains:", error);
      throw error;
    }
  }

  // Migration: Fix chain symbols to be native symbols (ETH, BNB, TRX, SOL) instead of network standards
  private async migrateChainSymbols() {
    try {
      const chainUpdates = [
        { id: "ethereum", correctSymbol: "ETH" },
        { id: "bnb", correctSymbol: "BNB" },
        { id: "tron", correctSymbol: "TRX" },
        { id: "solana", correctSymbol: "SOL" },
      ];

      let updated = 0;
      for (const { id, correctSymbol } of chainUpdates) {
        const result = await Chain.updateOne(
          { id },
          { $set: { symbol: correctSymbol } }
        );
        if (result.modifiedCount > 0) {
          updated++;
        }
      }

      if (updated > 0) {
        console.log(`[Migration] Updated ${updated} chain symbols to native symbols`);
      }
    } catch (error) {
      console.error("Failed to migrate chain symbols:", error);
    }
  }

  private async initializeTransactionFees() {
    try {
      const existingFees = await TransactionFee.find();
      
      if (existingFees.length === 0) {
        const feesToInsert: InsertTransactionFee[] = [
          { tokenSymbol: "ETH", feeAmount: "0.001", feePercentage: 0.5 },
          { tokenSymbol: "BTC", feeAmount: "0.00001", feePercentage: 0.5 },
          { tokenSymbol: "BNB", feeAmount: "0.001", feePercentage: 0.5 },
          { tokenSymbol: "USDT", feeAmount: "1.0", feePercentage: 0.5 },
          { tokenSymbol: "USDC", feeAmount: "1.0", feePercentage: 0.5 },
          { tokenSymbol: "SOL", feeAmount: "0.001", feePercentage: 0.5 },
          { tokenSymbol: "TRX", feeAmount: "1.0", feePercentage: 0.5 },
        ];

        await TransactionFee.insertMany(feesToInsert);
        console.log("Transaction fees initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize transaction fees:", error);
      throw error;
    }
  }

  // User operations
  async getUser(id: string): Promise<UserType | undefined> {
    const user = await User.findById(id).lean();
    if (!user) return undefined;
    return {
      ...user,
      _id: user._id.toString(),
    } as UserType;
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    const user = await User.findOne({ email }).lean();
    if (!user) return undefined;
    return {
      ...user,
      _id: user._id.toString(),
    } as UserType;
  }

  async createUser(userData: any): Promise<UserType> {
    // Generate unique virtual addresses for each supported chain
    if (!userData.virtualAddresses) {
      userData.virtualAddresses = {
        ethereum: generateAddressForChain("ethereum"),
        bnb: generateAddressForChain("bnb"),
        tron: generateAddressForChain("tron"),
        solana: generateAddressForChain("solana"),
      };
    }
    // Generate a unique 11-digit numeric userId if not already set
    if (!userData.userId) {
      let uid: string;
      let attempts = 0;
      do {
        uid = MongoStorage.generateUserId();
        attempts++;
      } while (attempts < 10 && await User.findOne({ userId: uid }));
      userData.userId = uid!;
    }
    // Retry on duplicate-key errors for userId (extremely rare concurrency case)
    const MAX_RETRIES = 3;
    let lastError: any;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const user = await User.create(userData);
        return {
          ...user.toObject(),
          _id: (user._id as any).toString(),
        } as UserType;
      } catch (err: any) {
        const isDupKey = err?.code === 11000 && err?.keyPattern?.userId;
        if (!isDupKey) throw err;
        // Regenerate userId and retry
        userData.userId = MongoStorage.generateUserId();
        lastError = err;
        console.warn(`[createUser] userId collision, retrying (attempt ${attempt + 1})`);
      }
    }
    throw lastError;
  }

  async updateUserProfilePhoto(userId: string, photoUrl: string): Promise<UserType | undefined> {
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: photoUrl },
      { new: true }
    ).lean();
    if (!user) return undefined;
    return {
      ...user,
      _id: user._id.toString(),
    } as UserType;
  }

  async updateUserFeeMethod(userId: string, useFixedFee: boolean): Promise<UserType | undefined> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { useFixedFee } },
      { new: true }
    ).lean();
    if (!user) return undefined;
    return {
      ...user,
      _id: user._id.toString(),
    } as UserType;
  }

  async updateUserTheme(userId: string, theme: "light" | "dark"): Promise<UserType | undefined> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { theme } },
      { new: true }
    ).lean();
    if (!user) return undefined;
    return {
      ...user,
      _id: user._id.toString(),
    } as UserType;
  }

  async getAllUsers(): Promise<UserType[]> {
    const users = await User.find().lean();
    return users.map(user => ({
      ...user,
      _id: user._id.toString(),
    })) as UserType[];
  }

  async searchUsers(query: string): Promise<UserType[]> {
    // First try to find wallets matching the query
    const wallets = await Wallet.find({
      $or: [
        { address: { $regex: query, $options: 'i' } },
        // Also search by wallet ID if it's a valid ObjectId
        ...(mongoose.isValidObjectId(query) ? [{ _id: new (mongoose.Types.ObjectId as any)(query) }] : [])
      ]
    }).lean();

    const walletUserIds = wallets.map(w => w.userId);

    // Search users by email, name, 11-digit userId, or MongoDB ObjectId, OR matching wallet
    const isNumericUserId = /^\d{11}$/.test(query);
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        ...(isNumericUserId ? [{ userId: query }] : []),
        ...(mongoose.isValidObjectId(query) ? [{ _id: new (mongoose.Types.ObjectId as any)(query) }] : []),
        ...(walletUserIds.length > 0 ? [{ _id: { $in: walletUserIds } }] : [])
      ]
    }).lean();
    
    return users.map(user => ({
      ...user,
      _id: user._id.toString(),
    })) as UserType[];
  }

  // Wallet operations
  async getWallet(id: string): Promise<WalletType | undefined> {
    const wallet = await Wallet.findById(id).lean();
    if (!wallet) return undefined;
    return {
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString(),
    } as unknown as WalletType;
  }

  async getWalletByAddress(address: string): Promise<WalletType | undefined> {
    const wallet = await Wallet.findOne({ address }).lean();
    if (!wallet) return undefined;
    return {
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString(),
    } as unknown as WalletType;
  }

  async getWalletsByUser(userId: string): Promise<WalletType[]> {
    const wallets = await Wallet.find({ userId }).lean();
    return wallets.map(wallet => ({
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString(),
    })) as unknown as WalletType[];
  }

  async createWallet(insertWallet: InsertWallet): Promise<WalletType> {
    const wallet = await Wallet.create(insertWallet);
    
    try {
      // Helper function to get display order
      const getDisplayOrder = (symbol: string, chainId: string): number => {
        const defaultToken = DEFAULT_TOKEN_ORDER.find(
          t => t.symbol === symbol && t.chainId === chainId
        );
        return defaultToken ? defaultToken.order : 999;
      };

      // Helper function to check if token is in default list
      const isDefaultVisible = (symbol: string, chainId: string): boolean => {
        return DEFAULT_TOKEN_ORDER.some(
          t => t.symbol === symbol && t.chainId === chainId
        );
      };

      // Create default tokens for all chains
      const allDefaultTokens: InsertToken[] = [
        // Ethereum tokens
        ...ETHEREUM_TOKENS.map(token => ({
          walletId: wallet._id.toString(),
          chainId: "ethereum",
          contractAddress: token.contractAddress || null,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: "0",
          isNative: token.symbol === "ETH",
          icon: token.icon || null,
          isVisible: isDefaultVisible(token.symbol, "ethereum"),
          displayOrder: getDisplayOrder(token.symbol, "ethereum"),
        })),
        // BNB tokens
        ...BNB_TOKENS.map(token => ({
          walletId: wallet._id.toString(),
          chainId: "bnb",
          contractAddress: token.contractAddress || null,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: "0",
          isNative: token.symbol === "BNB",
          icon: token.icon || null,
          isVisible: isDefaultVisible(token.symbol, "bnb"),
          displayOrder: getDisplayOrder(token.symbol, "bnb"),
        })),
        // TRON tokens
        ...TRON_TOKENS.map(token => ({
          walletId: wallet._id.toString(),
          chainId: "tron",
          contractAddress: token.contractAddress || null,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: "0",
          isNative: token.symbol === "TRX",
          icon: token.icon || null,
          isVisible: isDefaultVisible(token.symbol, "tron"),
          displayOrder: getDisplayOrder(token.symbol, "tron"),
        })),
        // Solana tokens
        ...SOLANA_TOKENS.map(token => ({
          walletId: wallet._id.toString(),
          chainId: "solana",
          contractAddress: token.contractAddress || null,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: "0",
          isNative: token.symbol === "SOL",
          icon: token.icon || null,
          isVisible: isDefaultVisible(token.symbol, "solana"),
          displayOrder: getDisplayOrder(token.symbol, "solana"),
        })),
      ];

      await Token.insertMany(allDefaultTokens);
      
      return {
        ...wallet.toObject(),
        _id: wallet._id.toString(),
        userId: wallet.userId.toString(),
      } as unknown as WalletType;
    } catch (error) {
      console.error("Failed to create wallet:", error);
      await Wallet.findByIdAndDelete(wallet._id);
      throw new Error("Wallet creation failed");
    }
  }

  async getAllWallets(): Promise<WalletType[]> {
    const wallets = await Wallet.find().lean();
    return wallets.map(wallet => ({
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString(),
    })) as unknown as WalletType[];
  }

  // Chain operations
  async getAllChains(): Promise<ChainType[]> {
    const chains = await Chain.find().lean();
    return chains.map(chain => ({
      ...chain,
      _id: chain._id?.toString(),
    })) as ChainType[];
  }

  async getChain(id: string): Promise<ChainType | undefined> {
    const chain = await Chain.findOne({ id }).lean();
    if (!chain) return undefined;
    return {
      ...chain,
      _id: chain._id?.toString(),
    } as ChainType;
  }

  // Token operations
  async getTokensByWallet(walletId: string): Promise<TokenType[]> {
    const tokens = await Token.find({ walletId }).lean();
    return tokens.map(token => ({
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    })) as unknown as TokenType[];
  }

  async getTokensByChain(walletId: string, chainId: string): Promise<TokenType[]> {
    const tokens = await Token.find({ walletId, chainId }).lean();
    return tokens.map(token => ({
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    })) as unknown as TokenType[];
  }

  async getTokenBySymbol(walletId: string, symbol: string): Promise<TokenType | undefined> {
    const token = await Token.findOne({ walletId, symbol }).lean();
    if (!token) return undefined;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    } as unknown as TokenType;
  }

  async getTokenBySymbolAndChain(walletId: string, symbol: string, chainId: string): Promise<TokenType | undefined> {
    const token = await Token.findOne({ walletId, symbol, chainId }).lean();
    if (!token) return undefined;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    } as unknown as TokenType;
  }

  async createToken(insertToken: InsertToken): Promise<TokenType> {
    const token = await Token.create(insertToken);
    return {
      ...token.toObject(),
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    } as unknown as TokenType;
  }

  async updateTokenBalance(id: string, balance: string): Promise<TokenType | undefined> {
    const token = await Token.findByIdAndUpdate(
      id,
      { balance },
      { new: true }
    ).lean();
    if (!token) return undefined;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    } as unknown as TokenType;
  }

  async updateTokenVisibility(id: string, isVisible: boolean): Promise<TokenType | undefined> {
    const token = await Token.findByIdAndUpdate(
      id,
      { isVisible },
      { new: true }
    ).lean();
    if (!token) return undefined;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    } as unknown as TokenType;
  }

  async updateTokenDisplayOrder(id: string, displayOrder: number): Promise<TokenType | undefined> {
    const token = await Token.findByIdAndUpdate(
      id,
      { displayOrder },
      { new: true }
    ).lean();
    if (!token) return undefined;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    } as unknown as TokenType;
  }

  async updateTokenLastInbound(id: string): Promise<TokenType | undefined> {
    const token = await Token.findByIdAndUpdate(
      id,
      { lastInboundAt: new Date() },
      { new: true }
    ).lean();
    if (!token) return undefined;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString(),
    } as unknown as TokenType;
  }

  // Transaction operations
  async getTransaction(id: string): Promise<TransactionType | undefined> {
    const transaction = await Transaction.findById(id).lean();
    if (!transaction) return undefined;
    return {
      ...transaction,
      _id: transaction._id.toString(),
      walletId: transaction.walletId.toString(),
    } as unknown as TransactionType;
  }

  async getTransactionsByWallet(walletId: string): Promise<TransactionType[]> {
    const transactions = await Transaction.find({ walletId }).sort({ timestamp: -1 }).lean();
    return transactions.map(tx => ({
      ...tx,
      _id: tx._id.toString(),
      walletId: tx.walletId.toString(),
    })) as unknown as TransactionType[];
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<TransactionType> {
    const transaction = await Transaction.create(insertTransaction);
    return {
      ...transaction.toObject(),
      _id: transaction._id.toString(),
      walletId: transaction.walletId.toString(),
    } as unknown as TransactionType;
  }

  async updateTransactionStatus(id: string, status: string): Promise<TransactionType | undefined> {
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    if (!transaction) return undefined;
    return {
      ...transaction,
      _id: transaction._id.toString(),
      walletId: transaction.walletId.toString(),
    } as unknown as TransactionType;
  }

  // Transaction Fee operations
  async getTransactionFee(tokenSymbol: string): Promise<TransactionFeeType | undefined> {
    const fee = await TransactionFee.findOne({ tokenSymbol }).lean();
    if (!fee) return undefined;
    return {
      ...fee,
      _id: fee._id.toString(),
    } as TransactionFeeType;
  }

  async getAllTransactionFees(): Promise<TransactionFeeType[]> {
    const fees = await TransactionFee.find().lean();
    return fees.map(fee => ({
      ...fee,
      _id: fee._id.toString(),
    })) as TransactionFeeType[];
  }

  async upsertTransactionFee(feeData: InsertTransactionFee): Promise<TransactionFeeType> {
    const fee = await TransactionFee.findOneAndUpdate(
      { tokenSymbol: feeData.tokenSymbol },
      { ...feeData, updatedAt: new Date() },
      { upsert: true, new: true }
    ).lean();
    return {
      ...fee,
      _id: fee._id.toString(),
    } as TransactionFeeType;
  }

  // User Transaction Fee operations (per-user custom fees)
  async getUserTransactionFee(userId: string, tokenSymbol: string, chainId: string): Promise<UserTransactionFeeType | undefined> {
    const fee = await UserTransactionFee.findOne({ userId, tokenSymbol, chainId }).lean();
    if (!fee) return undefined;
    return {
      ...fee,
      _id: fee._id.toString(),
      userId: fee.userId.toString(),
    } as UserTransactionFeeType;
  }

  async getUserTransactionFees(userId: string): Promise<UserTransactionFeeType[]> {
    const fees = await UserTransactionFee.find({ userId }).lean();
    return fees.map(fee => ({
      ...fee,
      _id: fee._id.toString(),
      userId: fee.userId.toString(),
    })) as UserTransactionFeeType[];
  }

  async upsertUserTransactionFee(feeData: InsertUserTransactionFee): Promise<UserTransactionFeeType> {
    const fee = await UserTransactionFee.findOneAndUpdate(
      { userId: feeData.userId, tokenSymbol: feeData.tokenSymbol, chainId: feeData.chainId },
      { ...feeData, updatedAt: new Date() },
      { upsert: true, new: true }
    ).lean();
    return {
      ...fee,
      _id: fee._id.toString(),
      userId: fee.userId.toString(),
    } as UserTransactionFeeType;
  }

  async deleteUserTransactionFee(userId: string, tokenSymbol: string, chainId: string): Promise<boolean> {
    const result = await UserTransactionFee.deleteOne({ userId, tokenSymbol, chainId });
    return result.deletedCount > 0;
  }

  // Swap Order operations (real-time swap order tracking)
  async createSwapOrder(orderData: InsertSwapOrder): Promise<SwapOrderType> {
    const order = await SwapOrder.create(orderData);
    return {
      ...order.toObject(),
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString(),
    } as SwapOrderType;
  }

  async getSwapOrder(orderId: string): Promise<SwapOrderType | undefined> {
    const order = await SwapOrder.findOne({ orderId }).lean();
    if (!order) return undefined;
    return {
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString(),
    } as SwapOrderType;
  }

  async getActiveSwapOrders(userId: string): Promise<SwapOrderType[]> {
    const orders = await SwapOrder.find({
      userId,
      status: { $in: ["pending", "processing"] }
    })
    .sort({ orderTime: -1 })
    .lean();
    
    return orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString(),
    })) as SwapOrderType[];
  }

  async getAllSwapOrders(userId: string): Promise<SwapOrderType[]> {
    const orders = await SwapOrder.find({ userId })
    .sort({ orderTime: -1 })
    .lean();
    
    return orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString(),
    })) as SwapOrderType[];
  }

  async updateSwapOrder(orderId: string, updates: Partial<SwapOrderType>): Promise<SwapOrderType | undefined> {
    const order = await SwapOrder.findOneAndUpdate(
      { orderId },
      { ...updates },
      { new: true }
    ).lean();
    
    if (!order) return undefined;
    return {
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString(),
    } as SwapOrderType;
  }
}

export const storage = new MongoStorage();
