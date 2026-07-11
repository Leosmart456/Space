// Comprehensive list of popular ERC-20 tokens on Ethereum mainnet
export interface TokenMetadata {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  icon?: string;
  coingeckoId?: string; // For price API integration
}

export const ETHEREUM_TOKENS: TokenMetadata[] = [
  // Native ETH
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "", // Native token, no contract
    decimals: 18,
    coingeckoId: "ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  // Stablecoins
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    coingeckoId: "tether",
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    coingeckoId: "usd-coin",
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    coingeckoId: "dai",
    icon: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png",
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    contractAddress: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
    decimals: 18,
    coingeckoId: "binance-usd",
    icon: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png",
  },
  // DeFi Tokens
  {
    symbol: "UNI",
    name: "Uniswap",
    contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
    coingeckoId: "uniswap",
    icon: "https://assets.coingecko.com/coins/images/12504/large/uni.jpg",
  },
  {
    symbol: "LINK",
    name: "ChainLink Token",
    contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    coingeckoId: "chainlink",
    icon: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
  },
  {
    symbol: "AAVE",
    name: "Aave Token",
    contractAddress: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18,
    coingeckoId: "aave",
    icon: "https://assets.trustwalletapp.com/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png",
  },
  {
    symbol: "MKR",
    name: "Maker",
    contractAddress: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    decimals: 18,
    coingeckoId: "maker",
    icon: "https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png",
  },
  {
    symbol: "COMP",
    name: "Compound",
    contractAddress: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    decimals: 18,
    coingeckoId: "compound-governance-token",
    icon: "https://assets.coingecko.com/coins/images/10775/large/COMP.png",
  },
  {
    symbol: "CRV",
    name: "Curve DAO Token",
    contractAddress: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    decimals: 18,
    coingeckoId: "curve-dao-token",
    icon: "https://assets.coingecko.com/coins/images/12124/large/Curve.png",
  },
  {
    symbol: "SUSHI",
    name: "SushiToken",
    contractAddress: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    decimals: 18,
    coingeckoId: "sushi",
    icon: "https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png",
  },
  {
    symbol: "SNX",
    name: "Synthetix Network Token",
    contractAddress: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
    decimals: 18,
    coingeckoId: "synthetix-network-token",
    icon: "https://assets.coingecko.com/coins/images/3406/large/SNX.png",
  },
  {
    symbol: "YFI",
    name: "yearn.finance",
    contractAddress: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
    decimals: 18,
    coingeckoId: "yearn-finance",
    icon: "https://assets.coingecko.com/coins/images/11849/large/yearn.jpg",
  },
  // Wrapped Tokens
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    coingeckoId: "wrapped-bitcoin",
    icon: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    coingeckoId: "weth",
    icon: "https://assets.coingecko.com/coins/images/2518/large/weth.png",
  },
  // Exchange Tokens
  {
    symbol: "LEO",
    name: "Bitfinex LEO Token",
    contractAddress: "0x2AF5D2aD76741191D15Dfe7bF6aC92d4Bd912Ca3",
    decimals: 18,
    coingeckoId: "leo-token",
    icon: "https://assets.coingecko.com/coins/images/8418/large/leo-token.png",
  },
  {
    symbol: "HT",
    name: "HuobiToken",
    contractAddress: "0x6f259637dcD74C767781E37Bc6133cd6A68aa161",
    decimals: 18,
    coingeckoId: "huobi-token",
    icon: "https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png",
  },
  {
    symbol: "OKB",
    name: "OKB",
    contractAddress: "0x75231F58b43240C9718Dd58B4967c5114342a86c",
    decimals: 18,
    coingeckoId: "okb",
    icon: "https://assets.trustwalletapp.com/blockchains/ethereum/assets/0x75231F58b43240C9718Dd58B4967c5114342a86c/logo.png",
  },
  // Layer 2 & Scaling
  {
    symbol: "MATIC",
    name: "Matic Token",
    contractAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    decimals: 18,
    coingeckoId: "matic-network",
    icon: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  },
  {
    symbol: "LDO",
    name: "Lido DAO Token",
    contractAddress: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
    decimals: 18,
    coingeckoId: "lido-dao",
    icon: "https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png",
  },
  // Meme & Community Tokens
  {
    symbol: "SHIB",
    name: "SHIBA INU",
    contractAddress: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    decimals: 18,
    coingeckoId: "shiba-inu",
    icon: "https://assets.coingecko.com/coins/images/11939/large/shiba.png",
  },
  {
    symbol: "PEPE",
    name: "Pepe",
    contractAddress: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    decimals: 18,
    coingeckoId: "pepe",
    icon: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg",
  },
  {
    symbol: "FLOKI",
    name: "FLOKI",
    contractAddress: "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E",
    decimals: 9,
    coingeckoId: "floki",
    icon: "https://assets.coingecko.com/coins/images/16746/large/FLOKI.png",
  },
  // Gaming & NFT
  {
    symbol: "SAND",
    name: "The Sandbox",
    contractAddress: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0",
    decimals: 18,
    coingeckoId: "the-sandbox",
    icon: "https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg",
  },
  {
    symbol: "MANA",
    name: "Decentraland",
    contractAddress: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
    decimals: 18,
    coingeckoId: "decentraland",
    icon: "https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png",
  },
  {
    symbol: "AXS",
    name: "Axie Infinity Shard",
    contractAddress: "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b",
    decimals: 18,
    coingeckoId: "axie-infinity",
    icon: "https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png",
  },
  {
    symbol: "APE",
    name: "ApeCoin",
    contractAddress: "0x4d224452801ACEd8B2F0aebE155379bb5D594381",
    decimals: 18,
    coingeckoId: "apecoin",
    icon: "https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg",
  },
  // Other Popular Tokens
  {
    symbol: "GRT",
    name: "The Graph",
    contractAddress: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
    decimals: 18,
    coingeckoId: "the-graph",
    icon: "https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png",
  },
  {
    symbol: "FTM",
    name: "Fantom Token",
    contractAddress: "0x4E15361FD6b4BB609Fa63C81A2be19d873717870",
    decimals: 18,
    coingeckoId: "fantom",
    icon: "https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png",
  },
  {
    symbol: "1INCH",
    name: "1INCH Token",
    contractAddress: "0x111111111117dC0aa78b770fA6A738034120C302",
    decimals: 18,
    coingeckoId: "1inch",
    icon: "https://assets.coingecko.com/coins/images/13469/large/1inch-token.png",
  },
  {
    symbol: "ENS",
    name: "Ethereum Name Service",
    contractAddress: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    decimals: 18,
    coingeckoId: "ethereum-name-service",
    icon: "https://assets.coingecko.com/coins/images/19785/large/acatxTm8_400x400.jpg",
  },
  {
    symbol: "BAT",
    name: "Basic Attention Token",
    contractAddress: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
    decimals: 18,
    coingeckoId: "basic-attention-token",
    icon: "https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png",
  },
  {
    symbol: "ZRX",
    name: "0x Protocol Token",
    contractAddress: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
    decimals: 18,
    coingeckoId: "0x",
    icon: "https://assets.coingecko.com/coins/images/863/large/0x.png",
  },
];

// Helper function to get token by symbol
export function getTokenBySymbol(symbol: string): TokenMetadata | undefined {
  return ETHEREUM_TOKENS.find(
    (token) => token.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

// Helper function to get token by contract address
export function getTokenByAddress(address: string): TokenMetadata | undefined {
  if (!address) {
    return ETHEREUM_TOKENS.find((token) => token.symbol === "ETH");
  }
  return ETHEREUM_TOKENS.find(
    (token) => token.contractAddress.toLowerCase() === address.toLowerCase()
  );
}

// Helper function to search tokens
export function searchTokens(query: string): TokenMetadata[] {
  const lowercaseQuery = query.toLowerCase();
  return ETHEREUM_TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(lowercaseQuery) ||
      token.name.toLowerCase().includes(lowercaseQuery) ||
      token.contractAddress.toLowerCase().includes(lowercaseQuery)
  );
}
