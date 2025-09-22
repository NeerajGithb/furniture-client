'use client';

import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initializeApp, resetApp } from '@/stores/globalStoreManager';

const AuthContext = createContext();

const userCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000,
};

const getSessionUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem('vf_user_cache');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const now = Date.now();

    if (now - parsed.timestamp > userCache.ttl) {
      sessionStorage.removeItem('vf_user_cache');
      return null;
    }

    return parsed.user;
  } catch {
    sessionStorage.removeItem('vf_user_cache');
    return null;
  }
};

const setSessionUser = (user) => {
  if (typeof window === 'undefined') return;
  try {
    const cacheData = { user, timestamp: Date.now() };
    sessionStorage.setItem('vf_user_cache', JSON.stringify(cacheData));
    userCache.data = user;
    userCache.timestamp = Date.now();
  } catch {
    userCache.data = user;
    userCache.timestamp = Date.now();
  }
};

const clearUserCache = () => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('vf_user_cache');
    } catch {}
  }
  userCache.data = null;
  userCache.timestamp = null;
};

const getCachedUser = () => {
  if (userCache.data && userCache.timestamp) {
    const now = Date.now();
    if (now - userCache.timestamp <= userCache.ttl) {
      return userCache.data;
    }
  }
  return getSessionUser();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(!getCachedUser());
  const [storesInitialized, setStoresInitialized] = useState(false);
  const refreshIntervalRef = useRef(null);
  const initializationRef = useRef(false);

  const fetchUser = async (skipCache = false) => {
    try {
      if (!skipCache && user && !initializationRef.current) {
        initializationRef.current = true;
        await initializeStores();
        startAutoRefresh();
        setLoading(false);
        return user;
      }

      if (!skipCache) {
        const cachedUser = getCachedUser();
        if (cachedUser) {
          setUser(cachedUser);
          await initializeStores();
          startAutoRefresh();
          setLoading(false);
          return cachedUser;
        }
      }

      const res = await fetchWithCredentials('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await handleApiResponse(res);
        if (data?.user) {
          setUser(data.user);
          setSessionUser(data.user);
          startAutoRefresh();
          await initializeStores();
          return data.user;
        }
      }

      setUser(null);
      clearUserCache();
      await resetStores();
      return null;
    } catch (err) {
      setUser(null);
      clearUserCache();
      await resetStores();
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
          clearUserCache();
          await resetStores();
        }
      } catch {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        setUser(null);
        clearUserCache();
        await resetStores();
      }
    }, 13 * 60 * 1000);

    refreshIntervalRef.current = interval;
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    setSessionUser(newUserData);
  };

  const logout = async () => {
    try {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      setUser(null);
      clearUserCache();
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
    if (typeof window !== 'undefined') {
      fetchUser();
    }

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
        setUser: updateUser,
        refetch: () => fetchUser(true),
        logout,
        initializeStores,
        resetStores,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
