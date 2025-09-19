// app/api/orders/[id]/route.ts - Enhanced with complete price details
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import { connectDB } from '@/lib/dbConnect';
import { z } from 'zod';
import product from '@/models/product';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Validation schema
const orderIdSchema = z.string().min(1, 'Order ID is required');

// Helper function to format complete order response
function formatCompleteOrderResponse(order: any, payment?: any) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    
    // Enhanced items with complete product details
    items: order.items.map((item: any) => ({
      _id: item._id,
      productId: item.productId?._id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      quantity: item.quantity,
      insuranceCost: item.insuranceCost || 0,
      selectedVariant: item.selectedVariant || null,
      productImage: item.productImage,
      sku: item.sku,
      itemId: item.itemId,
      discount: item.discount || 0,
      discountPercent: item.discountPercent || 0,
      
      // Calculated item totals for display
      itemTotal: item.price * item.quantity,
      originalItemTotal: (item.originalPrice || item.price) * item.quantity,
      itemSavings: ((item.originalPrice || item.price) - item.price) * item.quantity,
      
      product: item.productId ? {
        _id: item.productId._id,
        name: item.productId.name,
        mainImage: item.productId.mainImage,
        slug: item.productId.slug
      } : null
    })),
    
    // Enhanced price breakdown for tracking page
    priceDetails: order.priceDetails ? {
      subtotal: order.priceDetails.subtotal,
      originalSubtotal: order.priceDetails.originalSubtotal,
      totalDiscount: order.priceDetails.totalDiscount,
      totalInsurance: order.priceDetails.totalInsurance,
      shippingCost: order.priceDetails.shippingCost,
      tax: order.priceDetails.tax,
      couponDiscount: order.priceDetails.couponDiscount || 0,
      finalAmount: order.priceDetails.finalAmount,
      savings: order.priceDetails.savings,
      
      // Additional calculated fields for UI
      subtotalWithInsurance: order.priceDetails.subtotal + order.priceDetails.totalInsurance,
      totalBeforeDiscount: order.priceDetails.originalSubtotal + order.priceDetails.totalInsurance + order.priceDetails.shippingCost + order.priceDetails.tax,
      grandTotal: order.priceDetails.finalAmount
    } : {
      // Fallback to legacy calculation if priceDetails not available
      subtotal: order.subtotal,
      originalSubtotal: order.subtotal,
      totalDiscount: order.discount || 0,
      totalInsurance: order.items.reduce((sum: number, item: any) => sum + (item.insuranceCost || 0), 0),
      shippingCost: order.shippingCost,
      tax: order.tax,
      couponDiscount: 0,
      finalAmount: order.totalAmount,
      savings: order.discount || 0,
      subtotalWithInsurance: order.subtotal + order.items.reduce((sum: number, item: any) => sum + (item.insuranceCost || 0), 0),
      totalBeforeDiscount: order.subtotal + order.shippingCost + order.tax,
      grandTotal: order.totalAmount
    },
    
    // Legacy fields for backward compatibility
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    
    // Address and shipping details
    shippingAddress: order.shippingAddress,
    
    // Payment and order status
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    
    // Tracking information
    trackingNumber: order.trackingNumber,
    expectedDeliveryDate: order.expectedDeliveryDate,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
    refundAmount: order.refundAmount,
    refundedAt: order.refundedAt,
    notes: order.notes,
    
    // Additional order details
    insuranceEnabled: order.insuranceEnabled || [],
    couponCode: order.couponCode,
    
    // Timestamps
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    
    // Payment information
    payment: payment ? {
      _id: payment._id,
      paymentId: payment.paymentId,
      status: payment.status,
      method: payment.method,
      gateway: payment.gateway,
      gatewayTransactionId: payment.gatewayTransactionId,
      paidAt: payment.paidAt,
      failureReason: payment.failureReason
    } : null,
    
    // Order summary for tracking display
    orderSummary: {
      totalItems: order.items.length,
      totalQuantity: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      hasInsurance: (order.insuranceEnabled && order.insuranceEnabled.length > 0) || 
                   order.items.some((item: any) => (item.insuranceCost || 0) > 0),
      canCancel: ['pending', 'confirmed'].includes(order.orderStatus),
      canReturn: order.orderStatus === 'delivered' && order.deliveredAt && 
                new Date().getTime() - new Date(order.deliveredAt).getTime() <= (30 * 24 * 60 * 60 * 1000), // 30 days
      estimatedDelivery: order.expectedDeliveryDate,
      orderAge: Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / (24 * 60 * 60 * 1000)) // days
    }
  };
}

