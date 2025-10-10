'use client';

import React from 'react';
import {
  ShoppingBag,
  Shield,
  Truck,
  ArrowRight,
  Check,
  Package,
  CreditCard,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useCheckoutStore } from '@/stores/checkoutStore';

interface PriceSummaryCardProps {
  mode: 'cart' | 'checkout' | 'payment';

  onCheckout?: () => void;
  onProceedToPayment?: () => void;
  onPlaceOrder?: () => void;

  placingOrder?: boolean;

  showItemDetails?: boolean;
  showTrustSignals?: boolean;
  showContinueShopping?: boolean;
}

const PriceSummaryCard: React.FC<PriceSummaryCardProps> = ({
  mode,
  onCheckout,
  onProceedToPayment,
  onPlaceOrder,
  placingOrder = false,
  showItemDetails = true,
  showTrustSignals = true,
  showContinueShopping = true,
}) => {
  const cartStore = useCartStore();
  const checkoutStore = useCheckoutStore();

  const cartData =
    mode === 'cart'
      ? {
          selectedItems: cartStore.getSelectedCartItems(),
          totals: cartStore.checkout.totals,
          selectedAddressId: '',
          selectedPaymentMethod: '',
          hasInsurance: cartStore.hasInsurance,
        }
      : null;

  const checkoutData = mode !== 'cart' ? checkoutStore.getCheckoutData() : null;

  const selectedItems =
    mode === 'cart' ? cartData?.selectedItems || [] : checkoutStore.getSelectedItems();
  const totals = mode === 'cart' ? cartData?.totals : checkoutData?.totals;
  const selectedAddressId = mode === 'cart' ? '' : checkoutData?.selectedAddressId || '';
  const selectedPaymentMethod = mode === 'cart' ? '' : checkoutData?.selectedPaymentMethod || '';

  if (!totals) {
    return (
      <div className="bg-white rounded border border-gray-200 p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">Loading summary...</p>
      </div>
    );
  }

  const originalPriceTotal = selectedItems.reduce((total, item) => {
    const originalPrice = item.product?.originalPrice || item.product?.finalPrice || 0;
    return total + originalPrice * item.quantity;
  }, 0);

  const freeShippingThreshold = 10000;
  const isFreeShipping = totals.subtotal >= freeShippingThreshold;
  const amountForFreeShipping = Math.max(0, freeShippingThreshold - totals.subtotal);

  const getButtonText = () => {
    switch (mode) {
      case 'cart':
        return `Proceed to Checkout (${totals.selectedQuantity})`;
      case 'checkout':
        return 'Proceed to Payment';
      case 'payment':
        return selectedPaymentMethod === 'cod' ? 'PLACE ORDER' : 'PAY NOW';
      default:
        return 'Continue';
    }
  };

  const getButtonAction = () => {
    switch (mode) {
      case 'cart':
        return onCheckout;
      case 'checkout':
        return onProceedToPayment;
      case 'payment':
        return onPlaceOrder;
      default:
        return undefined;
    }
  };

  const isButtonDisabled = () => {
    if (mode === 'payment') {
      return placingOrder || !selectedAddressId || !selectedPaymentMethod;
    }
    if (mode === 'checkout') {
      return !selectedAddressId;
    }
    return totals.selectedQuantity === 0;
  };

  const getDisabledReason = () => {
    if (mode === 'payment' && !selectedPaymentMethod) {
      return 'Select a payment method to continue';
    }
    if ((mode === 'checkout' || mode === 'payment') && !selectedAddressId) {
      return 'Select a delivery address to continue';
    }
    if (totals.selectedQuantity === 0) {
      return 'Select items to continue';
    }
    return '';
  };

  return (
    <div className="bg-white rounded border border-gray-200 sticky top-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          {mode === 'payment' ? 'Order Summary' : 'Price Details'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {totals.selectedQuantity} {totals.selectedQuantity === 1 ? 'item' : 'items'} selected
        </p>
      </div>

      {/* Items Preview */}
      {showItemDetails && selectedItems.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Items in your order</h4>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {selectedItems.slice(0, 3).map((item, index) => (
              <div key={item.productId || index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.product?.mainImage?.url ? (
                    <img
                      src={item.product.mainImage.url}
                      alt={item.product?.name || 'Product'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {item.product?.name || 'Product'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Original price with strikethrough and taxes label */}
                    {item.product?.originalPrice &&
                      item.product.originalPrice > item.product.finalPrice && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 line-through">
                            ₹{item.product.originalPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">(Incl. taxes)</span>
                        </div>
                      )}
                    {/* Final price in bold */}
                    <span className="text-sm font-bold text-gray-900">
                      ₹{item.product?.finalPrice?.toLocaleString() || 0}
                    </span>
                    {/* Discount percentage */}
                    {item.product?.discountPercent && item.product.discountPercent > 0 && (
                      <span className="text-xs bg-green-100 text-green-600 px-1 py-0.5 rounded font-medium">
                        {Math.round(item.product.discountPercent)}% OFF
                      </span>
                    )}
                    <span className="text-xs text-gray-500">× {item.quantity}</span>
                  </div>
                </div>
                {/* Insurance indicator */}
                {mode === 'cart' && cartData?.hasInsurance(item.productId) && (
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                {mode !== 'cart' && checkoutData?.insuranceEnabled?.includes(item.productId) && (
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </div>
            ))}
            {selectedItems.length > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{selectedItems.length - 3} more items
              </p>
            )}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="p-4 space-y-3">
        {/* Subtotal - showing original price total */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Price ({totals.selectedQuantity} {totals.selectedQuantity === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-gray-900">₹{originalPriceTotal.toLocaleString()}</span>
        </div>

        {/* Discount */}
        {totals.totalDiscount > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span className="text-sm">Discount</span>
            <span className="font-medium">-₹{totals.totalDiscount.toLocaleString()}</span>
          </div>
        )}

        {/* Protection Plan */}
        {totals.insuranceCost > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Protection Plan
            </span>
            <span className="font-medium text-gray-900">
              +₹{totals.insuranceCost.toLocaleString()}
            </span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Delivery Charges
          </span>
          <span className={`font-medium ${isFreeShipping ? 'text-green-600' : 'text-gray-900'}`}>
            {isFreeShipping ? 'FREE' : `₹${totals.shippingCost}`}
          </span>
        </div>

        {/* Free Shipping Message */}
        {!isFreeShipping && amountForFreeShipping > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            <strong>Free Shipping Available!</strong>
            <br />
            Add ₹{amountForFreeShipping.toLocaleString()} more to get free delivery
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">
              {mode === 'payment' ? 'Amount Payable' : 'Total Amount'}
            </span>
            <span className="text-lg font-semibold text-gray-900">
              ₹{totals.totalAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes and charges</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={getButtonAction()}
          disabled={isButtonDisabled()}
          className="w-full bg-black text-white py-3 px-4 font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 rounded relative group"
          title={isButtonDisabled() ? getDisabledReason() : ''}
        >
          {placingOrder ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {mode === 'payment' ? (
                selectedPaymentMethod === 'cod' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}

              {getButtonText()}
            </>
          )}

          {/* Tooltip for disabled state */}
          {isButtonDisabled() && !placingOrder && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {getDisabledReason()}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </button>

        {/* Continue Shopping Link */}
        {showContinueShopping && mode !== 'payment' && (
          <Link
            href="/products"
            className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 transition-colors"
          >
            Continue Shopping
          </Link>
        )}
      </div>

      {/* Trust Signals */}
      {showTrustSignals && (
        <div className="p-4 bg-gray-50 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Check className="w-3 h-3 text-green-600" />
            <span>100% Safe & Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Check className="w-3 h-3 text-green-600" />
            <span>Easy 30-day returns & exchanges</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Check className="w-3 h-3 text-green-600" />
            <span>Fast & reliable delivery</span>
          </div>
          {mode === 'payment' && (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Check className="w-3 h-3 text-green-600" />
                <span>Expected delivery within 3-5 business days</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Check className="w-3 h-3 text-green-600" />
                <span>Order will be dispatched within 24 hours</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceSummaryCard;
