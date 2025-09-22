import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Product from '@/models/product';
import Address from '@/models/Address';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { connectDB } from '@/lib/dbConnect';
import nodemailer from 'nodemailer';

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
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

const getUserFriendlyPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    cod: 'Cash on Delivery',
    COD: 'Cash on Delivery',
    cash_on_delivery: 'Cash on Delivery',
    online: 'Online Payment',
    card: 'Credit/Debit Card',
    upi: 'UPI Payment',
    netbanking: 'Net Banking',
    wallet: 'Digital Wallet',
    razorpay: 'Online Payment',
    stripe: 'Online Payment',
    paypal: 'PayPal',
    paytm: 'Paytm Wallet',
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
  };
  return methods[method?.toLowerCase()] || 'Cash on Delivery';
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

const generateWelcomeEmailHTML = (order: any, user: any): string => {
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
    .header { background: ${COLORS.warning}; color: ${
    COLORS.white
  }; text-align: center; padding: 32px 24px; }
    .brand-logo { font-size: 24px; font-weight: 700; margin-bottom: 8px; letter-spacing: 1px; }
    .status-icon { font-size: 32px; margin-bottom: 12px; display: block; }
    .status-title { font-size: 20px; font-weight: 600; margin: 16px 0 8px; }
    .status-message { font-size: 16px; opacity: 0.95; line-height: 1.5; }
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
    COLORS.warning
  }; padding: 20px; border-radius: 6px; margin: 16px 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 700; color: ${
      COLORS.primary
    }; }
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
      .header { padding: 24px 16px; }
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
        <div class="status-icon">⏳</div>
        <div class="status-title">Order Received Successfully</div>
        <div class="status-message">Thank you for your order! We are reviewing your order details and will confirm shortly.</div>
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

