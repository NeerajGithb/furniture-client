import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Product from '@/models/product';
import Address from '@/models/Address';
import User from '@/models/User';
import { connectDB } from '@/lib/dbConnect';
import nodemailer from 'nodemailer';
import { generateWelcomeEmailHTML } from '@/utils/orderUtils';

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

const sendOrderConfirmationEmail = async (order: any, userEmail: string) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: 'V Furnitures',
        address: process.env.EMAIL_USER!,
      },
      to: userEmail,
      subject: `Order Confirmed #${order.orderNumber} - V Furnitures`,
      html: generateWelcomeEmailHTML(order, null),
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
    console.log('Order creation request body:', body);

    const {
      addressId,
      paymentMethod,
      selectedItems,
      cartData,
      totals,
      insuranceEnabled = [],
      couponCode,
    } = body;

    // Validation
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

    if (!['cod', 'razorpay'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    await connectDB();

    // Verify address belongs to user
    const address = await Address.findOne({
      _id: addressId,
      userId: user.userId,
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Process order items and validate stock
    const orderItems = [];
    const stockUpdates = [];

    for (const productId of selectedItems) {
      const cartItem = cartData.find((item) => item.productId === productId);

      if (!cartItem) {
        return NextResponse.json(
          { error: `Selected item not found in cart data: ${productId}` },
          { status: 400 },
        );
      }

      const product = await Product.findById(productId);

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      // Stock validation
      if (product.inStockQuantity !== undefined && product.inStockQuantity < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.inStockQuantity}, Requested: ${cartItem.quantity}`,
          },
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

      // Add variant if available
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

      // Add insurance if enabled
      if (insuranceEnabled.includes(productId)) {
        orderItem.insuranceCost = Math.round(product.finalPrice * cartItem.quantity * 0.02);
      }

      orderItems.push(orderItem);

      // Prepare stock update
      stockUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $inc: {
              inStockQuantity: -cartItem.quantity,
              totalSold: cartItem.quantity,
            },
          },
        },
      });
    }

    // Calculate totals if not provided
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

    // Generate unique order number
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD${timestamp}${random}`;

    // Create order data
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
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: `TRK-${Date.now()}`,
      insuranceEnabled,
      couponCode,
    };

    // Create order
    const order = new Order(orderData);
    await order.save();

    // Update product stock using bulk operation
    if (stockUpdates.length > 0) {
      await Product.bulkWrite(stockUpdates);
    }

    // Send email for COD orders only (Razorpay emails will be sent after payment verification)
    if (paymentMethod === 'cod') {
      const userDoc = await User.findById(user.userId);
      if (userDoc?.email) {
        try {
          await sendOrderConfirmationEmail(order, userDoc.email);
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
          // Don't fail the order creation if email fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
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
