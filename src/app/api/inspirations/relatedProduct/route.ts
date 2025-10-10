import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Inspiration from '@/models/Inspiration';
import Product from '@/models/product';
import Category from '@/models/category';
import SubCategory from '@/models/subcategory';
import { SortOrder } from 'mongoose';

interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
}
interface PopulatedSubCategory {
  _id: string;
  name: string;
  slug: string;
}
interface InspirationDoc {
  _id: string;
  slug: string;
  title: string;
  categories: PopulatedCategory[];
}
interface CategoryDoc {
  _id: string;
  name: string;
  slug: string;
}
interface SubCategoryDoc {
  _id: string;
  name: string;
  slug: string;
}
interface ProductDoc {
  _id: string;
  name: string;
  description?: string;
  material?: string;
  tags?: string[];
  finalPrice: number;
  categoryId: PopulatedCategory;
  subCategoryId?: PopulatedSubCategory;
  isPublished?: boolean;
  createdAt: Date;
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort');

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    let sortOption: Record<string, SortOrder> | null = null;
    if (sort) {
      switch (sort) {
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'price-low':
          sortOption = { finalPrice: 1 };
          break;
        case 'price-high':
          sortOption = { finalPrice: -1 };
          break;
        default:
          sortOption = { name: 1 };
      }
    }

    let products: ProductDoc[] = [];
    let searchStrategy = 'unknown';

    try {
      const inspiration = await Inspiration.findOne({ slug })
        .populate<{ categories: PopulatedCategory[] }>('categories', 'name slug _id')
        .lean<InspirationDoc>();

      if (inspiration?.categories?.length) {
        searchStrategy = 'inspiration';
        const categoryIds = inspiration.categories.map((c) => c._id);
        const perCategoryLimit = Math.ceil(limit / categoryIds.length);

        const productsByCategory = await Promise.all(
          categoryIds.map(async (categoryId) => {
            if (sortOption) {
              return await Product.find({ categoryId, isPublished: { $ne: false } })
                .populate('categoryId', 'name slug')
                .populate('subCategoryId', 'name slug')
                .sort(sortOption)
                .limit(perCategoryLimit)
                .lean<ProductDoc[]>();
            } else {
              return await Product.aggregate([
                { $match: { categoryId, isPublished: { $ne: false } } },
                { $sample: { size: perCategoryLimit } },
              ]);
            }
          }),
        );

        products = productsByCategory.flat().slice(0, limit);
      }
    } catch (err) {
      console.warn('Inspiration lookup failed:', err);
    }

    if (!products.length) {
      try {
        const category = await Category.findOne({ slug }).lean<CategoryDoc>();
        if (category) {
          searchStrategy = 'category';

          if (sortOption) {
            products = await Product.find({ categoryId: category._id, isPublished: { $ne: false } })
              .populate('categoryId', 'name slug')
              .populate('subCategoryId', 'name slug')
              .sort(sortOption)
              .limit(limit)
              .lean<ProductDoc[]>();
          } else {
            products = await Product.aggregate([
              { $match: { categoryId: category._id, isPublished: { $ne: false } } },
              { $sample: { size: limit } },
            ]);
          }
        }
      } catch (err) {
        console.warn('Category lookup failed:', err);
      }
    }

    if (!products.length) {
      try {
        const subcategory = await SubCategory.findOne({ slug }).lean<SubCategoryDoc>();
        if (subcategory) {
          searchStrategy = 'subcategory';

          if (sortOption) {
            products = await Product.find({
              subCategoryId: subcategory._id,
              isPublished: { $ne: false },
            })
              .populate('categoryId', 'name slug')
              .populate('subCategoryId', 'name slug')
              .sort(sortOption)
              .limit(limit)
              .lean<ProductDoc[]>();
          } else {
            products = await Product.aggregate([
              { $match: { subCategoryId: subcategory._id, isPublished: { $ne: false } } },
              { $sample: { size: limit } },
            ]);
          }
        }
      } catch (err) {
        console.warn('Subcategory lookup failed:', err);
      }
    }

    if (!products.length) {
      try {
        searchStrategy = 'fuzzy';
        const searchTerms = slug.replace(/-/g, ' ').split(' ');
        const searchRegex = new RegExp(searchTerms.join('|'), 'i');

        if (sortOption) {
          products = await Product.find({
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { material: searchRegex },
              { tags: { $in: searchTerms } },
            ],
            isPublished: { $ne: false },
          })
            .populate('categoryId', 'name slug')
            .populate('subCategoryId', 'name slug')
            .sort(sortOption)
            .limit(limit)
            .lean<ProductDoc[]>();
        } else {
          products = await Product.aggregate([
            {
              $match: {
                $or: [
                  { name: searchRegex },
                  { description: searchRegex },
                  { material: searchRegex },
                  { tags: { $in: searchTerms } },
                ],
                isPublished: { $ne: false },
              },
            },
            { $sample: { size: limit } },
          ]);
        }
      } catch (err) {
        console.warn('Fuzzy search failed:', err);
      }
    }

    if (!products.length) {
      searchStrategy = 'random_fallback';

      if (sortOption) {
        products = await Product.find({ isPublished: { $ne: false } })
          .populate('categoryId', 'name slug')
          .populate('subCategoryId', 'name slug')
          .sort(sortOption)
          .limit(limit)
          .lean<ProductDoc[]>();
      } else {
        products = await Product.aggregate([
          { $match: { isPublished: { $ne: false } } },
          { $sample: { size: limit } },
        ]);
      }
    }

    return NextResponse.json({
      products,
      meta: {
        searchStrategy,
        slug,
        totalFound: products.length,
        limit,
        sortApplied: !!sortOption,
      },
    });
  } catch (err) {
    console.error('GET relatedProduct error:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch related products',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
