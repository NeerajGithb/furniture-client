import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Payment from '@/models/Payment';
import Order from '@/models/Order';
import User from '@/models/User';
import crypto from 'crypto';
import { connectDB } from '@/lib/dbConnect';
import nodemailer from 'nodemailer';
import { generateWelcomeEmailHTML } from '@/utils/orderUtils';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET || '';

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
      subject: `Payment Confirmed - Order #${order.orderNumber} - V Furnitures`,
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

/**
 * POST — Create payment record and initiate payment
 */
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  console.log('--- [POST] Payment creation started ---');
  try {
    const body = await request.json();
    console.log('[POST] Incoming request body:', body);

    const { orderId, paymentMethod } = body;

    if (!orderId) {
      console.error('[POST] Missing orderId');
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!paymentMethod || !['cod', 'razorpay'].includes(paymentMethod)) {
      console.error('[POST] Invalid payment method:', paymentMethod);
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ _id: orderId, userId: user.userId });
    console.log('[POST] Fetched order:', order);

    if (!order) {
      console.error('[POST] Order not found');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      console.warn('[POST] Order already paid');
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    // Check if payment record already exists
    let payment = await Payment.findOne({ orderId: order._id });

    // COD Payment handling
    if (paymentMethod === 'cod') {
      console.log('[POST] Processing COD payment...');

      if (payment) {
        console.log('[POST] Updating existing COD payment status to pending');
        payment.status = 'pending';
        payment.method = 'cod';
        payment.gateway = 'offline';
        await payment.save();
      } else {
        console.log('[POST] Creating new COD payment record');
        payment = await Payment.create({
          paymentId: `PAY-COD-${Date.now()}`,
          orderId: order._id,
          userId: user.userId,
          amount: order.totalAmount,
          method: 'cod',
          gateway: 'offline',
          status: 'pending',
        });
      }

      // For COD, mark order as confirmed immediately
      order.paymentStatus = 'pending';
      order.orderStatus = 'confirmed';
      await order.save();

      console.log('[POST] COD payment setup complete');
      return NextResponse.json({
        success: true,
        paymentMethod: 'cod',
        paymentId: payment.paymentId,
        message: 'Order confirmed with Cash on Delivery',
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        },
      });
    }

    // Razorpay Payment handling
    if (paymentMethod === 'razorpay') {
      console.log('[POST] Processing Razorpay payment...');

      if (!RAZORPAY_KEY_ID || !RAZORPAY_SECRET) {
        console.error('[POST] Razorpay credentials not configured');
        return NextResponse.json(
          {
            error: 'Payment gateway not configured. Please contact support.',
          },
          { status: 500 },
        );
      }

      if (!payment) {
        console.log('[POST] Creating new Razorpay payment record');
        payment = await Payment.create({
          paymentId: `PAY-RZP-${Date.now()}`,
          orderId: order._id,
          userId: user.userId,
          amount: order.totalAmount,
          method: 'card',
          gateway: 'razorpay',
          status: 'pending',
        });
      }

      try {
        console.log('[POST] Creating Razorpay instance...');
        const Razorpay = require('razorpay');
        const razorpayInstance = new Razorpay({
          key_id: RAZORPAY_KEY_ID,
          key_secret: RAZORPAY_SECRET,
        });

        console.log('[POST] Creating Razorpay order...');
        const razorpayOrder = await razorpayInstance.orders.create({
          amount: Math.round(order.totalAmount * 100), // Convert to paise
          currency: 'INR',
          receipt: order.orderNumber,
          notes: {
            orderId: order._id.toString(),
            userId: user.userId,
            paymentId: payment.paymentId,
          },
        });

        console.log('[POST] Razorpay order created:', razorpayOrder);

        // Update payment record with Razorpay order ID
        payment.gatewayTransactionId = razorpayOrder.id;
        await payment.save();
        console.log('[POST] Payment record updated with Razorpay orderId');

        return NextResponse.json({
          success: true,
          paymentMethod: 'razorpay',
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: RAZORPAY_KEY_ID,
          paymentId: payment.paymentId,
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            orderStatus: order.orderStatus,
          },
          customer: {
            name: user.email ? user.email.split('@')[0] : 'Customer',
            email: user.email,
          },
        });
      } catch (razorpayError) {
        console.error('[POST] Razorpay API error:', razorpayError);
        return NextResponse.json(
          {
            error: 'Failed to initialize payment. Please try again.',
          },
          { status: 500 },
        );
      }
    }

    console.error('[POST] Unexpected payment method:', paymentMethod);
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  } catch (error) {
    console.error('[POST] Payment creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment. Please try again.',
      },
      { status: 500 },
    );
  }
});

