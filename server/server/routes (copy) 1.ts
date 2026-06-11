import type { Express } from "express";
import { createServer, type Server } from "http";
import { ethers } from "ethers";
import multer from "multer";
import { storage } from "./storage";
import { generateAddressForChain, generateTxHashForChain } from "./utils/address-generator";
import { User, VerificationCode, Wallet, Token, Transaction, Notification, AdminTransfer, SwapOrder, Settings, PriceAlert, MarketNews, UserPushSubscription, ContactMessage, SupportChat } from "./models";
import { requireAuth, requireAdmin } from "./middleware/auth";
import { blockchainService } from "./blockchain";
import { wsService, initializeWebSocket } from "./websocket";
import Parser from "rss-parser";
import {
  generateMnemonic,
  validateMnemonic,
  deriveAddress,
  encryptMnemonic,
  decryptMnemonic,
  derivePrivateKey,
} from "./utils/crypto";
import type {
  WalletCreateRequest,
  WalletImportRequest,
  SendTransactionRequest,
  SwapRequest,
  insertUserSchema,
  loginSchema,
} from "@shared/schema";
import { getSimplePrices, getMarketData, getChartData, periodToDays } from "./services/coingecko";
import { ETHEREUM_TOKENS } from "@shared/ethereum-tokens";
import { BNB_TOKENS } from "@shared/bnb-tokens";
import { TRON_TOKENS } from "@shared/tron-tokens";
import { SOLANA_TOKENS } from "@shared/solana-tokens";
import { emailService } from "./services/email";

// Configure multer for profile photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper function to determine a token's native chain from token registries
function getTokenNativeChain(tokenSymbol: string): string | null {
  // Check each token registry to find the token's native chain
  if (ETHEREUM_TOKENS.find(t => t.symbol === tokenSymbol)) {
    return 'ethereum';
  }
  if (BNB_TOKENS.find(t => t.symbol === tokenSymbol)) {
    return 'bnb';
  }
  if (TRON_TOKENS.find(t => t.symbol === tokenSymbol)) {
    return 'tron';
  }
  if (SOLANA_TOKENS.find(t => t.symbol === tokenSymbol)) {
    return 'solana';
  }
  return null;
}

// Generate deterministic random fee for a token based on token symbol and chain ID
// Returns consistent fee between 0.0010 and 0.0016 for each unique token+chain combination
function generateDeterministicFee(tokenSymbol: string, chainId: string): { feeAmount: string; feePercentage: number } {
  // Create a simple hash from tokenSymbol + chainId
  const seed = tokenSymbol + chainId;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert hash to a number between 0 and 1
  const normalized = Math.abs(hash % 10000) / 10000;
  
  // Map to fee range: 0.0010 to 0.0016
  const minFee = 0.0010;
  const maxFee = 0.0016;
  const feeAmount = (minFee + normalized * (maxFee - minFee)).toFixed(4);
  
  // Fee percentage is a small value (0.05% to 0.15%)
  const feePercentage = parseFloat((0.05 + normalized * 0.10).toFixed(2));
  
  return {
    feeAmount,
    feePercentage,
  };
}

// Helper function to get or create a token when receiving crypto
async function getOrCreateToken(walletId: string, tokenSymbol: string, chainId: string) {
  // Try to find existing token
  let token = await storage.getTokenBySymbolAndChain(walletId, tokenSymbol, chainId);
  
  // If token exists, make sure it's visible and update lastInboundAt
  if (token) {
    // Always make token visible when receiving crypto
    if (!token.isVisible) {
      await storage.updateTokenVisibility(token._id!, true);
      token.isVisible = true;
    }
    // Update lastInboundAt timestamp for sorting
    await storage.updateTokenLastInbound(token._id!);
    return token;
  }

  // Token doesn't exist, create it
  // Get appropriate token list based on chain
  let tokenList;
  let nativeSymbol;
  switch (chainId) {
    case 'ethereum':
      tokenList = ETHEREUM_TOKENS;
      nativeSymbol = 'ETH';
      break;
    case 'bnb':
      tokenList = BNB_TOKENS;
      nativeSymbol = 'BNB';
      break;
    case 'tron':
      tokenList = TRON_TOKENS;
      nativeSymbol = 'TRX';
      break;
    case 'solana':
      tokenList = SOLANA_TOKENS;
      nativeSymbol = 'SOL';
      break;
    default:
      throw new Error(`Unsupported chain: ${chainId}`);
  }

  // Find token metadata in the appropriate list
  const tokenMetadata = tokenList.find(t => t.symbol === tokenSymbol);
  if (!tokenMetadata) {
    throw new Error(`Token ${tokenSymbol} not supported on chain ${chainId}`);
  }

  // Determine if this is a native token
  const isNative = tokenSymbol === nativeSymbol;

  // Create the token with balance 0
  token = await storage.createToken({
    walletId,
    chainId,
    contractAddress: tokenMetadata.contractAddress || null,
    symbol: tokenMetadata.symbol,
    name: tokenMetadata.name,
    decimals: tokenMetadata.decimals,
    balance: "0",
    isNative,
    icon: tokenMetadata.icon || null,
    isVisible: true, // Auto-show tokens when receiving crypto
    displayOrder: 999, // Place at end by default
  });

  // Update lastInboundAt timestamp for newly created token
  await storage.updateTokenLastInbound(token._id!);

  return token;
}

