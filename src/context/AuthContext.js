"use client";

import { fetchWithCredentials, handleApiResponse } from "@/utils/fetchWithCredentials";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { initializeApp, resetApp } from "@/stores/globalStoreManager";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storesInitialized, setStoresInitialized] = useState(false);
  const refreshIntervalRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await fetchWithCredentials("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 401) {
        const refreshed = await attemptTokenRefresh();

        if (!refreshed) {
          setUser(null);
          await resetStores();
          setLoading(false);
          return;
        }

        return await fetchUser();
      }

      if (!res.ok) {
        setUser(null);
        await resetStores();
        setLoading(false);
        return;
      }

      const data = await handleApiResponse(res);
      if (data?.user) {
        setUser(data.user);
        startAutoRefresh();
        await initializeStores();
      } else {
        setUser(null);
        await resetStores();
      }
    } catch {
      setUser(null);
      await resetStores();
    } finally {
      setLoading(false);
    }
  };

  const initializeStores = async () => {
    if (storesInitialized) return;
    
    try {
      await initializeApp();
      setStoresInitialized(true);
    } catch {
      // Silently fail
    }
  };

  const resetStores = async () => {
    if (!storesInitialized) return;
    
    try {
      await resetApp();
      setStoresInitialized(false);
    } catch {
      // Silently fail
    }
  };

  const attemptTokenRefresh = async () => {
    try {
      const res = await fetchWithCredentials("/api/auth/refresh", {
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
        const res = await fetchWithCredentials("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
          setUser(null);
          await resetStores();
        }
      } catch {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        setUser(null);
        await resetStores();
      }
    }, 13 * 60 * 1000);

    refreshIntervalRef.current = interval;
  };

  const logout = async () => {
    try {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      setUser(null);
      await resetStores();
      
      await fetchWithCredentials("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      window.location.reload();
    } catch {
      window.location.reload();
    }
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

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        storesInitialized,
        setUser, 
        refetch: fetchUser,
        logout,
        initializeStores: () => initializeStores(),
        resetStores: () => resetStores()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);