/**
 * PUT — Verify Razorpay payment
 */
export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  console.log('--- [PUT] Payment verification started ---');
  try {
    const body = await request.json();
    console.log('[PUT] Incoming body:', body);

    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    if (!paymentId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      console.error('[PUT] Missing verification data');
      return NextResponse.json(
        {
          error: 'Missing payment verification data',
        },
        { status: 400 },
      );
    }

    await connectDB();

    const payment = await Payment.findOne({
      paymentId,
      userId: user.userId,
    }).populate('orderId');

    console.log('[PUT] Payment fetched for verification');

    if (!payment) {
      console.error('[PUT] Payment not found');
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'success') {
      console.warn('[PUT] Payment already verified');
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        order: {
          _id: payment.orderId._id,
          orderNumber: payment.orderId.orderNumber,
          orderStatus: payment.orderId.orderStatus,
          paymentStatus: payment.orderId.paymentStatus,
        },
      });
    }

    const order = payment.orderId as any;

    // Verify Razorpay signature
    console.log('[PUT] Verifying Razorpay signature...');
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      console.error('[PUT] Signature verification failed');

      // Mark payment as failed
      payment.status = 'failed';
      payment.failureReason = 'Invalid signature';
      await payment.save();

      return NextResponse.json(
        {
          error: 'Payment verification failed. Please contact support if amount was deducted.',
        },
        { status: 400 },
      );
    }

    console.log('[PUT] Signature verified successfully');

    // Update payment status
    payment.status = 'success';
    payment.gatewayPaymentId = razorpayPaymentId;
    payment.gatewayResponse = {
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    };
    payment.paidAt = new Date();
    await payment.save();

    // Update order status
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    await order.save();

    console.log('[PUT] Order and payment status updated');

    // Send confirmation email for successful Razorpay payment
    try {
      const userDoc = await User.findById(user.userId);
      if (userDoc?.email) {
        const emailResult = await sendOrderConfirmationEmail(order, userDoc.email);
        console.log('[PUT] Email send result:', emailResult);
      }
    } catch (emailError) {
      console.error('[PUT] Failed to send confirmation email:', emailError);
      // Don't fail the payment verification if email fails
    }

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
  } catch (error) {
    console.error('[PUT] Payment verification error:', error);
    return NextResponse.json(
      {
        error: 'Payment verification failed. Please contact support.',
      },
      { status: 500 },
    );
  }
});

/**
 * GET — Get payment status
 */
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  console.log('--- [GET] Payment status check started ---');
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');

    if (!paymentId && !orderId) {
      return NextResponse.json(
        {
          error: 'Payment ID or Order ID is required',
        },
        { status: 400 },
      );
    }

    await connectDB();

    let query: any = { userId: user.userId };
    if (paymentId) query.paymentId = paymentId;
    else if (orderId) query.orderId = orderId;

    const payment = await Payment.findOne(query).populate(
      'orderId',
      'orderNumber totalAmount orderStatus paymentStatus',
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
      gatewayPaymentId: payment.gatewayPaymentId,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      order: payment.orderId
        ? {
            _id: payment.orderId._id,
            orderNumber: payment.orderId.orderNumber,
            totalAmount: payment.orderId.totalAmount,
            orderStatus: payment.orderId.orderStatus,
            paymentStatus: payment.orderId.paymentStatus,
          }
        : null,
    });
  } catch (error) {
    console.error('[GET] Payment status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get payment status',
      },
      { status: 500 },
    );
  }
});
