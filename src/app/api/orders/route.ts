// app/api/orders/route.ts - MINIMAL FIX: Just fix the orderNumber issue and add new fields
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Product from '@/models/product';
import Address from '@/models/Address';
import Payment from '@/models/Payment';
import { connectDB } from '@/lib/dbConnect';

// GET - Fetch user's orders (UNCHANGED)
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
        select: 'name mainImage slug'
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
        originalPrice: item.originalPrice, // NEW
        quantity: item.quantity,
        insuranceCost: item.insuranceCost || 0,
        productImage: item.productImage,
        selectedVariant: item.selectedVariant || null,
        sku: item.sku, // NEW
        itemId: item.itemId, // NEW
        discount: item.discount || 0, // NEW
        discountPercent: item.discountPercent || 0, // NEW
        product: item.productId ? {
          _id: item.productId._id,
          name: item.productId.name,
          mainImage: item.productId.mainImage,
          slug: item.productId.slug
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
      updatedAt: order.updatedAt,
      
      // NEW FIELDS - Add price breakdown if available
      priceBreakdown: order.priceBreakdown,
      insuranceEnabled: order.insuranceEnabled,
      couponCode: order.couponCode
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

// POST - Create new order - MINIMAL FIX: Just fix orderNumber and add new fields
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    console.log("Body : ---------------------------> ",body);
    const { 
      addressId, 
      paymentMethod,
      selectedItems, 
      cartData,
      totals,
      insuranceEnabled = [],
      couponCode // NEW
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

    // Validate that we have selected items from frontend
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

    // Process only selected items instead of entire cart
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
        originalPrice: product.originalPrice, // NEW - from your product schema
        quantity: cartItem.quantity,
        productImage: product.mainImage?.url,
        sku: product.sku, // NEW
        itemId: product.itemId, // NEW
        discount: (product.originalPrice || product.finalPrice) - product.finalPrice, // NEW - calculate discount
        discountPercent: product.discountPercent || 0 // NEW
      };

      // Include selected variant if available
      if (cartItem.selectedVariant && 
          typeof cartItem.selectedVariant === 'object' &&
          cartItem.selectedVariant !== null &&
          (cartItem.selectedVariant.color || cartItem.selectedVariant.size || cartItem.selectedVariant.sku)) {
        orderItem.selectedVariant = cartItem.selectedVariant;
      }

      // NEW - Add insurance cost if this product has insurance enabled
      if (insuranceEnabled.includes(productId)) {
        orderItem.insuranceCost = Math.round((product.finalPrice * cartItem.quantity) * 0.02); // 2% insurance
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

    // Use totals from frontend instead of recalculating
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

    // FIX: Generate orderNumber explicitly before creating order
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD${timestamp}${random}`;

    // Create order
    const orderData = {
      userId: user.userId,
      orderNumber, // FIX: Explicitly set orderNumber
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
      trackingNumber: `TRK-${Date.now()}`,
      
      // NEW FIELDS
      insuranceEnabled,
      couponCode
    };

    console.log(`Creating order with ${orderItems.length} items, total: ₹${totalAmount}`);

    const order = new Order(orderData);
    await order.save();

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
          price: item.price,
          originalPrice: item.originalPrice, // NEW
          sku: item.sku, // NEW
          itemId: item.itemId, // NEW
          discount: item.discount, // NEW
          discountPercent: item.discountPercent // NEW
        })),
        
        // NEW - Include price breakdown in response
        priceBreakdown: order.priceBreakdown,
        insuranceEnabled: order.insuranceEnabled,
        couponCode: order.couponCode
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