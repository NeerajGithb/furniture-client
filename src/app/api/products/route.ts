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

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24')));

    const category = searchParams.get('category')?.trim();
    const subcategory = searchParams.get('subcategory')?.trim();
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
    const sort = searchParams.get('sort') || 'newest';

    const query: any = {};

    query.isPublished = { $ne: false };

    if (minPrice !== null || maxPrice !== null) {
      query.finalPrice = {};
      if (minPrice !== null && minPrice > 0) query.finalPrice.$gte = minPrice;
      if (maxPrice !== null && maxPrice > 0) query.finalPrice.$lte = maxPrice;
    }

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category }).lean();
      if (categoryDoc && typeof categoryDoc === 'object' && '_id' in categoryDoc) {
        query.categoryId = (categoryDoc as { _id: unknown })._id;
      } else {
        return NextResponse.json({
          products: [],
          pagination: { page, limit, total: 0, pages: 0 },
          filters: { categories: [], materials: [], priceRange: { minPrice: 0, maxPrice: 100000 } },
          message: `Category '${category}' not found`,
        });
      }
    }

    if (subcategory) {
      const subCategoryDoc = await SubCategory.findOne({ slug: subcategory }).lean();
      if (subCategoryDoc && !Array.isArray(subCategoryDoc) && '_id' in subCategoryDoc) {
        query.subCategoryId = (subCategoryDoc as { _id: unknown })._id;
      } else {
        return NextResponse.json({
          products: [],
          pagination: { page, limit, total: 0, pages: 0 },
          filters: { categories: [], materials: [], priceRange: { minPrice: 0, maxPrice: 100000 } },
          message: `Subcategory '${subcategory}' not found`,
        });
      }
    }

    if (material) {
      query.material = { $regex: material, $options: 'i' };
    }

    if (inStock) {
      query.inStockQuantity = { $gt: 0 };
    }

    if (onSale) {
      query.discountPercent = { $gt: 0 };
    }

    if (discount && discount !== '') {
      const discountValue = parseInt(discount);
      if (!isNaN(discountValue) && discountValue > 0) {
        query.discountPercent = { $gte: discountValue };
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

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .populate('subCategoryId', 'name slug')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sortQuery)
        .lean()
        .exec(),
      Product.countDocuments(query),
    ]);

    type CategoryType = { name: string; slug: string };
    type FiltersDataType = {
      categories: CategoryType[];
      materials: string[];
      priceRange: { minPrice: number; maxPrice: number };
    };
    let filtersData: FiltersDataType = {
      categories: [],
      materials: [],
      priceRange: { minPrice: 0, maxPrice: 100000 },
    };

    if (page === 1) {
      const [categories, materials, priceStats] = await Promise.all([
        Category.find({}).select('name slug').lean<CategoryType[]>(),
        Product.distinct('material', {
          material: { $nin: [null, '', undefined] },
          isPublished: { $ne: false },
        }),
        Product.aggregate([
          { $match: { isPublished: { $ne: false } } },
          {
            $group: {
              _id: null,
              minPrice: { $min: '$finalPrice' },
              maxPrice: { $max: '$finalPrice' },
            },
          },
        ]),
      ]);

      filtersData = {
        categories: categories || [],
        materials: (materials || []).filter((m) => m && typeof m === 'string').sort(),
        priceRange: { minPrice: 0, maxPrice: 100000 },
      };
    }

    const responseData = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: filtersData,
      appliedFilters: {
        category: category || null,
        subcategory: subcategory || null,
        material: material || null,
        priceRange:
          minPrice !== null || maxPrice !== null ? { min: minPrice, max: maxPrice } : null,
        inStock: inStock || null,
        onSale: onSale || null,
        discount: discount || null,
        sort,
      },
      meta: {
        fetchTime: Date.now() - startTime,
        cached: false,
        hasMore: page < Math.ceil(total / limit),
      },
    };

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[API ERROR]', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong',
        timestamp: new Date().toISOString(),
        products: [],
        pagination: { page: 1, limit: 24, total: 0, pages: 0 },
        filters: { categories: [], materials: [], priceRange: { minPrice: 0, maxPrice: 100000 } },
      },
      { status: 500 },
    );
  }
}
