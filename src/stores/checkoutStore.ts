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
  checkoutData: CheckoutState | null;

  setCheckoutData: (data: Omit<CheckoutState, 'timestamp'>) => void;
  updateSelectedAddress: (addressId: string) => void;
  updateSelectedPaymentMethod: (method: string) => void;
  toggleInsurance: (productId: string) => void;
  clearCheckout: () => void;

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

function calculateTotals(
  cartItems: CheckoutItem[],
  selectedItems: string[],
  insuranceEnabled: string[],
): CheckoutTotals {
  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.productId));

  if (selectedCartItems.length === 0) {
    return { ...initialTotals };
  }

  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const selectedQuantity = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalDiscount = selectedCartItems.reduce((sum, item) => {
    if (item.product?.originalPrice) {
      return sum + (item.product.originalPrice - item.product.finalPrice) * item.quantity;
    }
    return sum;
  }, 0);

  const insuranceCost = selectedCartItems.reduce((sum, item) => {
    if (insuranceEnabled.includes(item.productId)) {
      return sum + Math.round(item.itemTotal * 0.02);
    }
    return sum;
  }, 0);

  const shippingCost = subtotal >= 10000 ? 0 : 40;

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
      checkoutData: null,

      setCheckoutData: (data: Omit<CheckoutState, 'timestamp'>) => {
        const recalculatedTotals = calculateTotals(
          data.cartItems,
          data.selectedItems,
          data.insuranceEnabled,
        );

        const checkoutState: CheckoutState = {
          ...data,
          totals: recalculatedTotals,
          timestamp: Date.now(),
        };

        set({ checkoutData: checkoutState });

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(checkoutState));
          } catch (error) {
            console.warn('Failed to save to sessionStorage:', error);
          }
        }
      },

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

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error);
          }
        }
      },

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

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error);
          }
        }
      },

      toggleInsurance: (productId: string) => {
        const { checkoutData } = get();
        if (!checkoutData) {
          console.warn('No checkout data available to toggle insurance');
          return;
        }

        if (!checkoutData.selectedItems.includes(productId)) {
          console.warn(`Product ${productId} not in selected items`);
          return;
        }

        const newInsuranceEnabled = [...checkoutData.insuranceEnabled];
        const index = newInsuranceEnabled.indexOf(productId);

        if (index > -1) {
          newInsuranceEnabled.splice(index, 1);
        } else {
          newInsuranceEnabled.push(productId);
        }

        const updatedTotals = calculateTotals(
          checkoutData.cartItems,
          checkoutData.selectedItems,
          newInsuranceEnabled,
        );

        const updatedData = {
          ...checkoutData,
          insuranceEnabled: newInsuranceEnabled,
          totals: updatedTotals,
          timestamp: Date.now(),
        };

        set({ checkoutData: updatedData });

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('checkoutData', JSON.stringify(updatedData));
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error);
          }
        }
      },

      clearCheckout: () => {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('checkoutData');
          } catch (error) {
            console.warn('Failed to clear sessionStorage:', error);
          }
        }

        set({ checkoutData: null });
      },

      getCheckoutData: () => {
        const { checkoutData } = get();

        if (checkoutData) {
          return checkoutData;
        }

        if (typeof window !== 'undefined') {
          try {
            const savedData = sessionStorage.getItem('checkoutData');
            if (savedData) {
              const parsedData: CheckoutState = JSON.parse(savedData);

              if (
                parsedData.selectedItems &&
                Array.isArray(parsedData.selectedItems) &&
                parsedData.cartItems &&
                Array.isArray(parsedData.cartItems) &&
                parsedData.totals &&
                typeof parsedData.totals.totalAmount === 'number'
              ) {
                const recalculatedTotals = calculateTotals(
                  parsedData.cartItems,
                  parsedData.selectedItems,
                  parsedData.insuranceEnabled || [],
                );

                const validatedData = {
                  ...parsedData,
                  totals: recalculatedTotals,
                };

                set({ checkoutData: validatedData });
                return validatedData;
              }
            }
          } catch (error) {
            console.error('Error recovering checkout data from sessionStorage:', error);

            sessionStorage.removeItem('checkoutData');
          }
        }

        return null;
      },

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

      getSelectedItems: () => {
        const data = get().getCheckoutData();
        if (!data) return [];

        return data.cartItems.filter((item) => data.selectedItems.includes(item.productId));
      },

      isPaymentMethodSelected: () => {
        const data = get().getCheckoutData();
        return !!(data && data.selectedPaymentMethod);
      },

      isAddressSelected: () => {
        const data = get().getCheckoutData();
        return !!(data && data.selectedAddressId);
      },

      canProceedToPayment: () => {
        return get().hasValidCheckout() && get().isAddressSelected();
      },

      canPlaceOrder: () => {
        return get().canProceedToPayment() && get().isPaymentMethodSelected();
      },
    }),
    {
      name: 'checkout-storage',
      partialize: (state) => ({
        checkoutData: state.checkoutData,
      }),

      onRehydrateStorage: () => (state) => {
        if (state?.checkoutData) {
          if (state.checkoutData.cartItems && state.checkoutData.selectedItems) {
            const recalculatedTotals = calculateTotals(
              state.checkoutData.cartItems,
              state.checkoutData.selectedItems,
              state.checkoutData.insuranceEnabled || [],
            );

            state.checkoutData.totals = recalculatedTotals;
          }
        }
      },
    },
  ),
);
