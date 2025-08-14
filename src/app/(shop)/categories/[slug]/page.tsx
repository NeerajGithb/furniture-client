'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
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

interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
}

interface SubCategory {
    _id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    image: string;
}

const CategoryPage = () => {
    const params = useParams();
    const categorySlug = params?.slug as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('featured');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(20);

    useEffect(() => {
        if (categorySlug) {
            fetchData();
        }
    }, [categorySlug]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [productsRes, categoriesRes, subCategoriesRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/category'),
                fetch('/api/subCategory')
            ]);

            if (!productsRes.ok) throw new Error('Failed to fetch products');
            if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
            if (!subCategoriesRes.ok) throw new Error('Failed to fetch subcategories');

            const [productsData, categoriesData, subCategoriesData] = await Promise.all([
                productsRes.json(),
                categoriesRes.json(),
                subCategoriesRes.json()
            ]);

            // Find the category by slug
            const foundCategory = categoriesData.find((cat: Category) =>
                cat.slug === categorySlug
            );

            if (!foundCategory) {
                throw new Error('Category not found');
            }

            // Filter products by category
            const categoryProducts = productsData.filter((product: Product) =>
                product.category === foundCategory.name
            );

            // Filter subcategories for this category
            const categorySubCategories = subCategoriesData.filter((sub: SubCategory) =>
                sub.category === foundCategory.name
            );

            setCategory(foundCategory);
            setProducts(categoryProducts);
            setSubCategories(categorySubCategories);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...products];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.brand.toLowerCase().includes(query) ||
                product.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // SubCategory filter
        if (selectedSubCategory) {
            filtered = filtered.filter(product => product.subCategory === selectedSubCategory);
        }

        // Price range filter
        if (priceRange.min || priceRange.max) {
            const min = priceRange.min ? parseFloat(priceRange.min) : 0;
            const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
            filtered = filtered.filter(product =>
                product.pricing.finalPrice >= min && product.pricing.finalPrice <= max
            );
        }

        // Sort products
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.pricing.finalPrice - b.pricing.finalPrice);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.pricing.finalPrice - a.pricing.finalPrice);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'rating':
                filtered.sort((a, b) => b.reviews.average - a.reviews.average);
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            default: // featured
                filtered.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return b.reviews.average - a.reviews.average;
                });
        }

        return filtered;
    }, [products, searchQuery, selectedSubCategory, priceRange, sortBy]);

    // Pagination
    const totalProducts = filteredAndSortedProducts.length;
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const paginatedProducts = filteredAndSortedProducts.slice(startIndex, startIndex + productsPerPage);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedSubCategory('');
        setPriceRange({ min: '', max: '' });
        setSortBy('featured');
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || selectedSubCategory || priceRange.min || priceRange.max;

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>

                    {/* Filter Bar Skeleton */}
                    <div className="bg-gray-50 rounded-sm p-6 mb-8">
                        <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid Skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-square bg-gray-200 rounded-sm mb-3"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Category Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'The category you are looking for does not exist.'}
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
                    <span className="text-gray-900">{category.name}</span>
                </motion.nav>

                {/* Category Header */}
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8"
                    >
                        {category.image && (
                            <div className="w-32 h-32 mx-auto mb-6 rounded-sm overflow-hidden">
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{category.name}</h1>
                        {category.description && (
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                {category.description}
                            </p>
                        )}
                    </motion.div>
                </div>

                {/* Search and Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-gray-50 rounded-sm p-6 mb-8 space-y-4"
                >
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search in ${category.name}...`}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>

                    {/* Filter Toggle (Mobile) */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-sm hover:bg-gray-50 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                            <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Results Count */}
                        <div className="text-sm text-gray-600">
                            {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
                        {/* SubCategory Filter */}
                        <select
                            value={selectedSubCategory}
                            onChange={(e) => {
                                setSelectedSubCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                            <option value="">All Subcategories</option>
                            {subCategories.map(subCategory => (
                                <option key={subCategory._id} value={subCategory.name}>
                                    {subCategory.name}
                                </option>
                            ))}
                        </select>

                        {/* Price Range */}
                        <input
                            type="number"
                            placeholder="Min Price"
                            value={priceRange.min}
                            onChange={(e) => {
                                setPriceRange(prev => ({ ...prev, min: e.target.value }));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <input
                            type="number"
                            placeholder="Max Price"
                            value={priceRange.max}
                            onChange={(e) => {
                                setPriceRange(prev => ({ ...prev, max: e.target.value }));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />

                        {/* Sort By */}
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                            <option value="featured">Featured</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name">Name A-Z</option>
                            <option value="rating">Highest Rated</option>
                            <option value="newest">Newest First</option>
                        </select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-sm transition-colors md:col-span-4"
                            >
                                <X className="w-4 h-4" />
                                <span>Clear Filters</span>
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Products Grid */}
                <ProductGrid
                    products={paginatedProducts}
                    loading={false}
                    error={null}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center justify-center gap-2 mt-12"
                    >
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => setCurrentPage(pageNumber)}
                                    className={`px-4 py-2 border rounded-sm transition-colors ${currentPage === pageNumber
                                            ? 'bg-black text-white border-black'
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default CategoryPage;