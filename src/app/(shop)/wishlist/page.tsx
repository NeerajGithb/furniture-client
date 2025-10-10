'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import ProductCard from '@/components/product/ProductCard';

const WishlistPage = () => {
  const { user } = useCurrentUser();
  const router = useRouter();

  const {
    wishlist,
    loading: wishlistLoading,
    initialized,
    initializeWishlists,
    removeFromWishlist,
    isUpdating: isWishlistUpdating,
  } = useWishlistStore();

  const { addToCart, isUpdating: isCartUpdating, initializeCart } = useCartStore();

  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (user?._id && !initialized) {
      initializeWishlists();
      initializeCart();
    }
  }, [user, initialized, initializeWishlists, initializeCart]);

  const filteredItems =
    wishlist?.items?.filter((item) =>
      filterCategory === 'all' ? true : item.product?.category === filterCategory,
    ) || [];

  const categories = [...new Set(wishlist?.items?.map((i) => i.product?.category).filter(Boolean))];

  const handleMoveToCart = async (productId: string) => {
    const added = await addToCart(productId, 1);
    if (added) {
      await removeFromWishlist(productId);
    }
  };

  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-12 rounded shadow text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Please Login</h1>
          <p className="text-gray-600 mb-6">Login to view your wishlist.</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-black text-white px-8 py-3 rounded font-medium hover:bg-gray-800 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (wishlistLoading && !initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-500">Loading wishlist...</span>
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-12 rounded shadow text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-3">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">Save items you love to easily find them later.</p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-8 py-3 rounded font-medium hover:bg-gray-800 transition"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 md:mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Wishlist ({wishlist.items.length})</h1>
            <p className="text-gray-600 text-sm mt-1">Items you've saved for later</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {categories.length > 0 && (
        <div className="bg-white p-4 rounded shadow mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Wishlist Items */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
       lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-2 md:gap-3 xl:gap-4 bg-gray-50 sm:p-2"
      >
        {filteredItems.map((item) => {
          const product = item.product;
          if (!product) return null;

          const loadingCart = isCartUpdating(product._id);
          const loadingWishlist = isWishlistUpdating(product._id);

          return (
            <div key={product._id} className="">
              <ProductCard product={product as any} />

              {/* Extra button for small screens */}
              <div className="sm:hidden mt-2 flex justify-center">
                <button
                  onClick={() => handleMoveToCart(product._id)}
                  disabled={!product.isInStock || loadingCart || loadingWishlist}
                  className="bg-black text-white py-2 w-full rounded font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loadingCart || loadingWishlist ? (
                    <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  ) : (
                    'Move to Cart'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;
