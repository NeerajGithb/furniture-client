'use client';

import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initializeApp, resetApp } from '@/stores/globalStoreManager';

const AuthContext = createContext();

const LOCAL_STORAGE_USER_KEY = 'vf_current_user';

// Helper function to safely get from localStorage (SSR safe)
const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.warn('Failed to parse user from localStorage:', err);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage immediately (no flash)
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(!getStoredUser()); // Only loading if no stored user
  const [storesInitialized, setStoresInitialized] = useState(false);
  const refreshIntervalRef = useRef(null);
  const initializationRef = useRef(false);

  const fetchUser = async (forceServer = false) => {
    // If we have a user from localStorage and not forcing server, init stores and return
    if (!forceServer && user && !initializationRef.current) {
      initializationRef.current = true;
      await initializeStores();
      startAutoRefresh();
      return user;
    }

    // Fetch from server
    try {
      const res = await fetchWithCredentials('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.status === 401) {
        const refreshed = await attemptTokenRefresh();
        if (!refreshed) {
          setUser(null);
          await resetStores();
          setLoading(false);
          return null;
        }
        return await fetchUser(true);
      }

      if (!res.ok) {
        setUser(null);
        await resetStores();
        setLoading(false);
        return null;
      }

      const data = await handleApiResponse(res);
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
        startAutoRefresh();
        await initializeStores();
        return data.user;
      } else {
        setUser(null);
        await resetStores();
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        return null;
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
      await resetStores();
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const initializeStores = async () => {
    if (storesInitialized) return;
    try {
      await initializeApp();
      setStoresInitialized(true);
    } catch {}
  };

  const resetStores = async () => {
    if (!storesInitialized) return;
    try {
      await resetApp();
      setStoresInitialized(false);
    } catch {}
  };

  const attemptTokenRefresh = async () => {
    try {
      const res = await fetchWithCredentials('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
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
        const res = await fetchWithCredentials('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          await resetStores();
        }
      } catch {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        await resetStores();
      }
    }, 13 * 60 * 1000); // refresh every 13 min

    refreshIntervalRef.current = interval;
  };

  const logout = async () => {
    try {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      await resetStores();

      await fetchWithCredentials('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  useEffect(() => {
    // Only fetch from server if we don't have a user or need to verify
    if (typeof window !== 'undefined') {
      if (user && !initializationRef.current) {
        // We have user from localStorage, just initialize
        initializationRef.current = true;
        initializeStores();
        startAutoRefresh();
        setLoading(false);
      } else if (!user) {
        // No user, fetch from server
        fetchUser();
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Additional effect to handle hydration mismatches
  useEffect(() => {
    // This ensures client-side hydration matches server-side rendering
    if (typeof window !== 'undefined' && !user) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setLoading(false);
      }
    }
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
        resetStores: () => resetStores(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
