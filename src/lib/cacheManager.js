// lib/cacheManager.js

class CacheManager {
  constructor() {
    // In-memory caches with TTL
    this.searchCache = new Map();
    this.suggestionCache = new Map();
    this.rateLimitCache = new Map();
    
    // Cache settings
    this.SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.SUGGESTION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    this.MAX_REQUESTS_PER_WINDOW = 30;
    
    // Auto-cleanup intervals
    this.startCleanupIntervals();
  }

  /**
   * Generate cache key for search queries
   */
  generateSearchKey(query, page, pageSize) {
    const normalizedQuery = query.toLowerCase().trim();
    return `search:${normalizedQuery}:${page}:${pageSize}`;
  }

  /**
   * Generate cache key for suggestions
   */
  generateSuggestionKey(query) {
    return `suggest:${query.toLowerCase().trim()}`;
  }

  /**
   * Get client identifier for rate limiting
   */
  getClientId(request) {
    // Use multiple fallbacks for client identification
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddress = request.headers.get('remote-addr');
    
    return forwarded?.split(',')[0]?.trim() || 
           realIP || 
           remoteAddress || 
           'unknown';
  }

  /**
   * Check if client is rate limited
   */
  isRateLimited(clientId) {
    try {
      const now = Date.now();
      const windowStart = now - this.RATE_LIMIT_WINDOW;
      
      if (!this.rateLimitCache.has(clientId)) {
        this.rateLimitCache.set(clientId, []);
      }
      
      const requests = this.rateLimitCache.get(clientId);
      
      // Remove old requests outside the window
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      this.rateLimitCache.set(clientId, recentRequests);
      
      // Check if limit exceeded
      if (recentRequests.length >= this.MAX_REQUESTS_PER_WINDOW) {
        return true;
      }
      
      // Add current request
      recentRequests.push(now);
      this.rateLimitCache.set(clientId, recentRequests);
      
      return false;
    } catch (error) {
      console.error('Rate limiting error:', error);
      return false; // Allow request if rate limiting fails
    }
  }

  /**
   * Get cached search result
   */
  getCachedSearch(query, page, pageSize) {
    try {
      const key = this.generateSearchKey(query, page, pageSize);
      const cached = this.searchCache.get(key);
      
      if (!cached) {
        return { cacheHit: false };
      }
      
      // Check TTL
      if (Date.now() - cached.timestamp > this.SEARCH_CACHE_TTL) {
        this.searchCache.delete(key);
        return { cacheHit: false };
      }
      
      // Update hit count
      cached.hits = (cached.hits || 0) + 1;
      cached.lastAccess = Date.now();
      
      return {
        cacheHit: true,
        data: cached.data,
        hits: cached.hits,
        cacheAge: Date.now() - cached.timestamp
      };
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return { cacheHit: false };
    }
  }

  /**
   * Set cached search result
   */
  setCachedSearch(query, page, pageSize, data) {
    try {
      const key = this.generateSearchKey(query, page, pageSize);
      
      // Only cache successful results with products
      if (data && data.ok && data.products && data.products.length > 0) {
        this.searchCache.set(key, {
          data,
          timestamp: Date.now(),
          hits: 0,
          lastAccess: Date.now()
        });
        
        // Limit cache size (keep most recent 100 entries)
        if (this.searchCache.size > 100) {
          const oldest = Array.from(this.searchCache.entries())
            .sort((a, b) => a[1].lastAccess - b[1].lastAccess)[0][0];
          this.searchCache.delete(oldest);
        }
      }
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  /**
   * Get cached suggestion result
   */
  getCachedSuggestion(query) {
    try {
      const key = this.generateSuggestionKey(query);
      const cached = this.suggestionCache.get(key);
      
      if (!cached) {
        return { cacheHit: false };
      }
      
      // Check TTL
      if (Date.now() - cached.timestamp > this.SUGGESTION_CACHE_TTL) {
        this.suggestionCache.delete(key);
        return { cacheHit: false };
      }
      
      // Update hit count
      cached.hits = (cached.hits || 0) + 1;
      cached.lastAccess = Date.now();
      
      return {
        cacheHit: true,
        data: cached.data,
        hits: cached.hits,
        cacheAge: Date.now() - cached.timestamp
      };
    } catch (error) {
      console.error('Suggestion cache retrieval error:', error);
      return { cacheHit: false };
    }
  }

  /**
   * Set cached suggestion result
   */
  setCachedSuggestion(query, data) {
    try {
      const key = this.generateSuggestionKey(query);
      
      this.suggestionCache.set(key, {
        data,
        timestamp: Date.now(),
        hits: 0,
        lastAccess: Date.now()
      });
      
      // Limit suggestion cache size
      if (this.suggestionCache.size > 200) {
        const oldest = Array.from(this.suggestionCache.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess)[0][0];
        this.suggestionCache.delete(oldest);
      }
    } catch (error) {
      console.error('Suggestion cache storage error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      searchCacheSize: this.searchCache.size,
      suggestionCacheSize: this.suggestionCache.size,
      rateLimitRecords: this.rateLimitCache.size,
      totalCacheEntries: this.searchCache.size + this.suggestionCache.size
    };
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    try {
      const now = Date.now();
      
      // Clear expired search cache
      for (const [key, value] of this.searchCache.entries()) {
        if (now - value.timestamp > this.SEARCH_CACHE_TTL) {
          this.searchCache.delete(key);
        }
      }
      
      // Clear expired suggestion cache
      for (const [key, value] of this.suggestionCache.entries()) {
        if (now - value.timestamp > this.SUGGESTION_CACHE_TTL) {
          this.suggestionCache.delete(key);
        }
      }
      
      // Clear old rate limit records
      for (const [clientId, requests] of this.rateLimitCache.entries()) {
        const recentRequests = requests.filter(timestamp => 
          now - timestamp <= this.RATE_LIMIT_WINDOW
        );
        
        if (recentRequests.length === 0) {
          this.rateLimitCache.delete(clientId);
        } else {
          this.rateLimitCache.set(clientId, recentRequests);
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Start automatic cleanup intervals
   */
  startCleanupIntervals() {
    // Clean every 2 minutes
    setInterval(() => {
      this.clearExpired();
    }, 2 * 60 * 1000);
    
    // Log stats every 5 minutes in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        );
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Warm up cache with common searches (optional)
   */
  async warmUpCache() {
    const commonSearches = [
      'sofa', 'chair', 'table', 'bed', 'cabinet',
      '3 seater sofa', 'dining table', 'office chair',
      'wooden table', 'leather sofa', 'king bed'
    ];
    
    // This could be called during app initialization
    // Implementation would depend on your specific needs
    
  }

  /**
   * Manual cache invalidation (useful for admin operations)
   */
  invalidateSearchCache(pattern = null) {
    try {
      if (!pattern) {
        this.searchCache.clear();
        return;
      }
      
      // Clear cache entries matching pattern
      for (const key of this.searchCache.keys()) {
        if (key.includes(pattern)) {
          this.searchCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

// Export singleton instance
const cacheManager = new CacheManager();
export default cacheManager;