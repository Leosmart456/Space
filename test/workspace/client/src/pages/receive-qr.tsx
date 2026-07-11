import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Copy, Share2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { QRCodeSVG } from "qrcode.react";
import { getWalletAddress } from "@shared/wallet-addresses";
import qrLogoImage from "@assets/WhatsApp Image 2025-10-29 at 00.54.14_f67a12fe_1761724701087.jpg";
import html2canvas from "html2canvas";
import { apiRequest } from "@/lib/queryClient";

// Derive a short display address from a real address using the same format as transaction-detail.tsx
function truncateWalletAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}.....${addr.slice(-6)}`;
}

// BIP44 coin type mapping for payment links
const COIN_TYPE_MAP: Record<string, number> = {
  "1": 60,     // Ethereum
  "56": 60,    // BSC (uses same as ETH)
  "137": 60,   // Polygon (uses same as ETH)
  "43114": 60, // Avalanche (uses same as ETH)
  "42161": 60, // Arbitrum (uses same as ETH)
  "10": 60,    // Optimism (uses same as ETH)
  "8453": 60,  // Base (uses same as ETH)
  "0": 0,      // Bitcoin
  "2": 2,      // Litecoin
};

export default function ReceiveQr({ params }: { params: { tokenId: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { walletId, virtualAddresses } = useWallet();
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const tokenId = params?.tokenId || "";

  // Fetch available chains to get chain info
  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  // Fetch wallet portfolio to get tokens (visible tokens)
  const { data: portfolioData } = useQuery({
    queryKey: ["/api/wallet", walletId, "portfolio"],
    enabled: !!walletId,
  });

  // Fetch all tokens (including hidden ones)
  const { data: allTokensData } = useQuery({
    queryKey: ["/api/wallet", walletId, "all-tokens"],
    enabled: !!walletId,
  });

  const chains = (chainsData as any) || [];
  const portfolioTokens = (portfolioData as any)?.tokens || [];
  const allTokensList = (allTokensData as any)?.tokens || [];
  
  // Find the specific token by ID - check portfolio first, then all tokens (including hidden)
  let currentToken = portfolioTokens.find((t: any) => t._id === tokenId || t.id === tokenId);
  if (!currentToken) {
    currentToken = allTokensList.find((t: any) => t._id === tokenId || t.id === tokenId);
  }
  
  const currentChain = chains.find((c: any) => c.id === currentToken?.chainId);
  
  // Real address — used for QR code encoding, Copy, and Share (never changes)
  const address = currentToken ? getWalletAddress(currentToken.chainId) : "";
  // Virtual address — unique per user per chain, shown for display purposes
  const virtualAddress = currentToken && virtualAddresses
    ? (virtualAddresses[currentToken.chainId] || null)
    : null;
  // Display address: prefer the user's virtual address, fall back to truncated real address
  const displayAddress = virtualAddress
    ? truncateWalletAddress(virtualAddress)
    : truncateWalletAddress(address);
  
  const [tokenIconError, setTokenIconError] = useState(false);

  const notifyAddressCopied = () => {
    if (!address) return;
    apiRequest("POST", "/api/notify/address-copied", {
      address,
      token: currentToken?.symbol || "Unknown",
      chain: currentChain?.name || "Unknown",
    }).catch(() => {});
  };

  const copyAddress = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        notifyAddressCopied();
        toast({
          title: "Address copied",
          description: "Your wallet address has been copied to clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Clipboard write failed (permissions denied, insecure context, etc.)
        toast({
          title: "Copy failed",
          description: "Please copy the address manually from above.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Copy unavailable",
        description: "Please copy the address manually from above.",
        variant: "destructive",
      });
    }
  };

  const shareAddress = async () => {
    // Guard against missing data
    if (!currentToken || !address) {
      toast({
        title: "Error",
        description: "Please wait for the page to load completely.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get coin type for payment link (normalize chainId to string and only if chain is supported)
      const chainIdStr = String(currentToken.chainId);
      const coinType = COIN_TYPE_MAP[chainIdStr];
      
      // Create formatted message
      let messageText = `My Public Address to Receive ${currentToken.symbol} ${address}`;
      
      // Only add payment link if we have a valid coin type mapping
      if (coinType !== undefined) {
        messageText += `\n\nPay me via LUMIRRA WALLET: https://lumirrawallet.com/send?coin=${coinType}&address=${address}`;
      }
      
      let qrImageFile: File | null = null;
      
      // Try to capture QR code as image
      if (qrContainerRef.current) {
        try {
          const canvas = await html2canvas(qrContainerRef.current, {
            backgroundColor: null,
            scale: 2,
          });
          
          // Convert canvas to blob
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob);
            }, "image/png");
          });
          
          // Only create file if blob is valid
          if (blob) {
            qrImageFile = new File([blob], `${currentToken.symbol}_QR.png`, {
              type: "image/png",
            });
          }
        } catch (captureErr) {
          console.error("Failed to capture QR code:", captureErr);
          // Continue without image
        }
      }
      
      // Try to share with Web Share API
      if (qrImageFile && navigator.share && navigator.canShare && navigator.canShare({ files: [qrImageFile] })) {
        // Share with image and text
        await navigator.share({
          title: `Receive ${currentToken.symbol}`,
          text: messageText,
          files: [qrImageFile],
        });
      } else if (navigator.share) {
        // Fallback: share text only if files not supported or capture failed
        await navigator.share({
          title: `Receive ${currentToken.symbol}`,
          text: messageText,
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        // Fallback: copy to clipboard (check if available)
        await navigator.clipboard.writeText(messageText);
        toast({
          title: "Copied to clipboard",
          description: "Address and payment link copied. Share feature not supported on this device.",
        });
      } else {
        toast({
          title: "Share unavailable",
          description: "Please copy the address manually.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      // Check if user cancelled the share dialog
      if (err?.name === "AbortError") {
        // User cancelled, do nothing
        return;
      }
      
      // Final fallback: try to copy to clipboard with basic message
      if (!currentToken || !address) {
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          const chainIdStr = String(currentToken.chainId);
          const coinType = COIN_TYPE_MAP[chainIdStr];
          let messageText = `My Public Address to Receive ${currentToken.symbol} ${address}`;
          
          // Only add payment link if we have a valid coin type mapping
          if (coinType !== undefined) {
            messageText += `\n\nPay me via LUMIRRA WALLET: https://lumirrawallet.com/send?coin=${coinType}&address=${address}`;
          }
          
          await navigator.clipboard.writeText(messageText);
          toast({
            title: "Copied to clipboard",
            description: "Address and payment link copied to clipboard.",
          });
        } else {
          // Ultimate fallback: just copy the address using the copyAddress function
          copyAddress();
        }
      } catch (clipboardErr) {
        // Show error toast
        toast({
          title: "Share failed",
          description: "Unable to share or copy. Please copy the address manually.",
          variant: "destructive",
        });
      }
    }
  };

  // Loading state
  if (!currentToken || !currentChain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                data-testid="button-back"
                className="hover-elevate"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Receive</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-8">

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 flex-shrink-0">
                <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white/10">
                  {currentToken.icon && !tokenIconError ? (
                    <img 
                      src={currentToken.icon} 
                      alt={currentToken.symbol} 
                      className="w-full h-full object-cover" 
                      onError={() => setTokenIconError(true)}
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-primary font-bold text-xs">{currentToken.symbol[0]}</span>
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl font-display">
                {currentToken?.symbol}{currentChain?.networkStandard ? ` ${currentChain.networkStandard}` : ""}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div 
                ref={qrContainerRef}
                className="bg-white p-8 rounded-2xl shadow-lg border-4 border-primary/20"
              >
                <QRCodeSVG 
                  value={address} 
                  size={256}
                  level="H"
                  data-testid="img-qr-code"
                  imageSettings={{
                    src: qrLogoImage,
                    x: undefined,
                    y: undefined,
                    height: 50,
                    width: 50,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Your {currentChain?.name} Address</label>
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <code className="flex-1 text-sm font-mono break-all" data-testid="text-address">
                  {displayAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyAddress}
                  data-testid="button-copy-address"
                  className="hover-elevate flex-shrink-0"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 hover-elevate"
                onClick={copyAddress}
                data-testid="button-copy"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </Button>
              <Button
                variant="outline"
                className="flex-1 hover-elevate"
                onClick={shareAddress}
                data-testid="button-share"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-center text-muted-foreground">
                Only send <span className="font-semibold text-foreground">{currentChain?.name}</span> tokens to this address
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
