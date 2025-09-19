// PaymentPage.tsx - Fixed version with responsive design and fixed bottom button

"use client";

import { useEffect, useState, useCallback, useMemo, useRef, JSX } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { useAddressStore } from "@/stores/addressStore";
import PriceSummaryCard from "@/components/ui/PriceSummaryCard";
import {
  Smartphone,
  Banknote,
  CreditCard,
  Building2,
  Shield,
  ArrowLeft,
  Loader2,
  Check,
  ChevronRight,
  MapPin,
  Edit3,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithCredentials } from "@/utils/fetchWithCredentials";
import { useCartStore } from "@/stores/cartStore";

interface PaymentMethod {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  popular?: boolean;
  offers?: string[];
  available: boolean;
}

const PaymentPage = () => {
  const { user } = useCurrentUser();
  const router = useRouter();
  const priceCardRef = useRef(null);
  const [showFixedCheckout, setShowFixedCheckout] = useState(false);

  // Checkout store
  const {
    getCheckoutData,
    hasValidCheckout,
    updateSelectedPaymentMethod,
    canPlaceOrder,
    clearCheckout,
    getSelectedItems,
  } = useCheckoutStore();

  //cart store
  const { removeFromCart } = useCartStore();
  
  // Address store
  const { addresses } = useAddressStore();

  // Local state
  const [showUPIForm, setShowUPIForm] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Get checkout data
  const checkoutData = getCheckoutData();
  const selectedCartItems = getSelectedItems();
  const selectedAddress = addresses.find(
    (addr) => addr._id === checkoutData?.selectedAddressId
  );

  // Payment methods configuration
  const paymentMethods: PaymentMethod[] = useMemo(
    () => [
      {
        id: "upi",
        name: "UPI",
        icon: <Smartphone className="w-5 h-5" />,
        description: "Pay using your UPI ID",
        popular: true,
        offers: ["Get 5% cashback", "Instant payment"],
        available: false, // Disabled for now
      },
      {
        id: "cards",
        name: "Credit/Debit Cards",
        icon: <CreditCard className="w-5 h-5" />,
        description: "Visa, Mastercard, Rupay & more",
        offers: ["EMI available", "2% cashback on select cards"],
        available: false, // Disabled for now
      },
      {
        id: "netbanking",
        name: "Net Banking",
        icon: <Building2 className="w-5 h-5" />,
        description: "All major banks supported",
        available: false, // Disabled for now
      },
      {
        id: "cod",
        name: "Cash on Delivery",
        icon: <Banknote className="w-5 h-5" />,
        description: "Pay when your order is delivered",
        popular: true,
        offers: ["No advance payment", "Pay after receiving product"],
        available: true, // Only COD is available
      },
    ],
    []
  );

  // Intersection Observer for checkout button visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFixedCheckout(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "-50px",
      }
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

  // FIXED: Improved redirect checks with better error handling
  useEffect(() => {
    if (!user?._id) {
      router.push("/auth/signin?returnUrl=/checkout/payment");
      return;
    }

    // Only redirect if we have no valid checkout data
    if (!hasValidCheckout()) {
      
      return;
    }

    // Only redirect if we have checkout data but no address selected
    if (checkoutData && !checkoutData.selectedAddressId) {
      
      toast.error("Please select a delivery address");
      return;
    }
  }, [user?._id, hasValidCheckout, checkoutData?.selectedAddressId, router]);

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback(
    (methodId: string) => {
      const method = paymentMethods.find((m) => m.id === methodId);
      if (!method?.available) {
        toast.error(`${method?.name || "This payment method"} is coming soon!`);
        return;
      }

      updateSelectedPaymentMethod(methodId);
      setShowUPIForm(methodId === "upi");
      if (methodId !== "upi") setUpiId("");
    },
    [updateSelectedPaymentMethod, paymentMethods]
  );

  // FIXED: Remove only ordered items from cart
  const removeOrderedItemsFromCart = useCallback(async (orderedItems: any[]) => {
    if (!orderedItems || orderedItems.length === 0) {
      
      return;
    }

    console.log(`Removing ${orderedItems.length} ordered items from cart:`, 
      orderedItems.map(item => ({ 
        productId: item.productId, 
        quantity: item.quantity 
      }))
    );

    const removePromises = orderedItems.map(async (item) => {
      try {
        
        const success = await removeFromCart(item.productId);
        if (success) {
          
        } else {
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
      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      if (successful > 0) {
        
      }
      if (failed > 0) {
        console.warn(`Failed to remove ${failed} items from cart`);
      }
    } catch (error) {
      console.error("Error in bulk cart item removal:", error);
      throw error;
    }
  }, [removeFromCart]);

  // FIXED: Improved order placement with proper cart item removal
  const handlePlaceOrder = useCallback(async () => {
    if (!checkoutData || !selectedCartItems.length) {
      toast.error("No items selected for checkout");
      return;
    }

    if (!checkoutData.selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!checkoutData.selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Validate UPI ID if UPI is selected
    if (checkoutData.selectedPaymentMethod === "upi") {
      if (!upiId.trim()) {
        toast.error("Please enter your UPI ID");
        return;
      }
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!upiRegex.test(upiId)) {
        toast.error("Please enter a valid UPI ID");
        return;
      }
    }

    setPlacingOrder(true);

    try {
      // Prepare order payload
      const orderPayload = {
        addressId: checkoutData.selectedAddressId,
        paymentMethod: checkoutData.selectedPaymentMethod,
        selectedItems: checkoutData.selectedItems,
        insuranceEnabled: checkoutData.insuranceEnabled,
        totals: checkoutData.totals,
        cartData: selectedCartItems,
        upiId: checkoutData.selectedPaymentMethod === "upi" ? upiId : undefined,
      };

      console.log("Placing order with payload:", {
        ...orderPayload,
        cartData: `${orderPayload.cartData.length} items`,
      });

      // Create order
      const orderResponse = await fetchWithCredentials("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Order creation failed: ${orderResponse.status}`
        );
      }

      const orderData = await orderResponse.json();
      const orderNumber = orderData.order?.orderNumber;

      if (!orderNumber) {
        throw new Error("Order created but no order number received");
      }

      

      // Handle Cash on Delivery vs Other Payment Methods
      if (checkoutData.selectedPaymentMethod === "cod") {
        // For COD, order is complete - no payment processing needed
        
        try {
          // FIXED: Remove only the items that were ordered from cart
          await removeOrderedItemsFromCart(selectedCartItems);
          
        } catch (cartError) {
          console.error("Error removing ordered items from cart:", cartError);
          // Don't block order success if cart update fails
          toast.error("Order placed but failed to update cart. Please refresh your cart.");
        }
        
        // Clear checkout data
        
        clearCheckout();
        

        // Show success message
        toast.success("Order placed successfully!");
        
        // Navigate to success page
        
        router.push(`/order-success?orderNumber=${orderNumber}`);
        return;
        
      } else {
        // For other payment methods, initiate payment processing
        try {
          

          const paymentResponse = await fetchWithCredentials("/api/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderData.order._id,
              paymentMethod: checkoutData.selectedPaymentMethod,
              upiId:
                checkoutData.selectedPaymentMethod === "upi"
                  ? upiId
                  : undefined,
            }),
          });

          if (paymentResponse.ok) {
            toast.success("Processing payment...");

            // Simulate payment processing time
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // FIXED: Remove only ordered items from cart
            try {
              await removeOrderedItemsFromCart(selectedCartItems);
              
            } catch (cartError) {
              console.error("Error removing ordered items from cart after payment:", cartError);
              toast.error("Payment successful but failed to update cart. Please refresh your cart.");
            }
            
            // Clear checkout data
            clearCheckout();

            toast.success("Payment successful! Order placed.");
            router.push(`/order-success?orderNumber=${orderNumber}`);
          } else {
            const errorData = await paymentResponse.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Payment failed: ${paymentResponse.status}`
            );
          }
        } catch (paymentError) {
          console.error("Payment error:", paymentError);
          throw paymentError;
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to place order";
      console.error("Order placement error:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setPlacingOrder(false);
    }
  }, [checkoutData, selectedCartItems, upiId, router, clearCheckout, removeOrderedItemsFromCart]);

  // FIXED: Better loading state handling
  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xs shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            Please sign in to continue with payment.
          </p>
          <button
            onClick={() => router.push("/auth/signin?returnUrl=/checkout/payment")}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded-xs font-medium text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Loading state
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

  // No items selected
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
            onClick={() => router.push("/cart")}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded-xs font-medium text-sm"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  // No address selected
  if (!selectedAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xs shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">
            No delivery address selected
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            Please go back and select a delivery address.
          </p>
          <button
            onClick={() => router.push("/checkout")}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4  gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-xs transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                Payment
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Section - Payment Methods */}
          <div className="lg:col-span-2 space-y-2 ">
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
                      <h4 className="font-medium text-gray-900 mb-1">
                        Deliver to
                      </h4>
                      <div className="text-sm text-gray-700 space-y-0.5">
                        <p className="font-medium">{selectedAddress.fullName}</p>
                        <p className="break-words">{selectedAddress.addressLine1}</p>
                        {selectedAddress.addressLine2 && (
                          <p className="break-words">{selectedAddress.addressLine2}</p>
                        )}
                        <p className="text-gray-600">
                          {selectedAddress.city}, {selectedAddress.state} -{" "}
                          {selectedAddress.postalCode}
                        </p>
                        <p className="text-gray-600">
                          Phone: {selectedAddress.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/checkout")}
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
                <h3 className="font-medium text-gray-900">
                  Choose Payment Method
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Currently, only Cash on Delivery is available. Online payments
                  coming soon!
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="relative">
                    <div
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className={`flex items-center p-2 sm:p-4 transition-colors ${
                        method.available
                          ? `cursor-pointer hover:bg-gray-50 ${
                              checkoutData.selectedPaymentMethod === method.id
                                ? "bg-blue-50"
                                : ""
                            }`
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`p-2 sm:p-3 rounded-xs ${
                            checkoutData.selectedPaymentMethod === method.id &&
                            method.available
                              ? "bg-blue-600 text-white"
                              : method.available
                              ? "bg-gray-100 text-gray-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {method.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h4
                              className={`font-medium text-sm sm:text-base ${
                                method.available
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              {method.name}
                            </h4>
                            {method.popular && method.available && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-xs">
                                Popular
                              </span>
                            )}
                            {!method.available && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-xs">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs sm:text-sm ${
                              method.available
                                ? "text-gray-600"
                                : "text-gray-500"
                            }`}
                          >
                            {method.description}
                          </p>
                          {/* {method.offers && method.available && (
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mt-1">
                              {method.offers.map((offer, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs text-green-600"
                                >
                                  • {offer}
                                </span>
                              ))}
                            </div>
                          )} */}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {checkoutData.selectedPaymentMethod === method.id &&
                          method.available && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        {method.available && (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* UPI Form - Only show if UPI is selected and available */}
                    <AnimatePresence>
                      {method.id === "upi" &&
                        checkoutData.selectedPaymentMethod === "upi" &&
                        method.available && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gray-200 bg-gray-50"
                          >
                            <div className="p-4 sm:p-6">
                              <div className="max-w-md">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Enter UPI ID
                                </label>
                                <input
                                  type="text"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                  placeholder="example@upi"
                                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                  Enter your UPI ID (e.g., name@paytm,
                                  name@googlepay)
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
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
        {checkoutData && (
          <div
            className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-2xl transition-all duration-300 ease-in-out z-50 ${
              showFixedCheckout
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || !canPlaceOrder() || !checkoutData.selectedPaymentMethod}
              className="w-full h-[60px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 rounded-2xl font-semibold shadow-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-emerald-400/30"
            >
              <div className="flex items-center justify-between h-full">
                <span className="font-bold text-lg tracking-wide">
                  {placingOrder ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Placing Order...
                    </div>
                  ) : (
                    "Place Order"
                  )}
                </span>
                {!placingOrder && (
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
                      {checkoutData.totals.selectedQuantity}
                    </span>
                    <span className="font-bold text-lg tracking-wide">
                      ₹{checkoutData.totals.totalAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;