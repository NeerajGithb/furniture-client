'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductDetails from '@/components/product/ProductDetails';
import ProductReviews from '@/components/product/ProductReviews';
import ProductGrid from '@/components/product/ProductGrid';

interface Product {
    _id: string;
    name: string;
    description: string;
    category: string;
    subCategory: string;
    brand: string;
    material: string;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    weight: number;
    images: string[];
    pricing: {
        originalPrice: number;
        finalPrice: number;
        discount?: number;
    };
    inventory: {
        stock: number;
        available: boolean;
    };
    reviews: {
        average: number;
        count: number;
        list: Array<{
            user: string;
            rating: number;
            comment: string;
            date: Date;
        }>;
    };
    featured: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const SingleProductPage = () => {
    const params = useParams();
    const productId = params?.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    useEffect(() => {
        if (product) {
            fetchRelatedProducts();
        }
    }, [product]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/products/${productId}`);

            if (!response.ok) {
                throw new Error('Product not found');
            }

            const productData = await response.json();
            setProduct(productData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async () => {
        try {
            const response = await fetch('/api/products');

            if (response.ok) {
                const allProducts = await response.json();

                // Filter related products by same category, excluding current product
                const related = allProducts
                    .filter((p: Product) =>
                        p._id !== product?._id &&
                        (p.category === product?.category || p.subCategory === product?.subCategory)
                    )
                    .sort(() => Math.random() - 0.5) // Randomize
                    .slice(0, 8); // Limit to 8 products

                setRelatedProducts(related);
            }
        } catch (err) {
            console.error('Failed to fetch related products:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Image Gallery Skeleton */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-gray-200 rounded-sm animate-pulse"></div>
                            <div className="flex gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="w-16 h-16 bg-gray-200 rounded-sm animate-pulse"></div>
                                ))}
                            </div>
                        </div>

                        {/* Details Skeleton */}
                        <div className="space-y-6">
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                                    ))}
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
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
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Product Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'The product you are looking for does not exist or has been removed.'}
                    </p>
                    <a
                        href="/products"
                        className="bg-black text-white px-6 py-3 rounded-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Browse All Products
                    </a>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-white"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <motion.nav
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center space-x-2 text-sm text-gray-500 mb-8"
                >
                    <a href="/" className="hover:text-gray-900 transition-colors">Home</a>
                    <span>/</span>
                    <a href="/products" className="hover:text-gray-900 transition-colors">Products</a>
                    <span>/</span>
                    <a href={`/categories/${product.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-gray-900 transition-colors">
                        {product.category}
                    </a>
                    <span>/</span>
                    <span className="text-gray-900 truncate">{product.name}</span>
                </motion.nav>

                {/* Product Details Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Product Images */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <ProductImageGallery
                            images={product.images}
                            productName={product.name}
                        />
                    </motion.div>

                    {/* Product Details */}
                    <ProductDetails product={product} />
                </div>

                {/* Reviews Section */}
                <div className="mb-16">
                    <ProductReviews reviews={product.reviews} />
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Related Products</h2>
                            <p className="text-gray-600">You might also like these products</p>
                        </div>

                        <ProductGrid products={relatedProducts} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default SingleProductPage;