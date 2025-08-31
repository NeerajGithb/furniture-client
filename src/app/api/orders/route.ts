// app/api/orders/route.ts - FIXED: Only process selected items
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Product from '@/models/product';
import Address from '@/models/Address';
import Payment from '@/models/Payment';
import { connectDB } from '@/lib/dbConnect';

// GET - Fetch user's orders
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log("Fetching orders for user:", user.userId);
    console.log("Request URL:", request.url);
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
        select: 'name mainImage'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      items: order.items.map((item : any) => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        insuranceCost: item.insuranceCost || 0,
        productImage: item.productImage,
        selectedVariant: item.selectedVariant || null,
        product: item.productId ? {
          _id: item.productId._id,
          name: item.productId.name,
          mainImage: item.productId.mainImage
        } : null
      })),
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      expectedDeliveryDate: order.expectedDeliveryDate,
      trackingNumber: order.trackingNumber,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    console.log("Formatted orders:", formattedOrders);

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasMore: page < totalPages
      }
    });

  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
});

// POST - Create new order - FIXED: Use selected items from frontend
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { 
      addressId, 
      paymentMethod,
      selectedItems, 
      cartData,
      totals,
      insuranceEnabled = []
    } = body;

    console.log('Order creation request:', {
      addressId,
      paymentMethod,
      selectedItems: selectedItems?.length || 0,
      cartData: cartData?.length || 0,
      totalAmount: totals?.totalAmount
    });

    if (!addressId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Address and payment method are required' },
        { status: 400 }
      );
    }

    // FIXED: Validate that we have selected items from frontend
    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return NextResponse.json(
        { error: 'No items selected for checkout' },
        { status: 400 }
      );
    }

    if (!cartData || !Array.isArray(cartData) || cartData.length === 0) {
      return NextResponse.json(
        { error: 'Cart data is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get shipping address
    const address = await Address.findOne({ 
      _id: addressId, 
      userId: user.userId 
    });
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // FIXED: Process only selected items instead of entire cart
    const orderItems = [];
    
    console.log(`Processing ${selectedItems.length} selected items for order`);

    for (const productId of selectedItems) {
      // Find the item in cartData
      const cartItem = cartData.find(item => item.productId === productId);
      
      if (!cartItem) {
        console.error(`Cart item not found for product ID: ${productId}`);
        return NextResponse.json(
          { error: `Selected item not found in cart data: ${productId}` },
          { status: 400 }
        );
      }

      // Verify product exists and has sufficient stock
      const product = await Product.findById(productId);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${productId}` },
          { status: 404 }
        );
      }

      if (product.inStockQuantity !== undefined && 
          product.inStockQuantity < cartItem.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      // Create order item from cart item data
      const orderItem: any = {
        productId: product._id,
        name: product.name,
        price: product.finalPrice,
        originalPrice: product.originalPrice,
        quantity: cartItem.quantity,
        productImage: product.mainImage?.url
      };

      // Include selected variant if available
      if (cartItem.selectedVariant && 
          typeof cartItem.selectedVariant === 'object' &&
          cartItem.selectedVariant !== null &&
          (cartItem.selectedVariant.color || cartItem.selectedVariant.size || cartItem.selectedVariant.sku)) {
        orderItem.selectedVariant = cartItem.selectedVariant;
      }

      orderItems.push(orderItem);

      // Update product stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { 
          inStockQuantity: -cartItem.quantity,
          totalSold: cartItem.quantity
        }
      });

      console.log(`Added ${cartItem.quantity}x ${product.name} to order`);
    }

    // FIXED: Use totals from frontend instead of recalculating
    let subtotal = totals?.subtotal || 0;
    let shippingCost = totals?.shippingCost || 0;
    let insuranceCost = totals?.insuranceCost || 0;
    let totalAmount = totals?.totalAmount || 0;

    // Fallback calculation if totals not provided
    if (!totals || totalAmount === 0) {
      console.log('Totals not provided, calculating...');
      subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      shippingCost = subtotal >= 500 ? 0 : 40; // Free shipping above ₹500
      
      // Calculate insurance cost
      insuranceCost = 0;
      if (insuranceEnabled && Array.isArray(insuranceEnabled)) {
        for (const item of orderItems) {
          if (insuranceEnabled.includes(item.productId.toString())) {
            insuranceCost += Math.round((item.price * item.quantity) * 0.02);
          }
        }
      }
      
      totalAmount = subtotal + shippingCost + insuranceCost;
    }

    console.log('Order totals:', { subtotal, shippingCost, insuranceCost, totalAmount });

    // Create order
    const orderData = {
      userId: user.userId,
      items: orderItems,
      subtotal,
      shippingCost,
      tax: 0, // Included in product price
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
        country: address.country
      },
      paymentMethod,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      orderNumber: `ORD-${Date.now()}`,
      trackingNumber: `TRK-${Date.now()}`,
    };

    console.log(`Creating order with ${orderItems.length} items, total: ₹${totalAmount}`);

    const order = new Order(orderData);
    await order.save();

    // FIXED: Don't clear entire cart - let frontend handle removal of only ordered items
    console.log('Order created successfully, frontend will handle cart cleanup');

    // Create payment record
    const payment = await Payment.create({
      paymentId: `PAY-${Date.now()}`,
      orderId: order._id,
      userId: user.userId,
      amount: totalAmount,
      method: paymentMethod,
      gateway: paymentMethod === 'cod' ? 'mock' : 'razorpay',
      status: paymentMethod === 'cod' ? 'pending' : 'pending'
    });

    // For COD, mark order as confirmed
    if (paymentMethod === 'cod') {
      order.orderStatus = 'confirmed';
      await order.save();
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
        items: orderItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      },
      paymentId: payment.paymentId
    });

  } catch (error) {
    console.error('Order creation error:', error);
    
    // Handle specific mongoose validation errors
    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: `Validation failed: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Handle cast errors (like invalid ObjectId)
    if ((error as any).name === 'CastError') {
      return NextResponse.json(
        { error: `Invalid data format: ${(error as any).message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
});