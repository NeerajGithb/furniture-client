'use client';

import { useState } from 'react';
import {
  Star,
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
  Eye,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Product } from '@/types/Product';
import { useRouter } from 'next/navigation';

interface ProductDetailsProps {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isInCart: boolean;
  cartQuantity?: number;
  isUpdatingCart: boolean;
  buyingNow: boolean;
}

const ProductDetails = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  isInCart,
  cartQuantity,
  isUpdatingCart,
  buyingNow,
}: ProductDetailsProps) => {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(product.colorOptions?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.size?.[0] || '');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const cleanProductName = (name: string) => {
    return name.replace(/\s*\(Copy\)\s*/g, '').trim();
  };

  const handleCartAction = () => {
    if (isInCart) {
      router.push('/cart');
    } else {
      onAddToCart();
    }
  };

  const cleanedProductName = cleanProductName(product.name);
  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const discountPercentage = hasDiscount ? Math.round(product.discountPercent!) : 0;
  const isOutOfStock = product.inStockQuantity !== undefined && product.inStockQuantity <= 0;
  const isLowStock =
    product.inStockQuantity !== undefined &&
    product.inStockQuantity > 0 &&
    product.inStockQuantity <= 5;
  const rating = product.ratings || product.reviews?.average || 0;
  const reviewCount = product.reviews?.count || 0;

  return (
    <div className="space-y-4">
      {/* Meta Description */}
      {product.metaDescription && product.brand && (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-600 max-md:line-clamp-2">{product.metaDescription}</p>
            <span className="text-sm font-medium text-blue-700 ">By {product.brand}</span>
          </div>
        </>
      )}

      {/* Pricing */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl  text-gray-900">₹{product.finalPrice.toLocaleString()}</span>
          {hasDiscount && product.originalPrice && (
            <>
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
              <span className="bg-red-600 text-white px-2 py-1 text-xs font-medium rounded-xs">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
      </div>

      {/* Color Selection */}
      {product.colorOptions && product.colorOptions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 text-sm">Color: {selectedColor}</h3>
          <div className="flex flex-wrap gap-2">
            {product.colorOptions.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color)}
                className={`px-3 py-1 border rounded-xs transition-colors text-sm cursor-pointer ${
                  selectedColor === color
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 text-sm">Quantity</h3>
        <div className="flex items-center">
          <div className="flex items-center border border-gray-300 rounded-xs">
            {/* Decrement Button */}
            <button
              onClick={() => {
                if (quantity > 1) onQuantityChange(quantity - 1);
              }}
              className={`p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                quantity <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-600'
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Quantity Display */}
            <span className="px-4 py-2 border-x border-gray-300 font-medium min-w-[60px] text-center text-sm text-gray-900">
              {quantity}
            </span>

            {/* Increment Button */}
            <button
              onClick={() => {
                if (quantity < (product.inStockQuantity || 10)) onQuantityChange(quantity + 1);
              }}
              className={`p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                quantity >= (product.inStockQuantity || 10)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-600'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EMI Option */}
      {product.emiPrice && product.emiPrice > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xs p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">EMI Available:</span>
            <span className="text-sm font-semibold text-blue-900">
              ₹{product.emiPrice.toLocaleString()}/month
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">No cost EMI available on select cards</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleCartAction}
            disabled={isOutOfStock || isUpdatingCart}
            className="bg-white text-gray-900 py-2 px-3 border-2 border-gray-900 font-medium hover:bg-gray-900 hover:text-white disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 rounded-xs text-sm cursor-pointer"
          >
            {isUpdatingCart ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {isInCart
                  ? cartQuantity && cartQuantity > 0
                    ? `Go to Cart (${cartQuantity})`
                    : 'Go to Cart'
                  : 'Add to Cart'}
              </>
            )}
          </button>

          <button
            onClick={onBuyNow}
            disabled={isOutOfStock || buyingNow}
            className="bg-gray-900 text-white py-2 px-3 font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 rounded-xs text-sm cursor-pointer"
          >
            {buyingNow ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Buy Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stock Status */}
      <div className="flex items-center justify-between border border-gray-300 rounded-xs p-3">
        <div className="flex items-center gap-2">
          {isOutOfStock ? (
            <span className="text-red-600 font-medium flex items-center gap-1 text-sm">
              <X className="w-4 h-4" />
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-orange-600 font-medium flex items-center gap-1 text-sm">
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
              Only {product.inStockQuantity} left
            </span>
          ) : product.inStockQuantity !== undefined ? (
            <span className="text-green-600 font-medium flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" />
              {product.inStockQuantity} in stock
            </span>
          ) : null}
        </div>

        {product.shippingInfo?.freeShipping && (
          <span className="text-green-600 font-medium flex items-center gap-1 text-sm">
            <Truck className="w-4 h-4" />
            Free Shipping
          </span>
        )}
      </div>

      {/* Ratings & Social Proof */}
      {((typeof rating === 'number' && rating > 0) ||
        (typeof product.totalSold === 'number' && product.totalSold > 0) ||
        (typeof product.viewCount === 'number' && product.viewCount > 0)) && (
        <div className="flex items-center gap-4 flex-wrap">
          {typeof rating === 'number' && rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white font-medium rounded-xs text-sm">
                <span>{rating.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-current" />
              </div>
              {typeof reviewCount === 'number' && reviewCount > 0 && (
                <span className="text-sm text-gray-600">
                  ({reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}

          {typeof product.totalSold === 'number' && product.totalSold > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-3 h-3" />
              <span>{product.totalSold.toLocaleString()} sold</span>
            </div>
          )}

          {typeof product.viewCount === 'number' && product.viewCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Eye className="w-3 h-3" />
              <span>{product.viewCount.toLocaleString()} views</span>
            </div>
          )}
        </div>
      )}

      {/* Product Details Table */}
      {(product.sku ||
        product.brand ||
        product.material ||
        product.dimensions ||
        (product.weight && product.weight > 0) ||
        product.warranty ||
        product.returnPolicy ||
        (product.inStockQuantity !== undefined && product.inStockQuantity > 0) ||
        (product.shippingInfo &&
          (product.shippingInfo.estimatedDays ||
            product.shippingInfo.shippingCost !== undefined)) ||
        (product.colorOptions && product.colorOptions.length > 0) ||
        (product.size && product.size.length > 0) ||
        (product.attributes &&
          Object.keys(product.attributes).filter((key) => product.attributes![key]).length > 0) ||
        product.categoryId?.name ||
        product.subCategoryId?.name ||
        product.itemId) && (
        <div className="border border-gray-300 rounded-xs">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Product Details</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {product.sku && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">SKU</span>
                <span className="text-gray-900 text-sm">{product.sku}</span>
              </div>
            )}

            {product.brand && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Brand</span>
                <span className="text-gray-900 text-sm">{product.brand}</span>
              </div>
            )}

            {product.material && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Material</span>
                <span className="text-gray-900 text-sm">{product.material}</span>
              </div>
            )}

            {product.dimensions && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Dimensions</span>
                <span className="text-gray-900 text-sm">
                  {product.dimensions.length} × {product.dimensions.width} ×{' '}
                  {product.dimensions.height} cm
                </span>
              </div>
            )}

            {product.weight && product.weight > 0 && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Weight</span>
                <span className="text-gray-900 text-sm">{product.weight} kg</span>
              </div>
            )}

            {product.warranty && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Warranty</span>
                <span className="text-gray-900 text-sm">{product.warranty}</span>
              </div>
            )}

            {product.returnPolicy && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Return Policy</span>
                <span className="text-gray-900 text-sm">{product.returnPolicy}</span>
              </div>
            )}

            {product.inStockQuantity !== undefined && product.inStockQuantity > 0 && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Available Stock</span>
                <span className="text-gray-900 text-sm">{product.inStockQuantity} units</span>
              </div>
            )}

            {product.shippingInfo && (
              <>
                {typeof product.shippingInfo.estimatedDays === 'number' &&
                  product.shippingInfo.estimatedDays > 0 && (
                    <div className="grid grid-cols-2 px-4 py-3">
                      <span className="text-gray-600 font-medium text-sm">Delivery Time</span>
                      <span className="text-gray-900 text-sm">
                        {product.shippingInfo.estimatedDays} days
                      </span>
                    </div>
                  )}

                {product.shippingInfo.shippingCost !== undefined && (
                  <div className="grid grid-cols-2 px-4 py-3">
                    <span className="text-gray-600 font-medium text-sm">Shipping Cost</span>
                    <span className="text-gray-900 text-sm">
                      {product.shippingInfo.shippingCost === 0
                        ? 'Free'
                        : `₹${product.shippingInfo.shippingCost}`}
                    </span>
                  </div>
                )}
              </>
            )}

            {product.colorOptions && product.colorOptions.length > 0 && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Colors Available</span>
                <span className="text-gray-900 text-sm">{product.colorOptions.join(', ')}</span>
              </div>
            )}

            {product.size && product.size.length > 0 && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Sizes Available</span>
                <span className="text-gray-900 text-sm">{product.size.join(', ')}</span>
              </div>
            )}

            {product.attributes && (
              <>
                {product.attributes.seater && (
                  <div className="grid grid-cols-2 px-4 py-3">
                    <span className="text-gray-600 font-medium text-sm">Seater</span>
                    <span className="text-gray-900 text-sm">
                      {product.attributes.seater} Seater
                    </span>
                  </div>
                )}
                {product.attributes.style && (
                  <div className="grid grid-cols-2 px-4 py-3">
                    <span className="text-gray-600 font-medium text-sm">Style</span>
                    <span className="text-gray-900 text-sm">{product.attributes.style}</span>
                  </div>
                )}
                {product.attributes.room && (
                  <div className="grid grid-cols-2 px-4 py-3">
                    <span className="text-gray-600 font-medium text-sm">Room Type</span>
                    <span className="text-gray-900 text-sm">{product.attributes.room}</span>
                  </div>
                )}
              </>
            )}

            {product.categoryId?.name && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Category</span>
                <span className="text-gray-900 text-sm">{product.categoryId.name}</span>
              </div>
            )}

            {product.subCategoryId?.name && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Sub Category</span>
                <span className="text-gray-900 text-sm">{product.subCategoryId.name}</span>
              </div>
            )}

            {product.itemId && (
              <div className="grid grid-cols-2 px-4 py-3">
                <span className="text-gray-600 font-medium text-sm">Item ID</span>
                <span className="text-gray-900 font-mono text-xs">{product.itemId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Highlights */}
      {product.highlights && product.highlights.length > 0 && (
        <div className="border border-gray-300 rounded-xs">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Key Features</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {(showAllHighlights ? product.highlights : product.highlights.slice(0, 5)).map(
                (highlight, index) => (
                  <li key={index} className="text-gray-700 flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {highlight}
                  </li>
                ),
              )}
            </ul>
            {product.highlights.length > 5 && (
              <button
                onClick={() => setShowAllHighlights(!showAllHighlights)}
                className="text-blue-600 hover:text-blue-800 mt-3 flex items-center gap-1 font-medium text-sm cursor-pointer"
              >
                {showAllHighlights ? 'Show less' : `Show all ${product.highlights.length} features`}
                {showAllHighlights ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="border border-gray-300 rounded-xs">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Description</h3>
          </div>
          <div className="p-4">
            <div className="text-gray-700 leading-relaxed text-sm">
              {showFullDescription ? (
                <div className="space-y-3">
                  {product.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph.trim()}</p>
                  ))}
                </div>
              ) : (
                <p>{product.description.split('\n')[0]}</p>
              )}
              {product.description.split('\n').length > 1 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-800 mt-3 flex items-center gap-1 font-medium text-sm cursor-pointer"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                  {showFullDescription ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {product.faq && product.faq.length > 0 && (
        <div className="border border-gray-300 rounded-xs">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">
              Frequently Asked Questions
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {product.faq.map((item, index) => (
              <div key={index}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex justify-between items-center px-4 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-gray-900 pr-4 text-sm">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-700 leading-relaxed text-sm">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services - Only show if data exists */}
      {(product.shippingInfo || product.returnPolicy || product.warranty) && (
        <div className="border border-gray-300 rounded-xs">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">
              Services & Policies
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {/*insure itsnevwer show 0 */}
            {product.shippingInfo &&
              (product.shippingInfo.freeShipping ||
                (typeof product.shippingInfo.estimatedDays === 'number' &&
                  product.shippingInfo.estimatedDays > 0)) && (
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    <span className="font-medium text-gray-900 text-sm">
                      {product.shippingInfo.freeShipping ? 'Free Delivery' : 'Delivery'}
                    </span>
                  </div>
                  {product.shippingInfo.estimatedDays && (
                    <span className="text-gray-600 text-sm">
                      {product.shippingInfo.estimatedDays} days
                    </span>
                  )}
                </div>
              )}

            {product.returnPolicy && (
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  <span className="font-medium text-gray-900 text-sm">Returns</span>
                </div>
                <span className="text-gray-600 text-sm">{product.returnPolicy}</span>
              </div>
            )}

            {product.warranty && (
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  <span className="font-medium text-gray-900 text-sm">Warranty</span>
                </div>
                <span className="text-gray-600 text-sm">{product.warranty}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
