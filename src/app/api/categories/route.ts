import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Category from '@/models/category';

interface CategoryResponse {
  success: boolean;
  data?: any[];
  error?: string;
  retry?: boolean;
}

async function fetchCategoriesWithRetry(retryCount = 3): Promise<CategoryResponse> {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      await connectDB();
      const categories = await Category.find().sort({ name: 1 }).lean();

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      console.error(`Categories fetch attempt ${attempt} failed:`, error);

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
    const result = await fetchCategoriesWithRetry(3);

    if (result.success) {
      return NextResponse.json(result.data || []);
    } else {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Unexpected error in categories API:', error);

    return NextResponse.json([]);
  }
}
