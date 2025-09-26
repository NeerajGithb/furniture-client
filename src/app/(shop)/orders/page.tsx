'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useOrderStore } from '@/stores/orderStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
  MoreHorizontal,
} from 'lucide-react';
import CancelOrderModal from '@/components/models/CancelOrderModal';
import type { Order, OrderStatus } from '@/stores/orderStore';
import toast from 'react-hot-toast';
import ErrorMessage from '@/components/ui/ErrorMessage';

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

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  totalAmount,
  isDeleting,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xs shadow-xl max-w-sm w-full p-4 mx-2"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">Delete Order</h3>
            <p className="text-gray-600 text-xs">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-2 text-sm">Are you sure you want to delete this order?</p>
          <div className="bg-gray-50 rounded-xs p-2">
            <div className="text-sm font-medium text-gray-900 truncate">Order #{orderNumber}</div>
            <div className="text-xs text-gray-600">Amount: ₹{totalAmount.toLocaleString()}</div>
          </div>
          <p className="text-red-600 text-xs mt-2">⚠️ This will permanently remove the order.</p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-xs hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-3 py-2 bg-red-600 text-white rounded-xs hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden xs:inline">Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3 h-3" />
                <span className="hidden xs:inline">Delete</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Package,
    label: 'Pending',
  },
  confirmed: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    label: 'Confirmed',
  },
  processing: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Package,
    label: 'Processing',
  },
  shipped: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
    label: 'Shipped',
  },
  delivered: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Delivered',
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    label: 'Cancelled',
  },
  returned: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle,
    label: 'Returned',
  },
} as const;

const paymentMethodIcons = {
  cod: Banknote,
  card: CreditCard,
  upi: Smartphone,
  netbanking: Building2,
  wallet: Wallet,
} as const;

const paymentMethodLabels = {
  cod: 'COD',
  card: 'Card',
  upi: 'UPI',
  netbanking: 'Banking',
  wallet: 'Wallet',
} as const;

