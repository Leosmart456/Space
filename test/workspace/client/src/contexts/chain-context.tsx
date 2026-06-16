import { createContext, useContext, useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safe-storage";

interface ChainContextType {
  selectedChain: string;
  setSelectedChain: (chainId: string) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [selectedChain, setSelectedChainState] = useState<string>("all");

  useEffect(() => {
    const savedChain = safeStorage.getItem("selectedChain", { fallback: "all" });
    if (savedChain) {
      setSelectedChainState(savedChain);
    }
  }, []);

  const setSelectedChain = (chainId: string) => {
    setSelectedChainState(chainId);
    safeStorage.setItem("selectedChain", chainId);
    
    // Invalidate relevant queries when chain changes (but not for "all")
    if (chainId !== "all") {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
    }
  };

  return (
    <ChainContext.Provider value={{ selectedChain, setSelectedChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error("useChain must be used within ChainProvider");
  }
  return context;
}
