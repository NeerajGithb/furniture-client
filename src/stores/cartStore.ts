import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';

export interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  selectedVariant?: {
    color?: string;
    size?: string;
    sku?: string;
  };
  addedAt: string;
  itemTotal: number;
  product?: {
    _id: string;
    name: string;
    finalPrice: number;
    originalPrice?: number;
    discountPercent?: number;
    mainImage?: {
      url: string;
      alt?: string;
    };
    inStockQuantity: number;
    isInStock: boolean;
    category?: string;
    brand?: string;
  };
}

export interface Cart {
  _id: string;
  items: CartItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  estimatedTotal: number;
  updatedAt: string;
}

export interface CheckoutTotals {
  subtotal: number;
  selectedQuantity: number;
  insuranceCost: number;
  shippingCost: number;
  totalAmount: number;
  totalDiscount: number;
}

export interface CartCheckoutState {
  selectedItems: Set<string>;
  insuranceEnabled: Set<string>;
  totals: CheckoutTotals;
}

interface CartStore {
  cart: Cart | null;
  initialized: boolean;
  loading: boolean;
  updatingItems: Set<string>;

  checkout: CartCheckoutState;

  initializeCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number, selectedVariant?: any) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;

  setSelectedItems: (items: string[]) => void;
  toggleItemSelection: (productId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  toggleInsurance: (productId: string) => void;
  calculateCheckoutTotals: () => void;

  getCheckoutData: () => {
    selectedItems: string[];
    insuranceEnabled: string[];
    totals: CheckoutTotals;
    cartItems: CartItem[];
  } | null;

  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
  getCartItemIds: () => Set<string>;
  getTotalItems: () => number;
  getTotalQuantity: () => number;
  getSubtotal: () => number;
  isUpdating: (productId: string) => boolean;
  getSelectedCartItems: () => CartItem[];
  isItemSelected: (productId: string) => boolean;
  hasInsurance: (productId: string) => boolean;
}

const initialCheckoutTotals: CheckoutTotals = {
  subtotal: 0,
  selectedQuantity: 0,
  insuranceCost: 0,
  shippingCost: 0,
  totalAmount: 0,
  totalDiscount: 0,
};

