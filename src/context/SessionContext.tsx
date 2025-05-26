"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  role: string;
  twoFactorEnabled?: boolean;
};

type SessionContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  token: null,
  login: async () => ({}),
  logout: async () => {},
  isLoading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorToken }),
        credentials: "include", // Important: include cookies
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }
      
      const data = await res.json();
      
      // If 2FA is required, return the response without setting user/token
      if (data.requiresTwoFactor) {
        return data;
      }
      
      setUser(data.user);
      setToken(data.token);
      
      // Store in localStorage for client-side access
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear local state first
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      
      // Call server to clear token cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Force page reload to ensure all caches are cleared
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect to login even if logout API fails
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
} 