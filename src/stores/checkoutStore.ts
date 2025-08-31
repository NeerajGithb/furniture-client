// Updated stores/checkoutStore.ts - Fixed insurance calculation
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CheckoutTotals {
  subtotal: number;
  selectedQuantity: number;
  insuranceCost: number;
  shippingCost: number;
  totalAmount: number;
  totalDiscount: number;
}

interface CheckoutItem {
  productId: string;
  quantity: number;
  itemTotal: number;
  product: {
    _id: string;
    name: string;
    finalPrice: number;
    originalPrice?: number;
    discountPercent?: number;
    mainImage?: {
      url: string;
      alt?: string;
    };
    isInStock: boolean;
  };
}

interface CheckoutState {
  selectedItems: string[];
  insuranceEnabled: string[];
  selectedAddressId: string;
  selectedPaymentMethod: string;
  totals: CheckoutTotals;
  cartItems: CheckoutItem[];
  timestamp: number;
}

interface CheckoutStore {
  // State
  checkoutData: CheckoutState | null;
  
  // Actions
  setCheckoutData: (data: Omit<CheckoutState, 'timestamp'>) => void;
  updateSelectedAddress: (addressId: string) => void;
  updateSelectedPaymentMethod: (method: string) => void;
  toggleInsurance: (productId: string) => void;
  clearCheckout: () => void;
  
  // Getters
  getCheckoutData: () => CheckoutState | null;
  hasValidCheckout: () => boolean;
  getSelectedItems: () => CheckoutItem[];
  isPaymentMethodSelected: () => boolean;
  isAddressSelected: () => boolean;
  canProceedToPayment: () => boolean;
  canPlaceOrder: () => boolean;
}

const initialTotals: CheckoutTotals = {
  subtotal: 0,
  selectedQuantity: 0,
  insuranceCost: 0,
  shippingCost: 0,
  totalAmount: 0,
  totalDiscount: 0,
};