export default function OrdersPage() {
  const [orderError, setOrderError] = useState<string | null>(null);
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
    totalOrders,
  } = useOrderStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancelModal, setCancelModal] = useState<CancelModalState>({
    isOpen: false,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    order?: { orderNumber: string; totalAmount: number };
  }>({ isOpen: false });
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user?._id) {
      router.replace('/auth/signin?returnUrl=' + encodeURIComponent('/orders'));
      return;
    }

    fetchOrders({ limit: 50 });
  }, [user, userLoading, fetchOrders, router]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.items.some((item) => item.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || order.orderStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleCancelOrder = (order: Order) => {
    const cancelModalOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
    };

    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('action', 'cancel');
    params.set('orderNumber', order.orderNumber);
    window.history.replaceState(null, '', `/orders?${params.toString()}`);
    setCancelModal({ isOpen: true, order: cancelModalOrder });
  };

  const handleCloseModal = () => {
    setCancelModal({ isOpen: false });
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('action');
    params.delete('orderNumber');
    const newUrl = params.toString() ? `/orders?${params.toString()}` : '/orders';
    window.history.replaceState(null, '', newUrl);
  };

  const handleDeleteOrder = (order: Order) => {
    if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned') {
      setOrderError('Only cancelled or returned orders can be deleted');
      return;
    }

    setDeleteModal({
      isOpen: true,
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
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
      await fetchOrders({ limit: 50 }, true);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-sm">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xs shadow-lg text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Unable to load orders</h1>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full bg-black text-white py-2 rounded-xs font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 text-sm"
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                My Orders
              </h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                {totalOrders > 0 ? (
                  <>
                    {filteredOrders.length} of {totalOrders} order
                    {totalOrders !== 1 ? 's' : ''}
                    {search || filterStatus !== 'all' ? ' (filtered)' : ''}
                  </>
                ) : (
                  'Track and manage your purchases'
                )}
              </p>
            </div>
            {orderError && (
              <ErrorMessage message={orderError} onClose={() => setOrderError(null)} />
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 border border-gray-300 rounded-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh orders"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/products"
                className="bg-black text-white px-3 sm:px-4 py-2 rounded-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1 text-xs sm:text-sm"
              >
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Shop</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-xs border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 border border-gray-300 rounded-xs focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative min-w-[120px] sm:min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 border border-gray-300 rounded-xs bg-white focus:ring-2 focus:ring-black/10 focus:border-black transition-colors appearance-none text-sm"
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
          <div className="bg-white p-8 sm:p-12 rounded-xs text-center">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              {search || filterStatus !== 'all' ? 'No orders found' : 'No orders yet'}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
              {search || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start shopping to see your orders here'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xs font-semibold hover:bg-gray-800 transition-colors text-sm"
              >
                Browse Products
              </Link>
              {(search || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterStatus('all');
                  }}
                  className="border border-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xs font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.orderStatus as keyof typeof statusConfig];
                const StatusIcon = statusInfo?.icon || Package;
                const PaymentIcon = paymentMethodIcons[order.paymentMethod] || CreditCard;
                const isDeleting = isOrderBeingDeleted(order.orderNumber);
                const isExpanded = expandedOrder === order._id;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                    onClick={() => router.push(`/orders/track?orderNumber=${order.orderNumber}`)}
                    className={`bg-white rounded-xs border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all overflow-hidden cursor-pointer ${
                      isDeleting ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Order Header */}
                    <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">
                              #{order.orderNumber}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                                statusInfo?.color || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden xs:inline">
                                {statusInfo?.label || order.orderStatus}
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span
                              className="flex items-center gap-1"
                              title={paymentMethodLabels[order.paymentMethod]}
                            >
                              <PaymentIcon className="w-3 h-3" />
                              {paymentMethodLabels[order.paymentMethod]}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : order.paymentStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : order.paymentStatus === 'refunded'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {order.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                            ₹{order.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-3 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        {order.items.slice(0, isExpanded ? order.items.length : 2).map((item) => (
                          <div key={item._id} className="flex gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-xs overflow-hidden border border-gray-200 flex-shrink-0">
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
                                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate text-xs sm:text-sm">
                                {item.name}
                              </h4>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span>Qty: {item.quantity}</span>
                                  {item.selectedVariant?.size && (
                                    <span className="hidden xs:inline">
                                      Size: {item.selectedVariant.size}
                                    </span>
                                  )}
                                  {item.selectedVariant?.color && (
                                    <span className="hidden sm:inline">
                                      Color: {item.selectedVariant.color}
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-900 text-xs sm:text-sm flex-shrink-0">
                                  ₹{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {order.items.length > 2 && (
                          <div className="text-center py-2 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedOrder(isExpanded ? null : order._id);
                              }}
                              className="text-xs sm:text-sm text-gray-600 font-medium hover:text-gray-800"
                            >
                              {isExpanded ? 'Show less' : `+${order.items.length - 2} more items`}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50/50 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          {order.expectedDeliveryDate &&
                            order.orderStatus !== 'delivered' &&
                            order.orderStatus !== 'cancelled' && (
                              <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <Truck className="w-3 h-3" />
                                <span className="font-medium">
                                  By{' '}
                                  {new Date(order.expectedDeliveryDate).toLocaleDateString(
                                    'en-IN',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                    },
                                  )}
                                </span>
                              </div>
                            )}
                          {order.trackingNumber && (
                            <span className="text-gray-600 hidden sm:inline">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {order.trackingNumber}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
                          {/* Desktop Quick Actions */}
                          <div className="flex items-center gap-1">
                            {order.items[0]?.product?._id && (
                              <Link
                                href={`/products/${order.items[0].product._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 border border-gray-300 rounded-xs hover:border-gray-400 transition-colors"
                                title="View Product"
                              >
                                <Eye className="w-3 h-3" />
                              </Link>
                            )}

                            {order.orderStatus === 'delivered' && (
                              <>
                                <button
                                  className="p-2 border border-gray-300 rounded-xs hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                                  title="Rate & Review"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/review/${order._id}`);
                                  }}
                                >
                                  <Star className="w-3 h-3" />
                                </button>
                                <button
                                  className="p-2 border border-gray-300 rounded-xs hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                  title="Reorder"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReorder(order);
                                  }}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </>
                            )}

                            <button
                              className="p-2 border border-gray-300 rounded-xs hover:border-gray-400 transition-colors"
                              title="Download Invoice"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(order.orderNumber);
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </button>

                            <button
                              className="p-2 border border-gray-300 rounded-xs hover:border-gray-400 transition-colors"
                              title="Support"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactSupport(order.orderNumber);
                              }}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Main Actions */}
                          <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
                            {(order.orderStatus === 'pending' ||
                              order.orderStatus === 'confirmed') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelOrder(order);
                                }}
                                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-red-300 text-red-700 rounded-xs font-medium hover:bg-red-50 transition-colors text-xs"
                              >
                                <span className="inline">Cancel</span>
                              </button>
                            )}

                            <Link
                              href={`/order-success?orderNumber=${order.orderNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-black text-white rounded-xs font-medium hover:bg-gray-800 transition-colors text-xs flex items-center gap-1"
                            >
                              <span className="inline">Details</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>

                            {order.orderStatus !== 'cancelled' &&
                            order.orderStatus !== 'returned' ? (
                              <Link
                                href={`/orders/track?orderNumber=${order.orderNumber}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 text-white rounded-xs font-medium hover:bg-gray-700 transition-colors text-xs flex items-center gap-1"
                              >
                                <span className="inline">Track Order</span>
                                <ChevronRight className="w-3 h-3 hidden sm:block" />
                              </Link>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOrder(order);
                                }}
                                disabled={isDeleting}
                                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-red-600 text-white rounded-xs font-medium hover:bg-red-700 transition-colors text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span className="hidden xs:inline">Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="hidden xs:inline">Delete</span>
                                    <span className="xs:hidden">🗑</span>
                                    <Trash2 className="w-3 h-3 hidden sm:block" />
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
          <div className="text-center pt-6 sm:pt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-white border border-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-sm"
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
          <div className="mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-xs border border-gray-200 text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {orders.filter((o) => o.orderStatus === 'delivered').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Delivered
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xs border border-gray-200 text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {
                  orders.filter((o) =>
                    ['pending', 'confirmed', 'processing', 'shipped'].includes(o.orderStatus),
                  ).length
                }
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <Package className="w-3 h-3" />
                Active
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xs border border-gray-200 text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                ₹
                {orders
                  .filter((o) => o.orderStatus === 'delivered')
                  .reduce((sum, o) => sum + o.totalAmount, 0)
                  .toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <CreditCard className="w-3 h-3" />
                <span className="hidden xs:inline">Total Spent</span>
                <span className="xs:inline hidden">Spent</span>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xs border border-gray-200 text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {orders.reduce((sum, o) => sum + o.items.length, 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                <span className="hidden xs:inline">Items Ordered</span>
                <span className="xs:inline hidden">Items</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        {orders.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xs border border-gray-200 p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/orders?status=pending"
                onClick={() => setFilterStatus('pending')}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-xs hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-xs flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                    Pending
                  </div>
                  <div className="text-xs text-gray-600">
                    {orders.filter((o) => o.orderStatus === 'pending').length} orders
                  </div>
                </div>
              </Link>

              <Link
                href="/orders?status=shipped"
                onClick={() => setFilterStatus('shipped')}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-xs hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xs flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                    Shipped
                  </div>
                  <div className="text-xs text-gray-600">
                    {orders.filter((o) => o.orderStatus === 'shipped').length} orders
                  </div>
                </div>
              </Link>

              <Link
                href="/products"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-xs hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xs flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                    Shop More
                  </div>
                  <div className="text-xs text-gray-600">Browse products</div>
                </div>
              </Link>

              <Link
                href="/support"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-xs hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xs flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                    Support
                  </div>
                  <div className="text-xs text-gray-600">Get help</div>
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
