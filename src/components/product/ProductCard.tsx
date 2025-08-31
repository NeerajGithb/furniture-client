"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, Heart, ShoppingCart, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Product } from "@/types/Product";
import slugify from "slugify";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { user } = useCurrentUser();

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

  const dataInitialized = user?._id
    ? cartInitialized && wishlistInitialized
    : true;
  const cleanName = product.name.replace(/\s*\(Copy\)\s*/g, "").trim();

  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const discountPercentage = hasDiscount
    ? Math.round(product.discountPercent!)
    : 0;
  const isOutOfStock =
    product.inStockQuantity !== undefined && product.inStockQuantity <= 0;
  const isLowStock =
    product.inStockQuantity !== undefined &&
    product.inStockQuantity > 0 &&
    product.inStockQuantity <= 5;

  const displayImage = product.mainImage?.url;
  const reviews = product.reviews || { average: 0, count: 0 };
  const rating = product.ratings || reviews.average || 0;

  const productInCart = isInCart(product._id);
  const cartItem = getCartItem(product._id);
  const productWishlisted = isWishlisted(product._id);

  const isAddingToCart = cartUpdatingItems.has(product._id);
  const isAddingToWishlist = wishlistUpdatingItems.has(product._id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?._id) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }

    await addToCart(product._id, 1);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?._id) {
      toast.error("Please login to manage wishlist");
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
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div
            key={i}
            className="relative w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
          >
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star
            key={i}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300 flex-shrink-0"
          />
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

    if (
      product.dimensions?.length &&
      product.dimensions?.width &&
      product.dimensions?.height
    ) {
      info.push(
        `${product.dimensions.length}×${product.dimensions.width}×${product.dimensions.height}cm`
      );
    }

    return info.join(" • ");
  };

  const formatReviewCount = (count: number) => {
    if (count > 9999) return "9.9k+";
    if (count > 999) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer relative w-full flex flex-col overflow-hidden"
    >
      <Link
        href={`/products/${slugify(cleanName, {
          lower: true,
          strict: true,
        })}-${product._id}`}
        className="h-full flex flex-col"
      >
        {/* Image Container - Fixed aspect ratio using padding-bottom */}
        <div className="relative w-full bg-gray-50 group/image overflow-hidden">
          <div className="aspect-[4/4] relative">
            {displayImage ? (
              <motion.img
                src={displayImage}
                alt={product.mainImage?.alt || cleanName}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-gray-400 text-xs sm:text-sm font-medium">
                  No Image
                </div>
              </div>
            )}

            {imageLoading && displayImage && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* Top badges */}
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
              {product.isBestSeller &&
                !hasDiscount &&
                !product.isNewArrival && (
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

            {/* Top right icons */}
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
                    <span className="text-[10px] sm:text-xs">
                      {cartItem.quantity}
                    </span>
                  )}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWishlistToggle}
                disabled={isAddingToWishlist || !user?._id}
                className={`p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-colors duration-200 hover:bg-white ${
                  productWishlisted
                    ? "text-red-500"
                    : "text-gray-400 hover:text-red-500"
                } ${
                  !user?._id || !dataInitialized
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {isAddingToWishlist ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Heart
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      productWishlisted ? "fill-current" : ""
                    }`}
                  />
                )}
              </motion.button>
            </div>

            {/* Cart button */}
            <motion.div className="absolute inset-x-0 bottom-0 transform translate-y-0 sm:translate-y-full sm:group-hover/image:translate-y-0 transition-transform duration-200 z-30">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className={`w-full h-8 sm:h-10 text-white text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg ${
                  productInCart
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-black hover:bg-gray-800"
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
                    <span className="hidden xs:inline">Adding...</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Sold Out</span>
                ) : productInCart ? (
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                ) : (
                  <>
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Add to Cart</span>
                    <span className="xs:hidden">Add</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-40">
                <div className="bg-gray-800 text-white px-2 sm:px-4 py-1 sm:py-2 font-semibold text-xs sm:text-sm shadow-lg">
                  Out of Stock
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product details - Flexible height */}
        <div className="flex-1 p-2 sm:p-3 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {/* Product name */}
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight mb-1.5 sm:mb-2 line-clamp-2">
              {cleanName}
            </h3>

            {/* Compact info */}
            {getCompactInfo() && (
              <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2 leading-tight line-clamp-1">
                {getCompactInfo()}
              </p>
            )}

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-1 mb-1.5 sm:mb-2 min-h-0">
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {renderStars(rating)}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 ml-0.5 sm:ml-1 flex-shrink-0">
                  {rating.toFixed(1)}
                </span>
                {reviews.count > 0 && (
                  <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0">
                    ({formatReviewCount(reviews.count)})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Price section - Fixed at bottom */}
          <div className="mt-auto flex-shrink-0">
            <div className="flex items-baseline gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <span className="font-bold text-sm sm:text-lg text-black">
                ₹{product.finalPrice.toLocaleString()}
              </span>
              {hasDiscount && product.originalPrice && (
                <span className="text-xs sm:text-sm text-gray-500 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <div className="text-[10px] sm:text-xs text-gray-600">
              {/* {product.emiPrice ? (
                <span>EMI from ₹{product.emiPrice.toLocaleString()}/mo</span>
              ) : (
                <span className="text-green-600 font-medium">
                  Free Delivery
                </span>
              )} */}
              <span className="text-green-600 font-medium">Free Delivery</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
