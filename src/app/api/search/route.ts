import { NextRequest, NextResponse } from 'next/server';
import PureSearchService from '@/lib/searchService';
import cacheManager from '@/lib/cacheManager';
import { SuggestionsHandler } from '@/lib/suggestions';
import { connectDB } from '@/lib/dbConnect';
import Product from '@/models/product';
import Category from '@/models/category';
import SubCategory from '@/models/subcategory';
import { Types } from 'mongoose';

interface FilterOptions {
  page: number;
  pageSize: number;
  category?: string;
  subcategory?: string;
  material?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  onSale?: boolean;
  discount?: string;
  sort?: string;
  debug?: boolean;
}

interface SearchResults {
  ok: boolean;
  query?: string;
  normalized?: string;
  classified?: any;
  intent?: any;
  numerics?: any;
  primaryType?: string | null;
  products: any[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
  fallback?: boolean;
  noResults?: boolean;
  suggestion?: string | null;
  relatedCategories?: any[];
  error?: string;
  debug?: any;
}

interface ProductDocument {
  _id: Types.ObjectId;
  name: string;
  finalPrice?: number;
  sellingPrice?: number;
  discountPercent?: number;
  inStockQuantity?: number;
  material?: string;
  categoryId?: Types.ObjectId;
  subCategoryId?: Types.ObjectId;
  createdAt: Date;
  isPublished?: boolean;
}

interface CategoryDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

interface SubCategoryDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const clientId = cacheManager.getClientId(request);
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const pageSize = Math.min(
      60,
      Math.max(1, parseInt(searchParams.get('pageSize') || '24') || 24),
    );
    const suggest = searchParams.get('suggest') === '1';
    const debug = searchParams.get('debug') === '1' && process.env.NODE_ENV === 'development';

    const category = searchParams.get('category')?.trim() || undefined;
    const subcategory = searchParams.get('subcategory')?.trim() || undefined;
    const material = searchParams.get('material')?.trim() || undefined;
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const minPrice = minPriceParam ? Math.max(0, parseFloat(minPriceParam)) : null;
    const maxPrice = maxPriceParam ? Math.max(0, parseFloat(maxPriceParam)) : null;
    const inStock = searchParams.get('inStock') === 'true';
    const onSale = searchParams.get('onSale') === 'true';
    const discount = searchParams.get('discount')?.trim() || undefined;
    const sort = searchParams.get('sort') || 'relevance';

    if (q.length > 200) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Query too long',
        },
        { status: 400 },
      );
    }

    if (!suggest && q.length > 2 && cacheManager.isRateLimited(clientId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Too many requests. Please try again in a minute.',
        },
        { status: 429 },
      );
    }

    if (suggest) {
      return handleSuggestions(q, debug);
    }

    return await handleSearchWithFilters(q, {
      page,
      pageSize,
      category,
      subcategory,
      material,
      minPrice,
      maxPrice,
      inStock,
      onSale,
      discount,
      sort,
      debug,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        products: [],
        page: 1,
        pageSize: 24,
        total: 0,
      },
      { status: 500 },
    );
  }
}

/**
 * Handle suggestion requests with enhanced logic
 */
