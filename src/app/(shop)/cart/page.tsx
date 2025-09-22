'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCartStore } from '@/stores/cartStore';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import PriceSummaryCard from '@/components/ui/PriceSummaryCard';
import toast from 'react-hot-toast';
import ErrorMessage from '@/components/ui/ErrorMessage';

const CartPage = () => {
  const { user } = useCurrentUser();
  const router = useRouter();
  const priceCardRef = useRef(null);
  const [showFixedCheckout, setShowFixedCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const { setCheckoutData } = useCheckoutStore();
  const { addToWishlist } = useWishlistStore();

  useEffect(() => {
    if (user?._id) {
      initializeCart();
    }
  }, [user?._id, initializeCart]);

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
  }, [cart]);

  const handleCheckout = () => {
    const selectedItems = getSelectedCartItems();
    if (selectedItems.length === 0) {
      setError('Please select at least one item to proceed to checkout.');
      return;
    }

    const checkoutData = getCheckoutData();
    if (!checkoutData) {
      setError('Unable to prepare checkout data');
      return;
    }

    const checkoutItems = checkoutData.cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      itemTotal: item.itemTotal,
      product: {
        _id: item.product?._id || '',
        name: item.product?.name || '',
        finalPrice: item.product?.finalPrice || 0,
        originalPrice: item.product?.originalPrice,
        discountPercent: item.product?.discountPercent,
        mainImage: item.product?.mainImage,
        isInStock: item.product?.isInStock || false,
      },
    }));

    setCheckoutData({
      selectedItems: checkoutData.selectedItems,
      insuranceEnabled: checkoutData.insuranceEnabled,
      selectedAddressId: '',
      selectedPaymentMethod: '',
      totals: checkoutData.totals,
      cartItems: checkoutItems,
    });

    router.push('/checkout');
  };

  const handleMoveToWishlist = async (productId: any) => {
    try {
      await addToWishlist(productId);
      await removeFromCart(productId);
      toast.success('Item moved to wishlist');
    } catch (error) {
      setError('Failed to move item to wishlist');
    }
  };

  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xs shadow-lg border border-gray-200 w-full max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Welcome Back!</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Sign in to your account to view your saved items and continue shopping.
          </p>
          <button
            onClick={() => router.push('/auth/signin?returnUrl=/cart')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 rounded-xs shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto px-4 py-4 sm:py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-300 rounded w-1/2 sm:w-1/4 mb-4 sm:mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white p-4 sm:p-6 rounded-xs shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full h-48 sm:w-20 sm:h-20 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xs shadow-sm h-fit">
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
      <div className="mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between  mb-4 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-xs transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                Shopping Cart
              </h1>
              {cart && cart.totalQuantity > 0 && (
                <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                  {cart.totalQuantity} items in your cart
                </p>
              )}
            </div>
          </div>
          {error && (
            <ErrorMessage message={error} onClose={() => setError(null)} className="sm:ml-4" />
          )}
          {!isEmpty && (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={
                  checkout.selectedItems.size === cart.items.length
                    ? deselectAllItems
                    : selectAllItems
                }
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors px-2 sm:px-3 py-1 rounded-xs hover:bg-blue-50 whitespace-nowrap"
              >
                {checkout.selectedItems.size === cart.items.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium transition-colors px-2 sm:px-3 py-1 rounded-xs hover:bg-red-50 whitespace-nowrap"
                disabled={loading}
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Empty cart state */}
        {isEmpty ? (
          <div className="text-center bg-white p-8 sm:p-12 rounded-xs shadow-sm border border-gray-200">
            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 sm:w-10 h-8 sm:h-10 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items?.map((item) => {
                const isSelected = isItemSelected(item.productId);
                const hasProtection = hasInsurance(item.productId);
                const itemInsuranceCost = hasProtection ? Math.round(item.itemTotal * 0.02) : 0;

                return (
                  <div
                    key={item._id}
                    className={`bg-white rounded-xs shadow-sm border transition-all duration-200 hover:shadow-md ${
                      isSelected ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
                    } ${updatingItems.has(item.productId) ? 'opacity-50' : ''}`}
                  >
                    <div className="p-4 sm:p-6">
                      {/* Mobile Layout */}
                      <div className="block sm:hidden">
                        {/* Mobile: Full-width image at top */}
                        <div className="relative mb-4">
                          <div className="aspect-video w-full bg-gray-100 rounded-xs overflow-hidden">
                            {item.product?.mainImage?.url ? (
                              <img
                                src={item.product.mainImage.url}
                                alt={item.product.mainImage.alt || item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget
                                    .nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-400" />
                            </div>
                          </div>

                          {/* Selection checkbox - top right of image */}
                          <button
                            onClick={() => toggleItemSelection(item.productId)}
                            disabled={updatingItems.has(item.productId)}
                            className={`absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-white bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Mobile: Product details below image */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg mb-2">
                              {item.product?.name || 'Product'}
                            </h3>
                            {item.selectedVariant && (
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
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

                            {item.product && (
                              <div className="mb-3">
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

                          {/* Price */}
                          <div className="flex items-center flex-wrap gap-2">
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
                          <div
                            className={`border rounded-xs p-3 transition-all duration-200 ${
                              hasProtection
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <button
                                  onClick={() => toggleInsurance(item.productId)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${
                                    hasProtection
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-gray-300 hover:border-blue-400'
                                  }`}
                                >
                                  {hasProtection && <Check className="w-3 h-3" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {hasProtection ? (
                                      <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    ) : (
                                      <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    )}
                                    <div className="font-medium text-sm text-gray-900">
                                      Product Protection Plan
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    2-year damage & theft coverage
                                  </div>
                                  {hasProtection && (
                                    <div className="flex items-center gap-1 text-xs text-blue-700">
                                      <Info className="w-3 h-3 flex-shrink-0" />
                                      <span>
                                        Coverage includes accidental damage, liquid spills & theft
                                        protection
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-semibold text-sm text-gray-900">
                                  +₹
                                  {Math.round(item.itemTotal * 0.02).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                  (2% of item value)
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quantity and Total */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border-2 border-gray-200 rounded-xs overflow-hidden">
                              <button
                                onClick={() =>
                                  updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                                }
                                disabled={
                                  item.quantity <= 1 ||
                                  updatingItems.has(item.productId) ||
                                  !item.product?.isInStock
                                }
                                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <div className="px-3 py-2 border-x-2 border-gray-200 font-semibold min-w-[50px] text-center">
                                {updatingItems.has(item.productId) ? (
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  item.quantity
                                )}
                              </div>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={
                                  item.quantity >= (item.product?.inStockQuantity || 0) ||
                                  updatingItems.has(item.productId) ||
                                  !item.product?.isInStock
                                }
                                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">
                                ₹{(item.itemTotal + itemInsuranceCost).toLocaleString()}
                              </div>
                              {hasProtection && (
                                <div className="text-xs text-blue-600">
                                  (incl. ₹{itemInsuranceCost} protection)
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleMoveToWishlist(item.productId)}
                              disabled={updatingItems.has(item.productId)}
                              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors px-3 py-2 hover:bg-red-50 rounded-xs disabled:opacity-50"
                            >
                              <Heart className="w-4 h-4" />
                              <span className="truncate">Save for Later</span>
                            </button>

                            <button
                              onClick={() => removeFromCart(item.productId)}
                              disabled={updatingItems.has(item.productId)}
                              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors px-3 py-2 hover:bg-red-50 rounded-xs disabled:opacity-50"
                            >
                              {updatingItems.has(item.productId) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              <span className="truncate">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block">
                        <div className="flex gap-3">
                          {/* Selection Checkbox */}
                          <div className="flex flex-col items-center gap-2 pt-1">
                            <button
                              onClick={() => toggleItemSelection(item.productId)}
                              disabled={updatingItems.has(item.productId)}
                              className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          </div>

                          {/* Product Image - Reduced size */}
                          <div className="w-16 h-16 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0">
                            {item.product?.mainImage?.url ? (
                              <img
                                src={item.product.mainImage.url}
                                alt={item.product.mainImage.alt || item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget
                                    .nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-1 text-base truncate">
                                  {item.product?.name || 'Product'}
                                </h3>
                                {item.selectedVariant && (
                                  <div className="flex gap-1 text-xs text-gray-600 mb-1">
                                    {item.selectedVariant.color && (
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded-full">
                                        {item.selectedVariant.color}
                                      </span>
                                    )}
                                    {item.selectedVariant.size && (
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded-full">
                                        {item.selectedVariant.size}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {item.product && (
                                  <div className="mb-1">
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

                            {/* Price - More compact */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {item.product?.originalPrice &&
                                item.product.originalPrice > item.product.finalPrice && (
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{item.product.originalPrice.toLocaleString()}
                                  </span>
                                )}
                              <span className="font-bold text-lg text-gray-900">
                                ₹{item.product?.finalPrice?.toLocaleString() || 0}
                              </span>
                              {item.product?.discountPercent &&
                                item.product.discountPercent > 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                    {Math.round(item.product.discountPercent)}% OFF
                                  </span>
                                )}
                            </div>

                            {/* Compact Protection Plan */}
                            <div
                              className={`border mb-2 rounded-xs p-3 transition-all duration-200 ${
                                hasProtection
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <button
                                    onClick={() => toggleInsurance(item.productId)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${
                                      hasProtection
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                  >
                                    {hasProtection && <Check className="w-3 h-3" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {hasProtection ? (
                                        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      ) : (
                                        <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      )}
                                      <div className="font-medium text-sm text-gray-900">
                                        Product Protection Plan
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">
                                      2-year damage & theft coverage
                                    </div>
                                    {hasProtection && (
                                      <div className="flex items-center gap-1 text-xs text-blue-700">
                                        <Info className="w-3 h-3 flex-shrink-0" />
                                        <span>
                                          Coverage includes accidental damage, liquid spills & theft
                                          protection
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-semibold text-sm text-gray-900">
                                    +₹
                                    {Math.round(item.itemTotal * 0.02).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500 whitespace-nowrap">
                                    (2% of item value)
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls and Total - More compact */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center border-2 border-gray-200 rounded-xs overflow-hidden">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                                  }
                                  disabled={
                                    item.quantity <= 1 ||
                                    updatingItems.has(item.productId) ||
                                    !item.product?.isInStock
                                  }
                                  className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <div className="px-3 py-1.5 border-x-2 border-gray-200 font-semibold min-w-[50px] text-center text-sm">
                                  {updatingItems.has(item.productId) ? (
                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                  ) : (
                                    item.quantity
                                  )}
                                </div>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  disabled={
                                    item.quantity >= (item.product?.inStockQuantity || 0) ||
                                    updatingItems.has(item.productId) ||
                                    !item.product?.isInStock
                                  }
                                  className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-right">
                                <div className="font-bold text-base text-gray-900">
                                  ₹{(item.itemTotal + itemInsuranceCost).toLocaleString()}
                                </div>
                                {hasProtection && (
                                  <div className="text-xs text-blue-600">
                                    (incl. ₹{itemInsuranceCost} protection)
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons - Inline */}
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => handleMoveToWishlist(item.productId)}
                                  disabled={updatingItems.has(item.productId)}
                                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 rounded-xs disabled:opacity-50"
                                >
                                  <Heart className="w-3 h-3" />
                                  <span className="hidden lg:inline">Save</span>
                                </button>

                                <button
                                  onClick={() => removeFromCart(item.productId)}
                                  disabled={updatingItems.has(item.productId)}
                                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 rounded-xs disabled:opacity-50"
                                >
                                  {updatingItems.has(item.productId) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <X className="w-3 h-3" />
                                  )}
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
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
              <div className="lg:sticky lg:top-14" ref={priceCardRef}>
                <PriceSummaryCard
                  mode="cart"
                  onCheckout={handleCheckout}
                  showItemDetails={true}
                  showTrustSignals={true}
                  showContinueShopping={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Checkout Button */}
        {!isEmpty && (
          <div
            className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-2xl transition-all duration-300 ease-in-out z-50 ${
              showFixedCheckout
                ? 'translate-y-0 opacity-100'
                : 'translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={handleCheckout}
              disabled={checkout.selectedItems.size === 0}
              className="w-full h-[60px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 rounded-2xl font-semibold shadow-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-emerald-400/30"
            >
              <div className="flex items-center justify-between h-full">
                <span className="font-bold text-lg tracking-wide">Proceed to Checkout</span>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
                    {checkout.selectedItems.size}
                  </span>
                  <span className="font-bold text-lg tracking-wide">
                    ₹{checkout?.totals?.totalAmount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
