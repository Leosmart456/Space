import { ethers } from "ethers";

// Ethereum-only RPC configuration
const ETHEREUM_RPC = "https://eth.llamarpc.com";

// ERC-20 ABI (minimal interface for balance checking)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
  }

  /**
   * Get ETH balance for an address
   */
  async getEthBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Failed to fetch ETH balance for ${address}:`, error);
      return "0";
    }
  }

  /**
   * Get ERC-20 token balance for an address
   */
  async getTokenBalance(
    contractAddress: string,
    walletAddress: string,
    decimals: number
  ): Promise<string> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(walletAddress);
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error(`Failed to fetch token balance for ${contractAddress}:`, error);
      return "0";
    }
  }

  /**
   * Get token metadata (name, symbol, decimals) from contract
   */
  async getTokenMetadata(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      return { name, symbol, decimals: Number(decimals) };
    } catch (error) {
      console.error(`Failed to fetch token metadata for ${contractAddress}:`, error);
      throw new Error("Failed to fetch token metadata");
    }
  }


  /**
   * Send ETH
   */
  async sendEth(
    privateKey: string,
    to: string,
    amount: string
  ): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error(`Failed to send ETH:`, error);
      throw new Error("Failed to send transaction");
    }
  }

  /**
   * Send ERC-20 tokens
   */
  async sendToken(
    privateKey: string,
    contractAddress: string,
    to: string,
    amount: string,
    decimals: number
  ): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(
        contractAddress,
        ["function transfer(address to, uint256 amount) returns (bool)"],
        wallet
      );

      const tx = await contract.transfer(to, ethers.parseUnits(amount, decimals));
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error(`Failed to send token:`, error);
      throw new Error("Failed to send token transaction");
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<{
    status: "pending" | "confirmed" | "failed";
    gasUsed?: string;
    blockNumber?: number;
  }> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { status: "pending" };
      }

      return {
        status: receipt.status === 1 ? "confirmed" : "failed",
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error(`Failed to get transaction receipt:`, error);
      return { status: "pending" };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      console.error(`Failed to wait for transaction:`, error);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
