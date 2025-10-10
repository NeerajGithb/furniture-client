import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import ProductModel from '@/models/product';
import '@/models/category';
import '@/models/subcategory';
import { Product } from '@/types/Product';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    const allProductsRaw = await ProductModel.find({
      isPublished: { $ne: false },
      inStockQuantity: { $gt: 0 },
    })
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const allProducts: Product[] = allProductsRaw.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      categoryId: p.categoryId ? { ...p.categoryId, _id: p.categoryId._id.toString() } : undefined,
      subCategoryId: p.subCategoryId
        ? { ...p.subCategoryId, _id: p.subCategoryId._id.toString() }
        : undefined,
    }));

    const showcaseProducts = selectDiverseProducts(allProducts, 50);

    const response = NextResponse.json({
      products: showcaseProducts,
      total: showcaseProducts.length,
      meta: {
        fetchTime: Date.now() - startTime,
        diversityApplied: true,
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[SHOWCASE API ERROR]', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        products: [],
        total: 0,
      },
      { status: 500 },
    );
  }
}

function selectDiverseProducts(products: Product[], maxCount = 50): Product[] {
  if (products.length <= maxCount) return products;

  const selected: Product[] = [];
  const usedCategories = new Map<string, number>();
  const usedSubCategories = new Map<string, number>();
  const usedMaterials = new Map<string, number>();

  for (const product of products) {
    if (selected.length >= maxCount) break;

    const categoryKey = product.categoryId?._id?.toString() || '';
    const subCategoryKey = product.subCategoryId?._id?.toString() || '';
    const materialKey = product.material?.toLowerCase() || '';

    const categoryCount = usedCategories.get(categoryKey) || 0;
    const subCategoryCount = usedSubCategories.get(subCategoryKey) || 0;
    const materialCount = usedMaterials.get(materialKey) || 0;

    if (categoryCount < 3 && subCategoryCount < 2 && materialCount < 4) {
      selected.push(product);

      usedCategories.set(categoryKey, categoryCount + 1);
      usedSubCategories.set(subCategoryKey, subCategoryCount + 1);
      usedMaterials.set(materialKey, materialCount + 1);
    }
  }

  const remainingSlots = maxCount - selected.length;
  if (remainingSlots > 0) {
    const remaining = products.filter((p) => !selected.find((s) => s._id === p._id));

    for (
      let i = 0;
      i < remaining.length && selected.length < maxCount;
      i += Math.ceil(remaining.length / remainingSlots)
    ) {
      selected.push(remaining[i]);
    }
  }

  return selected.slice(0, maxCount);
}
