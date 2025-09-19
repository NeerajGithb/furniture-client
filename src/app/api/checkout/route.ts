// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Checkout from '@/models/Checkout';
import Cart from '@/models/Cart';
import Product from '@/models/product';
import { connectDB } from '@/lib/dbConnect';
import { nanoid } from 'nanoid';

// POST - Create/Update checkout session
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { selectedItems, insuranceEnabled } = body;

    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return NextResponse.json({ error: 'Selected items are required' }, { status: 400 });
    }

    await connectDB();

    // Validate that the selected items exist in user's cart
    const cart = await Cart.findOne({ userId: user.userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Validate selected items
    const validSelectedItems = selectedItems.filter((productId) =>
      cart.items.some((item: any) => item.productId._id.toString() === productId),
    );

    if (validSelectedItems.length === 0) {
      return NextResponse.json({ error: 'No valid items selected' }, { status: 400 });
    }

    // Generate unique session ID
    const sessionId = nanoid(16);

    // Create checkout items with insurance info
    const checkoutItems = validSelectedItems.map((productId) => {
      const cartItem = cart.items.find((item: any) => item.productId._id.toString() === productId);
      return {
        productId: productId,
        quantity: cartItem.quantity,
        hasInsurance: insuranceEnabled?.includes(productId) || false,
      };
    });

    // Remove any existing checkout session for this user
    await Checkout.deleteMany({ userId: user.userId });

    // Create new checkout session
    const checkout = new Checkout({
      userId: user.userId,
      items: checkoutItems,
      sessionId: sessionId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });

    await checkout.save();

    console.log('Checkout session created:', {
      sessionId,
      userId: user.userId,
      itemCount: checkoutItems.length,
    });

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      message: 'Checkout session created successfully',
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
});

// GET - Get checkout session data
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    await connectDB();

    let checkout;

    if (sessionId) {
      // Get specific session by ID
      checkout = await Checkout.findOne({
        sessionId: sessionId,
        userId: user.userId,
        expiresAt: { $gt: new Date() }, // Only get non-expired sessions
      }).populate({
        path: 'items.productId',
        select: 'name mainImage finalPrice originalPrice discountPercent isInStock inStockQuantity',
      });
    } else {
      // Get latest non-expired checkout session for user
      checkout = await Checkout.findOne({
        userId: user.userId,
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .populate({
          path: 'items.productId',
          select:
            'name mainImage finalPrice originalPrice discountPercent isInStock inStockQuantity',
        });
    }

    if (!checkout) {
      // Clean up expired sessions
      await Checkout.deleteMany({
        userId: user.userId,
        expiresAt: { $lte: new Date() },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No active checkout session found',
        },
        { status: 404 },
      );
    }

    // Validate that all products still exist and are available
    const validItems = checkout.items.filter(
      (item: any) => item.productId && item.productId.isInStock,
    );

    if (validItems.length === 0) {
      // All items are no longer available, delete the session
      await Checkout.deleteOne({ _id: checkout._id });
      return NextResponse.json(
        {
          success: false,
          error: 'All items in checkout are no longer available',
        },
        { status: 400 },
      );
    }

    // If some items are no longer available, update the session
    if (validItems.length !== checkout.items.length) {
      checkout.items = validItems;
      await checkout.save();
    }

    // Calculate totals with FIXED shipping threshold (10000 instead of 500)
    let subtotal = 0;
    let insuranceCost = 0;
    let selectedQuantity = 0;

    const formattedItems = validItems.map((item: any) => {
      const product = item.productId;
      const itemTotal = product.finalPrice * item.quantity;
      const itemInsuranceCost = item.hasInsurance ? Math.round(itemTotal * 0.02) : 0;

      subtotal += itemTotal;
      insuranceCost += itemInsuranceCost;
      selectedQuantity += item.quantity;

      return {
        _id: item._id,
        productId: product._id.toString(),
        quantity: item.quantity,
        hasInsurance: item.hasInsurance,
        itemTotal: itemTotal,
        insuranceCost: itemInsuranceCost,
        product: {
          _id: product._id,
          name: product.name,
          mainImage: product.mainImage,
          finalPrice: product.finalPrice,
          originalPrice: product.originalPrice,
          discountPercent: product.discountPercent,
          isInStock: product.isInStock,
          inStockQuantity: product.inStockQuantity,
        },
      };
    });

    // FIXED: Changed from 500 to 10000 for free shipping threshold
    const shippingCost = subtotal >= 10000 ? 0 : 40;
    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + shippingCost + tax + insuranceCost;

    const checkoutData = {
      sessionId: checkout.sessionId,
      items: formattedItems,
      selectedItems: formattedItems.map((item: any) => item.productId),
      insuranceEnabled: formattedItems
        .filter((item: any) => item.hasInsurance)
        .map((item: any) => item.productId),
      selectedAddressId: checkout.selectedAddressId,
      selectedPaymentMethod: checkout.selectedPaymentMethod,
      totals: {
        subtotal,
        insuranceCost,
        shippingCost,
        tax,
        totalAmount,
        selectedQuantity,
      },
      expiresAt: checkout.expiresAt,
      createdAt: checkout.createdAt,
    };

    console.log('Checkout session retrieved:', {
      sessionId: checkout.sessionId,
      itemCount: formattedItems.length,
      totalAmount,
      validItemsCount: validItems.length,
      originalItemsCount: checkout.items.length,
    });

    return NextResponse.json({
      success: true,
      checkout: checkoutData,
    });
  } catch (error) {
    console.error('Get checkout session error:', error);
    return NextResponse.json({ error: 'Failed to get checkout session' }, { status: 500 });
  }
});

// PUT - Update checkout session (address/payment method)
export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { sessionId, selectedAddressId, selectedPaymentMethod } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {};
    if (selectedAddressId) updateData.selectedAddressId = selectedAddressId;
    if (selectedPaymentMethod) updateData.selectedPaymentMethod = selectedPaymentMethod;

    const checkout = await Checkout.findOneAndUpdate(
      { sessionId: sessionId, userId: user.userId },
      updateData,
      { new: true },
    );

    if (!checkout) {
      return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Checkout session updated successfully',
    });
  } catch (error) {
    console.error('Update checkout session error:', error);
    return NextResponse.json({ error: 'Failed to update checkout session' }, { status: 500 });
  }
});

// DELETE - Clear checkout session
export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    await connectDB();

    if (sessionId) {
      // Delete specific session
      await Checkout.deleteOne({
        sessionId: sessionId,
        userId: user.userId,
      });
    } else {
      // Delete all user's checkout sessions
      await Checkout.deleteMany({ userId: user.userId });
    }

    return NextResponse.json({
      success: true,
      message: 'Checkout session cleared successfully',
    });
  } catch (error) {
    console.error('Clear checkout session error:', error);
    return NextResponse.json({ error: 'Failed to clear checkout session' }, { status: 500 });
  }
});
