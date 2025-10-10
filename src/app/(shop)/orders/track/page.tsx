'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderStore } from '@/stores/orderStore';
import type { OrderStatus, PaymentStatus, PaymentMethod } from '@/stores/orderStore';

import {
  CheckCircle,
  Package,
  Truck,
  Calendar,
  Home,
  ShoppingBag,
  Loader2,
  MapPin,
  CreditCard,
  Clock,
  Phone,
  Mail,
  Star,
  Share2,
  Download,
  RefreshCw,
  Eye,
  ArrowRight,
  Gift,
  Shield,
  HeadphonesIcon,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Heart,
  ShoppingCart,
  Repeat,
  XCircle,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';

interface StatusStep {
  key: OrderStatus;
  label: string;
  icon: typeof CheckCircle;
  completed: boolean;
  active: boolean;
  description: string;
  estimatedDate?: string;
}

export default function OrderTrackingPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('orderNumber');
  const [copied, setCopied] = useState(false);
  const [fetchOrder, setFetchOrder] = useState(false);
  const { order, fetchOrderByNumber, loading, error, clearError } = useOrderStore();

  useEffect(() => {
    if (!orderNumber) {
      console.error('No order number provided');
      return;
    }

    clearError();
    fetchOrderByNumber(orderNumber).finally(() => {
      setFetchOrder(true);
    });
  }, [orderNumber, fetchOrderByNumber, clearError]);

  useEffect(() => {
    if (!userLoading && !user) {
      return;
    }
  }, [user, userLoading, router, orderNumber]);

  const copyOrderNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order?.orderNumber || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [order?.orderNumber]);

  const isOrderCompleted = useMemo(() => {
    return order?.orderStatus === 'delivered';
  }, [order?.orderStatus]);

  const isOrderCancelled = useMemo(() => {
    return order?.orderStatus === 'cancelled';
  }, [order?.orderStatus]);

  const isOrderReturned = useMemo(() => {
    return order?.orderStatus === ('returned' as OrderStatus);
  }, [order?.orderStatus]);

  const isOrderActive = useMemo(() => {
    const finalStates = ['delivered', 'cancelled', 'returned'];
    return !finalStates.includes(order?.orderStatus || 'pending');
  }, [order?.orderStatus]);

  const statusSteps = useMemo((): StatusStep[] => {
    const steps: Array<{
      key: OrderStatus;
      label: string;
      icon: typeof CheckCircle;
      description: string;
    }> = [
      {
        key: 'pending',
        label: 'Order Placed',
        icon: CheckCircle,
        description: 'Order has been placed',
      },
      {
        key: 'confirmed',
        label: 'Confirmed',
        icon: Package,
        description: 'Order confirmed by seller',
      },
      {
        key: 'processing',
        label: 'Processing',
        icon: Package,
        description: 'Item being prepared',
      },
      {
        key: 'shipped',
        label: 'Shipped',
        icon: Truck,
        description: 'On the way to you',
      },
      {
        key: 'delivered',
        label: 'Delivered',
        icon: CheckCircle,
        description: 'Package delivered',
      },
    ];

    if (isOrderCancelled) {
      const cancelIndex = steps.findIndex((step) => step.key === order?.orderStatus);
      return steps.map((step, idx) => ({
        ...step,
        completed: idx < cancelIndex,
        active: false,
      }));
    }

    const orderStatus: OrderStatus = order?.orderStatus || 'pending';
    const statusOrder: OrderStatus[] = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
    ];
    const currentIndex = statusOrder.indexOf(orderStatus);

    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIndex,
      active: idx === currentIndex && isOrderActive,
    }));
  }, [order?.orderStatus, isOrderCancelled, isOrderActive]);

  const paymentMethodDisplay = useMemo((): string => {
    if (!order?.paymentMethod) return '';

    const methodMap: Record<PaymentMethod, string> = {
      cod: 'Cash on Delivery',
      card: 'Credit/Debit Card',
      upi: 'UPI Payment',
      netbanking: 'Net Banking',
      wallet: 'Digital Wallet',
    };

    return methodMap[order.paymentMethod] || order.paymentMethod;
  }, [order?.paymentMethod]);

  const expectedDeliveryDisplay = useMemo((): string => {
    if (!isOrderActive) return '';

    if (!order?.expectedDeliveryDate) return '5-7 Business Days';

    try {
      return new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return '5-7 Business Days';
    }
  }, [order?.expectedDeliveryDate, isOrderActive]);

  const deliveredDateDisplay = useMemo((): string => {
    if (!isOrderCompleted || !order?.deliveredAt) return '';

    try {
      return new Date(order.deliveredAt).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [order?.deliveredAt, isOrderCompleted]);

  const paymentStatusStyle = useMemo((): string => {
    const status: PaymentStatus = order?.paymentStatus || 'pending';

    const statusStyles: Record<PaymentStatus, string> = {
      paid: 'bg-gray-100 text-gray-700 border-gray-300',
      pending: 'bg-gray-50 text-gray-600 border-gray-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-300',
      refunded: 'bg-gray-100 text-gray-700 border-gray-300',
    };

    return statusStyles[status] || statusStyles.pending;
  }, [order?.paymentStatus]);

  const paymentStatusLabel = useMemo((): string => {
    const status: PaymentStatus = order?.paymentStatus || 'pending';

    const statusLabels: Record<PaymentStatus, string> = {
      paid: 'Payment Successful',
      pending: 'Payment Pending',
      failed: 'Payment Failed',
      refunded: 'Payment Refunded',
    };

    return statusLabels[status] || 'Payment Pending';
  }, [order?.paymentStatus]);

  const orderStatusDisplay = useMemo(() => {
    const status = order?.orderStatus || 'pending';

    const statusConfig = {
      pending: {
        label: 'Order Received',
        color: 'bg-gray-50 text-gray-800 border-gray-200',
        icon: Clock,
      },
      confirmed: {
        label: 'Order Confirmed',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: CheckCircle,
      },
      processing: {
        label: 'Being Prepared',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Package,
      },
      shipped: {
        label: 'Shipped',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Truck,
      },
      delivered: {
        label: 'Delivered',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: CheckCircle,
      },
      cancelled: {
        label: 'Cancelled',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: XCircle,
      },
      returned: {
        label: 'Returned',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: RefreshCw,
      },
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  }, [order?.orderStatus]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6">
        <div className="text-center bg-white p-6 rounded border border-gray-200 shadow-sm max-w-sm w-full">
          <Loader2 className="w-6 h-6 animate-spin text-black mx-auto mb-3" />
          <h2 className="text-base font-semibold text-black mb-2">Loading Order Details</h2>
          <p className="text-sm text-gray-600">
            Please wait while we fetch your order information...
          </p>
        </div>
      </div>
    );
  }

  if (error || (!loading && !order && fetchOrder)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 rounded border border-gray-200 shadow-sm max-w-sm w-full">
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-gray-600" />
          </div>
          <h1 className="text-lg font-bold text-black mb-2">Order Not Found</h1>
          <p className="text-sm text-gray-600 mb-4">
            {error ||
              "We couldn't locate this order. Please check your order number and try again."}
          </p>
          <div className="space-y-2">
            <Link
              href="/orders"
              className="block w-full bg-black text-white py-2 px-4 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              View My Orders
            </Link>
            <Link
              href="/products"
              className="block w-full border border-gray-300 text-gray-700 py-2 px-4 text-sm font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container with proper spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Order Status Header */}
        {isOrderCompleted && (
          <div className="mb-6 bg-white border border-gray-200 rounded p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-black" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Order Delivered Successfully!</h2>
            <p className="text-gray-600 mb-4">Your order was delivered on {deliveredDateDisplay}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <button className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
                <Star className="w-4 h-4" />
                Rate Experience
              </button>
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop Again
              </Link>
            </div>
          </div>
        )}

        {isOrderCancelled && (
          <div className="mb-6 bg-white border border-gray-200 rounded p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-black" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Order Cancelled</h2>
            <p className="text-gray-600 mb-4">
              This order has been cancelled. Refund will be processed within 5-7 business days.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
              <Link
                href="/support"
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <HeadphonesIcon className="w-4 h-4" />
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {isOrderReturned && (
          <div className="mb-6 bg-white border border-gray-200 rounded p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-black" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Order Returned</h2>
            <p className="text-gray-600 mb-4">
              This order has been returned successfully. Refund processing has started.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-black text-white p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold">{order.items?.length || 0}</div>
            <div className="text-xs text-gray-300">Items</div>
          </div>

          <div className="bg-white text-black p-3 text-center border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold">₹{order.totalAmount?.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>

          <div className="bg-white text-black p-3 text-center border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              {isOrderCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : isOrderActive ? (
                <Truck className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </div>
            <div className="text-sm font-bold">
              {isOrderCompleted
                ? 'Delivered'
                : isOrderActive
                ? expectedDeliveryDisplay.split(' ').slice(0, 2).join(' ') || '5-7 Days'
                : orderStatusDisplay.label}
            </div>
            <div className="text-xs text-gray-600">
              {isOrderCompleted ? 'Completed' : isOrderActive ? 'Delivery' : 'Status'}
            </div>
          </div>

          <div className={`p-3 text-center border ${orderStatusDisplay.color}`}>
            <div className="flex items-center justify-center mb-2">
              <orderStatusDisplay.icon className="w-4 h-4" />
            </div>
            <div className="text-sm font-bold">{orderStatusDisplay.label}</div>
            <div className="text-xs opacity-75">Current Status</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Order Progress */}
            {isOrderActive && (
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-bold text-black flex items-center gap-2">
                    <div className="w-5 h-5 bg-black flex items-center justify-center">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    Order Progress
                  </h3>
                </div>
                <div className="p-4">
                  <div className="relative">
                    {statusSteps.map((step, index) => (
                      <div
                        key={step.key}
                        className="flex items-start gap-3 relative pb-4 last:pb-0"
                      >
                        {/* Connecting Line */}
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 w-0.5 h-8 ${
                              step.completed ? 'bg-gray-400' : 'bg-gray-200'
                            }`}
                          />
                        )}

                        {/* Step Icon */}
                        <div
                          className={`w-8 h-8 flex items-center justify-center z-10 transition-all duration-300 ${
                            step.completed
                              ? 'bg-gray-900 text-white'
                              : step.active
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-400 border border-gray-300'
                          }`}
                        >
                          <step.icon className="w-4 h-4" />
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`font-medium text-sm ${
                                step.completed || step.active ? 'text-black' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </h4>
                            {step.active && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium">
                                Current
                              </span>
                            )}
                            {step.completed && !step.active && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium">
                                Done
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs ${
                              step.completed || step.active ? 'text-gray-600' : 'text-gray-400'
                            }`}
                          >
                            {step.description}
                          </p>
                          {step.active && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>In Progress</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-bold text-black flex items-center gap-2">
                    <div className="w-5 h-5 bg-black flex items-center justify-center">
                      <Package className="w-3 h-3 text-white" />
                    </div>
                    Order Summary ({order.items.length}{' '}
                    {order.items.length === 1 ? 'item' : 'items'})
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Payment Information */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-medium text-black">{paymentMethodDisplay}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Payment Status</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium border ${paymentStatusStyle}`}
                      >
                        {paymentStatusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Price Breakdown */}
                  <div className="border-t pt-3 space-y-3">
                    {/* Order Number and Details */}
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Order Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-black">{order.orderNumber}</span>
                          <button
                            onClick={copyOrderNumber}
                            className="p-1 hover:bg-gray-200 transition-colors rounded"
                          >
                            {copied ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Information */}
                    {order.couponCode && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-700">
                            <Gift className="w-4 h-4" />
                            <span className="font-medium">Applied: {order.couponCode}</span>
                          </div>
                          {order.priceBreakdown?.couponDiscount && (
                            <span className="text-green-700 font-medium">
                              -₹
                              {order.priceBreakdown.couponDiscount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Individual Items */}
                    <div>
                      <h5 className="font-medium text-black mb-2 text-sm">
                        Items ({order.items.length}):
                      </h5>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-start text-sm p-2 bg-gray-50 rounded"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-black">{item.name}</div>
                              <div className="text-gray-500 text-xs">Quantity: {item.quantity}</div>
                              {item.selectedVariant?.color && (
                                <div className="text-gray-500 text-xs">
                                  Color: {item.selectedVariant.color}
                                </div>
                              )}
                              {item.selectedVariant?.size && (
                                <div className="text-gray-500 text-xs">
                                  Size: {item.selectedVariant.size}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {item.originalPrice && item.originalPrice > item.price && (
                                <div className="text-xs text-gray-400 line-through">
                                  ₹{(item.originalPrice * item.quantity).toLocaleString()}
                                </div>
                              )}
                              <div className="font-medium">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </div>
                              {item.insuranceCost && item.insuranceCost > 0 && (
                                <div className="text-xs text-blue-600 flex items-center gap-1">
                                  <Shield className="w-3 h-3" />₹
                                  {(item.insuranceCost * item.quantity).toLocaleString()} protection
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Calculation */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items Subtotal</span>
                        <span className="font-medium">
                          ₹{order.priceBreakdown.originalSubtotal.toLocaleString()}
                        </span>
                      </div>

                      {order.priceBreakdown.itemDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Item Discounts</span>
                          <span>-₹{order.priceBreakdown.itemDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      {order.priceBreakdown.couponDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Coupon Discount</span>
                          <span>-₹{order.priceBreakdown.couponDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal After Discounts</span>
                        <span className="font-medium">
                          ₹{order.priceBreakdown.finalSubtotal.toLocaleString()}
                        </span>
                      </div>

                      {order.priceBreakdown.totalInsurance > 0 && (
                        <div className="flex justify-between text-sm text-blue-600">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Protection Plan
                          </span>
                          <span>₹{order.priceBreakdown.totalInsurance.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">
                          {order.priceBreakdown.shippingCost === 0
                            ? 'FREE'
                            : `₹${order.priceBreakdown.shippingCost.toLocaleString()}`}
                        </span>
                      </div>

                      {order.priceBreakdown.tax > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">
                            ₹{order.priceBreakdown.tax.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {order.priceBreakdown.totalSavings > 0 && (
                        <div className="flex justify-between text-sm bg-green-50 p-2 border border-green-200 rounded">
                          <span className="text-green-700 font-medium">Total Savings</span>
                          <span className="text-green-700 font-bold">
                            ₹{order.priceBreakdown.totalSavings.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Final Total */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-black">Total Amount</span>
                        <span className="text-lg font-bold text-black">
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Address and Delivery Info */}
          <div className="space-y-4">
            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-bold text-black flex items-center gap-2">
                    <div className="w-5 h-5 bg-black flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    {isOrderCompleted ? 'Delivered To' : 'Delivery Address'}
                  </h4>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium text-black">{order.shippingAddress.fullName}</div>
                    <div className="text-sm text-gray-600">
                      <div>{order.shippingAddress.addressLine1}</div>
                      {order.shippingAddress.addressLine2 && (
                        <div>{order.shippingAddress.addressLine2}</div>
                      )}
                      <div className="mt-1">
                        {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                        {order.shippingAddress.postalCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Phone className="w-3 h-3 text-gray-600" />
                      <span className="text-sm font-medium text-black">
                        {order.shippingAddress.phone}
                      </span>
                    </div>
                    {isOrderCompleted && (
                      <div className="mt-3 p-2 bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            Successfully delivered on {deliveredDateDisplay}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Expected Delivery */}
            {isOrderActive && expectedDeliveryDisplay && (
              <div className="bg-black text-white">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-white bg-opacity-20 flex items-center justify-center">
                      <Truck className="w-3 h-3" />
                    </div>
                    <h4 className="text-base font-bold">Expected Delivery</h4>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">{expectedDeliveryDisplay}</div>
                    <div className="text-xs text-gray-300">
                      You'll receive SMS and email updates
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Information */}
            {isOrderActive && order.trackingNumber && (
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-bold text-black flex items-center gap-2">
                    <div className="w-5 h-5 bg-black flex items-center justify-center">
                      <Truck className="w-3 h-3 text-white" />
                    </div>
                    Track Package
                  </h4>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tracking Number</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-50 px-2 py-2 border font-mono text-xs">
                          {order.trackingNumber}
                        </code>
                        <button
                          onClick={copyOrderNumber}
                          className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-black" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    {order.carrier && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Carrier</label>
                        <div className="font-medium text-sm">{order.carrier}</div>
                      </div>
                    )}
                    <button className="w-full bg-black text-white py-2 px-4 text-sm font-medium hover:bg-gray-800 transition-colors">
                      Track Package
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-base font-bold text-black">Quick Actions</h4>
              </div>
              <div className="p-4 space-y-3">
                {/* Show different actions based on order status */}
                {isOrderCompleted ? (
                  <>
                    <button className="flex items-center justify-between w-full p-3 bg-green-50 hover:bg-green-100 transition-colors group border border-green-200">
                      <div className="flex items-center gap-3">
                        <Star className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">Rate & Review Products</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                    </button>
                    <Link
                      href="/products"
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Repeat className="w-4 h-4 text-gray-700" />
                        <span className="font-medium text-gray-700">Buy Similar Items</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-700" />
                        <span className="font-medium text-gray-700">View All Orders</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </Link>
                  </>
                ) : isOrderCancelled || isOrderReturned ? (
                  <>
                    <Link
                      href="/products"
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-gray-700" />
                        <span className="font-medium text-gray-700">Continue Shopping</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <HeadphonesIcon className="w-4 h-4 text-gray-700" />
                        <span className="font-medium text-gray-700">Contact Support</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/orders"
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-700" />
                        <span className="font-medium text-gray-700">Track All Orders</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </Link>
                    {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                      <button
                        onClick={() => router.push(`/orders`)}
                        className="flex items-center justify-between w-full p-3 bg-red-50 hover:bg-red-100 transition-colors group border border-red-200"
                      >
                        <div className="flex items-center gap-3">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-700">Cancel Order</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        {isOrderCompleted ? (
          <div className="mt-8 bg-green-50 border border-green-200 shadow-sm">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  Thank You for Your Purchase!
                </h3>
                <p className="text-green-700 max-w-2xl mx-auto">
                  We hope you love your new furniture! Share your experience with others and
                  discover more amazing products.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 font-semibold hover:bg-green-700 transition-all duration-200">
                  <Star className="w-4 h-4" />
                  Rate Your Experience
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/products"
                  className="flex items-center gap-2 bg-white border-2 border-green-300 text-green-700 px-6 py-3 font-semibold hover:border-green-400 hover:bg-green-50 transition-all duration-200"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Shop Similar Items
                </Link>

                <Link
                  href="/"
                  className="flex items-center gap-2 text-green-600 hover:text-green-800 px-4 py-2 font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        ) : isOrderCancelled || isOrderReturned ? (
          <div className="mt-8 bg-gray-50 border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  We're Sorry This Didn't Work Out
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {isOrderCancelled
                    ? 'Your order has been cancelled and refund is being processed. Explore our collection for your next purchase.'
                    : "Your return has been processed. Thank you for giving us a try. We'd love to serve you better next time."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  href="/products"
                  className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-all duration-200"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Browse Products
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/support"
                  className="flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  <HeadphonesIcon className="w-4 h-4" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-white border border-gray-300 shadow-sm">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">What's Next?</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Your order is being processed. Here's what happens next and what you can do while
                  you wait.
                </p>
              </div>

              {/* Process Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div
                    className={`w-10 h-10 mx-auto mb-2 ${
                      statusSteps[0]?.completed ? 'bg-green-600' : 'bg-black'
                    } flex items-center justify-center shadow-sm`}
                  >
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Order Confirmed</h4>
                  <p className="text-sm text-gray-600">
                    Your order has been received and confirmed
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className={`w-10 h-10 mx-auto mb-2 ${
                      statusSteps[2]?.completed
                        ? 'bg-green-600'
                        : statusSteps[2]?.active
                        ? 'bg-black'
                        : 'bg-gray-300'
                    } flex items-center justify-center shadow-sm`}
                  >
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Items Prepared</h4>
                  <p className="text-sm text-gray-600">We're carefully packaging your items</p>
                </div>

                <div className="text-center">
                  <div
                    className={`w-10 h-10 mx-auto mb-2 ${
                      statusSteps[3]?.completed
                        ? 'bg-green-600'
                        : statusSteps[3]?.active
                        ? 'bg-black'
                        : 'bg-gray-300'
                    } flex items-center justify-center shadow-sm`}
                  >
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Out for Delivery</h4>
                  <p className="text-sm text-gray-600">Your package is on its way to you</p>
                </div>

                <div className="text-center">
                  <div
                    className={`w-10 h-10 mx-auto mb-2 ${
                      statusSteps[4]?.completed ? 'bg-green-600' : 'bg-gray-300'
                    } flex items-center justify-center shadow-sm`}
                  >
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Delivered</h4>
                  <p className="text-sm text-gray-600">Package delivered safely to your address</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  href="/orders"
                  className="flex items-center gap-2 bg-black text-white px-5 py-3 font-semibold hover:bg-gray-900 transition-all duration-200"
                >
                  <Package className="w-4 h-4" />
                  View Orders
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/products"
                  className="flex items-center gap-2 bg-white border border-gray-400 text-gray-800 px-5 py-3 font-semibold hover:border-gray-500 hover:bg-gray-50 transition-all duration-200"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Continue Shopping
                </Link>

                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
