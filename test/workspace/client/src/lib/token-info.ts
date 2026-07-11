export interface TokenInfo {
  symbol: string;
  name: string;
  description: string;
  marketCap?: string;
  circulatingSupply?: string;
  totalSupply?: string;
  maxSupply?: string;
  links: {
    website?: string;
    explorer?: string;
    github?: string;
    twitter?: string;
  };
  contractSecurity?: string;
  honeypotRisk?: string;
}

export const TOKEN_INFO_DATABASE: Record<string, TokenInfo> = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    description: "Ethereum is a decentralized blockchain platform that enables smart contracts and decentralized applications (dApps). It transitioned from Proof-of-Work to Proof-of-Stake via 'The Merge,' reducing energy consumption by 99.95%.",
    marketCap: "$468B - $497B",
    circulatingSupply: "120.7M ETH",
    totalSupply: "120.7M ETH",
    maxSupply: "Unlimited (deflationary with EIP-1559)",
    links: {
      website: "https://ethereum.org",
      explorer: "https://etherscan.io",
      github: "https://github.com/ethereum",
      twitter: "https://twitter.com/ethereum"
    },
    contractSecurity: "No significant risks found",
    honeypotRisk: "No significant risks found"
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    description: "BNB powers the BNB Chain ecosystem, offering low fees and fast transactions. Originally launched as an ERC-20 token, it migrated to BNB Chain (formerly Binance Smart Chain) and uses a Proof-of-Staked Authority consensus mechanism.",
    marketCap: "$153B - $156B",
    circulatingSupply: "137.7M BNB",
    totalSupply: "137.7M BNB",
    maxSupply: "100M BNB (target via Auto-Burn)",
    links: {
      website: "https://www.bnbchain.org",
      explorer: "https://bscscan.com",
      github: "https://github.com/bnb-chain",
      twitter: "https://twitter.com/bnbchain"
    },
    contractSecurity: "No significant risks found",
    honeypotRisk: "No significant risks found"
  },
  TRX: {
    symbol: "TRX",
    name: "Tron",
    description: "TRON is a decentralized blockchain platform focused on empowering content creators by eliminating intermediaries. It supports smart contracts, processes 2,000 transactions per second, and serves as a major hub for USDT stablecoin transfers.",
    marketCap: "$28B - $30B",
    circulatingSupply: "95B TRX",
    totalSupply: "95B TRX",
    maxSupply: "Unlimited",
    links: {
      website: "https://tron.network",
      explorer: "https://tronscan.org",
      github: "https://github.com/tronprotocol",
      twitter: "https://twitter.com/trondao"
    },
    contractSecurity: "No significant risks found",
    honeypotRisk: "No significant risks found"
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    description: "Solana is a high-performance Layer 1 blockchain designed for speed, scalability, and low costs. It uses a unique Proof of History (PoH) and Proof of Stake (PoS) consensus mechanism, supporting thousands of transactions per second with fees under $0.01.",
    marketCap: "$103B - $108B",
    circulatingSupply: "549.7M SOL",
    totalSupply: "612.8M SOL",
    maxSupply: "Unlimited (inflationary model)",
    links: {
      website: "https://solana.com",
      explorer: "https://explorer.solana.com",
      github: "https://github.com/solana-labs",
      twitter: "https://twitter.com/solana"
    },
    contractSecurity: "No significant risks found",
    honeypotRisk: "No significant risks found"
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    description: "Tether (USDT) is the largest stablecoin by market cap, pegged 1:1 to the US Dollar. It provides stability for crypto trading and is widely used across multiple blockchains for payments, DeFi, and as a store of value.",
    marketCap: "$120B+",
    circulatingSupply: "120B+ USDT",
    totalSupply: "120B+ USDT",
    maxSupply: "Unlimited (minted on demand)",
    links: {
      website: "https://tether.to",
      explorer: "https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7",
      github: "https://github.com/tether",
      twitter: "https://twitter.com/tether_to"
    },
    contractSecurity: "No significant risks found",
    honeypotRisk: "No significant risks found"
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    description: "USD Coin is a fully regulated stablecoin pegged 1:1 to the US Dollar, backed by cash and short-term US Treasury bonds. It's issued by Circle and operates across multiple blockchains with monthly attestations by Grant Thornton LLP.",
    marketCap: "$35B+",
    circulatingSupply: "35B+ USDC",
    totalSupply: "35B+ USDC",
    maxSupply: "Unlimited (minted on demand)",
    links: {
      website: "https://www.circle.com/en/usdc",
      explorer: "https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      github: "https://github.com/circlefin",
      twitter: "https://twitter.com/circle"
    },
    contractSecurity: "No significant risks found",
    honeypotRisk: "No significant risks found"
  }
};

export function getTokenInfo(symbol: string): TokenInfo | undefined {
  return TOKEN_INFO_DATABASE[symbol.toUpperCase()];
}
