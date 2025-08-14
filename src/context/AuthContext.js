"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 401) {
        const refreshed = await attemptTokenRefresh();

        if (!refreshed) {
          throw new Error("Token refresh failed");
        }

        return await fetchUser(); // Retry once
      }

      if (!res.ok) throw new Error("Failed to fetch user");

      const data = await res.json();
      if (data?.user) {
        setUser(data.user);
        startAutoRefresh();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("❌ Auth fetch error:", err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const attemptTokenRefresh = async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      return res.ok;
    } catch {
      return false;
    }
  };

  const startAutoRefresh = () => {
    if (refreshIntervalRef.current) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
          setUser(null);
        }
      } catch {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        setUser(null);
      }
    }, 13 * 60 * 1000); // every 13 minutes

    refreshIntervalRef.current = interval;
  };

  useEffect(() => {
    fetchUser();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading, setUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
