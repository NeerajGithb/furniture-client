import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import SubCategory from '@/models/subcategory';

interface SubCategoryResponse {
  success: boolean;
  data?: any[];
  error?: string;
  retry?: boolean;
}

async function fetchSubCategoriesWithRetry(retryCount = 3): Promise<SubCategoryResponse> {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      await connectDB();
      const subcategories = await SubCategory.find()
        .populate('categoryId', 'name slug')
        .sort({ name: 1 })
        .lean();

      return {
        success: true,
        data: subcategories,
      };
    } catch (error) {
      console.error(`SubCategories fetch attempt ${attempt} failed:`, error);

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

export async function GET() {
  try {
    const result = await fetchSubCategoriesWithRetry(3);

    if (result.success) {
      return NextResponse.json(result.data || []);
    } else {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Unexpected error in subcategories API:', error);

    return NextResponse.json([]);
  }
}
