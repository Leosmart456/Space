// Comprehensive list of popular SPL tokens on Solana
export interface TokenMetadata {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  icon?: string;
  coingeckoId?: string;
}

export const SOLANA_TOKENS: TokenMetadata[] = [
  // Native SOL
  {
    symbol: "SOL",
    name: "Solana",
    contractAddress: "",
    decimals: 9,
    coingeckoId: "solana",
    icon: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  },
  // Stablecoins
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  },
  // DeFi Tokens
  {
    symbol: "JUP",
    name: "Jupiter",
    contractAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
    coingeckoId: "jupiter-exchange-solana",
    icon: "https://assets.coingecko.com/coins/images/10351/large/logo512.png",
  },
  {
    symbol: "RAY",
    name: "Raydium",
    contractAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
    coingeckoId: "raydium",
    icon: "https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg",
  },
  {
    symbol: "ORCA",
    name: "Orca",
    contractAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    decimals: 6,
    coingeckoId: "orca",
    icon: "https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png",
  },
  // Memecoins
  {
    symbol: "BONK",
    name: "Bonk",
    contractAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
    coingeckoId: "bonk",
    icon: "https://assets.coingecko.com/coins/images/28600/large/bonk.jpg",
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    contractAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    decimals: 6,
    coingeckoId: "dogwifcoin",
    icon: "https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg",
  },
  // Wrapped Tokens
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin (Sollet)",
    contractAddress: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    decimals: 6,
    coingeckoId: "wrapped-bitcoin",
    icon: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    decimals: 8,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
];

// Helper function to get token by symbol
export function getSolanaTokenBySymbol(symbol: string): TokenMetadata | undefined {
  return SOLANA_TOKENS.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
  );
}
