// stores/wishlistStore.ts
import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';

export interface WishlistItem {
  _id: string;
  productId: string;
  addedAt: string;
  product?: {
    _id: string;
    name: string;
    finalPrice: number;
    originalPrice?: number;
    discountPercent?: number;
    mainImage?: { url: string; alt?: string };
    inStockQuantity: number;
    isInStock: boolean;
    ratings?: number;
    reviews?: { average: number; count: number };
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    category?: string;
    brand?: string;
  };
}

export interface WishlistData {
  _id: string;
  items: WishlistItem[];
  itemCount: number;
  updatedAt: string;
}

interface WishlistStore {
  wishlist: WishlistData | null;
  initialized: boolean;
  loading: boolean;
  updatingItems: Set<string>;

  // Actions
  initializeWishlists: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  batchRemoveFromWishlist: (productIds: string[]) => Promise<boolean>;
  clearWishlist: () => Promise<boolean>;
  refreshWishlist: () => Promise<void>;

  // Computed getters
  isWishlisted: (productId: string) => boolean;
  isUpdating: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlist: null,
  initialized: false,
  loading: false,
  updatingItems: new Set(),

  // Initialize wishlist on app start
  initializeWishlists: async () => {
    if (get().initialized) return;

    try {
      console.log('Wishlist initialization started');
      set({ loading: true });
      const response = await fetchWithCredentials('/api/wishlist?limit=1000');

      if (!response.ok) {
        if (response.status === 401) {
          set({
            wishlist: null,
            initialized: true,
            loading: false,
          });
          return;
        }
        throw new Error('Failed to fetch wishlist');
      }

      const data: WishlistData = await handleApiResponse(response);

      set({
        wishlist: data,
        initialized: true,
        loading: false,
      });
      
      console.log('Wishlist initialized with', data.itemCount, 'items');
    } catch (error) {
      console.error('Wishlist initialization error:', error);
      set({
        wishlist: null,
        initialized: true,
        loading: false,
      });
    }
  },

  refreshWishlist: async () => {
    try {
      const response = await fetchWithCredentials('/api/wishlist');
      if (response.ok) {
        const data: WishlistData = await handleApiResponse(response);
        set({ wishlist: data });
        console.log('Wishlist refreshed');
      }
    } catch (error) {
      console.error('Wishlist refresh error:', error);
    }
  },

  addToWishlist: async (productId: string): Promise<boolean> => {
    const { updatingItems, wishlist } = get();

    if (updatingItems.has(productId)) return false;
    
    // Check if already in wishlist
    if (wishlist?.items.some(item => item.productId === productId)) {
      toast.error('Product already in wishlist');
      return false;
    }

    // Optimistic update
    const newItem: WishlistItem = {
      _id: `temp-${productId}-${Date.now()}`,
      productId,
      addedAt: new Date().toISOString(),
    };

    const updatedWishlist: WishlistData = wishlist
      ? {
          ...wishlist,
          items: [...wishlist.items, newItem],
          itemCount: wishlist.itemCount + 1,
          updatedAt: new Date().toISOString(),
        }
      : {
          _id: 'temp-wishlist',
          items: [newItem],
          itemCount: 1,
          updatedAt: new Date().toISOString(),
        };

    set({
      wishlist: updatedWishlist,
      updatingItems: new Set([...updatingItems, productId]),
    });

    try {
      const response = await fetchWithCredentials('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const data = await handleApiResponse(response);
        throw new Error(data.error || 'Failed to add to wishlist');
      }

      await get().refreshWishlist();
      toast.success('Added to wishlist');
      return true;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      toast.error('Failed to add to wishlist');

      // Rollback optimistic update
      set({ wishlist });
      return false;
    } finally {
      const newUpdating = new Set(get().updatingItems);
      newUpdating.delete(productId);
      set({ updatingItems: newUpdating });
    }
  },

  removeFromWishlist: async (productId: string): Promise<boolean> => {
    const { updatingItems, wishlist } = get();

    if (updatingItems.has(productId)) return false;
    
    // Check if product is in wishlist
    if (!wishlist?.items.some(item => item.productId === productId)) {
      toast.error('Product not in wishlist');
      return false;
    }

    const originalWishlist = wishlist;

    // Optimistic update
    const updatedWishlist = {
      ...wishlist,
      items: wishlist.items.filter((item) => item.productId !== productId),
      itemCount: Math.max(0, wishlist.itemCount - 1),
      updatedAt: new Date().toISOString(),
    };

    set({
      wishlist: updatedWishlist,
      updatingItems: new Set([...updatingItems, productId]),
    });

    try {
      const response = await fetchWithCredentials(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await handleApiResponse(response);
        throw new Error(data.error || 'Failed to remove from wishlist');
      }

      toast.success('Removed from wishlist');
      return true;
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      toast.error('Failed to remove from wishlist');

      // Rollback optimistic update
      set({ wishlist: originalWishlist });
      return false;
    } finally {
      const newUpdating = new Set(get().updatingItems);
      newUpdating.delete(productId);
      set({ updatingItems: newUpdating });
    }
  },

  // Batch remove items from wishlist (for order completion)
  batchRemoveFromWishlist: async (productIds: string[]): Promise<boolean> => {
    const { wishlist } = get();
    
    if (!wishlist || !productIds.length) return false;

    const originalWishlist = wishlist;
    
    // Optimistic update - remove all specified items
    const remainingItems = wishlist.items.filter(item => !productIds.includes(item.productId));
    const removedCount = wishlist.items.length - remainingItems.length;

    if (removedCount === 0) {
      // No items to remove
      return true;
    }

    const optimisticWishlist: WishlistData = {
      ...wishlist,
      items: remainingItems,
      itemCount: Math.max(0, wishlist.itemCount - removedCount),
      updatedAt: new Date().toISOString(),
    };

    set({ wishlist: optimisticWishlist, loading: true });

    try {
      const response = await fetchWithCredentials('/api/wishlist/batch-remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });

      if (!response.ok) {
        const data = await handleApiResponse(response);
        throw new Error(data.error || 'Failed to remove items from wishlist');
      }

      // Refresh to get accurate server data
      await get().refreshWishlist();
      console.log(`Successfully removed ${removedCount} items from wishlist`);
      return true;
    } catch (error) {
      console.error('Batch remove from wishlist error:', error);
      
      // Rollback optimistic update
      set({ wishlist: originalWishlist });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  clearWishlist: async (): Promise<boolean> => {
    const { wishlist } = get();
    const originalWishlist = wishlist;

    // Optimistic update
    set({
      wishlist: wishlist
        ? { ...wishlist, items: [], itemCount: 0, updatedAt: new Date().toISOString() }
        : null,
      loading: true,
    });

    try {
      const response = await fetchWithCredentials('/api/wishlist?clearAll=true', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await handleApiResponse(response);
        throw new Error(data.error || 'Failed to clear wishlist');
      }

      toast.success('Wishlist cleared');
      return true;
    } catch (error) {
      console.error('Clear wishlist error:', error);
      toast.error('Failed to clear wishlist');

      // Rollback optimistic update
      set({ wishlist: originalWishlist });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Computed getters
  isWishlisted: (productId: string) => {
    const { wishlist } = get();
    return wishlist?.items.some(item => item.productId === productId) ?? false;
  },
  
  isUpdating: (productId: string) => get().updatingItems.has(productId),
}));