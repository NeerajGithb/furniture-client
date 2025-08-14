import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from "@/lib/dbConnect";
import Product from '@/models/product';
import Category from '@/models/category';
import SubCategory from '@/models/subcategory';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12'))); // Cap at 50

    const itemId = searchParams.get('itemId')?.trim();
    const name = searchParams.get('name')?.trim();
    const search = searchParams.get('search')?.trim(); // Support both 'name' and 'search'
    const category = searchParams.get('category')?.trim();
    const subcategory = searchParams.get('subcategory')?.trim();
    const minPrice = Math.max(0, parseFloat(searchParams.get('minPrice') || '0'));
    const maxPrice = Math.min(999999, parseFloat(searchParams.get('maxPrice') || '999999'));
    const material = searchParams.get('material')?.trim();
    const size = searchParams.get('size')?.trim();
    const badge = searchParams.get('badge')?.trim();
    const batch = searchParams.get('batch')?.trim();
    const tags = searchParams.get('tags')?.split(',').filter(t => t.trim()).map(t => t.trim()) || [];
    const createdBefore = searchParams.get('createdBefore');
    const createdAfter = searchParams.get('createdAfter');
    const sort = searchParams.get('sort') || 'newest';

    console.log(`[API] Processing request with params:`, {
      page, limit, itemId, name: name || search, category, subcategory,
      minPrice, maxPrice, material, size, badge, batch, tags,
      createdBefore, createdAfter, sort
    });

    // Build query object
    const query: any = {};

    // Price range (only add if not default values)
    if (minPrice > 0 || maxPrice < 999999) {
      query.finalPrice = {};
      if (minPrice > 0) query.finalPrice.$gte = minPrice;
      if (maxPrice < 999999) query.finalPrice.$lte = maxPrice;
    }

    // Search in name and description
    const searchTerm = name || search;
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Other filters
    if (itemId) query.itemId = itemId;
    if (material) query.material = material;
    if (size) query.size = size;
    if (badge) query.badge = badge;
    if (batch) query.batch = batch;
    if (tags.length > 0) query.tags = { $in: tags };

    // Date range
    if (createdAfter || createdBefore) {
      query.createdAt = {};
      if (createdAfter) {
        const afterDate = new Date(createdAfter);
        if (!isNaN(afterDate.getTime())) {
          query.createdAt.$gte = afterDate;
        }
      }
      if (createdBefore) {
        const beforeDate = new Date(createdBefore);
        if (!isNaN(beforeDate.getTime())) {
          // Set to end of day
          beforeDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = beforeDate;
        }
      }
    }

    // Category and subcategory lookups
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.categoryId = categoryDoc._id;
      } else {
        // Invalid category - return empty results
        return NextResponse.json({
          products: [],
          pagination: { page, limit, total: 0, pages: 0 },
          message: `Category '${category}' not found`
        });
      }
    }

    if (subcategory) {
      const subCategoryDoc = await SubCategory.findOne({ slug: subcategory });
      if (subCategoryDoc) {
        query.subCategoryId = subCategoryDoc._id;
      } else {
        // Invalid subcategory - return empty results
        return NextResponse.json({
          products: [],
          pagination: { page, limit, total: 0, pages: 0 },
          message: `Subcategory '${subcategory}' not found`
        });
      }
    }

    // Sorting
    let sortQuery: any = { createdAt: -1 }; // default
    switch (sort) {
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'name-asc':
        sortQuery = { name: 1 };
        break;
      case 'name-desc':
        sortQuery = { name: -1 };
        break;
      case 'price-low':
        sortQuery = { finalPrice: 1 };
        break;
      case 'price-high':
        sortQuery = { finalPrice: -1 };
        break;
      case 'newest':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    console.log(`[API] Query:`, JSON.stringify(query, null, 2));
    console.log(`[API] Sort:`, sortQuery);

    // Execute queries in parallel for better performance
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .populate('subCategoryId', 'name slug')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sortQuery)
        .exec(),
      Product.countDocuments(query)
    ]);

    const responseData = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      query: {
        searchTerm: searchTerm || null,
        category: category || null,
        subcategory: subcategory || null,
        priceRange: minPrice > 0 || maxPrice < 999999 ? { min: minPrice, max: maxPrice } : null,
        filters: {
          material: material || null,
          size: size || null,
          badge: badge || null,
          tags: tags.length > 0 ? tags : null
        }
      },
      meta: {
        fetchTime: Date.now() - startTime,
        cached: false
      }
    };

    console.log(`[API] Products fetched: ${products.length} / ${total} (${Date.now() - startTime}ms)`);

    return NextResponse.json(responseData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[API ERROR]', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    console.log('[API] Creating new product with data:', data);

    // Validate required fields
    if (!data.name || !data.finalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: name and finalPrice are required' },
        { status: 400 }
      );
    }

    const product = new Product(data);
    await product.save();

    console.log('[API] New product created successfully');

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[API POST ERROR]', errorMessage);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('[API] Product updated successfully');

    return NextResponse.json(product);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API PUT ERROR]', errorMessage);

    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('[API] Product deleted successfully');

    return NextResponse.json({
      message: 'Product deleted successfully',
      deletedProduct: product
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API DELETE ERROR]', errorMessage);

    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}