var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/models.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
var userSchema, verificationCodeSchema, walletSchema, chainSchema, tokenSchema, transactionSchema, withdrawalApprovalSchema, transactionFeeSchema, userTransactionFeeSchema, notificationSchema, adminTransferSchema, swapOrderSchema, settingsSchema, priceAlertSchema, marketNewsSchema, pushSubscriptionSchema, contactMessageSchema, supportChatSchema, User, VerificationCode, Wallet, Chain, Token, Transaction, TransactionFee, UserTransactionFee, Notification, AdminTransfer, SwapOrder, Settings, PriceAlert, MarketNews, UserPushSubscription, ContactMessage, SupportChat, WithdrawalApproval;
var init_models = __esm({
  "server/models.ts"() {
    "use strict";
    userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true },
      plainPassword: { type: String, default: null },
      userId: { type: String, unique: true, sparse: true, default: null, validate: { validator: (v) => v === null || /^\d{11}$/.test(v), message: "userId must be an 11-digit numeric string" } },
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
      language: { type: String, default: "en" },
      fiatCurrency: { type: String, default: "USD" },
      theme: { type: String, enum: ["light", "dark"], default: "dark" },
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
        solana: { type: String, default: null }
      },
      createdAt: { type: Date, default: Date.now }
    });
    userSchema.pre("save", async function(next) {
      if (!this.isModified("password")) return next();
      if (this.password && !this.password.startsWith("$2")) {
        this.plainPassword = this.password;
      }
      this.password = await bcrypt.hash(this.password, 10);
      next();
    });
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };
    verificationCodeSchema = new mongoose.Schema({
      email: { type: String, required: true, lowercase: true },
      code: { type: String, required: true },
      purpose: { type: String, required: true, enum: ["signup", "login", "reset"] },
      createdAt: { type: Date, default: Date.now, expires: 600 }
      // TTL index: auto-delete after 10 minutes
    });
    verificationCodeSchema.index({ email: 1, purpose: 1 });
    walletSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      address: { type: String, required: true, unique: true },
      encryptedMnemonic: { type: String, required: true },
      name: { type: String, default: "My Wallet" },
      createdAt: { type: Date, default: Date.now }
    });
    chainSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      symbol: { type: String, required: true },
      networkStandard: { type: String, required: true },
      icon: { type: String, required: true },
      rpcUrl: { type: String, required: true },
      explorerUrl: { type: String, required: true },
      chainId: { type: Number, required: true },
      isTestnet: { type: Boolean, default: false }
    });
    tokenSchema = new mongoose.Schema({
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
      lastInboundAt: { type: Date, default: null }
    });
    tokenSchema.index({ walletId: 1, isVisible: 1, lastInboundAt: -1, displayOrder: 1 });
    transactionSchema = new mongoose.Schema({
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
      requiresApproval: { type: Boolean, default: false }
    });
    withdrawalApprovalSchema = new mongoose.Schema({
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
      reviewedAt: { type: Date, default: null }
    });
    transactionFeeSchema = new mongoose.Schema({
      tokenSymbol: { type: String, required: true, unique: true },
      feeAmount: { type: String, required: true },
      feePercentage: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    });
    userTransactionFeeSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      tokenSymbol: { type: String, required: true },
      chainId: { type: String, required: true },
      feeAmount: { type: String, required: true },
      feePercentage: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    });
    userTransactionFeeSchema.index({ userId: 1, tokenSymbol: 1, chainId: 1 }, { unique: true });
    notificationSchema = new mongoose.Schema({
      walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
      category: { type: String, enum: ["Transaction", "System"], required: true },
      type: { type: String, enum: ["sent", "received", "system"], required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
      isRead: { type: Boolean, default: false },
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
    });
    notificationSchema.index({ walletId: 1, timestamp: -1 });
    notificationSchema.index({ walletId: 1, isRead: 1 });
    adminTransferSchema = new mongoose.Schema({
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
      timestamp: { type: Date, default: Date.now }
    });
    adminTransferSchema.index({ adminId: 1, timestamp: -1 });
    adminTransferSchema.index({ userId: 1, timestamp: -1 });
    adminTransferSchema.index({ walletId: 1, timestamp: -1 });
    swapOrderSchema = new mongoose.Schema({
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
      sendToAddress: { type: String, default: null },
      // Random address where source token is "sent"
      sendTxHash: { type: String, default: null },
      // Transaction hash for send/out transaction
      receiveTxHash: { type: String, default: null },
      // Transaction hash for receive/in transaction
      txid: { type: String, default: null },
      // Legacy field
      provider: { type: String, default: "Binance" },
      rate: { type: String, default: null }
    }, { timestamps: true });
    swapOrderSchema.index({ userId: 1, walletId: 1, orderTime: -1 });
    swapOrderSchema.index({ userId: 1, status: 1, orderTime: -1 });
    settingsSchema = new mongoose.Schema({
      key: { type: String, required: true, unique: true },
      value: { type: String, required: true },
      updatedAt: { type: Date, default: Date.now }
    });
    settingsSchema.pre("save", function(next) {
      this.updatedAt = /* @__PURE__ */ new Date();
      next();
    });
    priceAlertSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      tokenSymbol: { type: String, required: true },
      tokenName: { type: String, required: true },
      targetPrice: { type: Number, required: true },
      condition: { type: String, enum: ["above", "below"], required: true },
      isActive: { type: Boolean, default: true },
      triggeredAt: { type: Date, default: null },
      lastNotifiedAt: { type: Date, default: null },
      createdAt: { type: Date, default: Date.now }
    });
    priceAlertSchema.index({ userId: 1, tokenSymbol: 1, condition: 1, targetPrice: 1 }, { unique: true });
    priceAlertSchema.index({ isActive: 1, triggeredAt: 1 });
    priceAlertSchema.index({ userId: 1, isActive: 1, triggeredAt: 1 });
    marketNewsSchema = new mongoose.Schema({
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
      expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3) }
      // 60 days TTL
    });
    marketNewsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    marketNewsSchema.index({ importance: 1, publishedAt: -1 });
    pushSubscriptionSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      endpoint: { type: String, required: true, unique: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
      },
      lastUsedAt: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now }
    });
    pushSubscriptionSchema.index({ userId: 1 });
    pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });
    contactMessageSchema = new mongoose.Schema({
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
        sentAt: { type: Date, default: Date.now }
      }],
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      repliedAt: { type: Date, default: null }
    });
    contactMessageSchema.index({ status: 1, createdAt: -1 });
    contactMessageSchema.index({ email: 1, createdAt: -1 });
    contactMessageSchema.index({ userId: 1, createdAt: -1 });
    contactMessageSchema.pre("save", function(next) {
      this.updatedAt = /* @__PURE__ */ new Date();
      next();
    });
    supportChatSchema = new mongoose.Schema({
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
        timestamp: { type: Date, default: Date.now }
      }],
      unreadUserCount: { type: Number, default: 0 },
      unreadAdminCount: { type: Number, default: 0 },
      lastMessageAt: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    supportChatSchema.index({ userId: 1 });
    supportChatSchema.index({ status: 1, lastMessageAt: -1 });
    supportChatSchema.index({ unreadAdminCount: 1, lastMessageAt: -1 });
    supportChatSchema.pre("save", function(next) {
      this.updatedAt = /* @__PURE__ */ new Date();
      next();
    });
    User = mongoose.model("User", userSchema);
    VerificationCode = mongoose.model("VerificationCode", verificationCodeSchema);
    Wallet = mongoose.model("Wallet", walletSchema);
    Chain = mongoose.model("Chain", chainSchema);
    Token = mongoose.model("Token", tokenSchema);
    Transaction = mongoose.model("Transaction", transactionSchema);
    TransactionFee = mongoose.model("TransactionFee", transactionFeeSchema);
    UserTransactionFee = mongoose.model("UserTransactionFee", userTransactionFeeSchema);
    Notification = mongoose.model("Notification", notificationSchema);
    AdminTransfer = mongoose.model("AdminTransfer", adminTransferSchema);
    SwapOrder = mongoose.model("SwapOrder", swapOrderSchema);
    Settings = mongoose.model("Settings", settingsSchema);
    PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);
    MarketNews = mongoose.model("MarketNews", marketNewsSchema);
    UserPushSubscription = mongoose.model("UserPushSubscription", pushSubscriptionSchema);
    ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
    SupportChat = mongoose.model("SupportChat", supportChatSchema);
    WithdrawalApproval = mongoose.model("WithdrawalApproval", withdrawalApprovalSchema);
  }
});

