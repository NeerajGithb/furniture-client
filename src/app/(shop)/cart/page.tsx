"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  Heart,
  ArrowLeft,
  Loader2,
  Check,
  Package,
  Shield,
  ShieldCheck,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCartStore } from "@/stores/cartStore";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import PriceSummaryCard from "@/components/ui/PriceSummaryCard";
import toast from "react-hot-toast";

const CartPage = () => {
  const { user } = useCurrentUser();
  const router = useRouter();

  // Cart store
  const {
    cart,
    loading,
    updatingItems,
    checkout,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    isItemSelected,
    hasInsurance,
    toggleInsurance,
    getSelectedCartItems,
    getCheckoutData,
    initializeCart,
  } = useCartStore();

  // Checkout store
  const { setCheckoutData } = useCheckoutStore();

  // Wishlist store
  const { addToWishlist } = useWishlistStore();

  // Initialize cart when user is available
  useEffect(() => {
    if (user?._id) {
      initializeCart();
    }
  }, [user?._id, initializeCart]);

  const handleCheckout = () => {
    const selectedItems = getSelectedCartItems();
    if (selectedItems.length === 0) {
      toast.error("Please select items to checkout");
      return;
    }

    // Prepare checkout data for the checkout store
    const checkoutData = getCheckoutData();
    if (!checkoutData) {
      toast.error("Unable to prepare checkout data");
      return;
    }

    // Transform cart data to checkout format
    const checkoutItems = checkoutData.cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      itemTotal: item.itemTotal,
      product: {
        _id: item.product?._id || "",
        name: item.product?.name || "",
        finalPrice: item.product?.finalPrice || 0,
        originalPrice: item.product?.originalPrice,
        discountPercent: item.product?.discountPercent,
        mainImage: item.product?.mainImage,
        isInStock: item.product?.isInStock || false,
      },
    }));

    // Set checkout data in the checkout store
    setCheckoutData({
      selectedItems: checkoutData.selectedItems,
      insuranceEnabled: checkoutData.insuranceEnabled,
      selectedAddressId: "",
      selectedPaymentMethod: "",
      totals: checkoutData.totals,
      cartItems: checkoutItems,
    });

    // Navigate to checkout
    router.push("/checkout");
  };

  const handleMoveToWishlist = async (productId: string) => {
    try {
      await addToWishlist(productId);
      await removeFromCart(productId);
      toast.success("Item moved to wishlist");
    } catch (error) {
      console.error("Error moving to wishlist:", error);
      toast.error("Failed to move item to wishlist");
    }
  };

  // Authentication check
  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xs shadow-lg border border-gray-200 max-w-md mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Welcome Back!
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            Sign in to your account to view your saved items and continue shopping.
          </p>
          <button
            onClick={() => router.push("/auth/signin?returnUrl=/cart")}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 rounded-xs shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className=" mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-xs shadow-sm">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-xs shadow-sm h-fit">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-300 rounded"></div>
                  <div className="h-10 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-xs transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Shopping Cart
              </h1>
              {cart && cart.totalQuantity > 0 && (
                <p className="text-gray-600 mt-1 text-sm">
                  {cart.totalQuantity} items in your cart
                </p>
              )}
            </div>
          </div>

          {!isEmpty && (
            <div className="flex items-center gap-3">
              <button
                onClick={
                  checkout.selectedItems.size === cart.items.length
                    ? deselectAllItems
                    : selectAllItems
                }
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors px-3 py-1 rounded-xs hover:bg-blue-50"
              >
                {checkout.selectedItems.size === cart.items.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors px-3 py-1 rounded-xs hover:bg-red-50"
                disabled={loading}
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Empty cart state */}
        {isEmpty ? (
          <div className="text-center bg-white p-12 rounded-xs shadow-sm border border-gray-200">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
              Discover amazing products and start building your perfect collection.
            </p>
            <Link
              href="/products"
              className="inline-block text-sm font-medium text-white bg-black px-6 py-3 rounded-xs hover:bg-gray-800 transition-colors duration-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items?.map((item) => {
                const isSelected = isItemSelected(item.productId);
                const hasProtection = hasInsurance(item.productId);
                const itemInsuranceCost = hasProtection
                  ? Math.round(item.itemTotal * 0.02)
                  : 0;

                return (
                  <div
                    key={item._id}
                    className={`bg-white rounded-xs shadow-sm border transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? "border-blue-200 ring-1 ring-blue-100"
                        : "border-gray-200"
                    } ${updatingItems.has(item.productId) ? "opacity-50" : ""}`}
                  >
                    <div className="p-6">
                      <div className="flex gap-4">
                        {/* Selection Checkbox */}
                        <div className="flex flex-col items-center gap-3 pt-1">
                          <button
                            onClick={() => toggleItemSelection(item.productId)}
                            disabled={updatingItems.has(item.productId)}
                            className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0">
                          {item.product?.mainImage?.url ? (
                            <img
                              src={item.product.mainImage.url}
                              alt={
                                item.product.mainImage.alt || item.product.name
                              }
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                                {item.product?.name || "Product"}
                              </h3>
                              {item.selectedVariant && (
                                <div className="flex gap-2 text-xs text-gray-600 mb-2">
                                  {item.selectedVariant.color && (
                                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                                      Color: {item.selectedVariant.color}
                                    </span>
                                  )}
                                  {item.selectedVariant.size && (
                                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                                      Size: {item.selectedVariant.size}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Stock status */}
                              {item.product && (
                                <div className="mb-2">
                                  {item.product.isInStock ? (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ In stock ({item.product.inStockQuantity} available)
                                    </span>
                                  ) : (
                                    <span className="text-xs text-red-600 font-medium">
                                      ⚠ Out of stock
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-4">
                            {item.product?.originalPrice && 
                             item.product.originalPrice > item.product.finalPrice && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{item.product.originalPrice.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-400">(MRP)</span>
                              </div>
                            )}
                            <span className="font-bold text-xl text-gray-900">
                              ₹{item.product?.finalPrice?.toLocaleString() || 0}
                            </span>
                            {item.product?.discountPercent && item.product.discountPercent > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                {Math.round(item.product.discountPercent)}% OFF
                              </span>
                            )}
                          </div>

                          {/* Protection Plan */}
                          <div className="mb-4">
                            <div 
                              className={`border rounded-xs p-3 transition-all duration-200 ${
                                hasProtection 
                                  ? 'border-blue-200 bg-blue-50' 
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleInsurance(item.productId)}
                                    className={`w-4 h-4 rounded-xs border-2 flex items-center justify-center transition-all duration-200 ${
                                      hasProtection
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "border-gray-300 hover:border-blue-400"
                                    }`}
                                  >
                                    {hasProtection && <Check className="w-3 h-3" />}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    {hasProtection ? (
                                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Shield className="w-4 h-4 text-gray-400" />
                                    )}
                                    <div>
                                      <div className="font-medium text-sm text-gray-900">
                                        Product Protection Plan
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        2-year damage & theft coverage
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-sm text-gray-900">
                                    +₹{Math.round(item.itemTotal * 0.02).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    (2% of item value)
                                  </div>
                                </div>
                              </div>
                              {hasProtection && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  <div className="flex items-center gap-1 text-xs text-blue-700">
                                    <Info className="w-3 h-3" />
                                    <span>Coverage includes accidental damage, liquid spills & theft protection</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls and Total */}
                          <div className="flex items-center justify-between mb-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border-2 border-gray-200 rounded-xs overflow-hidden">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                                disabled={
                                  item.quantity <= 1 ||
                                  updatingItems.has(item.productId) ||
                                  !item.product?.isInStock
                                }
                                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <div className="px-4 py-2 border-x-2 border-gray-200 font-semibold min-w-[60px] text-center">
                                {updatingItems.has(item.productId) ? (
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  item.quantity
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                                disabled={
                                  item.quantity >=
                                    (item.product?.inStockQuantity || 0) ||
                                  updatingItems.has(item.productId) ||
                                  !item.product?.isInStock
                                }
                                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">
                                ₹
                                {(
                                  item.itemTotal + itemInsuranceCost
                                ).toLocaleString()}
                              </div>
                              {hasProtection && (
                                <div className="text-xs text-blue-600">
                                  (incl. ₹{itemInsuranceCost} protection)
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleMoveToWishlist(item.productId)}
                              disabled={updatingItems.has(item.productId)}
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors px-3 py-2 hover:bg-red-50 rounded-xs disabled:opacity-50"
                              title="Move to wishlist"
                            >
                              <Heart className="w-4 h-4" />
                              Save for Later
                            </button>
                            
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              disabled={updatingItems.has(item.productId)}
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors px-3 py-2 hover:bg-red-50 rounded-xs disabled:opacity-50"
                              title="Remove item"
                            >
                              {updatingItems.has(item.productId) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) || []}
            </div>

            {/* Price Summary Card */}
            <div className="lg:col-span-1">
              <PriceSummaryCard
                mode="cart"
                onCheckout={handleCheckout}
                showItemDetails={true}
                showTrustSignals={true}
                showContinueShopping={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;