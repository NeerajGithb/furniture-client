import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from "@/lib/dbConnect";
import Product from '@/models/product';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    // Get all published products with variety
    const allProducts = await Product.find({ 
      isPublished: { $ne: false },
      inStockQuantity: { $gt: 0 }
    })
    .populate('categoryId', 'name slug')
    .populate('subCategoryId', 'name slug')
    .sort({ createdAt: -1 })
    .lean()
    .exec();

    // Create diverse showcase selection
    const showcaseProducts = selectDiverseProducts(allProducts, 50);

    console.log(`[SHOWCASE API] Selected ${showcaseProducts.length} diverse products (${Date.now() - startTime}ms)`);

    const response = NextResponse.json({
      products: showcaseProducts,
      total: showcaseProducts.length,
      meta: {
        fetchTime: Date.now() - startTime,
        diversityApplied: true
      }
    });

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;

  } catch (error) {
    console.error('[SHOWCASE API ERROR]', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      products: [],
      total: 0
    }, { status: 500 });
  }
}

function selectDiverseProducts(products: any[], maxCount: number = 50): any[] {
  if (products.length <= maxCount) return products;

  const selected: any[] = [];
  const usedCategories = new Map<string, number>();
  const usedSubCategories = new Map<string, number>();
  const usedMaterials = new Map<string, number>();
  
  // First pass: select one from each category/subcategory
  for (const product of products) {
    if (selected.length >= maxCount) break;
    
    const categoryKey = product.categoryId?._id?.toString();
    const subCategoryKey = product.subCategoryId?._id?.toString();
    const materialKey = product.material?.toLowerCase();
    
    // Check if we can add this product for diversity
    const categoryCount = usedCategories.get(categoryKey) || 0;
    const subCategoryCount = usedSubCategories.get(subCategoryKey) || 0;
    const materialCount = usedMaterials.get(materialKey) || 0;
    
    // Allow if not too concentrated in any dimension
    if (categoryCount < 3 && subCategoryCount < 2 && materialCount < 4) {
      selected.push(product);
      
      if (categoryKey) usedCategories.set(categoryKey, categoryCount + 1);
      if (subCategoryKey) usedSubCategories.set(subCategoryKey, subCategoryCount + 1);
      if (materialKey) usedMaterials.set(materialKey, materialCount + 1);
    }
  }
  
  // Second pass: fill remaining slots with spacing
  const remainingSlots = maxCount - selected.length;
  if (remainingSlots > 0) {
    const remaining = products.filter(p => !selected.find(s => s._id.toString() === p._id.toString()));
    
    for (let i = 0; i < remaining.length && selected.length < maxCount; i += Math.ceil(remaining.length / remainingSlots)) {
      selected.push(remaining[i]);
    }
  }
  
  return selected.slice(0, maxCount);
}