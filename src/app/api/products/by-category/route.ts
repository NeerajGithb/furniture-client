import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Product from '@/models/product';
import Category from '@/models/category';
import SubCategory from '@/models/subcategory';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const productsPerCategory = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('productsPerCategory') || '10')),
    );
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';
    const sort = searchParams.get('sort') || 'newest';

    const minPrice = searchParams.get('minPrice')
      ? Math.max(0, parseFloat(searchParams.get('minPrice')!))
      : null;
    const maxPrice = searchParams.get('maxPrice')
      ? Math.max(0, parseFloat(searchParams.get('maxPrice')!))
      : null;
    const material = searchParams.get('material')?.trim();
    const inStock = searchParams.get('inStock') === 'true';
    const onSale = searchParams.get('onSale') === 'true';
    const discount = searchParams.get('discount')?.trim();

    const baseQuery: any = {};

    if (!includeUnpublished) {
      baseQuery.isPublished = { $ne: false };
    }

    if (minPrice !== null || maxPrice !== null) {
      baseQuery.finalPrice = {};
      if (minPrice !== null && minPrice > 0) baseQuery.finalPrice.$gte = minPrice;
      if (maxPrice !== null && maxPrice > 0) baseQuery.finalPrice.$lte = maxPrice;
    }

    if (material) {
      baseQuery.material = { $regex: material, $options: 'i' };
    }

    if (inStock) {
      baseQuery.inStockQuantity = { $gt: 0 };
    }

    if (onSale) {
      baseQuery.discountPercent = { $gt: 0 };
    }

    if (discount && discount !== '') {
      const discountValue = parseInt(discount);
      if (!isNaN(discountValue) && discountValue > 0) {
        baseQuery.discountPercent = { $gte: discountValue };
      }
    }

    let sortQuery: any = { createdAt: -1 };
    switch (sort) {
      case 'price-low':
        sortQuery = { finalPrice: 1, createdAt: -1 };
        break;
      case 'price-high':
        sortQuery = { finalPrice: -1, createdAt: -1 };
        break;
      case 'name-asc':
        sortQuery = { name: 1, createdAt: -1 };
        break;
      case 'name-desc':
        sortQuery = { name: -1, createdAt: -1 };
        break;
      case 'rating':
        sortQuery = { ratings: -1, 'reviews.average': -1, createdAt: -1 };
        break;
      case 'discount':
        sortQuery = { discountPercent: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    const categories = await Category.find({}).select('name slug _id').lean();

    if (!categories || categories.length === 0) {
      return NextResponse.json({
        productsByCategory: [],
        totalProducts: 0,
        totalCategories: 0,
        filters: { categories: [], materials: [], priceRange: { minPrice: 0, maxPrice: 100000 } },
        meta: {
          productsPerCategory,
          fetchTime: Date.now() - startTime,
          cached: false,
        },
      });
    }

    const productsByCategory = await Promise.all(
      categories.map(async (category) => {
        const categoryQuery = {
          ...baseQuery,
          categoryId: category._id,
        };

        const [products, totalInCategory] = await Promise.all([
          Product.find(categoryQuery)
            .populate('categoryId', 'name slug')
            .populate('subCategoryId', 'name slug')
            .sort(sortQuery)
            .limit(productsPerCategory)
            .lean()
            .exec(),
          Product.countDocuments(categoryQuery),
        ]);

        return {
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
          },
          products,
          totalInCategory,
          hasMore: totalInCategory > productsPerCategory,
        };
      }),
    );

    const categoriesWithProducts = productsByCategory.filter((item) => item.products.length > 0);

    const totalProductsReturned = categoriesWithProducts.reduce(
      (sum, item) => sum + item.products.length,
      0,
    );

    const [materials, priceStats] = await Promise.all([
      Product.distinct('material', {
        material: { $nin: [null, '', undefined] },
        ...(includeUnpublished ? {} : { isPublished: { $ne: false } }),
      }),
      Product.aggregate([
        {
          $match: includeUnpublished ? {} : { isPublished: { $ne: false } },
        },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$finalPrice' },
            maxPrice: { $max: '$finalPrice' },
          },
        },
      ]),
    ]);

    const responseData = {
      productsByCategory: categoriesWithProducts,
      totalProducts: totalProductsReturned,
      totalCategories: categoriesWithProducts.length,
      filters: {
        categories: categories || [],
        materials: (materials || []).filter((m) => m && typeof m === 'string').sort(),
        priceRange:
          priceStats.length > 0
            ? { minPrice: priceStats[0].minPrice || 0, maxPrice: priceStats[0].maxPrice || 100000 }
            : { minPrice: 0, maxPrice: 100000 },
      },
      appliedFilters: {
        productsPerCategory,
        material: material || null,
        priceRange:
          minPrice !== null || maxPrice !== null ? { min: minPrice, max: maxPrice } : null,
        inStock: inStock || null,
        onSale: onSale || null,
        discount: discount || null,
        sort,
        includeUnpublished: includeUnpublished || null,
      },
      meta: {
        productsPerCategory,
        fetchTime: Date.now() - startTime,
        cached: false,
        structure: 'Products grouped by category with limit per category',
      },
    };

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[PRODUCTS-BY-CATEGORY-API ERROR]', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong',
        timestamp: new Date().toISOString(),
        productsByCategory: [],
        totalProducts: 0,
        totalCategories: 0,
        filters: { categories: [], materials: [], priceRange: { minPrice: 0, maxPrice: 100000 } },
      },
      { status: 500 },
    );
  }
}
