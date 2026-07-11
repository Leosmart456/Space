/**
 * Format a blockchain address for display
 * Example: 0xADBaa25dDce928FDa7E96c77f6c41C301a2501bb -> 0xADBaa...2501bb
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 5): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
