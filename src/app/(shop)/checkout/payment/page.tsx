'use client';

import { useEffect, useState, useCallback, useMemo, useRef, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { useAddressStore } from '@/stores/addressStore';
import PriceSummaryCard from '@/components/ui/PriceSummaryCard';
import {
  CreditCard,
  Banknote,
  Shield,
  ArrowLeft,
  Loader2,
  Check,
  ChevronRight,
  MapPin,
  Edit3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithCredentials } from '@/utils/fetchWithCredentials';
import { useCartStore } from '@/stores/cartStore';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { OrderFilters, useOrderStore } from '@/stores/orderStore';

interface PaymentMethod {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  popular?: boolean;
  offers?: string[];
  available: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentPage = () => {
  const [orderError, setOrderError] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const router = useRouter();
  const priceCardRef = useRef(null);
  const [showFixedCheckout, setShowFixedCheckout] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const filters: OrderFilters = { limit: 20, page: 1 };
  const {
    getCheckoutData,
    hasValidCheckout,
    updateSelectedPaymentMethod,
    canPlaceOrder,
    clearCheckout,
    getSelectedItems,
  } = useCheckoutStore();
  const { fetchOrders } = useOrderStore();
  const { removeFromCart } = useCartStore();
  const { addresses } = useAddressStore();

  const checkoutData = getCheckoutData();
  const selectedCartItems = getSelectedItems();
  const selectedAddress = addresses.find((addr) => addr._id === checkoutData?.selectedAddressId);

  const paymentMethods: PaymentMethod[] = useMemo(
    () => [
      {
        id: 'razorpay',
        name: 'Online Payment',
        icon: <CreditCard className="w-5 h-5" />,
        description: 'UPI, Cards, Net Banking & Wallets',
        popular: true,
        offers: ['Instant payment', 'Secure & encrypted'],
        available: true,
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        icon: <Banknote className="w-5 h-5" />,
        description: 'Pay when your order is delivered',
        popular: true,
        offers: ['No advance payment', 'Pay after receiving product'],
        available: true,
      },
    ],
    [],
  );

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFixedCheckout(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '-50px',
      },
    );

    if (priceCardRef.current) {
      observer.observe(priceCardRef.current);
    }

    return () => {
      if (priceCardRef.current) {
        observer.unobserve(priceCardRef.current);
      }
    };
  }, [checkoutData]);

  useEffect(() => {
    if (!hasValidCheckout()) {
      router.replace('/');
      return;
    }
  }, [hasValidCheckout, router]);

  useEffect(() => {
    if (!user?._id) {
      router.push('/auth/signin?returnUrl=/checkout/payment');
      return;
    }

    if (!hasValidCheckout()) {
      return;
    }

    if (checkoutData && !checkoutData.selectedAddressId) {
      setOrderError('Please select a delivery address');
      return;
    }
  }, [user?._id, hasValidCheckout, checkoutData?.selectedAddressId, router]);

  const handlePaymentMethodSelect = useCallback(
    (methodId: string) => {
      updateSelectedPaymentMethod(methodId);
      setOrderError(null);
    },
    [updateSelectedPaymentMethod],
  );

  const removeOrderedItemsFromCart = useCallback(
    async (orderedItems: any[]) => {
      if (!orderedItems || orderedItems.length === 0) {
        return;
      }

      const removePromises = orderedItems.map(async (item) => {
        try {
          const success = await removeFromCart(item.productId);
          if (!success) {
            console.warn(`Failed to remove ${item.productId} from cart`);
          }
          return success;
        } catch (error) {
          console.error(`Error removing ${item.productId} from cart:`, error);
          return false;
        }
      });

      try {
        const results = await Promise.allSettled(removePromises);
        const successful = results.filter(
          (result) => result.status === 'fulfilled' && result.value,
        ).length;
        const failed = results.length - successful;

        if (failed > 0) {
          console.warn(`Failed to remove ${failed} items from cart`);
        }
      } catch (error) {
        console.error('Error in bulk cart item removal:', error);
      }
    },
    [removeFromCart],
  );

  const handleRazorpayPayment = useCallback(async (orderData: any, paymentData: any) => {
    console.log('🔹 Starting Razorpay payment process', { orderData, paymentData });

    return new Promise((resolve, reject) => {
      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'V-Furniture',
        description: `Order ${orderData.orderNumber}`,
        order_id: paymentData.orderId,

        handler: async function (response: any) {
          console.log('✅ Razorpay payment successful', response);

          try {
            const verifyResponse = await fetchWithCredentials('/api/payment', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: paymentData.paymentId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('✅ Payment verification successful', verifyData);
              resolve(verifyData);
            } else {
              const errorData = await verifyResponse.json().catch(() => ({}));
              console.error('❌ Payment verification failed', errorData);
              reject(new Error(errorData.error || 'Payment verification failed'));
            }
          } catch (error) {
            console.error('💥 Error during payment verification', error);
            reject(error);
          }
        },

        prefill: {
          name: paymentData.customer?.name || 'Customer',
          email: paymentData.customer?.email || '',
        },

        theme: {
          color: '#3B82F6',
        },

        modal: {
          ondismiss: function () {
            console.warn('⚠️ Razorpay payment modal dismissed by user');
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded. Please refresh and try again.'));
        return;
      }

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('💥 Error initializing Razorpay', error);
        reject(error);
      }
    });
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!checkoutData || !selectedCartItems.length) {
      setOrderError('No items selected for checkout');
      return;
    }

    if (!checkoutData.selectedAddressId) {
      setOrderError('Please select a delivery address');
      return;
    }

    if (!checkoutData.selectedPaymentMethod) {
      setOrderError('Please select a payment method');
      return;
    }

    setPlacingOrder(true);
    setOrderError(null);

    try {
      console.log('🚀 Starting order placement process');

      // Step 1: Create Order
      const orderPayload = {
        addressId: checkoutData.selectedAddressId,
        paymentMethod: checkoutData.selectedPaymentMethod,
        selectedItems: checkoutData.selectedItems,
        insuranceEnabled: checkoutData.insuranceEnabled,
        totals: checkoutData.totals,
        cartData: selectedCartItems,
      };

      console.log('📝 Creating order with payload:', orderPayload);

      const orderResponse = await fetchWithCredentials('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Order creation failed: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      console.log('✅ Order created successfully:', orderData);

      const orderNumber = orderData.order?.orderNumber;
      if (!orderNumber) {
        throw new Error('Order created but no order number received');
      }

      // Step 2: Handle Payment
      console.log('💳 Processing payment for method:', checkoutData.selectedPaymentMethod);

      const paymentResponse = await fetchWithCredentials('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.order._id,
          paymentMethod: checkoutData.selectedPaymentMethod,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const paymentData = await paymentResponse.json();
      console.log('✅ Payment initialized:', paymentData);

      // Handle different payment methods
      if (checkoutData.selectedPaymentMethod === 'cod') {
        try {
          await removeOrderedItemsFromCart(selectedCartItems);
        } catch (cartError) {
          console.warn('Warning: Failed to remove items from cart:', cartError);
        }

        clearCheckout();
        fetchOrders(filters, true);
        toast.success('Order placed successfully!');
        router.replace(`/order-success?orderNumber=${orderNumber}`);
        return;
      }

      if (checkoutData.selectedPaymentMethod === 'razorpay') {
        if (!window.Razorpay) {
          setOrderError('Payment gateway failed to load. Please refresh and try again.');
          return;
        }

        try {
          const paymentResult = await handleRazorpayPayment(orderData.order, paymentData);
          console.log('✅ Razorpay payment completed:', paymentResult);

          // Payment successful, clean up and redirect
          try {
            await removeOrderedItemsFromCart(selectedCartItems);
          } catch (cartError) {
            console.warn('Warning: Failed to remove items from cart:', cartError);
          }

          clearCheckout();
          fetchOrders(filters, true);
          toast.success('Payment successful! Order confirmed.');
          router.replace(`/order-success?orderNumber=${orderNumber}`);
        } catch (paymentError) {
          console.error('❌ Razorpay payment failed:', paymentError);
          const errorMessage =
            paymentError instanceof Error ? paymentError.message : 'Payment failed';

          if (errorMessage.includes('cancelled')) {
            setOrderError(
              'Payment was cancelled. Your order is saved and you can retry payment from your orders page.',
            );
          } else if (errorMessage.includes('verification failed')) {
            setOrderError(
              'Payment verification failed. If amount was deducted, it will be refunded within 5-7 business days.',
            );
          } else {
            setOrderError(`Payment failed: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      console.error('💥 Order placement failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
      setOrderError(`Order placement failed: ${errorMessage}`);
    } finally {
      setPlacingOrder(false);
    }
  }, [
    checkoutData,
    selectedCartItems,
    router,
    clearCheckout,
    removeOrderedItemsFromCart,
    handleRazorpayPayment,
  ]);

  // Early returns for various states
  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xs shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">Authentication Required</h1>
          <p className="text-gray-600 mb-4 text-sm">Please sign in to continue with payment.</p>
          <button
            onClick={() => router.push('/auth/signin?returnUrl=/checkout/payment')}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded-xs font-medium text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!hasValidCheckout()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xs shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">Invalid Checkout Session</h1>
          <p className="text-gray-600 mb-4 text-sm">Please go back to your cart and try again.</p>
          <button
            onClick={() => router.push('/cart')}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded-xs font-medium text-sm"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (!selectedCartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xs shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">
            No items selected for checkout
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            Please go back to your cart and select items to checkout.
          </p>
          <button
            onClick={() => router.push('/cart')}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded-xs font-medium text-sm"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  if (!selectedAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xs shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">No delivery address selected</h1>
          <p className="text-gray-600 mb-4 text-sm">
            Please go back and select a delivery address.
          </p>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded-xs font-medium text-sm"
          >
            Go to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-xs transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">Payment</h1>
            </div>
          </div>
          {orderError && (
            <div className="w-full sm:w-auto">
              <ErrorMessage message={orderError} onClose={() => setOrderError(null)} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Section - Payment Methods */}
          <div className="lg:col-span-2 space-y-2">
            {/* Address Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xs shadow-sm border border-gray-200"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-gray-100 rounded-xs flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1">Deliver to</h4>
                      <div className="text-sm text-gray-700 space-y-0.5">
                        <p className="font-medium">{selectedAddress.fullName}</p>
                        <p className="break-words">{selectedAddress.addressLine1}</p>
                        {selectedAddress.addressLine2 && (
                          <p className="break-words">{selectedAddress.addressLine2}</p>
                        )}
                        <p className="text-gray-600">
                          {selectedAddress.city}, {selectedAddress.state} -{' '}
                          {selectedAddress.postalCode}
                        </p>
                        <p className="text-gray-600">Phone: {selectedAddress.phone}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/checkout')}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium flex-shrink-0 p-2 hover:bg-blue-50 rounded-xs transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Change</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xs shadow-sm border border-gray-200"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Choose Payment Method</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Secure payment options available
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="relative">
                    <div
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className={`flex items-center p-4 sm:p-6 transition-colors cursor-pointer hover:bg-gray-50 ${
                        checkoutData.selectedPaymentMethod === method.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`p-2 sm:p-3 rounded-xs ${
                            checkoutData.selectedPaymentMethod === method.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {method.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h4 className="font-medium text-sm sm:text-base text-gray-900">
                              {method.name}
                            </h4>
                            {method.popular && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-xs">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">{method.description}</p>
                          {method.offers && (
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mt-2">
                              {method.offers.map((offer, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs text-green-600 flex items-center gap-1"
                                >
                                  <Shield className="w-3 h-3" />
                                  {offer}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {checkoutData.selectedPaymentMethod === method.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Section - Price Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-14"
              ref={priceCardRef}
            >
              <PriceSummaryCard
                mode="payment"
                onPlaceOrder={handlePlaceOrder}
                placingOrder={placingOrder}
                showItemDetails={true}
                showTrustSignals={true}
                showContinueShopping={false}
              />
            </motion.div>
          </div>
        </div>

        {/* Fixed Bottom Place Order Button */}
        <AnimatePresence>
          {showFixedCheckout && checkoutData && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-50 p-4"
            >
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !canPlaceOrder() || !checkoutData.selectedPaymentMethod}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-xs font-semibold shadow-lg hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span className="font-bold text-lg">
                  {placingOrder ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Placing Order...
                    </div>
                  ) : (
                    'Place Order'
                  )}
                </span>
                {!placingOrder && (
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {checkoutData.totals.selectedQuantity}
                    </span>
                    <span className="font-bold text-lg">
                      ₹{checkoutData.totals.totalAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentPage;