const initialCheckoutState: CartCheckoutState = {
  selectedItems: new Set<string>(),
  insuranceEnabled: new Set<string>(),
  totals: { ...initialCheckoutTotals },
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      initialized: false,
      loading: false,
      updatingItems: new Set<string>(),
      checkout: { ...initialCheckoutState },

      initializeCart: async () => {
        if (get().initialized) return;

        try {
          set({ loading: true });

          const response = await fetchWithCredentials('/api/cart');

          if (!response.ok) {
            if (response.status === 401) {
              set({ cart: null, initialized: true, loading: false });
              return;
            }
            throw new Error(`Failed to fetch cart: ${response.status}`);
          }

          const cartData: Cart = await handleApiResponse(response);

          if (!cartData || !Array.isArray(cartData.items)) {
            console.warn('Invalid cart data received:', cartData);
            set({ cart: null, initialized: true, loading: false });
            return;
          }

          set({
            cart: cartData,
            initialized: true,
            loading: false,
          });

          const allItemIds = cartData.items.map((item) => item.productId);
          if (allItemIds.length > 0) {
            set((state) => ({
              checkout: {
                ...state.checkout,
                selectedItems: new Set(allItemIds),
                insuranceEnabled: new Set(allItemIds),
              },
            }));
            get().calculateCheckoutTotals();
          }
        } catch (error) {
          console.error('Cart initialization error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          if (!errorMessage.includes('401')) {
            toast.error('Failed to load cart');
          }

          set({
            cart: null,
            initialized: true,
            loading: false,
          });
        }
      },

      refreshCart: async () => {
        try {
          const response = await fetchWithCredentials('/api/cart');

          if (response.ok) {
            const cartData: Cart = await handleApiResponse(response);

            if (!cartData || !Array.isArray(cartData.items)) {
              console.warn('Invalid cart data received during refresh:', cartData);
              return;
            }

            set({ cart: cartData });

            const currentItemIds = new Set(cartData.items.map((item) => item.productId));
            const { checkout } = get();

            const validSelectedItems = new Set(
              Array.from(checkout.selectedItems).filter((id) => currentItemIds.has(id)),
            );
            const validInsuranceItems = new Set(
              Array.from(checkout.insuranceEnabled).filter((id) => currentItemIds.has(id)),
            );

            set((state) => ({
              checkout: {
                ...state.checkout,
                selectedItems: validSelectedItems,
                insuranceEnabled: validInsuranceItems,
              },
            }));

            get().calculateCheckoutTotals();
          } else if (response.status === 401) {
            set({ cart: null, checkout: { ...initialCheckoutState } });
          }
        } catch (error) {
          console.error('Cart refresh error:', error);
        }
      },

      addToCart: async (productId, quantity = 1, selectedVariant = null): Promise<boolean> => {
        const { updatingItems, cart } = get();

        if (updatingItems.has(productId)) return false;

        const existingItem = cart?.items.find((item) => item.productId === productId);
        if (existingItem) {
          return await get().updateQuantity(productId, existingItem.quantity + quantity);
        }

        const tempItem: CartItem = {
          _id: `temp-${productId}-${Date.now()}`,
          productId,
          quantity,
          selectedVariant,
          addedAt: new Date().toISOString(),
          itemTotal: 0,
        };

        const originalCart = cart;
        const optimisticCart: Cart = cart
          ? {
              ...cart,
              items: [...cart.items, tempItem],
              itemCount: cart.itemCount + 1,
              totalQuantity: cart.totalQuantity + quantity,
              updatedAt: new Date().toISOString(),
            }
          : {
              _id: 'temp-cart',
              items: [tempItem],
              itemCount: 1,
              totalQuantity: quantity,
              subtotal: 0,
              estimatedTotal: 0,
              updatedAt: new Date().toISOString(),
            };

        set({
          cart: optimisticCart,
          updatingItems: new Set([...updatingItems, productId]),
        });

        set((state) => ({
          checkout: {
            ...state.checkout,
            selectedItems: new Set([...state.checkout.selectedItems, productId]),
            insuranceEnabled: new Set([...state.checkout.insuranceEnabled, productId]),
          },
        }));

        try {
          const response = await fetchWithCredentials('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity, selectedVariant }),
          });

          if (!response.ok) {
            const data = await handleApiResponse(response).catch(() => ({}));
            throw new Error(data.error || `HTTP Error: ${response.status}`);
          }

          await get().refreshCart();
          toast.success('Added to cart');
          return true;
        } catch (error) {
          console.error('Add to cart error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart';
          toast.error(errorMessage);

          set({ cart: originalCart });
          return false;
        } finally {
          const newUpdating = new Set(get().updatingItems);
          newUpdating.delete(productId);
          set({ updatingItems: newUpdating });
        }
      },

      updateQuantity: async (productId, quantity): Promise<boolean> => {
        const { updatingItems, cart } = get();

        if (updatingItems.has(productId) || !cart) return false;

        const existingItem = cart.items.find((item) => item.productId === productId);
        if (!existingItem) {
          toast.error('Item not found in cart');
          return false;
        }

        const originalCart = cart;
        const quantityDiff = quantity - existingItem.quantity;

        const optimisticCart: Cart = {
          ...cart,
          items:
            quantity === 0
              ? cart.items.filter((item) => item.productId !== productId)
              : cart.items.map((item) =>
                  item.productId === productId ? { ...item, quantity } : item,
                ),
          itemCount: quantity === 0 ? cart.itemCount - 1 : cart.itemCount,
          totalQuantity: Math.max(0, cart.totalQuantity + quantityDiff),
          updatedAt: new Date().toISOString(),
        };

        set({
          cart: optimisticCart,
          updatingItems: new Set([...updatingItems, productId]),
        });

        if (quantity === 0) {
          set((state) => ({
            checkout: {
              ...state.checkout,
              selectedItems: new Set(
                Array.from(state.checkout.selectedItems).filter((id) => id !== productId),
              ),
              insuranceEnabled: new Set(
                Array.from(state.checkout.insuranceEnabled).filter((id) => id !== productId),
              ),
            },
          }));
        }

        try {
          const response = await fetchWithCredentials('/api/cart', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
          });

          if (!response.ok) {
            const data = await handleApiResponse(response).catch(() => ({}));
            throw new Error(data.error || `HTTP Error: ${response.status}`);
          }

          await get().refreshCart();

          if (quantity === 0) {
            toast.success('Item removed from cart');
          } else {
            toast.success('Cart updated');
          }
          return true;
        } catch (error) {
          console.error('Update cart error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to update cart';
          toast.error(errorMessage);

          set({ cart: originalCart });
          return false;
        } finally {
          const newUpdating = new Set(get().updatingItems);
          newUpdating.delete(productId);
          set({ updatingItems: newUpdating });
          get().calculateCheckoutTotals();
        }
      },

      removeFromCart: async (productId): Promise<boolean> => {
        return await get().updateQuantity(productId, 0);
      },

      clearCart: async (): Promise<boolean> => {
        const { cart } = get();
        const originalCart = cart;

        const clearedCart: Cart | null = cart
          ? {
              ...cart,
              items: [],
              itemCount: 0,
              totalQuantity: 0,
              subtotal: 0,
              estimatedTotal: 0,
              updatedAt: new Date().toISOString(),
            }
          : null;

        set({
          cart: clearedCart,
          loading: true,
          checkout: { ...initialCheckoutState },
        });

        try {
          const response = await fetchWithCredentials('/api/cart?clearAll=true', {
            method: 'DELETE',
          });

          if (!response.ok) {
            const data = await handleApiResponse(response).catch(() => ({}));
            throw new Error(data.error || `HTTP Error: ${response.status}`);
          }

          toast.success('Cart cleared');
          return true;
        } catch (error) {
          console.error('Clear cart error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
          toast.error(errorMessage);

          set({ cart: originalCart });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      setSelectedItems: (items: string[]) => {
        set((state) => ({
          checkout: {
            ...state.checkout,
            selectedItems: new Set(items),
            insuranceEnabled: new Set(items),
          },
        }));
        get().calculateCheckoutTotals();
      },

      toggleItemSelection: (productId: string) => {
        set((state) => {
          const newSelectedItems = new Set(state.checkout.selectedItems);
          const newInsuranceEnabled = new Set(state.checkout.insuranceEnabled);

          if (newSelectedItems.has(productId)) {
            newSelectedItems.delete(productId);
            newInsuranceEnabled.delete(productId);
          } else {
            newSelectedItems.add(productId);
            newInsuranceEnabled.add(productId);
          }

          return {
            checkout: {
              ...state.checkout,
              selectedItems: newSelectedItems,
              insuranceEnabled: newInsuranceEnabled,
            },
          };
        });
        get().calculateCheckoutTotals();
      },

      selectAllItems: () => {
        const { cart } = get();
        if (cart?.items) {
          const allItemIds = cart.items.map((item) => item.productId);
          set((state) => ({
            checkout: {
              ...state.checkout,
              selectedItems: new Set(allItemIds),
              insuranceEnabled: new Set(allItemIds),
            },
          }));
          get().calculateCheckoutTotals();
        }
      },

      deselectAllItems: () => {
        set((state) => ({
          checkout: {
            ...state.checkout,
            selectedItems: new Set<string>(),
            insuranceEnabled: new Set<string>(),
          },
        }));
        get().calculateCheckoutTotals();
      },

      toggleInsurance: (productId: string) => {
        const { checkout } = get();
        if (!checkout.selectedItems.has(productId)) return;

        set((state) => {
          const newInsuranceEnabled = new Set(state.checkout.insuranceEnabled);
          if (newInsuranceEnabled.has(productId)) {
            newInsuranceEnabled.delete(productId);
          } else {
            newInsuranceEnabled.add(productId);
          }

          return {
            checkout: {
              ...state.checkout,
              insuranceEnabled: newInsuranceEnabled,
            },
          };
        });
        get().calculateCheckoutTotals();
      },

      calculateCheckoutTotals: () => {
        const { cart, checkout } = get();

        if (!cart?.items || checkout.selectedItems.size === 0) {
          set((state) => ({
            checkout: {
              ...state.checkout,
              totals: { ...initialCheckoutTotals },
            },
          }));
          return;
        }

        const selectedItems = cart.items.filter((item) =>
          checkout.selectedItems.has(item.productId),
        );

        const subtotal = selectedItems.reduce((sum, item) => sum + item.itemTotal, 0);
        const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

        const totalDiscount = selectedItems.reduce((sum, item) => {
          if (item.product?.originalPrice) {
            return sum + (item.product.originalPrice - item.product.finalPrice) * item.quantity;
          }
          return sum;
        }, 0);

        const insuranceCost = selectedItems.reduce((sum, item) => {
          if (checkout.insuranceEnabled.has(item.productId)) {
            return sum + Math.round(item.itemTotal * 0.02);
          }
          return sum;
        }, 0);

        const shippingCost = subtotal >= 10000 ? 0 : 40;
        const totalAmount = subtotal + shippingCost + insuranceCost;

        set((state) => ({
          checkout: {
            ...state.checkout,
            totals: {
              subtotal,
              selectedQuantity,
              insuranceCost,
              shippingCost,
              totalAmount,
              totalDiscount,
            },
          },
        }));
      },

      getCheckoutData: () => {
        const { cart, checkout } = get();

        if (!cart?.items || checkout.selectedItems.size === 0) {
          return null;
        }

        const selectedItems = cart.items.filter((item) =>
          checkout.selectedItems.has(item.productId),
        );

        return {
          selectedItems: Array.from(checkout.selectedItems),
          insuranceEnabled: Array.from(checkout.insuranceEnabled),
          totals: checkout.totals,
          cartItems: selectedItems,
        };
      },

      isInCart: (productId) => {
        const { cart } = get();
        return cart?.items.some((item) => item.productId === productId) ?? false;
      },

      getCartItem: (productId) => {
        const { cart } = get();
        return cart?.items.find((item) => item.productId === productId);
      },

      getCartItemIds: () => {
        const { cart } = get();
        return new Set(cart?.items.map((item) => item.productId) ?? []);
      },

      getTotalItems: () => {
        const { cart } = get();
        return cart?.itemCount ?? 0;
      },

      getTotalQuantity: () => {
        const { cart } = get();
        return cart?.totalQuantity ?? 0;
      },

      getSubtotal: () => {
        const { cart } = get();
        return cart?.subtotal ?? 0;
      },

      isUpdating: (productId) => get().updatingItems.has(productId),

      getSelectedCartItems: () => {
        const { cart, checkout } = get();
        if (!cart?.items || checkout.selectedItems.size === 0) {
          return [];
        }
        return cart.items.filter((item) => checkout.selectedItems.has(item.productId));
      },

      isItemSelected: (productId) => {
        return get().checkout.selectedItems.has(productId);
      },

      hasInsurance: (productId) => {
        return get().checkout.insuranceEnabled.has(productId);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        checkout: {
          selectedItems: Array.from(state.checkout.selectedItems),
          insuranceEnabled: Array.from(state.checkout.insuranceEnabled),
          totals: state.checkout.totals,
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.checkout) {
          const persistedCheckout = state.checkout as any;
          if (Array.isArray(persistedCheckout.selectedItems)) {
            state.checkout.selectedItems = new Set(persistedCheckout.selectedItems);
          }
          if (Array.isArray(persistedCheckout.insuranceEnabled)) {
            state.checkout.insuranceEnabled = new Set(persistedCheckout.insuranceEnabled);
          }
        }
      },
    },
  ),
);
