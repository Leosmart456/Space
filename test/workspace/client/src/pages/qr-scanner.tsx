import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flashlight, Image } from "lucide-react";
import { useLocation } from "wouter";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/wallet-context";

export default function QRScanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useWallet();
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    let mounted = true;
    const qrCodeRegionId = "qr-reader";
    const scanner = new Html5Qrcode(qrCodeRegionId);
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    scanner.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Successfully scanned - prevent multiple scans while navigating
        if (!isNavigating && mounted) {
          handleScan(decodedText);
        }
      },
      (errorMessage) => {
        // Scanning error (ignore, happens frequently)
      }
    ).then(() => {
      if (mounted) {
        setScanning(true);
        // Store video track for flashlight control
        const state = scanner.getState();
        if (state === 2) { // SCANNING state
          try {
            const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
            if (videoElement && videoElement.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              const tracks = stream.getVideoTracks();
              if (tracks.length > 0) {
                videoTrackRef.current = tracks[0];
              }
            }
          } catch (err) {
            console.error("Failed to get video track:", err);
          }
        }
      }
    }).catch((err) => {
      console.error("Failed to start scanner:", err);
      if (mounted) {
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    });

    return () => {
      mounted = false;
      // Proper cleanup: stop and clear
      if (scannerRef.current) {
        const currentScanner = scannerRef.current;
        const state = currentScanner.getState();
        if (state === 2) { // SCANNING
          currentScanner.stop().then(() => {
            currentScanner.clear();
          }).catch(console.error);
        } else {
          currentScanner.clear();
        }
      }
      // Release video track
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      }
    };
  }, []);

  const handleScan = async (decodedText: string) => {
    if (isNavigating) return;
    setIsNavigating(true);

    try {
      // Stop and clear scanner properly
      if (scannerRef.current && scanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setScanning(false);
      }

      // Release video track
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      }

      toast({
        title: "QR Code Scanned",
        description: "Address detected successfully",
      });

      // Store scanned address and go back to previous page
      // This allows the Send page or any other page to use the scanned address
      localStorage.setItem('scannedAddress', decodedText);
      window.history.back();
    } catch (err) {
      console.error("Error during scan cleanup:", err);
      setIsNavigating(false);
    }
  };

  const toggleFlashlight = async () => {
    if (!videoTrackRef.current || !scanning) {
      toast({
        title: "Flashlight Not Available",
        description: "Camera is not active",
      });
      return;
    }

    try {
      const capabilities = videoTrackRef.current.getCapabilities() as any;
      
      if (capabilities.torch) {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: !flashlightOn } as any]
        });
        setFlashlightOn(!flashlightOn);
      } else {
        toast({
          title: "Flashlight Not Supported",
          description: "Your device doesn't support flashlight control",
        });
      }
    } catch (err) {
      console.error("Flashlight error:", err);
      toast({
        title: "Flashlight Error",
        description: "Failed to toggle flashlight",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isNavigating) return;

    if (scannerRef.current) {
      try {
        const result = await scannerRef.current.scanFile(file, false);
        await handleScan(result);
      } catch (err) {
        console.error("Failed to scan file:", err);
        toast({
          title: "Scan Failed",
          description: "Could not detect QR code in the image",
          variant: "destructive",
        });
      }
    }
  };

  const handleBack = async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    try {
      // Proper cleanup before navigation
      if (scannerRef.current && scanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setScanning(false);
      }

      // Release video track
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      }

      setLocation("/dashboard");
    } catch (err) {
      console.error("Error during cleanup:", err);
      setLocation("/dashboard");
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          data-testid="button-back"
          className="text-white hover:bg-white/20"
          disabled={isNavigating}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-full max-w-md">
          {/* QR Reader Container */}
          <div id="qr-reader" className="w-full" />
          
          {/* Scanning Frame Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-2 border-primary rounded-lg">
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center px-8 pb-4">
        <p className="text-white text-sm">
          Position the QR code within the frame to scan
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="pb-8 px-8">
        <div className="flex items-center justify-center gap-12">
          {/* Flashlight Button */}
          <button
            onClick={toggleFlashlight}
            disabled={isNavigating || !scanning}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
              flashlightOn
                ? "bg-primary text-white"
                : "bg-gray-700 text-white"
            }`}
            data-testid="button-flashlight"
          >
            <Flashlight className="h-7 w-7" />
          </button>

          {/* Gallery Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isNavigating}
            className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white disabled:opacity-50"
            data-testid="button-gallery"
          >
            <Image className="h-7 w-7" />
          </button>
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <style>{`
        #qr-reader {
          width: 100%;
          max-width: 100%;
        }
        #qr-reader video {
          width: 100% !important;
          height: auto !important;
          min-height: 300px;
          border-radius: 0.5rem;
          display: block !important;
        }
        #qr-reader__scan_region {
          min-height: 300px !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__camera_selection {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
