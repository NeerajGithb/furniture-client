// stores/orderStore.ts - Fixed version
import { create } from "zustand";
import { fetchWithCredentials, handleApiResponse } from "@/utils/fetchWithCredentials";
import { toast } from "react-hot-toast";

// Types
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'card' | 'upi' | 'netbanking' | 'wallet';

export interface OrderAddress {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderProduct {
  _id: string;
  name: string;
  mainImage?: {
    url: string;
    alt?: string;
  };
  slug?: string;
  finalPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
}

// Enhanced OrderItem interface
export interface OrderItem {
  _id: string;
  productId?: string;
  product: OrderProduct;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  insuranceCost?: number;
  selectedVariant?: {
    color?: string;
    size?: string;
    sku?: string;
  };
  productImage?: string;

  // NEW FIELDS from enhanced model
  sku?: string;
  itemId?: string;
  discount?: number;
  discountPercent?: number;

  // Calculated fields for UI
  itemTotal?: number;
  originalItemTotal?: number;
  itemSavings?: number;
  itemInsuranceTotal?: number;
}

// Price breakdown interface
export interface PriceBreakdown {
  originalSubtotal: number;
  itemDiscount: number;
  couponDiscount: number;
  totalInsurance: number;
  finalSubtotal: number;
  shippingCost: number;
  tax: number;
  grandTotal: number;
  totalSavings: number;

  // Additional calculated fields for UI
  itemsSubtotal?: number;
  insuranceTotal?: number;
  subtotalWithInsurance?: number;
  totalBeforeCoupon?: number;
  totalAfterCoupon?: number;
  youSaved?: number;
}

// Order timeline interface
export interface OrderTimelineStep {
  status: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  icon: string;
  type?: 'success' | 'error' | 'warning';
}

// Order summary interface
export interface OrderSummary {
  totalItems: number;
  totalQuantity: number;
  hasInsurance: boolean;
  hasCoupon: boolean;
  canCancel: boolean;
  canReturn: boolean;
  estimatedDelivery?: string;
  orderAge: number;
  isRecentOrder: boolean;
}

// Payment information interface
export interface PaymentInfo {
  _id: string;
  paymentId: string;
  status: PaymentStatus;
  method: PaymentMethod;
  gateway: string;
  gatewayTransactionId?: string;
  paidAt?: string;
  failureReason?: string;
}

// Enhanced Order interface
export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];

  // Enhanced price details
  priceBreakdown: PriceBreakdown;

  // Legacy fields (maintained for backward compatibility)
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number | boolean;
  totalAmount: number;

  // Order information
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;

  // Tracking and timeline
  trackingNumber?: string;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundedAt?: string;
  notes?: string;

  // NEW FIELDS
  insuranceEnabled?: string[];
  couponCode?: string;
  carrier?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Enhanced response fields
  payment?: PaymentInfo;
  orderTimeline?: OrderTimelineStep[];
  orderSummary?: OrderSummary;

  // Legacy fields (for backward compatibility)
  paymentId?: string;
  insuranceCost?: number | boolean;
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    originalPrice?: number;
    selectedVariant?: {
      color?: string;
      size?: string;
      sku?: string;
    };
    insuranceCost?: number;
  }>;
  addressId: string;
  paymentMethod: PaymentMethod;
  selectedItems: string[];
  cartData: Array<{
    productId: string;
    quantity: number;
    selectedVariant?: {
      color?: string;
      size?: string;
      sku?: string;
    };
  }>;
  totals: {
    subtotal: number;
    shippingCost: number;
    insuranceCost: number;
    totalAmount: number;
    couponDiscount?: number;
  };
  insuranceEnabled?: string[];
  couponCode?: string;
  notes?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
  skip?: number;
  orderNumber?: string;
}

interface OrderStore {
  // State
  orders: Order[];
  order: Order | null;
  loading: boolean;
  error: string | null;
  deletingOrders: string[];

  // Pagination
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;

  // Cache
  lastFetchTime: number;

