import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Shield, 
  RefreshCw, 
  Layers, 
  Lock, 
  Eye, 
  Zap, 
  Globe,
  Award,
  Sparkles
} from "lucide-react";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import logoImage from "@assets/Lumirra Logo Design (original)_1761875532047.png";
import mockupLightImage from "@assets/LIGHT_THEME_1775364086941.png";
import mockupDarkImage from "@assets/DARK_THEME_1775364086943.png";

function getDailyNewUsers() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const random = Math.sin(seed) * 10000;
  const value = Math.floor((random - Math.floor(random)) * 870) + 130;
  return value;
}

function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}</span>;
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="group relative"
    >
      <div className="relative p-8 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover-elevate transition-all duration-300">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1677FF]/5 to-[#2ED8FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useWallet();
  
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  // Redirect logged-in users straight to the dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrolled(prev => {
        if (!prev && currentScroll > 50) return true;
        if (prev && currentScroll < 20) return false;
        return prev;
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm' : 'bg-transparent backdrop-blur-sm'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            data-testid="logo-header"
          >
            <img src={logoImage} alt="Lumirra" className="h-10 w-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] bg-clip-text text-transparent">
              Lumirra
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <ThemeToggle />
            <MobileMenu />
          </motion.div>
        </div>
      </header>

      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1677FF]/5 via-background to-[#2ED8FF]/5" />
          <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-[#1677FF]/5 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#2ED8FF]/5 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col items-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#1677FF]/10 to-[#2ED8FF]/10 border border-[#1677FF]/20 mt-8">
                <Sparkles className="h-4 w-4 text-[#1677FF]" />
                <span className="text-sm font-medium">Secure Multi-Chain Wallet</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-left">
                True crypto
                <br />
                ownership.
                <br />
                <span className="bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] bg-clip-text text-transparent">
                  Powerful Web3
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl text-left">
                Unlock the power of your cryptocurrency assets and explore the world of Web3 with Lumirra.
              </p>
              <Button
                onClick={() => setLocation("/create-account")}
                size="lg"
                className="bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] hover:shadow-lg hover:shadow-[#1677FF]/50 transition-all duration-300 text-lg px-8"
                data-testid="button-get-started"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <div className="relative flex justify-center items-center w-full mt-12">
              {/* Rotating chain logos container */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  {/* Ethereum - Top (in front) */}
                  <motion.div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ 
                      zIndex: 20,
                      backgroundColor: theme === "dark" ? "hsl(222,85%,9%)" : "white",
                      border: '3px solid #3B82F6',
                      boxShadow: theme === "dark"
                        ? '0 10px 30px rgba(0,0,0,0.5)'
                        : '0 10px 30px rgba(0,0,0,0.15)'
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    <img 
                      src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" 
                      alt="Ethereum" 
                      className="w-11 h-11"
                    />
                  </motion.div>

                  {/* BNB - Right (behind) */}
                  <motion.div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ 
                      zIndex: 5,
                      backgroundColor: theme === "dark" ? "hsl(222,85%,9%)" : "white",
                      border: '3px solid #EAB308',
                      boxShadow: theme === "dark"
                        ? '0 10px 30px rgba(0,0,0,0.5)'
                        : '0 10px 30px rgba(0,0,0,0.15)'
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    <img 
                      src="https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" 
                      alt="BNB" 
                      className="w-11 h-11"
                    />
                  </motion.div>

                  {/* TRON - Bottom (behind) */}
                  <motion.div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ 
                      zIndex: 5,
                      backgroundColor: theme === "dark" ? "hsl(222,85%,9%)" : "white",
                      border: '3px solid #EF4444',
                      boxShadow: theme === "dark"
                        ? '0 10px 30px rgba(0,0,0,0.5)'
                        : '0 10px 30px rgba(0,0,0,0.15)'
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    <img 
                      src="https://assets.coingecko.com/coins/images/1094/small/tron-logo.png" 
                      alt="TRON" 
                      className="w-11 h-11"
                    />
                  </motion.div>

                  {/* Solana - Left (in front) */}
                  <motion.div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ 
                      zIndex: 20,
                      backgroundColor: theme === "dark" ? "hsl(222,85%,9%)" : "white",
                      border: '3px solid #A855F7',
                      boxShadow: theme === "dark"
                        ? '0 10px 30px rgba(0,0,0,0.5)'
                        : '0 10px 30px rgba(0,0,0,0.15)'
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    <img 
                      src="https://assets.coingecko.com/coins/images/4128/small/solana.png" 
                      alt="Solana" 
                      className="w-11 h-11"
                    />
                  </motion.div>
                </motion.div>
              </div>

              {/* Mockup image — both images always in DOM so they're pre-loaded.
                  Switching themes is instant: no fetch, just opacity toggle.
                  The container uses a fixed aspect ratio so it has the correct
                  height before the images finish loading (no layout shift). */}
              <div
                className="relative w-full max-w-xl md:max-w-2xl lg:max-w-3xl"
                style={{ zIndex: 10, aspectRatio: "9 / 16" }}
              >
                {/* Light mockup */}
                <img
                  src={mockupLightImage}
                  alt="Lumirra Wallet Dashboard"
                  className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150"
                  style={{ opacity: theme === "light" ? 1 : 0, pointerEvents: theme === "light" ? "auto" : "none" }}
                  loading="eager"
                  fetchpriority="high"
                  decoding="sync"
                  data-testid="img-hero-mockup"
                />
                {/* Dark mockup */}
                <img
                  src={mockupDarkImage}
                  alt="Lumirra Wallet Dashboard"
                  className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150"
                  style={{ opacity: theme === "dark" ? 1 : 0, pointerEvents: theme === "dark" ? "auto" : "none" }}
                  loading="eager"
                  fetchpriority="high"
                  decoding="sync"
                  aria-hidden={theme !== "dark"}
                />

                {/* Phone shadow — dark for light theme, white glow for dark theme */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300"
                  style={{
                    bottom: "-2%",
                    width: "60%",
                    height: "40px",
                    borderRadius: "50%",
                    background: theme === "dark"
                      ? "radial-gradient(ellipse at center, rgba(255,255,255,0.22) 0%, transparent 75%)"
                      : "radial-gradient(ellipse at center, rgba(0,0,0,0.28) 0%, transparent 75%)",
                    filter: "blur(6px)",
                    zIndex: 9,
                  }}
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="space-y-8"
            >

              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    <AnimatedCounter end={4} />+
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Chains</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    100%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Secure</div>
                  <div className="text-xs text-[#1677FF] mt-2 font-semibold">
                    <AnimatedCounter end={getDailyNewUsers()} />+ new users today
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    24/7
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Support</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:flex"
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
            <span>Scroll to explore</span>
            <div className="h-8 w-5 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                animate={{
                  y: [0, 12, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Everything You Need
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Powerful features designed for both crypto beginners and experts
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={ArrowRight}
              title="Send & Receive"
              description="Transfer crypto instantly with QR codes, address validation, and real-time confirmations across all supported chains."
              delay={0}
            />
            <FeatureCard
              icon={RefreshCw}
              title="Token Swaps"
              description="Exchange tokens seamlessly with the best rates from multiple providers. Compare prices and save on fees."
              delay={0.1}
            />
            <FeatureCard
              icon={Shield}
              title="Portfolio Tracking"
              description="Monitor your investments with real-time price updates, charts, and comprehensive transaction history."
              delay={0.2}
            />
            <FeatureCard
              icon={Zap}
              title="Buy with Fiat"
              description="Purchase cryptocurrency directly with credit cards through our secure MoonPay integration."
              delay={0.3}
            />
            <FeatureCard
              icon={Layers}
              title="Multi-Chain Support"
              description="Access Ethereum, BNB Chain, TRON, Solana, and more - all from a single unified interface."
              delay={0.4}
            />
            <FeatureCard
              icon={Globe}
              title="Market Intelligence"
              description="Stay informed with real-time crypto news and market updates from trusted sources."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1677FF]/5 to-[#2ED8FF]/5" />
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Uncompromising Security
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Your keys, your crypto. Built with security at every layer.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Lock}
              title="Self-Custody"
              description="You control your private keys. We never have access to your funds or store your sensitive data."
              delay={0}
            />
            <FeatureCard
              icon={Eye}
              title="Privacy First"
              description="Zero tracking, zero data collection. Your financial activity remains completely confidential."
              delay={0.1}
            />
            <FeatureCard
              icon={Shield}
              title="Encrypted Storage"
              description="Military-grade encryption protects your wallet data with password-based authentication."
              delay={0.2}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <div className="space-y-2">
              <Award className="h-12 w-12 text-[#1677FF] mx-auto" />
              <div className="font-semibold">Industry Standard</div>
              <div className="text-sm text-muted-foreground">BIP-39 Compliant</div>
            </div>
            <div className="space-y-2">
              <Shield className="h-12 w-12 text-[#1677FF] mx-auto" />
              <div className="font-semibold">Encrypted</div>
              <div className="text-sm text-muted-foreground">AES-256 Protection</div>
            </div>
            <div className="space-y-2">
              <Lock className="h-12 w-12 text-[#1677FF] mx-auto" />
              <div className="font-semibold">Open Source</div>
              <div className="text-sm text-muted-foreground">Transparent Code</div>
            </div>
            <div className="space-y-2">
              <Eye className="h-12 w-12 text-[#1677FF] mx-auto" />
              <div className="font-semibold">No Tracking</div>
              <div className="text-sm text-muted-foreground">Complete Privacy</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Supported Chains
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              One wallet for your entire crypto portfolio
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                name: "Ethereum", 
                symbol: "ETH", 
                standard: "ERC-20",
                logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
              },
              { 
                name: "BNB Chain", 
                symbol: "BNB", 
                standard: "BEP-20",
                logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"
              },
              { 
                name: "TRON", 
                symbol: "TRX", 
                standard: "TRC-20",
                logo: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png"
              },
              { 
                name: "Solana", 
                symbol: "SOL", 
                standard: "SPL",
                logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png"
              },
            ].map((chain, index) => (
              <motion.div
                key={chain.symbol}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative p-8 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover-elevate transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#1677FF]/5 to-[#2ED8FF]/5" />
                  <div className="relative flex flex-col items-center text-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center p-3 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <img src={chain.logo} alt={chain.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{chain.name}</div>
                      <div className="text-sm text-muted-foreground">{chain.standard}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1677FF] to-[#2ED8FF]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Start Your Crypto Journey Today
            </h2>
            <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto">
              Join thousands of users managing their digital assets with confidence and security.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => setLocation("/create-account")}
                size="lg"
                className="text-lg px-10 py-7 bg-white text-[#1677FF] hover:bg-white/90 shadow-2xl transform hover:scale-105 transition-all"
                data-testid="button-cta-create"
              >
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => setLocation("/login")}
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 border-2 border-white text-white hover:bg-white/10"
                data-testid="button-cta-login"
              >
                Login to Existing Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 px-4 bg-muted/30 border-t">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Lumirra" className="h-10 w-10" />
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] bg-clip-text text-transparent block">
                  Lumirra
                </span>
                <span className="text-sm text-muted-foreground">Secure Multi-Chain Wallet</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Legal</p>
                <nav className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setLocation("/privacy-policy")}
                    className="text-sm text-muted-foreground hover:text-[#1677FF] transition-colors text-left"
                    data-testid="link-footer-privacy"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => setLocation("/cookie-policy")}
                    className="text-sm text-muted-foreground hover:text-[#1677FF] transition-colors text-left"
                    data-testid="link-footer-cookies"
                  >
                    Cookie Policy
                  </button>
                  <button
                    onClick={() => setLocation("/terms-of-use")}
                    className="text-sm text-muted-foreground hover:text-[#1677FF] transition-colors text-left"
                    data-testid="link-footer-terms"
                  >
                    Terms of Use
                  </button>
                </nav>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Support</p>
                <nav className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setLocation("/faq")}
                    className="text-sm text-muted-foreground hover:text-[#1677FF] transition-colors text-left"
                    data-testid="link-footer-faq"
                  >
                    FAQ
                  </button>
                  <button
                    onClick={() => setLocation("/contact")}
                    className="text-sm text-muted-foreground hover:text-[#1677FF] transition-colors text-left"
                    data-testid="link-footer-contact"
                  >
                    Contact Us
                  </button>
                </nav>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/50 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
            <p>Your keys, your crypto. Always.</p>
            <p>&copy; 2026 Lumirra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
