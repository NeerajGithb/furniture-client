import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Order from '@/models/Order';
import Product from '@/models/product';
import Payment from '@/models/Payment';
import { connectDB } from '@/lib/dbConnect';

interface RouteParams {
  params: {
    id: string;
  };
}

export const PUT = withAuth(
  async (request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) => {
    try {
      const { id } = params;

      if (!id) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }

      const body = await request.json();
      const { reason } = body;

      await connectDB();

      const order = await Order.findOne({
        _id: id,
        userId: user.userId,
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (!['pending', 'confirmed'].includes(order.orderStatus)) {
        return NextResponse.json(
          { error: 'Order cannot be cancelled at this stage' },
          { status: 400 },
        );
      }

      if (order.orderStatus === 'cancelled') {
        return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
      }

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            inStockQuantity: item.quantity,
            totalSold: -item.quantity,
          },
        });
      }

      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      if (reason) {
        order.cancellationReason = reason;
      }

      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
        order.refundAmount = order.totalAmount;
        order.refundedAt = new Date();
      }

      await order.save();

      const payment = await Payment.findOne({ orderId: order._id });
      if (payment) {
        payment.status = order.paymentStatus === 'refunded' ? 'refunded' : 'cancelled';
        await payment.save();
      }

      const updatedOrder = await Order.findById(id).populate({
        path: 'items.productId',
        select: 'name mainImage',
      });

      const formattedOrder = {
        _id: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        items: updatedOrder.items.map((item: any) => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          productImage: item.productImage,
          selectedVariant: item.selectedVariant || null,
          product: item.productId
            ? {
                _id: item.productId._id,
                name: item.productId.name,
                mainImage: item.productId.mainImage,
              }
            : null,
        })),
        totalAmount: updatedOrder.totalAmount,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        expectedDeliveryDate: updatedOrder.expectedDeliveryDate,
        trackingNumber: updatedOrder.trackingNumber,
        shippingAddress: updatedOrder.shippingAddress,
        cancelledAt: updatedOrder.cancelledAt,
        cancellationReason: updatedOrder.cancellationReason,
        refundAmount: updatedOrder.refundAmount,
        refundedAt: updatedOrder.refundedAt,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      };

      return NextResponse.json({
        message: 'Order cancelled successfully',
        order: formattedOrder,
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
  },
);
