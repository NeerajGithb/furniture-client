// app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOrderStore } from "@/stores/orderStore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import {
  Package,
  ChevronRight,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Loader2,
  ShoppingBag,
  Star,
  Eye,
  Truck,
  CreditCard,
  X,
  Download,
  MessageSquare,
  RotateCcw,
  Banknote,
  Smartphone,
  Building2,
  Wallet,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import CancelOrderModal from "@/components/models/CancelOrderModal";
import type { Order, Order as StoreOrder } from "@/stores/orderStore";
import toast from "react-hot-toast";

interface CancelModalState {
  isOpen: boolean;
  order?: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    items: Array<{
      name: string;
      quantity: number;
    }>;
  };
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderNumber: string;
  totalAmount: number;
  isDeleting: boolean;
}

// Delete confirmation modal component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, orderNumber, totalAmount, isDeleting }: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-sm shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Order</h3>
            <p className="text-gray-600 text-sm">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete this order?
          </p>
          <div className="bg-gray-50 rounded-sm p-3">
            <div className="text-sm font-medium text-gray-900">Order #{orderNumber}</div>
            <div className="text-sm text-gray-600">Amount: ₹{totalAmount.toLocaleString()}</div>
          </div>
          <p className="text-red-600 text-sm mt-2">
            ⚠️ This will permanently remove the order from your history.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Order
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Status configurations
const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Package, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle, label: "Confirmed" },
  processing: { color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Package, label: "Processing" },
  shipped: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: Truck, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, label: "Cancelled" },
  returned: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertTriangle, label: "Returned" },
} as const;

const paymentMethodIcons = {
  cod: Banknote,
  card: CreditCard,
  upi: Smartphone,
  netbanking: Building2,
  wallet: Wallet,
} as const;

const paymentMethodLabels = {
  cod: "Cash on Delivery",
  card: "Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
} as const;

export default function OrdersPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const { 
    orders, 
    loading, 
    error, 
    fetchOrders, 
    hasMore, 
    deleteOrderByNumber, 
    isOrderBeingDeleted,
    totalOrders 
  } = useOrderStore();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancelModal, setCancelModal] = useState<CancelModalState>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    order?: { orderNumber: string; totalAmount: number; };
  }>({ isOpen: false });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    
    if (!user?._id) {
      router.replace("/auth/signin?returnUrl=" + encodeURIComponent("/orders"));
      return;
    }
    
    fetchOrders({ limit: 50 });
  }, [user, userLoading, fetchOrders, router]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.items.some((item) => 
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    
    const matchesStatus = 
      filterStatus === "all" || order.orderStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });


const handleCancelOrder = (order: Order) => {
  const cancelModalOrder = {
    _id: order._id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    items: order.items.map((item: { name: string; quantity: number; }) => ({
      name: item.name,
      quantity: item.quantity
    }))
  };
  
  // Update URL instantly using window.history (synchronous)
  const params = new URLSearchParams(searchParams.toString());
  params.set("action", "cancel");
  params.set("orderNumber", order.orderNumber);
  
  window.history.replaceState(null, '', `/orders?${params.toString()}`);
  
  // Then open modal - ab dono instant honge
  setCancelModal({ isOpen: true, order: cancelModalOrder });
};

const handleCloseModal = () => {
  // Close modal first
  setCancelModal({ isOpen: false });
  
  // Clean URL instantly
  const params = new URLSearchParams(searchParams.toString());
  params.delete("action");
  params.delete("orderNumber");
  
  const newUrl = params.toString() ? `/orders?${params.toString()}` : '/orders';
  window.history.replaceState(null, '', newUrl);
};