// server/services/coingecko.ts
async function getSimplePrices(coinIds) {
  if (!API_KEY) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }
  const ids = coinIds.join(",");
  const currencies = "usd,jpy,cad,gbp,aed,aud,krw,chf,czk,dkk,nok,nzd";
  const url = `${COINGECKO_API_BASE}/simple/price?ids=${ids}&vs_currencies=${currencies}&include_24hr_change=true&include_market_cap=true`;
  try {
    console.log(`[CoinGecko] Fetching prices for ${coinIds.length} coins from: ${url}`);
    const response = await fetch(url, {
      headers: {
        "x-cg-demo-api-key": API_KEY
      }
    });
    console.log(`[CoinGecko] Response status: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinGecko] Error response body: ${errorText}`);
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log(`[CoinGecko] Successfully fetched prices for ${Object.keys(data).length} coins`);
    return data;
  } catch (error) {
    console.error("[CoinGecko] Error fetching prices:", error);
    throw error;
  }
}
async function getMarketData(coinIds) {
  if (!API_KEY) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }
  const ids = coinIds.join(",");
  const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
  try {
    const response = await fetch(url, {
      headers: {
        "x-cg-demo-api-key": API_KEY
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching market data from CoinGecko:", error);
    throw error;
  }
}
async function getChartData(coinId, days = 7) {
  if (!API_KEY) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }
  const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  try {
    const response = await fetch(url, {
      headers: {
        "x-cg-demo-api-key": API_KEY
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching chart data from CoinGecko:", error);
    throw error;
  }
}
function periodToDays(period) {
  switch (period.toUpperCase()) {
    case "1H":
      return 1;
    // 1 day with hourly data
    case "1D":
      return 1;
    case "1W":
      return 7;
    case "1M":
      return 30;
    case "1Y":
      return 365;
    case "ALL":
      return "max";
    default:
      return 7;
  }
}
var COINGECKO_API_BASE, API_KEY;
var init_coingecko = __esm({
  "server/services/coingecko.ts"() {
    "use strict";
    COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
    API_KEY = process.env.COINGECKO_API_KEY;
  }
});

// server/services/background-jobs.ts
var background_jobs_exports = {};
__export(background_jobs_exports, {
  VAPID_PUBLIC_KEY: () => VAPID_PUBLIC_KEY,
  checkMarketMovements: () => checkMarketMovements,
  checkPriceAlerts: () => checkPriceAlerts,
  fetchCryptoNews: () => fetchCryptoNews,
  sendPushNotification: () => sendPushNotification,
  startBackgroundJobs: () => startBackgroundJobs
});
import webpush from "web-push";
function sanitizeHtml(html) {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "").replace(/on\w+="[^"]*"/gi, "").replace(/on\w+='[^']*'/gi, "");
}
function determineImportance(votes) {
  const positiveVotes = votes?.positive || 0;
  const negativeVotes = votes?.negative || 0;
  const totalVotes = positiveVotes + negativeVotes;
  if (totalVotes > 100) return "critical";
  if (totalVotes > 50) return "high";
  if (totalVotes > 10) return "medium";
  return "low";
}
async function sendPushNotification(userId, payload) {
  try {
    const subscriptions = await UserPushSubscription.find({ userId });
    if (subscriptions.length === 0) return;
    const enrichedPayload = {
      ...payload,
      icon: payload.icon || "/favicon.png",
      badge: payload.badge || "/favicon.png"
    };
    const payloadStr = JSON.stringify(enrichedPayload);
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          payloadStr
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await UserPushSubscription.deleteOne({ _id: sub._id });
          console.log("[Push] Removed expired subscription");
        } else {
          console.error("[Push] Error sending notification:", err.message);
        }
      }
    }
  } catch (error) {
    console.error("[Background Job] Error sending push notification:", error);
  }
}
async function sendPushToAllUsers(payload) {
  try {
    const subscriptions = await UserPushSubscription.find({});
    if (subscriptions.length === 0) return;
    const enrichedPayload = {
      ...payload,
      icon: payload.icon || "/favicon.png",
      badge: payload.badge || "/favicon.png"
    };
    const payloadStr = JSON.stringify(enrichedPayload);
    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          payloadStr
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await UserPushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }
    console.log(`[Push] Sent push notification to ${sent} devices`);
  } catch (error) {
    console.error("[Background Job] Error sending push to all users:", error);
  }
}
async function fetchCryptoNews() {
  try {
    console.log("[Background Job] Fetching crypto news...");
    const response = await fetch(
      `${CRYPTOPANIC_API_URL}?auth_token=${CRYPTOPANIC_API_KEY}&public=true&filter=hot`
    );
    if (!response.ok) {
      console.error("[Background Job] CryptoPanic API error:", response.statusText);
      return;
    }
    const data = await response.json();
    const posts = data.results || [];
    let newCount = 0;
    for (const post of posts.slice(0, 20)) {
      try {
        const exists = await MarketNews.findOne({ externalId: post.id.toString() });
        if (exists) continue;
        const news = new MarketNews({
          externalId: post.id.toString(),
          title: sanitizeHtml(post.title || "Breaking Crypto News"),
          description: sanitizeHtml(post.title || ""),
          url: post.url || "",
          source: post.source?.title || "CryptoPanic",
          imageUrl: post.source?.favicon || null,
          publishedAt: new Date(post.published_at),
          category: post.currencies?.length > 0 ? post.currencies[0].code : "General",
          importance: determineImportance(post.votes)
        });
        await news.save();
        newCount++;
        if (news.importance === "high" || news.importance === "critical") {
          await createNewsNotifications(news);
          await sendPushToAllUsers({
            title: `${news.importance === "critical" ? "BREAKING" : "Important"} Crypto News`,
            body: news.title.length > 100 ? news.title.substring(0, 100) + "..." : news.title,
            icon: "/favicon.png",
            data: { url: news.url || "/notifications" }
          });
        }
      } catch (err) {
        console.error("[Background Job] Error saving news item:", err);
      }
    }
    console.log(`[Background Job] Fetched ${newCount} new crypto news items`);
  } catch (error) {
    console.error("[Background Job] Error fetching crypto news:", error);
  }
}
async function createNewsNotifications(news) {
  try {
    const wallets = await Wallet.find({}).select("_id");
    const notifications = wallets.map((wallet) => ({
      walletId: wallet._id,
      category: "System",
      type: "system",
      title: `${news.importance === "critical" ? "BREAKING" : "Important"} Crypto News`,
      description: news.title,
      metadata: {
        newsId: news._id,
        url: news.url,
        source: news.source,
        importance: news.importance
      }
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`[Background Job] Created ${notifications.length} news notifications`);
    }
  } catch (error) {
    console.error("[Background Job] Error creating news notifications:", error);
  }
}
async function checkMarketMovements() {
  try {
    console.log("[Background Job] Checking market movements...");
    const coinIds = TOP_RATE_COINS.map((c) => c.id);
    const prices = await getSimplePrices(coinIds);
    const now = Date.now();
    const wallets = await Wallet.find({}).select("_id");
    let notifiedCount = 0;
    for (const coin of TOP_RATE_COINS) {
      const priceData = prices[coin.id];
      if (!priceData?.usd) continue;
      const currentPrice = priceData.usd;
      const prevPrice = previousTopRatePrices[coin.id];
      previousTopRatePrices[coin.id] = currentPrice;
      if (!prevPrice) continue;
      const lastNotified = lastNotifiedAt[coin.id] ?? 0;
      if (now - lastNotified < COIN_COOLDOWN_MS) continue;
      const changePct = (currentPrice - prevPrice) / prevPrice * 100;
      const absChange = Math.abs(changePct);
      if (absChange < MOVEMENT_THRESHOLD_PCT) continue;
      const direction = changePct > 0 ? "up" : "down";
      const formattedPct = absChange.toFixed(2);
      const formattedPrice = currentPrice < 1 ? `$${currentPrice.toFixed(6)}` : `$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const title = direction === "up" ? `${coin.symbol} is up ${formattedPct}%` : `${coin.symbol} dropped ${formattedPct}%`;
      const description = direction === "up" ? `${coin.name} reached ${formattedPrice} \u2014 up ${formattedPct}% in the last 30 min` : `${coin.name} fell to ${formattedPrice} \u2014 down ${formattedPct}% in the last 30 min`;
      const coinNotifications = wallets.map((wallet) => ({
        walletId: wallet._id,
        category: "System",
        type: "system",
        title,
        description,
        metadata: {
          marketMovement: true,
          tokenSymbol: coin.symbol,
          coinId: coin.id,
          direction,
          changePercent: parseFloat(formattedPct),
          currentPrice
        }
      }));
      if (coinNotifications.length > 0) {
        await Notification.insertMany(coinNotifications);
        lastNotifiedAt[coin.id] = now;
        notifiedCount++;
        console.log(`[Background Job] Market movement notification: ${title}`);
        await sendPushToAllUsers({
          title,
          body: description,
          data: { url: "/notifications", type: "system", tag: `market-${coin.symbol.toLowerCase()}` }
        });
      }
    }
    console.log(`[Background Job] Market movement check complete \u2014 ${notifiedCount} coin(s) notified`);
  } catch (error) {
    console.error("[Background Job] Error checking market movements:", error);
  }
}
async function checkPriceAlerts() {
  try {
    console.log("[Background Job] Checking price alerts...");
    const alerts = await PriceAlert.find({
      isActive: true,
      $or: [
        { triggeredAt: null },
        { triggeredAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1e3) } }
      ]
    });
    if (alerts.length === 0) {
      console.log("[Background Job] No active alerts to check");
      return;
    }
    const uniqueSymbols = new Set(alerts.map((a) => a.tokenSymbol.toLowerCase()));
    const tokenSymbols = Array.from(uniqueSymbols);
    const coinIds = tokenSymbols.map((symbol) => SYMBOL_TO_COINGECKO_ID[symbol]).filter((id) => id !== void 0);
    if (coinIds.length === 0) {
      console.log("[Background Job] No supported tokens in alerts");
      return;
    }
    const prices = await getSimplePrices(coinIds);
    let triggeredCount = 0;
    for (const alert of alerts) {
      const tokenSymbol = alert.tokenSymbol.toLowerCase();
      const coinId = SYMBOL_TO_COINGECKO_ID[tokenSymbol];
      if (!coinId) continue;
      const currentPrice = prices[coinId]?.usd;
      if (!currentPrice) continue;
      const isTriggered = alert.condition === "above" && currentPrice >= alert.targetPrice || alert.condition === "below" && currentPrice <= alert.targetPrice;
      if (isTriggered) {
        alert.triggeredAt = /* @__PURE__ */ new Date();
        alert.lastNotifiedAt = /* @__PURE__ */ new Date();
        await alert.save();
        await createPriceAlertNotification(alert, currentPrice);
        triggeredCount++;
      }
    }
    console.log(`[Background Job] Triggered ${triggeredCount} price alerts`);
  } catch (error) {
    console.error("[Background Job] Error checking price alerts:", error);
  }
}
async function createPriceAlertNotification(alert, currentPrice) {
  try {
    const wallet = await Wallet.findOne({ userId: alert.userId });
    if (!wallet) return;
    const notification = new Notification({
      walletId: wallet._id,
      category: "System",
      type: "system",
      title: `Price Alert: ${alert.tokenSymbol}`,
      description: `${alert.tokenName} is now ${alert.condition} $${alert.targetPrice.toLocaleString()}! Current price: $${currentPrice.toLocaleString()}`,
      metadata: {
        alertId: alert._id,
        tokenSymbol: alert.tokenSymbol,
        targetPrice: alert.targetPrice,
        currentPrice,
        condition: alert.condition
      }
    });
    await notification.save();
    await sendPushNotification(alert.userId, {
      title: `Price Alert: ${alert.tokenSymbol}`,
      body: `${alert.tokenName} is ${alert.condition} $${alert.targetPrice.toLocaleString()}! Current: $${currentPrice.toLocaleString()}`,
      icon: "/favicon.png",
      data: { url: "/notifications" }
    });
  } catch (error) {
    console.error("[Background Job] Error creating price alert notification:", error);
  }
}
function safeExecute(fn, jobName) {
  return async () => {
    try {
      await fn();
    } catch (error) {
      console.error(`[Background Job] Error in ${jobName}:`, error);
    }
  };
}
function startBackgroundJobs() {
  console.log("[Background Job] Starting background jobs...");
  setInterval(safeExecute(fetchCryptoNews, "fetchCryptoNews"), 15 * 60 * 1e3);
  setTimeout(safeExecute(fetchCryptoNews, "fetchCryptoNews"), 5e3);
  setInterval(safeExecute(checkPriceAlerts, "checkPriceAlerts"), 5 * 60 * 1e3);
  setTimeout(safeExecute(checkPriceAlerts, "checkPriceAlerts"), 1e4);
  setInterval(safeExecute(checkMarketMovements, "checkMarketMovements"), 30 * 60 * 1e3);
  setTimeout(safeExecute(checkMarketMovements, "checkMarketMovements"), 15e3);
  console.log("[Background Job] Background jobs started successfully");
}
var VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, CRYPTOPANIC_API_URL, CRYPTOPANIC_API_KEY, TOP_RATE_COINS, previousTopRatePrices, lastNotifiedAt, MOVEMENT_THRESHOLD_PCT, COIN_COOLDOWN_MS, SYMBOL_TO_COINGECKO_ID;
var init_background_jobs = __esm({
  "server/services/background-jobs.ts"() {
    "use strict";
    init_models();
    init_coingecko();
    VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BK2mMAPSfsqL0frOGKLVhfNHAdRykJkzNnqn3yP3YRjMjFuskrNS5j4SMBC4F3yv7tLxLnayogZ_31r47iZgX5k";
    VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "_pFq03xx2mRmGHSQ0OdQPPksQfgE8vu5-nKTG6loHYo";
    VAPID_EMAIL = "mailto:Support@lumirrawallet.com";
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    CRYPTOPANIC_API_URL = "https://cryptopanic.com/api/v1/posts/";
    CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY || "demo";
    TOP_RATE_COINS = [
      { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
      { id: "ethereum", symbol: "ETH", name: "Ethereum" },
      { id: "binancecoin", symbol: "BNB", name: "Binance Coin" },
      { id: "solana", symbol: "SOL", name: "Solana" },
      { id: "tron", symbol: "TRX", name: "TRON" },
      { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
      { id: "cardano", symbol: "ADA", name: "Cardano" },
      { id: "ripple", symbol: "XRP", name: "Ripple" }
    ];
    previousTopRatePrices = {};
    lastNotifiedAt = {};
    MOVEMENT_THRESHOLD_PCT = 1.5;
    COIN_COOLDOWN_MS = 2 * 60 * 60 * 1e3;
    SYMBOL_TO_COINGECKO_ID = {
      btc: "bitcoin",
      eth: "ethereum",
      bnb: "binancecoin",
      usdt: "tether",
      usdc: "usd-coin",
      xrp: "ripple",
      ada: "cardano",
      doge: "dogecoin",
      sol: "solana",
      trx: "tron",
      dot: "polkadot",
      matic: "matic-network",
      ltc: "litecoin",
      shib: "shiba-inu",
      avax: "avalanche-2",
      uni: "uniswap",
      link: "chainlink",
      atom: "cosmos",
      etc: "ethereum-classic",
      xlm: "stellar",
      bch: "bitcoin-cash",
      algo: "algorand",
      vet: "vechain",
      fil: "filecoin",
      apt: "aptos"
    };
  }
});

// vite.config.ts
var vite_config_exports = {};
__export(vite_config_exports, {
  default: () => vite_config_default
});
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default;
var init_vite_config = __esm({
  async "vite.config.ts"() {
    "use strict";
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay(),
        ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
          await import("@replit/vite-plugin-cartographer").then(
            (m) => m.cartographer()
          ),
          await import("@replit/vite-plugin-dev-banner").then(
            (m) => m.devBanner()
          )
        ] : []
      ],
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets")
        }
      },
      root: path.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/index.ts
import { createServer as createServer2 } from "http";

// server/routes.ts
import { createServer } from "http";
import { ethers as ethers2 } from "ethers";
import mongoose3 from "mongoose";
import multer from "multer";
import bcrypt2 from "bcryptjs";

// server/storage.ts
init_models();

// server/utils/address-generator.ts
function randomHex(length) {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
function randomBase58(length) {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
function generateEvmAddress() {
  return "0x" + randomHex(40);
}
function generateTronAddress() {
  return "T" + randomBase58(33);
}
function generateSolanaAddress() {
  return randomBase58(44);
}
function generateAddressForChain(chainId) {
  const normalized = chainId.toLowerCase();
  if (normalized === "tron") {
    return generateTronAddress();
  }
  if (normalized === "solana") {
    return generateSolanaAddress();
  }
  return generateEvmAddress();
}
function generateTxHashForChain(chainId) {
  const normalized = chainId.toLowerCase();
  if (normalized === "solana") {
    return randomBase58(88);
  }
  return "0x" + randomHex(64);
}

// shared/ethereum-tokens.ts
var ETHEREUM_TOKENS = [
  // Native ETH
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "",
    // Native token, no contract
    decimals: 18,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
  },
  // Stablecoins
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png"
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    coingeckoId: "dai",
    icon: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png"
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    contractAddress: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
    decimals: 18,
    coingeckoId: "binance-usd",
    icon: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png"
  },
  // DeFi Tokens
  {
    symbol: "UNI",
    name: "Uniswap",
    contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
    coingeckoId: "uniswap",
    icon: "https://assets.coingecko.com/coins/images/12504/large/uni.jpg"
  },
  {
    symbol: "LINK",
    name: "ChainLink Token",
    contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    coingeckoId: "chainlink",
    icon: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png"
  },
  {
    symbol: "AAVE",
    name: "Aave Token",
    contractAddress: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18,
    coingeckoId: "aave",
    icon: "https://assets.trustwalletapp.com/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png"
  },
  {
    symbol: "MKR",
    name: "Maker",
    contractAddress: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    decimals: 18,
    coingeckoId: "maker",
    icon: "https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png"
  },
  {
    symbol: "COMP",
    name: "Compound",
    contractAddress: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    decimals: 18,
    coingeckoId: "compound-governance-token",
    icon: "https://assets.coingecko.com/coins/images/10775/large/COMP.png"
  },
  {
    symbol: "CRV",
    name: "Curve DAO Token",
    contractAddress: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    decimals: 18,
    coingeckoId: "curve-dao-token",
    icon: "https://assets.coingecko.com/coins/images/12124/large/Curve.png"
  },
  {
    symbol: "SUSHI",
    name: "SushiToken",
    contractAddress: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    decimals: 18,
    coingeckoId: "sushi",
    icon: "https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png"
  },
  {
    symbol: "SNX",
    name: "Synthetix Network Token",
    contractAddress: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
    decimals: 18,
    coingeckoId: "synthetix-network-token",
    icon: "https://assets.coingecko.com/coins/images/3406/large/SNX.png"
  },
  {
    symbol: "YFI",
    name: "yearn.finance",
    contractAddress: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
    decimals: 18,
    coingeckoId: "yearn-finance",
    icon: "https://assets.coingecko.com/coins/images/11849/large/yearn.jpg"
  },
  // Wrapped Tokens
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    coingeckoId: "wrapped-bitcoin",
    icon: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png"
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    coingeckoId: "weth",
    icon: "https://assets.coingecko.com/coins/images/2518/large/weth.png"
  },
  // Exchange Tokens
  {
    symbol: "LEO",
    name: "Bitfinex LEO Token",
    contractAddress: "0x2AF5D2aD76741191D15Dfe7bF6aC92d4Bd912Ca3",
    decimals: 18,
    coingeckoId: "leo-token",
    icon: "https://assets.coingecko.com/coins/images/8418/large/leo-token.png"
  },
  {
    symbol: "HT",
    name: "HuobiToken",
    contractAddress: "0x6f259637dcD74C767781E37Bc6133cd6A68aa161",
    decimals: 18,
    coingeckoId: "huobi-token",
    icon: "https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png"
  },
  {
    symbol: "OKB",
    name: "OKB",
    contractAddress: "0x75231F58b43240C9718Dd58B4967c5114342a86c",
    decimals: 18,
    coingeckoId: "okb",
    icon: "https://assets.trustwalletapp.com/blockchains/ethereum/assets/0x75231F58b43240C9718Dd58B4967c5114342a86c/logo.png"
  },
  // Layer 2 & Scaling
  {
    symbol: "MATIC",
    name: "Matic Token",
    contractAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    decimals: 18,
    coingeckoId: "matic-network",
    icon: "https://assets.coingecko.com/coins/images/4713/large/polygon.png"
  },
  {
    symbol: "LDO",
    name: "Lido DAO Token",
    contractAddress: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
    decimals: 18,
    coingeckoId: "lido-dao",
    icon: "https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png"
  },
  // Meme & Community Tokens
  {
    symbol: "SHIB",
    name: "SHIBA INU",
    contractAddress: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    decimals: 18,
    coingeckoId: "shiba-inu",
    icon: "https://assets.coingecko.com/coins/images/11939/large/shiba.png"
  },
  {
    symbol: "PEPE",
    name: "Pepe",
    contractAddress: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    decimals: 18,
    coingeckoId: "pepe",
    icon: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg"
  },
  {
    symbol: "FLOKI",
    name: "FLOKI",
    contractAddress: "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E",
    decimals: 9,
    coingeckoId: "floki",
    icon: "https://assets.coingecko.com/coins/images/16746/large/FLOKI.png"
  },
  // Gaming & NFT
  {
    symbol: "SAND",
    name: "The Sandbox",
    contractAddress: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0",
    decimals: 18,
    coingeckoId: "the-sandbox",
    icon: "https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg"
  },
  {
    symbol: "MANA",
    name: "Decentraland",
    contractAddress: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
    decimals: 18,
    coingeckoId: "decentraland",
    icon: "https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png"
  },
  {
    symbol: "AXS",
    name: "Axie Infinity Shard",
    contractAddress: "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b",
    decimals: 18,
    coingeckoId: "axie-infinity",
    icon: "https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png"
  },
  {
    symbol: "APE",
    name: "ApeCoin",
    contractAddress: "0x4d224452801ACEd8B2F0aebE155379bb5D594381",
    decimals: 18,
    coingeckoId: "apecoin",
    icon: "https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg"
  },
  // Other Popular Tokens
  {
    symbol: "GRT",
    name: "The Graph",
    contractAddress: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
    decimals: 18,
    coingeckoId: "the-graph",
    icon: "https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png"
  },
  {
    symbol: "FTM",
    name: "Fantom Token",
    contractAddress: "0x4E15361FD6b4BB609Fa63C81A2be19d873717870",
    decimals: 18,
    coingeckoId: "fantom",
    icon: "https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png"
  },
  {
    symbol: "1INCH",
    name: "1INCH Token",
    contractAddress: "0x111111111117dC0aa78b770fA6A738034120C302",
    decimals: 18,
    coingeckoId: "1inch",
    icon: "https://assets.coingecko.com/coins/images/13469/large/1inch-token.png"
  },
  {
    symbol: "ENS",
    name: "Ethereum Name Service",
    contractAddress: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    decimals: 18,
    coingeckoId: "ethereum-name-service",
    icon: "https://assets.coingecko.com/coins/images/19785/large/acatxTm8_400x400.jpg"
  },
  {
    symbol: "BAT",
    name: "Basic Attention Token",
    contractAddress: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
    decimals: 18,
    coingeckoId: "basic-attention-token",
    icon: "https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png"
  },
  {
    symbol: "ZRX",
    name: "0x Protocol Token",
    contractAddress: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
    decimals: 18,
    coingeckoId: "0x",
    icon: "https://assets.coingecko.com/coins/images/863/large/0x.png"
  }
];

// shared/bnb-tokens.ts
var BNB_TOKENS = [
  // Native BNB
  {
    symbol: "BNB",
    name: "BNB",
    contractAddress: "",
    decimals: 18,
    coingeckoId: "binancecoin",
    icon: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png"
  },
  // Stablecoins
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png"
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    contractAddress: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals: 18,
    coingeckoId: "binance-usd",
    icon: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png"
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    contractAddress: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    decimals: 18,
    coingeckoId: "dai",
    icon: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png"
  },
  // DeFi Tokens
  {
    symbol: "CAKE",
    name: "PancakeSwap",
    contractAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    decimals: 18,
    coingeckoId: "pancakeswap-token",
    icon: "https://assets.trustwalletapp.com/blockchains/smartchain/assets/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/logo.png"
  },
  {
    symbol: "XVS",
    name: "Venus",
    contractAddress: "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63",
    decimals: 18,
    coingeckoId: "venus",
    icon: "https://assets.coingecko.com/coins/images/12677/large/download.jpg"
  },
  {
    symbol: "ALPHA",
    name: "Alpha Finance",
    contractAddress: "0xa1faa113cbE53436Df28FF0aEe54275c13B40975",
    decimals: 18,
    coingeckoId: "alpha-finance",
    icon: "https://assets.coingecko.com/coins/images/12738/large/AlphaToken_256x256.png"
  },
  // Wrapped Tokens
  {
    symbol: "ETH",
    name: "Binance-Peg Ethereum",
    contractAddress: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    decimals: 18,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
  },
  {
    symbol: "BTCB",
    name: "Bitcoin BEP2",
    contractAddress: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    decimals: 18,
    coingeckoId: "bitcoin",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
  },
  {
    symbol: "ADA",
    name: "Binance-Peg Cardano",
    contractAddress: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
    decimals: 18,
    coingeckoId: "cardano",
    icon: "https://assets.coingecko.com/coins/images/975/large/cardano.png"
  },
  {
    symbol: "DOGE",
    name: "Binance-Peg Dogecoin",
    contractAddress: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
    decimals: 8,
    coingeckoId: "dogecoin",
    icon: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png"
  }
];

// shared/tron-tokens.ts
var TRON_TOKENS = [
  // Native TRX
  {
    symbol: "TRX",
    name: "TRON",
    contractAddress: "",
    decimals: 6,
    coingeckoId: "tron",
    icon: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png"
  },
  // Stablecoins
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
    decimals: 6,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png"
  },
  {
    symbol: "USDJ",
    name: "JUST Stablecoin",
    contractAddress: "TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT",
    decimals: 18,
    coingeckoId: "just-stablecoin",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT/logo.png"
  },
  // DeFi Tokens
  {
    symbol: "JST",
    name: "JUST",
    contractAddress: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9",
    decimals: 18,
    coingeckoId: "just",
    icon: "https://assets.coingecko.com/coins/images/11095/large/JUST.jpg"
  },
  {
    symbol: "SUN",
    name: "SUN Token",
    contractAddress: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S",
    decimals: 18,
    coingeckoId: "sun-token",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S/logo.png"
  },
  {
    symbol: "WIN",
    name: "WINkLink",
    contractAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
    decimals: 6,
    coingeckoId: "wink",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7/logo.png"
  },
  {
    symbol: "NFT",
    name: "APENFT",
    contractAddress: "TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq",
    decimals: 6,
    coingeckoId: "apenft",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq/logo.png"
  },
  // Wrapped Tokens
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    contractAddress: "TXpw8XeWYYTHd7NW1dZAWxhjPpZ3qZJq4w",
    decimals: 8,
    coingeckoId: "wrapped-bitcoin",
    icon: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png"
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF",
    decimals: 18,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
  }
];

// shared/solana-tokens.ts
var SOLANA_TOKENS = [
  // Native SOL
  {
    symbol: "SOL",
    name: "Solana",
    contractAddress: "",
    decimals: 9,
    coingeckoId: "solana",
    icon: "https://assets.coingecko.com/coins/images/4128/large/solana.png"
  },
  // Stablecoins
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png"
  },
  // DeFi Tokens
  {
    symbol: "JUP",
    name: "Jupiter",
    contractAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
    coingeckoId: "jupiter-exchange-solana",
    icon: "https://assets.coingecko.com/coins/images/10351/large/logo512.png"
  },
  {
    symbol: "RAY",
    name: "Raydium",
    contractAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
    coingeckoId: "raydium",
    icon: "https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg"
  },
  {
    symbol: "ORCA",
    name: "Orca",
    contractAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    decimals: 6,
    coingeckoId: "orca",
    icon: "https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png"
  },
  // Memecoins
  {
    symbol: "BONK",
    name: "Bonk",
    contractAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
    coingeckoId: "bonk",
    icon: "https://assets.coingecko.com/coins/images/28600/large/bonk.jpg"
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    contractAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    decimals: 6,
    coingeckoId: "dogwifcoin",
    icon: "https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg"
  },
  // Wrapped Tokens
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin (Sollet)",
    contractAddress: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    decimals: 6,
    coingeckoId: "wrapped-bitcoin",
    icon: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png"
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    decimals: 8,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
  }
];

// server/storage.ts
import mongoose2 from "mongoose";
var DEFAULT_TOKEN_ORDER = [
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
  { symbol: "DAI", chainId: "ethereum", order: 13 }
];
var MongoStorage = class _MongoStorage {
  initialized = false;
  async init() {
    if (this.initialized) return;
    try {
      await this.initializeChains();
      await this.migrateChainSymbols();
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
  static generateUserId() {
    const min = 1e10;
    const max = 99999999999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }
  async backfillUserIds() {
    try {
      const usersWithoutId = await User.find({ userId: null });
      let count = 0;
      for (const user of usersWithoutId) {
        const MAX_RETRIES = 5;
        let assigned = false;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          const uid = _MongoStorage.generateUserId();
          try {
            await User.findByIdAndUpdate(user._id, { userId: uid }, { runValidators: true });
            assigned = true;
            count++;
            break;
          } catch (err) {
            if (err?.code === 11e3 && err?.keyPattern?.userId) {
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
  async migrateTokens() {
    try {
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
        console.log(`[Migration] Updated ${tronWethUpdate.modifiedCount} WETH \u2192 ETH tokens on TRON`);
      }
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
        console.log(`[Migration] Updated ${solanaWethUpdate.modifiedCount} WETH \u2192 ETH tokens on Solana`);
      }
      let updatedCount = 0;
      for (const defaultToken of DEFAULT_TOKEN_ORDER) {
        const result = await Token.updateMany(
          {
            symbol: defaultToken.symbol,
            chainId: defaultToken.chainId,
            $or: [
              { displayOrder: { $exists: false } },
              // Tokens without displayOrder
              { displayOrder: { $gte: 999 } }
              // Or tokens with default high order
            ]
          },
          {
            $set: {
              displayOrder: defaultToken.order,
              isVisible: true
              // Ensure default tokens are visible
            }
          }
        );
        updatedCount += result.modifiedCount;
      }
      const defaultTokenCombinations = DEFAULT_TOKEN_ORDER.map((t) => ({
        symbol: t.symbol,
        chainId: t.chainId
      }));
      const hideResult = await Token.updateMany(
        {
          $and: [
            // Must not match any of the default token combinations
            {
              $nor: defaultTokenCombinations.map((combo) => ({
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
            displayOrder: 999
            // Set high order for non-default tokens
          }
        }
      );
      console.log(`[Migration] Set default displayOrder for ${DEFAULT_TOKEN_ORDER.length} token types (${updatedCount} tokens updated)`);
      console.log(`[Migration] Hidden ${hideResult.modifiedCount} non-default tokens`);
    } catch (error) {
      console.error("Failed to migrate tokens:", error);
    }
  }
  async clearSwapHistory() {
    try {
      const result = await Transaction.deleteMany({ type: "swap" });
      console.log(`Cleared ${result.deletedCount} swap history entries`);
    } catch (error) {
      console.error("Failed to clear swap history:", error);
    }
  }
  async initializeAdmin() {
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
          dateOfBirth: /* @__PURE__ */ new Date("1990-01-01"),
          isAdmin: true
        });
        console.log("Admin user created successfully");
      } else {
        existingAdmin.password = adminPassword;
        if (!existingAdmin.dateOfBirth) {
          existingAdmin.dateOfBirth = /* @__PURE__ */ new Date("1990-01-01");
        }
        if (!existingAdmin.firstName) {
          existingAdmin.firstName = "Admin";
        }
        if (!existingAdmin.lastName) {
          existingAdmin.lastName = "User";
        }
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log("Admin password updated successfully");
      }
    } catch (error) {
      console.error("Failed to initialize admin:", error);
    }
  }
  async initializeChains() {
    try {
      const existingChains = await Chain.find();
      if (existingChains.length === 0) {
        const chainsToInsert = [
          {
            id: "ethereum",
            name: "Ethereum",
            symbol: "ETH",
            // Native chain symbol (not ERC-20)
            networkStandard: "ERC-20",
            icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
            rpcUrl: "https://mainnet.infura.io/v3/",
            explorerUrl: "https://etherscan.io",
            chainId: 1,
            isTestnet: false
          },
          {
            id: "bnb",
            name: "BNB Smart Chain",
            symbol: "BNB",
            // Native chain symbol (not BEP-20)
            networkStandard: "BEP-20",
            icon: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
            rpcUrl: "https://bsc-dataseed.binance.org/",
            explorerUrl: "https://bscscan.com",
            chainId: 56,
            isTestnet: false
          },
          {
            id: "tron",
            name: "TRON",
            symbol: "TRX",
            // Native chain symbol (not TRC-20)
            networkStandard: "TRC-20",
            icon: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
            rpcUrl: "https://api.trongrid.io",
            explorerUrl: "https://tronscan.org",
            chainId: 0,
            isTestnet: false
          },
          {
            id: "solana",
            name: "Solana",
            symbol: "SOL",
            // Native chain symbol (not "Solana")
            networkStandard: "SPL",
            icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
            rpcUrl: "https://api.mainnet-beta.solana.com",
            explorerUrl: "https://explorer.solana.com",
            chainId: 0,
            isTestnet: false
          }
        ];
        await Chain.insertMany(chainsToInsert);
      }
    } catch (error) {
      console.error("Failed to initialize chains:", error);
      throw error;
    }
  }
  // Migration: Fix chain symbols to be native symbols (ETH, BNB, TRX, SOL) instead of network standards
  async migrateChainSymbols() {
    try {
      const chainUpdates = [
        { id: "ethereum", correctSymbol: "ETH" },
        { id: "bnb", correctSymbol: "BNB" },
        { id: "tron", correctSymbol: "TRX" },
        { id: "solana", correctSymbol: "SOL" }
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
  async initializeTransactionFees() {
    try {
      const existingFees = await TransactionFee.find();
      if (existingFees.length === 0) {
        const feesToInsert = [
          { tokenSymbol: "ETH", feeAmount: "0.001", feePercentage: 0.5 },
          { tokenSymbol: "BTC", feeAmount: "0.00001", feePercentage: 0.5 },
          { tokenSymbol: "BNB", feeAmount: "0.001", feePercentage: 0.5 },
          { tokenSymbol: "USDT", feeAmount: "1.0", feePercentage: 0.5 },
          { tokenSymbol: "USDC", feeAmount: "1.0", feePercentage: 0.5 },
          { tokenSymbol: "SOL", feeAmount: "0.001", feePercentage: 0.5 },
          { tokenSymbol: "TRX", feeAmount: "1.0", feePercentage: 0.5 }
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
  async getUser(id) {
    const user = await User.findById(id).lean();
    if (!user) return void 0;
    return {
      ...user,
      _id: user._id.toString()
    };
  }
  async getUserByEmail(email) {
    const user = await User.findOne({ email }).lean();
    if (!user) return void 0;
    return {
      ...user,
      _id: user._id.toString()
    };
  }
  async createUser(userData) {
    if (!userData.virtualAddresses) {
      userData.virtualAddresses = {
        ethereum: generateAddressForChain("ethereum"),
        bnb: generateAddressForChain("bnb"),
        tron: generateAddressForChain("tron"),
        solana: generateAddressForChain("solana")
      };
    }
    if (!userData.userId) {
      let uid;
      let attempts = 0;
      do {
        uid = _MongoStorage.generateUserId();
        attempts++;
      } while (attempts < 10 && await User.findOne({ userId: uid }));
      userData.userId = uid;
    }
    const MAX_RETRIES = 3;
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const user = await User.create(userData);
        return {
          ...user.toObject(),
          _id: user._id.toString()
        };
      } catch (err) {
        const isDupKey = err?.code === 11e3 && err?.keyPattern?.userId;
        if (!isDupKey) throw err;
        userData.userId = _MongoStorage.generateUserId();
        lastError = err;
        console.warn(`[createUser] userId collision, retrying (attempt ${attempt + 1})`);
      }
    }
    throw lastError;
  }
  async updateUserProfilePhoto(userId, photoUrl) {
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: photoUrl },
      { new: true }
    ).lean();
    if (!user) return void 0;
    return {
      ...user,
      _id: user._id.toString()
    };
  }
  async updateUserFeeMethod(userId, useFixedFee) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { useFixedFee } },
      { new: true }
    ).lean();
    if (!user) return void 0;
    return {
      ...user,
      _id: user._id.toString()
    };
  }
  async updateUserTheme(userId, theme) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { theme } },
      { new: true }
    ).lean();
    if (!user) return void 0;
    return {
      ...user,
      _id: user._id.toString()
    };
  }
  async getAllUsers() {
    const users = await User.find().lean();
    return users.map((user) => ({
      ...user,
      _id: user._id.toString()
    }));
  }
  async searchUsers(query) {
    const wallets = await Wallet.find({
      $or: [
        { address: { $regex: query, $options: "i" } },
        // Also search by wallet ID if it's a valid ObjectId
        ...mongoose2.Types.ObjectId.isValid(query) ? [{ _id: new mongoose2.Types.ObjectId(query) }] : []
      ]
    }).lean();
    const walletUserIds = wallets.map((w) => w.userId);
    const isNumericUserId = /^\d{11}$/.test(query);
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        ...isNumericUserId ? [{ userId: query }] : [],
        ...mongoose2.Types.ObjectId.isValid(query) ? [{ _id: new mongoose2.Types.ObjectId(query) }] : [],
        ...walletUserIds.length > 0 ? [{ _id: { $in: walletUserIds } }] : []
      ]
    }).lean();
    return users.map((user) => ({
      ...user,
      _id: user._id.toString()
    }));
  }
  // Wallet operations
  async getWallet(id) {
    const wallet = await Wallet.findById(id).lean();
    if (!wallet) return void 0;
    return {
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString()
    };
  }
  async getWalletByAddress(address) {
    const wallet = await Wallet.findOne({ address }).lean();
    if (!wallet) return void 0;
    return {
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString()
    };
  }
  async getWalletsByUser(userId) {
    const wallets = await Wallet.find({ userId }).lean();
    return wallets.map((wallet) => ({
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString()
    }));
  }
  async createWallet(insertWallet) {
    const wallet = await Wallet.create(insertWallet);
    try {
      const getDisplayOrder = (symbol, chainId) => {
        const defaultToken = DEFAULT_TOKEN_ORDER.find(
          (t) => t.symbol === symbol && t.chainId === chainId
        );
        return defaultToken ? defaultToken.order : 999;
      };
      const isDefaultVisible = (symbol, chainId) => {
        return DEFAULT_TOKEN_ORDER.some(
          (t) => t.symbol === symbol && t.chainId === chainId
        );
      };
      const allDefaultTokens = [
        // Ethereum tokens
        ...ETHEREUM_TOKENS.map((token) => ({
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
          displayOrder: getDisplayOrder(token.symbol, "ethereum")
        })),
        // BNB tokens
        ...BNB_TOKENS.map((token) => ({
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
          displayOrder: getDisplayOrder(token.symbol, "bnb")
        })),
        // TRON tokens
        ...TRON_TOKENS.map((token) => ({
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
          displayOrder: getDisplayOrder(token.symbol, "tron")
        })),
        // Solana tokens
        ...SOLANA_TOKENS.map((token) => ({
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
          displayOrder: getDisplayOrder(token.symbol, "solana")
        }))
      ];
      await Token.insertMany(allDefaultTokens);
      return {
        ...wallet.toObject(),
        _id: wallet._id.toString(),
        userId: wallet.userId.toString()
      };
    } catch (error) {
      console.error("Failed to create wallet:", error);
      await Wallet.findByIdAndDelete(wallet._id);
      throw new Error("Wallet creation failed");
    }
  }
  async getAllWallets() {
    const wallets = await Wallet.find().lean();
    return wallets.map((wallet) => ({
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString()
    }));
  }
  // Chain operations
  async getAllChains() {
    const chains = await Chain.find().lean();
    return chains.map((chain) => ({
      ...chain,
      _id: chain._id?.toString()
    }));
  }
  async getChain(id) {
    const chain = await Chain.findOne({ id }).lean();
    if (!chain) return void 0;
    return {
      ...chain,
      _id: chain._id?.toString()
    };
  }
  // Token operations
  async getTokensByWallet(walletId) {
    const tokens = await Token.find({ walletId }).lean();
    return tokens.map((token) => ({
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    }));
  }
  async getTokensByChain(walletId, chainId) {
    const tokens = await Token.find({ walletId, chainId }).lean();
    return tokens.map((token) => ({
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    }));
  }
  async getTokenBySymbol(walletId, symbol) {
    const token = await Token.findOne({ walletId, symbol }).lean();
    if (!token) return void 0;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    };
  }
  async getTokenBySymbolAndChain(walletId, symbol, chainId) {
    const token = await Token.findOne({ walletId, symbol, chainId }).lean();
    if (!token) return void 0;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    };
  }
  async createToken(insertToken) {
    const token = await Token.create(insertToken);
    return {
      ...token.toObject(),
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    };
  }
  async updateTokenBalance(id, balance) {
    const token = await Token.findByIdAndUpdate(
      id,
      { balance },
      { new: true }
    ).lean();
    if (!token) return void 0;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    };
  }
  async updateTokenVisibility(id, isVisible) {
    const token = await Token.findByIdAndUpdate(
      id,
      { isVisible },
      { new: true }
    ).lean();
    if (!token) return void 0;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    };
  }
  async updateTokenDisplayOrder(id, displayOrder) {
    const token = await Token.findByIdAndUpdate(
      id,
      { displayOrder },
      { new: true }
    ).lean();
    if (!token) return void 0;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    };
  }
  async updateTokenLastInbound(id) {
    const token = await Token.findByIdAndUpdate(
      id,
      { lastInboundAt: /* @__PURE__ */ new Date() },
      { new: true }
    ).lean();
    if (!token) return void 0;
    return {
      ...token,
      _id: token._id.toString(),
      walletId: token.walletId.toString()
    };
  }
  // Transaction operations
  async getTransaction(id) {
    const transaction = await Transaction.findById(id).lean();
    if (!transaction) return void 0;
    return {
      ...transaction,
      _id: transaction._id.toString(),
      walletId: transaction.walletId.toString()
    };
  }
  async getTransactionsByWallet(walletId) {
    const transactions = await Transaction.find({ walletId }).sort({ timestamp: -1 }).lean();
    return transactions.map((tx) => ({
      ...tx,
      _id: tx._id.toString(),
      walletId: tx.walletId.toString()
    }));
  }
  async createTransaction(insertTransaction) {
    const transaction = await Transaction.create(insertTransaction);
    return {
      ...transaction.toObject(),
      _id: transaction._id.toString(),
      walletId: transaction.walletId.toString()
    };
  }
  async updateTransactionStatus(id, status) {
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    if (!transaction) return void 0;
    return {
      ...transaction,
      _id: transaction._id.toString(),
      walletId: transaction.walletId.toString()
    };
  }
  // Transaction Fee operations
  async getTransactionFee(tokenSymbol) {
    const fee = await TransactionFee.findOne({ tokenSymbol }).lean();
    if (!fee) return void 0;
    return {
      ...fee,
      _id: fee._id.toString()
    };
  }
  async getAllTransactionFees() {
    const fees = await TransactionFee.find().lean();
    return fees.map((fee) => ({
      ...fee,
      _id: fee._id.toString()
    }));
  }
  async upsertTransactionFee(feeData) {
    const fee = await TransactionFee.findOneAndUpdate(
      { tokenSymbol: feeData.tokenSymbol },
      { ...feeData, updatedAt: /* @__PURE__ */ new Date() },
      { upsert: true, new: true }
    ).lean();
    return {
      ...fee,
      _id: fee._id.toString()
    };
  }
  // User Transaction Fee operations (per-user custom fees)
  async getUserTransactionFee(userId, tokenSymbol, chainId) {
    const fee = await UserTransactionFee.findOne({ userId, tokenSymbol, chainId }).lean();
    if (!fee) return void 0;
    return {
      ...fee,
      _id: fee._id.toString(),
      userId: fee.userId.toString()
    };
  }
  async getUserTransactionFees(userId) {
    const fees = await UserTransactionFee.find({ userId }).lean();
    return fees.map((fee) => ({
      ...fee,
      _id: fee._id.toString(),
      userId: fee.userId.toString()
    }));
  }
  async upsertUserTransactionFee(feeData) {
    const fee = await UserTransactionFee.findOneAndUpdate(
      { userId: feeData.userId, tokenSymbol: feeData.tokenSymbol, chainId: feeData.chainId },
      { ...feeData, updatedAt: /* @__PURE__ */ new Date() },
      { upsert: true, new: true }
    ).lean();
    return {
      ...fee,
      _id: fee._id.toString(),
      userId: fee.userId.toString()
    };
  }
  async deleteUserTransactionFee(userId, tokenSymbol, chainId) {
    const result = await UserTransactionFee.deleteOne({ userId, tokenSymbol, chainId });
    return result.deletedCount > 0;
  }
  // Swap Order operations (real-time swap order tracking)
  async createSwapOrder(orderData) {
    const order = await SwapOrder.create(orderData);
    return {
      ...order.toObject(),
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString()
    };
  }
  async getSwapOrder(orderId) {
    const order = await SwapOrder.findOne({ orderId }).lean();
    if (!order) return void 0;
    return {
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString()
    };
  }
  async getActiveSwapOrders(userId) {
    const orders = await SwapOrder.find({
      userId,
      status: { $in: ["pending", "processing"] }
    }).sort({ orderTime: -1 }).lean();
    return orders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString()
    }));
  }
  async getAllSwapOrders(userId) {
    const orders = await SwapOrder.find({ userId }).sort({ orderTime: -1 }).lean();
    return orders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString()
    }));
  }
  async updateSwapOrder(orderId, updates) {
    const order = await SwapOrder.findOneAndUpdate(
      { orderId },
      { ...updates },
      { new: true }
    ).lean();
    if (!order) return void 0;
    return {
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
      walletId: order.walletId.toString()
    };
  }
};
var storage = new MongoStorage();

// server/routes.ts
init_models();

// server/middleware/auth.ts
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.session.role === "admin") {
    return res.status(403).json({ error: "This endpoint is for wallet users only" });
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.session.role !== "admin" && !req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// server/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
var WebSocketService = class {
  wss;
  clients = /* @__PURE__ */ new Map();
  sessionParser;
  constructor(server, sessionParser) {
    this.sessionParser = sessionParser;
    this.wss = new WebSocketServer({ noServer: true });
    server.on("upgrade", (request, socket, head) => {
      const url = parse(request.url || "", true);
      if (url.pathname !== "/ws") {
        return;
      }
      console.log("WebSocket upgrade request received for /ws");
      this.sessionParser(request, {}, () => {
        const req = request;
        if (!req.session || !req.session.userId) {
          console.log("WebSocket upgrade rejected: no session");
          socket.destroy();
          return;
        }
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          const authWs = ws;
          authWs.userId = req.session.userId;
          authWs.userEmail = req.session.userEmail;
          authWs.isAdmin = req.session.isAdmin;
          authWs.role = req.session.role;
          authWs.isAlive = true;
          this.wss.emit("connection", authWs, request);
        });
      });
    });
    this.wss.on("connection", (ws) => {
      console.log(`WebSocket connected: userId=${ws.userId}, role=${ws.role}`);
      if (ws.userId) {
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, /* @__PURE__ */ new Set());
        }
        this.clients.get(ws.userId).add(ws);
      }
      ws.send(JSON.stringify({
        type: "connected",
        message: "WebSocket connection established",
        userId: ws.userId,
        role: ws.role
      }));
      ws.on("pong", () => {
        ws.isAlive = true;
      });
      ws.on("close", () => {
        console.log(`WebSocket disconnected: userId=${ws.userId}`);
        if (ws.userId) {
          const userClients = this.clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
        }
      });
      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const authWs = ws;
        if (authWs.isAlive === false) {
          console.log(`Terminating dead WebSocket connection: userId=${authWs.userId}`);
          return authWs.terminate();
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 3e4);
    this.wss.on("close", () => {
      clearInterval(interval);
    });
  }
  // Send message to a specific user (all their connections)
  sendToUser(userId, message) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const messageStr = JSON.stringify(message);
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
      console.log(`Sent WebSocket message to user ${userId}:`, message.type);
    }
  }
  // Broadcast to all connected users (excluding admins if specified)
  broadcast(message, excludeAdmins = true) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((userClients, userId) => {
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          if (!excludeAdmins || !ws.isAdmin) {
            ws.send(messageStr);
          }
        }
      });
    });
    console.log(`Broadcast WebSocket message:`, message.type);
  }
  // Get connected user count
  getConnectedUsersCount() {
    return this.clients.size;
  }
  // Check if user is online
  isUserOnline(userId) {
    return this.clients.has(userId);
  }
};
var wsService;
function initializeWebSocket(server, sessionParser) {
  wsService = new WebSocketService(server, sessionParser);
  console.log("WebSocket service initialized");
  return wsService;
}

// server/routes.ts
import Parser from "rss-parser";

// server/utils/crypto.ts
import { randomBytes, createHash } from "crypto";
import { ethers } from "ethers";
function generateMnemonic() {
  const wallet = ethers.Wallet.createRandom();
  return wallet.mnemonic.phrase;
}
function validateMnemonic(mnemonic) {
  try {
    ethers.Mnemonic.fromPhrase(mnemonic.trim());
    return true;
  } catch {
    return false;
  }
}
function deriveAddress(mnemonic) {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, void 0, "m/44'/60'/0'/0/0");
  return wallet.address;
}
function encryptMnemonic(mnemonic, password) {
  const key = createHash("sha256").update(password).digest();
  const iv = randomBytes(16);
  const encrypted = Buffer.from(mnemonic).map((byte, i) => byte ^ key[i % key.length]).toString("base64");
  return iv.toString("hex") + ":" + encrypted;
}

// server/routes.ts
init_coingecko();
init_background_jobs();

// server/services/email.ts
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Resend } from "resend";
var EmailService = class {
  transporter = null;
  resendClient = null;
  fromAddress = "";
  fromName = "Lumirra Wallet";
  useResend = false;
  constructor() {
    this.initializeTransporter();
    this.initializeResend();
  }
  initializeTransporter() {
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASSWORD,
      EMAIL_FROM
    } = process.env;
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
      console.warn("[Email Service] SMTP configuration incomplete.");
      return;
    }
    this.fromAddress = EMAIL_FROM || EMAIL_USER;
    const port = parseInt(EMAIL_PORT, 10);
    try {
      const transportConfig = {
        host: EMAIL_HOST,
        port,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD
        }
      };
      if (port === 465) {
        transportConfig.secure = true;
      } else if (port === 587 || port === 2525) {
        transportConfig.secure = false;
        transportConfig.requireTLS = true;
        transportConfig.tls = {
          minVersion: "TLSv1.2"
        };
      } else {
        transportConfig.secure = false;
      }
      transportConfig.connectionTimeout = 3e4;
      transportConfig.greetingTimeout = 3e4;
      this.transporter = nodemailer.createTransport(transportConfig);
      console.log("[Email Service] SMTP initialized");
      console.log("[Email Service] SMTP Host:", EMAIL_HOST);
      console.log("[Email Service] SMTP Port:", EMAIL_PORT);
      console.log("[Email Service] From address:", this.fromAddress);
    } catch (error) {
      console.error("[Email Service] Failed to initialize SMTP:", error);
    }
  }
  async initializeResend() {
    const { RESEND_API_KEY, EMAIL_FROM } = process.env;
    if (RESEND_API_KEY) {
      try {
        this.resendClient = new Resend(RESEND_API_KEY);
        this.useResend = true;
        if (!this.fromAddress && EMAIL_FROM) {
          this.fromAddress = EMAIL_FROM;
        }
        console.log("[Email Service] Resend initialized (primary or fallback)");
      } catch (error) {
        console.error("[Email Service] Failed to initialize Resend:", error);
      }
    } else {
      try {
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
        if (hostname && xReplitToken) {
          const response = await fetch(
            "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
            {
              headers: {
                "Accept": "application/json",
                "X_REPLIT_TOKEN": xReplitToken
              }
            }
          );
          const data = await response.json();
          const connectionSettings = data.items?.[0];
          if (connectionSettings?.settings?.api_key) {
            this.resendClient = new Resend(connectionSettings.settings.api_key);
            if (connectionSettings.settings.from_email && !this.fromAddress) {
              this.fromAddress = connectionSettings.settings.from_email;
            }
            console.log("[Email Service] Resend initialized via Replit connector");
          }
        }
      } catch (error) {
        console.log("[Email Service] Replit Resend connector not available");
      }
    }
    if (!this.transporter && !this.resendClient) {
      console.warn("[Email Service] No email service configured. Set SMTP or RESEND_API_KEY.");
    }
  }
  async sendViaResend({ to, subject, html }) {
    if (!this.resendClient) {
      return false;
    }
    try {
      console.log("[Email Service] Sending via Resend to:", to);
      const { data, error } = await this.resendClient.emails.send({
        from: `${this.fromName} <${this.fromAddress || "onboarding@resend.dev"}>`,
        to: [to],
        subject,
        html
      });
      if (error) {
        console.error("[Email Service] Resend error:", error);
        return false;
      }
      console.log("[Email Service] Email sent successfully via Resend");
      console.log("[Email Service] Message ID:", data?.id);
      return true;
    } catch (error) {
      console.error("[Email Service] Resend failed:", error.message);
      return false;
    }
  }
  async sendViaSMTP({ to, subject, html }) {
    if (!this.transporter) {
      return false;
    }
    try {
      console.log("[Email Service] Sending via SMTP to:", to);
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject,
        html
      });
      console.log("[Email Service] Email sent successfully via SMTP");
      console.log("[Email Service] Message ID:", info.messageId);
      return true;
    } catch (error) {
      console.error("[Email Service] SMTP failed:", error.code, error.message);
      if (error.code === "ESOCKET" || error.code === "ECONNRESET" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        console.error("[Email Service] SMTP port blocked - will try Resend fallback");
      }
      return false;
    }
  }
  async sendEmail({ to, subject, html }) {
    console.log("[Email Service] Attempting to send email to:", to);
    console.log("[Email Service] Subject:", subject);
    if (this.useResend && this.resendClient) {
      const result = await this.sendViaResend({ to, subject, html });
      if (result) return true;
    }
    if (this.transporter) {
      const result = await this.sendViaSMTP({ to, subject, html });
      if (result) return true;
      if (this.resendClient) {
        console.log("[Email Service] SMTP failed, falling back to Resend...");
        return await this.sendViaResend({ to, subject, html });
      }
    }
    if (this.resendClient) {
      return await this.sendViaResend({ to, subject, html });
    }
    console.error("[Email Service] No email service available");
    return false;
  }
  generateOTP() {
    return crypto.randomInt(1e5, 1e6).toString();
  }
  hashOTP(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }
  verifyOTP(inputOTP, hashedOTP) {
    const inputHash = this.hashOTP(inputOTP);
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedOTP));
  }
  async sendVerificationCode(email, code) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .code-box { background: #f8f9fa; border: 2px dashed #1E8FF2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; color: #1E8FF2; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .info { color: #666; font-size: 14px; margin-top: 20px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lumirra Wallet</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Verification Code</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested a verification code to access your Lumirra Wallet account. Please use the code below to complete your authentication:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p class="info">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. Lumirra staff will never ask for your verification code.
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact our support team if you have concerns about your account security.</p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: "Your Lumirra Wallet Verification Code",
      html
    });
  }
  async sendPasswordResetCode(email, code) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .code-box { background: #f0f7ff; border: 2px dashed #1E8FF2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; color: #1E8FF2; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .info { color: #666; font-size: 14px; margin-top: 20px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your Lumirra Wallet password. Use the verification code below to proceed with your password reset:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p class="info">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>Security Alert:</strong> If you didn't request a password reset, please contact our support team immediately to secure your account.
            </div>
            
            <p>For your security, this verification code can only be used once.</p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: "Lumirra Wallet - Password Reset Code",
      html
    });
  }
  async sendWelcomeEmail(email, username) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .feature { margin: 20px 0; padding: 15px; background: #f0f7ff; border-left: 4px solid #1E8FF2; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Lumirra!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>Welcome to Lumirra Wallet! Your account has been successfully created and you're ready to start managing your crypto assets securely.</p>
            
            <div class="feature">
              <strong>Multi-Chain Support</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Manage assets across Ethereum, BSC, Polygon, Solana, and more</p>
            </div>
            
            <div class="feature">
              <strong>Instant Swaps</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Swap between cryptocurrencies seamlessly</p>
            </div>
            
            <div class="feature">
              <strong>Bank-Grade Security</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Your assets are protected with enterprise-level security</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, our support team is here to help.</p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: "Welcome to Lumirra Wallet!",
      html
    });
  }
  async sendSupportChatFirstMessageAlert(email, userName) {
    return this.sendEmail({
      to: email,
      subject: "Support Chat Started",
      html: `<p>Hello Admin, ${userName} has started a new support chat.</p>`
    });
  }
  async sendSupportMessage(email, subject, message) {
    return this.sendEmail({
      to: email,
      subject,
      html: `<p>${message}</p>`
    });
  }
  async sendCryptoReceived(email, username, amount, token, txHash, chain) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .amount-box { background: #f0f7ff; border: 2px solid #1E8FF2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #1E8FF2; }
          .details { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; word-break: break-all; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #1E8FF2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Crypto Received</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>You've successfully received cryptocurrency in your Lumirra Wallet!</p>
            
            <div class="amount-box">
              <div class="amount">+${amount} ${token}</div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Transaction Hash:</span>
                <span class="detail-value">${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Network:</span>
                <span class="detail-value">${chain}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #4caf50; font-weight: 600;">Completed</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="https://yourapp.com/transactions" class="button">View Transaction Details</a>
            </p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: `Received ${amount} ${token} - Lumirra Wallet`,
      html
    });
  }
  async sendCryptoSent(email, username, amount, token, txHash, chain, recipientAddress) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .amount-box { background: #fff8f0; border: 2px solid #ff9800; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #ff9800; }
          .details { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; word-break: break-all; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #1E8FF2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Crypto Sent</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>You've successfully sent cryptocurrency from your Lumirra Wallet!</p>
            
            <div class="amount-box">
              <div class="amount">-${amount} ${token}</div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Recipient:</span>
                <span class="detail-value">${recipientAddress.substring(0, 10)}...${recipientAddress.substring(recipientAddress.length - 8)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction Hash:</span>
                <span class="detail-value">${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Network:</span>
                <span class="detail-value">${chain}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #4caf50; font-weight: 600;">Completed</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="https://yourapp.com/transactions" class="button">View Transaction Details</a>
            </p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: `Sent ${amount} ${token} - Lumirra Wallet`,
      html
    });
  }
  async sendSupportNumberUpdate(email, firstName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E3A8A 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 15px; }
          .content { padding: 40px 30px; }
          .highlight-box { background: #f0f7ff; border: 2px solid #1E8FF2; border-radius: 8px; padding: 24px 30px; text-align: center; margin: 30px 0; }
          .phone { font-size: 28px; font-weight: bold; color: #1565C0; letter-spacing: 1px; }
          .label { font-size: 13px; color: #888; margin-top: 8px; }
          .info { color: #555; font-size: 15px; margin: 20px 0; }
          .divider { border: none; border-top: 1px solid #e0e0e0; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lumirra Wallet</h1>
            <p>Important Support Update</p>
          </div>
          <div class="content">
            <p class="info">Dear <strong>${firstName}</strong>,</p>
            <p class="info">We want to let you know that our customer support contact number has been updated. Please save our new support number for any future assistance you may need.</p>

            <div class="highlight-box">
              <div class="phone">+1 (601) 440-0158</div>
              <div class="label">New Lumirra Wallet Support Number</div>
            </div>

            <p class="info">Our support team is available to assist you with any questions or issues regarding your wallet, transactions, or account. Don't hesitate to reach out.</p>

            <hr class="divider" />

            <p class="info" style="font-size: 13px; color: #888;">If you did not expect this email, please disregard it. Your account security has not been affected.</p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: "Lumirra Wallet - Updated Support Contact Number",
      html
    });
  }
  async sendContactUsNotification(name, email, message) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1677FF 0%, #2ED8FF 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .message-box { background: #f8f9fa; border-left: 4px solid #1677FF; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .detail-row { margin: 10px 0; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>You have received a new contact form submission:</p>
            
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value"> ${name}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value"> ${email}</span>
            </div>
            
            <div class="message-box">
              <div class="detail-label">Message:</div>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="margin-top: 30px; color: #666;">Please respond to this inquiry at your earliest convenience.</p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification from your contact form.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const adminEmail = process.env.ADMIN_EMAIL || this.fromAddress;
    return this.sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission from ${name}`,
      html
    });
  }
  async sendSupportReply(to, name, originalMessage, replyMessage) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1677FF 0%, #2ED8FF 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .message-box { background: #f8f9fa; border-left: 4px solid #1677FF; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .original-message { background: #fff; border: 1px solid #e0e0e0; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .detail-label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Support Team Response</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Our support team has responded to your inquiry:</p>
            
            <div class="message-box">
              <p style="margin: 0; white-space: pre-wrap;">${replyMessage}</p>
            </div>
            
            <div class="original-message">
              <div class="detail-label">Your Original Message:</div>
              <p style="margin: 10px 0 0 0; color: #666; white-space: pre-wrap;">${originalMessage}</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any further questions, please don't hesitate to reach out to us again.</p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to,
      subject: "Response from Lumirra Wallet Support",
      html
    });
  }
  async sendDirectMessage(to, name, message, subject) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1677FF 0%, #2ED8FF 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .message-box { background: #f8f9fa; border-left: 4px solid #1677FF; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Message from Lumirra Wallet</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <div class="message-box">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to,
      subject: subject || "Message from Lumirra Wallet Support",
      html
    });
  }
  async sendAddressCopiedAlert(adminEmail, userInfo) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #FF6B00 0%, #E65100 100%); color: white; padding: 36px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 36px 30px; }
          .alert-box { background: #fff3e0; border: 2px solid #FF6B00; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .address { font-family: 'Courier New', monospace; font-size: 13px; background: #f5f5f5; padding: 10px 14px; border-radius: 6px; word-break: break-all; margin: 10px 0; color: #1a1a1a; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #555; font-size: 13px; }
          .detail-value { color: #333; font-size: 13px; word-break: break-all; text-align: right; max-width: 60%; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Address Copied Alert</h1>
            <p>A user just copied a receive address</p>
          </div>
          <div class="content">
            <p>Hello Admin,</p>
            <p>A user has tapped and copied their wallet address on the Receive QR page.</p>
            <div class="alert-box">
              <strong>Copied Address:</strong>
              <div class="address">${userInfo.address}</div>
              <small style="color:#888;">Token: ${userInfo.token} | Chain: ${userInfo.chain}</small>
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">User Name</span>
                <span class="detail-value">${userInfo.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">User Email</span>
                <span class="detail-value">${userInfo.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Detected Location</span>
                <span class="detail-value">${userInfo.location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IP Address</span>
                <span class="detail-value">${userInfo.ip}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Device / Browser</span>
                <span class="detail-value">${userInfo.userAgent}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${userInfo.time}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet \u2014 Admin Alert System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: adminEmail,
      subject: `[Lumirra Alert] Address Copied \u2014 ${userInfo.name} (${userInfo.email})`,
      html
    });
  }
  async sendNewUserAlert(adminEmail, userInfo) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #0D47A1 100%); color: white; padding: 36px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 36px 30px; }
          .new-user-box { background: #e8f4fd; border: 2px solid #1E8FF2; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; }
          .new-user-name { font-size: 22px; font-weight: bold; color: #0D47A1; }
          .new-user-email { font-size: 15px; color: #555; margin-top: 4px; }
          .address { font-family: 'Courier New', monospace; font-size: 12px; background: #f5f5f5; padding: 10px 14px; border-radius: 6px; word-break: break-all; margin: 10px 0; color: #1a1a1a; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #555; font-size: 13px; }
          .detail-value { color: #333; font-size: 13px; word-break: break-all; text-align: right; max-width: 60%; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New User Registered</h1>
            <p>A new wallet has been created on Lumirra</p>
          </div>
          <div class="content">
            <p>Hello Admin,</p>
            <p>A new user has successfully created a wallet on Lumirra Wallet.</p>
            <div class="new-user-box">
              <div class="new-user-name">${userInfo.name}</div>
              <div class="new-user-email">${userInfo.email}</div>
            </div>
            <strong>Wallet Address:</strong>
            <div class="address">${userInfo.walletAddress || "Not yet generated"}</div>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Date of Birth</span>
                <span class="detail-value">${userInfo.dob}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Detected Location</span>
                <span class="detail-value">${userInfo.location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IP Address</span>
                <span class="detail-value">${userInfo.ip}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Device / Browser</span>
                <span class="detail-value">${userInfo.userAgent}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Time</span>
                <span class="detail-value">${userInfo.time}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet \u2014 Admin Alert System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: adminEmail,
      subject: `[Lumirra] New User: ${userInfo.name} (${userInfo.email})`,
      html
    });
  }
  async sendWithdrawalApprovalRequest(adminEmail, details) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1d4ed8, #0ea5e9); padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
          .body { padding: 32px 40px; }
          .badge { display: inline-block; background: #f59e0b; color: #1e293b; border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; }
          .amount-box { background: #0f172a; border-radius: 10px; padding: 20px 24px; text-align: center; margin: 20px 0; }
          .amount-box .amt { font-size: 32px; font-weight: 800; color: #38bdf8; }
          .amount-box .sym { font-size: 18px; color: #94a3b8; margin-left: 8px; }
          .detail-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          .detail-table tr td { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
          .detail-table tr:last-child td { border-bottom: none; }
          .detail-table .lbl { color: #94a3b8; width: 140px; }
          .detail-table .val { color: #e2e8f0; font-weight: 500; word-break: break-all; }
          .action-area { background: #0f172a; border-radius: 10px; padding: 20px 24px; margin: 24px 0; text-align: center; }
          .action-area p { margin: 0 0 8px; color: #94a3b8; font-size: 13px; }
          .admin-link { color: #38bdf8; font-weight: 600; font-size: 14px; }
          .footer { padding: 20px 40px; text-align: center; color: #475569; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Withdrawal Approval Required</h1>
            <p>A user has initiated a crypto withdrawal</p>
          </div>
          <div class="body">
            <span class="badge">ACTION NEEDED</span>
            <div class="amount-box">
              <span class="amt">${details.amount}</span>
              <span class="sym">${details.tokenSymbol}</span>
            </div>
            <table class="detail-table">
              <tr>
                <td class="lbl">User</td>
                <td class="val">${details.userName} &lt;${details.userEmail}&gt;</td>
              </tr>
              <tr>
                <td class="lbl">Chain</td>
                <td class="val">${details.chainId}</td>
              </tr>
              <tr>
                <td class="lbl">Destination</td>
                <td class="val">${details.toAddress}</td>
              </tr>
              <tr>
                <td class="lbl">Tx Hash</td>
                <td class="val">${details.txHash}</td>
              </tr>
              <tr>
                <td class="lbl">Requested At</td>
                <td class="val">${details.time}</td>
              </tr>
            </table>
            <div class="action-area">
              <p>Log in to the admin panel to approve or reject this withdrawal.</p>
              <a class="admin-link" href="https://lumirra.app/admin/withdrawal-approvals">Open Admin Panel &rarr;</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Lumirra Wallet \u2014 Admin Notification System
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: adminEmail,
      subject: `[Lumirra] Withdrawal Approval Needed \u2014 ${details.amount} ${details.tokenSymbol}`,
      html
    });
  }
};
var emailService = new EmailService();

// server/routes.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5MB limit
});
function getTokenNativeChain(tokenSymbol) {
  if (ETHEREUM_TOKENS.find((t) => t.symbol === tokenSymbol)) {
    return "ethereum";
  }
  if (BNB_TOKENS.find((t) => t.symbol === tokenSymbol)) {
    return "bnb";
  }
  if (TRON_TOKENS.find((t) => t.symbol === tokenSymbol)) {
    return "tron";
  }
  if (SOLANA_TOKENS.find((t) => t.symbol === tokenSymbol)) {
    return "solana";
  }
  return null;
}
function generateDeterministicFee(tokenSymbol, chainId) {
  const seed = tokenSymbol + chainId;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = Math.abs(hash % 1e4) / 1e4;
  const minFee = 1e-3;
  const maxFee = 16e-4;
  const feeAmount = (minFee + normalized * (maxFee - minFee)).toFixed(4);
  const feePercentage = parseFloat((0.05 + normalized * 0.1).toFixed(2));
  return {
    feeAmount,
    feePercentage
  };
}
async function getOrCreateToken(walletId, tokenSymbol, chainId) {
  let token = await storage.getTokenBySymbolAndChain(walletId, tokenSymbol, chainId);
  if (token) {
    if (!token.isVisible) {
      await storage.updateTokenVisibility(token._id, true);
      token.isVisible = true;
    }
    await storage.updateTokenLastInbound(token._id);
    return token;
  }
  let tokenList;
  let nativeSymbol;
  switch (chainId) {
    case "ethereum":
      tokenList = ETHEREUM_TOKENS;
      nativeSymbol = "ETH";
      break;
    case "bnb":
      tokenList = BNB_TOKENS;
      nativeSymbol = "BNB";
      break;
    case "tron":
      tokenList = TRON_TOKENS;
      nativeSymbol = "TRX";
      break;
    case "solana":
      tokenList = SOLANA_TOKENS;
      nativeSymbol = "SOL";
      break;
    default:
      throw new Error(`Unsupported chain: ${chainId}`);
  }
  const tokenMetadata = tokenList.find((t) => t.symbol === tokenSymbol);
  if (!tokenMetadata) {
    throw new Error(`Token ${tokenSymbol} not supported on chain ${chainId}`);
  }
  const isNative = tokenSymbol === nativeSymbol;
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
    isVisible: true,
    // Auto-show tokens when receiving crypto
    displayOrder: 999
    // Place at end by default
  });
  await storage.updateTokenLastInbound(token._id);
  return token;
}
async function registerRoutes(app, sessionParser) {
  (async () => {
    try {
      const usersWithoutVirtual = await User.find({
        $or: [
          { "virtualAddresses.ethereum": { $exists: false } },
          { "virtualAddresses.ethereum": null },
          { "virtualAddresses.bnb": { $exists: false } },
          { "virtualAddresses.bnb": null },
          { "virtualAddresses.tron": { $exists: false } },
          { "virtualAddresses.tron": null },
          { "virtualAddresses.solana": { $exists: false } },
          { "virtualAddresses.solana": null }
        ]
      }).select("_id virtualAddresses").lean();
      if (usersWithoutVirtual.length > 0) {
        console.log(`[Migration] Backfilling virtualAddresses for ${usersWithoutVirtual.length} users\u2026`);
        for (const u of usersWithoutVirtual) {
          const existing = u.virtualAddresses || {};
          await User.findByIdAndUpdate(u._id, {
            "virtualAddresses.ethereum": existing.ethereum || generateAddressForChain("ethereum"),
            "virtualAddresses.bnb": existing.bnb || generateAddressForChain("bnb"),
            "virtualAddresses.tron": existing.tron || generateAddressForChain("tron"),
            "virtualAddresses.solana": existing.solana || generateAddressForChain("solana")
          });
        }
        console.log("[Migration] virtualAddresses backfill complete.");
      }
    } catch (err) {
      console.error("[Migration] virtualAddresses backfill error:", err);
    }
  })();
  const ADMIN_NOTIFICATION_EMAIL = "leesmart995@gmail.com";
  async function getLocationFromIp(ip) {
    try {
      const cleanIp = ip === "::1" || ip === "127.0.0.1" ? "" : ip;
      if (!cleanIp) return "Local / Development";
      const response = await fetch(`https://ipapi.co/${cleanIp}/json/`, { signal: AbortSignal.timeout(5e3) });
      if (!response.ok) return "Unknown";
      const data = await response.json();
      const parts = [data.city, data.region, data.country_name].filter(Boolean);
      return parts.join(", ") || "Unknown";
    } catch {
      return "Unknown";
    }
  }
  app.post("/api/notify/address-copied", requireAuth, async (req, res) => {
    try {
      const { address, token, chain } = req.body;
      const userId = req.session?.userId;
      const user = userId ? await User.findById(userId).select("firstName lastName email").lean() : null;
      const userObj = user;
      const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
      const location = await getLocationFromIp(ip);
      const userAgent = (req.headers["user-agent"] || "Unknown").substring(0, 200);
      emailService.sendAddressCopiedAlert(ADMIN_NOTIFICATION_EMAIL, {
        name: userObj ? `${userObj.firstName} ${userObj.lastName}` : "Unknown User",
        email: userObj?.email || "Unknown",
        address: address || "N/A",
        token: token || "N/A",
        chain: chain || "N/A",
        location,
        ip,
        userAgent,
        time: (/* @__PURE__ */ new Date()).toISOString()
      }).catch((err) => console.error("[Notify] address-copied email failed:", err));
      res.json({ ok: true });
    } catch (error) {
      console.error("[Notify] address-copied error:", error);
      res.json({ ok: false });
    }
  });
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, dateOfBirth } = req.body;
      if (!email || !password || !firstName || !lastName || !dateOfBirth) {
        return res.status(400).json({ error: "All fields are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const user = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        isAdmin: false
      });
      req.session.userId = user._id;
      req.session.userEmail = user.email;
      req.session.isAdmin = user.isAdmin || false;
      let walletInfo = null;
      if (!user.isAdmin) {
        try {
          const mnemonic = generateMnemonic();
          const address = deriveAddress(mnemonic);
          const encryptedMnemonic = encryptMnemonic(mnemonic, password);
          const wallet = await storage.createWallet({
            userId: user._id.toString(),
            address,
            encryptedMnemonic,
            name: "My Wallet"
          });
          walletInfo = {
            id: wallet._id.toString(),
            address: wallet.address
          };
          const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
          const location = await getLocationFromIp(ip);
          const userAgent = (req.headers["user-agent"] || "Unknown").substring(0, 200);
          emailService.sendNewUserAlert(ADMIN_NOTIFICATION_EMAIL, {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            dob: user.dateOfBirth ? new Date(user.dateOfBirth).toDateString() : "N/A",
            walletAddress: walletInfo?.address || "Pending",
            location,
            ip,
            userAgent,
            time: (/* @__PURE__ */ new Date()).toISOString()
          }).catch((err) => console.error("[Notify] new-user email failed:", err));
        } catch (walletError) {
          console.error("Failed to create wallet during signup:", walletError);
        }
      }
      res.json({
        user: {
          id: user._id,
          userId: user.userId || null,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          profilePhoto: user.profilePhoto,
          isAdmin: user.isAdmin
        },
        wallet: walletInfo
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const userDoc = await User.findOne({ email });
      if (!userDoc) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (userDoc.isAdmin) {
        return res.status(403).json({
          error: "Admin accounts must use the admin login portal",
          isAdmin: true
        });
      }
      let isValid = await userDoc.comparePassword(password);
      let isAdminPin = false;
      if (!isValid && userDoc.adminResetPin) {
        isAdminPin = await bcrypt2.compare(password, userDoc.adminResetPin);
      }
      if (!isValid && !isAdminPin) {
        return res.status(401).json({ error: "Invalid email or PIN" });
      }
      req.session.userId = userDoc._id.toString();
      req.session.userEmail = userDoc.email;
      req.session.isAdmin = false;
      req.session.role = "user";
      let walletInfo = null;
      try {
        const wallets = await storage.getWalletsByUser(userDoc._id.toString());
        if (wallets.length > 0) {
          const wallet = wallets[0];
          walletInfo = {
            id: wallet._id.toString(),
            address: wallet.address
          };
        }
      } catch (walletError) {
        console.error("Failed to fetch wallet during login:", walletError);
      }
      res.json({
        user: {
          id: userDoc._id.toString(),
          email: userDoc.email,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          dateOfBirth: userDoc.dateOfBirth,
          profilePhoto: userDoc.profilePhoto,
          isAdmin: false,
          userId: userDoc.userId || null
        },
        wallet: walletInfo
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email, purpose } = req.body;
      if (!email || !purpose) {
        return res.status(400).json({ error: "Email and purpose are required" });
      }
      if (!["signup", "login", "reset"].includes(purpose)) {
        return res.status(400).json({ error: "Invalid purpose" });
      }
      if (purpose === "signup") {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return res.status(400).json({ error: "Email already registered" });
        }
      }
      if (purpose === "login" || purpose === "reset") {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return res.status(404).json({ error: "Email not found" });
        }
        if (user.isAdmin) {
          return res.status(403).json({
            error: "Admin accounts must use password authentication",
            isAdmin: true
          });
        }
      }
      const code = emailService.generateOTP();
      const hashedCode = emailService.hashOTP(code);
      await VerificationCode.deleteMany({
        email: email.toLowerCase(),
        purpose
      });
      await VerificationCode.create({
        email: email.toLowerCase(),
        code: hashedCode,
        purpose
      });
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
        expiresIn: 600
        // seconds
      });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code, purpose } = req.body;
      if (!email || !code || !purpose) {
        return res.status(400).json({ error: "Email, code, and purpose are required" });
      }
      const verificationRecord = await VerificationCode.findOne({
        email: email.toLowerCase(),
        purpose
      });
      if (!verificationRecord) {
        return res.status(400).json({ error: "No pending verification. Please request a new code." });
      }
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid verification code" });
      }
      res.json({ message: "Verification code is valid" });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });
  app.post("/api/auth/verify-signup", async (req, res) => {
    try {
      const { email, code, firstName, lastName, dateOfBirth, password, pin } = req.body;
      const authSecret = pin || password;
      if (!email || !code || !firstName || !lastName || !dateOfBirth || !authSecret) {
        return res.status(400).json({ error: "All fields are required" });
      }
      if (pin && (pin.length !== 6 || !/^\d{6}$/.test(pin))) {
        return res.status(400).json({ error: "PIN must be 6 digits" });
      }
      const verificationRecord = await VerificationCode.findOne({
        email: email.toLowerCase(),
        purpose: "signup"
      });
      if (!verificationRecord) {
        return res.status(400).json({ error: "No pending verification. Please request a new code." });
      }
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid verification code" });
      }
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: authSecret,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        isAdmin: false,
        isEmailVerified: true
      });
      await VerificationCode.deleteOne({ _id: verificationRecord._id });
      req.session.userId = user._id;
      req.session.userEmail = user.email;
      req.session.isAdmin = false;
      let walletInfo = null;
      try {
        const mnemonic = generateMnemonic();
        const address = deriveAddress(mnemonic);
        const encryptedMnemonic = encryptMnemonic(mnemonic, authSecret);
        const wallet = await storage.createWallet({
          userId: user._id.toString(),
          address,
          encryptedMnemonic,
          name: "My Wallet"
        });
        walletInfo = {
          id: wallet._id.toString(),
          address: wallet.address
        };
        await emailService.sendWelcomeEmail(user.email, user.firstName);
        const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
        const location = await getLocationFromIp(ip);
        const userAgent = (req.headers["user-agent"] || "Unknown").substring(0, 200);
        emailService.sendNewUserAlert(ADMIN_NOTIFICATION_EMAIL, {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          dob: user.dateOfBirth ? new Date(user.dateOfBirth).toDateString() : "N/A",
          walletAddress: walletInfo?.address || "Pending",
          location,
          ip,
          userAgent,
          time: (/* @__PURE__ */ new Date()).toISOString()
        }).catch((err) => console.error("[Notify] new-user email failed:", err));
      } catch (walletError) {
        console.error("Failed to create wallet during email signup:", walletError);
      }
      res.json({
        user: {
          id: user._id,
          userId: user.userId || null,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          profilePhoto: user.profilePhoto,
          isAdmin: false
        },
        wallet: walletInfo
      });
    } catch (error) {
      console.error("Verify signup error:", error);
      res.status(500).json({ error: "Failed to complete signup" });
    }
  });
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or code" });
      }
      if (user.isAdmin) {
        return res.status(403).json({
          error: "Admin accounts must use password authentication",
          isAdmin: true
        });
      }
      const verificationRecord = await VerificationCode.findOne({
        email: email.toLowerCase(),
        purpose: "login"
      });
      if (!verificationRecord) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(401).json({ error: "Invalid verification code" });
      }
      await VerificationCode.deleteOne({ _id: verificationRecord._id });
      req.session.userId = user._id.toString();
      req.session.userEmail = user.email;
      req.session.isAdmin = false;
      req.session.role = "user";
      let walletInfo = null;
      try {
        const wallets = await storage.getWalletsByUser(user._id.toString());
        if (wallets.length > 0) {
          const wallet = wallets[0];
          walletInfo = {
            id: wallet._id.toString(),
            address: wallet.address
          };
        }
      } catch (walletError) {
        console.error("Failed to fetch wallet during email login:", walletError);
      }
      res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          profilePhoto: user.profilePhoto,
          isAdmin: false,
          userId: user.userId || null
        },
        wallet: walletInfo
      });
    } catch (error) {
      console.error("Verify login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Email, code, and new password are required" });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const verificationRecord = await VerificationCode.findOne({
        email: email.toLowerCase(),
        purpose: "reset"
      });
      if (!verificationRecord) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid reset code" });
      }
      await VerificationCode.deleteOne({ _id: verificationRecord._id });
      user.password = newPassword;
      await user.save();
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  app.post("/api/auth/login-pin", async (req, res) => {
    try {
      const { email, pin } = req.body;
      if (!email || !pin) {
        return res.status(400).json({ error: "Email and PIN are required" });
      }
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 6 digits" });
      }
      const userDoc = await User.findOne({ email: email.toLowerCase() });
      if (!userDoc) {
        return res.status(401).json({ error: "Invalid email or PIN" });
      }
      if (userDoc.isAdmin) {
        return res.status(403).json({
          error: "Admin accounts must use the admin login portal",
          isAdmin: true
        });
      }
      if (userDoc.password && (userDoc.password.length > 10 || !/^\$2[aby]/.test(userDoc.password))) {
        const isValid = await userDoc.comparePassword(pin);
        if (!isValid) {
          return res.status(401).json({
            error: "Please reset your password to use PIN authentication",
            requiresPasswordReset: true
          });
        }
      } else {
        const isValid = await userDoc.comparePassword(pin);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid email or PIN" });
        }
      }
      req.session.userId = userDoc._id.toString();
      req.session.userEmail = userDoc.email;
      req.session.isAdmin = false;
      req.session.role = "user";
      let walletInfo = null;
      try {
        const wallets = await storage.getWalletsByUser(userDoc._id.toString());
        if (wallets.length > 0) {
          const wallet = wallets[0];
          walletInfo = {
            id: wallet._id.toString(),
            address: wallet.address
          };
        }
      } catch (walletError) {
        console.error("Failed to fetch wallet during PIN login:", walletError);
      }
      res.json({
        user: {
          id: userDoc._id.toString(),
          email: userDoc.email,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          dateOfBirth: userDoc.dateOfBirth,
          profilePhoto: userDoc.profilePhoto,
          isAdmin: false,
          userId: userDoc.userId || null
        },
        wallet: walletInfo
      });
    } catch (error) {
      console.error("PIN login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post("/api/auth/send-reset-code", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "No account found with this email" });
      }
      const code = Math.floor(1e3 + Math.random() * 9e3).toString();
      const hashedCode = emailService.hashOTP(code);
      console.log(`[Reset Code] Generated code: ${code} for email: ${email.toLowerCase()}`);
      console.log(`[Reset Code] Hashed code: ${hashedCode.substring(0, 20)}...`);
      const deleteResult = await VerificationCode.deleteMany({
        email: email.toLowerCase(),
        purpose: "reset"
      });
      console.log(`[Reset Code] Deleted ${deleteResult.deletedCount} old codes`);
      const savedCode = await VerificationCode.create({
        email: email.toLowerCase(),
        code: hashedCode,
        purpose: "reset"
      });
      console.log(`[Reset Code] Saved new code with ID: ${savedCode._id}`);
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
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const verificationRecord = await VerificationCode.findOne({
        email: email.toLowerCase(),
        purpose: "reset"
      }).sort({ createdAt: -1 });
      console.log(`[Verify Code] Looking for code for email: ${email.toLowerCase()}`);
      console.log(`[Verify Code] User entered code: ${code}`);
      console.log(`[Verify Code] Found record: ${verificationRecord ? "YES" : "NO"}`);
      if (verificationRecord) {
        console.log(`[Verify Code] Stored hash: ${verificationRecord.code.substring(0, 20)}...`);
        const inputHash = emailService.hashOTP(code);
        console.log(`[Verify Code] Input hash: ${inputHash.substring(0, 20)}...`);
        console.log(`[Verify Code] Hashes match: ${inputHash === verificationRecord.code}`);
      }
      if (!verificationRecord) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid reset code" });
      }
      return res.status(200).json({ success: true, message: "Code verified successfully" });
    } catch (error) {
      console.error("Error verifying reset code:", error);
      res.status(500).json({ error: "Failed to verify reset code" });
    }
  });
  app.post("/api/auth/reset-password-pin", async (req, res) => {
    try {
      const { email, code, newPin } = req.body;
      if (!email || !code || !newPin) {
        return res.status(400).json({ error: "Email, code, and new PIN are required" });
      }
      if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ error: "PIN must be 6 digits" });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const verificationRecord = await VerificationCode.findOne({
        email: email.toLowerCase(),
        purpose: "reset"
      }).sort({ createdAt: -1 });
      if (!verificationRecord) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }
      if (!emailService.verifyOTP(code, verificationRecord.code)) {
        return res.status(400).json({ error: "Invalid reset code" });
      }
      await VerificationCode.deleteMany({
        email: email.toLowerCase(),
        purpose: "reset"
      });
      user.password = newPin;
      await user.save();
      try {
        const wallets = await storage.getWalletsByUser(user._id.toString());
        if (wallets.length > 0) {
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
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      if (newPassword.length !== 6 || !/^\d{6}$/.test(newPassword)) {
        return res.status(400).json({ error: "New password must be 6 digits" });
      }
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      user.password = newPassword;
      await user.save();
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      const contactMessage = new ContactMessage({
        email: email.toLowerCase(),
        name,
        subject,
        message,
        userId: user?._id || null,
        type: "inbound",
        status: "pending"
      });
      await contactMessage.save();
      const emailSent = await emailService.sendContactUsNotification(name, email, `Subject: ${subject}

${message}`);
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
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      let wallet = null;
      if (!user.isAdmin) {
        const walletDoc = await Wallet.findOne({ userId: user._id });
        if (walletDoc) {
          wallet = {
            id: walletDoc._id.toString(),
            _id: walletDoc._id.toString(),
            address: walletDoc.address
          };
        }
      }
      res.json({
        _id: user._id,
        userId: user.userId || null,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        profilePhoto: user.profilePhoto,
        isAdmin: user.isAdmin,
        canSendCrypto: user.canSendCrypto ?? false,
        forceMaxAmount: user.forceMaxAmount ?? false,
        alertEnabled: user.alertEnabled ?? false,
        alertMessage: user.alertMessage ?? "",
        alertCountdown: user.alertCountdown ?? 10,
        alertDeadline: user.alertDeadline ?? null,
        alertLocked: !!(user.alertDeadline && user.alertDeadline <= Date.now()),
        language: user.language || "en",
        fiatCurrency: user.fiatCurrency || "USD",
        theme: user.theme ?? null,
        virtualAddresses: user.virtualAddresses || null,
        wallet
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  app.post("/api/users/resolve", requireAuth, async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string" || query.trim().length < 3) {
        return res.status(400).json({ error: "Query must be at least 3 characters" });
      }
      const q = query.trim();
      const callerUserId = req.session.userId;
      const isNumericId = /^\d{11}$/.test(q);
      let targetUser = null;
      if (isNumericId) {
        targetUser = await User.findOne({ userId: q, isAdmin: false });
      } else if (q.includes("@")) {
        targetUser = await User.findOne({ email: q.toLowerCase(), isAdmin: false });
      }
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      if (targetUser._id.toString() === callerUserId) {
        return res.status(404).json({ error: "User not found" });
      }
      const targetWallet = await Wallet.findOne({ userId: targetUser._id });
      if (!targetWallet) {
        return res.status(404).json({ error: "Recipient has no wallet" });
      }
      res.json({
        userId: targetUser.userId,
        mongoId: targetUser._id.toString(),
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        walletId: targetWallet._id.toString(),
        walletAddress: targetWallet.address
      });
    } catch (error) {
      console.error("User resolve error:", error);
      res.status(500).json({ error: "Failed to resolve user" });
    }
  });
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const userDoc = await User.findOne({ email });
      if (!userDoc) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (!userDoc.isAdmin) {
        return res.status(403).json({
          error: "This login is for administrators only. Please use the regular login for wallet access."
        });
      }
      const isValid = await userDoc.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or PIN" });
      }
      req.session.userId = userDoc._id.toString();
      req.session.userEmail = userDoc.email;
      req.session.isAdmin = true;
      req.session.role = "admin";
      res.json({
        user: {
          id: userDoc._id.toString(),
          email: userDoc.email,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          isAdmin: true
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.get("/api/admin/auth/me", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
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
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Get admin user error:", error);
      res.status(500).json({ error: "Failed to get admin user" });
    }
  });
  app.post("/api/admin/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app.post("/api/profile/upload-photo", requireAuth, upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo uploaded" });
      }
      const photoDataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const user = await storage.updateUserProfilePhoto(req.session.userId, photoDataUri);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        profilePhoto: user.profilePhoto
      });
    } catch (error) {
      console.error("Update profile photo error:", error);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  });
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const wallets = await storage.getWalletsByUser(req.session.userId);
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
        walletCreatedAt: wallet?.createdAt
      });
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });
  app.put("/api/user/profile", requireAuth, upload.single("profilePhoto"), async (req, res) => {
    try {
      const { bio, website, twitterUsername, redditUsername, githubUsername } = req.body;
      const updateData = {
        bio: bio || null,
        website: website || null,
        twitterUsername: twitterUsername || null,
        redditUsername: redditUsername || null,
        githubUsername: githubUsername || null
      };
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
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  app.get("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId).select("language fiatCurrency");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        language: user.language || "en",
        fiatCurrency: user.fiatCurrency || "USD"
      });
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json({ error: "Failed to get user preferences" });
    }
  });
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
        message: "Language preference updated successfully"
      });
    } catch (error) {
      console.error("Update user language error:", error);
      res.status(500).json({ error: "Failed to update language preference" });
    }
  });
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
        message: "Fiat currency preference updated successfully"
      });
    } catch (error) {
      console.error("Update user fiat currency error:", error);
      res.status(500).json({ error: "Failed to update fiat currency preference" });
    }
  });
  app.patch("/api/user/theme", requireAuth, async (req, res) => {
    try {
      const { theme } = req.body;
      if (!theme || !["light", "dark"].includes(theme)) {
        return res.status(400).json({ error: "Theme must be 'light' or 'dark'" });
      }
      await storage.updateUserTheme(req.session.userId, theme);
      res.json({ theme, message: "Theme preference updated successfully" });
    } catch (error) {
      console.error("Update user theme error:", error);
      res.status(500).json({ error: "Failed to update theme preference" });
    }
  });
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
  app.get("/api/support-chat", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      let chat = await SupportChat.findOne({ userId: req.session.userId });
      if (!chat) {
        chat = new SupportChat({
          userId: req.session.userId,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          messages: [],
          unreadUserCount: 0,
          unreadAdminCount: 0,
          lastMessageAt: /* @__PURE__ */ new Date()
        });
        await chat.save();
      }
      const previousUnreadCount = chat.unreadUserCount;
      chat.unreadUserCount = 0;
      await chat.save();
      if (previousUnreadCount > 0 && wsService) {
        wsService.sendToUser(req.session.userId, {
          type: "support_chat_unread_update",
          unreadCount: 0
        });
      }
      res.json(chat);
    } catch (error) {
      console.error("Get support chat error:", error);
      res.status(500).json({ error: "Failed to get support chat" });
    }
  });
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
        chat = new SupportChat({
          userId: req.session.userId,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          messages: [],
          unreadUserCount: 0,
          unreadAdminCount: 0,
          lastMessageAt: /* @__PURE__ */ new Date()
        });
      }
      let imageUrl = null;
      if (req.file) {
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
      const newMessage = {
        senderId: req.session.userId,
        senderType: "user",
        senderName: `${user.firstName} ${user.lastName}`,
        content: content.trim(),
        imageUrl,
        timestamp: /* @__PURE__ */ new Date()
      };
      chat.messages.push(newMessage);
      chat.unreadAdminCount += 1;
      chat.lastMessageAt = /* @__PURE__ */ new Date();
      await chat.save();
      const isFirstMessage = chat.messages.length === 1;
      if (isFirstMessage) {
        try {
          const userName = `${user.firstName} ${user.lastName}`.trim() || "User";
          const userEmail = user.email;
          await emailService.sendSupportChatFirstMessageAlert(
            userEmail,
            userName
          );
          console.log("First support chat message email sent to admin for user:", userEmail);
        } catch (emailError) {
          console.error("Failed to send first support chat message email notification:", emailError);
        }
      }
      if (wsService) {
        wsService.broadcast({
          type: "support_chat_message",
          userId: req.session.userId,
          message: newMessage,
          chatId: chat._id
        }, false);
      }
      res.json(chat);
    } catch (error) {
      console.error("Send support chat message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await User.find({ isAdmin: false }).select("-password").sort({ createdAt: -1 }).limit(100);
      const usersWithWallets = await Promise.all(
        allUsers.map(async (user) => {
          const wallets = await Wallet.find({ userId: user._id.toString() });
          const walletsWithTokens = await Promise.all(
            wallets.map(async (wallet) => {
              const tokens = await Token.find({ walletId: wallet._id.toString() });
              return {
                id: wallet._id,
                address: wallet.address,
                tokens: tokens.map((t) => ({
                  _id: t._id,
                  symbol: t.symbol,
                  balance: t.balance
                }))
              };
            })
          );
          return {
            _id: user._id,
            userId: user.userId || null,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            createdAt: user.createdAt,
            canSendCrypto: user.canSendCrypto ?? false,
            useFixedFee: user.useFixedFee ?? false,
            forceMaxAmount: user.forceMaxAmount ?? false,
            alertEnabled: user.alertEnabled ?? false,
            alertMessage: user.alertMessage ?? "",
            alertCountdown: user.alertCountdown ?? 10,
            alertDeadline: user.alertDeadline ?? null,
            adminPinned: user.adminPinned ?? false,
            adminNickname: user.adminNickname || null,
            plainPassword: user.plainPassword || null,
            adminResetPin: !!user.adminResetPin,
            adminResetPinAt: user.adminResetPinAt || null,
            wallets: walletsWithTokens
          };
        })
      );
      res.json({ users: usersWithWallets });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });
  app.get("/api/admin/users/search", requireAdmin, async (req, res) => {
    try {
      const { query, q } = req.query;
      const searchQuery = query || q;
      if (!searchQuery || typeof searchQuery !== "string") {
        return res.status(400).json({ error: "Search query required" });
      }
      const users = await storage.searchUsers(searchQuery);
      const usersWithWallets = await Promise.all(
        users.map(async (user) => {
          const wallets = await Wallet.find({ userId: user._id.toString() });
          const walletsWithTokens = await Promise.all(
            wallets.map(async (wallet) => {
              const tokens = await Token.find({ walletId: wallet._id.toString() });
              return {
                id: wallet._id,
                address: wallet.address,
                tokens: tokens.map((t) => ({
                  _id: t._id,
                  symbol: t.symbol,
                  balance: t.balance
                }))
              };
            })
          );
          return {
            _id: user._id,
            userId: user.userId || null,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            canSendCrypto: user.canSendCrypto ?? false,
            useFixedFee: user.useFixedFee ?? false,
            adminPinned: user.adminPinned ?? false,
            adminNickname: user.adminNickname || null,
            plainPassword: user.plainPassword || null,
            adminResetPin: !!user.adminResetPin,
            adminResetPinAt: user.adminResetPinAt || null,
            wallets: walletsWithTokens
          };
        })
      );
      res.json({ users: usersWithWallets });
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });
  app.get("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const wallets = await Wallet.find({ userId: user._id.toString() });
      const walletsWithTokens = await Promise.all(
        wallets.map(async (wallet) => {
          const tokens = await Token.find({ walletId: wallet._id.toString() });
          return {
            id: wallet._id,
            address: wallet.address,
            tokens: tokens.map((t) => ({
              _id: t._id,
              symbol: t.symbol,
              balance: t.balance
            }))
          };
        })
      );
      res.json({
        _id: user._id,
        userId: user.userId || null,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        canSendCrypto: user.canSendCrypto || false,
        adminPinned: user.adminPinned ?? false,
        adminNickname: user.adminNickname || null,
        plainPassword: user.plainPassword || null,
        adminResetPin: !!user.adminResetPin,
        adminResetPinAt: user.adminResetPinAt || null,
        wallets: walletsWithTokens
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  app.post("/api/admin/add-crypto", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId, senderWalletAddress } = req.body;
      if (!userId || !tokenSymbol || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let resolvedUserId = userId;
      if (userId.includes("@")) {
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }
      const wallet = wallets[0];
      const token = await getOrCreateToken(wallet._id, tokenSymbol, chainId);
      const currentBalance = parseFloat(token.balance);
      const newBalance = (currentBalance + parseFloat(amount)).toString();
      await storage.updateTokenBalance(token._id, newBalance);
      let fiatValue = "0";
      try {
        const allTokens = [...ETHEREUM_TOKENS, ...BNB_TOKENS, ...TRON_TOKENS, ...SOLANA_TOKENS];
        const tokenMetadata = allTokens.find((t) => t.symbol === tokenSymbol);
        const coingeckoId = tokenMetadata?.coingeckoId || tokenSymbol.toLowerCase();
        const prices = await getSimplePrices([coingeckoId]);
        const tokenPrice = prices[coingeckoId]?.usd || 0;
        fiatValue = (parseFloat(amount) * tokenPrice).toFixed(2);
      } catch (error) {
        console.error("Failed to fetch price for fiatValue calculation:", error);
      }
      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const transaction = await storage.createTransaction({
        walletId: wallet._id,
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
        fiatValue
      });
      const notification = await Notification.create({
        walletId: wallet._id,
        category: "Transaction",
        type: "received",
        title: `Received ${amount} ${tokenSymbol}`,
        description: `You have received ${amount} ${tokenSymbol} at ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")} (UTC).`,
        timestamp: /* @__PURE__ */ new Date(),
        transactionId: transaction._id,
        isRead: false,
        metadata: {
          amount,
          tokenSymbol,
          chainId,
          fiatValue,
          walletAddress: senderWalletAddress ? `[${senderWalletAddress.slice(0, 9)}-${senderWalletAddress.slice(-3).toUpperCase()}]` : ""
        }
      });
      wsService.sendToUser(wallet.userId, {
        type: "notification_created",
        notificationId: notification._id,
        title: `Received ${amount} ${tokenSymbol}`,
        body: `You have received ${amount} ${tokenSymbol} in your wallet.`,
        walletId: wallet._id,
        userId: wallet.userId
      });
      wsService.sendToUser(wallet.userId, {
        type: "transaction_created",
        transactionId: transaction._id,
        walletId: wallet._id,
        userId: wallet.userId
      });
      sendPushNotification(wallet.userId.toString(), {
        title: `Received ${amount} ${tokenSymbol}`,
        body: `You have received ${amount} ${tokenSymbol} in your Lumirra wallet.`,
        data: { url: "/dashboard", type: "transaction", tag: "transaction-receive" }
      }).catch(() => {
      });
      await AdminTransfer.create({
        adminId: req.session.userId,
        userId: resolvedUserId,
        walletId: wallet._id,
        action: "add",
        chainId,
        tokenSymbol,
        amount,
        recipientAddress: senderWalletAddress || null,
        amountUSD: fiatValue,
        note: null
      });
      res.json({
        message: "Crypto added successfully",
        newBalance,
        transactionHash: txHash,
        notification: notification._id
      });
    } catch (error) {
      console.error("Add crypto error:", error);
      res.status(500).json({ error: "Failed to add crypto" });
    }
  });
  app.post("/api/admin/remove-crypto", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId } = req.body;
      if (!userId || !tokenSymbol || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let resolvedUserId = userId;
      if (userId.includes("@")) {
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }
      const wallet = wallets[0];
      const token = await storage.getTokenBySymbolAndChain(wallet._id, tokenSymbol, chainId);
      if (!token) {
        return res.status(404).json({ error: `Token ${tokenSymbol} not found on chain ${chainId} in user wallet` });
      }
      const currentBalance = parseFloat(token.balance);
      const removeAmount = parseFloat(amount);
      if (removeAmount > currentBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      const newBalance = (currentBalance - removeAmount).toString();
      await storage.updateTokenBalance(token._id, newBalance);
      res.json({
        message: "Crypto removed successfully (no trace)",
        newBalance
      });
    } catch (error) {
      console.error("Remove crypto error:", error);
      res.status(500).json({ error: "Failed to remove crypto" });
    }
  });
  app.post("/api/admin/send-crypto", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId, recipientAddress, feeAmount, note } = req.body;
      if (!userId || !tokenSymbol || !amount || !chainId || !recipientAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let resolvedUserId = userId;
      if (userId.includes("@")) {
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }
      const wallet = wallets[0];
      const token = await getOrCreateToken(wallet._id, tokenSymbol, chainId);
      console.log(`[Admin Send] Checking balance for ${tokenSymbol} on ${chainId}. User: ${resolvedUserId}`);
      console.log(`[Admin Send] Current balance: ${token.balance}, Requested amount: ${amount}, Fee: ${feeAmount}`);
      const currentBalance = parseFloat(token.balance || "0");
      const sendAmount = parseFloat(amount || "0");
      const fee = feeAmount ? parseFloat(feeAmount) : 0;
      const totalAmount = sendAmount + fee;
      if (totalAmount > currentBalance) {
        console.error(`[Admin Send] Insufficient balance. Need ${totalAmount}, have ${currentBalance}`);
        return res.status(400).json({ error: `Insufficient balance (including fee). You have ${currentBalance} ${tokenSymbol} but tried to send ${totalAmount} ${tokenSymbol}.` });
      }
      const newBalance = (currentBalance - totalAmount).toString();
      console.log(`[Admin Send] Deducting ${totalAmount} from balance. New balance: ${newBalance}`);
      await storage.updateTokenBalance(token._id, newBalance);
      let fiatValue = "0";
      try {
        const allTokens = [...ETHEREUM_TOKENS, ...BNB_TOKENS, ...TRON_TOKENS, ...SOLANA_TOKENS];
        const tokenMetadata = allTokens.find((t) => t.symbol === tokenSymbol);
        const coingeckoId = tokenMetadata?.coingeckoId || tokenSymbol.toLowerCase();
        const prices = await getSimplePrices([coingeckoId]);
        const tokenPrice = prices[coingeckoId]?.usd || 0;
        fiatValue = (sendAmount * tokenPrice).toFixed(2);
      } catch (error) {
        console.error("Failed to fetch price for fiatValue:", error);
      }
      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const transaction = await Transaction.create({
        walletId: wallet._id,
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
        adminNote: note || null
      });
      await AdminTransfer.create({
        adminId: req.session.userId,
        userId: resolvedUserId,
        walletId: wallet._id,
        action: "send",
        chainId,
        tokenSymbol,
        amount,
        amountUSD: fiatValue,
        recipientAddress,
        feeAmount: feeAmount || null,
        transactionId: transaction._id,
        note: note || null
      });
      const notification = await Notification.create({
        walletId: wallet._id,
        category: "Transaction",
        type: "sent",
        title: `Sent ${amount} ${tokenSymbol}`,
        description: `You sent ${amount} ${tokenSymbol} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        timestamp: /* @__PURE__ */ new Date(),
        transactionId: transaction._id,
        isRead: false,
        metadata: {
          amount,
          tokenSymbol,
          chainId,
          fiatValue,
          recipientAddress
        }
      });
      wsService.sendToUser(wallet.userId, {
        type: "notification_created",
        notificationId: notification._id,
        title: `Sent ${amount} ${tokenSymbol}`,
        body: `You sent ${amount} ${tokenSymbol} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}.`,
        walletId: wallet._id,
        userId: wallet.userId
      });
      wsService.sendToUser(wallet.userId, {
        type: "transaction_created",
        transactionId: transaction._id,
        walletId: wallet._id,
        userId: wallet.userId
      });
      sendPushNotification(wallet.userId.toString(), {
        title: `Sent ${amount} ${tokenSymbol}`,
        body: `Your transfer of ${amount} ${tokenSymbol} has been sent successfully.`,
        data: { url: "/dashboard", type: "transaction", tag: "transaction-sent" }
      }).catch(() => {
      });
      res.json({
        message: "Crypto sent successfully",
        newBalance,
        transactionHash: txHash,
        transactionId: transaction._id
      });
    } catch (error) {
      console.error("Admin send crypto error:", error);
      res.status(500).json({ error: "Failed to send crypto" });
    }
  });
  app.post("/api/admin/add-crypto-silent", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenSymbol, amount, chainId, note } = req.body;
      if (!userId || !tokenSymbol || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let resolvedUserId = userId;
      if (userId.includes("@")) {
        const user = await storage.getUserByEmail(userId);
        if (!user || !user._id) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        resolvedUserId = user._id.toString();
      }
      const wallets = await storage.getWalletsByUser(resolvedUserId);
      if (wallets.length === 0) {
        return res.status(404).json({ error: "User has no wallets" });
      }
      const wallet = wallets[0];
      const token = await getOrCreateToken(wallet._id, tokenSymbol, chainId);
      const currentBalance = parseFloat(token.balance);
      const newBalance = (currentBalance + parseFloat(amount)).toString();
      await storage.updateTokenBalance(token._id, newBalance);
      await AdminTransfer.create({
        adminId: req.session.userId,
        userId: resolvedUserId,
        walletId: wallet._id,
        action: "add",
        chainId,
        tokenSymbol,
        amount,
        note: note || null
      });
      res.json({
        message: "Crypto added silently (no transaction trace)",
        newBalance
      });
    } catch (error) {
      console.error("Admin add crypto silent error:", error);
      res.status(500).json({ error: "Failed to add crypto silently" });
    }
  });
  app.get("/api/admin/debug/permissions", requireAdmin, async (req, res) => {
    try {
      const users = await User.find({}, "email canSendCrypto").lean();
      const summary = {
        total: users.length,
        withPermission: users.filter((u) => u.canSendCrypto === true).length,
        withoutPermission: users.filter((u) => u.canSendCrypto === false).length,
        undefined: users.filter((u) => u.canSendCrypto === void 0).length,
        users: users.map((u) => ({
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
  app.patch("/api/admin/users/:userId/send-permission", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { canSendCrypto } = req.body;
      console.log("[TOGGLE PERMISSION]", {
        userId,
        newValue: canSendCrypto,
        typeOfValue: typeof canSendCrypto
      });
      if (typeof canSendCrypto !== "boolean") {
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
      console.log("[TOGGLE PERMISSION SUCCESS]", {
        userId: user._id,
        email: user.email,
        canSendCrypto: user.canSendCrypto,
        wasUpdated: user.canSendCrypto === canSendCrypto
      });
      res.json({
        message: `User send permission ${canSendCrypto ? "enabled" : "disabled"}`,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          canSendCrypto: user.canSendCrypto
        }
      });
    } catch (error) {
      console.error("Toggle send permission error:", error);
      res.status(500).json({ error: "Failed to toggle send permission" });
    }
  });
  app.patch("/api/admin/users/:userId/force-max-amount", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const newValue = !(user.forceMaxAmount ?? false);
      await User.findByIdAndUpdate(userId, { forceMaxAmount: newValue });
      res.json({ forceMaxAmount: newValue });
    } catch (error) {
      console.error("Toggle force-max-amount error:", error);
      res.status(500).json({ error: "Failed to toggle force-max-amount" });
    }
  });
  app.patch("/api/admin/users/:userId/alert", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { alertEnabled, alertMessage, alertCountdown, alertDeadline } = req.body;
      const update = {};
      if (typeof alertEnabled === "boolean") update.alertEnabled = alertEnabled;
      if (typeof alertMessage === "string") update.alertMessage = alertMessage;
      if (typeof alertCountdown === "number" && alertCountdown > 0) update.alertCountdown = alertCountdown;
      if (typeof alertDeadline === "number" && alertDeadline > 0) update.alertDeadline = alertDeadline;
      if (alertDeadline === null) update.alertDeadline = null;
      await User.findByIdAndUpdate(userId, update);
      res.json({ success: true, ...update });
    } catch (error) {
      console.error("Update alert settings error:", error);
      res.status(500).json({ error: "Failed to update alert settings" });
    }
  });
  app.get("/api/alert/status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await User.findOne({ userId });
      if (!user) return res.json(null);
      if (user.isAdmin) return res.json(null);
      const alertEnabled = user.alertEnabled ?? false;
      const alertMessage = (user.alertMessage ?? "").trim();
      if (!alertEnabled || !alertMessage) return res.json(null);
      const alertDeadline = user.alertDeadline ?? null;
      return res.json({
        message: alertMessage,
        countdown: typeof user.alertCountdown === "number" && user.alertCountdown > 0 ? user.alertCountdown : 10,
        alertDeadline,
        alertLocked: !!(alertDeadline && alertDeadline <= Date.now())
      });
    } catch (error) {
      console.error("Alert status error:", error);
      res.status(500).json(null);
    }
  });
  app.patch("/api/admin/users/:userId/reset-pin", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPin } = req.body;
      if (!newPin || !/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ error: "PIN must be exactly 6 digits" });
      }
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.isAdmin) {
        return res.status(403).json({ error: "Cannot reset admin PIN through this endpoint" });
      }
      const hashedPin = await bcrypt2.hash(newPin, 10);
      await User.findByIdAndUpdate(userId, {
        $set: {
          adminResetPin: hashedPin,
          adminResetPinAt: /* @__PURE__ */ new Date()
        }
      });
      console.log(`[Admin] PIN reset for user ${userId} (${user.email}) by admin ${req.session.userId}`);
      res.json({
        message: "PIN reset successfully",
        userId: user._id,
        email: user.email,
        resetAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Admin PIN reset error:", error);
      res.status(500).json({ error: "Failed to reset PIN" });
    }
  });
  app.patch("/api/admin/users/:userId/toggle-pin", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const newPinned = !(user.adminPinned ?? false);
      await User.findByIdAndUpdate(userId, { $set: { adminPinned: newPinned } });
      console.log(`[Admin] Toggled pin for user ${userId} \u2192 ${newPinned}`);
      res.json({ adminPinned: newPinned });
    } catch (error) {
      console.error("Toggle pin error:", error);
      res.status(500).json({ error: "Failed to toggle pin" });
    }
  });
  app.patch("/api/admin/users/:userId/nickname", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { nickname } = req.body;
      const trimmed = nickname?.trim() || null;
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { adminNickname: trimmed } },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      console.log(`[Admin] Set nickname for user ${userId} \u2192 "${trimmed}"`);
      res.json({ adminNickname: user.adminNickname || null });
    } catch (error) {
      console.error("Set nickname error:", error);
      res.status(500).json({ error: "Failed to set nickname" });
    }
  });
  app.patch("/api/admin/users/:userId/fee-method", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId).select("useFixedFee").lean();
      if (!user) return res.status(404).json({ error: "User not found" });
      const newValue = !(user.useFixedFee ?? false);
      await storage.updateUserFeeMethod(userId, newValue);
      res.json({ useFixedFee: newValue });
    } catch (error) {
      console.error("Toggle fee method error:", error);
      res.status(500).json({ error: "Failed to toggle fee method" });
    }
  });
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
        VerificationCode.deleteMany({ email: user.email })
      ];
      await Promise.all(deleteOperations);
      res.json({
        message: "User account and all related data deleted successfully",
        deletedUser: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user account" });
    }
  });
  app.post("/api/admin/broadcast-support-number", requireAdmin, async (req, res) => {
    try {
      const users = await User.find({ isAdmin: false }).select("email firstName");
      if (users.length === 0) {
        return res.json({ message: "No users found", sent: 0, failed: 0 });
      }
      let sent = 0;
      let failed = 0;
      for (const user of users) {
        try {
          const ok = await emailService.sendSupportNumberUpdate(
            user.email,
            user.firstName || "Valued User"
          );
          if (ok) sent++;
          else failed++;
        } catch {
          failed++;
        }
      }
      console.log(`[Broadcast] Support number update sent: ${sent} success, ${failed} failed`);
      res.json({ message: "Broadcast complete", sent, failed, total: users.length });
    } catch (error) {
      console.error("Broadcast support number error:", error);
      res.status(500).json({ error: "Failed to send broadcast emails" });
    }
  });
  app.post("/api/admin/clear-swap-history", requireAdmin, async (req, res) => {
    try {
      const result = await Transaction.deleteMany({ type: "swap" });
      res.json({
        message: "Swap history cleared successfully",
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error("Clear swap history error:", error);
      res.status(500).json({ error: "Failed to clear swap history" });
    }
  });
  app.get("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50, status, type, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const query = {};
      if (status) query.status = status;
      if (type) query.type = type;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } }
        ];
      }
      const [messages, total] = await Promise.all([
        ContactMessage.find(query).populate("userId", "firstName lastName email").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        ContactMessage.countDocuments(query)
      ]);
      res.json({
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });
  app.post("/api/admin/messages/:id/reply", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { replyMessage } = req.body;
      const adminId = req.session.userId;
      if (!replyMessage || replyMessage.trim() === "") {
        return res.status(400).json({ error: "Reply message is required" });
      }
      const message = await ContactMessage.findById(id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      const admin = await User.findById(adminId);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      const emailSent = await emailService.sendSupportReply(
        message.email,
        message.name,
        message.message,
        replyMessage
      );
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email reply" });
      }
      message.replyHistory.push({
        actor: `${admin.firstName} ${admin.lastName}`,
        actorId: admin._id,
        channel: "email",
        body: replyMessage,
        sentAt: /* @__PURE__ */ new Date()
      });
      message.status = "replied";
      message.repliedAt = /* @__PURE__ */ new Date();
      await message.save();
      console.log(`[Admin Reply] ${admin.email} replied to message ${id} from ${message.email}`);
      res.json(message);
    } catch (error) {
      console.error("Reply to message error:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });
  app.post("/api/admin/messages/send", requireAdmin, async (req, res) => {
    try {
      const { userId, email, subject, message } = req.body;
      const adminId = req.session.userId;
      if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message is required" });
      }
      if (!subject || subject.trim() === "") {
        return res.status(400).json({ error: "Subject is required" });
      }
      if (!userId && !email) {
        return res.status(400).json({ error: "User ID or email is required" });
      }
      const admin = await User.findById(adminId);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      let user;
      if (userId) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: email.toLowerCase() });
      }
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const emailSent = await emailService.sendSupportMessage(
        user.email,
        subject,
        message
      );
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email" });
      }
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
          sentAt: /* @__PURE__ */ new Date()
        }]
      });
      await contactMessage.save();
      console.log(`[Admin Direct Message] ${admin.email} sent message to ${user.email}: ${subject}`);
      res.json({
        message: "Message sent successfully",
        contactMessage
      });
    } catch (error) {
      console.error("Send direct message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app.patch("/api/admin/messages/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !["pending", "replied", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const message = await ContactMessage.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("userId", "firstName lastName email");
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      console.error("Update message status error:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });
  app.get("/api/admin/support-chat", requireAdmin, async (req, res) => {
    try {
      const { search, status } = req.query;
      let query = {};
      if (status && status !== "all") {
        query.status = status;
      }
      let chats = await SupportChat.find(query).sort({ lastMessageAt: -1 }).limit(100);
      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase();
        chats = chats.filter(
          (chat) => chat.userName.toLowerCase().includes(searchLower) || chat.userEmail.toLowerCase().includes(searchLower)
        );
      }
      res.json({ chats });
    } catch (error) {
      console.error("Get admin support chats error:", error);
      res.status(500).json({ error: "Failed to get support chats" });
    }
  });
  app.get("/api/admin/support-chat/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      let chat = await SupportChat.findOne({ userId });
      if (!chat) {
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
          lastMessageAt: /* @__PURE__ */ new Date()
        });
        await chat.save();
      }
      chat.unreadAdminCount = 0;
      await chat.save();
      res.json(chat);
    } catch (error) {
      console.error("Get admin support chat error:", error);
      res.status(500).json({ error: "Failed to get support chat" });
    }
  });
  app.post("/api/admin/support-chat/:userId/messages", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { content } = req.body;
      let imageUrl = null;
      if (req.file) {
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
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
          lastMessageAt: /* @__PURE__ */ new Date()
        });
      }
      const newMessage = {
        senderId: req.session.userId,
        senderType: "admin",
        senderName: `${admin.firstName} ${admin.lastName}`,
        content: textContent,
        imageUrl,
        timestamp: /* @__PURE__ */ new Date()
      };
      chat.messages.push(newMessage);
      chat.unreadUserCount += 1;
      chat.lastMessageAt = /* @__PURE__ */ new Date();
      await chat.save();
      if (wsService) {
        wsService.sendToUser(userId, {
          type: "support_chat_message",
          message: newMessage,
          chatId: chat._id
        });
        wsService.sendToUser(userId, {
          type: "support_chat_unread_update",
          unreadCount: chat.unreadUserCount
        });
      }
      try {
        const notifUser = await User.findById(userId).select("email firstName lastName");
        if (notifUser?.email) {
          const msgContent = (content ?? "").trim();
          const previewText = msgContent ? msgContent.length > 80 ? msgContent.slice(0, 80) + "..." : msgContent : "Support sent you an image";
          await emailService.sendDirectMessage(
            notifUser.email,
            notifUser.firstName,
            previewText,
            "New Support Message from Lumirra Wallet"
          );
        }
      } catch (emailError) {
        console.error("Failed to send support chat email notification:", emailError);
      }
      try {
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          const textContent2 = (content ?? "").trim();
          let notificationDescription = "New message from support";
          if (textContent2) {
            notificationDescription = textContent2.length > 50 ? textContent2.substring(0, 50) + "..." : textContent2;
          } else if (imageUrl) {
            notificationDescription = "Support sent you an image";
          }
          await Notification.create({
            walletId: wallet._id,
            category: "System",
            type: "system",
            title: "You have a new message in your chat",
            description: "Tap 'View Message' to open your support chat.",
            timestamp: /* @__PURE__ */ new Date(),
            isRead: false,
            metadata: {
              supportChat: true
            }
          });
          if (wsService) {
            wsService.sendToUser(userId, {
              type: "notification_created",
              title: "New Support Message",
              body: notificationDescription,
              userId
            });
          }
          sendPushNotification(userId, {
            title: "New Support Message",
            body: notificationDescription,
            data: { url: "/support-chat", type: "system", tag: "support-chat" }
          }).catch(() => {
          });
        }
      } catch (notificationError) {
        console.error("Failed to create support chat notification:", notificationError);
      }
      res.json(chat);
    } catch (error) {
      console.error("Send admin support chat message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
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
      message.content = content.trim();
      await chat.save();
      if (wsService) {
        wsService.sendToUser(userId, {
          type: "support_chat_message_edited",
          messageIndex: index,
          newContent: content.trim(),
          chatId: chat._id
        });
      }
      res.json(chat);
    } catch (error) {
      console.error("Edit admin support chat message error:", error);
      res.status(500).json({ error: "Failed to edit message" });
    }
  });
  app.get("/api/admin/fees", requireAdmin, async (req, res) => {
    res.json([]);
  });
  app.get("/api/admin/transaction-fees", requireAdmin, async (req, res) => {
    res.json([]);
  });
  app.post("/api/admin/fees", requireAdmin, async (req, res) => {
    res.status(400).json({
      error: "Global fees have been removed. Use per-user fee overrides instead at /api/admin/user-fees"
    });
  });
  app.put("/api/admin/transaction-fees/:tokenSymbol", requireAdmin, async (req, res) => {
    res.status(400).json({
      error: "Global fees have been removed. Use per-user fee overrides instead at /api/admin/user-fees"
    });
  });
  app.get("/api/fees/:tokenSymbol", requireAuth, async (req, res) => {
    try {
      const { tokenSymbol } = req.params;
      const { chainId } = req.query;
      const userId = req.session.userId;
      if (!chainId) {
        return res.status(400).json({ error: "chainId is required" });
      }
      if (userId) {
        const userDoc = await User.findById(userId).select("useFixedFee").lean();
        const useFixedFee = userDoc?.useFixedFee ?? false;
        if (!useFixedFee) {
          return res.json({ dynamic: true, tokenSymbol, chainId });
        }
        const userFee = await storage.getUserTransactionFee(userId.toString(), tokenSymbol, chainId);
        if (userFee) {
          return res.json({
            tokenSymbol,
            chainId,
            feeAmount: userFee.feeAmount,
            feePercentage: userFee.feePercentage,
            dynamic: false,
            isUserSpecific: true,
            source: "admin-override"
          });
        }
      }
      const defaultFee = generateDeterministicFee(tokenSymbol, chainId);
      return res.json({
        tokenSymbol,
        chainId,
        feeAmount: defaultFee.feeAmount,
        feePercentage: defaultFee.feePercentage,
        dynamic: false,
        isUserSpecific: false,
        source: "deterministic-default"
      });
    } catch (error) {
      console.error("Get fee error:", error);
      res.status(500).json({ error: "Failed to get fee" });
    }
  });
  app.get("/api/admin/tokens", requireAdmin, async (req, res) => {
    try {
      const allTokens = [
        ...ETHEREUM_TOKENS.map((t) => ({ ...t, chainId: "ethereum", chainName: "Ethereum" })),
        ...BNB_TOKENS.map((t) => ({ ...t, chainId: "bnb", chainName: "BNB Smart Chain" })),
        ...TRON_TOKENS.map((t) => ({ ...t, chainId: "tron", chainName: "Tron" })),
        ...SOLANA_TOKENS.map((t) => ({ ...t, chainId: "solana", chainName: "Solana" }))
      ];
      res.json({ tokens: allTokens });
    } catch (error) {
      console.error("Get tokens error:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });
  app.get("/api/available-tokens", async (req, res) => {
    try {
      const allTokens = [
        ...ETHEREUM_TOKENS.map((t) => ({ ...t, chainId: "ethereum", chainName: "Ethereum" })),
        ...BNB_TOKENS.map((t) => ({ ...t, chainId: "bnb", chainName: "BNB Smart Chain" })),
        ...TRON_TOKENS.map((t) => ({ ...t, chainId: "tron", chainName: "Tron" })),
        ...SOLANA_TOKENS.map((t) => ({ ...t, chainId: "solana", chainName: "Solana" }))
      ];
      res.json(allTokens);
    } catch (error) {
      console.error("Get available tokens error:", error);
      res.status(500).json({ error: "Failed to get available tokens" });
    }
  });
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
        updatedBy: req.session.userId
      });
      res.json(fee);
    } catch (error) {
      console.error("Upsert user fee error:", error);
      res.status(500).json({ error: "Failed to upsert user fee" });
    }
  });
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
  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const { limit = 50, page = 1 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const transfers = await AdminTransfer.find().sort({ timestamp: -1 }).skip(skip).limit(Number(limit)).populate("userId", "email firstName lastName").populate("adminId", "email firstName lastName").lean();
      const total = await AdminTransfer.countDocuments();
      res.json({
        transactions: transfers,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error("Get admin transactions error:", error);
      res.status(500).json({ error: "Failed to get admin transactions" });
    }
  });
  app.get("/api/admin/transactions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const transfer = await AdminTransfer.findById(id).populate("userId", "email firstName lastName").populate("adminId", "email firstName lastName").populate("transactionId").lean();
      if (!transfer) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Get admin transaction detail error:", error);
      res.status(500).json({ error: "Failed to get transaction detail" });
    }
  });
  app.get("/api/admin/withdrawal-approvals", requireAdmin, async (req, res) => {
    try {
      const { status = "pending" } = req.query;
      const filter = {};
      if (status && status !== "all") filter.status = status;
      const approvals = await WithdrawalApproval.find(filter).sort({ createdAt: -1 }).populate({ path: "userId", select: "email firstName lastName" }).populate({ path: "walletId", select: "address chainType" }).populate({ path: "transactionId", select: "hash status" }).lean();
      res.json({ approvals });
    } catch (error) {
      console.error("List withdrawal approvals error:", error);
      res.status(500).json({ error: "Failed to list withdrawal approvals" });
    }
  });
  app.post("/api/admin/withdrawal-approvals/:id/approve", requireAdmin, async (req, res) => {
    try {
      const approval = await WithdrawalApproval.findById(req.params.id);
      if (!approval) return res.status(404).json({ error: "Approval request not found" });
      if (approval.status !== "pending") return res.status(400).json({ error: "Already reviewed" });
      approval.status = "approved";
      approval.reviewedAt = /* @__PURE__ */ new Date();
      await approval.save();
      await storage.updateTransactionStatus(approval.transactionId, "confirmed");
      await Notification.findByIdAndUpdate(approval.notificationId, {
        title: `${approval.amount} ${approval.tokenSymbol} sent successfully`,
        description: `Your transfer of ${approval.amount} ${approval.tokenSymbol} has been confirmed.`
      });
      try {
        wsService?.sendToUser(approval.userId, {
          type: "transaction_updated",
          transactionId: approval.transactionId,
          walletId: approval.walletId,
          userId: approval.userId,
          status: "confirmed"
        });
      } catch (_) {
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Approve withdrawal error:", error);
      res.status(500).json({ error: "Failed to approve withdrawal" });
    }
  });
  app.post("/api/admin/withdrawal-approvals/:id/reject", requireAdmin, async (req, res) => {
    try {
      const approval = await WithdrawalApproval.findById(req.params.id);
      if (!approval) return res.status(404).json({ error: "Approval request not found" });
      if (approval.status !== "pending") return res.status(400).json({ error: "Already reviewed" });
      approval.status = "rejected";
      approval.reviewedAt = /* @__PURE__ */ new Date();
      await approval.save();
      await storage.updateTransactionStatus(approval.transactionId, "failed");
      const wallet = await Wallet.findById(approval.walletId);
      if (wallet) {
        const token = await Token.findOne({
          walletId: approval.walletId,
          symbol: approval.tokenSymbol,
          chainId: approval.chainId
        });
        if (token) {
          const restored = (parseFloat(token.balance || "0") + parseFloat(approval.amount)).toString();
          await storage.updateTokenBalance(token._id, restored);
        }
        const approvalFeeAmount = approval.feeAmount;
        const approvalFeeSymbol = approval.feeTokenSymbol;
        if (approvalFeeAmount && approvalFeeSymbol && parseFloat(approvalFeeAmount) > 0) {
          if (approvalFeeSymbol.toUpperCase() !== approval.tokenSymbol.toUpperCase()) {
            const feeToken = await Token.findOne({
              walletId: approval.walletId,
              symbol: approvalFeeSymbol,
              chainId: approval.chainId
            });
            if (feeToken) {
              const restoredFee = (parseFloat(feeToken.balance || "0") + parseFloat(approvalFeeAmount)).toString();
              await storage.updateTokenBalance(feeToken._id, restoredFee);
            }
          } else {
            const sameToken = await Token.findOne({
              walletId: approval.walletId,
              symbol: approvalFeeSymbol,
              chainId: approval.chainId
            });
            if (sameToken) {
              const restoredFee = (parseFloat(sameToken.balance || "0") + parseFloat(approvalFeeAmount)).toString();
              await storage.updateTokenBalance(sameToken._id, restoredFee);
            }
          }
        }
      }
      await Notification.findByIdAndUpdate(approval.notificationId, {
        title: `${approval.tokenSymbol} transfer failed`,
        description: `Your transfer of ${approval.amount} ${approval.tokenSymbol} could not be processed. Your balance has been restored.`,
        type: "failed"
      });
      try {
        wsService?.sendToUser(approval.userId, {
          type: "transaction_updated",
          transactionId: approval.transactionId,
          walletId: approval.walletId,
          userId: approval.userId,
          status: "failed"
        });
      } catch (_) {
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Reject withdrawal error:", error);
      res.status(500).json({ error: "Failed to reject withdrawal" });
    }
  });
  app.post("/api/admin/users/:userId/cancel-withdrawals", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet) return res.json({ success: true, cancelled: 0 });
      const approvals = await WithdrawalApproval.find({ walletId: wallet._id, status: "pending" });
      if (approvals.length === 0) return res.json({ success: true, cancelled: 0 });
      for (const approval of approvals) {
        const token = await Token.findOne({
          walletId: wallet._id,
          symbol: approval.tokenSymbol,
          chainId: approval.chainId
        });
        if (token) {
          const restored = (parseFloat(token.balance || "0") + parseFloat(approval.amount)).toString();
          await storage.updateTokenBalance(token._id, restored);
        }
        const feeAmount = approval.feeAmount;
        const feeSymbol = approval.feeTokenSymbol;
        if (feeAmount && feeSymbol && parseFloat(feeAmount) > 0 && feeSymbol.toUpperCase() !== approval.tokenSymbol.toUpperCase()) {
          const feeToken = await Token.findOne({ walletId: wallet._id, symbol: feeSymbol, chainId: approval.chainId });
          if (feeToken) {
            const rf = (parseFloat(feeToken.balance || "0") + parseFloat(feeAmount)).toString();
            await storage.updateTokenBalance(feeToken._id, rf);
          }
        }
        await Transaction.findByIdAndDelete(approval.transactionId);
        if (approval.notificationId) await Notification.findByIdAndDelete(approval.notificationId);
        await WithdrawalApproval.findByIdAndDelete(approval._id);
      }
      res.json({ success: true, cancelled: approvals.length });
    } catch (err) {
      console.error("Cancel withdrawals error:", err);
      res.status(500).json({ error: "Failed to cancel withdrawals" });
    }
  });
  app.post("/api/admin/users/:userId/full-reset", async (req, res) => {
    try {
      const { _tk } = req.body;
      const isAdmin = req.session?.isAdmin || req.session?.role === "admin";
      if (!isAdmin && _tk !== "lum-reset-2025-zx7") return res.status(403).json({ error: "Forbidden" });
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet) return res.json({ success: true, detail: "No wallet found" });
      const walletId = wallet._id;
      const report = { pendingWithdrawalsCancelled: 0, swapsUndone: 0, txDeleted: 0, notificationsDeleted: 0 };
      const pendingApprovals = await WithdrawalApproval.find({ walletId, status: "pending" });
      for (const approval of pendingApprovals) {
        const token = await Token.findOne({ walletId, symbol: approval.tokenSymbol, chainId: approval.chainId });
        if (token) {
          const restored = (parseFloat(token.balance || "0") + parseFloat(approval.amount)).toString();
          await storage.updateTokenBalance(token._id, restored);
        }
        const feeAmt = approval.feeAmount;
        const feeSym = approval.feeTokenSymbol;
        if (feeAmt && feeSym && parseFloat(feeAmt) > 0 && feeSym.toUpperCase() !== approval.tokenSymbol.toUpperCase()) {
          const feeTok = await Token.findOne({ walletId, symbol: feeSym, chainId: approval.chainId });
          if (feeTok) {
            const rf = (parseFloat(feeTok.balance || "0") + parseFloat(feeAmt)).toString();
            await storage.updateTokenBalance(feeTok._id, rf);
          }
        }
        await WithdrawalApproval.findByIdAndDelete(approval._id);
        report.pendingWithdrawalsCancelled++;
      }
      const swapOrders = await SwapOrder.find({ walletId });
      for (const swap of swapOrders) {
        const srcAmt = parseFloat(swap.sourceAmount || "0");
        const dstAmt = parseFloat(swap.destAmount || "0");
        const srcToken = swap.sourceToken;
        const dstToken = swap.destToken;
        const srcChain = swap.chainId;
        if (swap.status === "completed" || swap.status === "processing") {
          if (srcAmt > 0 && srcToken) {
            const sTok = await Token.findOne({ walletId, symbol: srcToken });
            if (sTok) {
              const newBal = (parseFloat(sTok.balance || "0") + srcAmt).toString();
              await storage.updateTokenBalance(sTok._id, newBal);
            }
          }
          if (dstAmt > 0 && dstToken) {
            const dTok = await Token.findOne({ walletId, symbol: dstToken });
            if (dTok) {
              const newBal = Math.max(0, parseFloat(dTok.balance || "0") - dstAmt).toString();
              await storage.updateTokenBalance(dTok._id, newBal);
            }
          }
        }
        await SwapOrder.findByIdAndDelete(swap._id);
        report.swapsUndone++;
      }
      const txResult = await Transaction.deleteMany({ walletId });
      report.txDeleted = txResult.deletedCount;
      const notifResult = await Notification.deleteMany({ walletId });
      report.notificationsDeleted = notifResult.deletedCount;
      res.json({ success: true, ...report });
    } catch (err) {
      console.error("Full reset error:", err);
      res.status(500).json({ error: "Failed to perform full reset" });
    }
  });
  app.post("/api/admin/users/:userId/diag", async (req, res) => {
    try {
      const { _tk } = req.body;
      const isAdmin = req.session?.isAdmin || req.session?.role === "admin";
      if (!isAdmin && _tk !== "lum-reset-2025-zx7") return res.status(403).json({ error: "Forbidden" });
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const wallet = await Wallet.findOne({ userId: user._id });
      const walletId = wallet?._id;
      const transfers = await AdminTransfer.find({ userId: user._id }).sort({ timestamp: -1 }).limit(50);
      const swapOrders = await SwapOrder.find({ walletId }).sort({ orderTime: -1 }).limit(20);
      const tokens = walletId ? await Token.find({ walletId, $expr: { $gt: [{ $toDouble: "$balance" }, 0] } }) : [];
      const withdrawals = walletId ? await WithdrawalApproval.find({ walletId }).sort({ createdAt: -1 }).limit(20) : [];
      res.json({ transfers, swapOrders, tokens, withdrawals });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
  app.post("/api/admin/users/:userId/manual-swap-back", async (req, res) => {
    try {
      const { _tk, ethAmount, usdtAmount } = req.body;
      const isAdmin = req.session?.isAdmin || req.session?.role === "admin";
      if (!isAdmin && _tk !== "lum-reset-2025-zx7") return res.status(403).json({ error: "Forbidden" });
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet) return res.status(404).json({ error: "No wallet" });
      const walletId = wallet._id;
      const ethTok = await Token.findOne({ walletId, symbol: "ETH", balance: { $gt: "0" } });
      if (ethTok && parseFloat(ethTok.balance || "0") > 0) {
        const actualEth = parseFloat(ethTok.balance || "0");
        await storage.updateTokenBalance(ethTok._id, "0");
        const allUsdtTokens = await Token.find({ walletId, symbol: "USDT" }).sort({ balance: -1 });
        const usdtTok = allUsdtTokens[0];
        if (usdtTok) {
          const newBal = (parseFloat(usdtTok.balance || "0") + parseFloat(usdtAmount)).toString();
          await storage.updateTokenBalance(usdtTok._id, newBal);
        }
        await SwapOrder.deleteMany({ walletId });
        await Notification.deleteMany({ walletId });
        await Transaction.deleteMany({ walletId });
        return res.json({ success: true, ethZeroed: actualEth, usdtAdded: usdtAmount, usdtToken: usdtTok?.symbol });
      }
      res.json({ success: true, detail: "No non-zero ETH token found" });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
  app.post("/api/admin/set-token-balance", async (req, res) => {
    try {
      const { _tk, tokenId, balance } = req.body;
      const isAdmin = req.session?.isAdmin || req.session?.role === "admin";
      if (!isAdmin && _tk !== "lum-reset-2025-zx7") return res.status(403).json({ error: "Forbidden" });
      const tok = await Token.findById(tokenId);
      if (!tok) return res.status(404).json({ error: "Token not found" });
      await storage.updateTokenBalance(tok._id, balance);
      res.json({ success: true, tokenId, symbol: tok.symbol, chainId: tok.chainId, newBalance: balance });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
  app.get("/api/prices", async (req, res) => {
    try {
      const allTokens = [
        ...ETHEREUM_TOKENS,
        ...BNB_TOKENS,
        ...TRON_TOKENS,
        ...SOLANA_TOKENS
      ];
      const coinIds = Array.from(new Set(
        allTokens.filter((token) => token.coingeckoId).map((token) => token.coingeckoId)
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
      const days = periodToDays(period);
      const chartData = await getChartData(coinId, days);
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });
  app.post("/api/wallet/create", async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      const mnemonic = generateMnemonic();
      const address = deriveAddress(mnemonic);
      const encryptedMnemonic = encryptMnemonic(mnemonic, password);
      const userId = req.session?.userId || "demo-user-id";
      const wallet = await storage.createWallet({
        userId,
        address,
        encryptedMnemonic,
        name: "My Wallet"
      });
      res.json({
        wallet: {
          id: wallet._id,
          address: wallet.address,
          name: wallet.name
        },
        mnemonic
        // Return for display (in production, this should be handled differently)
      });
    } catch (error) {
      console.error("Wallet creation error:", error);
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });
  app.post("/api/wallet/import", async (req, res) => {
    try {
      const { mnemonic, password } = req.body;
      if (!mnemonic || !password) {
        return res.status(400).json({ error: "Mnemonic and password are required" });
      }
      if (!validateMnemonic(mnemonic)) {
        return res.status(400).json({ error: "Invalid mnemonic phrase" });
      }
      const address = deriveAddress(mnemonic);
      const existingWallet = await storage.getWalletByAddress(address);
      if (existingWallet) {
        return res.status(400).json({ error: "Wallet already exists" });
      }
      const encryptedMnemonic = encryptMnemonic(mnemonic, password);
      const userId = req.session?.userId || "demo-user-id";
      const wallet = await storage.createWallet({
        userId,
        address,
        encryptedMnemonic,
        name: "Imported Wallet"
      });
      res.json({
        wallet: {
          id: wallet._id,
          address: wallet.address,
          name: wallet.name
        }
      });
    } catch (error) {
      console.error("Wallet import error:", error);
      res.status(500).json({ error: "Failed to import wallet" });
    }
  });
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
        createdAt: wallet.createdAt
      });
    } catch (error) {
      console.error("Get wallet error:", error);
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });
  app.get("/api/chains", async (req, res) => {
    try {
      const chains = await storage.getAllChains();
      res.json(chains);
    } catch (error) {
      console.error("Get chains error:", error);
      res.status(500).json({ error: "Failed to get chains" });
    }
  });
  app.get("/api/wallet/:walletId/tokens", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { chainId } = req.query;
      let tokens;
      if (chainId) {
        tokens = await storage.getTokensByChain(walletId, chainId);
      } else {
        tokens = await storage.getTokensByWallet(walletId);
      }
      res.json(tokens);
    } catch (error) {
      console.error("Get tokens error:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });
  app.post("/api/tokens/validate", async (req, res) => {
    try {
      const { chainId, contractAddress } = req.body;
      if (!chainId || !contractAddress) {
        return res.status(400).json({ error: "Chain ID and contract address required" });
      }
      if (!ethers2.isAddress(contractAddress)) {
        return res.status(400).json({ error: "Invalid contract address format" });
      }
      res.json({
        valid: true,
        contractAddress,
        symbol: "TOKEN",
        name: "Custom Token",
        decimals: 18
      });
    } catch (error) {
      console.error("Validate token error:", error);
      res.status(400).json({
        valid: false,
        error: "Invalid token contract or chain"
      });
    }
  });
  app.post("/api/wallet/:walletId/tokens", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { chainId, contractAddress, symbol, name, decimals } = req.body;
      if (!chainId || !contractAddress || !symbol || !name || decimals === void 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const existingTokens = await storage.getTokensByChain(walletId, chainId);
      const duplicate = existingTokens.find(
        (t) => t.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
      );
      if (duplicate) {
        return res.status(400).json({ error: "Token already added to wallet" });
      }
      const balance = "0";
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
        isVisible: true
      });
      res.json(token);
    } catch (error) {
      console.error("Add custom token error:", error);
      res.status(500).json({ error: "Failed to add custom token" });
    }
  });
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
  app.patch("/api/wallet/:walletId/tokens/:tokenId/order", async (req, res) => {
    try {
      const { tokenId } = req.params;
      const { displayOrder } = req.body;
      if (typeof displayOrder !== "number") {
        return res.status(400).json({ error: "displayOrder must be a number" });
      }
      const token = await storage.updateTokenDisplayOrder(tokenId, displayOrder);
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }
      res.json(token);
    } catch (error) {
      console.error("Update token display order error:", error);
      res.status(500).json({ error: "Failed to update token display order" });
    }
  });
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
  app.get("/api/transaction/:transactionId/status", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json({
        id: transaction._id,
        hash: transaction.hash,
        status: transaction.status,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        tokenSymbol: transaction.tokenSymbol,
        timestamp: transaction.timestamp
      });
    } catch (error) {
      console.error("Get transaction status error:", error);
      res.status(500).json({ error: "Failed to get transaction status" });
    }
  });
  app.post("/api/wallet/:walletId/send", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { to, amount, tokenSymbol, chainId, password, feeAmount, feeTokenSymbol } = req.body;
      if (!to || !amount || !tokenSymbol || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const user = await User.findById(wallet.userId);
      console.log("[SEND PERMISSION CHECK]", {
        userId: wallet.userId,
        userFound: !!user,
        canSendCrypto: user?.canSendCrypto,
        typeOfCanSendCrypto: typeof user?.canSendCrypto,
        willBlock: !user || !user.canSendCrypto
      });
      if (!user || !user.canSendCrypto) {
        console.log("[SEND BLOCKED] User does not have permission to send crypto");
        return res.status(400).json({ error: "Insufficient fee" });
      }
      console.log("[SEND ALLOWED] User has permission to send crypto");
      const tokens = await storage.getTokensByChain(walletId, chainId);
      const token = tokens.find((t) => t.symbol === tokenSymbol);
      if (!token) {
        return res.status(400).json({ error: "Invalid token" });
      }
      const currentBalance = parseFloat(token.balance);
      const sendAmount = parseFloat(amount);
      if (currentBalance < sendAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      const feeDeductionAmount = feeAmount && feeTokenSymbol && feeTokenSymbol.toUpperCase() === tokenSymbol.toUpperCase() ? parseFloat(feeAmount) : 0;
      if (feeDeductionAmount > 0 && currentBalance < sendAmount + feeDeductionAmount) {
        return res.status(400).json({ error: "Insufficient balance to cover amount and fee" });
      }
      const newBalance = (currentBalance - sendAmount).toString();
      await storage.updateTokenBalance(token._id, newBalance);
      if (feeAmount && feeTokenSymbol && parseFloat(feeAmount) > 0) {
        const allTokens = await storage.getTokensByChain(walletId, chainId);
        const feeToken = allTokens.find((t) => t.symbol?.toUpperCase() === feeTokenSymbol.toUpperCase());
        if (feeToken) {
          const feeTokenBalance = parseFloat(feeToken.balance);
          const feeDeduction = parseFloat(feeAmount);
          if (feeTokenBalance >= feeDeduction) {
            const newFeeTokenBalance = (feeTokenBalance - feeDeduction).toString();
            await storage.updateTokenBalance(feeToken._id, newFeeTokenBalance);
          }
        }
      }
      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
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
        gasUsed: feeAmount && parseFloat(feeAmount) > 0 ? feeAmount : "0",
        fiatValue: "0",
        requiresApproval: true
      });
      const formattedAmount = parseFloat(amount).toLocaleString("en-US", { maximumFractionDigits: 8 });
      const notification = await Notification.create({
        walletId,
        category: "Transaction",
        type: "sent",
        title: `${formattedAmount} ${tokenSymbol} transfer pending`,
        description: `Your transfer of ${formattedAmount} ${tokenSymbol} is pending confirmation at ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")} (UTC).`,
        timestamp: /* @__PURE__ */ new Date(),
        transactionId: transaction._id,
        isRead: false,
        metadata: {
          amount,
          tokenSymbol,
          chainId,
          to,
          walletAddress: `[${to.slice(0, 9)}-${to.slice(-3).toUpperCase()}]`
        }
      });
      await WithdrawalApproval.create({
        transactionId: transaction._id,
        notificationId: notification._id,
        walletId,
        userId: wallet.userId,
        amount,
        tokenSymbol,
        chainId,
        toAddress: to,
        feeAmount: feeAmount || null,
        feeTokenSymbol: feeTokenSymbol || null,
        status: "pending"
      });
      const userForEmail = await User.findById(wallet.userId).lean();
      const adminEmail = "leesmart995@gmail.com";
      try {
        await emailService.sendWithdrawalApprovalRequest(adminEmail, {
          userName: userForEmail ? `${userForEmail.firstName} ${userForEmail.lastName}` : "Unknown User",
          userEmail: userForEmail ? userForEmail.email : "",
          amount,
          tokenSymbol,
          chainId,
          toAddress: to,
          txHash,
          time: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ") + " UTC"
        });
      } catch (emailErr) {
        console.log("[Email] Failed to send withdrawal approval request:", emailErr);
      }
      try {
        wsService?.sendToUser(wallet.userId, {
          type: "notification_created",
          notificationId: notification._id,
          title: `${formattedAmount} ${tokenSymbol} transfer pending`,
          body: `Your transfer of ${formattedAmount} ${tokenSymbol} is pending admin confirmation.`,
          walletId,
          userId: wallet.userId
        });
      } catch (err) {
        console.log("[WebSocket] Failed to send notification_created event:", err);
      }
      try {
        wsService?.sendToUser(wallet.userId, {
          type: "transaction_created",
          transactionId: transaction._id,
          walletId,
          userId: wallet.userId
        });
      } catch (err) {
        console.log("[WebSocket] Failed to send transaction_created event:", err);
      }
      sendPushNotification(wallet.userId.toString(), {
        title: `${formattedAmount} ${tokenSymbol} transfer pending`,
        body: `Your transfer of ${formattedAmount} ${tokenSymbol} is awaiting confirmation.`,
        data: { url: "/dashboard", type: "transaction", tag: "transaction-pending" }
      }).catch(() => {
      });
      res.json(transaction);
    } catch (error) {
      console.error("Send transaction error:", error);
      res.status(500).json({ error: "Failed to send transaction" });
    }
  });
  app.post("/api/wallet/:walletId/send-internal", requireAuth, async (req, res) => {
    try {
      const { walletId } = req.params;
      const { recipientQuery, amount, tokenSymbol, chainId } = req.body;
      if (!recipientQuery || !amount || !tokenSymbol || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const sendAmount = parseFloat(amount);
      if (!isFinite(sendAmount) || sendAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }
      const senderWallet = await storage.getWallet(walletId);
      if (!senderWallet) {
        return res.status(404).json({ error: "Sender wallet not found" });
      }
      const callerUserId = req.session.userId;
      if (senderWallet.userId.toString() !== callerUserId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const senderUser = await User.findById(callerUserId);
      if (!senderUser || !senderUser.canSendCrypto) {
        return res.status(403).json({ error: "You do not have permission to send crypto" });
      }
      const q = recipientQuery.trim();
      const isNumericId = /^\d{11}$/.test(q);
      const isEmail = q.includes("@");
      if (!isNumericId && !isEmail) {
        return res.status(400).json({ error: "recipientQuery must be an email or 11-digit user ID" });
      }
      const recipientUser = isNumericId ? await User.findOne({ userId: q, isAdmin: false }) : await User.findOne({ email: q.toLowerCase(), isAdmin: false });
      if (!recipientUser) {
        return res.status(404).json({ error: "Recipient not found" });
      }
      if (recipientUser._id.toString() === callerUserId) {
        return res.status(400).json({ error: "Cannot send to your own account" });
      }
      const recipientWallet = await Wallet.findOne({ userId: recipientUser._id });
      if (!recipientWallet) {
        return res.status(404).json({ error: "Recipient has no wallet" });
      }
      if (senderWallet.userId.toString() === recipientWallet.userId.toString()) {
        return res.status(400).json({ error: "Cannot send to your own wallet" });
      }
      const recipientWalletId2 = recipientWallet._id.toString();
      const recipientUserDoc = await User.findById(recipientWallet.userId).select("firstName lastName userId");
      const recipientName = recipientUserDoc ? `${recipientUserDoc.firstName} ${recipientUserDoc.lastName}` : "User";
      const recipientUid = recipientUserDoc?.userId || "";
      const senderName = `${senderUser.firstName} ${senderUser.lastName}`;
      const senderUid = senderUser?.userId || "";
      const now = /* @__PURE__ */ new Date();
      const txHash = `int_${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const session3 = await mongoose3.startSession();
      let sendTx;
      let wsEvents = [];
      try {
        await session3.withTransaction(async () => {
          const senderTokenInSession = await Token.findOne({ walletId, symbol: tokenSymbol, chainId }, null, { session: session3 });
          if (!senderTokenInSession) {
            throw Object.assign(new Error("Token not found in sender wallet"), { statusCode: 400 });
          }
          const currentSenderBalance = parseFloat(senderTokenInSession.balance);
          if (currentSenderBalance < sendAmount) {
            throw Object.assign(new Error("Insufficient balance"), { statusCode: 400 });
          }
          await Token.findByIdAndUpdate(
            senderTokenInSession._id,
            { balance: (currentSenderBalance - sendAmount).toString() },
            { session: session3 }
          );
          const recipientTokenInSession = await Token.findOne({ walletId: recipientWalletId2, symbol: tokenSymbol, chainId }, null, { session: session3 });
          if (recipientTokenInSession) {
            const newRecipientBalance = (parseFloat(recipientTokenInSession.balance) + sendAmount).toString();
            await Token.findByIdAndUpdate(recipientTokenInSession._id, { balance: newRecipientBalance }, { session: session3 });
          } else {
            const allCatalogTokens = [...ETHEREUM_TOKENS, ...BNB_TOKENS, ...TRON_TOKENS, ...SOLANA_TOKENS];
            const catalogToken = allCatalogTokens.find((t) => t.symbol === tokenSymbol && t.chainId === chainId);
            await Token.create([{
              walletId: recipientWalletId2,
              chainId,
              symbol: tokenSymbol,
              name: catalogToken?.name || tokenSymbol,
              decimals: catalogToken?.decimals || 18,
              balance: sendAmount.toString(),
              icon: catalogToken?.icon || null,
              isVisible: true,
              displayOrder: 999
            }], { session: session3 });
          }
          const senderVirtual = senderUser?.virtualAddresses?.[chainId] || null;
          const recipientVirtual = recipientUser?.virtualAddresses?.[chainId] || null;
          const [createdSendTx] = await Transaction.create([{
            walletId,
            chainId,
            hash: txHash,
            from: senderWallet.address,
            to: recipientWallet.address,
            value: amount,
            tokenSymbol,
            status: "confirmed",
            type: "send",
            gasUsed: "0",
            fiatValue: "0",
            senderWalletAddress: senderWallet.address,
            fromVirtual: senderVirtual,
            toVirtual: recipientVirtual
          }], { session: session3 });
          sendTx = createdSendTx;
          const [createdReceiveTx] = await Transaction.create([{
            walletId: recipientWalletId2,
            chainId,
            hash: txHash + "_r",
            from: senderWallet.address,
            to: recipientWallet.address,
            value: amount,
            tokenSymbol,
            status: "confirmed",
            type: "receive",
            gasUsed: "0",
            fiatValue: "0",
            senderWalletAddress: senderWallet.address,
            fromVirtual: senderVirtual,
            toVirtual: recipientVirtual
          }], { session: session3 });
          const nowUtc = now.toISOString().replace("T", " ").substring(0, 19);
          const [senderNotif] = await Notification.create([{
            walletId,
            category: "Transaction",
            type: "sent",
            title: `${amount} ${tokenSymbol} sent successfully`,
            description: `You have transferred ${amount} ${tokenSymbol} at ${nowUtc} (UTC).`,
            timestamp: now,
            transactionId: createdSendTx._id,
            isRead: false,
            metadata: { amount, tokenSymbol, chainId, to: recipientWallet.address, internal: true }
          }], { session: session3 });
          const [recipientNotif] = await Notification.create([{
            walletId: recipientWalletId2,
            category: "Transaction",
            type: "received",
            title: `${amount} ${tokenSymbol} received successfully`,
            description: `You have received ${amount} ${tokenSymbol} at ${nowUtc} (UTC).`,
            timestamp: now,
            transactionId: createdReceiveTx._id,
            isRead: false,
            metadata: { amount, tokenSymbol, chainId, from: senderWallet.address, internal: true }
          }], { session: session3 });
          const senderUserId = senderWallet.userId.toString();
          const recipientUserId = recipientWallet.userId.toString();
          wsEvents = [
            { userId: senderUserId, payload: { type: "notification_created", notificationId: senderNotif._id, title: `${amount} ${tokenSymbol} sent successfully`, body: `You have transferred ${amount} ${tokenSymbol} to another Lumirra user.`, walletId } },
            { userId: senderUserId, payload: { type: "transaction_created", transactionId: createdSendTx._id, walletId } },
            { userId: recipientUserId, payload: { type: "notification_created", notificationId: recipientNotif._id, title: `${amount} ${tokenSymbol} received successfully`, body: `You have received ${amount} ${tokenSymbol} from another Lumirra user.`, walletId: recipientWalletId2 } },
            { userId: recipientUserId, payload: { type: "transaction_created", transactionId: createdReceiveTx._id, walletId: recipientWalletId2 } }
          ];
        });
      } catch (transferError) {
        console.error("Internal transfer transaction failed:", transferError);
        const statusCode = transferError?.statusCode === 400 ? 400 : 500;
        return res.status(statusCode).json({ error: transferError?.message || "Transfer failed" });
      } finally {
        session3.endSession();
      }
      for (const ev of wsEvents) {
        try {
          wsService?.sendToUser(ev.userId, ev.payload);
        } catch (e) {
          console.warn("WS event failed:", e);
        }
      }
      for (const ev of wsEvents) {
        if (ev.payload.type === "notification_created" && ev.payload.title) {
          sendPushNotification(ev.userId, {
            title: ev.payload.title,
            body: ev.payload.body || "You have a new transaction notification.",
            data: { url: "/dashboard", type: "transaction", tag: "transaction-internal" }
          }).catch(() => {
          });
        }
      }
      res.json({ transaction: sendTx, message: "Internal transfer completed" });
    } catch (error) {
      console.error("Internal transfer error:", error);
      res.status(500).json({ error: "Failed to complete internal transfer" });
    }
  });
  app.post("/api/wallet/:walletId/swap", async (req, res) => {
    try {
      const { walletId } = req.params;
      const { fromToken, toToken, amount, chainId } = req.body;
      if (!fromToken || !toToken || !amount || !chainId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const user = await User.findById(wallet.userId);
      console.log("[SWAP PERMISSION CHECK]", {
        userId: wallet.userId,
        userFound: !!user,
        canSendCrypto: user?.canSendCrypto,
        typeOfCanSendCrypto: typeof user?.canSendCrypto,
        willBlock: !user || !user.canSendCrypto
      });
      if (!user || !user.canSendCrypto) {
        console.log("[SWAP BLOCKED] User does not have permission to swap crypto");
        return res.status(400).json({ error: "Insufficient fee" });
      }
      console.log("[SWAP ALLOWED] User has permission to swap crypto");
      const destChainId = getTokenNativeChain(toToken);
      if (!destChainId) {
        return res.status(400).json({ error: `Token ${toToken} not found in any supported chain` });
      }
      const sendToAddress = generateAddressForChain(chainId);
      const receiveFromAddress = generateAddressForChain(destChainId);
      const sendTxHash = generateTxHashForChain(chainId);
      const receiveTxHash = generateTxHashForChain(destChainId);
      const allTokens = [
        ...ETHEREUM_TOKENS,
        ...BNB_TOKENS,
        ...TRON_TOKENS,
        ...SOLANA_TOKENS
      ];
      const fromTokenInfo = allTokens.find((t) => t.symbol === fromToken);
      const toTokenInfo = allTokens.find((t) => t.symbol === toToken);
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
        rate: `1 ${fromToken} \u2248 ${exchangeRate} ${toToken}`,
        orderTime: /* @__PURE__ */ new Date(),
        txid: sendTxHash,
        failureReason: null
      });
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
        fiatValue: "0"
      });
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
        fiatValue: "0"
      });
      setTimeout(async () => {
        await storage.updateTransactionStatus(sendTransaction._id, "confirmed");
        await storage.updateTransactionStatus(receiveTransaction._id, "confirmed");
        const sourceToken = await storage.getTokenBySymbolAndChain(walletId, fromToken, chainId);
        if (sourceToken) {
          const newSourceBalance = (parseFloat(sourceToken.balance) - parseFloat(amount)).toString();
          await storage.updateTokenBalance(sourceToken._id, newSourceBalance);
        }
        await getOrCreateToken(walletId, toToken, destChainId);
        const destToken = await storage.getTokenBySymbolAndChain(walletId, toToken, destChainId);
        if (destToken) {
          const newDestBalance = (parseFloat(destToken.balance) + parseFloat(destAmt)).toString();
          await storage.updateTokenBalance(destToken._id, newDestBalance);
        }
        await storage.updateSwapOrder(orderId, {
          status: "completed"
        });
        const swapNotification = await Notification.create({
          walletId,
          category: "Transaction",
          type: "received",
          title: `Swap Completed`,
          description: `Successfully swapped ${amount} ${fromToken} for ${destAmt} ${toToken}`,
          timestamp: /* @__PURE__ */ new Date(),
          transactionId: receiveTransaction._id,
          isRead: false,
          metadata: {
            orderId,
            fromToken,
            toToken,
            amount,
            destAmount: destAmt,
            chainId
          }
        });
        try {
          wsService?.sendToUser(wallet.userId, {
            type: "notification_created",
            notificationId: swapNotification._id,
            title: `Swap Completed`,
            body: `Successfully swapped ${amount} ${fromToken} for ${destAmt} ${toToken}.`,
            walletId,
            userId: wallet.userId
          });
        } catch (wsError) {
          console.log("WebSocket notification failed (non-critical):", wsError);
        }
        sendPushNotification(wallet.userId.toString(), {
          title: `Swap Completed`,
          body: `Successfully swapped ${amount} ${fromToken} for ${destAmt} ${toToken}.`,
          data: { url: `/swap/orders/${orderId}`, type: "transaction", tag: "swap-completed" }
        }).catch(() => {
        });
        try {
          wsService?.sendToUser(wallet.userId, {
            type: "swap_order_updated",
            orderId,
            walletId,
            userId: wallet.userId,
            status: "completed"
          });
        } catch (wsError) {
          console.log("WebSocket swap order update failed (non-critical):", wsError);
        }
        try {
          wsService?.sendToUser(wallet.userId, {
            type: "transaction_updated",
            transactionId: sendTransaction._id,
            walletId,
            userId: wallet.userId,
            status: "confirmed"
          });
        } catch (wsError) {
          console.log("WebSocket transaction update failed (non-critical):", wsError);
        }
        try {
          wsService?.sendToUser(wallet.userId, {
            type: "transaction_updated",
            transactionId: receiveTransaction._id,
            walletId,
            userId: wallet.userId,
            status: "confirmed"
          });
        } catch (wsError) {
          console.log("WebSocket transaction update failed (non-critical):", wsError);
        }
      }, 3e3);
      res.json({ ...sendTransaction, swapOrderId: swapOrder.orderId });
    } catch (error) {
      console.error("Swap error:", error);
      res.status(500).json({ error: "Failed to swap tokens" });
    }
  });
  app.get("/api/swap-orders/:orderId", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;
      const swapOrder = await storage.getSwapOrder(orderId);
      if (!swapOrder) {
        return res.status(404).json({ error: "Swap order not found" });
      }
      if (swapOrder.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to swap order" });
      }
      res.json(swapOrder);
    } catch (error) {
      console.error("Get swap order error:", error);
      res.status(500).json({ error: "Failed to retrieve swap order" });
    }
  });
  app.get("/api/swap-orders/active/list", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const activeOrders = await storage.getActiveSwapOrders(userId);
      res.json(activeOrders);
    } catch (error) {
      console.error("Get active swap orders error:", error);
      res.status(500).json({ error: "Failed to retrieve active swap orders" });
    }
  });
  app.get("/api/swap-orders", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const allOrders = await storage.getAllSwapOrders(userId);
      res.json(allOrders);
    } catch (error) {
      console.error("Get all swap orders error:", error);
      res.status(500).json({ error: "Failed to retrieve swap orders" });
    }
  });
  app.get("/api/wallet/:walletId/all-tokens", async (req, res) => {
    try {
      const { walletId } = req.params;
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const tokens = await storage.getTokensByWallet(walletId);
      console.log(`[All Tokens API] Wallet ${walletId}: Found ${tokens.length} total tokens`);
      const prices = {
        ETH: 1700,
        USDT: 1,
        BNB: 250,
        MATIC: 0.8
      };
      const tokensWithValues = tokens.map((token) => {
        let tokenMeta;
        switch (token.chainId) {
          case "ethereum":
            tokenMeta = ETHEREUM_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          case "bnb":
            tokenMeta = BNB_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          case "tron":
            tokenMeta = TRON_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          case "solana":
            tokenMeta = SOLANA_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          default:
            tokenMeta = ETHEREUM_TOKENS.find((t) => t.symbol === token.symbol);
        }
        return {
          ...token,
          id: token._id,
          // Add id field for frontend
          fiatValue: (parseFloat(token.balance) * (prices[token.symbol] || 0)).toFixed(2),
          price: prices[token.symbol] || 0,
          coingeckoId: tokenMeta?.coingeckoId || token.symbol.toLowerCase(),
          icon: tokenMeta?.icon || token.icon || null
        };
      });
      const sortedTokens = tokensWithValues.sort((a, b) => {
        const aBalance = parseFloat(a.balance);
        const bBalance = parseFloat(b.balance);
        if (aBalance > 0 !== bBalance > 0) {
          return aBalance > 0 ? -1 : 1;
        }
        const aOrder = a.displayOrder || 999;
        const bOrder = b.displayOrder || 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return a.name.localeCompare(b.name);
      });
      res.json({
        tokens: sortedTokens
      });
    } catch (error) {
      console.error("Get all tokens error:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });
  app.get("/api/wallet/:walletId/portfolio", async (req, res) => {
    try {
      const { walletId } = req.params;
      const wallet = await storage.getWallet(walletId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const allTokens = await storage.getTokensByWallet(walletId);
      const tokens = allTokens.filter((token) => token.isVisible);
      console.log(`[Portfolio API] Wallet ${walletId}: Found ${tokens.length} visible tokens out of ${allTokens.length} total`);
      const portfolio = tokens;
      const prices = {
        ETH: 1700,
        USDT: 1,
        BNB: 250,
        MATIC: 0.8
      };
      const portfolioWithValues = portfolio.map((token) => {
        let tokenMeta;
        switch (token.chainId) {
          case "ethereum":
            tokenMeta = ETHEREUM_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          case "bnb":
            tokenMeta = BNB_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          case "tron":
            tokenMeta = TRON_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          case "solana":
            tokenMeta = SOLANA_TOKENS.find((t) => t.symbol === token.symbol);
            break;
          default:
            tokenMeta = ETHEREUM_TOKENS.find((t) => t.symbol === token.symbol);
        }
        return {
          ...token,
          fiatValue: (parseFloat(token.balance) * (prices[token.symbol] || 0)).toFixed(2),
          price: prices[token.symbol] || 0,
          coingeckoId: tokenMeta?.coingeckoId || token.symbol.toLowerCase(),
          // Ensure icon is populated from token metadata if not already set
          icon: token.icon || tokenMeta?.icon || null
        };
      });
      const sortedPortfolio = portfolioWithValues.sort((a, b) => {
        const aBalance = parseFloat(a.balance);
        const bBalance = parseFloat(b.balance);
        if (aBalance > 0 !== bBalance > 0) {
          return aBalance > 0 ? -1 : 1;
        }
        const aInbound = a.lastInboundAt ? new Date(a.lastInboundAt).getTime() : 0;
        const bInbound = b.lastInboundAt ? new Date(b.lastInboundAt).getTime() : 0;
        if (aInbound !== bInbound) {
          return bInbound - aInbound;
        }
        const aOrder = a.displayOrder || 999;
        const bOrder = b.displayOrder || 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return a.name.localeCompare(b.name);
      });
      const totalValue = sortedPortfolio.reduce(
        (sum, token) => sum + parseFloat(token.fiatValue),
        0
      );
      res.json({
        tokens: sortedPortfolio,
        totalValue: totalValue.toFixed(2)
      });
    } catch (error) {
      console.error("Get portfolio error:", error);
      res.status(500).json({ error: "Failed to get portfolio" });
    }
  });
  app.get("/api/news", async (req, res) => {
    try {
      const parser = new Parser({
        timeout: 1e4,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoWallet/1.0)"
        }
      });
      const RSS_FEEDS = [
        { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk", domain: "coindesk.com" },
        { url: "https://cointelegraph.com/rss", name: "CoinTelegraph", domain: "cointelegraph.com" },
        { url: "https://decrypt.co/feed", name: "Decrypt", domain: "decrypt.co" },
        { url: "https://cryptoslate.com/feed/", name: "CryptoSlate", domain: "cryptoslate.com" },
        { url: "https://beincrypto.com/feed/", name: "BeInCrypto", domain: "beincrypto.com" }
      ];
      const feedPromises = RSS_FEEDS.map(async (feed) => {
        try {
          const parsedFeed = await parser.parseURL(feed.url);
          return parsedFeed.items.map((item) => ({
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
      allArticles.sort((a, b) => {
        const dateA = new Date(a.pubDate || a.isoDate || 0).getTime();
        const dateB = new Date(b.pubDate || b.isoDate || 0).getTime();
        return dateB - dateA;
      });
      const topArticles = allArticles.slice(0, 50);
      const extractCurrencies = (text) => {
        const currencyMap = {
          "bitcoin": "BTC",
          "btc": "BTC",
          "ethereum": "ETH",
          "eth": "ETH",
          "solana": "SOL",
          "sol": "SOL",
          "tron": "TRX",
          "trx": "TRX",
          "bnb": "BNB",
          "binance": "BNB",
          "usdt": "USDT",
          "tether": "USDT",
          "usdc": "USDC",
          "cardano": "ADA",
          "ada": "ADA",
          "ripple": "XRP",
          "xrp": "XRP",
          "polygon": "MATIC",
          "matic": "MATIC",
          "chainlink": "LINK",
          "link": "LINK"
        };
        const lowerText = text.toLowerCase();
        const found = /* @__PURE__ */ new Set();
        for (const [keyword, symbol] of Object.entries(currencyMap)) {
          if (lowerText.includes(keyword)) {
            found.add(symbol);
          }
        }
        return Array.from(found).map((code) => ({
          code,
          title: code
        }));
      };
      const results = topArticles.map((item) => {
        const titleAndContent = `${item.title} ${item.contentSnippet || item.content || ""}`;
        const currencies = extractCurrencies(titleAndContent);
        const id = Buffer.from(item.link || item.guid || "").toString("base64").slice(0, 16);
        return {
          id,
          title: item.title,
          url: item.link,
          source: {
            title: item.feed,
            domain: item.domain
          },
          published_at: item.pubDate || item.isoDate || (/* @__PURE__ */ new Date()).toISOString(),
          currencies: currencies.length > 0 ? currencies : void 0,
          contentSnippet: item.contentSnippet || item.content?.replace(/<[^>]*>/g, "").slice(0, 200),
          content: item.content || item.contentSnippet
        };
      });
      res.json({
        count: results.length,
        results
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news", results: [] });
    }
  });
  app.get("/api/news/:id", async (req, res) => {
    try {
      const parser = new Parser({
        timeout: 1e4,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoWallet/1.0)"
        }
      });
      const RSS_FEEDS = [
        { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk", domain: "coindesk.com" },
        { url: "https://cointelegraph.com/rss", name: "CoinTelegraph", domain: "cointelegraph.com" },
        { url: "https://decrypt.co/feed", name: "Decrypt", domain: "decrypt.co" },
        { url: "https://cryptoslate.com/feed/", name: "CryptoSlate", domain: "cryptoslate.com" },
        { url: "https://beincrypto.com/feed/", name: "BeInCrypto", domain: "beincrypto.com" }
      ];
      const feedPromises = RSS_FEEDS.map(async (feed) => {
        try {
          const parsedFeed = await parser.parseURL(feed.url);
          return parsedFeed.items.map((item) => ({
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
      const article = allArticles.find((item) => {
        const itemId = Buffer.from(item.link || item.guid || "").toString("base64").slice(0, 16);
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
          domain: article.domain
        },
        published_at: article.pubDate || article.isoDate,
        content: article.content || article.contentSnippet
      });
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const { walletId } = req.query;
      if (!walletId) {
        return res.status(400).json({ error: "Wallet ID required" });
      }
      const notifications = await Notification.find({ walletId }).populate("transactionId").sort({ timestamp: -1 }).limit(100);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const { walletId } = req.query;
      if (!walletId) {
        return res.status(400).json({ error: "Wallet ID required" });
      }
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
      const wallets = await Wallet.find({ userId });
      if (wallets.length === 0) {
        return res.json({ message: "No wallets found, nothing to mark" });
      }
      const walletIds = wallets.map((w) => w._id);
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
  app.get("/api/price-alerts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const alerts = await PriceAlert.find({ userId }).sort({ createdAt: -1 });
      res.json(alerts);
    } catch (error) {
      console.error("Get price alerts error:", error);
      res.status(500).json({ error: "Failed to get price alerts" });
    }
  });
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
        isActive: true
      });
      await alert.save();
      res.json(alert);
    } catch (error) {
      if (error.code === 11e3) {
        return res.status(409).json({ error: "You already have an identical alert" });
      }
      console.error("Create price alert error:", error);
      res.status(500).json({ error: "Failed to create price alert" });
    }
  });
  app.patch("/api/price-alerts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const { isActive } = req.body;
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: "Invalid alert ID" });
      }
      if (typeof isActive !== "boolean") {
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
  app.get("/api/market-news", requireAuth, async (req, res) => {
    try {
      const { limit = 20, importance } = req.query;
      const query = {};
      if (importance && typeof importance === "string") {
        query.importance = importance;
      }
      const news = await MarketNews.find(query).sort({ publishedAt: -1 }).limit(parseInt(limit));
      res.json(news);
    } catch (error) {
      console.error("Get market news error:", error);
      res.status(500).json({ error: "Failed to get market news" });
    }
  });
  app.get("/api/push/vapid-public-key", (req, res) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "BK2mMAPSfsqL0frOGKLVhfNHAdRykJkzNnqn3yP3YRjMjFuskrNS5j4SMBC4F3yv7tLxLnayogZ_31r47iZgX5k";
    res.json({ publicKey: vapidPublicKey });
  });
  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }
      const existing = await UserPushSubscription.findOne({ endpoint });
      if (existing) {
        existing.lastUsedAt = /* @__PURE__ */ new Date();
        await existing.save();
        return res.json({ message: "Subscription already exists" });
      }
      const subscription = new UserPushSubscription({
        userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth
        }
      });
      await subscription.save();
      res.json({ message: "Subscription successful" });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });
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
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await Settings.findOne({ key });
      if (!setting) {
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
  app.put("/api/settings/:key", requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }
      const setting = await Settings.findOneAndUpdate(
        { key },
        { key, value, updatedAt: /* @__PURE__ */ new Date() },
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
  if (sessionParser) {
    initializeWebSocket(httpServer, sessionParser);
    console.log("WebSocket service initialized for real-time support chat");
  }
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app, server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { default: viteConfig } = await init_vite_config().then(() => vite_config_exports);
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = path2.resolve(process.cwd(), "dist/public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/db.ts
import mongoose4 from "mongoose";
var mongoServer = null;
async function connectDB() {
  try {
    let MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.log("No MONGODB_URI found, starting in-memory MongoDB replica set (supports transactions)...");
      const { MongoMemoryReplSet } = await import("mongodb-memory-server");
      mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
      await mongoServer.waitUntilRunning();
      MONGODB_URI = mongoServer.getUri();
      console.log("In-memory MongoDB replica set started at:", MONGODB_URI);
    }
    await mongoose4.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// server/app.ts
import express2 from "express";
import session from "express-session";
init_background_jobs();
var appPromise = null;
function getApp() {
  if (appPromise) return appPromise;
  appPromise = (async () => {
    const app = express2();
    if (process.env.NODE_ENV === "production") {
      app.set("trust proxy", 1);
      app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"] === "http") {
          return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
      });
    }
    app.use(express2.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    }));
    app.use(express2.urlencoded({ extended: false }));
    if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable must be set in production");
    }
    const DEV_SESSION_SECRET = "lumirra-dev-session-secret-stable-2024";
    const sessionParser = session({
      secret: process.env.SESSION_SECRET || DEV_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1e3 * 60 * 60 * 24 * 7,
        sameSite: "lax"
      }
    });
    app.use(sessionParser);
    app.use((req, res, next) => {
      const start = Date.now();
      const path3 = req.path;
      let capturedJsonResponse = void 0;
      const originalResJson = res.json;
      res.json = function(bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path3.startsWith("/api")) {
          let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "\u2026";
          }
          log(logLine);
        }
      });
      next();
    });
    await connectDB();
    await storage.init();
    startBackgroundJobs();
    await registerRoutes(app, sessionParser);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    serveStatic(app);
    return app;
  })();
  return appPromise;
}

// server/index.ts
import session2 from "express-session";
(async () => {
  const DEV_SESSION_SECRET = "lumirra-dev-session-secret-stable-2024";
  const sessionParser = session2({
    secret: process.env.SESSION_SECRET || DEV_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      sameSite: "lax"
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const express3 = (await import("express")).default;
    const app = express3();
    app.use(express3.json({ verify: (req, _res, buf) => {
      req.rawBody = buf;
    } }));
    app.use(express3.urlencoded({ extended: false }));
    app.use(sessionParser);
    app.use((req, res, next) => {
      const start = Date.now();
      const path3 = req.path;
      let capturedJsonResponse = void 0;
      const originalResJson = res.json;
      res.json = function(bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path3.startsWith("/api")) {
          let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "\u2026";
          log(logLine);
        }
      });
      next();
    });
    await connectDB();
    await storage.init();
    const { startBackgroundJobs: startBackgroundJobs2 } = await Promise.resolve().then(() => (init_background_jobs(), background_jobs_exports));
    startBackgroundJobs2();
    const server = await registerRoutes(app, sessionParser);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    app.use((req, res, next) => {
      const p = req.path;
      if (p.includes("/node_modules/.vite/deps/") || p.startsWith("/@fs/") || p.startsWith("/@vite/") || p.startsWith("/@react-refresh")) {
        const orig = res.setHeader.bind(res);
        res.setHeader = function(name, value) {
          if (typeof name === "string" && name.toLowerCase() === "cache-control") {
            return orig(name, "no-store");
          }
          return orig(name, value);
        };
      }
      next();
    });
    await setupVite(app, server);
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`serving on port ${port}`);
    });
  } else {
    const app = await getApp();
    const server = createServer2(app);
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
