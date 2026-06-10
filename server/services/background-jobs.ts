import webpush from "web-push";
import { MarketNews, PriceAlert, Notification, Wallet, UserPushSubscription, User } from "../models";
import { getSimplePrices } from "./coingecko";

// VAPID keys for web push (generated once, stored as env vars for persistence)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BK2mMAPSfsqL0frOGKLVhfNHAdRykJkzNnqn3yP3YRjMjFuskrNS5j4SMBC4F3yv7tLxLnayogZ_31r47iZgX5k";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "_pFq03xx2mRmGHSQ0OdQPPksQfgE8vu5-nKTG6loHYo";
const VAPID_EMAIL = "mailto:Support@lumirrawallet.com";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export { VAPID_PUBLIC_KEY };

// CryptoPanic API configuration (free tier)
const CRYPTOPANIC_API_URL = "https://cryptopanic.com/api/v1/posts/";
const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY || "demo";

// Popular coins to track for top-rates notifications
const TOP_RATE_COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "binancecoin", symbol: "BNB", name: "Binance Coin" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "ripple", symbol: "XRP", name: "Ripple" },
];

// Store previous prices to compute movement between checks
const previousTopRatePrices: Record<string, number> = {};

// Store last-notified timestamp per coin to enforce 2-hour cooldown
const lastNotifiedAt: Record<string, number> = {};

// Minimum absolute % movement to trigger a notification
const MOVEMENT_THRESHOLD_PCT = 1.5;

// Cooldown between notifications for the same coin (2 hours)
const COIN_COOLDOWN_MS = 2 * 60 * 60 * 1000;

// Symbol to CoinGecko ID mapping for price alerts
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
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
  apt: "aptos",
};

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

function determineImportance(votes: any): "low" | "medium" | "high" | "critical" {
  const positiveVotes = votes?.positive || 0;
  const negativeVotes = votes?.negative || 0;
  const totalVotes = positiveVotes + negativeVotes;
  if (totalVotes > 100) return "critical";
  if (totalVotes > 50) return "high";
  if (totalVotes > 10) return "medium";
  return "low";
}

// Send browser push notification to a specific user
export async function sendPushNotification(userId: string, payload: { title: string; body: string; icon?: string; badge?: string; data?: any }): Promise<void> {
  try {
    const subscriptions = await UserPushSubscription.find({ userId });
    if (subscriptions.length === 0) return;

    // Always use the wallet favicon so the notification icon matches the app icon
    const enrichedPayload = {
      ...payload,
      icon: payload.icon || "/favicon.png",
      badge: payload.badge || "/favicon.png",
    };
    const payloadStr = JSON.stringify(enrichedPayload);
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payloadStr
        );
      } catch (err: any) {
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

// Send push notification to ALL subscribed users
async function sendPushToAllUsers(payload: { title: string; body: string; icon?: string; badge?: string; data?: any }): Promise<void> {
  try {
    const subscriptions = await UserPushSubscription.find({});
    if (subscriptions.length === 0) return;

    const enrichedPayload = {
      ...payload,
      icon: payload.icon || "/favicon.png",
      badge: payload.badge || "/favicon.png",
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
              auth: sub.keys.auth,
            },
          },
          payloadStr
        );
        sent++;
      } catch (err: any) {
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

// Fetch crypto news from CryptoPanic API
export async function fetchCryptoNews(): Promise<void> {
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
          importance: determineImportance(post.votes),
        });

        await news.save();
        newCount++;

        if (news.importance === "high" || news.importance === "critical") {
          await createNewsNotifications(news);
          // Send browser push for breaking news
          await sendPushToAllUsers({
            title: `${news.importance === "critical" ? "BREAKING" : "Important"} Crypto News`,
            body: news.title.length > 100 ? news.title.substring(0, 100) + "..." : news.title,
            icon: "/favicon.png",
            data: { url: news.url || "/notifications" },
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

// Create in-app notifications for all users about important news
async function createNewsNotifications(news: any): Promise<void> {
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
        importance: news.importance,
      },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`[Background Job] Created ${notifications.length} news notifications`);
    }
  } catch (error) {
    console.error("[Background Job] Error creating news notifications:", error);
  }
}

