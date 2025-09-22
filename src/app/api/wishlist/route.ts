import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/dbConnect';
import Wishlist from '@/models/Wishlist';
import Product from '@/models/product';

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    await connectDB();

    let wishlist = await Wishlist.findOne({ userId: user.userId }).populate({
      path: 'items.productId',
      select:
        'name finalPrice originalPrice discountPercent mainImage inStockQuantity ratings reviews isNewArrival isBestSeller material dimensions',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: user.userId, items: [] });
    }

    const allValidItems = wishlist.items.filter((item: any) => item.productId);

    const paginatedItems = allValidItems.slice(skip, skip + limit).map((item: any) => ({
      _id: item._id,
      productId: (item.productId as any)._id,
      product: {
        _id: (item.productId as any)._id,
        name: (item.productId as any).name,
        finalPrice: (item.productId as any).finalPrice,
        originalPrice: (item.productId as any).originalPrice,
        discountPercent: (item.productId as any).discountPercent,
        mainImage: (item.productId as any).mainImage,
        inStockQuantity: (item.productId as any).inStockQuantity,
        isInStock: (item.productId as any).inStockQuantity > 0,
        ratings: (item.productId as any).ratings,
        reviews: (item.productId as any).reviews,
        isNewArrival: (item.productId as any).isNewArrival,
        isBestSeller: (item.productId as any).isBestSeller,
        material: (item.productId as any).material,
        dimensions: (item.productId as any).dimensions,
      },
      addedAt: item.addedAt,
    }));

    if (allValidItems.length !== wishlist.items.length) {
      wishlist.items = allValidItems;
      await wishlist.save();
    }

    const totalItems = allValidItems.length;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let wishlist = await Wishlist.findOne({ userId: user.userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: user.userId, items: [] });
    }

    const existingItem = wishlist.items.find(
      (item: any) => item.productId.toString() === productId,
    );

    if (existingItem) {
      return NextResponse.json({ error: 'Product already in wishlist' }, { status: 400 });
    }

    wishlist.items.unshift({
      productId,
      addedAt: new Date(),
    });

    await wishlist.save();

    try {
      await Product.findByIdAndUpdate(productId, {
        $inc: { wishlistCount: 1 },
      });
    } catch (updateError) {
      console.warn('Failed to update wishlist count:', updateError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Product added to wishlist successfully',
        wishlistCount: wishlist.items.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add product to wishlist' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (!productId && !clearAll) {
      return NextResponse.json(
        { error: 'Product ID or clearAll parameter is required' },
        { status: 400 },
      );
    }

    await connectDB();

    const wishlist = await Wishlist.findOne({ userId: user.userId });
    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    if (clearAll) {
      const productIds = wishlist.items.map((item: any) => item.productId);

      wishlist.items = [];
      await wishlist.save();

      try {
        await Product.updateMany({ _id: { $in: productIds } }, { $inc: { wishlistCount: -1 } });
      } catch (updateError) {
        console.warn('Failed to update wishlist counts:', updateError);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Wishlist cleared successfully',
        },
        { status: 200 },
      );
    } else {
      const initialLength = wishlist.items.length;
      wishlist.items = wishlist.items.filter(
        (item: any) => item.productId.toString() !== productId,
      );

      if (wishlist.items.length === initialLength) {
        return NextResponse.json({ error: 'Product not found in wishlist' }, { status: 404 });
      }

      await wishlist.save();

      try {
        await Product.findByIdAndUpdate(productId, {
          $inc: { wishlistCount: -1 },
        });
      } catch (updateError) {
        console.warn('Failed to update wishlist count:', updateError);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Product removed from wishlist successfully',
          wishlistCount: wishlist.items.length,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
});
