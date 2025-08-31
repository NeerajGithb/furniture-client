"use client";

import { useState } from "react";
import {
  Star,
  Heart,
  ShoppingCart,
  Zap,
  Truck,
  RotateCcw,
  Shield,
  Plus,
  Minus,
  Check,
  X,
  Award,
  Clock,
  Eye,
  Users,
  Loader2,
} from "lucide-react";
import { Product } from "@/types/Product";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductDetailsProps {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onWishlistToggle: () => void;
  isInCart: boolean;
  isWishlisted: boolean;
  cartQuantity?: number;
  isUpdatingCart: boolean;
  isUpdatingWishlist: boolean;
  buyingNow: boolean;
}

const ProductDetails = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  isInCart,
  isWishlisted,
  cartQuantity,
  isUpdatingCart,
  isUpdatingWishlist,
  buyingNow,
}: ProductDetailsProps) => {
  const router = useRouter();

  const cleanProductName = (name: string) => {
    return name.replace(/\s*\(Copy\)\s*/g, "").trim();
  };

  const handleCartAction = () => {
    if (isInCart) {
      router.push('/cart');
    } else {
      onAddToCart();
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
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className="w-3 h-3 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-3 h-3 text-gray-300" />);
      }
    }
    return stars;
  };

  const cleanedProductName = cleanProductName(product.name);
  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const discountPercentage = hasDiscount ? Math.round(product.discountPercent!) : 0;
  const isOutOfStock = product.inStockQuantity !== undefined && product.inStockQuantity <= 0;
  const isLowStock = product.inStockQuantity !== undefined && 
    product.inStockQuantity > 0 && product.inStockQuantity <= 5;
  const rating = product.ratings || product.reviews?.average || 0;
  const reviewCount = product.reviews?.count || 0;

  return (
    <div className="space-y-3 md:space-y-4 relative z-0">
      {/* Brand/Category */}
      <div className="flex items-center justify-between">
        {product.categoryId?.name && (
          <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            {product.categoryId.name}
          </span>
        )}
        {product.brand && (
          <span className="text-[9px] md:text-[10px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5">
            {product.brand}
          </span>
        )}
      </div>

      {/* Product Title & Badges */}
      <div className="space-y-2">
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight tracking-tight">
          {cleanedProductName}
        </h1>

        <div className="flex flex-wrap gap-1">
          {product.isBestSeller && (
            <span className="bg-orange-500 text-white px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold flex items-center gap-1">
              <Award className="w-2.5 h-2.5 md:w-3 md:h-3" />
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-blue-500 text-white px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold">
              New
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-purple-500 text-white px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold">
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Cart/Wishlist Status */}
      {(isInCart || isWishlisted) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {isInCart && (
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold border border-green-200">
              <ShoppingCart className="w-2.5 h-2.5 md:w-3 md:h-3" />
              In Cart ({cartQuantity})
            </div>
          )}
          {isWishlisted && (
            <div className="flex items-center gap-1 bg-red-50 text-red-700 px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold border border-red-200">
              <Heart className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
              Saved
            </div>
          )}
        </div>
      )}

      {/* Ratings & Social Proof */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap text-[9px] md:text-[10px]">
        {rating > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-600 text-white font-semibold">
              <span className="text-[9px] md:text-[10px]">{rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
            </div>
            <span className="text-gray-500 font-medium">
              {reviewCount.toLocaleString()} reviews
            </span>
          </div>
        )}

        {product.totalSold && (
          <div className="flex items-center gap-1 text-gray-500 font-medium">
            <Users className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>{product.totalSold.toLocaleString()} sold</span>
          </div>
        )}

        {product.viewCount && (
          <div className="flex items-center gap-1 text-gray-500 font-medium">
            <Eye className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>{product.viewCount.toLocaleString()} views</span>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 p-3 md:p-4 border border-gray-200">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            ₹{product.finalPrice.toLocaleString()}
          </span>
          {hasDiscount && product.originalPrice && (
            <>
              <span className="text-sm md:text-base text-gray-400 line-through font-medium">
                ₹{product.originalPrice.toLocaleString()}
              </span>
              <span className="bg-red-500 text-white px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>

        {product.emiPrice && (
          <p className="text-[9px] md:text-[10px] text-gray-500 font-medium">
            EMI from ₹{product.emiPrice.toLocaleString()}/month
          </p>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center justify-between bg-gray-50 p-2.5 md:p-3 border border-gray-200">
        <div className="flex items-center gap-1.5">
          {isOutOfStock ? (
            <span className="text-red-600 font-semibold flex items-center gap-1 text-[10px] md:text-xs">
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-orange-600 font-semibold flex items-center gap-1 text-[10px] md:text-xs">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-600 animate-pulse"></div>
              Only {product.inStockQuantity} left
            </span>
          ) : (
            <span className="text-green-600 font-semibold flex items-center gap-1 text-[10px] md:text-xs">
              <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
              In Stock
            </span>
          )}
        </div>

        {product.shippingInfo?.freeShipping && (
          <span className="text-green-600 font-semibold text-[9px] md:text-[10px] flex items-center gap-1 bg-green-50 px-1.5 py-0.5 border border-green-200">
            <Truck className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Free Ship
          </span>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-1.5">
        <h3 className="font-semibold text-gray-900 text-[10px] md:text-xs">Quantity: {quantity}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-300">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="p-1.5 md:p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
              disabled={quantity <= 1}
            >
              <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <span className="px-2 md:px-3 py-1.5 md:py-2 border-x border-gray-300 font-semibold min-w-[40px] md:min-w-[45px] text-center text-[10px] md:text-xs">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="p-1.5 md:p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={quantity >= (product.inStockQuantity || 10)}
            >
              <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </div>
          
          {product.inStockQuantity && product.inStockQuantity <= 10 && !isOutOfStock && (
            <span className="text-[9px] md:text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 border border-orange-200 font-semibold">
              Only {product.inStockQuantity} left
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleCartAction}
            disabled={isOutOfStock || isUpdatingCart}
            className="bg-white text-black py-2 md:py-2.5 px-3 md:px-4 border border-black font-semibold hover:bg-black hover:text-white disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 ease-out flex items-center justify-center gap-1.5 text-[10px] md:text-xs group overflow-hidden relative transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black transform translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
            <div className="relative z-10 flex items-center gap-1.5">
              {isUpdatingCart ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 transform group-hover:scale-110 transition-transform duration-200" />
                  {isInCart ? "Go to Cart" : "Add to Cart"}
                </>
              )}
            </div>
          </button>
          
          <button
            onClick={onBuyNow}
            disabled={isOutOfStock || buyingNow}
            className="bg-black text-white py-2 md:py-2.5 px-3 md:px-4 font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1.5 text-[10px] md:text-xs"
          >
            {buyingNow ? (
              <>
                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Buy Now
              </>
            )}
          </button>
        </div>

        <button
          onClick={onWishlistToggle}
          disabled={isUpdatingWishlist}
          className={`w-full py-2 md:py-2.5 px-3 md:px-4 border font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 text-[10px] md:text-xs ${
            isWishlisted
              ? "border-red-500 text-red-600 bg-red-50 hover:bg-red-100"
              : "border-gray-300 text-gray-700 hover:border-gray-400 hover:text-black hover:bg-gray-50"
          }`}
        >
          {isUpdatingWishlist ? (
            <>
              <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWishlisted ? "fill-current" : ""}`} />
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </>
          )}
        </button>
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-gray-50 p-3 md:p-4 border border-gray-200 space-y-2">
          <h3 className="text-xs md:text-sm font-semibold text-gray-900">About This Item</h3>
          <div className="text-gray-600 text-[10px] md:text-xs leading-relaxed space-y-1.5">
            {product.description.split("\n").slice(0, 3).map((paragraph, index) => (
              <p key={index} className="leading-relaxed font-medium">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Specifications */}
      {(product.material || product.dimensions || product.weight) && (
        <div className="bg-gray-50 p-3 md:p-4 border border-gray-200 space-y-2">
          <h3 className="font-semibold text-gray-900 text-xs md:text-sm">Specifications</h3>
          <div className="space-y-1.5">
            {product.material && (
              <div className="flex justify-between text-[10px] md:text-xs border-b border-gray-200 pb-1">
                <span className="text-gray-500 font-medium">Material:</span>
                <span className="text-gray-900 font-semibold">{product.material}</span>
              </div>
            )}
            {product.dimensions && (
              <div className="flex justify-between text-[10px] md:text-xs border-b border-gray-200 pb-1">
                <span className="text-gray-500 font-medium">Size:</span>
                <span className="text-gray-900 font-semibold">
                  {product.dimensions.length}×{product.dimensions.width}×{product.dimensions.height} cm
                </span>
              </div>
            )}
            {product.weight && (
              <div className="flex justify-between text-[10px] md:text-xs border-b border-gray-200 pb-1">
                <span className="text-gray-500 font-medium">Weight:</span>
                <span className="text-gray-900 font-semibold">{product.weight} kg</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 text-xs md:text-sm">Services</h3>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between text-[10px] md:text-xs bg-green-50 p-2 md:p-2.5 border border-green-200">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
              <span className="text-gray-700 font-semibold">Free delivery</span>
            </div>
            <span className="text-gray-500 text-[9px] md:text-[10px] font-medium">
              by {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-[10px] md:text-xs bg-blue-50 p-2 md:p-2.5 border border-blue-200">
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
              <span className="text-gray-700 font-semibold">Easy returns</span>
            </div>
            <span className="text-gray-500 text-[9px] md:text-[10px] font-medium">
              {product.returnPolicy || "7 days"}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-[10px] md:text-xs bg-purple-50 p-2 md:p-2.5 border border-purple-200">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
              <span className="text-gray-700 font-semibold">Warranty</span>
            </div>
            <span className="text-gray-500 text-[9px] md:text-[10px] font-medium">
              {product.warranty || "1 year"}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 text-xs md:text-sm">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {product.tags.slice(0, 6).map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;