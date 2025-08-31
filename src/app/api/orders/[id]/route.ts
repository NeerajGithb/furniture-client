// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import { connectDB } from '@/lib/dbConnect';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Get order by ID
export const GET = withAuth(async (
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) => {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    console.log("Fetching order by ID:", id, "for user:", user.userId);

    const order = await Order.findOne({
      _id: id,
      userId: user.userId
    }).populate({
      path: 'items.productId',
      select: 'name mainImage slug'
    });

    if (!order) {
      console.log("Order not found with ID:", id, "for user:", user.userId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get payment details
    const payment = await Payment.findOne({ orderId: order._id });

    const orderDetails = {
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
      refundAmount: order.refundAmount,
      refundedAt: order.refundedAt,
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

    console.log("Successfully found order:", orderDetails.orderNumber);

    return NextResponse.json(orderDetails);

  } catch (error) {
    console.error('Order fetch by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
});