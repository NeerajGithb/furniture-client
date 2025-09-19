// app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Cart from '@/models/Cart';
import Product from '@/models/product';
import { connectDB } from '@/lib/dbConnect';

// GET - Fetch user's cart
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    await connectDB();

    let cart = await Cart.findOne({ userId: user.userId }).populate({
      path: 'items.productId',
      select: 'name finalPrice originalPrice discountPercent mainImage inStockQuantity',
    });

    if (!cart) {
      cart = await Cart.create({ userId: user.userId, items: [] });
    }

    // Calculate totals and prepare response
    let subtotal = 0;
    const validItems = [];

    for (const item of cart.items) {
      if (item.productId) {
        const product = item.productId as any;
        const itemTotal = product.finalPrice * item.quantity;
        subtotal += itemTotal;

        validItems.push({
          _id: item._id,
          productId: item.productId._id,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant,
          addedAt: item.addedAt,
          itemTotal,
          product: {
            _id: product._id,
            name: product.name,
            finalPrice: product.finalPrice,
            originalPrice: product.originalPrice,
            discountPercent: product.discountPercent,
            mainImage: product.mainImage,
            inStockQuantity: product.inStockQuantity,
            isInStock: product.inStockQuantity > 0,
          },
        });
      }
    }

    // Remove invalid items (products that no longer exist)
    if (validItems.length !== cart.items.length) {
      cart.items = cart.items.filter((item: any) => item.productId);
      await cart.save();
    }

    const cartData = {
      _id: cart._id,
      items: validItems,
      itemCount: validItems.length,
      totalQuantity: validItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      estimatedTotal: subtotal, // Can add shipping, tax later
      updatedAt: cart.updatedAt,
    };

    return NextResponse.json(cartData);
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
});

// POST - Add item to cart
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { productId, quantity = 1, selectedVariant } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }

    await connectDB();

    // Verify product exists and is in stock
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.inStockQuantity !== undefined && product.inStockQuantity < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: user.userId });
    if (!cart) {
      cart = new Cart({ userId: user.userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.productId.toString() === productId,
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (product.inStockQuantity !== undefined && product.inStockQuantity < newQuantity) {
        return NextResponse.json(
          { error: 'Cannot add more items. Insufficient stock' },
          { status: 400 },
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        selectedVariant,
        addedAt: new Date(),
      });
    }

    await cart.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Item added to cart successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
});

// PATCH - Update cart item quantity
export const PATCH = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 });
    }

    if (quantity < 0) {
      return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 });
    }

    await connectDB();

    const cart = await Cart.findOne({ userId: user.userId });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (quantity === 0) {
      // Remove item
      cart.items = cart.items.filter((item: any) => item.productId.toString() !== productId);
    } else {
      // Verify stock
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      if (product.inStockQuantity !== undefined && product.inStockQuantity < quantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }

      // Update quantity
      const itemIndex = cart.items.findIndex(
        (item: any) => item.productId.toString() === productId,
      );

      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
      }
    }

    await cart.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Cart updated successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Cart PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
});

// DELETE - Remove item from cart or clear cart
export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clearAll = searchParams.get('clearAll') === 'true';

    await connectDB();

    const cart = await Cart.findOne({ userId: user.userId });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (clearAll) {
      // Clear entire cart
      cart.items = [];
    } else if (productId) {
      // Remove specific item
      const initialLength = cart.items.length;
      cart.items = cart.items.filter((item: any) => item.productId.toString() !== productId);

      if (cart.items.length === initialLength) {
        return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
      }
    } else {
      return NextResponse.json(
        { error: 'Product ID or clearAll parameter is required' },
        { status: 400 },
      );
    }

    await cart.save();

    return NextResponse.json(
      {
        success: true,
        message: clearAll ? 'Cart cleared successfully' : 'Item removed successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete from cart' }, { status: 500 });
  }
});
