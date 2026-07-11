/**
 * Generate realistic-looking random addresses for different blockchain networks
 */

// Generate random hex string of specified length
function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate random base58 string (for Solana/Tron)
function randomBase58(length: number): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random EVM address (Ethereum, BSC, Polygon, etc.)
 * Format: 0x + 40 hex characters
 */
export function generateEvmAddress(): string {
  return "0x" + randomHex(40);
}

/**
 * Generate a random Tron address
 * Format: T + 33 base58 characters
 */
export function generateTronAddress(): string {
  return "T" + randomBase58(33);
}

/**
 * Generate a random Solana address
 * Format: 32-44 base58 characters
 */
export function generateSolanaAddress(): string {
  return randomBase58(44);
}

/**
 * Generate a random address for any supported chain
 */
export function generateAddressForChain(chainId: string): string {
  // Normalize chainId
  const normalized = chainId.toLowerCase();
  
  // Tron chains
  if (normalized === "tron") {
    return generateTronAddress();
  }
  
  // Solana chains
  if (normalized === "solana") {
    return generateSolanaAddress();
  }
  
  // EVM chains (Ethereum, BSC, Polygon, Avalanche, etc.)
  // Default to EVM for any other chain
  return generateEvmAddress();
}

/**
 * Generate a random transaction hash for any supported chain
 * Most chains use 64-character hex hashes
 */
export function generateTxHashForChain(chainId: string): string {
  const normalized = chainId.toLowerCase();
  
  // Solana uses base58 transaction signatures
  if (normalized === "solana") {
    return randomBase58(88);
  }
  
  // Most blockchains (EVM, Tron) use 64-character hex hashes
  return "0x" + randomHex(64);
}
