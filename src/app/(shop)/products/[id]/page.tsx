"use client";

import { useState, useEffect } from "react";
import ProductGrid from "@/components/product/ProductGrid";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductDetails from "@/components/product/ProductDetails";
import ProductReviews from "@/components/product/ProductReviews";
import { useParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { useProductStore } from "@/stores/productStore";

const SingleProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();

  // Store hooks
  const {
    isInCart,
    addToCart,
    getCartItem,
    updatingItems: cartUpdatingItems,
  } = useCartStore();
  const {
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    updatingItems: wishlistUpdatingItems,
  } = useWishlistStore();
  const { setCheckoutData } = useCheckoutStore();

  // Product store
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
  const productId = slugWithId?.split("-").slice(-1)[0];

  // Local states for actions
  const [buyingNow, setBuyingNow] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [removingFromWishlist, setRemovingFromWishlist] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  useEffect(() => {
    if (product) {
      const categoryName = product.categoryId?.name;
      if (categoryName) {
        fetchRelatedProducts(categoryName, product._id);
      }
      fetchAllProducts(product._id);
    }
  }, [product, fetchRelatedProducts, fetchAllProducts]);

  const handleAddToCart = async () => {
    if (!user?._id) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (!product || isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, quantity);
    } catch (error: any) {
      console.error("Add to cart error:", error);
      toast.error(error.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user?._id) {
      toast.error("Please login to purchase");
      return;
    }

    if (!product || isOutOfStock) {
      toast.error("Product is out of stock");
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
        selectedAddressId: "",
        selectedPaymentMethod: "",
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
              name: product.name,
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
      router.push("/checkout");
    } catch (error: any) {
      console.error("Buy now error:", error);
      toast.error(error.message || "Failed to proceed with purchase");
      setAddingToCart(false);
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user?._id) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    if (!product) return;

    if (isWishlisted(product._id)) {
      setRemovingFromWishlist(true);
      try {
        await removeFromWishlist(product._id);
        toast.success("Removed from wishlist");
      } catch (error: any) {
        console.error("Remove from wishlist error:", error);
        toast.error(error.message || "Failed to remove from wishlist");
      } finally {
        setRemovingFromWishlist(false);
      }
    } else {
      setAddingToWishlist(true);
      try {
        await addToWishlist(product._id);
        toast.success("Added to wishlist");
      } catch (error: any) {
        console.error("Add to wishlist error:", error);
        toast.error(error.message || "Failed to add to wishlist");
      } finally {
        setAddingToWishlist(false);
      }
    }
  };

  const cleanProductName = (name: string) => {
    return name.replace(/\s*\(Copy\)\s*/g, "").trim();
  };

  const getDisplayImages = () => {
    const images = [];
    if (product?.mainImage?.url) {
      images.push(product.mainImage);
    }
    if (product?.galleryImages) {
      images.push(...product.galleryImages);
    }
    return images;
  };

  // Calculate derived state
  const isOutOfStock = product
    ? product.inStockQuantity !== undefined && product.inStockQuantity <= 0
    : false;

  const productInCart = product ? isInCart(product._id) : false;
  const productWishlisted = product ? isWishlisted(product._id) : false;
  const cartItem = product ? getCartItem(product._id) : null;
  const isUpdatingCart = product
    ? cartUpdatingItems.has(product._id) || addingToCart
    : false;
  const isUpdatingWishlist = product
    ? wishlistUpdatingItems.has(product._id) ||
      addingToWishlist ||
      removingFromWishlist
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Image Loading */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-2 w-12 md:w-16">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
              <div className="flex-1 h-64 md:h-96 bg-gray-200 animate-pulse" />
            </div>

            {/* Details Loading */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 w-1/4 animate-pulse" />
              <div className="h-6 bg-gray-200 w-3/4 animate-pulse" />
              <div className="h-8 bg-gray-200 w-1/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 animate-pulse" />
                <div className="h-10 bg-gray-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-white p-6 md:p-8 shadow-lg border max-w-md mx-4">
          <div className="text-gray-400 mb-4">
            <X className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-3" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6 text-sm md:text-base">
            {error ||
              "The product you are looking for does not exist or has been removed."}
          </p>
          <button
            onClick={() => router.push("/products")}
            className="bg-black text-white px-6 py-2.5 font-medium hover:bg-gray-800 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const displayImages = getDisplayImages();
  const cleanedProductName = cleanProductName(product.name);

  return (
    <div className="min-h-screen bg-white max-w-[1400px] mx-auto">
      <div className="w-full mx-auto px-4 py-4 md:py-6">
        {/* Main Product Section */}
        <div className="flex flex-col gap-2 lg:flex-row lg:gap-10 mb-12">
          {/* Left - Image Gallery */}
          <div className="lg:sticky lg:top-6 lg:self-start z-20">
            <ProductImageGallery
              images={displayImages}
              productName={cleanedProductName}
            />
          </div>

          {/* Right - Product Details */}
          <div className="relative z-10">
            <ProductDetails
              product={product}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onWishlistToggle={handleWishlistToggle}
              isInCart={productInCart}
              isWishlisted={productWishlisted}
              cartQuantity={cartItem?.quantity}
              isUpdatingCart={isUpdatingCart}
              isUpdatingWishlist={isUpdatingWishlist}
              buyingNow={buyingNow}
            />
            <ProductReviews productId={product._id} userId={user?._id} />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-black mb-6">
              Similar Products
            </h2>
            <ProductGrid
              products={relatedProducts}
              loading={loadingMore}
              error={null}
            />
          </div>
        )}

        {/* More Products */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-xl md:text-2xl font-bold text-black mb-6">
            More Products
          </h2>
          <ProductGrid
            products={allProducts}
            loading={loadingAll}
            error={error}
            loadingMore={false}
          />
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;