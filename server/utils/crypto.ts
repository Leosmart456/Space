import { randomBytes, createHash } from "crypto";
import { ethers } from "ethers";

/**
 * Generate a random BIP-39 mnemonic phrase (12 words)
 */
export function generateMnemonic(): string {
  const wallet = ethers.Wallet.createRandom();
  return wallet.mnemonic!.phrase;
}

/**
 * Validate a BIP-39 mnemonic phrase using ethers.js
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    // Try to create a wallet from the mnemonic
    // If it succeeds, the mnemonic is valid
    ethers.Mnemonic.fromPhrase(mnemonic.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a wallet address from mnemonic using BIP-44 derivation
 */
export function deriveAddress(mnemonic: string): string {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/0");
  return wallet.address;
}

/**
 * Encrypt mnemonic (simple encryption for MVP)
 */
export function encryptMnemonic(mnemonic: string, password: string): string {
  const key = createHash("sha256").update(password).digest();
  const iv = randomBytes(16);
  
  // Simple XOR encryption for MVP (not production-ready!)
  const encrypted = Buffer.from(mnemonic)
    .map((byte, i) => byte ^ key[i % key.length])
    .toString("base64");
  
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt mnemonic
 */
export function decryptMnemonic(encrypted: string, password: string): string {
  const [ivHex, encryptedData] = encrypted.split(":");
  const key = createHash("sha256").update(password).digest();
  
  // Simple XOR decryption
  const decrypted = Buffer.from(encryptedData, "base64")
    .map((byte, i) => byte ^ key[i % key.length])
    .toString();
  
  return decrypted;
}

/**
 * Derive private key from mnemonic using BIP-44 path for Ethereum
 * Default path: m/44'/60'/0'/0/0 (Ethereum mainnet, account 0, address 0)
 */
export function derivePrivateKey(mnemonic: string, derivationPath: string = "m/44'/60'/0'/0/0"): string {
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);
  return hdNode.privateKey;
}

/**
 * Derive wallet from mnemonic using BIP-44 path
 */
export function deriveWallet(mnemonic: string, derivationPath: string = "m/44'/60'/0'/0/0"): ethers.HDNodeWallet {
  return ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);
}

/**
 * Get the address for a chain-specific derivation path
 * Ethereum/BSC/Polygon: m/44'/60'/0'/0/0
 */
export function deriveAddressForChain(mnemonic: string, chainId: string): string {
  // All EVM chains use Ethereum derivation path (coin type 60)
  const derivationPath = "m/44'/60'/0'/0/0";
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);
  return wallet.address;
}

/**
 * Generate a transaction hash (mocked)
 */
export function generateTxHash(): string {
  return "0x" + randomBytes(32).toString("hex");
}
