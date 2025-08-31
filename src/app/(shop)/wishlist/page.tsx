"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  ShoppingCart, 
  X, 
  ArrowLeft,
  Share2,
  Filter,
  Grid,
  List,
  Loader2,
  Star,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'price-low' | 'price-high' | 'name';

const WishlistPage = () => {
  const { user } = useCurrentUser();
  const router = useRouter();
  
  // Zustand stores
  const {
    wishlist,
    loading,
    initialized,
    initializeWishlist,
    removeFromWishlist,
    clearWishlist,
    isUpdating: isWishlistUpdating
  } = useWishlistStore();

  const {
    addToCart,
    isUpdating: isCartUpdating,
    initializeCart
  } = useCartStore();

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Initialize stores when user is available
  useEffect(() => {
    if (user?._id && !initialized) {
      initializeWishlist();
      initializeCart();
    }
  }, [user, initialized, initializeWishlist, initializeCart]);

  const handleRemoveFromWishlist = async (productId: string) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  const handleMoveToCart = async (productId: string) => {
    const addSuccess = await addToCart(productId, 1);
    if (addSuccess) {
      await removeFromWishlist(productId);
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      await clearWishlist();
    }
  };

  const shareWishlist = async () => {
    try {
      await navigator.share({
        title: 'My Wishlist',
        text: 'Check out my wishlist!',
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // You might want to show a toast here
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
      }
    }
  };

  const getSortedAndFilteredItems = () => {
    if (!wishlist?.items) return [];

    let items = [...wishlist.items];

    // Filter by category
    if (filterCategory !== 'all') {
      items = items.filter(item => 
        item.product?.category?.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    // Sort items
    switch (sortBy) {
      case 'recent':
        items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
      case 'price-low':
        items.sort((a, b) => (a.product?.finalPrice || 0) - (b.product?.finalPrice || 0));
        break;
      case 'price-high':
        items.sort((a, b) => (b.product?.finalPrice || 0) - (a.product?.finalPrice || 0));
        break;
      case 'name':
        items.sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));
        break;
    }

    return items;
  };

  const getUniqueCategories = () => {
    if (!wishlist?.items) return [];
    const categories = wishlist.items
      .map(item => item.product?.category)
      .filter(Boolean)
      .filter((category, index, array) => array.indexOf(category) === index);
    return categories;
  };

  // Loading state
  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-sm shadow-lg">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Please Login
          </h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your wishlist.
          </p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition-colors rounded"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && !initialized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-sm">
                  <div className="w-full h-48 bg-gray-300 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !wishlist || wishlist.items.length === 0;
  const filteredItems = getSortedAndFilteredItems();
  const categories = getUniqueCategories();
  const itemCount = wishlist?.itemCount ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Wishlist {itemCount > 0 && `(${itemCount})`}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Items you've saved for later
              </p>
            </div>
          </div>
          
          {!isEmpty && (
            <div className="flex items-center gap-3">
              <button
                onClick={shareWishlist}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
              <button
                onClick={handleClearWishlist}
                disabled={loading}
                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center bg-white p-12 rounded-sm shadow-sm">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Save items you love so you can easily find them later.
            </p>
            <Link
              href="/products"
              className="inline-block bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition-colors rounded"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Filters and Controls */}
            <div className="bg-white p-4 rounded-sm shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sort Options */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Wishlist Items */}
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className={`bg-white rounded-sm shadow-sm hover:shadow-md transition-all duration-200 ${
                    isWishlistUpdating(item.productId) ? 'opacity-50' : ''
                  } ${
                    viewMode === 'list' ? 'flex gap-4 p-4' : 'overflow-hidden'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <>
                      {/* Product Image */}
                      <div className="relative group">
                        <Link href={`/products/${item.productId}`}>
                          <div className="aspect-square bg-gray-100 overflow-hidden">
                            {item.product?.mainImage?.url ? (
                              <img
                                src={item.product.mainImage.url}
                                alt={item.product.mainImage.alt || item.product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No Image</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        
                        {/* Quick Actions Overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRemoveFromWishlist(item.productId)}
                            disabled={isWishlistUpdating(item.productId)}
                            className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {isWishlistUpdating(item.productId) ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              <X className="w-4 h-4 text-gray-600 hover:text-red-500" />
                            )}
                          </button>
                          <Link
                            href={`/products/${item.productId}`}
                            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Link>
                        </div>

                        {/* Discount Badge */}
                        {item.product?.discountPercent && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {Math.round(item.product.discountPercent)}% OFF
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-4">
                        <div className="mb-2">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 hover:text-black transition-colors">
                              {item.product?.name || 'Product Name'}
                            </h3>
                          </Link>
                          {item.product?.brand && (
                            <p className="text-sm text-gray-500">{item.product.brand}</p>
                          )}
                        </div>

                        {/* Rating */}
                        {item.product?.reviews?.average && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{item.product.reviews.average}</span>
                            {item.product.reviews.count && (
                              <span className="text-sm text-gray-500">
                                ({item.product.reviews.count})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-semibold text-lg text-black">
                            ₹{item.product?.finalPrice?.toLocaleString() || '0'}
                          </span>
                          {item.product?.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{item.product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Stock Status */}
                        <div className="mb-4">
                          {!item.product?.isInStock ? (
                            <span className="text-red-600 text-sm font-medium">
                              Out of Stock
                            </span>
                          ) : (item.product?.inStockQuantity ?? 0) <= 5 ? (
                            <span className="text-orange-600 text-sm font-medium">
                              Only {item.product?.inStockQuantity || 0} left
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm font-medium">
                              In Stock
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(item.productId)}
                            disabled={!item.product?.isInStock || isCartUpdating(item.productId)}
                            className="flex-1 bg-black text-white py-2 px-4 rounded font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          >
                            {isCartUpdating(item.productId) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                            {isCartUpdating(item.productId) ? 'Adding...' : 'Add to Cart'}
                          </button>
                          <button
                            onClick={() => handleMoveToCart(item.productId)}
                            disabled={!item.product?.isInStock || isCartUpdating(item.productId) || isWishlistUpdating(item.productId)}
                            className="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Move to Cart
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // List View
                    <>
                      {/* Product Image */}
                      <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
                          {item.product?.mainImage?.url ? (
                            <img
                              src={item.product.mainImage.url}
                              alt={item.product.mainImage.alt || item.product?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-4">
                            <Link href={`/products/${item.productId}`}>
                              <h3 className="font-medium text-gray-900 truncate hover:text-black transition-colors">
                                {item.product?.name || 'Product Name'}
                              </h3>
                            </Link>
                            {item.product?.brand && (
                              <p className="text-sm text-gray-500">{item.product.brand}</p>
                            )}
                            
                            {/* Rating */}
                            {item.product?.reviews?.average && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">{item.product.reviews.average}</span>
                                {item.product.reviews.count && (
                                  <span className="text-xs text-gray-500">
                                    ({item.product.reviews.count})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemoveFromWishlist(item.productId)}
                            disabled={isWishlistUpdating(item.productId)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            {isWishlistUpdating(item.productId) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Price and Stock */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg text-black">
                                ₹{item.product?.finalPrice?.toLocaleString() || '0'}
                              </span>
                              {item.product?.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{item.product.originalPrice.toLocaleString()}
                                </span>
                              )}
                              {item.product?.discountPercent && (
                                <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">
                                  {Math.round(item.product.discountPercent)}% off
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm">
                              {!item.product?.isInStock ? (
                                <span className="text-red-600 font-medium">Out of Stock</span>
                              ) : (item.product?.inStockQuantity ?? 0) <= 5 ? (
                                <span className="text-orange-600 font-medium">
                                  Only {item.product?.inStockQuantity || 0} left
                                </span>
                              ) : (
                                <span className="text-green-600 font-medium">In Stock</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddToCart(item.productId)}
                              disabled={!item.product?.isInStock || isCartUpdating(item.productId)}
                              className="bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                            >
                              {isCartUpdating(item.productId) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                              {isCartUpdating(item.productId) ? 'Adding...' : 'Add to Cart'}
                            </button>
                            <button
                              onClick={() => handleMoveToCart(item.productId)}
                              disabled={!item.product?.isInStock || isCartUpdating(item.productId) || isWishlistUpdating(item.productId)}
                              className="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Move
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Show message when filtered results are empty */}
            {filteredItems.length === 0 && !isEmpty && (
              <div className="text-center bg-white p-8 rounded-sm shadow-sm">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No items match your filters
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your category or sort options to see more items.
                </p>
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setSortBy('recent');
                  }}
                  className="text-black font-medium hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;