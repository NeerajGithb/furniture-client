import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Category from '@/models/category';
import Product from '@/models/product';

interface CategoryDetailResponse {
  success: boolean;
  data?: any;
  error?: string;
  retry?: boolean;
}

async function fetchCategoryWithRetry(
  slug: string,
  retryCount = 3,
): Promise<CategoryDetailResponse> {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      await connectDB();

      const category = await Category.findOne({ slug }).lean();

      if (!category) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      const products = await Product.find({
        categoryId: (category as { _id: unknown })._id,
        isPublished: true,
      })
        .select('name slug finalPrice mainImage inStockQuantity')
        .limit(20)
        .lean();

      return {
        success: true,
        data: {
          ...category,
          products,
          productCount: products.length,
        },
      };
    } catch (error) {
      console.error(`Category ${slug} fetch attempt ${attempt} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      const isRetryableError =
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('MongoNetworkError');

      if (attempt === retryCount || !isRetryableError) {
        return {
          success: false,
          error: errorMessage,
          retry: isRetryableError && attempt < retryCount,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }

  return {
    success: false,
    error: 'Maximum retry attempts reached',
  };
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category slug is required',
        },
        { status: 400 },
      );
    }

    const result = await fetchCategoryWithRetry(slug, 3);

    if (result.success) {
      return NextResponse.json({
        success: true,
        ...result.data,
      });
    } else if (result.error === 'Category not found') {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'The requested category does not exist.',
        },
        { status: 404 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          name: slug.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          slug: slug,
          products: [],
          productCount: 0,
          error: result.error,
          message: 'Failed to fetch category details. Using fallback data.',
          retry: result.retry,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('Unexpected error in category detail API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Unexpected error occurred.',
        data: null,
      },
      { status: 500 },
    );
  }
}
