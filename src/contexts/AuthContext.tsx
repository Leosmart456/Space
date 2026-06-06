import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken, removeToken, isAuthenticated } from "@/lib/auth";

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  signOut: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isSignedIn: false,
  isLoaded: false,
  signOut: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setIsSignedIn(isAuthenticated());
  }, []);

  const signOut = useCallback(() => {
    removeToken();
    setIsSignedIn(false);
    window.location.href = "/";
  }, []);

  useEffect(() => {
    const token = getToken();
    setIsSignedIn(!!token);
    setIsLoaded(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isSignedIn, isLoaded, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
