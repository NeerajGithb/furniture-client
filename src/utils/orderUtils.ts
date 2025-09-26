import { toast } from 'react-hot-toast';

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
  options: DeleteOrderOptions = {},
): Promise<boolean> {
  const { showConfirm = true, customMessage } = options;

  if (showConfirm) {
    const message =
      customMessage ||
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
export function canDeleteOrder(
  orderStatus: string,
  createdAt: string,
): {
  canDelete: boolean;
  reason?: string;
} {
  if (orderStatus !== 'cancelled') {
    return {
      canDelete: false,
      reason: 'Only cancelled orders can be deleted',
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (new Date(createdAt) > thirtyDaysAgo) {
    return {
      canDelete: false,
      reason: 'Cancelled orders can only be deleted after 30 days',
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
const COLORS = {
  primary: '#1a365d',
  accent: '#2b77c9',
  success: '#16a085',
  warning: '#f39c12',
  danger: '#e74c3c',
  text: '#2c3e50',
  textLight: '#7f8c8d',
  border: '#ecf0f1',
  background: '#f8f9fa',
  white: '#ffffff',
  headerBg: '#2c3e50',
};

export const getUserFriendlyPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    cod: 'Cash on Delivery',
    COD: 'Cash on Delivery',
    cash_on_delivery: 'Cash on Delivery',
    online: 'Online Payment',
    card: 'Credit/Debit Card',
    upi: 'UPI Payment',
    netbanking: 'Net Banking',
    wallet: 'Digital Wallet',
    razorpay: 'Razorpay Payment',
    stripe: 'Stripe Payment',
    paypal: 'PayPal',
    paytm: 'Paytm Wallet',
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
  };
  return methods[method?.toLowerCase()] || 'Cash on Delivery';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

export const generateWelcomeEmailHTML = (order: any, user: any): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Received #${order.orderNumber} - V Furnitures</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${
      COLORS.text
    }; background-color: ${COLORS.background}; }
    .email-wrapper { width: 100%; background-color: ${COLORS.background}; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background: ${
      COLORS.white
    }; border: 1px solid ${COLORS.border}; border-radius: 8px; overflow: hidden; }
    .header { background: ${COLORS.headerBg}; color: ${
    COLORS.white
  }; text-align: center; padding: 24px; height: 100px; display: flex; flex-direction: column; justify-content: center; }
    .brand-logo { font-size: 20px; font-weight: 700; margin-bottom: 4px; letter-spacing: 1px; }
    .status-message { font-size: 14px; opacity: 0.95; }
    .content-section { padding: 24px; border-bottom: 1px solid ${COLORS.border}; }
    .content-section:last-child { border-bottom: none; }
    .section-title { font-size: 18px; font-weight: 600; color: ${
      COLORS.text
    }; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${COLORS.border}; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
    .info-card { padding: 16px; border: 1px solid ${
      COLORS.border
    }; border-radius: 6px; background: ${COLORS.background}; }
    .info-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${
      COLORS.textLight
    }; margin-bottom: 4px; letter-spacing: 0.5px; }
    .info-value { font-size: 15px; font-weight: 600; color: ${COLORS.text}; }
    .product-item { display: flex; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid ${
      COLORS.border
    }; }
    .product-item:last-child { border-bottom: none; }
    .product-image { width: 60px; height: 60px; background: ${
      COLORS.background
    }; border: 1px solid ${
    COLORS.border
  }; border-radius: 6px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
    .product-details { flex: 1; min-width: 0; }
    .product-name { font-weight: 600; color: ${COLORS.text}; margin-bottom: 4px; font-size: 15px; }
    .product-quantity { font-size: 12px; color: ${COLORS.textLight}; background: ${
    COLORS.background
  }; border: 1px solid ${
    COLORS.border
  }; padding: 2px 8px; border-radius: 4px; display: inline-block; }
    .product-price { font-weight: 700; color: ${
      COLORS.primary
    }; font-size: 16px; text-align: right; min-width: 80px; }
    .total-section { background: ${COLORS.background}; border: 2px solid ${
    COLORS.primary
  }; padding: 20px; border-radius: 6px; margin: 16px 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 700; color: ${
      COLORS.primary
    }; margin-bottom: 8px; }
    .total-row:last-child { margin-bottom: 0; }
    .payment-status { font-size: 14px; font-weight: 600; color: ${
      COLORS.success
    }; text-transform: uppercase; letter-spacing: 0.5px; }
    .address-card { background: ${COLORS.background}; border: 1px solid ${
    COLORS.border
  }; padding: 16px; border-radius: 6px; font-size: 14px; line-height: 1.6; }
    .cta-button { display: inline-block; background: ${COLORS.primary}; color: ${
    COLORS.white
  }; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 16px 0; border: none; cursor: pointer; }
    .footer { background: ${COLORS.text}; color: ${
    COLORS.white
  }; padding: 24px; text-align: center; }
    .footer-brand { font-size: 20px; font-weight: 700; margin-bottom: 8px; letter-spacing: 1px; }
    .footer-text { color: #bdc3c7; font-size: 14px; line-height: 1.5; margin: 8px 0; }
    .contact-info { margin: 16px 0; font-size: 13px; color: #bdc3c7; }
    .contact-info a { color: #bdc3c7; text-decoration: none; }
    @media screen and (max-width: 600px) {
      .email-wrapper { padding: 0; }
      .email-container { border-radius: 0; border-left: none; border-right: none; }
      .header { padding: 20px 16px; }
      .content-section { padding: 16px; }
      .info-grid { grid-template-columns: 1fr; gap: 12px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <div class="brand-logo">V FURNITURES</div>
        <div class="status-message">Order Received Successfully</div>
      </div>
      
      <div class="content-section">
        <div class="section-title">Order Summary</div>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Order Number</div>
            <div class="info-value">#${order.orderNumber}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Order Date</div>
            <div class="info-value">${formatDate(order.createdAt)}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${getUserFriendlyPaymentMethod(order.paymentMethod)}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Order Status</div>
            <div class="info-value">Order Received</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <div class="section-title">Your Products</div>
        ${order.items
          .map(
            (item: any) => `
          <div class="product-item">
            <div class="product-image">🪑</div>
            <div class="product-details">
              <div class="product-name">${item.name}</div>
              <div class="product-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="product-price">${formatCurrency(item.price * item.quantity)}</div>
          </div>
        `,
          )
          .join('')}
        
        <div class="total-section">
          <div class="total-row">
            <span>Total Amount</span>
            <span>${formatCurrency(order.totalAmount)}</span>
          </div>
          ${
            order.paymentStatus === 'paid'
              ? '<div class="total-row"><span></span><span class="payment-status">PAID</span></div>'
              : ''
          }
        </div>
      </div>
      
      <div class="content-section">
        <div class="section-title">Shipping Address</div>
        <div class="address-card">
          <strong>${order.shippingAddress.fullName}</strong><br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${
    order.shippingAddress.postalCode
  }<br>
          ${order.shippingAddress.country}<br><br>
          <strong>Phone:</strong> ${order.shippingAddress.phone}
        </div>
      </div>
      
      <div class="content-section">
        <div class="section-title">What's Next?</div>
        <p style="color: ${
          COLORS.textLight
        }; margin-bottom: 16px;">Your order will be confirmed within 24 hours. Our craftsmen will then begin creating your premium furniture with attention to detail.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${
    order._id
  }" class="cta-button">View Order Details</a>
      </div>
      
      <div class="footer">
        <div class="footer-brand">V FURNITURES</div>
        <div class="footer-text">Premium Quality • Timeless Design • Exceptional Service</div>
        <div class="contact-info">
          <a href="mailto:vfurnitureshelp@gmail.com">vfurnitureshelp@gmail.com</a><br>
          www.vfurnitures.com
        </div>
        <div class="footer-text" style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};
