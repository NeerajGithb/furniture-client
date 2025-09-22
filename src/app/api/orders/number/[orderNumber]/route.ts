import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import Product from '@/models/product';
import { connectDB } from '@/lib/dbConnect';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    orderNumber: string;
  }>;
}

const orderNumberSchema = z.string().min(1, 'Order number is required');

function formatCompleteOrderResponse(order: any, payment?: any) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,

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

      itemTotal: item.price * item.quantity,
      originalItemTotal: (item.originalPrice || item.price) * item.quantity,
      itemSavings: ((item.originalPrice || item.price) - item.price) * item.quantity,
      itemInsuranceTotal: item.insuranceCost || 0,

      product: item.productId
        ? {
            _id: item.productId._id,
            name: item.productId.name,
            mainImage: item.productId.mainImage,
            slug: item.productId.slug,
            finalPrice: item.productId.finalPrice,
            originalPrice: item.productId.originalPrice,
            discountPercent: item.productId.discountPercent,
          }
        : null,
    })),

    priceDetails: order.priceDetails
      ? {
          subtotal: order.priceDetails.subtotal,
          originalSubtotal: order.priceDetails.originalSubtotal,
          totalDiscount: order.priceDetails.totalDiscount,
          totalInsurance: order.priceDetails.totalInsurance,
          shippingCost: order.priceDetails.shippingCost,
          tax: order.priceDetails.tax,
          couponDiscount: order.priceDetails.couponDiscount || 0,
          finalAmount: order.priceDetails.finalAmount,
          savings: order.priceDetails.savings,

          itemsSubtotal: order.priceDetails.subtotal,
          insuranceTotal: order.priceDetails.totalInsurance,
          subtotalWithInsurance: order.priceDetails.subtotal + order.priceDetails.totalInsurance,
          totalBeforeCoupon:
            order.priceDetails.subtotal +
            order.priceDetails.totalInsurance +
            order.priceDetails.shippingCost +
            order.priceDetails.tax,
          totalAfterCoupon:
            order.priceDetails.subtotal +
            order.priceDetails.totalInsurance +
            order.priceDetails.shippingCost +
            order.priceDetails.tax -
            (order.priceDetails.couponDiscount || 0),
          grandTotal: order.priceDetails.finalAmount,
          youSaved: order.priceDetails.savings,
        }
      : {
          subtotal: order.subtotal,
          originalSubtotal: order.subtotal,
          totalDiscount: order.discount || 0,
          totalInsurance: order.items.reduce(
            (sum: number, item: any) => sum + (item.insuranceCost || 0),
            0,
          ),
          shippingCost: order.shippingCost,
          tax: order.tax,
          couponDiscount: 0,
          finalAmount: order.totalAmount,
          savings: order.discount || 0,
          itemsSubtotal: order.subtotal,
          insuranceTotal: order.items.reduce(
            (sum: number, item: any) => sum + (item.insuranceCost || 0),
            0,
          ),
          subtotalWithInsurance:
            order.subtotal +
            order.items.reduce((sum: number, item: any) => sum + (item.insuranceCost || 0), 0),
          totalBeforeCoupon: order.subtotal + order.shippingCost + order.tax,
          totalAfterCoupon: order.totalAmount,
          grandTotal: order.totalAmount,
          youSaved: order.discount || 0,
        },

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
    refundAmount: order.refundAmount,
    refundedAt: order.refundedAt,
    notes: order.notes,

    insuranceEnabled: order.insuranceEnabled || [],
    couponCode: order.couponCode,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    payment: payment
      ? {
          _id: payment._id,
          paymentId: payment.paymentId,
          status: payment.status,
          method: payment.method,
          gateway: payment.gateway,
          gatewayTransactionId: payment.gatewayTransactionId,
          paidAt: payment.paidAt,
          failureReason: payment.failureReason,
        }
      : null,

    orderTimeline: generateOrderTimeline(order),

    orderSummary: {
      totalItems: order.items.length,
      totalQuantity: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      hasInsurance:
        (order.insuranceEnabled && order.insuranceEnabled.length > 0) ||
        order.items.some((item: any) => (item.insuranceCost || 0) > 0),
      hasCoupon: !!order.couponCode,
      canCancel: ['pending', 'confirmed'].includes(order.orderStatus),
      canReturn:
        order.orderStatus === 'delivered' &&
        order.deliveredAt &&
        new Date().getTime() - new Date(order.deliveredAt).getTime() <= 30 * 24 * 60 * 60 * 1000,
      estimatedDelivery: order.expectedDeliveryDate,
      orderAge: Math.floor(
        (new Date().getTime() - new Date(order.createdAt).getTime()) / (24 * 60 * 60 * 1000),
      ),
      isRecentOrder:
        new Date().getTime() - new Date(order.createdAt).getTime() <= 24 * 60 * 60 * 1000,
    },
  };
}

