// app/api/search/route.js
import { NextRequest, NextResponse } from 'next/server';
import PureSearchService from '@/lib/searchService';
import cacheManager from '@/lib/cacheManager';
import { SuggestionsHandler } from '@/lib/suggestions';

/**
 * GET /api/search - Main search endpoint
 * Query params:
 * - q: search query
 * - page: page number (default: 1)
 * - pageSize: items per page (default: 24, max: 60)
 * - suggest: return suggestions only (1 or 0)
 * - debug: include debug information (1 or 0)
 */
export async function GET(request : NextRequest) {
  try {
    const clientId = cacheManager.getClientId(request);
    const { searchParams } = new URL(request.url);
    console.log('Received search request:', request.url);
    // Extract and validate parameters
    const q = searchParams.get('q')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get('pageSize') || '24') || 24));
    const suggest = searchParams.get('suggest') === '1';
    const debug = searchParams.get('debug') === '1' && process.env.NODE_ENV === 'development';

    // Security validation
    if (q.length > 200) {
      return NextResponse.json({
        ok: false,
        error: 'Query too long'
      }, { status: 400 });
    }

    // Rate limiting (skip for short suggestion queries)
    if (!suggest && q.length > 2 && cacheManager.isRateLimited(clientId)) {
      return NextResponse.json({
        ok: false,
        error: 'Too many requests. Please try again in a minute.'
      }, { status: 429 });
    }

    // Handle suggestions
    if (suggest) {
      return handleSuggestions(q, debug);
    }

    // Handle search
    return await handleSearch(q, page, pageSize, debug);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Internal server error',
      products: [],
      page: 1,
      pageSize: 24,
      total: 0
    }, { status: 500 });
  }
}

/**
 * Handle suggestion requests with enhanced logic
 */
function handleSuggestions(query : string, debug = false) {
  try {
    const startTime = Date.now();

    // Check if we should use API or client-side suggestions
    if (!SuggestionsHandler.shouldCallAPI(query)) {
      // Use instant client-side suggestions
      const suggestions = SuggestionsHandler.getInstantSuggestions(query);
      const responseTime = Date.now() - startTime;

      const response = NextResponse.json({
        ok: true,
        suggestions: {
          queries: suggestions.suggestions,
          products: [],
          categories: [],
          trending: suggestions.type === 'trending' ? suggestions.suggestions : []
        },
        fromCache: true,
        type: suggestions.type,
        ...(debug && {
          debug: {
            processingTime: responseTime,
            source: 'client-side',
            queryLength: query.length
          }
        })
      });

      response.headers.set('X-Cache', 'CLIENT');
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Suggestions-Count', suggestions.suggestions.length.toString());

      return response;
    }

    // For longer queries, check server cache first
    const cached = cacheManager.getCachedSuggestion(query);
    if (cached.cacheHit) {
      const response = NextResponse.json({
        ...cached.data,
        ...(debug && {
          debug: {
            cacheHit: true,
            cacheAge: cached.cacheAge,
            cacheHits: cached.hits
          }
        })
      });
      
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Hits', cached.hits.toString());
      response.headers.set('X-Cache-Age', (cached.cacheAge ?? 0).toString());
      return response;
    }

    // Generate smart suggestions
    const suggestions = SuggestionsHandler.getSmartSuggestions(query);
    const responseTime = Date.now() - startTime;

    const result = {
      ok: true,
      suggestions: {
        queries: suggestions.suggestions,
        products: [],
        categories: [],
        trending: suggestions.type === 'trending' ? suggestions.suggestions : []
      },
      fromCache: false,
      type: suggestions.type,
      ...(debug && {
        debug: {
          processingTime: responseTime,
          source: 'server-generated',
          suggestionsCount: suggestions.suggestions.length
        }
      })
    };

    // Cache the result
    cacheManager.setCachedSuggestion(query, result);

    const response = NextResponse.json(result);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Response-Time', `${responseTime}ms`);
    response.headers.set('X-Suggestions-Count', suggestions.suggestions.length.toString());

    return response;

  } catch (error) {
    console.error('Suggestions error:', error);
    
    // Fallback to basic suggestions
    const fallbackSuggestions = SuggestionsHandler.getInstantSuggestions(query);
    
    return NextResponse.json({
      ok: true,
      suggestions: {
        queries: fallbackSuggestions.suggestions,
        products: [],
        categories: [],
        trending: []
      },
      error: 'Suggestions temporarily limited',
      type: 'fallback'
    });
  }
}

/**
 * Handle search requests with enhanced debugging
 */
type SearchResults = Awaited<ReturnType<typeof PureSearchService.search>> & {
  debug?: {
    searchTime: number;
    fromCache: boolean;
    tokensProcessed: number;
    intentConfidence: number;
    pipelineUsed: string;
    resultsFiltered: number;
  };
};

