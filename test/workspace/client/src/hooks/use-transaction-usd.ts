import { useQuery } from "@tanstack/react-query";
import { ETHEREUM_TOKENS } from "@shared/ethereum-tokens";
import { BNB_TOKENS } from "@shared/bnb-tokens";
import { TRON_TOKENS } from "@shared/tron-tokens";
import { SOLANA_TOKENS } from "@shared/solana-tokens";

/**
 * Hook to calculate USD value for a transaction
 * Uses saved fiatValue if available, otherwise calculates from real-time prices
 */
export function useTransactionUSD(transaction: any) {
  const { data: prices } = useQuery<Record<string, { usd: number }>>({
    queryKey: ["/api/prices"],
    staleTime: 60000, // Cache for 1 minute
  });

  // If transaction already has a valid fiatValue, use it
  const savedFiatValue = parseFloat(transaction?.fiatValue || "0");
  if (savedFiatValue > 0) {
    return savedFiatValue;
  }

  // Otherwise, calculate from real-time prices
  if (!transaction || !prices) {
    return 0;
  }

  const { value, tokenSymbol } = transaction;
  const amount = parseFloat(value || "0");

  if (amount === 0) {
    return 0;
  }

  // Find the token's CoinGecko ID
  const allTokens = [
    ...ETHEREUM_TOKENS,
    ...BNB_TOKENS,
    ...TRON_TOKENS,
    ...SOLANA_TOKENS,
  ];

  const tokenMetadata = allTokens.find(
    (t) => t.symbol.toLowerCase() === tokenSymbol?.toLowerCase()
  );

  const coingeckoId = tokenMetadata?.coingeckoId || tokenSymbol?.toLowerCase();
  const tokenPrice = prices[coingeckoId]?.usd || 0;

  return amount * tokenPrice;
}
