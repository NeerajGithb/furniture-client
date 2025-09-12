// stores/orderStore.ts
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
}

export interface OrderItem {
  originalPrice: boolean;
  hasInsurance: any;
  selectedVariant: any;
  productImage: any;
  _id: string;
  product: OrderProduct;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Order {
  carrier: any;
  paymentId: string;
  insuranceCost: boolean;
  tax: number;
  shippingCost: number;
  subtotal: number;
  discount: boolean;
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  notes?: string;
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
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
}

interface OrderStore {
  // State
  orders: Order[];
  order: Order | null;
  loading: boolean;
  error: string | null;
  deletingOrders: string[]; // Track orders being deleted
  
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
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

  // Add to the OrderStore interface

// Add to the store implementation
initializeOrders: async (userId?: string) => {
  const state = get();
  
  // Skip if already initialized recently
  if (state.orders.length > 0 && Date.now() - state.lastFetchTime < CACHE_DURATION) {
    return;
  }

  set({ loading: true, error: null });

  try {
    // Build initial filters
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
  // Fetch orders with improved error handling
  fetchOrders: async (filters = {}, forceRefresh = false) => {
    const state = get();
    
    // Check cache validity
    if (!forceRefresh &&
        state.orders.length > 0 &&
        Date.now() - state.lastFetchTime < CACHE_DURATION &&
        !filters.page && !filters.status && !filters.skip) {
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const queryParams = new URLSearchParams();
      
      // Build query parameters
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
      
      // Handle both new fetch and pagination
      const newOrders = Array.isArray(data.orders) ? data.orders : [];
      const currentOrders = filters.skip ? state.orders : [];
      
      set({
        orders: filters.skip ? [...currentOrders, ...newOrders] : newOrders,
        totalOrders: data.total || 0,
        currentPage: data.page || 1,
        totalPages: data.pages || 1,
        hasMore: data.hasMore !== undefined ? data.hasMore : (newOrders.length === (filters.limit || 50)),
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
        orders: filters.skip ? state.orders : [] // Don't clear existing orders on pagination error
      });
      
      toast.error(errorMessage);
    }
  },

  // Fetch single order by ID
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
      set({ order: data.order, loading: false, error: null });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error fetching order";
      console.error("Order fetch error:", errorMessage);
      set({ error: errorMessage, loading: false, order: null });
      toast.error(errorMessage);
    }
  },

  // Fetch by order number
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
      set({ order: data.order, loading: false, error: null });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error fetching order";
      console.error("Order fetch by number error:", errorMessage);
      set({ error: errorMessage, loading: false, order: null });
      toast.error(errorMessage);
    }
  },

  // Create new order (optimistic update)
  createOrder: async (orderData: CreateOrderData) => {
    // Create temporary order for optimistic update
    const tempOrder: Order = {
      _id: `temp-${Date.now()}`,
      orderNumber: "TEMP",
      userId: "temp",
      items: orderData.items.map(i => ({
        _id: `temp-${i.productId}`,
        product: { _id: i.productId, name: "Loading..." },
        name: "Loading item...",
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        originalPrice: false,
        hasInsurance: false,
        selectedVariant: null,
        productImage: null,
      })),
      totalAmount: orderData.totalAmount,
      orderStatus: "pending",
      paymentStatus: "pending",
      paymentMethod: orderData.paymentMethod,
      shippingAddress: {
        _id: orderData.shippingAddressId,
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
      paymentId: "",
      insuranceCost: false,
      tax: 0,
      shippingCost: 0,
      subtotal: orderData.totalAmount,
      discount: false,
      carrier: undefined
    };

    // Optimistic update
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
      const newOrder = data.order;

      // Replace temporary order with real order
      set(state => ({
        orders: state.orders.map(o => o._id === tempOrder._id ? newOrder : o),
        order: newOrder,
        lastFetchTime: Date.now(),
      }));

      toast.success("Order created successfully");
      return newOrder;

    } catch (error) {
      // Remove temporary order on error
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

  // Update order status (optimistic)
  updateOrderStatus: async (id: string, status: OrderStatus) => {
    const prevState = { orders: get().orders, order: get().order };
    
    // Optimistic update
    set(state => ({
      orders: state.orders.map(o => 
        o._id === id ? { ...o, orderStatus: status, updatedAt: new Date().toISOString() } : o
      ),
      order: state.order?._id === id ? 
        { ...state.order, orderStatus: status, updatedAt: new Date().toISOString() } : 
        state.order
    }));

    try {
      const response = await fetchWithCredentials(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to update status');
      }

      const data = await handleApiResponse(response);
      const updatedOrder = data.order;

      // Update with actual response
      set(state => ({
        orders: state.orders.map(o => o._id === id ? updatedOrder : o),
        order: state.order?._id === id ? updatedOrder : state.order
      }));

      toast.success("Order status updated");
      return true;

    } catch (error) {
      // Rollback on error
      set(prevState);
      const errorMessage = error instanceof Error ? error.message : "Error updating status";
      toast.error(errorMessage);
      return false;
    }
  },

  // Update order notes
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
      const updatedOrder = data.order;

      // Update order in state
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

  // Cancel order (optimistic)
  cancelOrder: async (id: string, reason?: string) => {
    const prevState = { orders: get().orders, order: get().order };
    const cancelledAt = new Date().toISOString();
    
    // Optimistic update
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
      const response = await fetchWithCredentials(`/api/orders/${id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await handleApiResponse(response);
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      const data = await handleApiResponse(response);
      const updatedOrder = data.order;

      // Update with actual response
      set(state => ({
        orders: state.orders.map(o => o._id === id ? updatedOrder : o),
        order: state.order?._id === id ? updatedOrder : state.order
      }));

      toast.success("Order cancelled successfully");
      return true;

    } catch (error) {
      // Rollback on error
      set(prevState);
      const errorMessage = error instanceof Error ? error.message : "Error cancelling order";
      toast.error(errorMessage);
      return false;
    }
  },

  // Delete order by number (only cancelled orders)
  deleteOrderByNumber: async (orderNumber: string) => {
    if (!orderNumber?.trim()) {
      toast.error('Order number is required');
      return false;
    }

    // Add to deleting list
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

      // Remove order from state
      set(state => ({
        orders: state.orders.filter(o => o.orderNumber !== orderNumber),
        order: state.order?.orderNumber === orderNumber ? null : state.order,
        totalOrders: Math.max(0, state.totalOrders - 1),
        deletingOrders: state.deletingOrders.filter(on => on !== orderNumber)
      }));

      toast.success("Order deleted successfully");
      return true;

    } catch (error) {
      // Remove from deleting list on error
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

  // Getters
  getOrderByNumber: (orderNumber: string) => 
    get().orders.find(order => order.orderNumber === orderNumber) || null,
    
  getOrdersByStatus: (status: OrderStatus) => 
    get().orders.filter(order => order.orderStatus === status),
    
  isOrderBeingDeleted: (orderNumber: string) => 
    get().deletingOrders.includes(orderNumber),
}));