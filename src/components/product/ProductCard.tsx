'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, Heart, ShoppingCart, Check, Loader2, Eye } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/types/Product';
import slugify from 'slugify';
import { toast } from 'react-hot-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { usePathname } from 'next/navigation';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const {
    addToCart,
    updatingItems: cartUpdatingItems,
    isInCart,
    getCartItem,
    initialized: cartInitialized,
  } = useCartStore();

  const {
    addToWishlist,
    removeFromWishlist,
    updatingItems: wishlistUpdatingItems,
    isWishlisted,
    initialized: wishlistInitialized,
  } = useWishlistStore();

  const [imageLoading, setImageLoading] = useState(true);

  const cleanName = product.name.replace(/\s*\(Copy\)\s*/g, '').trim();

  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const discountPercentage = hasDiscount ? Math.round(product.discountPercent!) : 0;
  const isOutOfStock = product.inStockQuantity !== undefined && product.inStockQuantity <= 0;
  const isLowStock =
    product.inStockQuantity !== undefined &&
    product.inStockQuantity > 0 &&
    product.inStockQuantity <= 5;

  const displayImage = product.mainImage?.url;
  const reviews = product.reviews || { average: 0, count: 0 };

  const productInCart = isInCart(product._id);
  const cartItem = getCartItem(product._id);
  const productWishlisted = isWishlisted(product._id);

  const isAddingToCart = cartUpdatingItems.has(product._id);
  const isAddingToWishlist = wishlistUpdatingItems.has(product._id);

  const productUrl = `/products/${slugify(cleanName, {
    lower: true,
    strict: true,
  })}-${product._id}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?._id) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (isOutOfStock) {
      toast.error('Product is out of stock');
      return;
    }

    await addToCart(product._id, 1);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?._id) {
      toast.error('Please login to manage wishlist');
      return;
    }

    if (productWishlisted) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const safeRating = Math.max(0, Math.min(5, rating || 0));
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 flex-shrink-0"
          />,
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>,
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300 flex-shrink-0" />,
        );
      }
    }
    return stars;
  };

  const getCompactInfo = () => {
    const info = [];

    if (product.material) {
      info.push(product.material);
    }

    if (product.dimensions?.length && product.dimensions?.width && product.dimensions?.height) {
      info.push(
        `${product.dimensions.length}×${product.dimensions.width}×${product.dimensions.height}cm`,
      );
    }

    return info.join(' • ');
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...(isHome ? { x: 20 } : { y: 20 }),
      }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group  bg-white cursor-pointer relative w-full flex flex-col overflow-hidden p-[6px]  md:p-2
           transition-shadow duration-100 hover:shadow-[0_0_3px_rgba(0,0,0,0.2)] max-md:shadow-[0_0_3px_rgba(0,0,0,0.2)]"
    >
      <div className="relative w-full overflow-hidden">
        <Link
          href={productUrl}
          className="block aspect-[4/4]  relative"
          onClick={(e) => e.stopPropagation()}
        >
          {displayImage ? (
            <motion.img
              src={displayImage}
              alt={product.mainImage?.alt || cleanName}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 saturate-200${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-xs sm:text-sm font-medium">No Image</div>
            </div>
          )}

          {imageLoading && displayImage && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold shadow-sm">
                -{discountPercentage}%
              </span>
            )}
            {product.isNewArrival && !hasDiscount && (
              <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold shadow-sm">
                New
              </span>
            )}
            {product.isBestSeller && !hasDiscount && !product.isNewArrival && (
              <span className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold shadow-sm">
                Best
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold shadow-sm">
                {product.inStockQuantity} left
              </span>
            )}
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5 sm:gap-2 z-20">
            {productInCart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold shadow-lg flex items-center gap-1 rounded"
              >
                <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                {cartItem?.quantity && (
                  <span className="text-[10px] sm:text-xs">{cartItem.quantity}</span>
                )}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWishlistToggle}
              disabled={isAddingToWishlist || !user?._id}
              className={`p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-colors duration-200 hover:bg-white ${
                productWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              } ${!user?._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isAddingToWishlist ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Heart
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${productWishlisted ? 'fill-current' : ''}`}
                />
              )}
            </motion.button>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-40">
              <div className="bg-gray-800 text-white px-2 sm:px-4 py-1 sm:py-2 font-semibold text-xs sm:text-sm shadow-lg">
                Out of Stock
              </div>
            </div>
          )}
        </Link>
      </div>

      <div className="flex-1 px-3 mt-2 md:px-1 py-2 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
            {cleanName}
          </h3>

          {getCompactInfo() && (
            <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 leading-tight line-clamp-1">
              {getCompactInfo()}
            </p>
          )}
        </div>

        <div className="mt-auto flex-shrink-0 mb-4 sm:mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm sm:text-base text-gray-900">
              ₹{product.finalPrice.toLocaleString()}
            </span>
            {hasDiscount && product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:block flex-shrink-0 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
          <div className="flex gap-1.5 h-full">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart || !user?._id}
              className={`flex-1 h-full text-white text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 rounded-xs backdrop-blur-sm ${
                productInCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                  : 'bg-gray-900 hover:bg-black shadow-sm'
              } disabled:bg-gray-400 disabled:cursor-not-allowed hover:shadow-md`}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                  <span className="hidden sm:inline">Adding...</span>
                </>
              ) : isOutOfStock ? (
                <span className="text-xs">Sold Out</span>
              ) : productInCart ? (
                <>
                  <Check className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </button>

            <Link
              href={productUrl}
              className="flex-1 h-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-1.5 rounded-xs shadow-sm hover:shadow-md"
            >
              <span className="hidden sm:inline">View Product</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
