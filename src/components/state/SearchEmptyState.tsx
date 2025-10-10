import { EmptyStateProps } from '@/types/props';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { AlertCircle, Search, ShoppingBag } from 'lucide-react';
const SearchEmptyState = ({
  hasFilters,
  onClearFilters,
  isError = false,
  errorMessage = '',
  query = '',
  isFallback = false,
}: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-8 sm:py-12 px-4"
  >
    <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 sm:p-8 text-center max-w-md mx-auto">
      {isError ? (
        <>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {errorMessage || 'We encountered an error while searching.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </>
      ) : !query.trim() ? (
        <>
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start your search</h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Enter a search term to find products
          </p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-6 h-6 text-gray-400" />
          </div>
          {isFallback ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Limited results found</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We found some related products for "{query}", but no exact matches.
                {hasFilters && ' Try adjusting your filters for more results.'}
              </p>
              {hasFilters && (
                <button
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </>
          ) : hasFilters ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We couldn't find any products matching "{query}" with your current filters. Try
                adjusting your search criteria.
              </p>
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Search className="w-4 h-4" />
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We couldn't find any products matching "{query}". Try different search terms.
              </p>
            </>
          )}
        </>
      )}
    </div>
  </motion.div>
);

export default SearchEmptyState;
