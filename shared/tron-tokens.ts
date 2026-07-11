// Comprehensive list of popular TRC-20 tokens on TRON
export interface TokenMetadata {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  icon?: string;
  coingeckoId?: string;
}

export const TRON_TOKENS: TokenMetadata[] = [
  // Native TRX
  {
    symbol: "TRX",
    name: "TRON",
    contractAddress: "",
    decimals: 6,
    coingeckoId: "tron",
    icon: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
  },
  // Stablecoins
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
    decimals: 6,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  },
  {
    symbol: "USDJ",
    name: "JUST Stablecoin",
    contractAddress: "TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT",
    decimals: 18,
    coingeckoId: "just-stablecoin",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT/logo.png",
  },
  // DeFi Tokens
  {
    symbol: "JST",
    name: "JUST",
    contractAddress: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9",
    decimals: 18,
    coingeckoId: "just",
    icon: "https://assets.coingecko.com/coins/images/11095/large/JUST.jpg",
  },
  {
    symbol: "SUN",
    name: "SUN Token",
    contractAddress: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S",
    decimals: 18,
    coingeckoId: "sun-token",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S/logo.png",
  },
  {
    symbol: "WIN",
    name: "WINkLink",
    contractAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
    decimals: 6,
    coingeckoId: "wink",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7/logo.png",
  },
  {
    symbol: "NFT",
    name: "APENFT",
    contractAddress: "TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq",
    decimals: 6,
    coingeckoId: "apenft",
    icon: "https://assets.trustwalletapp.com/blockchains/tron/assets/TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq/logo.png",
  },
  // Wrapped Tokens
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    contractAddress: "TXpw8XeWYYTHd7NW1dZAWxhjPpZ3qZJq4w",
    decimals: 8,
    coingeckoId: "wrapped-bitcoin",
    icon: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF",
    decimals: 18,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
];

// Helper function to get token by symbol
export function getTronTokenBySymbol(symbol: string): TokenMetadata | undefined {
  return TRON_TOKENS.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
  );
}
