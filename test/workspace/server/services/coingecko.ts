/**
 * CoinGecko API Service
 * Provides functions to fetch real-time cryptocurrency prices and market data
 */

// CoinGecko Demo API configuration
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY;

interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap?: number;
    jpy?: number;
    cad?: number;
    gbp?: number;
    aed?: number;
    aud?: number;
    krw?: number;
    chf?: number;
    czk?: number;
    dkk?: number;
    nok?: number;
    nzd?: number;
  };
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  atl: number;
}

interface CoinGeckoChartData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/**
 * Fetch simple prices for multiple coins
 * @param coinIds Array of CoinGecko IDs (e.g., ["ethereum", "bitcoin"])
 * @returns Price data for requested coins
 */
export async function getSimplePrices(coinIds: string[]): Promise<CoinGeckoPrice> {
  if (!API_KEY) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }

  const ids = coinIds.join(",");
  // Include multiple fiat currencies for proper conversion
  const currencies = "usd,jpy,cad,gbp,aed,aud,krw,chf,czk,dkk,nok,nzd";
  const url = `${COINGECKO_API_BASE}/simple/price?ids=${ids}&vs_currencies=${currencies}&include_24hr_change=true&include_market_cap=true`;

  try {
    console.log(`[CoinGecko] Fetching prices for ${coinIds.length} coins from: ${url}`);
    const response = await fetch(url, {
      headers: {
        "x-cg-demo-api-key": API_KEY,
      },
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

/**
 * Fetch detailed market data for multiple coins
 * @param coinIds Array of CoinGecko IDs
 * @returns Market data for requested coins
 */
export async function getMarketData(coinIds: string[]): Promise<CoinGeckoMarketData[]> {
  if (!API_KEY) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }

  const ids = coinIds.join(",");
  const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false`;

  try {
    const response = await fetch(url, {
      headers: {
        "x-cg-demo-api-key": API_KEY,
      },
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

/**
 * Fetch historical price chart data for a coin
 * @param coinId CoinGecko coin ID
 * @param days Number of days (1, 7, 14, 30, 90, 180, 365, max)
 * @returns Chart data with prices, market caps, and volumes
 */
export async function getChartData(
  coinId: string,
  days: string | number = 7
): Promise<CoinGeckoChartData> {
  if (!API_KEY) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }

  const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  try {
    const response = await fetch(url, {
      headers: {
        "x-cg-demo-api-key": API_KEY,
      },
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

/**
 * Convert time period string to days parameter for CoinGecko API
 * @param period Time period (1H, 1D, 1W, 1M, 1Y, All)
 * @returns Days parameter for API
 */
export function periodToDays(period: string): string | number {
  switch (period.toUpperCase()) {
    case "1H":
      return 1; // 1 day with hourly data
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

/**
 * Fetch price for a single coin
 * @param coinId CoinGecko coin ID
 * @returns Price data for the coin
 */
export async function getCoinPrice(coinId: string) {
  const prices = await getSimplePrices([coinId]);
  return prices[coinId];
}
