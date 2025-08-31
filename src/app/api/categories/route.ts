
// /api/categories/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Category from "@/models/category";

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
        data: categories
      };
    } catch (error) {
      console.error(`Categories fetch attempt ${attempt} failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a connection error that might benefit from retry
      const isRetryableError = errorMessage.includes('connection') || 
                              errorMessage.includes('timeout') ||
                              errorMessage.includes('ECONNREFUSED') ||
                              errorMessage.includes('MongoNetworkError');
      
      // If this is the last attempt or error is not retryable
      if (attempt === retryCount || !isRetryableError) {
        return {
          success: false,
          error: errorMessage,
          retry: isRetryableError && attempt < retryCount
        };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  return {
    success: false,
    error: "Maximum retry attempts reached"
  };
}

export async function GET() {
  try {
    const result = await fetchCategoriesWithRetry(3);
    
    if (result.success) {
      return NextResponse.json(result.data || []);
    } else {
      // Return fallback empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Unexpected error in categories API:", error);
    // Return fallback empty array
    return NextResponse.json([]);
  }
}
