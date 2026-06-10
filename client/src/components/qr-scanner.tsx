import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = "qr-reader";

  useEffect(() => {
    const scanner = new Html5Qrcode(qrRegionId);
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    scanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          scanner.stop();
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
        }
      )
      .catch((err) => {
        if (onError) {
          onError("Unable to access camera. Please grant camera permissions.");
        }
        console.error("QR Scanner error:", err);
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div>
      <div id={qrRegionId} className="rounded-lg overflow-hidden" />
      <p className="text-xs text-muted-foreground text-center mt-4">
        Point your camera at a QR code to scan the address
      </p>
    </div>
  );
}
