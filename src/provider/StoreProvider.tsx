// components/StoreProvider.tsx
'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { user, loading: userLoading } = useCurrentUser();
  const { initializeCart, initialized: cartInitialized } = useCartStore();
  const { initializeWishlist, initialized: wishlistInitialized } = useWishlistStore();

  useEffect(() => {
    // Only initialize stores after we know the user status
    if (!userLoading) {
      if (user?._id) {
        // User is authenticated - initialize both stores
        if (!cartInitialized) {
          initializeCart();
        }
        if (!wishlistInitialized) {
          initializeWishlist();
        }
      } else {
        // User is not authenticated - mark as initialized with empty state
        // This is handled automatically in the store initialization
        if (!cartInitialized) {
          initializeCart(); // Will handle unauthenticated case
        }
        if (!wishlistInitialized) {
          initializeWishlist(); // Will handle unauthenticated case
        }
      }
    }
  }, [user, userLoading, cartInitialized, wishlistInitialized, initializeCart, initializeWishlist]);

  return <>{children}</>;
};

// Optional: Export a hook to check if stores are ready
export const useStoresReady = () => {
  const { user, loading: userLoading } = useCurrentUser();
  const { initialized: cartInitialized } = useCartStore();
  const { initialized: wishlistInitialized } = useWishlistStore();

  // Stores are ready when:
  // 1. User loading is complete
  // 2. Both stores are initialized
  const storesReady = !userLoading && cartInitialized && wishlistInitialized;
  
  return {
    storesReady,
    userLoading,
    cartInitialized,
    wishlistInitialized,
    isAuthenticated: !!user?._id
  };
};