// Fetch top crypto rates and notify all users
export async function checkMarketMovements(): Promise<void> {
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

      // Update stored price for the next check
      previousTopRatePrices[coin.id] = currentPrice;

      // Skip if no previous price recorded yet (first run — just seed the map)
      if (!prevPrice) continue;

      // Skip if within cooldown window for this coin
      const lastNotified = lastNotifiedAt[coin.id] ?? 0;
      if (now - lastNotified < COIN_COOLDOWN_MS) continue;

      // Calculate % movement since last check
      const changePct = ((currentPrice - prevPrice) / prevPrice) * 100;
      const absChange = Math.abs(changePct);

      // Only notify when movement exceeds threshold
      if (absChange < MOVEMENT_THRESHOLD_PCT) continue;

      const direction = changePct > 0 ? "up" : "down";
      const formattedPct = absChange.toFixed(2);
      const formattedPrice =
        currentPrice < 1
          ? `$${currentPrice.toFixed(6)}`
          : `$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // Title: "BTC is up 3.24%" or "ETH dropped 2.10%"
      const title =
        direction === "up"
          ? `${coin.symbol} is up ${formattedPct}%`
          : `${coin.symbol} dropped ${formattedPct}%`;

      // Description: full name + price + context
      const description =
        direction === "up"
          ? `${coin.name} reached ${formattedPrice} — up ${formattedPct}% in the last 30 min`
          : `${coin.name} fell to ${formattedPrice} — down ${formattedPct}% in the last 30 min`;

      // Create one in-app notification per wallet for this coin
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
          currentPrice,
        },
      }));

      if (coinNotifications.length > 0) {
        await Notification.insertMany(coinNotifications);
        lastNotifiedAt[coin.id] = now;
        notifiedCount++;
        console.log(`[Background Job] Market movement notification: ${title}`);

        // Send push notification to ALL subscribed users for market movement
        await sendPushToAllUsers({
          title,
          body: description,
          data: { url: "/notifications", type: "system", tag: `market-${coin.symbol.toLowerCase()}` },
        });
      }
    }

    console.log(`[Background Job] Market movement check complete — ${notifiedCount} coin(s) notified`);
  } catch (error) {
    console.error("[Background Job] Error checking market movements:", error);
  }
}

// Check price alerts and trigger notifications
export async function checkPriceAlerts(): Promise<void> {
  try {
    console.log("[Background Job] Checking price alerts...");

    const alerts = await PriceAlert.find({
      isActive: true,
      $or: [
        { triggeredAt: null },
        { triggeredAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    });

    if (alerts.length === 0) {
      console.log("[Background Job] No active alerts to check");
      return;
    }

    const uniqueSymbols = new Set(alerts.map((a) => a.tokenSymbol.toLowerCase()));
    const tokenSymbols = Array.from(uniqueSymbols);
    const coinIds = tokenSymbols
      .map((symbol) => SYMBOL_TO_COINGECKO_ID[symbol])
      .filter((id) => id !== undefined);

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

      const isTriggered =
        (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
        (alert.condition === "below" && currentPrice <= alert.targetPrice);

      if (isTriggered) {
        alert.triggeredAt = new Date();
        alert.lastNotifiedAt = new Date();
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

async function createPriceAlertNotification(alert: any, currentPrice: number): Promise<void> {
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
        condition: alert.condition,
      },
    });

    await notification.save();

    await sendPushNotification(alert.userId, {
      title: `Price Alert: ${alert.tokenSymbol}`,
      body: `${alert.tokenName} is ${alert.condition} $${alert.targetPrice.toLocaleString()}! Current: $${currentPrice.toLocaleString()}`,
      icon: "/favicon.png",
      data: { url: "/notifications" },
    });
  } catch (error) {
    console.error("[Background Job] Error creating price alert notification:", error);
  }
}

function safeExecute(fn: () => Promise<void>, jobName: string) {
  return async () => {
    try {
      await fn();
    } catch (error) {
      console.error(`[Background Job] Error in ${jobName}:`, error);
    }
  };
}

export function startBackgroundJobs(): void {
  console.log("[Background Job] Starting background jobs...");

  // Fetch crypto news every 15 minutes
  setInterval(safeExecute(fetchCryptoNews, "fetchCryptoNews"), 15 * 60 * 1000);
  setTimeout(safeExecute(fetchCryptoNews, "fetchCryptoNews"), 5000);

  // Check price alerts every 5 minutes
  setInterval(safeExecute(checkPriceAlerts, "checkPriceAlerts"), 5 * 60 * 1000);
  setTimeout(safeExecute(checkPriceAlerts, "checkPriceAlerts"), 10000);

  // Check market movements every 30 minutes (first run seeds prices, second run detects changes)
  setInterval(safeExecute(checkMarketMovements, "checkMarketMovements"), 30 * 60 * 1000);
  // Seed prices on startup (no notifications emitted on first run)
  setTimeout(safeExecute(checkMarketMovements, "checkMarketMovements"), 15000);

  console.log("[Background Job] Background jobs started successfully");
}
