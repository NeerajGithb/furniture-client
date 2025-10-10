'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderStore, type OrderStatus } from '@/stores/orderStore';

import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  XCircle,
  Gift,
  Star,
  MessageCircle,
  RefreshCw,
  Heart,
  Banknote,
  Shield,
} from 'lucide-react';

import ConfettiEffect from '@/components/ui/ConfettiEffect';

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

const LABELS: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  processing: 'Preparing Your Order',
  shipped: 'Out for Delivery',
  delivered: 'Successfully Delivered',
  cancelled: 'Order Cancelled',
  returned: 'Order Returned',
};

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    headerColor: string;
    icon: React.ComponentType<any>;
    title: string;
    subtitle: string;
    message: string;
    actionText: string;
    showConfetti: boolean;
  }
> = {
  pending: {
    headerColor: 'bg-gradient-to-r from-blue-600 to-blue-700',
    icon: Clock,
    title: 'Thank You for Your Order!',
    subtitle: 'Your order has been received and is being reviewed',
    message:
      "We've received your order and our team is verifying the details. You'll receive a confirmation email shortly with your order summary and tracking information.",
    actionText: 'Order confirmation typically takes 30 minutes to 2 hours',
    showConfetti: true,
  },
  confirmed: {
    headerColor: 'bg-gradient-to-r from-green-600 to-green-700',
    icon: CheckCircle,
    title: 'Order Confirmed Successfully!',
    subtitle: 'Your order is confirmed and ready for processing',
    message:
      'Great news! Your order has been confirmed and added to our fulfillment queue. Our team will now begin preparing your items for shipment.',
    actionText: 'Your items will be packed and ready to ship within 1-2 business days',
    showConfetti: true,
  },
  processing: {
    headerColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
    icon: Package,
    title: "We're Preparing Your Order",
    subtitle: 'Your items are being carefully packed',
    message:
      'Our fulfillment team is currently picking, packing, and quality-checking your order. We ensure each item is properly secured for safe delivery.',
    actionText: 'Expected to ship within the next 24-48 hours',
    showConfetti: false,
  },
  shipped: {
    headerColor: 'bg-gradient-to-r from-purple-600 to-purple-700',
    icon: Truck,
    title: 'Your Order is On Its Way!',
    subtitle: 'Package shipped and in transit',
    message:
      'Excellent! Your order has been dispatched and is currently being delivered to your address. You can track your package in real-time using the tracking information provided.',
    actionText: 'Use the tracking link below to monitor your delivery progress',
    showConfetti: true,
  },
  delivered: {
    headerColor: 'bg-gradient-to-r from-green-700 to-green-800',
    icon: Gift,
    title: 'Order Delivered Successfully!',
    subtitle: 'Your package has been delivered',
    message:
      "Wonderful! Your order has been successfully delivered to your address. We hope you're completely satisfied with your purchase and our service.",
    actionText: 'Please take a moment to rate your shopping experience with us',
    showConfetti: true,
  },
  cancelled: {
    headerColor: 'bg-gradient-to-r from-red-600 to-red-700',
    icon: XCircle,
    title: 'Order Cancelled',
    subtitle: 'This order has been cancelled',
    message:
      'Your order has been cancelled as requested. If you paid online, your refund will be processed automatically. For Cash on Delivery orders, no payment was collected.',
    actionText: 'Online payments: Refund processed within 3-5 business days',
    showConfetti: false,
  },
  returned: {
    headerColor: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
    icon: RefreshCw,
    title: 'Return Processed',
    subtitle: 'Your return has been received and processed',
    message:
      "We've received your returned item(s) and processed your return request. The refund will be initiated once our quality team completes the inspection.",
    actionText: 'Refund will be credited to your original payment method within 5-7 business days',
    showConfetti: false,
  },
};

const getReadablePaymentMethod = (method: string) => {
  const methods: Record<string, string> = {
    cod: 'Cash on Delivery',
    card: 'Credit/Debit Card',
    upi: 'UPI Payment',
    netbanking: 'Net Banking',
    wallet: 'Digital Wallet',
    emi: 'EMI Payment',
  };
  return methods[method.toLowerCase()] || method;
};

const getReadablePaymentStatus = (status: string, paymentMethod: string) => {
  if (paymentMethod.toLowerCase() === 'cod') {
    return 'Cash on Delivery';
  }

  const statuses: Record<string, string> = {
    paid: 'Payment Completed',
    pending: 'Payment Pending',
    failed: 'Payment Failed',
    refunded: 'Payment Refunded',
  };
  return statuses[status.toLowerCase()] || status;
};

