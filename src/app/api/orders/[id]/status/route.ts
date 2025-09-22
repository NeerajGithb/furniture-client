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

export const PUT = withAuth(
  async (request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) => {
    try {
      const { id } = params;

      if (!id) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }

      const body = await request.json();
      const { status } = body;

      if (!status) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
      }

      const validStatuses = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
      }

      await connectDB();

      const order = await Order.findOne({
        _id: id,
        userId: user.userId,
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      order.orderStatus = status;

      if (status === 'delivered') {
        order.deliveredAt = new Date();

        if (order.paymentMethod === 'cod') {
          order.paymentStatus = 'paid';
        }
      }

      await order.save();

      if (status === 'delivered' && order.paymentMethod === 'cod') {
        const payment = await Payment.findOne({ orderId: order._id });
        if (payment) {
          payment.status = 'paid';
          await payment.save();
        }
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
        deliveredAt: updatedOrder.deliveredAt,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      };

      return NextResponse.json({
        message: 'Order status updated successfully',
        order: formattedOrder,
      });
    } catch (error) {
      console.error('Update order status error:', error);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }
  },
);