function handleSuggestions(query: string, debug = false): NextResponse {
  try {
    const startTime = Date.now();

    if (!SuggestionsHandler.shouldCallAPI(query)) {
      const suggestions = SuggestionsHandler.getInstantSuggestions(query);
      const responseTime = Date.now() - startTime;

      const response = NextResponse.json({
        ok: true,
        suggestions: {
          queries: suggestions.suggestions,
          products: [],
          categories: [],
          trending: suggestions.type === 'trending' ? suggestions.suggestions : [],
        },
        fromCache: true,
        type: suggestions.type,
        ...(debug && {
          debug: {
            processingTime: responseTime,
            source: 'client-side',
            queryLength: query.length,
          },
        }),
      });

      response.headers.set('X-Cache', 'CLIENT');
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Suggestions-Count', suggestions.suggestions.length.toString());

      return response;
    }

    const cached = cacheManager.getCachedSuggestion(query);
    if (cached.cacheHit) {
      const response = NextResponse.json({
        ...cached.data,
        ...(debug && {
          debug: {
            cacheHit: true,
            cacheAge: cached.cacheAge,
            cacheHits: cached.hits,
          },
        }),
      });

      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Hits', cached.hits.toString());
      response.headers.set('X-Cache-Age', (cached.cacheAge ?? 0).toString());
      return response;
    }

    const suggestions = SuggestionsHandler.getSmartSuggestions(query);
    const responseTime = Date.now() - startTime;

    const result = {
      ok: true,
      suggestions: {
        queries: suggestions.suggestions,
        products: [],
        categories: [],
        trending: suggestions.type === 'trending' ? suggestions.suggestions : [],
      },
      fromCache: false,
      type: suggestions.type,
      ...(debug && {
        debug: {
          processingTime: responseTime,
          source: 'server-generated',
          suggestionsCount: suggestions.suggestions.length,
        },
      }),
    };

    cacheManager.setCachedSuggestion(query, result);

    const response = NextResponse.json(result);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Response-Time', `${responseTime}ms`);
    response.headers.set('X-Suggestions-Count', suggestions.suggestions.length.toString());

    return response;
  } catch (error) {
    console.error('Suggestions error:', error);

    const fallbackSuggestions = SuggestionsHandler.getInstantSuggestions(query);

    return NextResponse.json({
      ok: true,
      suggestions: {
        queries: fallbackSuggestions.suggestions,
        products: [],
        categories: [],
        trending: [],
      },
      error: 'Suggestions temporarily limited',
      type: 'fallback',
    });
  }
}

/**
 * Enhanced search function with comprehensive filter support
 */
async function handleSearchWithFilters(
  query: string,
  options: FilterOptions,
): Promise<NextResponse> {
  const {
    page,
    pageSize,
    category,
    subcategory,
    material,
    minPrice,
    maxPrice,
    inStock,
    onSale,
    discount,
    sort,
    debug,
  } = options;

  try {
    const startTime = Date.now();

    await connectDB();

    if (query && query.trim()) {
      const cacheKey = `${query}-${JSON.stringify(options)}`;
      const cached = cacheManager.getCachedSearch(cacheKey, page, pageSize);

      if (cached.cacheHit) {
        const response = NextResponse.json({
          ...cached.data,
          ...(debug && {
            debug: {
              cacheHit: true,
              cacheAge: cached.cacheAge,
              cacheHits: cached.hits,
              fromCache: true,
            },
          }),
        });

        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Hits', cached.hits.toString());
        response.headers.set('X-Cache-Age', (cached.cacheAge ?? 0).toString());
        return response;
      }

      const searchOptions = { page, pageSize, suggest: false };
      const results = await PureSearchService.search(query, searchOptions);

      if (results.ok && results.products && results.products.length > 0) {
        const filteredResults = await applyAdditionalFilters(results.products, {
          category,
          subcategory,
          material,
          minPrice,
          maxPrice,
          inStock,
          onSale,
          discount,
          sort,
        });

        results.products = filteredResults.products;
        results.total = filteredResults.total;
        results.hasMore = page < Math.ceil(filteredResults.total / pageSize);
        results.totalPages = Math.ceil(filteredResults.total / pageSize);
      }

      const searchTime = Date.now() - startTime;

      if (results.ok && results.products && results.products.length > 0) {
        cacheManager.setCachedSearch(cacheKey, page, pageSize, results);
      }

      const response = NextResponse.json(results);
      response.headers.set('X-Cache', 'MISS');
      response.headers.set('X-Search-Query', query);
      response.headers.set('X-Search-Time', `${searchTime}ms`);
      return response;
    } else {
      return await handleFilterOnlyRequest({
        page,
        pageSize,
        category,
        subcategory,
        material,
        minPrice,
        maxPrice,
        inStock,
        onSale,
        discount,
        sort,
        debug,
      });
    }
  } catch (error) {
    console.error('Enhanced search execution error:', error);

    return NextResponse.json(
      {
        ok: true,
        query: query || '',
        normalized: '',
        classified: { primary: [], modifiers: [], stopWords: [], regular: [] },
        intent: { primaryType: null, confidence: 0 },
        numerics: {},
        primaryType: null,
        products: [],
        page: page || 1,
        pageSize: pageSize || 24,
        total: 0,
        hasMore: false,
        totalPages: 0,
        error: 'Search temporarily unavailable',
      },
      { status: 200 },
    );
  }
}