const Card = ({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white border border-gray-200 rounded-xs shadow-sm overflow-hidden ${className}`}
  >
    <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 border-b border-gray-200">
      {icon}
      <span className="text-gray-800 font-semibold text-sm">{title}</span>
    </div>
    <div className="p-4 text-sm space-y-3">{children}</div>
  </div>
);

const StatusActions = ({
  status,
  orderNumber,
  router,
}: {
  status: OrderStatus;
  orderNumber: string;
  router: any;
}) => {
  const baseActions = [
    <button
      key="track"
      onClick={() => router.push(`/orders/track?orderNumber=${orderNumber}`)}
      className="bg-white text-gray-700 px-4 py-2 text-sm rounded-xs font-medium border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
    >
      View Full Details
    </button>,
  ];

  switch (status) {
    case 'pending':
    case 'confirmed':
      return [
        ...baseActions,
        <button
          key="shop"
          onClick={() => router.push('/shop')}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded-xs font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          Continue Shopping
        </button>,
      ];

    case 'processing':
      return [
        ...baseActions,
        <button
          key="modify"
          onClick={() => router.push(`/orders/${orderNumber}/modify`)}
          className="bg-orange-500 text-white px-4 py-2 text-sm rounded-xs font-medium hover:bg-orange-600 transition-colors duration-200"
        >
          Modify Order
        </button>,
      ];

    case 'shipped':
      return [
        <button
          key="track"
          onClick={() => router.push(`/orders/track?orderNumber=${orderNumber}`)}
          className="bg-purple-600 text-white px-4 py-2 text-sm rounded-xs font-medium hover:bg-purple-700 transition-colors duration-200"
        >
          <Truck size={16} className="inline mr-2" />
          Track Your Package
        </button>,
        <button
          key="delivery-info"
          onClick={() => router.push(`/orders/${orderNumber}/delivery`)}
          className="bg-white text-purple-600 px-4 py-2 text-sm rounded-xs font-medium border border-purple-300 hover:bg-purple-50 transition-colors duration-200"
        >
          Delivery Information
        </button>,
      ];

    case 'delivered':
      return [
        <button
          key="review"
          onClick={() => router.push(`/orders/${orderNumber}/review`)}
          className="bg-green-600 text-white px-4 py-2 text-sm rounded-xs font-medium hover:bg-green-700 transition-colors duration-200"
        >
          <Star size={16} className="inline mr-2" />
          Rate & Review Products
        </button>,
        <button
          key="support"
          onClick={() => router.push(`/support?orderNumber=${orderNumber}`)}
          className="bg-white text-green-600 px-4 py-2 text-sm rounded-xs font-medium border border-green-300 hover:bg-green-50 transition-colors duration-200"
        >
          <MessageCircle size={16} className="inline mr-2" />
          Contact Support
        </button>,
      ];

    case 'cancelled':
      return [
        <button
          key="reorder"
          onClick={() => router.push(`/orders/${orderNumber}/reorder`)}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded-xs font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          <RefreshCw size={16} className="inline mr-2" />
          Place Order Again
        </button>,
        <button
          key="support"
          onClick={() => router.push(`/support?orderNumber=${orderNumber}`)}
          className="bg-white text-red-600 px-4 py-2 text-sm rounded-xs font-medium border border-red-300 hover:bg-red-50 transition-colors duration-200"
        >
          Get Help & Support
        </button>,
      ];

    default:
      return baseActions;
  }
};

const DeliveryInfo = ({
  status,
  deliveryDate,
  orderNumber,
}: {
  status: OrderStatus;
  deliveryDate: string;
  orderNumber: string;
}) => {
  const getDeliveryMessage = () => {
    switch (status) {
      case 'pending':
        return `Expected delivery date: ${deliveryDate}`;
      case 'confirmed':
        return `Estimated delivery: ${deliveryDate}`;
      case 'processing':
        return `Currently being prepared • Estimated delivery: ${deliveryDate}`;
      case 'shipped':
        return `Package is in transit • Expected delivery: ${deliveryDate}`;
      case 'delivered':
        return `Successfully delivered to your address`;
      case 'cancelled':
        return `This order was cancelled and no delivery is scheduled`;
      default:
        return `Estimated delivery: ${deliveryDate}`;
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'cancelled':
        return <XCircle size={18} className="text-red-600" />;
      case 'shipped':
        return <Truck size={18} className="text-purple-600" />;
      default:
        return <Clock size={18} className="text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'delivered':
        return 'bg-green-50 border-green-200';
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'shipped':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`rounded-xs p-4 border-2 ${getBgColor()}`}>
      <div className="flex items-center gap-3 mb-2">
        {getIcon()}
        <span className="font-semibold text-sm text-gray-900">Delivery Information</span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{getDeliveryMessage()}</p>
      {status === 'shipped' && (
        <div className="mt-3 p-3 bg-white rounded-xs border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">
            <strong>Tracking Number:</strong> #{orderNumber.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-gray-500">
            You can use this tracking number to monitor your package's journey
          </p>
        </div>
      )}
    </div>
  );
};

export default function OrderSuccessPage() {
  const { loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('orderNumber') || '';

  const { order, fetchOrderByNumber, loading, error, clearError } = useOrderStore();

  useEffect(() => {
    if (!orderNumber) return;
    clearError();
    fetchOrderByNumber(orderNumber);
  }, [orderNumber]);

  if (userLoading || loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-blue-600 mb-4">
            <Package className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading your order details...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your information</p>
        </div>
      </div>
    );

  if (error || !order)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <Card
            title="Order Not Found"
            icon={<AlertCircle size={18} className="text-red-500" />}
            className="border-red-200"
          >
            <div className="text-center py-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">We couldn't find this order</p>
              <p className="text-gray-600 text-sm mb-4">
                {error ||
                  "The order number you're looking for doesn't exist or may have been entered incorrectly."}
              </p>
              <button
                onClick={() => router.push('/orders')}
                className="bg-blue-600 text-white px-6 py-2 text-sm rounded-xs font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                View All Your Orders
              </button>
            </div>
          </Card>
        </div>
      </div>
    );

  const status = order.orderStatus || 'pending';
  const config = STATUS_CONFIG[status];
  const currentStatusIndex = STATUS_ORDER.indexOf(status);
  const deliveryDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '5–7 Business Days';

  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Confetti Effect for positive statuses */}
      {config.showConfetti && <ConfettiEffect duration={3000} />}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* PROFESSIONAL STATUS HEADER */}
        <div
          className={`${config.headerColor} rounded-xs p-6 text-center text-white shadow-xl relative overflow-hidden`}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <IconComponent className="w-8 h-8" />
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
            <p className="text-lg mb-1">Order Number: #{orderNumber}</p>
            <p className="text-sm opacity-90 mb-4">{config.subtitle}</p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xs p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-sm leading-relaxed">{config.message}</p>
              <p className="text-sm opacity-75 mt-3 font-medium">{config.actionText}</p>
            </div>

            {/* Status-specific action buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <StatusActions status={status} orderNumber={orderNumber} router={router} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* LEFT: ORDER PROGRESS - Hide for delivered orders */}
          <div className="lg:col-span-2 space-y-6">
            {status !== 'delivered' && status !== 'cancelled' ? (
              <Card
                title="Order Progress Tracking"
                icon={<Truck size={18} className="text-blue-600" />}
              >
                <div className="space-y-4">
                  {STATUS_ORDER.filter((_, idx) => idx <= Math.max(currentStatusIndex + 1, 4)).map(
                    (statusItem, idx) => {
                      const originalIdx = STATUS_ORDER.indexOf(statusItem);
                      const done = originalIdx <= currentStatusIndex;
                      const active = originalIdx === currentStatusIndex;
                      const upcoming = originalIdx > currentStatusIndex;

                      return (
                        <div
                          key={statusItem}
                          className={`flex items-center gap-4 p-3 rounded-xs transition-all duration-200 ${
                            active
                              ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                              : done
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${
                              done
                                ? 'bg-green-500 text-white'
                                : active
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-300 text-gray-500'
                            }`}
                          >
                            {done ? (
                              <CheckCircle size={16} />
                            ) : active ? (
                              <Clock size={16} />
                            ) : (
                              <Package size={16} />
                            )}
                          </div>

                          <div className="flex-1">
                            <p
                              className={`font-semibold text-sm ${
                                done || active ? 'text-gray-900' : 'text-gray-500'
                              }`}
                            >
                              {LABELS[statusItem]}
                            </p>
                            {active && (
                              <p className="text-sm text-blue-600 font-medium">
                                Currently in progress
                              </p>
                            )}
                            {done && !active && (
                              <p className="text-sm text-green-600">Completed successfully</p>
                            )}
                            {upcoming && <p className="text-sm text-gray-400">Upcoming step</p>}
                          </div>

                          {done && (
                            <div className="text-green-500">
                              <CheckCircle size={18} />
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </Card>
            ) : status === 'delivered' ? (
              <Card
                title="Order Successfully Completed"
                icon={<CheckCircle size={18} className="text-green-600" />}
                className="border-green-200"
              >
                <div className="text-center py-6">
                  <Gift className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-800 font-semibold text-lg mb-2">
                    Your Order Has Been Delivered!
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    We're thrilled that your order has reached you safely. Thank you for choosing us
                    for your shopping needs. We hope you absolutely love your purchase!
                  </p>
                  <div className="mt-4 p-4 bg-green-50 rounded-xs">
                    <p className="text-green-700 text-sm font-medium">
                      Your satisfaction is our priority. If you have any questions or concerns, our
                      customer support team is here to help.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card
                title="Order Cancellation Details"
                icon={<XCircle size={18} className="text-red-500" />}
                className="border-red-200"
              >
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-800 font-semibold text-lg mb-2">
                    This Order Has Been Cancelled
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Your order cancellation has been processed successfully. If you made an online
                    payment, your refund will be automatically processed to your original payment
                    method.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xs p-4">
                    <p className="text-yellow-800 text-sm">
                      Need help with something? Our customer support team is available 24/7 to
                      assist you with any questions or to help you place a new order.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Delivery Information */}
            <DeliveryInfo status={status} deliveryDate={deliveryDate} orderNumber={orderNumber} />
          </div>

          {/* RIGHT: ORDER DETAILS */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Details */}
            <Card
              title="Payment Information"
              icon={
                order.paymentMethod === 'cod' ? (
                  <Banknote size={18} className="text-green-600" />
                ) : (
                  <CreditCard size={18} className="text-blue-600" />
                )
              }
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Payment Method</span>
                  <span className="font-semibold text-gray-900">
                    {getReadablePaymentMethod(order.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Payment Status</span>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : order.paymentStatus === 'refunded'
                        ? 'bg-blue-100 text-blue-700'
                        : order.paymentMethod.toLowerCase() === 'cod'
                        ? 'bg-orange-100 text-orange-700'
                        : order.paymentStatus === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {getReadablePaymentStatus(order.paymentStatus, order.paymentMethod)}
                  </span>
                </div>

                {order.paymentMethod === 'cod' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xs p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <Banknote size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-orange-800 font-medium text-sm">Cash on Delivery</p>
                        <p className="text-orange-700 text-xs mt-1">
                          Please keep exact change ready. Payment will be collected upon delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <hr className="border-gray-200 my-3" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="font-bold text-lg text-gray-900">
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Shipping Address */}
            <Card title="Delivery Address" icon={<MapPin size={18} className="text-blue-600" />}>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="text-gray-700">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-gray-700">{order.shippingAddress.addressLine2}</p>
                )}
                <p className="text-gray-700">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p className="text-gray-700">PIN: {order.shippingAddress.postalCode}</p>
                <div className="flex items-center gap-2 pt-2 text-gray-600 border-t border-gray-100">
                  <Phone size={16} className="text-blue-600" />
                  <span className="font-medium">{order.shippingAddress.phone}</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions" icon={<Shield size={18} className="text-green-600" />}>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/orders/${orderNumber}`)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xs transition-colors duration-200 text-left"
                >
                  <span className="text-lg">📋</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">View Complete Order Details</p>
                    <p className="text-gray-600 text-xs">
                      See all items, pricing, and order history
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => router.push(`/orders/${orderNumber}/invoice`)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xs transition-colors duration-200 text-left"
                >
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Download Invoice</p>
                    <p className="text-gray-600 text-xs">Get your order invoice and receipt</p>
                  </div>
                </button>
                {status === 'delivered' && (
                  <button
                    onClick={() => router.push(`/orders/${orderNumber}/return`)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xs transition-colors duration-200 text-left"
                  >
                    <span className="text-lg">🔄</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Return or Exchange Items</p>
                      <p className="text-gray-600 text-xs">
                        Easy returns within 30 days of delivery
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
