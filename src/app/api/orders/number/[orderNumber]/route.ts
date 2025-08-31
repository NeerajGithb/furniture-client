// app/api/orders/number/[orderNumber]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import { connectDB } from '@/lib/dbConnect';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    orderNumber: string;
  }>;
}

// Validation schemas
const orderNumberSchema = z.string().min(1, 'Order number is required');

// Helper function to find order by number for a user
async function findOrderByNumber(orderNumber: string, userId: string) {
  const order = await Order.findOne({
    orderNumber: orderNumber,
    userId: userId
  }).populate({
    path: 'items.productId',
    select: 'name mainImage slug'
  });

  return order;
}

// Helper function to format order response
function formatOrderResponse(order: any, payment?: any) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    items: order.items.map((item: any) => ({
      _id: item._id,
      productId: item.productId?._id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant || null,
      productImage: item.productImage,
      product: item.productId ? {
        _id: item.productId._id,
        name: item.productId.name,
        mainImage: item.productId.mainImage,
        slug: item.productId.slug
      } : null
    })),
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingNumber: order.trackingNumber,
    expectedDeliveryDate: order.expectedDeliveryDate,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    payment: payment ? {
      _id: payment._id,
      paymentId: payment.paymentId,
      status: payment.status,
      method: payment.method,
      gateway: payment.gateway,
      gatewayTransactionId: payment.gatewayTransactionId
    } : null
  };
}

// GET - Get order by order number
export const GET = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) => {
  try {
    const { orderNumber } = await params;

    // Validate order number
    const validatedOrderNumber = orderNumberSchema.parse(orderNumber);

    await connectDB();

    console.log(`[GET] Fetching order by number: ${validatedOrderNumber} for user: ${user.userId}`);

    const order = await findOrderByNumber(validatedOrderNumber, user.userId);

    if (!order) {
      console.log(`[GET] Order not found with number: ${validatedOrderNumber} for user: ${user.userId}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get payment details
    const payment = await Payment.findOne({ orderId: order._id });

    const orderDetails = formatOrderResponse(order, payment);

    console.log(`[GET] Successfully found order: ${orderDetails.orderNumber}`);

    return NextResponse.json({
      success: true,
      order: orderDetails
    });

  } catch (error) {
    console.error('[GET] Order fetch by number error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
});

// DELETE - Delete order by order number (only cancelled orders)
export const DELETE = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) => {
  try {
    const { orderNumber } = await params;

    // Validate order number
    const validatedOrderNumber = orderNumberSchema.parse(orderNumber);

    await connectDB();

    console.log(`[DELETE] Attempting to delete order: ${validatedOrderNumber} for user: ${user.userId}`);

    const order = await Order.findOne({
      orderNumber: validatedOrderNumber,
      userId: user.userId
    });

    if (!order) {
      console.log(`[DELETE] Order not found with number: ${validatedOrderNumber} for user: ${user.userId}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of cancelled or returned orders
    if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned') {
      console.log(`[DELETE] Attempted to delete non-cancelled or non-returned order: ${validatedOrderNumber}, status: ${order.orderStatus}`);
      return NextResponse.json(
        { 
          error: 'Only cancelled or returned orders can be deleted',
          orderStatus: order.orderStatus
        },
        { status: 400 }
      );
    }

    // Delete related payment records first (if any)
    await Payment.deleteMany({ orderId: order._id });
    console.log(`[DELETE] Deleted payment records for order: ${validatedOrderNumber}`);

    // Delete the order
    await Order.findByIdAndDelete(order._id);
    console.log(`[DELETE] Successfully deleted order: ${validatedOrderNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      deletedOrder: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[DELETE] Order deletion error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// PUT - Update order by order number (for status updates)
export const PUT = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) => {
  try {
    const { orderNumber } = await params;
    const body = await request.json();

    // Validate order number
    const validatedOrderNumber = orderNumberSchema.parse(orderNumber);

    await connectDB();

    console.log(`[PUT] Updating order: ${validatedOrderNumber} for user: ${user.userId}`);

    const order = await findOrderByNumber(validatedOrderNumber, user.userId);

    if (!order) {
      console.log(`[PUT] Order not found with number: ${validatedOrderNumber} for user: ${user.userId}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedUpdates = ['notes'];
    const updates: any = {};
    
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      updates,
      { new: true, runValidators: true }
    ).populate({
      path: 'items.productId',
      select: 'name mainImage slug'
    });

    // Get payment details
    const payment = await Payment.findOne({ orderId: updatedOrder._id });

    const orderDetails = formatOrderResponse(updatedOrder, payment);

    console.log(`[PUT] Successfully updated order: ${orderDetails.orderNumber}`);

    return NextResponse.json({
      success: true,
      order: orderDetails,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('[PUT] Order update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});