// GET - Get order by ID with complete details
export const GET = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) => {
  try {
    const { id } = await params;

    // Validate order ID
    const validatedId = orderIdSchema.parse(id);

    await connectDB();

    

    const order = await Order.findOne({
      _id: validatedId,
      userId: user.userId
    }).populate({
      path: 'items.productId',
      select: 'name mainImage slug finalPrice originalPrice discountPercent'
    });

    if (!order) {
      
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get payment details
    const payment = await Payment.findOne({ orderId: order._id });

    const orderDetails = formatCompleteOrderResponse(order, payment);

    

    return NextResponse.json({
      success: true,
      order: orderDetails
    });

  } catch (error) {
    console.error('[GET] Order fetch by ID error:', error);
    
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

// PUT - Update order (for notes, cancellation, etc.)
export const PUT = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) => {
  try {
    const { id } = await params;
    const body = await request.json();

    );

    // Validate order ID
    const validatedId = orderIdSchema.parse(id);

    await connectDB();

    

    const order = await Order.findOne({
      _id: validatedId,
      userId: user.userId
    }).populate({
      path: 'items.productId',
      select: 'name mainImage slug finalPrice originalPrice discountPercent'
    });

    if (!order) {
      
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle cancellation
    if (body.action === 'cancel') {
      if (!order.canCancel()) {
        return NextResponse.json(
          { 
            error: 'Order cannot be cancelled',
            orderStatus: order.orderStatus
          },
          { status: 400 }
        );
      }

      // Cancel the order
      await order.cancel(body.reason);
      
      // Restore product stock
      for (const item of order.items) {
        await product.findByIdAndUpdate(item.productId, {
          $inc: { 
            inStockQuantity: item.quantity,
            totalSold: -item.quantity
          }
        });
      }

      
    } else {
      // Update allowed fields
      const allowedUpdates = ['notes'];
      const updates: any = {};
      
      allowedUpdates.forEach(field => {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      });

      if (Object.keys(updates).length === 0 && body.action !== 'cancel') {
        
        return NextResponse.json(
          { error: 'No valid updates provided. Expected action: "cancel" or valid fields like "notes"' },
          { status: 400 }
        );
      }

      if (Object.keys(updates).length > 0) {
        Object.assign(order, updates);
        await order.save();
      }
    }

    // Get updated payment details
    const payment = await Payment.findOne({ orderId: order._id });

    const orderDetails = formatCompleteOrderResponse(order, payment);

    

    return NextResponse.json({
      success: true,
      order: orderDetails,
      message: body.action === 'cancel' ? 'Order cancelled successfully' : 'Order updated successfully'
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

// DELETE - Delete order (only cancelled/returned orders)
export const DELETE = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) => {
  try {
    const { id } = await params;

    // Validate order ID
    const validatedId = orderIdSchema.parse(id);

    await connectDB();

    

    const order = await Order.findOne({
      _id: validatedId,
      userId: user.userId
    });

    if (!order) {
      
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of cancelled or returned orders
    if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned') {
      
      return NextResponse.json(
        { 
          error: 'Only cancelled or returned orders can be deleted',
          orderStatus: order.orderStatus
        },
        { status: 400 }
      );
    }

    // Delete related payment records
    await Payment.deleteMany({ orderId: order._id });
    

    // Delete the order
    await Order.findByIdAndDelete(order._id);
    

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