const sendWelcomeEmail = async (order: any, userEmail: string) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: 'V Furnitures',
        address: process.env.EMAIL_USER!,
      },
      to: userEmail,
      subject: `Order Received #${order.orderNumber} - V Furnitures`,
      html: generateWelcomeEmailHTML(order, null),
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const orderNumber = searchParams.get('orderNumber');

    await connectDB();

    let query: any = { userId: user.userId };

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (orderNumber) {
      query.orderNumber = { $regex: orderNumber, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate({
        path: 'items.productId',
        select: 'name mainImage slug',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      items: order.items.map((item: any) => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        insuranceCost: item.insuranceCost || 0,
        productImage: item.productImage,
        selectedVariant: item.selectedVariant || null,
        sku: item.sku,
        itemId: item.itemId,
        discount: item.discount || 0,
        discountPercent: item.discountPercent || 0,
        product: item.productId
          ? {
              _id: item.productId._id,
              name: item.productId.name,
              mainImage: item.productId.mainImage,
              slug: item.productId.slug,
            }
          : null,
      })),
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      expectedDeliveryDate: order.expectedDeliveryDate,
      trackingNumber: order.trackingNumber,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      priceBreakdown: order.priceBreakdown,
      insuranceEnabled: order.insuranceEnabled,
      couponCode: order.couponCode,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();

    const {
      addressId,
      paymentMethod,
      selectedItems,
      cartData,
      totals,
      insuranceEnabled = [],
      couponCode,
    } = body;

    if (!addressId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Address and payment method are required' },
        { status: 400 },
      );
    }

    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return NextResponse.json({ error: 'No items selected for checkout' }, { status: 400 });
    }

    if (!cartData || !Array.isArray(cartData) || cartData.length === 0) {
      return NextResponse.json({ error: 'Cart data is required' }, { status: 400 });
    }

    await connectDB();

    const address = await Address.findOne({
      _id: addressId,
      userId: user.userId,
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const orderItems = [];

    for (const productId of selectedItems) {
      const cartItem = cartData.find((item) => item.productId === productId);

      if (!cartItem) {
        console.error(`Cart item not found for product ID: ${productId}`);
        return NextResponse.json(
          { error: `Selected item not found in cart data: ${productId}` },
          { status: 400 },
        );
      }

      const product = await Product.findById(productId);

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      if (product.inStockQuantity !== undefined && product.inStockQuantity < cartItem.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 },
        );
      }

      const orderItem: any = {
        productId: product._id,
        name: product.name,
        price: product.finalPrice,
        originalPrice: product.originalPrice,
        quantity: cartItem.quantity,
        productImage: product.mainImage?.url,
        sku: product.sku,
        itemId: product.itemId,
        discount: (product.originalPrice || product.finalPrice) - product.finalPrice,
        discountPercent: product.discountPercent || 0,
      };

      if (
        cartItem.selectedVariant &&
        typeof cartItem.selectedVariant === 'object' &&
        cartItem.selectedVariant !== null &&
        (cartItem.selectedVariant.color ||
          cartItem.selectedVariant.size ||
          cartItem.selectedVariant.sku)
      ) {
        orderItem.selectedVariant = cartItem.selectedVariant;
      }

      if (insuranceEnabled.includes(productId)) {
        orderItem.insuranceCost = Math.round(product.finalPrice * cartItem.quantity * 0.02);
      }

      orderItems.push(orderItem);

      await Product.findByIdAndUpdate(product._id, {
        $inc: {
          inStockQuantity: -cartItem.quantity,
          totalSold: cartItem.quantity,
        },
      });
    }

    let subtotal = totals?.subtotal || 0;
    let shippingCost = totals?.shippingCost || 0;
    let insuranceCost = totals?.insuranceCost || 0;
    let totalAmount = totals?.totalAmount || 0;

    if (!totals || totalAmount === 0) {
      subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      shippingCost = subtotal >= 500 ? 0 : 40;

      insuranceCost = 0;
      if (insuranceEnabled && Array.isArray(insuranceEnabled)) {
        for (const item of orderItems) {
          if (insuranceEnabled.includes(item.productId.toString())) {
            insuranceCost += Math.round(item.price * item.quantity * 0.02);
          }
        }
      }

      totalAmount = subtotal + shippingCost + insuranceCost;
    }

    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD${timestamp}${random}`;

    const orderData = {
      userId: user.userId,
      orderNumber,
      items: orderItems,
      subtotal,
      shippingCost,
      tax: 0,
      discount: 0,
      totalAmount,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
      paymentMethod,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: `TRK-${Date.now()}`,

      insuranceEnabled,
      couponCode,
    };

    const order = new Order(orderData);
    await order.save();

    const payment = await Payment.create({
      paymentId: `PAY-${Date.now()}`,
      orderId: order._id,
      userId: user.userId,
      amount: totalAmount,
      method: paymentMethod,
      gateway: paymentMethod === 'cod' ? 'mock' : 'razorpay',
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    });

    if (paymentMethod === 'cod') {
      order.orderStatus = 'confirmed';
      await order.save();
    }

    const userDoc = await User.findById(user.userId);
    if (userDoc?.email) {
      await sendWelcomeEmail(order, userDoc.email);
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        expectedDeliveryDate: order.expectedDeliveryDate,
        shippingAddress: order.shippingAddress,
        items: orderItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          sku: item.sku,
          itemId: item.itemId,
          discount: item.discount,
          discountPercent: item.discountPercent,
        })),

        priceBreakdown: order.priceBreakdown,
        insuranceEnabled: order.insuranceEnabled,
        couponCode: order.couponCode,
      },
      paymentId: payment.paymentId,
    });
  } catch (error) {
    console.error('Order creation error:', error);

    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: `Validation failed: ${validationErrors.join(', ')}` },
        { status: 400 },
      );
    }

    if ((error as any).name === 'CastError') {
      return NextResponse.json(
        { error: `Invalid data format: ${(error as any).message}` },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
});
