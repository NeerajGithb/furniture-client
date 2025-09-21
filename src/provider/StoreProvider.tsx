'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useInitializeProductStore } from '@/stores/productStore';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { user, loading: userLoading } = useCurrentUser();
  const { initializeCart, initialized: cartInitialized } = useCartStore();
  const { initializeWishlists, initialized: wishlistInitialized } = useWishlistStore();
  useInitializeProductStore();
  useEffect(() => {
    if (!userLoading) {
      if (user?._id) {
        if (!cartInitialized) {
          initializeCart();
        }
        if (!wishlistInitialized) {
          initializeWishlists();
        }
      } else {
        if (!cartInitialized) {
          initializeCart();
        }
        if (!wishlistInitialized) {
          initializeWishlists();
        }
      }
    }
  }, [
    user,
    userLoading,
    cartInitialized,
    wishlistInitialized,
    initializeCart,
    initializeWishlists,
  ]);

  return <>{children}</>;
};

export const useStoresReady = () => {
  const { user, loading: userLoading } = useCurrentUser();
  const { initialized: cartInitialized } = useCartStore();
  const { initialized: wishlistInitialized } = useWishlistStore();

  const storesReady = !userLoading && cartInitialized && wishlistInitialized;

  return {
    storesReady,
    userLoading,
    cartInitialized,
    wishlistInitialized,
    isAuthenticated: !!user?._id,
  };
};
