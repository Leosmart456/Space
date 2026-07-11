// Comprehensive list of popular BEP-20 tokens on BNB Smart Chain
export interface TokenMetadata {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  icon?: string;
  coingeckoId?: string;
}

export const BNB_TOKENS: TokenMetadata[] = [
  // Native BNB
  {
    symbol: "BNB",
    name: "BNB",
    contractAddress: "",
    decimals: 18,
    coingeckoId: "binancecoin",
    icon: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  },
  // Stablecoins
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    contractAddress: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals: 18,
    coingeckoId: "binance-usd",
    icon: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    contractAddress: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    decimals: 18,
    coingeckoId: "dai",
    icon: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png",
  },
  // DeFi Tokens
  {
    symbol: "CAKE",
    name: "PancakeSwap",
    contractAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    decimals: 18,
    coingeckoId: "pancakeswap-token",
    icon: "https://assets.trustwalletapp.com/blockchains/smartchain/assets/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/logo.png",
  },
  {
    symbol: "XVS",
    name: "Venus",
    contractAddress: "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63",
    decimals: 18,
    coingeckoId: "venus",
    icon: "https://assets.coingecko.com/coins/images/12677/large/download.jpg",
  },
  {
    symbol: "ALPHA",
    name: "Alpha Finance",
    contractAddress: "0xa1faa113cbE53436Df28FF0aEe54275c13B40975",
    decimals: 18,
    coingeckoId: "alpha-finance",
    icon: "https://assets.coingecko.com/coins/images/12738/large/AlphaToken_256x256.png",
  },
  // Wrapped Tokens
  {
    symbol: "ETH",
    name: "Binance-Peg Ethereum",
    contractAddress: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    decimals: 18,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    symbol: "BTCB",
    name: "Bitcoin BEP2",
    contractAddress: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    decimals: 18,
    coingeckoId: "bitcoin",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  },
  {
    symbol: "ADA",
    name: "Binance-Peg Cardano",
    contractAddress: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
    decimals: 18,
    coingeckoId: "cardano",
    icon: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
  },
  {
    symbol: "DOGE",
    name: "Binance-Peg Dogecoin",
    contractAddress: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
    decimals: 8,
    coingeckoId: "dogecoin",
    icon: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
  },
];

// Helper function to get token by symbol
export function getBNBTokenBySymbol(symbol: string): TokenMetadata | undefined {
  return BNB_TOKENS.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
  );
}
