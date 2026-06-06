import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Subtle star field */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 1.5 + 0.5 + "px",
              height: Math.random() * 1.5 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <div className="relative z-10 px-6 md:px-16 h-16 flex items-center border-b border-white/[0.06]">
        <button
          onClick={() => navigate("/")}
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <span
            className="text-white font-black text-lg tracking-[0.25em] uppercase"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            SPACEX
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* 404 number */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div
            className="font-black leading-none mb-4 select-none"
            style={{
              fontSize: "clamp(7rem, 30vw, 18rem)",
              fontFamily: "'Arial Black', Arial, sans-serif",
              letterSpacing: "-0.02em",
              color: "transparent",
              WebkitTextStroke: "1px rgba(255,255,255,0.08)",
            }}
          >
            404
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <p className="text-white/30 text-[0.6rem] tracking-[0.35em] uppercase mb-3"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            Error
          </p>
          <h1
            className="text-white font-black text-2xl md:text-4xl tracking-wide mb-4 uppercase"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.05em" }}
          >
            PAGE NOT FOUND
          </h1>
          <p className="text-white/40 text-sm max-w-sm leading-relaxed mb-10">
            The page you're looking for has either been moved, deleted, or doesn't exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-7 py-3 bg-white text-black font-black text-xs tracking-widest uppercase hover:bg-white/90 transition-colors"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
            >
              RETURN HOME ›
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-7 py-3 border border-white/20 text-white/60 font-black text-xs tracking-widest uppercase hover:border-white/50 hover:text-white transition-all"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
            >
              GO BACK
            </button>
          </div>
        </motion.div>

        {/* Thin divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]"
        />
      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 md:px-16 h-12 flex items-center border-t border-white/[0.06]">
        <p className="text-white/20 text-[0.6rem] tracking-widest uppercase"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
          © 2026 SpaceX Pre-IPO Platform
        </p>
      </div>
    </div>
  );
}