async function handleSearch(query : string, page : number, pageSize : number, debug = false) {
  try {
    const startTime = Date.now();

    // Check cache first
    const cached = cacheManager.getCachedSearch(query, page, pageSize);
    if (cached.cacheHit) {
      const response = NextResponse.json({
        ...cached.data,
        ...(debug && {
          debug: {
            cacheHit: true,
            cacheAge: cached.cacheAge,
            cacheHits: cached.hits,
            fromCache: true
          }
        })
      });
      
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Hits', cached.hits.toString());
      response.headers.set('X-Cache-Age', (cached.cacheAge ?? 0).toString());
      return response;
    }

    // Perform enhanced search
    const searchOptions = { page, pageSize, suggest: false };
    const results: SearchResults = await PureSearchService.search(query, searchOptions);
    const searchTime = Date.now() - startTime;

    // Ensure consistent response structure
    if (results.ok && results.total !== undefined) {
      const totalPages = Math.ceil(results.total / pageSize);
      results.hasMore = page < totalPages;
      results.totalPages = totalPages;
      results.page = page;
      results.pageSize = pageSize;
    }

    // Add debug information if requested
    if (debug && results.ok) {
      results.debug = {
        searchTime,
        fromCache: false,
        tokensProcessed: results.classified ? Object.keys(results.classified).length : 0,
        intentConfidence: results.intent?.confidence || 0,
        pipelineUsed: results.fallback ? 'fallback' : 'enhanced',
        resultsFiltered: results.products?.length || 0
      };
    }

    // Cache successful results with products
    if (results.ok && results.products && results.products.length > 0) {
      cacheManager.setCachedSearch(query, page, pageSize, results);
    }

    // Add comprehensive response headers
    const response = NextResponse.json(results);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Search-Query', query);
    response.headers.set('X-Search-Normalized', results.normalized || '');
    response.headers.set('X-Search-Results', results.total?.toString() || '0');
    response.headers.set('X-Search-Time', `${searchTime}ms`);
    response.headers.set('X-Search-Page', page.toString());
    response.headers.set('X-Search-PageSize', pageSize.toString());
    response.headers.set('X-Search-Type', results.primaryType || 'general');
    response.headers.set('X-Search-Intent-Confidence', results.intent?.confidence?.toString() || '0');
    response.headers.set('X-Search-Fallback', results.fallback ? '1' : '0');

    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Search execution error:', error);
    
    // Return safe fallback with minimal structure
    return NextResponse.json({
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
      error: 'Search temporarily unavailable'
    }, { status: 200 }); // Return 200 even for errors to maintain UI stability
  }
}

/**
 * POST /api/search - Handle complex search queries
 */
export async function POST(request : Request) {
  try {
    const clientId = cacheManager.getClientId(request);

    // Rate limiting
    if (cacheManager.isRateLimited(clientId)) {
      return NextResponse.json({
        ok: false,
        error: 'Too many requests. Please try again later.'
      }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      q = '', 
      page = 1, 
      pageSize = 24, 
      suggest = false,
      filters = {},
      debug = false 
    } = body;

    // Validate query length
    if (q.length > 200) {
      return NextResponse.json({
        ok: false,
        error: 'Query too long'
      }, { status: 400 });
    }

    // Validate pagination
    const validPage = Math.max(1, parseInt(page.toString()) || 1);
    const validPageSize = Math.min(60, Math.max(1, parseInt(pageSize.toString()) || 24));

    // Handle suggestions via POST
    if (suggest) {
      return handleSuggestions(q.trim(), debug && process.env.NODE_ENV === 'development');
    }

    // Handle search with filters
    const searchOptions = {
      page: validPage,
      pageSize: validPageSize,
      filters,
      debug: debug && process.env.NODE_ENV === 'development'
    };

    return await handleSearch(q.trim(), validPage, validPageSize, debug && process.env.NODE_ENV === 'development');

  } catch (error) {
    console.error('Search POST API error:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Internal server error',
      products: [],
      page: 1,
      pageSize: 24,
      total: 0
    }, { status: 500 });
  }
}

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * HEAD - Health check and cache status endpoint
 */
export async function HEAD() {
  const stats = cacheManager.getStats();
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Cache-Size': stats.totalCacheEntries.toString(),
      'X-Search-Cache': stats.searchCacheSize.toString(),
      'X-Suggestion-Cache': stats.suggestionCacheSize.toString(),
      'X-Rate-Limit-Records': stats.rateLimitRecords.toString(),
      'X-Service-Status': 'healthy'
    }
  });
}
export { cacheManager };