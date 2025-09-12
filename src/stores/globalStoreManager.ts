// stores/globalStoreManager.ts
import { create } from 'zustand';

// Import all store hooks
import { useAddressStore } from './addressStore';
import { useCartStore } from './cartStore';
import { useCheckoutStore } from './checkoutStore';
import { useOrderStore } from './orderStore';
import { useProductStore } from './productStore';
import { useProfileStore } from './profileStore';
import { useWishlistStore } from './wishlistStore';
import { useHomeStore } from './homeStore';

interface GlobalStoreManager {
  // State
  isInitializing: boolean;
  isResetting: boolean;

  // Actions
  initializeAll: () => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useGlobalStoreManager = create<GlobalStoreManager>((set, get) => ({
  // Initial state
  isInitializing: false,
  isResetting: false,

  // Initialize all stores
  initializeAll: async () => {
    set({ isInitializing: true });

    try {
      console.log('Global initialization started');
      
      // Initialize all stores in parallel
      await Promise.all([
        useProductStore.getState().initializeProducts(),
        useAddressStore.getState().initializeAddresses(),
        useCartStore.getState().initializeCart(),
        useOrderStore.getState().initializeOrders(),
        useWishlistStore.getState().initializeWishlists(),
        useProfileStore.getState().initializeProfile(),
        useHomeStore.getState().fetchInspirations(),
        
      ]);
    } catch (error) {
      console.error('Global initialization error:', error);
      throw error;
    } finally {
      set({ isInitializing: false });
    }
  },

  // Reset all stores
  resetAll: async () => {
    set({ isResetting: true });

    try {
      // Clear persisted data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('checkout-store');
          sessionStorage.clear();
        } catch (error) {
          console.warn('Failed to clear persisted data:', error);
        }
      }

      // Reset all stores
      useAddressStore.setState({
        addresses: [],
        selectedAddressId: "",
        loading: false,
        error: null,
        showAddressForm: false,
        addressForm: {
          type: "home",
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          isDefault: false,
        },
        editingAddressId: null,
        deletingId: null,
      });

      useCartStore.setState({
        cart: null,
        initialized: false,
        loading: false,
        updatingItems: new Set(),
      });

      useCheckoutStore.getState().clearCheckout();

      useOrderStore.getState().clearOrders();
      useOrderStore.getState().clearOrder();

      useProductStore.getState().resetProductState();

      useProfileStore.setState({
        user: null,
        loading: false,
        editing: false,
        uploadingImage: false,
        form: { name: '', phone: '' },
      });

      useWishlistStore.setState({
        wishlist: null,
        initialized: false,
        loading: false,
        updatingItems: new Set(),
      });
    } catch (error) {
      console.error('Global reset error:', error);
      throw error;
    } finally {
      set({ isResetting: false });
    }
  },
}));

// Helper functions for easy access
export const initializeApp = () => {
  return useGlobalStoreManager.getState().initializeAll();
};

export const resetApp = () => {
  return useGlobalStoreManager.getState().resetAll();
};
