"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrderStore, type OrderStatus } from "@/stores/orderStore";

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
} from "lucide-react";

import ConfettiEffect from "@/components/ui/ConfettiEffect";

// Order flow status
const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

const LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned"
};

// Status-based configurations
const STATUS_CONFIG: Record<OrderStatus, {
  headerColor: string;
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  message: string;
  actionText: string;
  showConfetti: boolean;
}> = {
  pending: {
    headerColor: "bg-gradient-to-r from-blue-600 to-blue-700",
    icon: Clock,
    title: "Order Received",
    subtitle: "We're reviewing your order details",
    message: "Thank you for choosing us. We've received your order and will confirm it shortly.",
    actionText: "Usually confirmed within 2 hours",
    showConfetti: true,
  },
  confirmed: {
    headerColor: "bg-gradient-to-r from-green-600 to-green-700",
    icon: CheckCircle,
    title: "Order Confirmed",
    subtitle: "Your order has been accepted",
    message: "Your order has been confirmed and is now in our fulfillment queue.",
    actionText: "Processing will begin soon",
    showConfetti: true,
  },
  processing: {
    headerColor: "bg-gradient-to-r from-orange-500 to-orange-600",
    icon: Package,
    title: "Order Processing",
    subtitle: "Your items are being prepared",
    message: "Our team is carefully preparing your order for shipment.",
    actionText: "Ready to ship within 1-2 business days",
    showConfetti: false,
  },
  shipped: {
    headerColor: "bg-gradient-to-r from-purple-600 to-purple-700",
    icon: Truck,
    title: "Order Shipped",
    subtitle: "Your package is on its way",
    message: "Your order has been shipped and is heading to your address.",
    actionText: "Track your package for real-time updates",
    showConfetti: true,
  },
  delivered: {
    headerColor: "bg-gradient-to-r from-green-700 to-green-800",
    icon: Gift,
    title: "Order Delivered",
    subtitle: "Your package has arrived",
    message: "Your order has been successfully delivered. We hope you're satisfied with your purchase.",
    actionText: "Rate your experience with us",
    showConfetti: true,
  },
  cancelled: {
    headerColor: "bg-gradient-to-r from-red-600 to-red-700",
    icon: XCircle,
    title: "Order Cancelled",
    subtitle: "This order has been cancelled",
    message: "Your order has been cancelled. Please contact support for assistance.",
    actionText: "Refund processed within 3-5 business days",
    showConfetti: false,
  },
  returned: {
    headerColor: "bg-gradient-to-r from-yellow-600 to-yellow-700",
    icon: AlertCircle,
    title: "Order Returned",
    subtitle: "Your order has been returned",
    message: "Your return has been processed. Check your email for further instructions.",
    actionText: "Refund will be processed soon",
    showConfetti: false,
  },
};

