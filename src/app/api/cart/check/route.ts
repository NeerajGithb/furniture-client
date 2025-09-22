import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/dbConnect';
import Cart from '@/models/Cart';

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Product IDs array is required' }, { status: 400 });
    }

    await connectDB();

    const cart = await Cart.findOne({ userId: user.userId });
    if (!cart) {
      return NextResponse.json({
        cartProducts: [],
      });
    }

    const cartProducts = productIds.filter((productId) =>
      cart.items.some((item: any) => item.productId.toString() === productId),
    );

    return NextResponse.json({
      cartProducts,
    });
  } catch (error) {
    console.error('Cart check error:', error);
    return NextResponse.json({ error: 'Failed to check cart status' }, { status: 500 });
  }
});