const handleDeleteOrder = (order: Order) => {
  // Only allow deletion of cancelled or returned orders
  if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned') {
    toast.error('Only cancelled or returned orders can be deleted');
    return;
    }

    setDeleteModal({
      isOpen: true,
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount
      }
    });
  };

  const confirmDeleteOrder = async () => {
    if (!deleteModal.order) return;

    const success = await deleteOrderByNumber(deleteModal.order.orderNumber);
    if (success) {
      setDeleteModal({ isOpen: false });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOrders({ limit: 50 }, true); // Force refresh
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await fetchOrders({ limit: 20, skip: orders.length });
    } catch (error) {
      console.error('Error loading more orders:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      // This would integrate with your cart store
      // addToCart(order.items);
      router.push('/cart');
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const handleDownloadInvoice = (orderNumber: string) => {
    window.open(`/api/orders/number/${orderNumber}/invoice`, '_blank');
  };

  const handleContactSupport = (orderNumber: string) => {
    router.push(`/support?order=${orderNumber}`);
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-sm shadow-lg text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-3">Unable to load orders</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full bg-black text-white py-3 rounded-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto px-4 py-6 lg:py-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-1">
                {totalOrders > 0 ? (
                  <>
                    {filteredOrders.length} of {totalOrders} order{totalOrders !== 1 ? 's' : ''} 
                    {search || filterStatus !== 'all' ? ' (filtered)' : ''}
                  </>
                ) : (
                  'Track and manage your purchases'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh orders"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/products"
                className="bg-black text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop Now
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders or products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-sm focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-sm bg-white focus:ring-2 focus:ring-black/10 focus:border-black transition-colors appearance-none"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-sm text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {search || filterStatus !== "all" ? "No orders found" : "No orders yet"}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {search || filterStatus !== "all" 
                ? "Try adjusting your search or filters" 
                : "Start shopping to see your orders here"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="bg-black text-white px-6 py-3 rounded-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Browse Products
              </Link>
              {(search || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("all");
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.orderStatus];
                const StatusIcon = statusInfo?.icon || Package;
                const PaymentIcon = paymentMethodIcons[order.paymentMethod] || CreditCard;
                const isDeleting = isOrderBeingDeleted(order.orderNumber);
                
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                    className={`bg-white rounded-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden ${
                      isDeleting ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Order Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 truncate">
                              Order #{order.orderNumber}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo?.label || order.orderStatus}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                            <span className="flex items-center gap-1" title={paymentMethodLabels[order.paymentMethod]}>
                              <PaymentIcon className="w-4 h-4" />
                              {order.paymentMethod.toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                              order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              order.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {order.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              ₹{order.totalAmount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      <div className="space-y-3">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item._id} className="flex gap-3">
                            <div className="w-14 h-14 bg-gray-100 rounded-sm overflow-hidden border border-gray-200 flex-shrink-0">
                              {item.product?.mainImage?.url ? (
                                <Image
                                  src={item.product.mainImage.url}
                                  alt={item.name}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate text-sm">{item.name}</h4>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <span>Qty: {item.quantity}</span>
                                  {item.size && <span>Size: {item.size}</span>}
                                  {item.color && <span>Color: {item.color}</span>}
                                </div>
                                <span className="font-semibold text-gray-900 text-sm">
                                  ₹{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {order.items.length > 2 && (
                          <div className="text-center py-2 border-t border-gray-100">
                            <span className="text-sm text-gray-600 font-medium">
                              +{order.items.length - 2} more items
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-4 text-sm">
                          {order.expectedDeliveryDate && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full">
                              <Truck className="w-4 h-4" />
                              <span className="font-medium">
                                Delivery by {new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short"
                                })}
                              </span>
                            </div>
                          )}
                          {order.trackingNumber && (
                            <span className="text-gray-600">
                              Tracking: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{order.trackingNumber}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Quick Actions */}
                          <div className="flex items-center gap-1">
                            {order.items[0]?.product?._id && (
                              <Link
                                href={`/products/${order.items[0].product._id}`}
                                className="p-2 border border-gray-300 rounded-sm hover:border-gray-400 transition-colors"
                                title="View Product"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            )}
                            
                            {order.orderStatus === 'delivered' && (
                              <>
                                <button 
                                  className="p-2 border border-gray-300 rounded-sm hover:border-yellow-400 hover:bg-yellow-50 transition-colors" 
                                  title="Rate & Review"
                                  onClick={() => router.push(`/review/${order._id}`)}
                                >
                                  <Star className="w-4 h-4" />
                                </button>
                                <button 
                                  className="p-2 border border-gray-300 rounded-sm hover:border-blue-400 hover:bg-blue-50 transition-colors" 
                                  title="Reorder"
                                  onClick={() => handleReorder(order)}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            <button 
                              className="p-2 border border-gray-300 rounded-sm hover:border-gray-400 transition-colors" 
                              title="Download Invoice"
                              onClick={() => handleDownloadInvoice(order.orderNumber)}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            
                            <button 
                              className="p-2 border border-gray-300 rounded-sm hover:border-gray-400 transition-colors" 
                              title="Support"
                              onClick={() => handleContactSupport(order.orderNumber)}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Main Actions */}
                          <div className="flex items-center gap-2 ml-2">
                            {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="px-4 py-2 border border-red-300 text-red-700 rounded-sm font-medium hover:bg-red-50 transition-colors text-sm"
                              >
                                Cancel Order
                              </button>
                            )}
                            
                            <Link
                              href={`/order-success?orderNumber=${order.orderNumber}`}
                              className="px-4 py-2 bg-black text-white rounded-sm font-medium hover:bg-gray-800 transition-colors text-sm flex items-center gap-1"
                            >
                              View Details
                              <ChevronRight className="w-4 h-4" />
                            </Link>

                            {order.orderStatus !== "cancelled" && order.orderStatus !== "returned" ? (
                              <Link
                                href={`/orders/track?orderNumber=${order.orderNumber}`}
                                className="px-4 py-2 bg-black text-white rounded-sm font-medium hover:bg-gray-800 transition-colors text-sm flex items-center gap-1"
                              >
                                Track Order
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleDeleteOrder(order)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-sm font-medium hover:bg-red-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    Delete
                                    <Trash2 className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Load More Button */}
        {filteredOrders.length > 0 && hasMore && (
          <div className="text-center pt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Orders'
              )}
            </button>
          </div>
        )}

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-sm border border-gray-200 text-center">
              <div className="text-2xl font-bold text-green-600">
                {orders.filter((o) => o.orderStatus === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Delivered
              </div>
            </div>
            <div className="bg-white p-4 rounded-sm border border-gray-200 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.orderStatus)).length}
              </div>
              <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <Package className="w-3 h-3" />
                Active
              </div>
            </div>
            <div className="bg-white p-4 rounded-sm border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">
                ₹{orders.filter(o => o.orderStatus === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <CreditCard className="w-3 h-3" />
                Total Spent
              </div>
            </div>
            <div className="bg-white p-4 rounded-sm border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {orders.reduce((sum, o) => sum + o.items.length, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                Items Ordered
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        {orders.length > 0 && (
          <div className="mt-8 bg-white rounded-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/orders?status=pending"
                onClick={() => setFilterStatus('pending')}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-sm flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Pending</div>
                  <div className="text-sm text-gray-600">
                    {orders.filter(o => o.orderStatus === 'pending').length} orders
                  </div>
                </div>
              </Link>

              <Link
                href="/orders?status=shipped"
                onClick={() => setFilterStatus('shipped')}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-sm flex items-center justify-center">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Shipped</div>
                  <div className="text-sm text-gray-600">
                    {orders.filter(o => o.orderStatus === 'shipped').length} orders
                  </div>
                </div>
              </Link>

              <Link
                href="/products"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-black rounded-sm flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Shop More</div>
                  <div className="text-sm text-gray-600">Browse products</div>
                </div>
              </Link>

              <Link
                href="/support"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Support</div>
                  <div className="text-sm text-gray-600">Get help</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {cancelModal.order && (
        <CancelOrderModal 
          isOpen={cancelModal.isOpen}
          onClose={handleCloseModal}
          order={cancelModal.order}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && deleteModal.order && (
          <DeleteConfirmModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false })}
            onConfirm={confirmDeleteOrder}
            orderNumber={deleteModal.order.orderNumber}
            totalAmount={deleteModal.order.totalAmount}
            isDeleting={isOrderBeingDeleted(deleteModal.order.orderNumber)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}