// Compact Card UI
const Card = ({ title, icon, children, className = "" }: { 
  title: string; 
  icon?: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 border-b border-gray-200 text-gray-800 font-medium text-xs">
      {icon} {title}
    </div>
    <div className="p-3 text-xs space-y-2">{children}</div>
  </div>
);

// Status-specific action buttons
const StatusActions = ({ status, orderNumber, router }: { 
  status: OrderStatus; 
  orderNumber: string; 
  router: any;
}) => {
  const baseActions = [
    <button
      key="track"
      onClick={() => router.push(`/orders/track?orderNumber=${orderNumber}`)}
      className="bg-white text-gray-700 px-3 py-1.5 text-xs rounded-sm font-medium border border-gray-300 hover:bg-gray-50 transition"
    >
      View Details
    </button>
  ];

  switch (status) {
    case 'pending':
    case 'confirmed':
      return [
        ...baseActions,
        <button
          key="shop"
          onClick={() => router.push("/shop")}
          className="bg-gray-900 text-white px-3 py-1.5 text-xs rounded-sm font-medium hover:bg-gray-800 transition"
        >
          Continue Shopping
        </button>
      ];
    
    case 'processing':
      return [
        ...baseActions,
        <button
          key="modify"
          onClick={() => router.push(`/orders/${orderNumber}/modify`)}
          className="bg-orange-500 text-white px-3 py-1.5 text-xs rounded-sm font-medium hover:bg-orange-600 transition"
        >
          Modify Order
        </button>
      ];
    
    case 'shipped':
      return [
        <button
          key="track"
          onClick={() => router.push(`/orders/track?orderNumber=${orderNumber}`)}
          className="bg-purple-600 text-white px-3 py-1.5 text-xs rounded-sm font-medium hover:bg-purple-700 transition"
        >
          Track Package
        </button>,
        <button
          key="delivery-info"
          onClick={() => router.push(`/orders/${orderNumber}/delivery`)}
          className="bg-white text-purple-600 px-3 py-1.5 text-xs rounded-sm font-medium border border-purple-300 hover:bg-purple-50 transition"
        >
          Delivery Info
        </button>
      ];
    
    case 'delivered':
      return [
        <button
          key="review"
          onClick={() => router.push(`/orders/${orderNumber}/review`)}
          className="bg-green-700 text-white px-3 py-1.5 text-xs rounded-sm font-medium hover:bg-green-800 transition"
        >
          <Star size={12} className="inline mr-1" />
          Rate & Review
        </button>,
        <button
          key="support"
          onClick={() => router.push(`/support?orderNumber=${orderNumber}`)}
          className="bg-white text-green-700 px-3 py-1.5 text-xs rounded-sm font-medium border border-green-300 hover:bg-green-50 transition"
        >
          <MessageCircle size={12} className="inline mr-1" />
          Support
        </button>
      ];
    
    case 'cancelled':
      return [
        <button
          key="reorder"
          onClick={() => router.push(`/orders/${orderNumber}/reorder`)}
          className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-sm font-medium hover:bg-blue-700 transition"
        >
          <RefreshCw size={12} className="inline mr-1" />
          Reorder
        </button>,
        <button
          key="support"
          onClick={() => router.push(`/support?orderNumber=${orderNumber}`)}
          className="bg-white text-red-600 px-3 py-1.5 text-xs rounded-sm font-medium border border-red-300 hover:bg-red-50 transition"
        >
          Contact Support
        </button>
      ];
    
    default:
      return baseActions;
  }
};

// Delivery information
const DeliveryInfo = ({ status, deliveryDate, orderNumber }: { 
  status: OrderStatus; 
  deliveryDate: string;
  orderNumber: string;
}) => {
  const getDeliveryMessage = () => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return `Expected delivery: ${deliveryDate}`;
      case 'processing':
        return `Preparing for shipment • Expected: ${deliveryDate}`;
      case 'shipped':
        return `In transit • Expected delivery: ${deliveryDate}`;
      case 'delivered':
        return `Successfully delivered`;
      case 'cancelled':
        return `Order cancelled`;
      default:
        return `Expected delivery: ${deliveryDate}`;
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'cancelled':
        return <XCircle size={14} className="text-red-600" />;
      case 'shipped':
        return <Truck size={14} className="text-purple-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
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
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`rounded-sm p-3 border ${getBgColor()}`}>
      <div className="flex items-center gap-2 mb-1">
        {getIcon()}
        <span className="font-medium text-xs">Delivery Status</span>
      </div>
      <p className="text-xs text-gray-700">{getDeliveryMessage()}</p>
      {status === 'shipped' && (
        <p className="text-xs text-gray-500 mt-1">
          Tracking: #{orderNumber.slice(-6).toUpperCase()}
        </p>
      )}
    </div>
  );
};

