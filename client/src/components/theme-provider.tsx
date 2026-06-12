import { createContext, useContext, useEffect, ReactNode } from "react";
import { safeStorage } from "@/lib/safe-storage";

type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: ReactNode;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setThemeFromDB: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    try { safeStorage.setItem("theme", "light"); } catch {}
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", "#ffffff");
    const iosMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (iosMeta) iosMeta.setAttribute("content", "default");
  }, []);

  return (
    <ThemeProviderContext.Provider value={{
      theme: "light",
      setTheme: () => {},
      setThemeFromDB: () => {},
      toggleTheme: () => {},
    }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