/**
 * Handle filter-only requests (no search query)
 */
async function handleFilterOnlyRequest(options: FilterOptions): Promise<NextResponse> {
  const {
    page,
    pageSize,
    category,
    subcategory,
    material,
    minPrice,
    maxPrice,
    inStock,
    onSale,
    discount,
    sort,
    debug,
  } = options;

  const startTime = Date.now();

  try {
    const query: any = {};
    query.isPublished = { $ne: false };

    if (minPrice !== null || maxPrice !== null) {
      query.finalPrice = {};
      if (minPrice !== null && minPrice! > 0) query.finalPrice.$gte = minPrice;
      if (maxPrice !== null && maxPrice! > 0) query.finalPrice.$lte = maxPrice;
    }

    if (category) {
      const categoryDoc = (await Category.findOne({
        slug: category,
      }).lean()) as CategoryDocument | null;
      if (categoryDoc) {
        query.categoryId = categoryDoc._id;
      }
    }

    if (subcategory) {
      const subCategoryDoc = (await SubCategory.findOne({
        slug: subcategory,
      }).lean()) as SubCategoryDocument | null;
      if (subCategoryDoc) {
        query.subCategoryId = subCategoryDoc._id;
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
      case 'relevance':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .populate('subCategoryId', 'name slug')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort(sortQuery)
        .lean()
        .exec(),
      Product.countDocuments(query),
    ]);

    const searchTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / pageSize);

    const results: SearchResults = {
      ok: true,
      query: '',
      normalized: '',
      classified: { primary: [], modifiers: [], stopWords: [], regular: [] },
      intent: { primaryType: 'filter', confidence: 1 },
      numerics: {},
      primaryType: 'filter',
      products,
      page,
      pageSize,
      total,
      hasMore: page < totalPages,
      totalPages,
      fallback: false,
      noResults: total === 0,
      suggestion: null,
      relatedCategories: [],
      ...(debug && {
        debug: {
          searchTime,
          fromCache: false,
          pipelineUsed: 'filter-only',
          resultsFiltered: products.length,
          filtersApplied: {
            category,
            subcategory,
            material,
            minPrice,
            maxPrice,
            inStock,
            onSale,
            discount,
            sort,
          },
        },
      }),
    };

    const response = NextResponse.json(results);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Search-Type', 'filter-only');
    response.headers.set('X-Search-Time', `${searchTime}ms`);
    return response;
  } catch (error) {
    console.error('Filter-only request error:', error);

    return NextResponse.json(
      {
        ok: true,
        query: '',
        products: [],
        page: page || 1,
        pageSize: pageSize || 24,
        total: 0,
        hasMore: false,
        totalPages: 0,
        error: 'Filter search temporarily unavailable',
      },
      { status: 200 },
    );
  }
}

/**
 * Apply additional filters to search results
 */
