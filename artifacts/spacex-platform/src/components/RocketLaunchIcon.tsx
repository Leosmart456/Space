import { motion } from "framer-motion";

/**
 * Animated rocket-about-to-launch icon used for empty states (e.g. "No purchases yet").
 * Green glow + flickering thrust flame + gentle hover bob.
 */
export function RocketLaunchIcon({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center shrink-0`}>
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.35) 0%, rgba(52,211,153,0) 70%)" }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.05, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rocket body — gentle bob as if throttling up */}
      <motion.svg
        viewBox="0 0 24 24"
        className="relative z-10 w-[62%] h-[62%]"
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M12 1.5c2.7 2.3 4.3 6.1 4.3 10.3 0 2.2-.9 4.4-2.1 6.1H9.8c-1.2-1.7-2.1-3.9-2.1-6.1 0-4.2 1.6-8 4.3-10.3z"
          fill="#34d399"
          stroke="#6ee7b7"
          strokeWidth="0.5"
        />
        <circle cx="12" cy="8.6" r="1.5" fill="#022c22" />
        <path d="M7.7 12.2c-1.7.1-3.1 1.3-3.6 3.2l3-.7z" fill="#059669" />
        <path d="M16.3 12.2c1.7.1 3.1 1.3 3.6 3.2l-3-.7z" fill="#059669" />
        <path d="M9.8 18.4h4.4l-.8 2a1.8 1.8 0 0 1-2.8 0z" fill="#a7f3d0" />
      </motion.svg>

      {/* Flickering thrust flame */}
      <motion.div
        className="absolute z-0 rounded-full"
        style={{
          bottom: "10%",
          width: "14%",
          height: "22%",
          background: "linear-gradient(to top, #10b981, #6ee7b7)",
          filter: "blur(1.5px)",
        }}
        animate={{ opacity: [0.4, 1, 0.5, 1], scaleY: [0.6, 1.4, 0.8, 1.2], scaleX: [0.8, 1.1, 0.9, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
