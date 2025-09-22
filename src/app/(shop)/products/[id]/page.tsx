'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import ProductCard from '@/components/product/ProductCard';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductDetails from '@/components/product/ProductDetails';
import ProductReviews from '@/components/product/ProductReviews';
import { useParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { useProductStore } from '@/stores/productStore';
import { Product } from '@/types/Product';
import ErrorMessage from '@/components/ui/ErrorMessage';

const SingleProductPage = () => {
  const [SingleProductPageError, setSingleProductPageError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();

  const { isInCart, addToCart, getCartItem, updatingItems: cartUpdatingItems } = useCartStore();
  const {
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    updatingItems: wishlistUpdatingItems,
  } = useWishlistStore();
  const { setCheckoutData } = useCheckoutStore();

  const {
    product,
    relatedProducts,
    allProducts,
    loading,
    loadingMore,
    loadingAll,
    error,
    quantity,
    setQuantity,
    fetchProduct,
    fetchRelatedProducts,
    fetchAllProducts,
  } = useProductStore();

  const slugWithId = params?.id as string | undefined;
  const productId = slugWithId?.split('-').slice(-1)[0];

  const [hasFetched, setHasFetched] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const [buyingNow, setBuyingNow] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [removingFromWishlist, setRemovingFromWishlist] = useState(false);

  const [isDesktop, setIsDesktop] = useState(false);
  const [relatedIndex, setRelatedIndex] = useState(0);
  const [allProductsIndex, setAllProductsIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useLayoutEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      setIsDesktop(width >= 768);

      if (width >= 1536) {
        setItemsPerView(6);
      } else if (width >= 1280) {
        setItemsPerView(5);
      } else if (width >= 1024) {
        setItemsPerView(4);
      } else if (width >= 768) {
        setItemsPerView(3);
      } else {
        setItemsPerView(2);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (productId && !fetchAttempted) {
      setFetchAttempted(true);
      fetchProduct(productId).finally(() => setHasFetched(true));
    }
  }, [productId, fetchProduct, fetchAttempted]);

  useEffect(() => {
    if (product && product._id) {
      const categoryName = product.categoryId?.name;
      if (categoryName) {
        fetchRelatedProducts(categoryName, product._id);
      }
      fetchAllProducts(product._id);
    }
  }, [product, fetchRelatedProducts, fetchAllProducts]);

  const handleAddToCart = async () => {
    if (!user?._id) {
      setSingleProductPageError('Please login to add items to cart');
      return;
    }

    if (!product || isOutOfStock) {
      setSingleProductPageError('Product is out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, quantity);
    } catch (error: any) {
      console.error('Add to cart error:', error);
      setSingleProductPageError(error?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user?._id) {
      setSingleProductPageError('Please login to purchase');
      return;
    }

    if (!product || isOutOfStock) {
      setSingleProductPageError('Product is out of stock');
      return;
    }

    setBuyingNow(true);

    try {
      setAddingToCart(true);
      await addToCart(product._id, quantity);
      setAddingToCart(false);

      const subtotal = product.finalPrice * quantity;
      const shippingCost = subtotal >= 10000 ? 0 : 40;
      const totalDiscount = product.originalPrice
        ? (product.originalPrice - product.finalPrice) * quantity
        : 0;

      const checkoutData = {
        selectedItems: [product._id],
        insuranceEnabled: [],
        selectedAddressId: '',
        selectedPaymentMethod: '',
        totals: {
          subtotal: subtotal,
          selectedQuantity: quantity,
          insuranceCost: 0,
          shippingCost: shippingCost,
          totalAmount: subtotal + shippingCost,
          totalDiscount: totalDiscount,
        },
        cartItems: [
          {
            productId: product._id,
            quantity: quantity,
            itemTotal: subtotal,
            product: {
              _id: product._id,
              name: product.name || '',
              finalPrice: product.finalPrice,
              originalPrice: product.originalPrice,
              discountPercent: product.discountPercent,
              mainImage: product.mainImage,
              isInStock: !isOutOfStock,
            },
          },
        ],
      };

      setCheckoutData(checkoutData);
      router.push('/checkout');
    } catch (error: any) {
      console.error('Buy now error:', error);
      setSingleProductPageError(error?.message || 'Failed to proceed with purchase');
      setAddingToCart(false);
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user?._id) {
      setSingleProductPageError('Please login to add items to wishlist');
      return;
    }

    if (!product?._id) return;

    if (isWishlisted(product._id)) {
      setRemovingFromWishlist(true);
      try {
        await removeFromWishlist(product._id);
        toast.success('Removed from wishlist');
      } catch (error: any) {
        console.error('Remove from wishlist error:', error);
        setSingleProductPageError(error?.message || 'Failed to remove from wishlist');
      } finally {
        setRemovingFromWishlist(false);
      }
    } else {
      setAddingToWishlist(true);
      try {
        await addToWishlist(product._id);
        toast.success('Added to wishlist');
      } catch (error: any) {
        console.error('Add to wishlist error:', error);
        setSingleProductPageError(error?.message || 'Failed to add to wishlist');
      } finally {
        setAddingToWishlist(false);
      }
    }
  };

  const cleanProductName = (name: string) => {
    return name?.replace(/\s*\(Copy\)\s*/g, '').trim() || '';
  };

  const getDisplayImages = () => {
    if (!product) return [];

    const images = [];
    if (product.mainImage?.url) {
      images.push(product.mainImage);
    }
    if (product.galleryImages && Array.isArray(product.galleryImages)) {
      images.push(...product.galleryImages);
    }
    return images;
  };

  const renderDesktopProductRow = (
    products: Product[],
    currentIndex: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    if (!products || products.length === 0) return null;

    const maxIndex = Math.max(0, products.length - itemsPerView);
    const canSlide = products.length > itemsPerView;

    const nextSlide = () => {
      if (!canSlide) return;
      setIndex((prev) => Math.min(prev + 2, maxIndex));
    };

    const prevSlide = () => {
      if (!canSlide) return;
      setIndex((prev) => Math.max(prev - 2, 0));
    };

    return (
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${(currentIndex / itemsPerView) * 100}%)`,
          }}
        >
          {products.map((product) => (
            <div
              key={product._id}
              className="flex-shrink-0 p-2"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {canSlide && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur border border-gray-300 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur border border-gray-300 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    );
  };

  const isOutOfStock = product
    ? product.inStockQuantity !== undefined && product.inStockQuantity <= 0
    : false;

  const productInCart = product?._id ? isInCart(product._id) : false;
  const cartItem = product?._id ? getCartItem(product._id) : null;
  const isUpdatingCart = product?._id ? cartUpdatingItems.has(product._id) || addingToCart : false;

  if (loading && !hasFetched) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-16">
            {/* Left Gallery Skeleton */}
            <div className="md:w-[40%] md:min-w-[464px] space-y-4">
              <div className="w-full aspect-square bg-gray-200 animate-pulse rounded" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            </div>

            {/* Right Product Details Skeleton */}
            <div className="md:w-[60%] space-y-8">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="h-8 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
              </div>

              <div className="h-96 bg-gray-200 rounded w-full animate-pulse">
                <div className="space-y-1">
                  <div className="h-8 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-8 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-8 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-8 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-8 bg-gray-300 rounded w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && hasFetched) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-white p-8 shadow-lg border max-w-md mx-4 rounded-lg">
          <div className="text-gray-400 mb-6">
            <X className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Product</h1>
          <p className="text-gray-600 mb-8">
            {error || 'An unexpected error occurred while fetching the product.'}
          </p>
          <button
            onClick={() => router.push('/products')}
            className="bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors rounded"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (hasFetched && !product && !loading && !error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-white p-8 shadow-lg border max-w-md mx-4 rounded-lg">
          <div className="text-gray-400 mb-6">
            <X className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">
            The product you are looking for does not exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors rounded"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="min-h-screen bg-white"></div>;
  }

  const displayImages = getDisplayImages();
  const cleanedProductName = cleanProductName(product.name);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-gray-500 mb-2 max-md:p-2 md:py-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/" className="hover:underline">
                Home
              </a>
            </li>

            <li>
              <span>-&gt;</span>
            </li>

            <li>
              <a href="/furniture" className="hover:underline">
                Furniture
              </a>
            </li>

            <li>
              <span>-&gt;</span>
            </li>

            <li>
              <a
                href={`/category/${product.categoryId?.slug || ''}`}
                className="hover:underline capitalize"
              >
                {product.categoryId?.name || 'Category'}
              </a>
            </li>

            <li>
              <span>-&gt;</span>
            </li>

            <li aria-current="page" className="font-medium text-gray-900 truncate max-w-xs">
              {cleanedProductName}
            </li>
          </ol>
          {SingleProductPageError && (
            <ErrorMessage
              message={SingleProductPageError}
              onClose={() => setSingleProductPageError(null)}
            />
          )}
        </nav>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-16">
          <div className="md:w-[40%] sm:min-w-[300px] md:min-w-[464px] lg:sticky lg:top-14 md:self-start max-md:mx-auto ">
            <ProductImageGallery images={displayImages} productName={cleanedProductName} />
          </div>

          <div className="md:w-[60%] space-y-8">
            <ProductDetails
              product={product}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              isInCart={productInCart}
              cartQuantity={cartItem?.quantity}
              isUpdatingCart={isUpdatingCart}
              buyingNow={buyingNow}
            />
            <div className="mb-16">
              <ProductReviews productId={product._id} userId={user?._id} />
            </div>
          </div>
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-12 mb-16">
            <h2 className="text-2xl font-bold text-black mb-8 xl:pl-5">Similar Products</h2>
            {isDesktop ? (
              renderDesktopProductRow(relatedProducts, relatedIndex, setRelatedIndex)
            ) : (
              <ProductGrid products={relatedProducts} loading={loadingMore} error={null} />
            )}
          </div>
        )}

        {allProducts && allProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-black mb-8 xl:pl-5">More Products</h2>
            {isDesktop ? (
              renderDesktopProductRow(allProducts, allProductsIndex, setAllProductsIndex)
            ) : (
              <ProductGrid
                products={allProducts}
                loading={loadingAll}
                error={error}
                loadingMore={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleProductPage;
