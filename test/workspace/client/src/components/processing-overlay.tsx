import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProcessingOverlayProps {
  isProcessing: boolean;
  onComplete: () => void;
  onSuccess?: () => void;
  message?: string;
  duration?: number;
}

export function ProcessingOverlay({
  isProcessing,
  onComplete,
  onSuccess,
  message = "Processing transaction...",
  duration = 5000,
}: ProcessingOverlayProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (!isProcessing) {
      setShowSuccess(false);
      return;
    }

    const successTimer = setTimeout(() => {
      setShowSuccess(true);
      // Fire onSuccess exactly when the checkmark appears
      onSuccessRef.current?.();
    }, duration - 1000);

    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
      setShowSuccess(false);
    }, duration);

    return () => {
      clearTimeout(successTimer);
      clearTimeout(completeTimer);
    };
  }, [isProcessing, duration]);

  if (!isProcessing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-background/40 backdrop-blur-md" />
      
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  rotate: 0,
                }}
                transition={{ 
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="relative"
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-success/30 blur-xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <CheckCircle2 className="h-16 w-16 text-success relative z-10" />
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{ 
                      x: Math.cos((i * Math.PI * 2) / 6) * 40,
                      y: Math.sin((i * Math.PI * 2) / 6) * 40,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  >
                    <Sparkles className="h-4 w-4 text-success" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.p
          key={showSuccess ? "success-text" : "loading-text"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-medium text-foreground"
        >
          {showSuccess ? "Transaction Successful!" : message}
        </motion.p>
      </div>
    </motion.div>
  );
}