  // Actions
  initializeOrders: (userId?: string) => Promise<void>;
  fetchOrders: (filters?: OrderFilters, forceRefresh?: boolean) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  fetchOrderByNumber: (orderNumber: string) => Promise<void>;
  createOrder: (orderData: CreateOrderData) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  updateOrderNotes: (orderNumber: string, notes: string) => Promise<boolean>;
  cancelOrder: (id: string, reason?: string) => Promise<boolean>;
  deleteOrderByNumber: (orderNumber: string) => Promise<boolean>;

  // Utility actions
  clearError: () => void;
  clearOrder: () => void;
  clearOrders: () => void;

  // Getters
  getOrderByNumber: (orderNumber: string) => Order | null;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  isOrderBeingDeleted: (orderNumber: string) => boolean;

  // Enhanced getters
  getOrderPriceBreakdown: (orderNumber: string) => PriceBreakdown | null;
  getOrderTimeline: (orderNumber: string) => OrderTimelineStep[] | null;
  canCancelOrder: (orderNumber: string) => boolean;
  canReturnOrder: (orderNumber: string) => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fixed processOrderData function
const processOrderData = (order: any): Order => {
  

  // Calculate item totals and savings
  const processedItems = (order.items || []).map((item: any) => {
    const itemPrice = item.price || 0;
    const itemOriginalPrice = item.originalPrice || itemPrice;
    const itemQuantity = item.quantity || 0;
    const itemInsurance = item.insuranceCost || 0;

    return {
      ...item,
      itemTotal: itemPrice * itemQuantity,
      originalItemTotal: itemOriginalPrice * itemQuantity,
      itemSavings: (itemOriginalPrice - itemPrice) * itemQuantity,
      itemInsuranceTotal: itemInsurance * itemQuantity,
    };
  });

  // Calculate totals from items
  const itemsSubtotal = processedItems.reduce((sum: number, item: any) => sum + (item.itemTotal || 0), 0);
  const originalSubtotal = processedItems.reduce((sum: number, item: any) => sum + (item.originalItemTotal || 0), 0);
  const totalItemSavings = processedItems.reduce((sum: number, item: any) => sum + (item.itemSavings || 0), 0);
  const totalInsurance = processedItems.reduce((sum: number, item: any) => sum + (item.itemInsuranceTotal || 0), 0);

  // Handle legacy discount field
  const legacyDiscount = typeof order.discount === 'number' ? order.discount : 0;
  const legacyInsurance = typeof order.insuranceCost === 'number' ? order.insuranceCost : 0;

  // Build comprehensive price breakdown
  const priceBreakdown: PriceBreakdown = {
    // Use calculated values or fallback to order values
    originalSubtotal: originalSubtotal || order.subtotal || 0,
    itemDiscount: totalItemSavings || legacyDiscount || 0,
    couponDiscount: order.priceBreakdown?.couponDiscount || order.couponDiscount || 0,
    totalInsurance: totalInsurance || legacyInsurance || 0,
    finalSubtotal: itemsSubtotal || order.subtotal || 0,
    shippingCost: order.priceBreakdown?.shippingCost || order.shippingCost || 0,
    tax: order.priceBreakdown?.tax || order.tax || 0,
    grandTotal: order.priceBreakdown?.grandTotal || order.totalAmount || 0,
    totalSavings: (totalItemSavings || legacyDiscount || 0) + (order.priceBreakdown?.couponDiscount || order.couponDiscount || 0),

    // Additional UI fields
    itemsSubtotal: itemsSubtotal || order.subtotal || 0,
    insuranceTotal: totalInsurance || legacyInsurance || 0,
    subtotalWithInsurance: (itemsSubtotal || order.subtotal || 0) + (totalInsurance || legacyInsurance || 0),
    totalBeforeCoupon: (itemsSubtotal || order.subtotal || 0) + (totalInsurance || legacyInsurance || 0) + (order.shippingCost || 0),
    totalAfterCoupon: order.totalAmount || 0,
    youSaved: (totalItemSavings || legacyDiscount || 0) + (order.priceBreakdown?.couponDiscount || order.couponDiscount || 0),
  };

  return {
    ...order,
    items: processedItems,
    discount: typeof order.discount === 'number' ? order.discount : (order.discount ? 1 : 0),
    insuranceCost: typeof order.insuranceCost === 'number' ? order.insuranceCost : (order.insuranceCost ? 1 : 0),
    insuranceEnabled: order.insuranceEnabled || [],
    orderTimeline: order.orderTimeline || [],
    priceBreakdown,
    // Ensure orderSummary is available
    orderSummary: {
      totalItems: processedItems.length,
      totalQuantity: processedItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
      hasInsurance: totalInsurance > 0,
      hasCoupon: !!(order.couponCode || order.priceBreakdown?.couponDiscount),
      canCancel: ['pending', 'confirmed'].includes(order.orderStatus),
      canReturn: ['delivered'].includes(order.orderStatus),
      estimatedDelivery: order.expectedDeliveryDate,
      orderAge: Date.now() - new Date(order.createdAt).getTime(),
      isRecentOrder: (Date.now() - new Date(order.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000), // 7 days
      ...order.orderSummary
    }
  };
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  // Initial state
  orders: [],
  order: null,
  loading: false,
  error: null,
  deletingOrders: [],
  totalOrders: 0,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  lastFetchTime: 0,

  initializeOrders: async (userId?: string) => {
    const state = get();

    if (state.orders.length > 0 && Date.now() - state.lastFetchTime < CACHE_DURATION) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const filters: OrderFilters = {
        limit: 20,
        page: 1
      };

      await get().fetchOrders(filters, true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize orders";
      set({ error: errorMessage, loading: false });
      console.error("Order initialization error:", errorMessage);
    }
  },

  fetchOrders: async (filters = {}, forceRefresh = false) => {
    const state = get();

    if (!forceRefresh &&
      state.orders.length > 0 &&
      Date.now() - state.lastFetchTime < CACHE_DURATION &&
      !filters.page && !filters.status && !filters.skip) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetchWithCredentials(url);

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const data = await handleApiResponse(response);

      const newOrders = Array.isArray(data.orders) ? data.orders.map(processOrderData) : [];
      const currentOrders = filters.skip ? state.orders : [];

      set({
        orders: filters.skip ? [...currentOrders, ...newOrders] : newOrders,
        totalOrders: data.pagination?.totalOrders || data.total || 0,
        currentPage: data.pagination?.currentPage || data.page || 1,
        totalPages: data.pagination?.totalPages || data.pages || 1,
        hasMore: data.pagination?.hasMore !== undefined ? data.pagination.hasMore : (newOrders.length === (filters.limit || 50)),
        lastFetchTime: Date.now(),
        loading: false,
        error: null
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error fetching orders";
      console.error("Orders fetch error:", errorMessage);

      set({
        error: errorMessage,
        loading: false,
        orders: filters.skip ? state.orders : []
      });

      toast.error(errorMessage);
    }
  },

  fetchOrderById: async (id: string) => {
    if (!id?.trim()) {
      set({ error: 'Order ID is required' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await fetchWithCredentials(`/api/orders/${id}`);

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to fetch order');
      }

      const data = await handleApiResponse(response);
      

      const processedOrder = processOrderData(data.order);
      set({ order: processedOrder, loading: false, error: null });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error fetching order";
      console.error("Order fetch error:", errorMessage);
      set({ error: errorMessage, loading: false, order: null });
      toast.error(errorMessage);
    }
  },

  fetchOrderByNumber: async (orderNumber: string) => {
    if (!orderNumber?.trim()) {
      set({ error: 'Order number is required' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await fetchWithCredentials(`/api/orders/number/${orderNumber}`);

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to fetch order');
      }

      const data = await handleApiResponse(response);
      

      const processedOrder = processOrderData(data.order);
      set({ order: processedOrder, loading: false, error: null });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error fetching order";
      console.error("Order fetch by number error:", errorMessage);
      set({ error: errorMessage, loading: false, order: null });
      toast.error(errorMessage);
    }
  },

  createOrder: async (orderData: CreateOrderData) => {
    // Enhanced temporary order with new fields
    const tempOrder: Order = {
      _id: `temp-${Date.now()}`,
      orderNumber: "TEMP",
      userId: "temp",
      items: orderData.items.map(i => ({
        _id: `temp-${i.productId}`,
        product: { _id: i.productId, name: "Loading..." },
        name: "Loading item...",
        price: i.price,
        originalPrice: i.originalPrice,
        quantity: i.quantity,
        selectedVariant: i.selectedVariant,
        insuranceCost: i.insuranceCost || 0,
        sku: "",
        itemId: "",
        discount: 0,
        discountPercent: 0,
        productImage: "",
        itemTotal: i.price * i.quantity,
        originalItemTotal: (i.originalPrice || i.price) * i.quantity,
        itemSavings: 0,
        itemInsuranceTotal: i.insuranceCost || 0,
      })),
      totalAmount: orderData.totals.totalAmount,
      orderStatus: "pending",
      paymentStatus: "pending",
      paymentMethod: orderData.paymentMethod,
      shippingAddress: {
        _id: orderData.addressId,
        fullName: "Loading...",
        phone: "",
        addressLine1: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Enhanced fields
      subtotal: orderData.totals.subtotal,
      shippingCost: orderData.totals.shippingCost,
      tax: 0,
      discount: 0,
      insuranceEnabled: orderData.insuranceEnabled || [],
      couponCode: orderData.couponCode,

      // Enhanced price breakdown
      priceBreakdown: {
        originalSubtotal: orderData.totals.subtotal,
        itemDiscount: 0,
        couponDiscount: orderData.totals.couponDiscount || 0,
        totalInsurance: orderData.totals.insuranceCost,
        finalSubtotal: orderData.totals.subtotal,
        shippingCost: orderData.totals.shippingCost,
        tax: 0,
        grandTotal: orderData.totals.totalAmount,
        totalSavings: orderData.totals.couponDiscount || 0
      }
    };

    set(state => ({
      orders: [tempOrder, ...state.orders],
      order: tempOrder,
      totalOrders: state.totalOrders + 1
    }));

    try {
      const response = await fetchWithCredentials("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await handleApiResponse(response);
      

      const newOrder = processOrderData(data.order);

      set(state => ({
        orders: state.orders.map(o => o._id === tempOrder._id ? newOrder : o),
        order: newOrder,
        lastFetchTime: Date.now(),
      }));

      toast.success("Order created successfully");
      return newOrder;

    } catch (error) {
      set(state => ({
        orders: state.orders.filter(o => o._id !== tempOrder._id),
        order: null,
        totalOrders: Math.max(0, state.totalOrders - 1)
      }));

      const errorMessage = error instanceof Error ? error.message : "Error creating order";
      toast.error(errorMessage);
      return null;
    }
  },

  // Rest of the methods remain the same...
  updateOrderStatus: async (id: string, status: OrderStatus) => {
    const prevState = { orders: get().orders, order: get().order };

    set(state => ({
      orders: state.orders.map(o =>
        o._id === id ? { ...o, orderStatus: status, updatedAt: new Date().toISOString() } : o
      ),
      order: state.order?._id === id ?
        { ...state.order, orderStatus: status, updatedAt: new Date().toISOString() } :
        state.order
    }));

    try {
      const response = await fetchWithCredentials(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to update status');
      }

      const data = await handleApiResponse(response);
      const updatedOrder = processOrderData(data.order);

      set(state => ({
        orders: state.orders.map(o => o._id === id ? updatedOrder : o),
        order: state.order?._id === id ? updatedOrder : state.order
      }));

      toast.success("Order status updated");
      return true;

    } catch (error) {
      set(prevState);
      const errorMessage = error instanceof Error ? error.message : "Error updating status";
      toast.error(errorMessage);
      return false;
    }
  },

  updateOrderNotes: async (orderNumber: string, notes: string) => {
    try {
      const response = await fetchWithCredentials(`/api/orders/number/${orderNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to update notes');
      }

      const data = await handleApiResponse(response);
      const updatedOrder = processOrderData(data.order);

      set(state => ({
        orders: state.orders.map(o =>
          o.orderNumber === orderNumber ? updatedOrder : o
        ),
        order: state.order?.orderNumber === orderNumber ? updatedOrder : state.order
      }));

      toast.success("Order notes updated");
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error updating notes";
      toast.error(errorMessage);
      return false;
    }
  },

  cancelOrder: async (id: string, reason?: string) => {
    const prevState = { orders: get().orders, order: get().order };
    const cancelledAt = new Date().toISOString();

    set(state => ({
      orders: state.orders.map(o =>
        o._id === id ? {
          ...o,
          orderStatus: "cancelled",
          cancelledAt,
          cancellationReason: reason,
          updatedAt: cancelledAt
        } : o
      ),
      order: state.order?._id === id ? {
        ...state.order,
        orderStatus: "cancelled",
        cancelledAt,
        cancellationReason: reason,
        updatedAt: cancelledAt
      } : state.order
    }));

    try {
      const response = await fetchWithCredentials(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'cancel', reason }),
      });

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      const data = await handleApiResponse(response);
      const updatedOrder = processOrderData(data.order);

      set(state => ({
        orders: state.orders.map(o => o._id === id ? updatedOrder : o),
        order: state.order?._id === id ? updatedOrder : state.order
      }));

      toast.success("Order cancelled successfully");
      return true;

    } catch (error) {
      set(prevState);
      const errorMessage = error instanceof Error ? error.message : "Error cancelling order";
      toast.error(errorMessage);
      return false;
    }
  },

  deleteOrderByNumber: async (orderNumber: string) => {
    if (!orderNumber?.trim()) {
      toast.error('Order number is required');
      return false;
    }

    set(state => ({
      deletingOrders: [...state.deletingOrders, orderNumber]
    }));

    try {
      const response = await fetchWithCredentials(`/api/orders/number/${orderNumber}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to delete order');
      }

      set(state => ({
        orders: state.orders.filter(o => o.orderNumber !== orderNumber),
        order: state.order?.orderNumber === orderNumber ? null : state.order,
        totalOrders: Math.max(0, state.totalOrders - 1),
        deletingOrders: state.deletingOrders.filter(on => on !== orderNumber)
      }));

      toast.success("Order deleted successfully");
      return true;

    } catch (error) {
      set(state => ({
        deletingOrders: state.deletingOrders.filter(on => on !== orderNumber)
      }));

      const errorMessage = error instanceof Error ? error.message : "Error deleting order";
      toast.error(errorMessage);
      return false;
    }
  },

  // Utils
  clearError: () => set({ error: null }),
  clearOrder: () => set({ order: null }),
  clearOrders: () => set({
    orders: [],
    totalOrders: 0,
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
    lastFetchTime: 0,
    deletingOrders: []
  }),

  // Enhanced getters
  getOrderByNumber: (orderNumber: string) =>
    get().orders.find(order => order.orderNumber === orderNumber) || null,

  getOrdersByStatus: (status: OrderStatus) =>
    get().orders.filter(order => order.orderStatus === status),

  isOrderBeingDeleted: (orderNumber: string) =>
    get().deletingOrders.includes(orderNumber),

  // Enhanced getters
  getOrderPriceBreakdown: (orderNumber: string) => {
    const order = get().getOrderByNumber(orderNumber);
    return order?.priceBreakdown || null;
  },

  getOrderTimeline: (orderNumber: string) => {
    const order = get().getOrderByNumber(orderNumber);
    return order?.orderTimeline || null;
  },

  canCancelOrder: (orderNumber: string) => {
    const order = get().getOrderByNumber(orderNumber);
    return order?.orderSummary?.canCancel ||
      ['pending', 'confirmed'].includes(order?.orderStatus || '');
  },

  canReturnOrder: (orderNumber: string) => {
    const order = get().getOrderByNumber(orderNumber);
    return order?.orderSummary?.canReturn || false;
  },
}));