async function applyAdditionalFilters(
  products: any[],
  filters: {
    category?: string;
    subcategory?: string;
    material?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    inStock?: boolean;
    onSale?: boolean;
    discount?: string;
    sort?: string;
  },
): Promise<{ products: any[]; total: number }> {
  const { category, subcategory, material, minPrice, maxPrice, inStock, onSale, discount, sort } =
    filters;

  let filteredProducts = [...products];

  if (category) {
    const categoryDoc = (await Category.findOne({
      slug: category,
    }).lean()) as CategoryDocument | null;
    if (categoryDoc) {
      filteredProducts = filteredProducts.filter(
        (p: any) => p.categoryId && p.categoryId.toString() === categoryDoc._id.toString(),
      );
    }
  }

  if (subcategory) {
    const subCategoryDoc = (await SubCategory.findOne({
      slug: subcategory,
    }).lean()) as SubCategoryDocument | null;
    if (subCategoryDoc) {
      filteredProducts = filteredProducts.filter(
        (p: any) => p.subCategoryId && p.subCategoryId.toString() === subCategoryDoc._id.toString(),
      );
    }
  }

  if (material) {
    filteredProducts = filteredProducts.filter(
      (p: any) => p.material && p.material.toLowerCase().includes(material.toLowerCase()),
    );
  }

  if (minPrice !== null || maxPrice !== null) {
    filteredProducts = filteredProducts.filter((p: any) => {
      const price = p.finalPrice || p.sellingPrice || 0;
      if (minPrice !== null && price < minPrice!) return false;
      if (maxPrice !== null && price > maxPrice!) return false;
      return true;
    });
  }

  if (inStock) {
    filteredProducts = filteredProducts.filter(
      (p: any) => p.inStockQuantity && p.inStockQuantity > 0,
    );
  }

  if (onSale) {
    filteredProducts = filteredProducts.filter(
      (p: any) => p.discountPercent && p.discountPercent > 0,
    );
  }

  if (discount && discount !== '') {
    const discountValue = parseInt(discount);
    if (!isNaN(discountValue) && discountValue > 0) {
      filteredProducts = filteredProducts.filter(
        (p: any) => p.discountPercent && p.discountPercent >= discountValue,
      );
    }
  }

  if (sort && sort !== 'relevance') {
    switch (sort) {
      case 'price-low':
        filteredProducts.sort((a: any, b: any) => (a.finalPrice || 0) - (b.finalPrice || 0));
        break;
      case 'price-high':
        filteredProducts.sort((a: any, b: any) => (b.finalPrice || 0) - (a.finalPrice || 0));
        break;
      case 'name-asc':
        filteredProducts.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        filteredProducts.sort((a: any, b: any) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'discount':
        filteredProducts.sort(
          (a: any, b: any) => (b.discountPercent || 0) - (a.discountPercent || 0),
        );
        break;
      case 'newest':
        filteredProducts.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }
  }

  return {
    products: filteredProducts,
    total: filteredProducts.length,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientId = cacheManager.getClientId(request);

    if (cacheManager.isRateLimited(clientId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Too many requests. Please try again later.',
        },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      q = '',
      page = 1,
      pageSize = 24,
      suggest = false,
      filters = {},
      debug = false,

      category,
      subcategory,
      material,
      minPrice,
      maxPrice,
      inStock,
      onSale,
      discount,
      sort,
    } = body;

    if (q.length > 200) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Query too long',
        },
        { status: 400 },
      );
    }

    const validPage = Math.max(1, parseInt(page.toString()) || 1);
    const validPageSize = Math.min(60, Math.max(1, parseInt(pageSize.toString()) || 24));

    if (suggest) {
      return handleSuggestions(q.trim(), debug && process.env.NODE_ENV === 'development');
    }

    return await handleSearchWithFilters(q.trim(), {
      page: validPage,
      pageSize: validPageSize,
      category,
      subcategory,
      material,
      minPrice,
      maxPrice,
      inStock,
      onSale,
      discount,
      sort,
      debug: debug && process.env.NODE_ENV === 'development',
    });
  } catch (error) {
    console.error('Search POST API error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        products: [],
        page: 1,
        pageSize: 24,
        total: 0,
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function HEAD(): Promise<NextResponse> {
  const stats = cacheManager.getStats();

  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Cache-Size': stats.totalCacheEntries.toString(),
      'X-Search-Cache': stats.searchCacheSize.toString(),
      'X-Suggestion-Cache': stats.suggestionCacheSize.toString(),
      'X-Rate-Limit-Records': stats.rateLimitRecords.toString(),
      'X-Service-Status': 'healthy',
    },
  });
}

export { cacheManager };