// Helper function to calculate totals with proper insurance logic
function calculateTotals(
  cartItems: CheckoutItem[],
  selectedItems: string[],
  insuranceEnabled: string[]
): CheckoutTotals {
  const selectedCartItems = cartItems.filter(item =>
    selectedItems.includes(item.productId)
  );

  if (selectedCartItems.length === 0) {
    return { ...initialTotals };
  }

  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const selectedQuantity = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total discount
  const totalDiscount = selectedCartItems.reduce((sum, item) => {
    if (item.product?.originalPrice) {
      return sum + (item.product.originalPrice - item.product.finalPrice) * item.quantity;
    }
    return sum;
  }, 0);

  // Calculate insurance cost - FIXED: Use itemTotal instead of per-unit price
  const insuranceCost = selectedCartItems.reduce((sum, item) => {
    if (insuranceEnabled.includes(item.productId)) {
      return sum + Math.round(item.itemTotal * 0.02); // 2% of total item cost
    }
    return sum;
  }, 0);

  // Calculate shipping cost
  const shippingCost = subtotal >= 10000 ? 0 : 40; // Free shipping over ₹10,000

  const totalAmount = subtotal + shippingCost + insuranceCost;

  return {
    subtotal,
    selectedQuantity,
    insuranceCost,
    shippingCost,
    totalAmount,
    totalDiscount,
  };
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set, get) => ({
      // Initial state
      checkoutData: null,

      // Set complete checkout data (called from cart page or single product)
      setCheckoutData: (data: Omit<CheckoutState, 'timestamp'>) => {
        console.log('Setting checkout data:', {
          selectedItems: data.selectedItems.length,
          totalAmount: data.totals.totalAmount,
          cartItems: data.cartItems.length,
          insuranceEnabled: data.insuranceEnabled.length
        });

        // Recalculate totals to ensure consistency
        const recalculatedTotals = calculateTotals(
          data.cartItems,
          data.selectedItems,
          data.insuranceEnabled
        );

        const checkoutState: CheckoutState = {
          ...data,
          totals: recalculatedTotals, // Use recalculated totals
          timestamp: Date.now(),
        };

        set({ checkoutData: checkoutState });

        // Backup to sessionStorage for recovery
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(checkoutState));
          } catch (error) {
            console.warn('Failed to save to sessionStorage:', error);
          }
        }
      },

      // Update selected delivery address
      updateSelectedAddress: (addressId: string) => {
        const { checkoutData } = get();
        if (!checkoutData) {
          console.warn('No checkout data available to update address');
          return;
        }

        const updatedData = {
          ...checkoutData,
          selectedAddressId: addressId,
          timestamp: Date.now(),
        };

        set({ checkoutData: updatedData });

        // Update sessionStorage
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error);
          }
        }
      },

      // Update selected payment method
      updateSelectedPaymentMethod: (method: string) => {
        const { checkoutData } = get();
        if (!checkoutData) {
          console.warn('No checkout data available to update payment method');
          return;
        }

        const updatedData = {
          ...checkoutData,
          selectedPaymentMethod: method,
          timestamp: Date.now(),
        };

        set({ checkoutData: updatedData });

        // Update sessionStorage
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error);
          }
        }
      },

      // Toggle insurance for a product - FIXED: Proper recalculation
      toggleInsurance: (productId: string) => {
        const { checkoutData } = get();
        if (!checkoutData) {
          console.warn('No checkout data available to toggle insurance');
          return;
        }

        // Check if product is in selected items
        if (!checkoutData.selectedItems.includes(productId)) {
          console.warn(`Product ${productId} not in selected items`);
          return;
        }

        const newInsuranceEnabled = [...checkoutData.insuranceEnabled];
        const index = newInsuranceEnabled.indexOf(productId);

        if (index > -1) {
          // Remove insurance
          newInsuranceEnabled.splice(index, 1);
        } else {
          // Add insurance
          newInsuranceEnabled.push(productId);
        }

        // FIXED: Recalculate totals properly
        const updatedTotals = calculateTotals(
          checkoutData.cartItems,
          checkoutData.selectedItems,
          newInsuranceEnabled
        );

        const updatedData = {
          ...checkoutData,
          insuranceEnabled: newInsuranceEnabled,
          totals: updatedTotals,
          timestamp: Date.now(),
        };

        console.log('Insurance toggled:', {
          productId,
          hasInsurance: newInsuranceEnabled.includes(productId),
          newInsuranceCost: updatedTotals.insuranceCost,
          newTotalAmount: updatedTotals.totalAmount
        });

        set({ checkoutData: updatedData });

        // Update sessionStorage
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error);
          }
        }
      },

      // Clear all checkout data
      clearCheckout: () => {
        console.log('Clearing checkout data');

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('checkoutData');
          } catch (error) {
            console.warn('Failed to clear sessionStorage:', error);
          }
        }

        set({ checkoutData: null });
      },

      // Get current checkout data with recovery
      getCheckoutData: () => {
        const { checkoutData } = get();

        // Try to get from store first
        if (checkoutData) {
          return checkoutData;
        }

        // Fallback to sessionStorage recovery
        if (typeof window !== 'undefined') {
          try {
            const savedData = sessionStorage.getItem('checkoutData');
            if (savedData) {
              const parsedData: CheckoutState = JSON.parse(savedData);
              
              // Validate the data structure
              if (
                parsedData.selectedItems &&
                Array.isArray(parsedData.selectedItems) &&
                parsedData.cartItems &&
                Array.isArray(parsedData.cartItems) &&
                parsedData.totals &&
                typeof parsedData.totals.totalAmount === 'number'
              ) {
                // FIXED: Recalculate totals on recovery to ensure consistency
                const recalculatedTotals = calculateTotals(
                  parsedData.cartItems,
                  parsedData.selectedItems,
                  parsedData.insuranceEnabled || []
                );
                
                const validatedData = {
                  ...parsedData,
                  totals: recalculatedTotals
                };

                set({ checkoutData: validatedData });
                return validatedData;
              }
            }
          } catch (error) {
            console.error('Error recovering checkout data from sessionStorage:', error);
            // Clear invalid data
            sessionStorage.removeItem('checkoutData');
          }
        }

        return null;
      },

      // Check if checkout data is valid for proceeding
      hasValidCheckout: () => {
        const data = get().getCheckoutData();
        return !!(
          data &&
          data.selectedItems.length > 0 &&
          data.cartItems.length > 0 &&
          data.totals.selectedQuantity > 0 &&
          data.totals.totalAmount > 0
        );
      },

      // Get selected items with product details
      getSelectedItems: () => {
        const data = get().getCheckoutData();
        if (!data) return [];

        return data.cartItems.filter(item =>
          data.selectedItems.includes(item.productId)
        );
      },

      // Check if payment method is selected
      isPaymentMethodSelected: () => {
        const data = get().getCheckoutData();
        return !!(data && data.selectedPaymentMethod);
      },

      // Check if address is selected
      isAddressSelected: () => {
        const data = get().getCheckoutData();
        return !!(data && data.selectedAddressId);
      },

      // Check if can proceed to payment page
      canProceedToPayment: () => {
        return get().hasValidCheckout() && get().isAddressSelected();
      },

      // Check if can place order (for payment page)
      canPlaceOrder: () => {
        return (
          get().canProceedToPayment() && 
          get().isPaymentMethodSelected()
        );
      },
    }),
    {
      name: 'checkout-storage',
      partialize: (state) => ({
        checkoutData: state.checkoutData,
      }),
      // Handle data recovery on app start
      onRehydrateStorage: () => (state) => {
        if (state?.checkoutData) {
          console.log('Rehydrated checkout data:', {
            selectedItems: state.checkoutData.selectedItems?.length || 0,
            totalAmount: state.checkoutData.totals?.totalAmount || 0,
            insuranceEnabled: state.checkoutData.insuranceEnabled?.length || 0,
          });
          
          // FIXED: Recalculate totals on rehydration
          if (state.checkoutData.cartItems && state.checkoutData.selectedItems) {
            const recalculatedTotals = calculateTotals(
              state.checkoutData.cartItems,
              state.checkoutData.selectedItems,
              state.checkoutData.insuranceEnabled || []
            );
            
            state.checkoutData.totals = recalculatedTotals;
          }
        }
      },
    }
  )
);