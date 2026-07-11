import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

let shownThisLoad = false;

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function AdminAlertOverlay() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [msLeft, setMsLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (!userData) return;
    if (shownThisLoad) return;
    if (userData.isAdmin) return;
    if (!userData.alertEnabled) return;
    const msg = (userData.alertMessage ?? "").trim();
    if (!msg) return;

    shownThisLoad = true;
    setMessage(msg);
    setVisible(true);

    const dl = userData.alertDeadline ?? null;
    setDeadline(dl);

    if (dl) {
      const remaining = dl - Date.now();
      setMsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        setIsExpired(true);
      }
    }
  }, [userData]);

  useEffect(() => {
    if (!visible || !deadline) return;

    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setMsLeft(0);
        setIsExpired(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setMsLeft(remaining);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, deadline]);

  useEffect(() => {
    if (!isExpired || loggedOut) return;
    setLoggedOut(true);
    apiRequest("POST", "/api/auth/logout").catch(() => {});
    setTimeout(() => {
      window.location.href = import.meta.env.BASE_URL;
    }, 3500);
  }, [isExpired, loggedOut]);

  const dismiss = useCallback(() => setVisible(false), []);

  const hasCountdown = !!deadline;
  const showX = !isExpired;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="admin-alert-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            zIndex: 2147483646,
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
          }}
          data-testid="admin-alert-overlay"
        >
          {showX && (
            <button
              onClick={dismiss}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 4,
              }}
              data-testid="button-dismiss-alert"
            >
              <X style={{ width: 24, height: 24, color: "rgba(255,255,255,0.5)" }} />
            </button>
          )}

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 200, damping: 18 }}
            style={{
              marginBottom: 32,
              padding: 20,
              borderRadius: "50%",
              backgroundColor: isExpired
                ? "rgba(239,68,68,0.15)"
                : "rgba(234,179,8,0.15)",
            }}
          >
            {isExpired ? (
              <Lock style={{ width: 48, height: 48, color: "#ef4444" }} strokeWidth={1.5} />
            ) : (
              <AlertTriangle style={{ width: 48, height: 48, color: "#facc15" }} strokeWidth={1.5} />
            )}
          </motion.div>

          {isExpired ? (
            <>
              <motion.p
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  color: "#ef4444",
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
                data-testid="admin-alert-locked-title"
              >
                Account Locked
              </motion.p>
              <motion.p
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                style={{
                  color: "rgba(255,255,255,0.7)",
                  textAlign: "center",
                  fontSize: 14,
                  lineHeight: 1.6,
                  maxWidth: 300,
                  marginBottom: 32,
                }}
                data-testid="admin-alert-locked-message"
              >
                Your account access has been revoked. Please contact support.
              </motion.p>
            </>
          ) : (
            <>
              <motion.p
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: 1.6,
                  maxWidth: 300,
                  marginBottom: hasCountdown ? 28 : 48,
                }}
                data-testid="admin-alert-message"
              >
                {message}
              </motion.p>

              {hasCountdown && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.24 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: 36,
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 38,
                      fontWeight: 700,
                      color: msLeft < 60_000 ? "#ef4444" : msLeft < 300_000 ? "#f97316" : "#facc15",
                      letterSpacing: "0.05em",
                      lineHeight: 1,
                    }}
                    data-testid="admin-alert-countdown"
                  >
                    {formatCountdown(msLeft)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    until account lock
                  </span>
                </motion.div>
              )}
            </>
          )}

          {!isExpired && (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 8 }}>
              Tap ✕ to dismiss
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
