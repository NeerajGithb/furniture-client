// utils/orderUtils.ts
import { toast } from "react-hot-toast";

export interface DeleteOrderOptions {
  showConfirm?: boolean;
  customMessage?: string;
}

/**
 * Utility function to delete an order with confirmation
 */
export async function deleteOrderWithConfirmation(
  orderNumber: string,
  deleteFunction: (orderNumber: string) => Promise<boolean>,
  options: DeleteOrderOptions = {}
): Promise<boolean> {
  const { showConfirm = true, customMessage } = options;

  if (showConfirm) {
    const message = customMessage || 
      `Are you sure you want to delete order #${orderNumber}? This action cannot be undone.`;
    
    const confirmed = window.confirm(message);
    if (!confirmed) {
      return false;
    }
  }

  try {
    const success = await deleteFunction(orderNumber);
    
    if (success) {
      toast.success(`Order #${orderNumber} deleted successfully`);
      return true;
    } else {
      toast.error(`Failed to delete order #${orderNumber}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting order ${orderNumber}:`, error);
    toast.error(`Error deleting order #${orderNumber}`);
    return false;
  }
}

/**
 * Check if an order can be deleted
 */
export function canDeleteOrder(orderStatus: string, createdAt: string): { 
  canDelete: boolean; 
  reason?: string; 
} {
  // Only cancelled orders can be deleted
  if (orderStatus !== 'cancelled') {
    return { 
      canDelete: false, 
      reason: 'Only cancelled orders can be deleted' 
    };
  }

  // Check if order is older than 30 days (optional business rule)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (new Date(createdAt) > thirtyDaysAgo) {
    return { 
      canDelete: false, 
      reason: 'Cancelled orders can only be deleted after 30 days' 
    };
  }

  return { canDelete: true };
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get order status color classes
 */
export function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Calculate days since order was placed
 */
export function getDaysSinceOrder(createdAt: string): number {
  const orderDate = new Date(createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - orderDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if order is recent (within 7 days)
 */
export function isRecentOrder(createdAt: string): boolean {
  return getDaysSinceOrder(createdAt) <= 7;
}