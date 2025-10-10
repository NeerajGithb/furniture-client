import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/dbConnect';
import Wishlist from '@/models/Wishlist';

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Product IDs array is required' }, { status: 400 });
    }

    await connectDB();

    const wishlist = await Wishlist.findOne({ userId: user.userId });
    if (!wishlist) {
      return NextResponse.json({
        wishlistedProducts: [],
      });
    }

    const wishlistedProducts = productIds.filter((productId) =>
      wishlist.items.some((item: any) => item.productId.toString() === productId),
    );

    return NextResponse.json({
      wishlistedProducts,
    });
  } catch (error) {
    console.error('Wishlist check error:', error);
    return NextResponse.json({ error: 'Failed to check wishlist status' }, { status: 500 });
  }
});
