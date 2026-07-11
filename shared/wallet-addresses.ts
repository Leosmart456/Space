export const WALLET_ADDRESSES: Record<string, string> = {
  ethereum: "0xADBaa25dDce928FDa7E96c77f6c41C301a2501bb",
  bnb: "0xADBaa25dDce928FDa7E96c77f6c41C301a2501bb",
  tron: "TNjnBL1LpDWu8JPqgqGNmp4GbC9K2U59PL",
  solana: "G1mR4yYifqt1coJFpKNvy32sLnmkQxLxpx7mqf34x86p",
};

export function getWalletAddress(chainId: string): string {
  return WALLET_ADDRESSES[chainId] || WALLET_ADDRESSES.ethereum;
}
