import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronRight, RefreshCw, CreditCard, BookOpen, Headphones, Wallet, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/Lumirra Logo Design (original)_1761875532047.png";

export function MobileMenu() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navigate = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover-elevate active-elevate-2 rounded-md w-10 h-10 flex items-center justify-center"
        data-testid="button-menu"
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d={open ? "M6 6L18 18" : "M4 6h16"}
            stroke="#1677FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {!open && (
            <path
              d="M4 12h16"
              stroke="#1677FF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
          <path
            d={open ? "M6 18L18 6" : "M4 18h16"}
            stroke="#1677FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Full Screen Menu Overlay */}
      {open && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-background"
          style={{
            zIndex: 99999,
            height: '100vh',
            width: '100vw',
            overflowY: 'auto'
          }}
        >
          {/* Menu Header */}
          <div className="bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] px-6 py-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Lumirra" className="h-10 w-10" />
              <span className="text-xl font-bold text-white">Lumirra</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="[&_button]:hover:bg-white/20 [&_svg]:text-white">
                <ThemeToggle />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                data-testid="button-close-menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M6 18L18 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-6 py-4 space-y-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-card hover-elevate active-elevate-2"
              data-testid="menu-wallet"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#1677FF]/20 to-[#2ED8FF]/20 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-5 w-5 text-[#1677FF]" />
              </div>
              <span className="font-semibold flex-1">Wallet</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("/swaps-info")}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-card hover-elevate active-elevate-2"
              data-testid="menu-swaps"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#1677FF]/20 to-[#2ED8FF]/20 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-[#1677FF]" />
              </div>
              <span className="font-semibold flex-1">Swaps</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("/buy-crypto-info")}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-card hover-elevate active-elevate-2"
              data-testid="menu-buy-crypto"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#1677FF]/20 to-[#2ED8FF]/20 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-[#1677FF]" />
              </div>
              <span className="font-semibold flex-1">Buy Crypto</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("/faq")}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-card hover-elevate active-elevate-2"
              data-testid="menu-faq"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#1677FF]/20 to-[#2ED8FF]/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-[#1677FF]" />
              </div>
              <span className="font-semibold flex-1">FAQ</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("/contact")}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-card hover-elevate active-elevate-2"
              data-testid="menu-contact"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#1677FF]/20 to-[#2ED8FF]/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="h-5 w-5 text-[#1677FF]" />
              </div>
              <span className="font-semibold flex-1">Contact Us</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("/about")}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-card hover-elevate active-elevate-2"
              data-testid="menu-about"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#1677FF]/20 to-[#2ED8FF]/20 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-[#1677FF]" />
              </div>
              <span className="font-semibold flex-1">About</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Bottom Buttons */}
          <div className="px-6 py-4 border-t border-border space-y-2 mt-auto">
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="w-full h-11 text-base"
              data-testid="button-login-menu"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/create-account")}
              className="w-full h-11 text-base bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] text-white"
              data-testid="button-create-account-menu"
            >
              Create Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