export async function registerRoutes(app: Express, sessionParser?: any): Promise<Server> {
  // ==================== AUTHENTICATION ROUTES ====================
  
  // Sign up
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, dateOfBirth } = req.body;

      if (!email || !password || !firstName || !lastName || !dateOfBirth) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create new user
      const user = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        isAdmin: false,
      });

      // Set session
      req.session.userId = user._id;
      req.session.userEmail = user.email;
      req.session.isAdmin = user.isAdmin || false;

      // Auto-create wallet for regular users (not admins)
      let walletInfo = null;
      if (!user.isAdmin) {
        try {
          const mnemonic = generateMnemonic();
          const address = deriveAddress(mnemonic);
          const encryptedMnemonic = encryptMnemonic(mnemonic, password);

          const wallet = await storage.createWallet({
            userId: user._id!.toString(),
            address,
            encryptedMnemonic,
            name: "My Wallet",
          });

          walletInfo = {
            id: wallet._id!.toString(),
            address: wallet.address,
          };
        } catch (walletError) {
          console.error("Failed to create wallet during signup:", walletError);
          // Continue without wallet - user can create one later
        }
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          profilePhoto: user.profilePhoto,
          isAdmin: user.isAdmin,
        },
        wallet: walletInfo,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login (for regular wallet users only - admins must use /api/admin/auth/login)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user
      const userDoc = await User.findOne({ email });
      if (!userDoc) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Reject admin accounts - they should use admin login
      if (userDoc.isAdmin) {
        return res.status(403).json({ 
          error: "Admin accounts must use the admin login portal",
          isAdmin: true 
        });
      }

      // Verify password
      const isValid = await userDoc.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session with user role
      req.session.userId = (userDoc._id as any).toString();
      req.session.userEmail = userDoc.email;
      req.session.isAdmin = false;
      req.session.role = 'user';

      // Get user's wallet
      let walletInfo = null;
      try {
        const wallets = await storage.getWalletsByUser(userDoc._id!.toString());
        if (wallets.length > 0) {
          const wallet = wallets[0];
          walletInfo = {
            id: wallet._id!.toString(),
            address: wallet.address,
          };
        }
      } catch (walletError) {
        console.error("Failed to fetch wallet during login:", walletError);
      }

      res.json({
        user: {
          id: (userDoc._id as any).toString(),
          email: userDoc.email,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          dateOfBirth: userDoc.dateOfBirth,
          profilePhoto: userDoc.profilePhoto,
          isAdmin: false,
        },
        wallet: walletInfo,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // ==================== EMAIL VERIFICATION ROUTES ====================
  
  // Send verification code to email (for signup or login)
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email, purpose } = req.body;

      if (!email || !purpose) {
        return res.status(400).json({ error: "Email and purpose are required" });
      }

      if (!["signup", "login", "reset"].includes(purpose)) {
        return res.status(400).json({ error: "Invalid purpose" });
      }

      // For signup, check if email is already registered
      if (purpose === "signup") {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return res.status(400).json({ error: "Email already registered" });
        }
      }

      // For login and reset, check if email exists
      if (purpose === "login" || purpose === "reset") {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return res.status(404).json({ error: "Email not found" });
        }

        // Reject admin accounts from using email verification
        if (user.isAdmin) {
          return res.status(403).json({ 
            error: "Admin accounts must use password authentication",
            isAdmin: true 
          });
        }
      }

      // Generate 6-digit OTP
      const code = emailService.generateOTP();
      const hashedCode = emailService.hashOTP(code);

      // Delete any existing codes for this email+purpose
      await VerificationCode.deleteMany({ 
        email: email.toLowerCase(), 
        purpose 
      });

      // Store hashed code in dedicated VerificationCode collection (TTL auto-expires after 10 minutes)
      await VerificationCode.create({
        email: email.toLowerCase(),
        code: hashedCode,
        purpose,
      });

      // Send appropriate email based on purpose
      let sent = false;
      if (purpose === "reset") {
        sent = await emailService.sendPasswordResetCode(email, code);
      } else {
        sent = await emailService.sendVerificationCode(email, code);
      }
      
      if (!sent) {
        return res.status(500).json({ error: "Failed to send verification email" });
      }

      res.json({ 
        message: "Verification code sent to your email",
        expiresIn: 600 // seconds
      });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  // Verify code only (without completing signup or reset)
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code, purpose } = req.body;

      if (!email || !code || !purpose) {
        return res.status(400).json({ error: "Email, code, and purpose are required" });
      }

      // Find the verification code in database
      const verificationRecord = await VerificationCode.findOne({ 
        email: email.toLowerCase(), 
        purpose 
      });

      if (!verificationRecord) {
        return res.status(400).json({ error: "No pending verification. Please request a new code." });
      }

      // Verify code using constant-time comparison
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Code is valid
      res.json({ message: "Verification code is valid" });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Verify code and complete signup
  app.post("/api/auth/verify-signup", async (req, res) => {
    try {
      const { email, code, firstName, lastName, dateOfBirth, password, pin } = req.body;

      // Support both password (legacy) and pin (new)
      const authSecret = pin || password;

      if (!email || !code || !firstName || !lastName || !dateOfBirth || !authSecret) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate PIN format if provided
      if (pin && (pin.length !== 6 || !/^\d{6}$/.test(pin))) {
        return res.status(400).json({ error: "PIN must be 6 digits" });
      }

      // Find the verification code in database
      const verificationRecord = await VerificationCode.findOne({ 
        email: email.toLowerCase(), 
        purpose: 'signup' 
      });

      if (!verificationRecord) {
        return res.status(400).json({ error: "No pending verification. Please request a new code." });
      }

      // Verify code using constant-time comparison
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Create user with PIN or password
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: authSecret,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        isAdmin: false,
        isEmailVerified: true,
      });

      // Delete the verification code after successful signup
      await VerificationCode.deleteOne({ _id: verificationRecord._id });

      // Set user session
      req.session.userId = user._id;
      req.session.userEmail = user.email;
      req.session.isAdmin = false;

      // Auto-create wallet
      let walletInfo = null;
      try {
        const mnemonic = generateMnemonic();
        const address = deriveAddress(mnemonic);
        const encryptedMnemonic = encryptMnemonic(mnemonic, authSecret);

        const wallet = await storage.createWallet({
          userId: user._id!.toString(),
          address,
          encryptedMnemonic,
          name: "My Wallet",
        });

        walletInfo = {
          id: wallet._id!.toString(),
          address: wallet.address,
        };

        // Send welcome email
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (walletError) {
        console.error("Failed to create wallet during email signup:", walletError);
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          profilePhoto: user.profilePhoto,
          isAdmin: false,
        },
        wallet: walletInfo,
      });
    } catch (error) {
      console.error("Verify signup error:", error);
      res.status(500).json({ error: "Failed to complete signup" });
    }
  });

  // Verify code and complete login
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or code" });
      }

      // Reject admin accounts
      if (user.isAdmin) {
        return res.status(403).json({ 
          error: "Admin accounts must use password authentication",
          isAdmin: true 
        });
      }

      // Find the verification code in database
      const verificationRecord = await VerificationCode.findOne({ 
        email: email.toLowerCase(), 
        purpose: 'login' 
      });

      if (!verificationRecord) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }

      // Verify code using constant-time comparison
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(401).json({ error: "Invalid verification code" });
      }

      // Delete the verification code after successful login
      await VerificationCode.deleteOne({ _id: verificationRecord._id });

      // Set session
      req.session.userId = (user._id as any).toString();
      req.session.userEmail = user.email;
      req.session.isAdmin = false;
      req.session.role = 'user';

      // Get wallet
      let walletInfo = null;
      try {
        const wallets = await storage.getWalletsByUser((user._id as any).toString());
        if (wallets.length > 0) {
          const wallet = wallets[0];
          walletInfo = {
            id: wallet._id!.toString(),
            address: wallet.address,
          };
        }
      } catch (walletError) {
        console.error("Failed to fetch wallet during email login:", walletError);
      }

      res.json({
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          profilePhoto: user.profilePhoto,
          isAdmin: false,
        },
        wallet: walletInfo,
      });
    } catch (error) {
      console.error("Verify login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Verify code and reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Email, code, and new password are required" });
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find the verification code in database
      const verificationRecord = await VerificationCode.findOne({ 
        email: email.toLowerCase(), 
        purpose: 'reset' 
      });

      if (!verificationRecord) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      // Verify code using constant-time comparison
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid reset code" });
      }

      // Delete the verification code after successful validation
      await VerificationCode.deleteOne({ _id: verificationRecord._id });

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // ==================== PIN-BASED AUTHENTICATION ROUTES ====================
  
  // Login with PIN (replaces password-based login)
  app.post("/api/auth/login-pin", async (req, res) => {
    try {
      const { email, pin } = req.body;

      if (!email || !pin) {
        return res.status(400).json({ error: "Email and PIN are required" });
      }

      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 6 digits" });
      }

      // Find user
      const userDoc = await User.findOne({ email: email.toLowerCase() });
      if (!userDoc) {
        return res.status(401).json({ error: "Invalid email or PIN" });
      }

      // Reject admin accounts - they should use admin login
      if (userDoc.isAdmin) {
        return res.status(403).json({ 
          error: "Admin accounts must use the admin login portal",
          isAdmin: true 
        });
      }

      // Check if user still has old text password (not migrated to PIN)
      // Old passwords will be longer and contain non-numeric characters
      if (userDoc.password && (userDoc.password.length > 10 || !/^\$2[aby]/.test(userDoc.password))) {
        // This is a hashed password but we need to check if it was from a text password
        // We'll try to verify the PIN first
        const isValid = await userDoc.comparePassword(pin);
        
        if (!isValid) {
          // PIN doesn't match - user needs to reset password
          return res.status(401).json({ 
            error: "Please reset your password to use PIN authentication",
            requiresPasswordReset: true 
          });
        }
      } else {
        // Verify PIN
        const isValid = await userDoc.comparePassword(pin);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid email or PIN" });
        }
      }

      // Set session with user role
      req.session.userId = (userDoc._id as any).toString();
      req.session.userEmail = userDoc.email;
      req.session.isAdmin = false;
      req.session.role = 'user';

      // Get user's wallet
      let walletInfo = null;
      try {
        const wallets = await storage.getWalletsByUser(userDoc._id!.toString());
        if (wallets.length > 0) {
          const wallet = wallets[0];
          walletInfo = {
            id: wallet._id!.toString(),
            address: wallet.address,
          };
        }
      } catch (walletError) {
        console.error("Failed to fetch wallet during PIN login:", walletError);
      }

      res.json({
        user: {
          id: (userDoc._id as any).toString(),
          email: userDoc.email,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          dateOfBirth: userDoc.dateOfBirth,
          profilePhoto: userDoc.profilePhoto,
          isAdmin: false,
        },
        wallet: walletInfo,
      });
    } catch (error) {
      console.error("PIN login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Send reset code (for forgot PIN)
  app.post("/api/auth/send-reset-code", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "No account found with this email" });
      }

      // Generate 4-digit code
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const hashedCode = emailService.hashOTP(code);
      
      console.log(`[Reset Code] Generated code: ${code} for email: ${email.toLowerCase()}`);
      console.log(`[Reset Code] Hashed code: ${hashedCode.substring(0, 20)}...`);

      // Delete any existing reset codes for this email first
      const deleteResult = await VerificationCode.deleteMany({ 
        email: email.toLowerCase(), 
        purpose: 'reset' 
      });
      console.log(`[Reset Code] Deleted ${deleteResult.deletedCount} old codes`);

      // Save to database with 10-minute expiration
      const savedCode = await VerificationCode.create({
        email: email.toLowerCase(),
        code: hashedCode,
        purpose: 'reset',
      });
      console.log(`[Reset Code] Saved new code with ID: ${savedCode._id}`);

      // Send email
      const sent = await emailService.sendPasswordResetCode(email, code);
      
      if (!sent) {
        return res.status(500).json({ error: "Failed to send reset code email" });
      }

      res.json({ 
        message: "Reset code sent to your email",
        expiresIn: 600 
      });
    } catch (error) {
      console.error("Send reset code error:", error);
      res.status(500).json({ error: "Failed to send reset code" });
    }
  });

  // Verify reset code (without resetting password)
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find the LATEST verification code in database
      const verificationRecord = await VerificationCode.findOne({ 
        email: email.toLowerCase(), 
        purpose: 'reset' 
      }).sort({ createdAt: -1 });

      console.log(`[Verify Code] Looking for code for email: ${email.toLowerCase()}`);
      console.log(`[Verify Code] User entered code: ${code}`);
      console.log(`[Verify Code] Found record: ${verificationRecord ? 'YES' : 'NO'}`);
      
      if (verificationRecord) {
        console.log(`[Verify Code] Stored hash: ${verificationRecord.code.substring(0, 20)}...`);
        const inputHash = emailService.hashOTP(code);
        console.log(`[Verify Code] Input hash: ${inputHash.substring(0, 20)}...`);
        console.log(`[Verify Code] Hashes match: ${inputHash === verificationRecord.code}`);
      }

      if (!verificationRecord) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      // Verify code using constant-time comparison
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid reset code" });
      }

      // Code is valid
      return res.status(200).json({ success: true, message: "Code verified successfully" });

    } catch (error: any) {
      console.error("Error verifying reset code:", error);
      res.status(500).json({ error: "Failed to verify reset code" });
    }
  });

  // Reset password to PIN
  app.post("/api/auth/reset-password-pin", async (req, res) => {
    try {
      const { email, code, newPin } = req.body;

      if (!email || !code || !newPin) {
        return res.status(400).json({ error: "Email, code, and new PIN are required" });
      }

      if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ error: "PIN must be 6 digits" });
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find the LATEST verification code in database
      const verificationRecord = await VerificationCode.findOne({ 
        email: email.toLowerCase(), 
        purpose: 'reset' 
      }).sort({ createdAt: -1 });

      if (!verificationRecord) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      // Verify code using constant-time comparison
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid reset code" });
      }

      // Delete ALL verification codes for this email after successful validation
      await VerificationCode.deleteMany({ 
        email: email.toLowerCase(), 
        purpose: 'reset' 
      });

      // Update password to PIN
      user.password = newPin;
      await user.save();

      // Also update wallet encryption if needed
      try {
        const wallets = await storage.getWalletsByUser((user._id as any).toString());
        if (wallets.length > 0) {
          // Note: In a real app, you'd need the old password to re-encrypt
          // For now, we'll keep the old encryption intact
          console.log("Wallet re-encryption would happen here in production");
        }
      } catch (walletError) {
        console.error("Wallet check during PIN reset:", walletError);
      }

      res.json({ message: "PIN reset successfully" });
    } catch (error) {
      console.error("Reset PIN error:", error);
      res.status(500).json({ error: "Failed to reset PIN" });
    }
  });

  // Change password while logged in
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length !== 6 || !/^\d{6}$/.test(newPassword)) {
        return res.status(400).json({ error: "New password must be 6 digits" });
      }

      // Get current user from session
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update to new password
      user.password = newPassword;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Update verify-signup to support PIN instead of password
  // Note: The original verify-signup route above should be modified to accept "pin" instead of "password"

  // Contact Us - Submit contact form
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Try to find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      // Save message to database
      const contactMessage = new ContactMessage({
        email: email.toLowerCase(),
        name,
        subject,
        message,
        userId: user?._id || null,
        type: "inbound",
        status: "pending",
      });
      await contactMessage.save();

      // Send notification email to support
      const emailSent = await emailService.sendContactUsNotification(name, email, `Subject: ${subject}\n\n${message}`);

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send message. Please try again later." });
      }

      res.json({ 
        success: true, 
        message: "Your message has been sent successfully. We'll get back to you soon!" 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  // Get current user
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get wallet info for non-admin users
      let wallet = null;
      if (!user.isAdmin) {
        const walletDoc = await Wallet.findOne({ userId: user._id });
        if (walletDoc) {
          wallet = {
            id: (walletDoc._id as any).toString(),
            _id: (walletDoc._id as any).toString(),
            address: walletDoc.address,
          };
        }
      }

      res.json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        profilePhoto: user.profilePhoto,
        isAdmin: user.isAdmin,
        canSendCrypto: user.canSendCrypto ?? false,
        language: user.language || 'en',
        fiatCurrency: user.fiatCurrency || 'USD',
        wallet,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ============ ADMIN AUTHENTICATION ENDPOINTS ============
  
  // Admin Login (separate from wallet user login)
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user
      const userDoc = await User.findOne({ email });
      if (!userDoc) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Only allow admin accounts
      if (!userDoc.isAdmin) {
        return res.status(403).json({ 
          error: "This login is for administrators only. Please use the regular login for wallet access."
        });
      }

      // Verify password
      const isValid = await userDoc.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session with admin role
      req.session.userId = (userDoc._id as any).toString();
      req.session.userEmail = userDoc.email;
      req.session.isAdmin = true;
      req.session.role = 'admin';

      res.json({
        user: {
          id: (userDoc._id as any).toString(),
          email: userDoc.email,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          isAdmin: true,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current admin user
  app.get("/api/admin/auth/me", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.isAdmin) {
        return res.status(403).json({ error: "Not an admin user" });
      }

      res.json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error("Get admin user error:", error);
      res.status(500).json({ error: "Failed to get admin user" });
    }
  });

  // Admin Logout
  app.post("/api/admin/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Update profile photo
  app.post("/api/profile/upload-photo", requireAuth, upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo uploaded" });
      }

      // Convert file to base64 data URI
      const photoDataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      // Update user profile photo
      const user = await storage.updateUserProfilePhoto(req.session.userId!, photoDataUri);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        profilePhoto: user.profilePhoto,
      });
    } catch (error) {
      console.error("Update profile photo error:", error);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  });

  // Get user profile
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const wallets = await storage.getWalletsByUser(req.session.userId!);
      const wallet = wallets && wallets.length > 0 ? wallets[0] : null;

      res.json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        website: user.website,
        twitterUsername: user.twitterUsername,
        redditUsername: user.redditUsername,
        githubUsername: user.githubUsername,
        createdAt: user.createdAt,
        walletCreatedAt: wallet?.createdAt,
      });
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // Update user profile (with optional profile photo upload)
  app.put("/api/user/profile", requireAuth, upload.single("profilePhoto"), async (req, res) => {
    try {
      const { bio, website, twitterUsername, redditUsername, githubUsername } = req.body;
      
      const updateData: any = {
        bio: bio || null,
        website: website || null,
        twitterUsername: twitterUsername || null,
        redditUsername: redditUsername || null,
        githubUsername: githubUsername || null,
      };

      // Handle profile photo upload if provided
      if (req.file) {
        const base64Image = req.file.buffer.toString("base64");
        const mimeType = req.file.mimetype;
        updateData.profilePhoto = `data:${mimeType};base64,${base64Image}`;
      }

      const user = await User.findByIdAndUpdate(
        req.session.userId,
        updateData,
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        website: user.website,
        twitterUsername: user.twitterUsername,
        redditUsername: user.redditUsername,
        githubUsername: user.githubUsername,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  // Get user preferences (language and fiat currency)
  app.get("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId).select("language fiatCurrency");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        language: user.language || 'en',
        fiatCurrency: user.fiatCurrency || 'USD',
      });
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json({ error: "Failed to get user preferences" });
    }
  });

  // Update user language preference
  app.patch("/api/user/language", requireAuth, async (req, res) => {
    try {
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }

      const user = await User.findByIdAndUpdate(
        req.session.userId,
        { language },
        { new: true }
      ).select("language");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        language: user.language,
        message: "Language preference updated successfully",
      });
    } catch (error) {
      console.error("Update user language error:", error);
      res.status(500).json({ error: "Failed to update language preference" });
    }
  });

  // Update user fiat currency preference
  app.patch("/api/user/fiat-currency", requireAuth, async (req, res) => {
    try {
      const { fiatCurrency } = req.body;
      
      if (!fiatCurrency) {
        return res.status(400).json({ error: "Fiat currency is required" });
      }

      const user = await User.findByIdAndUpdate(
        req.session.userId,
        { fiatCurrency },
        { new: true }
      ).select("fiatCurrency");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        fiatCurrency: user.fiatCurrency,
        message: "Fiat currency preference updated successfully",
      });
    } catch (error) {
      console.error("Update user fiat currency error:", error);
      res.status(500).json({ error: "Failed to update fiat currency preference" });
    }
  });

  // ==================== SUPPORT CHAT ROUTES ====================

  // Get unread count only (without resetting)
  app.get("/api/support-chat/unread-count", requireAuth, async (req, res) => {
    try {
      let chat = await SupportChat.findOne({ userId: req.session.userId });

      if (!chat) {
        return res.json({ unreadCount: 0 });
      }

      res.json({ unreadCount: chat.unreadUserCount });
    } catch (error) {
      console.error("Get support chat unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Get or create user's support chat
  app.get("/api/support-chat", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let chat = await SupportChat.findOne({ userId: req.session.userId });

      if (!chat) {
        // Create new chat
        chat = new SupportChat({
          userId: req.session.userId,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          messages: [],
          unreadUserCount: 0,
          unreadAdminCount: 0,
          lastMessageAt: new Date(),
        });
        await chat.save();
      }

      // Reset unread count for user
      const previousUnreadCount = chat.unreadUserCount;
      chat.unreadUserCount = 0;
      await chat.save();

      // Send unread count update via WebSocket if count changed
      if (previousUnreadCount > 0 && wsService) {
        wsService.sendToUser(req.session.userId!, {
          type: 'support_chat_unread_update',
          unreadCount: 0,
        });
      }

      res.json(chat);
    } catch (error) {
      console.error("Get support chat error:", error);
      res.status(500).json({ error: "Failed to get support chat" });
    }
  });

  // Send message in support chat
  app.post("/api/support-chat/messages", requireAuth, upload.single("image"), async (req, res) => {
    try {
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let chat = await SupportChat.findOne({ userId: req.session.userId });

      if (!chat) {
        // Create new chat if it doesn't exist
        chat = new SupportChat({
          userId: req.session.userId,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          messages: [],
          unreadUserCount: 0,
          unreadAdminCount: 0,
          lastMessageAt: new Date(),
        });
      }

      // Handle image upload if present
      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }

      // Add message
      const newMessage = {
        senderId: req.session.userId!,
        senderType: "user" as const,
        senderName: `${user.firstName} ${user.lastName}`,
        content: content.trim(),
        imageUrl,
        timestamp: new Date(),
      };

      chat.messages.push(newMessage as any);
      chat.unreadAdminCount += 1;
      chat.lastMessageAt = new Date();
      await chat.save();

      // Check if this is the first message and send email notification to admin
      const isFirstMessage = chat.messages.length === 1;
      if (isFirstMessage) {
        try {
          const userName = `${user.firstName} ${user.lastName}`.trim() || 'User';
          const userEmail = user.email;
          await emailService.sendSupportChatFirstMessageAlert(
            userName,
            userEmail,
            content
          );
          console.log('First support chat message email sent to admin for user:', userEmail);
        } catch (emailError) {
          console.error('Failed to send first support chat message email notification:', emailError);
          // Don't fail the request if email sending fails
        }
      }

      // Broadcast new message via WebSocket to all admins
      if (wsService) {
        wsService.broadcast({
          type: 'support_chat_message',
          userId: req.session.userId,
          message: newMessage,
          chatId: chat._id,
        }, false); // Don't exclude admins
      }

      res.json(chat);
    } catch (error) {
      console.error("Send support chat message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  
  // Get all users (sorted by newest first)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await User.find({ isAdmin: false })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(100);
      
      // Get wallets for each user
      const usersWithWallets = await Promise.all(
        allUsers.map(async (user) => {
          const wallets = await storage.getWalletsByUser(user._id!.toString());
          return {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            createdAt: user.createdAt,
            canSendCrypto: user.canSendCrypto ?? false,
            wallets: wallets.map(w => ({
              id: w._id,
              address: w.address,
            })),
          };
        })
      );

      res.json({ users: usersWithWallets });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });
  
  // Search users (MUST come before /:userId route)
  app.get("/api/admin/users/search", requireAdmin, async (req, res) => {
    try {
      const { query, q } = req.query;
      const searchQuery = query || q;
      
      if (!searchQuery || typeof searchQuery !== "string") {
        return res.status(400).json({ error: "Search query required" });
      }

      const users = await storage.searchUsers(searchQuery);
      
      // Get wallets for each user
      const usersWithWallets = await Promise.all(
        users.map(async (user) => {
          const wallets = await storage.getWalletsByUser(user._id!);
          return {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            canSendCrypto: user.canSendCrypto ?? false,
            wallets: wallets.map(w => ({
              id: w._id,
              address: w.address,
            })),
          };
        })
      );

      res.json({ users: usersWithWallets });
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });
  
  // Get user by ID (MUST come after /search route)
  app.get("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const wallets = await storage.getWalletsByUser(userId);
      
      res.json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        canSendCrypto: user.canSendCrypto || false,
        wallets: wallets.map(w => ({
          id: w._id,
          address: w.address,
        })),
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Add crypto to user account
  app.post("/api/admin/add-crypto", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId, senderWalletAddress } = req.body;

      if (!userId || !tokenSymbol || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Resolve user ID - handle both email and user ID
      let resolvedUserId = userId;
      if (userId.includes('@')) {
        // It's an email, look up user
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }

      // Get user wallets
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }

      const wallet = wallets[0]; // Use first wallet
      
      // Get or create the token (auto-creates if doesn't exist)
      const token = await getOrCreateToken(wallet._id!, tokenSymbol, chainId);

      // Update token balance
      const currentBalance = parseFloat(token.balance);
      const newBalance = (currentBalance + parseFloat(amount)).toString();
      await storage.updateTokenBalance(token._id!, newBalance);

      // Fetch current token price to calculate fiatValue
      let fiatValue = "0";
      try {
        // Look up coingeckoId from token catalogs
        const allTokens = [...ETHEREUM_TOKENS, ...BNB_TOKENS, ...TRON_TOKENS, ...SOLANA_TOKENS];
        const tokenMetadata = allTokens.find(t => t.symbol === tokenSymbol);
        const coingeckoId = tokenMetadata?.coingeckoId || tokenSymbol.toLowerCase();
        
        const prices = await getSimplePrices([coingeckoId]);
        const tokenPrice = prices[coingeckoId]?.usd || 0;
        fiatValue = (parseFloat(amount) * tokenPrice).toFixed(2);
      } catch (error) {
        console.error("Failed to fetch price for fiatValue calculation:", error);
      }

      // Create a "receive" transaction entry
      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const transaction = await storage.createTransaction({
        walletId: wallet._id!,
        chainId,
        hash: txHash,
        from: senderWalletAddress || "0x0000000000000000000000000000000000000000",
        to: wallet.address,
        value: amount,
        tokenSymbol,
        status: "confirmed",
        type: "receive",
        gasUsed: "0",
        senderWalletAddress: senderWalletAddress || null,
        fiatValue,
      });

      // Create notification for received crypto
      const notification = await Notification.create({
        walletId: wallet._id!,
        category: "Transaction",
        type: "received",
        title: `Received ${amount} ${tokenSymbol}`,
        description: `You have received ${amount} ${tokenSymbol} at ${new Date().toISOString().slice(0, 19).replace('T', ' ')} (UTC).`,
        timestamp: new Date(),
        transactionId: transaction._id,
        isRead: false,
        metadata: {
          amount,
          tokenSymbol,
          chainId,
          fiatValue,
          walletAddress: senderWalletAddress ? `[${senderWalletAddress.slice(0, 9)}-${senderWalletAddress.slice(-3).toUpperCase()}]` : "",
        },
      });

      // Send real-time WebSocket notification
      wsService.sendToUser(wallet.userId, {
        type: 'notification_created',
        notificationId: notification._id,
        walletId: wallet._id,
        userId: wallet.userId,
      });

      // Send real-time WebSocket transaction update
      wsService.sendToUser(wallet.userId, {
        type: 'transaction_created',
        transactionId: transaction._id,
        walletId: wallet._id,
        userId: wallet.userId,
      });

      res.json({
        message: "Crypto added successfully",
        newBalance,
        transactionHash: txHash,
        notification: notification._id,
      });
    } catch (error) {
      console.error("Add crypto error:", error);
      res.status(500).json({ error: "Failed to add crypto" });
    }
  });

  // Remove crypto from user account (without transaction trace)
  app.post("/api/admin/remove-crypto", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId } = req.body;

      if (!userId || !tokenSymbol || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Resolve user ID - handle both email and user ID
      let resolvedUserId = userId;
      if (userId.includes('@')) {
        // It's an email, look up user
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }

      // Get user wallets
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }

      const wallet = wallets[0]; // Use first wallet
      
      // Find the token by symbol AND chainId to ensure we update the correct token
      const token = await storage.getTokenBySymbolAndChain(wallet._id!, tokenSymbol, chainId);
      if (!token) {
        return res.status(404).json({ error: `Token ${tokenSymbol} not found on chain ${chainId} in user wallet` });
      }

      // Update token balance
      const currentBalance = parseFloat(token.balance);
      const removeAmount = parseFloat(amount);
      
      if (removeAmount > currentBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const newBalance = (currentBalance - removeAmount).toString();
      await storage.updateTokenBalance(token._id!, newBalance);

      // No transaction record is created (silent removal)

      res.json({
        message: "Crypto removed successfully (no trace)",
        newBalance,
      });
    } catch (error) {
      console.error("Remove crypto error:", error);
      res.status(500).json({ error: "Failed to remove crypto" });
    }
  });

  // Admin send crypto from user account (WITH transaction history)
  app.post("/api/admin/send-crypto", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId, recipientAddress, feeAmount, note } = req.body;

      if (!userId || !tokenSymbol || !amount || !chainId || !recipientAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Resolve user ID - handle both email and user ID
      let resolvedUserId = userId;
      if (userId.includes('@')) {
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }

      // Get user wallets
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }

      const wallet = wallets[0];
      
      // Get or create the token (auto-creates if doesn't exist)
      const token = await getOrCreateToken(wallet._id!, tokenSymbol, chainId);

      // Check balance (including fee if specified)
      const currentBalance = parseFloat(token.balance);
      const sendAmount = parseFloat(amount);
      const fee = feeAmount ? parseFloat(feeAmount) : 0;
      const totalAmount = sendAmount + fee;
      
      if (totalAmount > currentBalance) {
        return res.status(400).json({ error: "Insufficient balance (including fee)" });
      }
      
      // Deduct balance
      const newBalance = (currentBalance - totalAmount).toString();
      await storage.updateTokenBalance(token._id!, newBalance);

      // Fetch current token price for fiatValue
      let fiatValue = "0";
      try {
        const allTokens = [...ETHEREUM_TOKENS, ...BNB_TOKENS, ...TRON_TOKENS, ...SOLANA_TOKENS];
        const tokenMetadata = allTokens.find(t => t.symbol === tokenSymbol);
        const coingeckoId = tokenMetadata?.coingeckoId || tokenSymbol.toLowerCase();
        
        const prices = await getSimplePrices([coingeckoId]);
        const tokenPrice = prices[coingeckoId]?.usd || 0;
        fiatValue = (sendAmount * tokenPrice).toFixed(2);
      } catch (error) {
        console.error("Failed to fetch price for fiatValue:", error);
      }

      // Create "send" transaction with admin metadata
      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const transaction = await Transaction.create({
        walletId: wallet._id!,
        chainId,
        hash: txHash,
        from: wallet.address,
        to: recipientAddress,
        value: amount,
        tokenSymbol,
        status: "confirmed",
        type: "send",
        gasUsed: feeAmount || "0",
        senderWalletAddress: wallet.address,
        fiatValue,
        adminInitiated: true,
        adminId: req.session.userId,
        adminNote: note || null,
      });

      // Create admin transfer audit record
      await AdminTransfer.create({
        adminId: req.session.userId,
        userId: resolvedUserId,
        walletId: wallet._id!,
        action: "send",
        chainId,
        tokenSymbol,
        amount,
        amountUSD: fiatValue,
        recipientAddress,
        feeAmount: feeAmount || null,
        transactionId: transaction._id,
        note: note || null,
      });

      // Create notification
      const notification = await Notification.create({
        walletId: wallet._id!,
        category: "Transaction",
        type: "sent",
        title: `Sent ${amount} ${tokenSymbol}`,
        description: `You sent ${amount} ${tokenSymbol} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        timestamp: new Date(),
        transactionId: transaction._id,
        isRead: false,
        metadata: {
          amount,
          tokenSymbol,
          chainId,
          fiatValue,
          recipientAddress,
        },
      });

      // Send real-time WebSocket notification
      wsService.sendToUser(wallet.userId, {
        type: 'notification_created',
        notificationId: notification._id,
        walletId: wallet._id,
        userId: wallet.userId,
      });

      // Send real-time WebSocket transaction update
      wsService.sendToUser(wallet.userId, {
        type: 'transaction_created',
        transactionId: transaction._id,
        walletId: wallet._id,
        userId: wallet.userId,
      });

      res.json({
        message: "Crypto sent successfully",
        newBalance,
        transactionHash: txHash,
        transactionId: transaction._id,
      });
    } catch (error) {
      console.error("Admin send crypto error:", error);
      res.status(500).json({ error: "Failed to send crypto" });
    }
  });

  // Admin add crypto silently (no transaction history)
  app.post("/api/admin/add-crypto-silent", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId, note } = req.body;

      if (!userId || !tokenSymbol || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Resolve user ID
      let resolvedUserId = userId;
      if (userId.includes('@')) {
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }

      // Get user wallets
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }

      const wallet = wallets[0];
      
      // Get or create the token (auto-creates if doesn't exist)
      const token = await getOrCreateToken(wallet._id!, tokenSymbol, chainId);

      // Update balance (add)
      const currentBalance = parseFloat(token.balance);
      const newBalance = (currentBalance + parseFloat(amount)).toString();
      await storage.updateTokenBalance(token._id!, newBalance);

      // Create admin transfer audit record (but NO transaction)
      await AdminTransfer.create({
        adminId: req.session.userId,
        userId: resolvedUserId,
        walletId: wallet._id!,
        action: "add",
        chainId,
        tokenSymbol,
        amount,
        note: note || null,
      });

      res.json({
        message: "Crypto added silently (no transaction trace)",
        newBalance,
      });
    } catch (error) {
      console.error("Admin add crypto silent error:", error);
      res.status(500).json({ error: "Failed to add crypto silently" });
    }
  });

  // Debug endpoint to check all users' permission states
  app.get("/api/admin/debug/permissions", requireAdmin, async (req, res) => {
    try {
      const users = await User.find({}, 'email canSendCrypto').lean();
      const summary = {
        total: users.length,
        withPermission: users.filter(u => u.canSendCrypto === true).length,
        withoutPermission: users.filter(u => u.canSendCrypto === false).length,
        undefined: users.filter(u => u.canSendCrypto === undefined).length,
        users: users.map(u => ({
          email: u.email,
          canSendCrypto: u.canSendCrypto,
          type: typeof u.canSendCrypto,
          wouldBlock: !u.canSendCrypto
        }))
      };
      res.json(summary);
    } catch (error) {
      console.error("Debug permissions error:", error);
      res.status(500).json({ error: "Failed to get permissions debug info" });
    }
  });

  // Toggle user send permission
  app.patch("/api/admin/users/:userId/send-permission", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { canSendCrypto } = req.body;

      console.log('[TOGGLE PERMISSION]', {
        userId,
        newValue: canSendCrypto,
        typeOfValue: typeof canSendCrypto
      });

      if (typeof canSendCrypto !== 'boolean') {
        return res.status(400).json({ error: "canSendCrypto must be a boolean" });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { canSendCrypto },
        { new: true, select: "-password" }
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log('[TOGGLE PERMISSION SUCCESS]', {
        userId: user._id,
        email: user.email,
        canSendCrypto: user.canSendCrypto,
        wasUpdated: user.canSendCrypto === canSendCrypto
      });

      res.json({
        message: `User send permission ${canSendCrypto ? 'enabled' : 'disabled'}`,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          canSendCrypto: user.canSendCrypto,
        },
      });
    } catch (error) {
      console.error("Toggle send permission error:", error);
      res.status(500).json({ error: "Failed to toggle send permission" });
    }
  });

  // Delete user account
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.isAdmin) {
        return res.status(403).json({ error: "Cannot delete admin accounts" });
      }

      const wallet = await Wallet.findOne({ userId: user._id });
      const walletId = wallet?._id;

      // Delete all related data
      const deleteOperations = [
        User.findByIdAndDelete(userId),
        Wallet.deleteMany({ userId }),
        Token.deleteMany({ walletId }),
        Transaction.deleteMany({ walletId }),
        Notification.deleteMany({ walletId }),
        AdminTransfer.deleteMany({ userId }),
        SwapOrder.deleteMany({ userId }),
        PriceAlert.deleteMany({ userId }),
        UserPushSubscription.deleteMany({ userId }),
        VerificationCode.deleteMany({ email: user.email }),
      ];

      await Promise.all(deleteOperations);

      res.json({
        message: "User account and all related data deleted successfully",
        deletedUser: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user account" });
    }
  });

  // Clear all swap history
  app.post("/api/admin/clear-swap-history", requireAdmin, async (req, res) => {
    try {
      const result = await Transaction.deleteMany({ type: "swap" });
      
      res.json({
        message: "Swap history cleared successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Clear swap history error:", error);
      res.status(500).json({ error: "Failed to clear swap history" });
    }
  });

  // ==================== ADMIN MESSAGING ROUTES ====================
  
  // Get all contact messages with pagination and filtering
  app.get("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50, status, type, search } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const query: any = {};
      if (status) query.status = status;
      if (type) query.type = type;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
        ];
      }

      const [messages, total] = await Promise.all([
        ContactMessage.find(query)
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string)),
        ContactMessage.countDocuments(query),
      ]);

      res.json({
        messages,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Reply to a contact message
  app.post("/api/admin/messages/:id/reply", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { replyMessage } = req.body;
      const adminId = req.session.userId;

      if (!replyMessage || replyMessage.trim() === '') {
        return res.status(400).json({ error: "Reply message is required" });
      }

      const message = await ContactMessage.findById(id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Get admin details
      const admin = await User.findById(adminId);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Send email first - fail fast if email fails
      const emailSent = await emailService.sendSupportReply(
        message.email,
        message.name,
        message.message,
        replyMessage
      );

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email reply" });
      }

      // Update message with reply
      message.replyHistory.push({
        actor: `${admin.firstName} ${admin.lastName}`,
        actorId: admin._id,
        channel: "email",
        body: replyMessage,
        sentAt: new Date(),
      });
      message.status = "replied";
      message.repliedAt = new Date();
      await message.save();

      console.log(`[Admin Reply] ${admin.email} replied to message ${id} from ${message.email}`);

      res.json(message);
    } catch (error) {
      console.error("Reply to message error:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  // Send direct message to a user
  app.post("/api/admin/messages/send", requireAdmin, async (req, res) => {
    try {
      const { userId, email, subject, message } = req.body;
      const adminId = req.session.userId;

      if (!message || message.trim() === '') {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!subject || subject.trim() === '') {
        return res.status(400).json({ error: "Subject is required" });
      }

      if (!userId && !email) {
        return res.status(400).json({ error: "User ID or email is required" });
      }

      // Get admin details
      const admin = await User.findById(adminId);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Find user
      let user;
      if (userId) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: email.toLowerCase() });
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Send email first
      const emailSent = await emailService.sendSupportMessage(
        user.email,
        `${user.firstName} ${user.lastName}`,
        message,
        subject
      );

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email" });
      }

      // Create outbound message record
      const contactMessage = new ContactMessage({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        subject,
        message,
        userId: user._id,
        type: "outbound",
        status: "closed",
        replyHistory: [{
          actor: `${admin.firstName} ${admin.lastName}`,
          actorId: admin._id,
          channel: "email",
          body: message,
          sentAt: new Date(),
        }],
      });
      await contactMessage.save();

      console.log(`[Admin Direct Message] ${admin.email} sent message to ${user.email}: ${subject}`);

      res.json({
        message: "Message sent successfully",
        contactMessage,
      });
    } catch (error) {
      console.error("Send direct message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Update message status
  app.patch("/api/admin/messages/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'replied', 'closed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const message = await ContactMessage.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('userId', 'firstName lastName email');

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      res.json(message);
    } catch (error) {
      console.error("Update message status error:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ==================== ADMIN SUPPORT CHAT ROUTES ====================

  // Get all support chats
  app.get("/api/admin/support-chat", requireAdmin, async (req, res) => {
    try {
      const { search, status } = req.query;
      
      let query: any = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      let chats = await SupportChat.find(query).sort({ lastMessageAt: -1 }).limit(100);
      
      // Filter by search if provided
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        chats = chats.filter(chat => 
          chat.userName.toLowerCase().includes(searchLower) ||
          chat.userEmail.toLowerCase().includes(searchLower)
        );
      }

      res.json({ chats });
    } catch (error) {
      console.error("Get admin support chats error:", error);
      res.status(500).json({ error: "Failed to get support chats" });
    }
  });

  // Get specific support chat
  app.get("/api/admin/support-chat/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      let chat = await SupportChat.findOne({ userId });
      
      if (!chat) {
        // Get user info to create chat if it doesn't exist
        const user = await User.findById(userId).select("-password");
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        chat = new SupportChat({
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          messages: [],
          unreadUserCount: 0,
          unreadAdminCount: 0,
          lastMessageAt: new Date(),
        });
        await chat.save();
      }

      // Reset unread count for admin
      chat.unreadAdminCount = 0;
      await chat.save();

      res.json(chat);
    } catch (error) {
      console.error("Get admin support chat error:", error);
      res.status(500).json({ error: "Failed to get support chat" });
    }
  });

  // Send message in support chat (admin)
  app.post("/api/admin/support-chat/:userId/messages", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { content } = req.body;

      // Handle image upload if present
      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }

      // Validate that message has either content or image
      const textContent = (content ?? "").trim();
      if (!textContent && !imageUrl) {
        return res.status(400).json({ error: "Message content or image is required" });
      }

      const admin = await User.findById(req.session.userId).select("-password");
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      let chat = await SupportChat.findOne({ userId });

      if (!chat) {
        // Get user info to create chat
        const user = await User.findById(userId).select("-password");
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        chat = new SupportChat({
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          messages: [],
          unreadUserCount: 0,
          unreadAdminCount: 0,
          lastMessageAt: new Date(),
        });
      }

      // Add message
      const newMessage = {
        senderId: req.session.userId!,
        senderType: "admin" as const,
        senderName: `${admin.firstName} ${admin.lastName}`,
        content: textContent,
        imageUrl,
        timestamp: new Date(),
      };

      chat.messages.push(newMessage as any);
      chat.unreadUserCount += 1;
      chat.lastMessageAt = new Date();
      await chat.save();

      // Send message to specific user via WebSocket
      if (wsService) {
        wsService.sendToUser(userId, {
          type: 'support_chat_message',
          message: newMessage,
          chatId: chat._id,
        });

        // Send unread count update for real-time chat bubble
        wsService.sendToUser(userId, {
          type: 'support_chat_unread_update',
          unreadCount: chat.unreadUserCount,
        });
      }

      // Create a notification for the user to tap and navigate to support chat
      try {
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          // Determine notification description (handle undefined content for image-only messages)
          const textContent = (content ?? "").trim();
          let notificationDescription = "New message from support";
          if (textContent) {
            notificationDescription = textContent.length > 50 
              ? textContent.substring(0, 50) + "..." 
              : textContent;
          } else if (imageUrl) {
            notificationDescription = "Support sent you an image";
          }

          await Notification.create({
            walletId: wallet._id,
            category: "System",
            type: "system",
            title: "New Support Message",
            description: notificationDescription,
            timestamp: new Date(),
            isRead: false,
            metadata: {
              supportChat: true,
            },
          });

          // Broadcast notification created event for real-time updates
          if (wsService) {
            wsService.sendToUser(userId, {
              type: 'notification_created',
              userId,
            });
          }
        }
      } catch (notificationError) {
        console.error("Failed to create support chat notification:", notificationError);
        // Don't fail the request if notification creation fails
      }

      res.json(chat);
    } catch (error) {
      console.error("Send admin support chat message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Edit admin support chat message
  app.patch("/api/admin/support-chat/:userId/messages/:messageIndex", requireAdmin, async (req, res) => {
    try {
      const { userId, messageIndex } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const chat = await SupportChat.findOne({ userId });
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const index = parseInt(messageIndex);
      if (isNaN(index) || index < 0 || index >= chat.messages.length) {
        return res.status(400).json({ error: "Invalid message index" });
      }

      const message = chat.messages[index];
      if (message.senderType !== "admin") {
        return res.status(403).json({ error: "Can only edit admin messages" });
      }

      // Update message content
      message.content = content.trim();
      await chat.save();

      // Send update to user via WebSocket
      if (wsService) {
        wsService.sendToUser(userId, {
          type: 'support_chat_message_edited',
          messageIndex: index,
          newContent: content.trim(),
          chatId: chat._id,
        });
      }

      res.json(chat);
    } catch (error) {
      console.error("Edit admin support chat message error:", error);
      res.status(500).json({ error: "Failed to edit message" });
    }
  });

  // DEPRECATED: Global transaction fee endpoints removed
  // Fees are now deterministic random defaults per token+chain
  // Admin can only set per-user fee overrides via /api/admin/user-fees endpoints
  
  // Return empty array for backwards compatibility
  app.get("/api/admin/fees", requireAdmin, async (req, res) => {
    res.json([]);
  });
  
  // Return empty array for backwards compatibility
  app.get("/api/admin/transaction-fees", requireAdmin, async (req, res) => {
    res.json([]);
  });

  // Global fee updates no longer supported - return error
  app.post("/api/admin/fees", requireAdmin, async (req, res) => {
    res.status(400).json({ 
      error: "Global fees have been removed. Use per-user fee overrides instead at /api/admin/user-fees" 
    });
  });
  
  // Global fee updates no longer supported - return error
  app.put("/api/admin/transaction-fees/:tokenSymbol", requireAdmin, async (req, res) => {
    res.status(400).json({ 
      error: "Global fees have been removed. Use per-user fee overrides instead at /api/admin/user-fees" 
    });
  });

  // Get transaction fee for a specific token (used by users when sending/swapping)
  // Get transaction fee - checks user-specific fees first, then returns deterministic random default
  app.get("/api/fees/:tokenSymbol", requireAuth, async (req, res) => {
    try {
      const { tokenSymbol } = req.params;
      const { chainId } = req.query;
      const userId = req.session.userId;

      if (!chainId) {
        return res.status(400).json({ error: "chainId is required" });
      }

      console.log(`[FEE REQUEST] userId=${userId}, tokenSymbol=${tokenSymbol}, chainId=${chainId}`);

      // Check if user has a custom fee set by admin for this specific token
      if (userId) {
        const userFee = await storage.getUserTransactionFee(userId.toString(), tokenSymbol, chainId as string);
        console.log(`[USER FEE CHECK] Found user fee for ${tokenSymbol}:`, userFee);
        if (userFee) {
          console.log(`[USER FEE RETURN] Returning admin-set fee for ${tokenSymbol}: ${userFee.feeAmount}`);
          return res.json({
            tokenSymbol,
            chainId,
            feeAmount: userFee.feeAmount,
            feePercentage: userFee.feePercentage,
            isUserSpecific: true,
            source: 'admin-override',
          });
        }
      }

      // No user-specific fee found, return deterministic random default for this token
      const defaultFee = generateDeterministicFee(tokenSymbol, chainId as string);
      console.log(`[DEFAULT FEE] Returning deterministic random fee for ${tokenSymbol}: ${defaultFee.feeAmount}`);
      
      return res.json({
        tokenSymbol,
        chainId,
        feeAmount: defaultFee.feeAmount,
        feePercentage: defaultFee.feePercentage,
        isUserSpecific: false,
        source: 'deterministic-default',
      });
    } catch (error) {
      console.error("Get fee error:", error);
      res.status(500).json({ error: "Failed to get fee" });
    }
  });
  
  // Get all available tokens across all chains (for admin dropdown)
  app.get("/api/admin/tokens", requireAdmin, async (req, res) => {
    try {
      const allTokens = [
        ...ETHEREUM_TOKENS.map(t => ({ ...t, chainId: "ethereum", chainName: "Ethereum" })),
        ...BNB_TOKENS.map(t => ({ ...t, chainId: "bnb", chainName: "BNB Smart Chain" })),
        ...TRON_TOKENS.map(t => ({ ...t, chainId: "tron", chainName: "Tron" })),
        ...SOLANA_TOKENS.map(t => ({ ...t, chainId: "solana", chainName: "Solana" })),
      ];
      
      res.json({ tokens: allTokens });
    } catch (error) {
      console.error("Get tokens error:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Get all available token types (public, for buy/sell page)
  app.get("/api/available-tokens", async (req, res) => {
    try {
      const allTokens = [
        ...ETHEREUM_TOKENS.map(t => ({ ...t, chainId: "ethereum", chainName: "Ethereum" })),
        ...BNB_TOKENS.map(t => ({ ...t, chainId: "bnb", chainName: "BNB Smart Chain" })),
        ...TRON_TOKENS.map(t => ({ ...t, chainId: "tron", chainName: "Tron" })),
        ...SOLANA_TOKENS.map(t => ({ ...t, chainId: "solana", chainName: "Solana" })),
      ];
      
      res.json(allTokens);
    } catch (error) {
      console.error("Get available tokens error:", error);
      res.status(500).json({ error: "Failed to get available tokens" });
    }
  });

  // =========== USER-SPECIFIC TRANSACTION FEE ROUTES ===========

  // Get all custom fees for a specific user
  app.get("/api/admin/user-fees/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const fees = await storage.getUserTransactionFees(userId);
      res.json(fees);
    } catch (error) {
      console.error("Get user fees error:", error);
      res.status(500).json({ error: "Failed to get user fees" });
    }
  });

  // Upsert (create or update) a custom fee for a user
  app.post("/api/admin/user-fees", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, chainId, feeAmount, feePercentage } = req.body;

      if (!userId || !tokenSymbol || !chainId || !feeAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const fee = await storage.upsertUserTransactionFee({
        userId,
        tokenSymbol,
        chainId,
        feeAmount,
        feePercentage: feePercentage || 0,
        updatedBy: req.session.userId,
      });

      res.json(fee);
    } catch (error) {
      console.error("Upsert user fee error:", error);
      res.status(500).json({ error: "Failed to upsert user fee" });
    }
  });

  // Delete a custom fee for a user
  app.delete("/api/admin/user-fees", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, chainId } = req.body;

      if (!userId || !tokenSymbol || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const deleted = await storage.deleteUserTransactionFee(userId, tokenSymbol, chainId);
      
      if (!deleted) {
        return res.status(404).json({ error: "User fee not found" });
      }

      res.json({ message: "User fee deleted successfully" });
    } catch (error) {
      console.error("Delete user fee error:", error);
      res.status(500).json({ error: "Failed to delete user fee" });
    }
  });

  // ==================== EXISTING ROUTES ====================

  // Price data endpoints
  app.get("/api/prices", async (req, res) => {
    try {
      // Get all CoinGecko IDs from all chain token catalogs
      const allTokens = [
        ...ETHEREUM_TOKENS,
        ...BNB_TOKENS,
        ...TRON_TOKENS,
        ...SOLANA_TOKENS,
      ];
      
      // Get unique CoinGecko IDs
      const coinIds = Array.from(new Set(
        allTokens
          .filter(token => token.coingeckoId)
          .map(token => token.coingeckoId as string)
      ));
      
      const prices = await getSimplePrices(coinIds);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.get("/api/prices/:coinId", async (req, res) => {
    try {
      const { coinId } = req.params;
      const prices = await getSimplePrices([coinId]);
      res.json(prices[coinId] || null);
    } catch (error) {
      console.error("Error fetching price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  app.get("/api/market/:coinId", async (req, res) => {
    try {
      const { coinId } = req.params;
      const marketData = await getMarketData([coinId]);
      res.json(marketData[0] || null);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  app.get("/api/chart/:coinId", async (req, res) => {
    try {
      const { coinId } = req.params;
      const { period = "7" } = req.query;
      const days = periodToDays(period as string);
      const chartData = await getChartData(coinId, days);
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  // Wallet creation
  app.post("/api/wallet/create", async (req, res) => {
    try {
      const { password } = req.body as WalletCreateRequest;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      // Generate mnemonic
      const mnemonic = generateMnemonic();
      
      // Derive address
      const address = deriveAddress(mnemonic);
      
      // Encrypt mnemonic
      const encryptedMnemonic = encryptMnemonic(mnemonic, password);
      
      // Get user ID from session (or use demo user for now)
      const userId = req.session?.userId || "demo-user-id";
      
      // Create wallet
      const wallet = await storage.createWallet({
        userId,
        address,
        encryptedMnemonic,
        name: "My Wallet",
      });

      res.json({
        wallet: {
          id: wallet._id,
          address: wallet.address,
          name: wallet.name,
        },
        mnemonic, // Return for display (in production, this should be handled differently)
      });
    } catch (error) {
      console.error("Wallet creation error:", error);
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  // Wallet import
  app.post("/api/wallet/import", async (req, res) => {
    try {
      const { mnemonic, password } = req.body as WalletImportRequest;
      
      if (!mnemonic || !password) {
        return res.status(400).json({ error: "Mnemonic and password are required" });
      }

      // Validate mnemonic
      if (!validateMnemonic(mnemonic)) {
        return res.status(400).json({ error: "Invalid mnemonic phrase" });
      }

      // Derive address
      const address = deriveAddress(mnemonic);
      
      // Check if wallet already exists
      const existingWallet = await storage.getWalletByAddress(address);
      if (existingWallet) {
        return res.status(400).json({ error: "Wallet already exists" });
      }

      // Encrypt mnemonic
      const encryptedMnemonic = encryptMnemonic(mnemonic, password);
      
      // Get user ID from session (or use demo user for now)
      const userId = req.session?.userId || "demo-user-id";
      
      // Create wallet
      const wallet = await storage.createWallet({
        userId,
        address,
        encryptedMnemonic,
        name: "Imported Wallet",
      });

      res.json({
        wallet: {
          id: wallet._id,
          address: wallet.address,
          name: wallet.name,
        },
      });
    } catch (error) {
      console.error("Wallet import error:", error);
      res.status(500).json({ error: "Failed to import wallet" });
    }
  });

  // Get wallet info
  app.get("/api/wallet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const wallet = await storage.getWallet(id);
      
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      res.json({
        id: wallet._id,
        address: wallet.address,
        name: wallet.name,
        createdAt: wallet.createdAt,
      });
    } catch (error) {
      console.error("Get wallet error:", error);
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });

  // Get all chains
  app.get("/api/chains", async (req, res) => {
    try {
      const chains = await storage.getAllChains();
      res.json(chains);
    } catch (error) {
      console.error("Get chains error:", error);
      res.status(500).json({ error: "Failed to get chains" });
    }
  });

  // Get wallet tokens
  app.get("/api/wallet/:walletId/tokens", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { chainId } = req.query;

      let tokens;
      if (chainId) {
        tokens = await storage.getTokensByChain(walletId, chainId as string);
      } else {
        tokens = await storage.getTokensByWallet(walletId);
      }

      res.json(tokens);
    } catch (error) {
      console.error("Get tokens error:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Validate token contract and get metadata
  app.post("/api/tokens/validate", async (req, res) => {
    try {
      const { chainId, contractAddress } = req.body;

      if (!chainId || !contractAddress) {
        return res.status(400).json({ error: "Chain ID and contract address required" });
      }

      // Validate contract address format
      if (!ethers.isAddress(contractAddress)) {
        return res.status(400).json({ error: "Invalid contract address format" });
      }

      // NOTE: Blockchain metadata fetching disabled to prevent RPC rate limiting
      // For MVP, returning basic validation only
      res.json({
        valid: true,
        contractAddress,
        symbol: "TOKEN",
        name: "Custom Token",
        decimals: 18,
      });
    } catch (error) {
      console.error("Validate token error:", error);
      res.status(400).json({ 
        valid: false,
        error: "Invalid token contract or chain" 
      });
    }
  });

  // Add custom token to wallet
  app.post("/api/wallet/:walletId/tokens", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { chainId, contractAddress, symbol, name, decimals } = req.body;

      if (!chainId || !contractAddress || !symbol || !name || decimals === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if wallet exists
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Check if token already exists for this wallet
      const existingTokens = await storage.getTokensByChain(walletId, chainId);
      const duplicate = existingTokens.find(
        (t) => t.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
      );

      if (duplicate) {
        return res.status(400).json({ error: "Token already added to wallet" });
      }

      // NOTE: Blockchain balance fetching disabled to prevent RPC rate limiting
      // Using stored database balance instead
      const balance = "0";

      // Create token entry
      const token = await storage.createToken({
        walletId,
        chainId,
        contractAddress,
        symbol,
        name,
        decimals,
        balance,
        isNative: false,
        icon: null,
        isVisible: true,
      });

      res.json(token);
    } catch (error) {
      console.error("Add custom token error:", error);
      res.status(500).json({ error: "Failed to add custom token" });
    }
  });

  // Update token visibility
  app.patch("/api/wallet/:walletId/tokens/:tokenId/visibility", async (req, res) => {
    try {
      const { tokenId } = req.params;
      const { isVisible } = req.body;

      if (typeof isVisible !== "boolean") {
        return res.status(400).json({ error: "isVisible must be a boolean" });
      }

      const token = await storage.updateTokenVisibility(tokenId, isVisible);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }

      res.json(token);
    } catch (error) {
      console.error("Update token visibility error:", error);
      res.status(500).json({ error: "Failed to update token visibility" });
    }
  });

  // Get wallet transactions
  app.get("/api/wallet/:walletId/transactions", async (req, res) => {
    try {
      const { walletId } = req.params;
      const transactions = await storage.getTransactionsByWallet(walletId);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Get transaction status (for polling)
  app.get("/api/transaction/:transactionId/status", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // NOTE: Blockchain transaction polling disabled for MVP demo
      // Transactions are auto-confirmed after 3 seconds (see send/swap endpoints)

      res.json({
        id: transaction._id,
        hash: transaction.hash,
        status: transaction.status,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        tokenSymbol: transaction.tokenSymbol,
        timestamp: transaction.timestamp,
      });
    } catch (error) {
      console.error("Get transaction status error:", error);
      res.status(500).json({ error: "Failed to get transaction status" });
    }
  });

  // Send transaction
  app.post("/api/wallet/:walletId/send", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { to, amount, tokenSymbol, chainId, password } = req.body as SendTransactionRequest & { password?: string };

      if (!to || !amount || !tokenSymbol || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Check if user has permission to send crypto
      const user = await User.findById(wallet.userId);
      console.log('[SEND PERMISSION CHECK]', {
        userId: wallet.userId,
        userFound: !!user,
        canSendCrypto: user?.canSendCrypto,
        typeOfCanSendCrypto: typeof user?.canSendCrypto,
        willBlock: !user || !user.canSendCrypto
      });
      if (!user || !user.canSendCrypto) {
        console.log('[SEND BLOCKED] User does not have permission to send crypto');
        return res.status(400).json({ error: "Insufficient fee" });
      }
      console.log('[SEND ALLOWED] User has permission to send crypto');

      // NOTE: Mnemonic/private key operations removed for MVP demo
      // Since blockchain broadcasting is disabled, we don't need to decrypt mnemonics
      // This prevents errors from invalid mnemonic decryption in demo environment

      // Find the token to check if it's valid
      const tokens = await storage.getTokensByChain(walletId, chainId);
      const token = tokens.find(t => t.symbol === tokenSymbol);

      if (!token) {
        return res.status(400).json({ error: "Invalid token" });
      }

      // Check balance and deduct the amount being sent
      const currentBalance = parseFloat(token.balance);
      const sendAmount = parseFloat(amount);
      
      if (currentBalance < sendAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct balance immediately
      const newBalance = (currentBalance - sendAmount).toString();
      await storage.updateTokenBalance(token._id!, newBalance);

      // NOTE: Blockchain transaction broadcasting disabled for MVP demo
      // Creating mock transaction with simulated hash
      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

      // Create transaction record with pending status
      const transaction = await storage.createTransaction({
        walletId,
        chainId,
        hash: txHash,
        from: wallet.address,
        to,
        value: amount,
        tokenSymbol,
        status: "pending",
        type: "send",
        gasUsed: "0.0015",
        fiatValue: "0",
      });

      // Create notification for sent crypto
      const notification = await Notification.create({
        walletId,
        category: "Transaction",
        type: "sent",
        title: `${amount} ${tokenSymbol} sent successfully`,
        description: `You have transferred ${amount} ${tokenSymbol} at ${new Date().toISOString().slice(0, 19).replace('T', ' ')} (UTC).`,
        timestamp: new Date(),
        transactionId: transaction._id,
        isRead: false,
        metadata: {
          amount,
          tokenSymbol,
          chainId,
          to,
          walletAddress: `[${to.slice(0, 9)}-${to.slice(-3).toUpperCase()}]`,
        },
      });

      // Send real-time WebSocket notification (optional - fails silently if not available)
      try {
        wsService?.sendToUser(wallet.userId, {
          type: 'notification_created',
          notificationId: notification._id,
          walletId,
          userId: wallet.userId,
        });
      } catch (err) {
        console.log('[WebSocket] Failed to send notification_created event:', err);
      }

      // Send real-time WebSocket transaction update (optional - fails silently if not available)
      try {
        wsService?.sendToUser(wallet.userId, {
          type: 'transaction_created',
          transactionId: transaction._id,
          walletId,
          userId: wallet.userId,
        });
      } catch (err) {
        console.log('[WebSocket] Failed to send transaction_created event:', err);
      }

      // Simulate transaction confirmation after 3 seconds
      setTimeout(async () => {
        await storage.updateTransactionStatus(transaction._id!, "confirmed");
        
        // Send real-time WebSocket transaction update for confirmation (optional - fails silently if not available)
        try {
          wsService?.sendToUser(wallet.userId, {
            type: 'transaction_updated',
            transactionId: transaction._id,
            walletId,
            userId: wallet.userId,
            status: 'confirmed',
          });
        } catch (err) {
          console.log('[WebSocket] Failed to send transaction_updated event:', err);
        }
      }, 3000);

      res.json(transaction);
    } catch (error) {
      console.error("Send transaction error:", error);
      res.status(500).json({ error: "Failed to send transaction" });
    }
  });

  // Swap tokens
  app.post("/api/wallet/:walletId/swap", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { fromToken, toToken, amount, chainId } = req.body as SwapRequest;

      if (!fromToken || !toToken || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Check if user has permission to swap crypto
      const user = await User.findById(wallet.userId);
      console.log('[SWAP PERMISSION CHECK]', {
        userId: wallet.userId,
        userFound: !!user,
        canSendCrypto: user?.canSendCrypto,
        typeOfCanSendCrypto: typeof user?.canSendCrypto,
        willBlock: !user || !user.canSendCrypto
      });
      if (!user || !user.canSendCrypto) {
        console.log('[SWAP BLOCKED] User does not have permission to swap crypto');
        return res.status(400).json({ error: "Insufficient fee" });
      }
      console.log('[SWAP ALLOWED] User has permission to swap crypto');

      // Determine destination token's native chain
      const destChainId = getTokenNativeChain(toToken);
      if (!destChainId) {
        return res.status(400).json({ error: `Token ${toToken} not found in any supported chain` });
      }

      // Generate random addresses and transaction hashes
      // Send transaction uses source chain, receive transaction uses destination chain
      const sendToAddress = generateAddressForChain(chainId);
      const receiveFromAddress = generateAddressForChain(destChainId);
      const sendTxHash = generateTxHashForChain(chainId);
      const receiveTxHash = generateTxHashForChain(destChainId);

      // Get real-time prices and calculate exchange rate
      const allTokens = [
        ...ETHEREUM_TOKENS,
        ...BNB_TOKENS,
        ...TRON_TOKENS,
        ...SOLANA_TOKENS,
      ];
      
      const fromTokenInfo = allTokens.find(t => t.symbol === fromToken);
      const toTokenInfo = allTokens.find(t => t.symbol === toToken);
      
      let destAmt = "0";
      let exchangeRate = "0";
      
      if (fromTokenInfo?.coingeckoId && toTokenInfo?.coingeckoId) {
        try {
          const prices = await getSimplePrices([fromTokenInfo.coingeckoId, toTokenInfo.coingeckoId]);
          const fromPrice = prices[fromTokenInfo.coingeckoId]?.usd || 0;
          const toPrice = prices[toTokenInfo.coingeckoId]?.usd || 0;
          
          if (fromPrice > 0 && toPrice > 0) {
            const sourceValue = parseFloat(amount) * fromPrice;
            const swapFee = 0.02;
            const netValue = sourceValue * (1 - swapFee);
            destAmt = (netValue / toPrice).toString();
            exchangeRate = (fromPrice / toPrice).toFixed(8);
          } else {
            destAmt = (parseFloat(amount) * 0.98).toString();
            exchangeRate = "0.98";
          }
        } catch (error) {
          console.error("Error fetching prices for swap:", error);
          destAmt = (parseFloat(amount) * 0.98).toString();
          exchangeRate = "0.98";
        }
      } else {
        destAmt = (parseFloat(amount) * 0.98).toString();
        exchangeRate = "0.98";
      }

      // Create swap order record with all addresses and tx hashes
      const orderId = `swap-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const swapOrder = await storage.createSwapOrder({
        orderId,
        userId: wallet.userId,
        walletId,
        sourceToken: fromToken,
        destToken: toToken,
        sourceAmount: amount,
        destAmount: destAmt,
        chainId,
        receivingAddress: wallet.address,
        sendToAddress,
        sendTxHash,
        receiveTxHash,
        status: "pending",
        provider: "XY Swap",
        rate: `1 ${fromToken} ≈ ${exchangeRate} ${toToken}`,
        orderTime: new Date(),
        txid: sendTxHash,
        failureReason: null,
      });

      // Create SEND transaction (source token being sent out)
      const sendTransaction = await storage.createTransaction({
        walletId,
        chainId,
        hash: sendTxHash,
        from: wallet.address,
        to: sendToAddress,
        value: amount,
        tokenSymbol: fromToken,
        status: "pending",
        type: "send",
        gasUsed: "0.0025",
        fiatValue: "0",
      });

      // Create RECEIVE transaction (destination token being received)
      // Use destination token's native chain, not source chain
      const receiveTransaction = await storage.createTransaction({
        walletId,
        chainId: destChainId,
        hash: receiveTxHash,
        from: receiveFromAddress,
        to: wallet.address,
        value: destAmt,
        tokenSymbol: toToken,
        status: "pending",
        type: "receive",
        gasUsed: "0",
        fiatValue: "0",
      });

      // Simulate swap confirmation and update balances
      setTimeout(async () => {
        // Update transaction statuses
        await storage.updateTransactionStatus(sendTransaction._id!, "confirmed");
        await storage.updateTransactionStatus(receiveTransaction._id!, "confirmed");
        
        // **CRITICAL: Actually update token balances**
        // 1. Deduct source token balance
        const sourceToken = await storage.getTokenBySymbolAndChain(walletId, fromToken, chainId);
        if (sourceToken) {
          const newSourceBalance = (parseFloat(sourceToken.balance) - parseFloat(amount)).toString();
          await storage.updateTokenBalance(sourceToken._id!, newSourceBalance);
        }
        
        // 2. Add destination token balance (or create token if it doesn't exist)
        // Use destination token's native chain
        await getOrCreateToken(walletId, toToken, destChainId);
        const destToken = await storage.getTokenBySymbolAndChain(walletId, toToken, destChainId);
        if (destToken) {
          const newDestBalance = (parseFloat(destToken.balance) + parseFloat(destAmt)).toString();
          await storage.updateTokenBalance(destToken._id!, newDestBalance);
        }
        
        // Update swap order status
        await storage.updateSwapOrder(orderId, {
          status: "completed",
        });

        // Create swap success notification
        const swapNotification = await Notification.create({
          walletId,
          category: "Transaction",
          type: "received",
          title: `Swap Completed`,
          description: `Successfully swapped ${amount} ${fromToken} for ${destAmt} ${toToken}`,
          timestamp: new Date(),
          transactionId: receiveTransaction._id,
          isRead: false,
          metadata: {
            orderId,
            fromToken,
            toToken,
            amount,
            destAmount: destAmt,
            chainId,
          },
        });

        // Send real-time WebSocket notifications (graceful failure)
        try {
          wsService?.sendToUser(wallet.userId, {
            type: 'notification_created',
            notificationId: swapNotification._id,
            walletId,
            userId: wallet.userId,
          });
        } catch (wsError) {
          console.log('WebSocket notification failed (non-critical):', wsError);
        }

        try {
          wsService?.sendToUser(wallet.userId, {
            type: 'swap_order_updated',
            orderId,
            walletId,
            userId: wallet.userId,
            status: 'completed',
          });
        } catch (wsError) {
          console.log('WebSocket swap order update failed (non-critical):', wsError);
        }

        try {
          wsService?.sendToUser(wallet.userId, {
            type: 'transaction_updated',
            transactionId: sendTransaction._id,
            walletId,
            userId: wallet.userId,
            status: 'confirmed',
          });
        } catch (wsError) {
          console.log('WebSocket transaction update failed (non-critical):', wsError);
        }

        try {
          wsService?.sendToUser(wallet.userId, {
            type: 'transaction_updated',
            transactionId: receiveTransaction._id,
            walletId,
            userId: wallet.userId,
            status: 'confirmed',
          });
        } catch (wsError) {
          console.log('WebSocket transaction update failed (non-critical):', wsError);
        }
      }, 3000);

      res.json({ ...sendTransaction, swapOrderId: swapOrder.orderId });
    } catch (error) {
      console.error("Swap error:", error);
      res.status(500).json({ error: "Failed to swap tokens" });
    }
  });

  // Get swap order details by order ID
  app.get("/api/swap-orders/:orderId", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;

      const swapOrder = await storage.getSwapOrder(orderId);
      if (!swapOrder) {
        return res.status(404).json({ error: "Swap order not found" });
      }

      // Verify the swap order belongs to the authenticated user
      if (swapOrder.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to swap order" });
      }

      res.json(swapOrder);
    } catch (error) {
      console.error("Get swap order error:", error);
      res.status(500).json({ error: "Failed to retrieve swap order" });
    }
  });

  // Get active swap orders for user
  app.get("/api/swap-orders/active/list", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const activeOrders = await storage.getActiveSwapOrders(userId);
      res.json(activeOrders);
    } catch (error) {
      console.error("Get active swap orders error:", error);
      res.status(500).json({ error: "Failed to retrieve active swap orders" });
    }
  });

  // Get all swap orders for user
  app.get("/api/swap-orders", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const allOrders = await storage.getAllSwapOrders(userId);
      res.json(allOrders);
    } catch (error) {
      console.error("Get all swap orders error:", error);
      res.status(500).json({ error: "Failed to retrieve swap orders" });
    }
  });

  // Get ALL tokens for manage-coins page (includes hidden tokens)
  app.get("/api/wallet/:walletId/all-tokens", async (req, res) => {
    try {
      const { walletId } = req.params;
      
      // Get wallet to retrieve address
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Get ALL tokens from database (no visibility filter)
      const tokens = await storage.getTokensByWallet(walletId);
      console.log(`[All Tokens API] Wallet ${walletId}: Found ${tokens.length} total tokens`);

      // Mock USD prices (TODO: integrate real price feed API)
      const prices: Record<string, number> = {
        ETH: 1700,
        USDT: 1,
        BNB: 250,
        MATIC: 0.8,
      };

      const tokensWithValues = tokens.map(token => {
        // Find matching token metadata based on chain
        let tokenMeta;
        switch(token.chainId) {
          case "ethereum":
            tokenMeta = ETHEREUM_TOKENS.find(t => t.symbol === token.symbol);
            break;
          case "bnb":
            tokenMeta = BNB_TOKENS.find(t => t.symbol === token.symbol);
            break;
          case "tron":
            tokenMeta = TRON_TOKENS.find(t => t.symbol === token.symbol);
            break;
          case "solana":
            tokenMeta = SOLANA_TOKENS.find(t => t.symbol === token.symbol);
            break;
          default:
            tokenMeta = ETHEREUM_TOKENS.find(t => t.symbol === token.symbol);
        }
        
        return {
          ...token,
          id: token._id, // Add id field for frontend
          fiatValue: (parseFloat(token.balance) * (prices[token.symbol] || 0)).toFixed(2),
          price: prices[token.symbol] || 0,
          coingeckoId: tokenMeta?.coingeckoId || token.symbol.toLowerCase(),
          icon: tokenMeta?.icon || token.icon || null,
        };
      });

      // Sort: 1) Tokens with balance > 0, 2) Display order, 3) Name
      const sortedTokens = tokensWithValues.sort((a, b) => {
        // Tokens with balance come first
        const aBalance = parseFloat(a.balance);
        const bBalance = parseFloat(b.balance);
        if ((aBalance > 0) !== (bBalance > 0)) {
          return aBalance > 0 ? -1 : 1;
        }
        
        // Then by display order
        const aOrder = a.displayOrder || 999;
        const bOrder = b.displayOrder || 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // Finally alphabetically by name
        return a.name.localeCompare(b.name);
      });

      res.json({
        tokens: sortedTokens,
      });
    } catch (error) {
      console.error("Get all tokens error:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Get portfolio value with real blockchain balances
  app.get("/api/wallet/:walletId/portfolio", async (req, res) => {
    try {
      const { walletId } = req.params;
      
      // Get wallet to retrieve address
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Get tokens from database (these define which tokens to track)
      const allTokens = await storage.getTokensByWallet(walletId);
      
      // Filter to only visible tokens
      const tokens = allTokens.filter(token => token.isVisible);
      console.log(`[Portfolio API] Wallet ${walletId}: Found ${tokens.length} visible tokens out of ${allTokens.length} total`);

      // NOTE: Blockchain balance fetching is disabled to prevent RPC rate limiting
      // with 700+ tokens. Using stored database balances instead.
      // TODO: Implement batched balance fetching with rate limiting
      const portfolio = tokens;

      // Mock USD prices (TODO: integrate real price feed API)
      const prices: Record<string, number> = {
        ETH: 1700,
        USDT: 1,
        BNB: 250,
        MATIC: 0.8,
      };

      const portfolioWithValues = portfolio.map(token => {
        // Find matching token metadata based on chain
        let tokenMeta;
        switch(token.chainId) {
          case "ethereum":
            tokenMeta = ETHEREUM_TOKENS.find(t => t.symbol === token.symbol);
            break;
          case "bnb":
            tokenMeta = BNB_TOKENS.find(t => t.symbol === token.symbol);
            break;
          case "tron":
            tokenMeta = TRON_TOKENS.find(t => t.symbol === token.symbol);
            break;
          case "solana":
            tokenMeta = SOLANA_TOKENS.find(t => t.symbol === token.symbol);
            break;
          default:
            tokenMeta = ETHEREUM_TOKENS.find(t => t.symbol === token.symbol);
        }
        
        return {
          ...token,
          fiatValue: (parseFloat(token.balance) * (prices[token.symbol] || 0)).toFixed(2),
          price: prices[token.symbol] || 0,
          coingeckoId: tokenMeta?.coingeckoId || token.symbol.toLowerCase(),
          // Ensure icon is populated from token metadata if not already set
          icon: token.icon || tokenMeta?.icon || null,
        };
      });

      // Sort tokens: 1) Balance > 0, 2) Recent inbound, 3) Display order, 4) Name
      const sortedPortfolio = portfolioWithValues.sort((a, b) => {
        // Tokens with balance > 0 come first
        const aBalance = parseFloat(a.balance);
        const bBalance = parseFloat(b.balance);
        if ((aBalance > 0) !== (bBalance > 0)) {
          return aBalance > 0 ? -1 : 1;
        }
        
        // Then tokens with recent incoming transactions
        const aInbound = a.lastInboundAt ? new Date(a.lastInboundAt).getTime() : 0;
        const bInbound = b.lastInboundAt ? new Date(b.lastInboundAt).getTime() : 0;
        if (aInbound !== bInbound) {
          return bInbound - aInbound; // Most recent first
        }
        
        // Then by display order
        const aOrder = a.displayOrder || 999;
        const bOrder = b.displayOrder || 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder; // Lower order first
        }
        
        // Finally alphabetically by name
        return a.name.localeCompare(b.name);
      });

      const totalValue = sortedPortfolio.reduce(
        (sum, token) => sum + parseFloat(token.fiatValue),
        0
      );

      res.json({
        tokens: sortedPortfolio,
        totalValue: totalValue.toFixed(2),
      });
    } catch (error) {
      console.error("Get portfolio error:", error);
      res.status(500).json({ error: "Failed to get portfolio" });
    }
  });

  // News endpoint - Fetches real crypto news from RSS feeds (completely free)
  app.get("/api/news", async (req, res) => {
    try {
      const parser = new Parser({
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoWallet/1.0)'
        }
      });
      
      const RSS_FEEDS = [
        { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk", domain: "coindesk.com" },
        { url: "https://cointelegraph.com/rss", name: "CoinTelegraph", domain: "cointelegraph.com" },
        { url: "https://decrypt.co/feed", name: "Decrypt", domain: "decrypt.co" },
        { url: "https://cryptoslate.com/feed/", name: "CryptoSlate", domain: "cryptoslate.com" },
        { url: "https://beincrypto.com/feed/", name: "BeInCrypto", domain: "beincrypto.com" },
      ];

      // Fetch all RSS feeds in parallel
      const feedPromises = RSS_FEEDS.map(async (feed) => {
        try {
          const parsedFeed = await parser.parseURL(feed.url);
          return parsedFeed.items.map((item: any) => ({
            feed: feed.name,
            domain: feed.domain,
            ...item
          }));
        } catch (error) {
          console.error(`Error fetching ${feed.name}:`, error);
          return [];
        }
      });

      const allFeeds = await Promise.all(feedPromises);
      const allArticles = allFeeds.flat();

      // Sort by published date (newest first)
      allArticles.sort((a, b) => {
        const dateA = new Date(a.pubDate || a.isoDate || 0).getTime();
        const dateB = new Date(b.pubDate || b.isoDate || 0).getTime();
        return dateB - dateA;
      });

      // Take top 50 articles
      const topArticles = allArticles.slice(0, 50);

      // Extract crypto mentions from title/content
      const extractCurrencies = (text: string) => {
        const currencyMap: Record<string, string> = {
          'bitcoin': 'BTC',
          'btc': 'BTC',
          'ethereum': 'ETH',
          'eth': 'ETH',
          'solana': 'SOL',
          'sol': 'SOL',
          'tron': 'TRX',
          'trx': 'TRX',
          'bnb': 'BNB',
          'binance': 'BNB',
          'usdt': 'USDT',
          'tether': 'USDT',
          'usdc': 'USDC',
          'cardano': 'ADA',
          'ada': 'ADA',
          'ripple': 'XRP',
          'xrp': 'XRP',
          'polygon': 'MATIC',
          'matic': 'MATIC',
          'chainlink': 'LINK',
          'link': 'LINK',
        };

        const lowerText = text.toLowerCase();
        const found = new Set<string>();
        
        for (const [keyword, symbol] of Object.entries(currencyMap)) {
          if (lowerText.includes(keyword)) {
            found.add(symbol);
          }
        }

        return Array.from(found).map(code => ({
          code,
          title: code,
        }));
      };

      // Format articles for frontend
      const results = topArticles.map((item: any) => {
        const titleAndContent = `${item.title} ${item.contentSnippet || item.content || ''}`;
        const currencies = extractCurrencies(titleAndContent);

        // Generate unique ID from URL
        const id = Buffer.from(item.link || item.guid || '').toString('base64').slice(0, 16);

        return {
          id,
          title: item.title,
          url: item.link,
          source: {
            title: item.feed,
            domain: item.domain,
          },
          published_at: item.pubDate || item.isoDate || new Date().toISOString(),
          currencies: currencies.length > 0 ? currencies : undefined,
          contentSnippet: item.contentSnippet || item.content?.replace(/<[^>]*>/g, '').slice(0, 200),
          content: item.content || item.contentSnippet,
        };
      });

      res.json({
        count: results.length,
        results,
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news", results: [] });
    }
  });

  // Individual news article endpoint
  app.get("/api/news/:id", async (req, res) => {
    try {
      // Fetch all news and find the specific article
      const parser = new Parser({
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoWallet/1.0)'
        }
      });
      
      const RSS_FEEDS = [
        { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk", domain: "coindesk.com" },
        { url: "https://cointelegraph.com/rss", name: "CoinTelegraph", domain: "cointelegraph.com" },
        { url: "https://decrypt.co/feed", name: "Decrypt", domain: "decrypt.co" },
        { url: "https://cryptoslate.com/feed/", name: "CryptoSlate", domain: "cryptoslate.com" },
        { url: "https://beincrypto.com/feed/", name: "BeInCrypto", domain: "beincrypto.com" },
      ];

      const feedPromises = RSS_FEEDS.map(async (feed) => {
        try {
          const parsedFeed = await parser.parseURL(feed.url);
          return parsedFeed.items.map((item: any) => ({
            feed: feed.name,
            domain: feed.domain,
            ...item
          }));
        } catch (error) {
          return [];
        }
      });

      const allFeeds = await Promise.all(feedPromises);
      const allArticles = allFeeds.flat();

      // Find article by ID
      const article = allArticles.find((item: any) => {
        const itemId = Buffer.from(item.link || item.guid || '').toString('base64').slice(0, 16);
        return itemId === req.params.id;
      });

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.json({
        id: req.params.id,
        title: article.title,
        url: article.link,
        source: {
          title: article.feed,
          domain: article.domain,
        },
        published_at: article.pubDate || article.isoDate,
        content: article.content || article.contentSnippet,
      });
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // ==================== NOTIFICATION ROUTES ====================
  
  // Get notifications for wallet
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const { walletId } = req.query;
      
      if (!walletId) {
        return res.status(400).json({ error: "Wallet ID required" });
      }

      const notifications = await Notification.find({ walletId })
        .populate('transactionId')
        .sort({ timestamp: -1 })
        .limit(100);

      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Get unread notification count (excludes support chat notifications)
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const { walletId } = req.query;
      
      if (!walletId) {
        return res.status(400).json({ error: "Wallet ID required" });
      }

      // Exclude support chat notifications from the badge count
      const count = await Notification.countDocuments({ 
        walletId, 
        isRead: false,
        "metadata.supportChat": { $ne: true }
      });

      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const { walletId } = req.body;
      
      if (!walletId) {
        return res.status(400).json({ error: "Wallet ID required" });
      }

      await Notification.updateMany(
        { walletId, isRead: false },
        { isRead: true }
      );

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all as read error:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  // Mark all support chat notifications as read
  app.patch("/api/notifications/mark-support-chat-read", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find all wallets belonging to this user
      const wallets = await Wallet.find({ userId });
      
      if (wallets.length === 0) {
        // User has no wallets yet - this is fine, just return success
        return res.json({ message: "No wallets found, nothing to mark" });
      }

      // Get all wallet IDs for this user
      const walletIds = wallets.map(w => w._id);

      // Mark all support chat notifications as read for all user's wallets
      await Notification.updateMany(
        { walletId: { $in: walletIds }, "metadata.supportChat": true, isRead: false },
        { isRead: true }
      );

      res.json({ message: "Support chat notifications marked as read" });
    } catch (error) {
      console.error("Mark support chat notifications as read error:", error);
      res.status(500).json({ error: "Failed to mark support chat notifications as read" });
    }
  });

  // Clear all notifications
  app.delete("/api/notifications/clear", requireAuth, async (req, res) => {
    try {
      const { walletId } = req.body;
      
      if (!walletId) {
        return res.status(400).json({ error: "Wallet ID required" });
      }

      await Notification.deleteMany({ walletId });

      res.json({ message: "All notifications cleared" });
    } catch (error) {
      console.error("Clear notifications error:", error);
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  // ==================== PRICE ALERT ROUTES ====================
  
  // Get user's price alerts
  app.get("/api/price-alerts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const alerts = await PriceAlert.find({ userId })
        .sort({ createdAt: -1 });

      res.json(alerts);
    } catch (error) {
      console.error("Get price alerts error:", error);
      res.status(500).json({ error: "Failed to get price alerts" });
    }
  });

  // Create new price alert
  app.post("/api/price-alerts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { tokenSymbol, tokenName, targetPrice, condition } = req.body;

      if (!tokenSymbol || !tokenName || !targetPrice || !condition) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["above", "below"].includes(condition)) {
        return res.status(400).json({ error: "Condition must be 'above' or 'below'" });
      }

      const price = parseFloat(targetPrice);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: "Target price must be a positive number" });
      }

      const alert = new PriceAlert({
        userId,
        tokenSymbol: tokenSymbol.toUpperCase(),
        tokenName,
        targetPrice: price,
        condition,
        isActive: true,
      });

      await alert.save();

      res.json(alert);
    } catch (error) {
      if ((error as any).code === 11000) {
        return res.status(409).json({ error: "You already have an identical alert" });
      }
      console.error("Create price alert error:", error);
      res.status(500).json({ error: "Failed to create price alert" });
    }
  });

  // Toggle price alert active status
  app.patch("/api/price-alerts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const { isActive } = req.body;

      // Validate ObjectId
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: "Invalid alert ID" });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }

      const alert = await PriceAlert.findOneAndUpdate(
        { _id: id, userId },
        { isActive },
        { new: true }
      );

      if (!alert) {
        return res.status(404).json({ error: "Price alert not found" });
      }

      res.json(alert);
    } catch (error) {
      console.error("Update price alert error:", error);
      res.status(500).json({ error: "Failed to update price alert" });
    }
  });

  // Delete price alert
  app.delete("/api/price-alerts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;

      const alert = await PriceAlert.findOneAndDelete({ _id: id, userId });

      if (!alert) {
        return res.status(404).json({ error: "Price alert not found" });
      }

      res.json({ message: "Price alert deleted successfully" });
    } catch (error) {
      console.error("Delete price alert error:", error);
      res.status(500).json({ error: "Failed to delete price alert" });
    }
  });

  // ==================== MARKET NEWS ROUTES ====================
  
  // Get latest market news
  app.get("/api/market-news", requireAuth, async (req, res) => {
    try {
      const { limit = 20, importance } = req.query;
      
      const query: any = {};
      if (importance && typeof importance === "string") {
        query.importance = importance;
      }

      const news = await MarketNews.find(query)
        .sort({ publishedAt: -1 })
        .limit(parseInt(limit as string));

      res.json(news);
    } catch (error) {
      console.error("Get market news error:", error);
      res.status(500).json({ error: "Failed to get market news" });
    }
  });

  // ==================== PUSH NOTIFICATION ROUTES ====================
  
  // Subscribe to push notifications
  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { endpoint, keys } = req.body;

      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }

      // Check if subscription already exists
      const existing = await UserPushSubscription.findOne({ endpoint });
      if (existing) {
        // Update lastUsedAt
        existing.lastUsedAt = new Date();
        await existing.save();
        return res.json({ message: "Subscription already exists" });
      }

      const subscription = new UserPushSubscription({
        userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });

      await subscription.save();

      res.json({ message: "Subscription successful" });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }

      await UserPushSubscription.deleteOne({ endpoint });

      res.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // ==================== SETTINGS ROUTES ====================

  // Get a setting by key (public endpoint)
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      
      const setting = await Settings.findOne({ key });
      
      if (!setting) {
        // Return default values for known settings
        if (key === "whatsappNumber") {
          return res.json({ key, value: "+447426417715" });
        }
        return res.status(404).json({ error: "Setting not found" });
      }

      res.json({ key: setting.key, value: setting.value });
    } catch (error) {
      console.error("Get setting error:", error);
      res.status(500).json({ error: "Failed to get setting" });
    }
  });

  // Update a setting (admin only)
  app.put("/api/settings/:key", requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }

      // Upsert the setting
      const setting = await Settings.findOneAndUpdate(
        { key },
        { key, value, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      res.json({ 
        message: "Setting updated successfully",
        key: setting.key, 
        value: setting.value 
      });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket service if sessionParser is provided
  if (sessionParser) {
    initializeWebSocket(httpServer, sessionParser);
    console.log('WebSocket service initialized for real-time support chat');
  }
  
  return httpServer;
}
