import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Payment from '@/models/Payment';
import Order from '@/models/Order';
import crypto from 'crypto';
import { connectDB } from '@/lib/dbConnect';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'mock_key';
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET || 'mock_secret';

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { orderId, paymentMethod } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({
      _id: orderId,
      userId: user.userId,
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    if (paymentMethod === 'cod') {
      const payment = await Payment.findOne({ orderId: order._id });
      if (payment) {
        payment.status = 'pending';
        await payment.save();
      }

      return NextResponse.json({
        success: true,
        paymentMethod: 'cod',
        message: 'Order confirmed with Cash on Delivery',
      });
    }

    let payment = await Payment.findOne({ orderId: order._id });

    if (!payment) {
      payment = await Payment.create({
        orderId: order._id,
        userId: user.userId,
        amount: order.totalAmount,
        method: paymentMethod,
        gateway: 'razorpay',
        status: 'pending',
      });
    }

    const razorpayOrder = {
      id: `order_${Date.now()}`,
      amount: order.totalAmount * 100,
      currency: 'INR',
      receipt: order.orderNumber,
    };

    /*
    const Razorpay = require('razorpay');
    const razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_SECRET
    });
    
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.totalAmount * 100,
      currency: 'INR',
      receipt: order.orderNumber
    });
    */

    payment.gatewayTransactionId = razorpayOrder.id;
    await payment.save();

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: RAZORPAY_KEY_ID,
      paymentId: payment.paymentId,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
      customer: {
        name: user.email.split('@')[0],
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { paymentId, orderId, signature, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    await connectDB();

    const payment = await Payment.findOne({
      paymentId,
      userId: user.userId,
    }).populate('orderId');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const order = payment.orderId as any;

    let isSignatureValid = true;

    /*
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    
    isSignatureValid = generatedSignature === razorpaySignature;
    */

    if (isSignatureValid) {
      await payment.markAsSuccess({
        transactionId: razorpayPaymentId,
        orderId: razorpayOrderId,
        signature: razorpaySignature,
      });

      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        },
      });
    } else {
      await payment.markAsFailed('Invalid signature');

      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
});

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');

    if (!paymentId && !orderId) {
      return NextResponse.json({ error: 'Payment ID or Order ID is required' }, { status: 400 });
    }

    await connectDB();

    let query: any = { userId: user.userId };

    if (paymentId) {
      query.paymentId = paymentId;
    } else if (orderId) {
      query.orderId = orderId;
    }

    const payment = await Payment.findOne(query).populate(
      'orderId',
      'orderNumber totalAmount orderStatus',
    );

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: payment._id,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      gateway: payment.gateway,
      gatewayTransactionId: payment.gatewayTransactionId,
      createdAt: payment.createdAt,
      order: payment.orderId
        ? {
            _id: payment.orderId._id,
            orderNumber: payment.orderId.orderNumber,
            totalAmount: payment.orderId.totalAmount,
            orderStatus: payment.orderId.orderStatus,
          }
        : null,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Failed to get payment status' }, { status: 500 });
  }
});