export default function OrderSuccessPage() {
  const { loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("orderNumber") || "";
  console.log("Order Number:", orderNumber);
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
          <div className="animate-spin text-gray-600 mb-3">
            <Package className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-gray-600 text-sm font-medium">Loading order details...</p>
        </div>
      </div>
    );

  if (error || !order)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card title="Order Not Found" icon={<AlertCircle size={14} className="text-red-500" />}>
          <p className="text-gray-600">{error || "Unable to locate this order."}</p>
          <button
            onClick={() => router.push("/orders")}
            className="mt-3 bg-blue-600 text-white px-3 py-1.5 text-xs rounded-sm font-medium hover:bg-blue-700 transition"
          >
            View All Orders
          </button>
        </Card>
      </div>
    );

  const status = order.orderStatus || 'pending';
  const config = STATUS_CONFIG[status];
  const currentStatusIndex = STATUS_ORDER.indexOf(status);
  const deliveryDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "5–7 Business Days";

  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Confetti Effect for positive statuses */}
      {config.showConfetti && <ConfettiEffect duration={2000} />}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* COMPACT STATUS HEADER */}
        <div className={`${config.headerColor} rounded-sm p-4 text-center text-white shadow-lg relative overflow-hidden`}>
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <IconComponent className="w-6 h-6" />
            </div>
          </div>
          
          <h1 className="text-xl font-bold mb-1">{config.title}</h1>
          <p className="text-sm mb-1">Order #{orderNumber}</p>
          <p className="text-xs opacity-90 mb-3">{config.subtitle}</p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-sm p-3 mb-4">
            <p className="text-xs">{config.message}</p>
            <p className="text-xs opacity-75 mt-1">{config.actionText}</p>
          </div>

          {/* Status-specific action buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            <StatusActions status={status} orderNumber={orderNumber} router={router} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {/* LEFT: ORDER PROGRESS - Hide for delivered orders */}
          <div className="lg:col-span-2 space-y-4">
            {status !== 'delivered' && status !== 'cancelled' ? (
              <Card title="Order Progress" icon={<Truck size={14} />}>
                <div className="space-y-2">
                  {STATUS_ORDER.filter((_, idx) => idx <= currentStatusIndex || idx === currentStatusIndex + 1).map((statusItem, idx) => {
                    const originalIdx = STATUS_ORDER.indexOf(statusItem);
                    const done = originalIdx <= currentStatusIndex;
                    const active = originalIdx === currentStatusIndex;
                    const upcoming = originalIdx > currentStatusIndex;

                    return (
                      <div key={statusItem} className={`flex items-center gap-3 p-2 rounded-sm transition ${
                        active ? 'bg-blue-50 border border-blue-200' : 
                        done ? 'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                          done ? 'bg-green-500 text-white' : 
                          active ? 'bg-blue-500 text-white' : 
                          'bg-gray-300 text-gray-500'
                        }`}>
                          {done ? <CheckCircle size={12} /> : <Package size={12} />}
                        </div>
                        
                        <div className="flex-1">
                          <p className={`font-medium text-xs ${
                            done || active ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {LABELS[statusItem]}
                          </p>
                          {active && (
                            <p className="text-xs text-blue-600">
                              Current Status
                            </p>
                          )}
                          {upcoming && (
                            <p className="text-xs text-gray-400">
                              Next
                            </p>
                          )}
                        </div>

                        {done && (
                          <div className="text-green-500">
                            <CheckCircle size={12} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : status === 'delivered' ? (
              <Card title="Order Completed" icon={<CheckCircle size={14} className="text-green-600" />}
                    className="border-green-200">
                <div className="text-center py-4">
                  <Gift className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium text-sm mb-1">Order Successfully Delivered</p>
                  <p className="text-xs text-gray-500">
                    Thank you for choosing us. We hope you're satisfied with your purchase.
                  </p>
                </div>
              </Card>
            ) : (
              <Card title="Order Cancelled" icon={<XCircle size={14} className="text-red-500" />}
                    className="border-red-200">
                <div className="text-center py-4">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium text-sm mb-1">This order has been cancelled</p>
                  <p className="text-xs text-gray-500">
                    Contact our support team for assistance with this cancellation.
                  </p>
                </div>
              </Card>
            )}

            {/* Delivery Information */}
            <DeliveryInfo 
              status={status} 
              deliveryDate={deliveryDate} 
              orderNumber={orderNumber}
            />
          </div>

          {/* RIGHT: ORDER DETAILS */}
          <div className="lg:col-span-1 space-y-3">
            {/* Payment Details */}
            <Card title="Payment Details" icon={<CreditCard size={14} />}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium capitalize text-xs">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-700"
                      : order.paymentStatus === "refunded"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Shipping Address */}
            <Card title="Delivery Address" icon={<MapPin size={14} />}>
              <div className="space-y-1">
                <p className="font-medium text-gray-900 text-xs">{order.shippingAddress.fullName}</p>
                <p className="text-gray-700 text-xs">{order.shippingAddress.addressLine1}</p>
                <p className="text-gray-700 text-xs">
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
                <div className="flex items-center gap-1 pt-1 text-gray-600 border-t">
                  <Phone size={12} />
                  <span className="text-xs">{order.shippingAddress.phone}</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions" icon={<Heart size={14} />}>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/orders/${orderNumber}`)}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-sm transition text-xs"
                >
                  📄 Full Order Details
                </button>
                <button
                  onClick={() => router.push(`/orders/${orderNumber}/invoice`)}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-sm transition text-xs"
                >
                  🧾 Download Invoice
                </button>
                {status === 'delivered' && (
                  <button
                    onClick={() => router.push(`/orders/${orderNumber}/return`)}
                    className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-sm transition text-xs"
                  >
                    ↩️ Return/Exchange
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