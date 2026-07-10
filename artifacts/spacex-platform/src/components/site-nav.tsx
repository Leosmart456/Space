import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import logoSrc from "@assets/xpsca_1778445100452.png";

interface SiteNavProps {
  active?: "about" | "contact" | "sign-in" | "invest";
}

export default function SiteNav({ active }: SiteNavProps) {
  const [, navigate] = useLocation();
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);

  const linkCls = (page?: string) =>
    `text-xs tracking-widest uppercase font-bold px-3 py-2 transition-colors touch-manipulation ${
      active === page ? "text-white" : "text-white/50 hover:text-white"
    }`;

  const navLinks = [
    { label: "About", path: "/about", key: "about" },
    { label: "Contact", path: "/contact", key: "contact" },
    ...(!isSignedIn
      ? [
          { label: "Sign In", path: "/sign-in", key: "sign-in" },
        ]
      : []),
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="focus:outline-none touch-manipulation">
          <img src={logoSrc} alt="SpaceX" className="h-14 w-auto" />
        </button>

        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((l) => (
            <button
              key={l.key}
              onClick={() => navigate(l.path)}
              className={linkCls(l.key)}
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              {l.label}
            </button>
          ))}
          {!isSignedIn && (
            <button
              onClick={() => navigate("/invest")}
              className="ml-2 text-xs bg-white text-black font-black px-5 py-2 tracking-widest uppercase hover:bg-white/90 transition-colors touch-manipulation"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
            >
              Invest
            </button>
          )}
        </div>

        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 touch-manipulation"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          <motion.span
            animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-px bg-white origin-center"
          />
          <motion.span
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            className="block w-6 h-px bg-white"
          />
          <motion.span
            animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-px bg-white origin-center"
          />
        </button>
      </div>

      <motion.div
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="md:hidden overflow-hidden bg-black border-t border-white/[0.08]"
      >
        <div className="flex flex-col px-6 py-4">
          {navLinks.map((l) => (
            <button
              key={l.key}
              onClick={() => { setOpen(false); navigate(l.path); }}
              className="w-full text-left py-4 text-sm text-white/70 hover:text-white tracking-[0.2em] uppercase border-b border-white/[0.06] last:border-0 touch-manipulation"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              {l.label}
            </button>
          ))}
          {!isSignedIn && (
            <button
              onClick={() => { setOpen(false); navigate("/invest"); }}
              className="w-full text-left py-4 text-sm text-white tracking-[0.2em] uppercase touch-manipulation"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              Invest →
            </button>
          )}
        </div>
      </motion.div>
    </nav>
  );
}
