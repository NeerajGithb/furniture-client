import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import ProductModel from '@/models/product';
import { Product } from '@/types/Product';
import Inspiration, { IInspiration } from '@/models/Inspiration';
import category from '@/models/category';
void category;

async function getInspirationSlugByCategory(categoryId: string) {
  const inspiration = await Inspiration.findOne({
    categories: categoryId,
  })
    .select('slug')
    .lean<IInspiration>()
    .exec();

  return inspiration?.slug || null;
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const startTime = Date.now();
  const resolvedParams = context.params;
  const categoryId = resolvedParams.id;

  if (!categoryId) {
    return NextResponse.json(
      {
        error: 'Category ID is required',
        products: [],
        total: 0,
      },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const categoryProductsRaw = await ProductModel.find({
      categoryId,
      isPublished: { $ne: false },
      inStockQuantity: { $gt: 0 },
    })
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const categoryProducts: Product[] = categoryProductsRaw.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      categoryId: p.categoryId ? { ...p.categoryId, _id: p.categoryId._id.toString() } : undefined,
      subCategoryId: p.subCategoryId
        ? { ...p.subCategoryId, _id: p.subCategoryId._id.toString() }
        : undefined,
    }));

    const slug = await getInspirationSlugByCategory(categoryId);

    const showcaseProducts = selectDiverseProducts(categoryProducts, 50);

    const response = NextResponse.json({
      products: showcaseProducts,
      slug,
      total: showcaseProducts.length,
      meta: {
        fetchTime: Date.now() - startTime,
        categoryId,
        diversityApplied: true,
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[CATEGORY SHOWCASE API ERROR]', error);
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
  const usedSubCategories = new Map<string, number>();
  const usedMaterials = new Map<string, number>();

  for (const product of products) {
    if (selected.length >= maxCount) break;

    const subCategoryKey = product.subCategoryId?._id || '';
    const materialKey = product.material?.toLowerCase() || '';

    const subCategoryCount = usedSubCategories.get(subCategoryKey) || 0;
    const materialCount = usedMaterials.get(materialKey) || 0;

    if (subCategoryCount < 2 && materialCount < 4) {
      selected.push(product);

      usedSubCategories.set(subCategoryKey, subCategoryCount + 1);
      if (materialKey) usedMaterials.set(materialKey, materialCount + 1);
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