function generateOrderTimeline(order: any) {
  const timeline = [];

  timeline.push({
    status: 'placed',
    title: 'Order Placed',
    description: `Order ${order.orderNumber} has been placed successfully`,
    timestamp: order.createdAt,
    completed: true,
    icon: 'check',
  });

  if (['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus)) {
    timeline.push({
      status: 'confirmed',
      title: 'Order Confirmed',
      description: 'Your order has been confirmed and is being processed',
      timestamp: order.createdAt,
      completed: true,
      icon: 'check',
    });
  }

  if (['processing', 'shipped', 'delivered'].includes(order.orderStatus)) {
    timeline.push({
      status: 'processing',
      title: 'Processing',
      description: 'Your order is being prepared for shipment',
      timestamp: order.createdAt,
      completed: true,
      icon: 'package',
    });
  }

  if (['shipped', 'delivered'].includes(order.orderStatus)) {
    timeline.push({
      status: 'shipped',
      title: 'Shipped',
      description: order.trackingNumber
        ? `Shipped with tracking number: ${order.trackingNumber}`
        : 'Your order has been shipped',
      timestamp: order.createdAt,
      completed: true,
      icon: 'truck',
    });
  }

  if (order.orderStatus === 'delivered') {
    timeline.push({
      status: 'delivered',
      title: 'Delivered',
      description: 'Your order has been successfully delivered',
      timestamp: order.deliveredAt || order.createdAt,
      completed: true,
      icon: 'check',
    });
  }

  if (order.orderStatus === 'cancelled') {
    timeline.push({
      status: 'cancelled',
      title: 'Order Cancelled',
      description: order.cancellationReason || 'Your order has been cancelled',
      timestamp: order.cancelledAt || order.updatedAt,
      completed: true,
      icon: 'x',
      type: 'error',
    });
  }

  return timeline;
}

export const GET = withAuth(
  async (request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) => {
    try {
      const { orderNumber } = await params;

      const validatedOrderNumber = orderNumberSchema.parse(orderNumber);

      await connectDB();

      const order = await Order.findOne({
        orderNumber: validatedOrderNumber,
        userId: user.userId,
      }).populate({
        path: 'items.productId',
        select: 'name mainImage slug finalPrice originalPrice discountPercent itemId sku',
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const payment = await Payment.findOne({ orderId: order._id });

      const orderDetails = formatCompleteOrderResponse(order, payment);

      return NextResponse.json({
        success: true,
        order: orderDetails,
      });
    } catch (error) {
      console.error('[GET] Order fetch by number error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
      }

      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
  },
);

export const PUT = withAuth(
  async (request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) => {
    try {
      const { orderNumber } = await params;
      const body = await request.json();

      const validatedOrderNumber = orderNumberSchema.parse(orderNumber);

      await connectDB();

      const order = await Order.findOne({
        orderNumber: validatedOrderNumber,
        userId: user.userId,
      }).populate({
        path: 'items.productId',
        select: 'name mainImage slug finalPrice originalPrice discountPercent',
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (body.action === 'cancel') {
        if (!order.canCancel()) {
          return NextResponse.json(
            {
              error: 'Order cannot be cancelled',
              orderStatus: order.orderStatus,
            },
            { status: 400 },
          );
        }

        await order.cancel(body.reason);

        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: {
              inStockQuantity: item.quantity,
              totalSold: -item.quantity,
            },
          });
        }
      } else {
        const allowedUpdates = ['notes'];
        const updates: any = {};

        allowedUpdates.forEach((field) => {
          if (body[field] !== undefined) {
            updates[field] = body[field];
          }
        });

        if (Object.keys(updates).length > 0) {
          Object.assign(order, updates);
          await order.save();
        }
      }

      const payment = await Payment.findOne({ orderId: order._id });
      const orderDetails = formatCompleteOrderResponse(order, payment);

      return NextResponse.json({
        success: true,
        order: orderDetails,
        message:
          body.action === 'cancel' ? 'Order cancelled successfully' : 'Order updated successfully',
      });
    } catch (error) {
      console.error('[PUT] Order update error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
      }

      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
  },
);

export const DELETE = withAuth(
  async (request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) => {
    try {
      const { orderNumber } = await params;
      const validatedOrderNumber = orderNumberSchema.parse(orderNumber);

      await connectDB();

      const order = await Order.findOne({
        orderNumber: validatedOrderNumber,
        userId: user.userId,
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned') {
        return NextResponse.json(
          {
            error: 'Only cancelled or returned orders can be deleted',
            orderStatus: order.orderStatus,
          },
          { status: 400 },
        );
      }

      await Payment.deleteMany({ orderId: order._id });

      await Order.findByIdAndDelete(order._id);

      return NextResponse.json({
        success: true,
        message: 'Order deleted successfully',
        deletedOrder: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          orderStatus: order.orderStatus,
          deletedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[DELETE] Order deletion error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
      }

      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
  },
);
