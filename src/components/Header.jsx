"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, User, Menu, ChevronDown, Heart } from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import AuthModal from "./AuthModal";
import SearchModal from "./search/SearchModal";
import UserDropdown from "./UserDropdown";
import SearchBar from "./search/SearchBar";
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from "@/stores/wishlistStore";
import { useProductStore } from '@/stores/productStore';

// FIXED: Remove dependency arrays from selectors to prevent re-renders
const cartCountSelector = (state) => state.cart?.items?.length || 0;
const wishlistCountSelector = (state) => state.wishlist?.items?.length || 0;
const categoriesSelector = (state) => state.categories;
const subcategoriesSelector = (state) => state.subcategories;
const loadingCategoriesSelector = (state) => state.loadingCategories;

// Memoized Avatar Component
const Avatar = memo(({ src, alt, fallbackText }) => {
  const [imageError, setImageError] = useState(false);
  const handleError = useCallback(() => setImageError(true), []);

  if (!src || imageError) {
    return (
      <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-800'>
        {fallbackText}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={32}
      height={32}
      className='w-8 h-8 rounded-full object-cover'
      onError={handleError}
    />
  );
});

Avatar.displayName = 'Avatar';

// Stable navigation items
const NAV_ITEMS = [
  { href: "/orders", label: "My Orders" },
  { href: "/categories", label: "Categories" },
];

// Custom hook for scroll state
const useScrollState = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 80;
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return scrolled;
};

// Memoized Category Item Component
const CategoryItem = memo(({ category, isActive, onEnter, onActivate }) => {
  const handleMouseEnter = useCallback(() => {
    onEnter(category.name);
  }, [category.name, onEnter]);

  const handleClick = useCallback(() => {
    onActivate(null);
  }, [onActivate]);

  return (
    <motion.li
      onMouseEnter={handleMouseEnter}
      className='relative group'
      whileHover={{ y: -1 }}
    >
      <button
        className='flex items-center gap-1 text-sm font-medium text-gray-800 hover:text-black transition-colors duration-200 py-2 px-2 rounded-sm hover:bg-gray-50'
        onClick={handleClick}
      >
        <span>{category.name}</span>
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={12} />
        </motion.div>
      </button>
      <motion.div
        className='absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-black'
        initial={{ width: 0 }}
        animate={{ width: isActive ? "100%" : "0%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.li>
  );
});

CategoryItem.displayName = 'CategoryItem';

// Memoized Mega Menu Component
const MegaMenu = memo(({ category, onClose, onClearTimeout }) => {
  const handleMouseEnter = useCallback(() => {
    onClearTimeout();
  }, [onClearTimeout]);

  const handleLinkClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!category) return null;

  return (
    <motion.div
      key={category.name}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className='absolute top-full left-0 w-full bg-white shadow-lg border-b border-gray-100 z-30'
      onMouseEnter={handleMouseEnter}
    >
      <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {category.groups?.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              className='space-y-3'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
            >
              <h3 className='font-semibold text-xs uppercase tracking-wide text-black border-b border-gray-200 pb-1.5'>
                {group.title}
              </h3>
              <ul className='space-y-2'>
                {group.items?.map((item, itemIndex) => (
                  <motion.li
                    key={item.slug}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.05 + itemIndex * 0.03 }}
                  >
                    <Link
                      href={`/products?category=${item.categorySlug}&subcategory=${item.slug}`}
                      onClick={handleLinkClick}
                      className='block text-sm text-gray-800 hover:text-black transition-colors duration-200 py-0.5 hover:bg-gray-50 px-1.5 rounded -mx-1.5'
                    >
                      {item.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div
            className='bg-gray-50 p-4 border border-gray-200'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className='font-semibold text-xs uppercase tracking-wide text-black mb-2'>Featured</h3>
            <div className='space-y-1.5'>
              <p className='text-xs text-gray-800 mb-2'>
                Discover our latest {category.name.toLowerCase()} collections
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className='inline-block text-xs font-medium text-white bg-black px-3 py-1.5 hover:bg-gray-800 transition-colors duration-200'
                  onClick={handleLinkClick}
                >
                  Shop Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

MegaMenu.displayName = 'MegaMenu';

// Header Component with initialization
const Header = () => {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  // FIXED: Direct store access without dependency arrays
  const categories = useProductStore(categoriesSelector);
  const subcategories = useProductStore(subcategoriesSelector);
  const loadingCategories = useProductStore(loadingCategoriesSelector);

  // Initialize store only once
  const initializeRef = useRef(false);
  useEffect(() => {
    if (!initializeRef.current) {
      useProductStore.getState().initialize();
      initializeRef.current = true;
    }
  }, []);

  // State management
  const [activeCat, setActiveCat] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Custom hooks
  const scrolled = useScrollState();

  // Store subscriptions with stable selectors
  const cartCount = useCartStore(cartCountSelector);
  const wishlistCount = useWishlistStore(wishlistCountSelector);

  // Refs
  const timeoutRef = useRef();

  // FIXED: Memoize with JSON.stringify for deep comparison
  const transformedCategories = useMemo(() => {
    if (!categories?.length) return [];

    return categories.map(category => {
      const categorySubcategories = subcategories?.filter(
        sub => {
          const categoryId = typeof sub.categoryId === 'object' ? sub.categoryId._id : sub.categoryId;
          return categoryId === category._id;
        }
      ) || [];

      return {
        name: category.name,
        slug: category.slug,
        groups: categorySubcategories.length > 0 ? [
          {
            title: `${category.name} Collection`,
            items: categorySubcategories.map(sub => ({
              name: sub.name,
              slug: sub.slug,
              categorySlug: category.slug
            }))
          }
        ] : [
          {
            title: `${category.name} Collection`,
            items: [
              {
                name: `All ${category.name}`,
                slug: category.slug,
                categorySlug: category.slug
              }
            ]
          }
        ]
      };
    });
  }, [JSON.stringify(categories), JSON.stringify(subcategories)]); // Deep comparison

  // Find active category
  const activeCategory = useMemo(() =>
    transformedCategories.find(c => c.name === activeCat),
    [transformedCategories, activeCat]
  );

  // Stable handlers - no dependencies that change
  const handleCategoryEnter = useCallback((catName) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveCat(catName);
  }, []);

  const handleCategoryLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveCat(null), 150);
  }, []);

  const clearCategoryTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeMegaMenu = useCallback(() => {
    setActiveCat(null);
  }, []);

  // Modal handlers
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);
  const toggleDropdown = useCallback(() => setIsDropdownOpen(prev => !prev), []);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const openDropdown = useCallback(() => setIsDropdownOpen(true), []);

  // Cleanup timeout on unmount
  useEffect(() => {
    console.log('Header mounted');
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // FIXED: Memoize category navigation with proper dependencies
  const CategoryNavigation = useMemo(() => {
    if (loadingCategories) {
      return (
        <div className="flex items-center justify-center gap-6 py-2.5 h-11">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-2.5 h-2.5 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="h-11 flex items-center justify-center">
        <ul className='flex items-center justify-center gap-6'>
          {transformedCategories.map((category) => (
            <CategoryItem
              key={category.name}
              category={category}
              isActive={activeCat === category.name}
              onEnter={handleCategoryEnter}
              onActivate={setActiveCat}
            />
          ))}
        </ul>
      </div>
    );
  }, [loadingCategories, JSON.stringify(transformedCategories), activeCat, handleCategoryEnter]);

  // FIXED: Memoize simplified categories for tablet
  const TabletCategories = useMemo(() => {
    if (loadingCategories) {
      return (
        <div className="h-11 flex items-center justify-center gap-3 px-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      );
    }

    return (
      <div className="h-11 flex items-center justify-center px-4 z-30">
        <ul className='flex items-center justify-center gap-4 text-sm overflow-x-auto scrollbar-hide'>
          {transformedCategories.slice(0, 5).map((category) => (
            <li key={category.name} className='whitespace-nowrap'>
              <Link
                href={`/products?category=${category.slug}`}
                className='text-gray-800 hover:text-black font-medium transition-colors duration-200 py-2.5 px-2 rounded-sm hover:bg-gray-50 capitalize'
              >
                {category.name}
              </Link>
            </li>
          ))}
          {transformedCategories.length > 5 && (
            <li className='whitespace-nowrap'>
              <Link
                href='/categories'
                className='text-gray-500 hover:text-black text-sm transition-colors duration-200 py-2.5 px-1.5'
              >
                More...
              </Link>
            </li>
          )}
        </ul>
      </div>
    );
  }, [loadingCategories, JSON.stringify(transformedCategories)]);

  return (
    <>
      {/* Main Header */}
      <header className='relative z-30 bg-white border-b border-gray-100'>
        {/* Main Header Bar - MOBILE RESPONSIVE FIXED */}
        <div className='h-12 sm:h-16 flex items-center'>
          <div className='px-3 sm:px-4 lg:px-8 w-full max-w-[1600px] mx-auto'>
            <div className='flex items-center justify-between h-full'>

              {/* LEFT: Mobile Menu + Logo - PROPERLY ALIGNED FOR MOBILE */}
              <div className='flex items-center gap-2 sm:gap-2.5 flex-shrink-0 min-w-0'>
                {/* Mobile Menu Button - LEFT SIDE AS REQUESTED */}
                <motion.button
                  onClick={openSidebar}
                  className='sm:hidden p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-all duration-200'
                  aria-label='Open menu'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu size={19} />
                </motion.button>

                {/* Logo - PROPERLY SIZED FOR MOBILE */}
                <Link
                  href='/'
                  className='flex items-center gap-2 sm:gap-2 hover:opacity-90 transition-opacity duration-200'
                >
                  <Image
                    src='/logo.png'
                    alt='VFurniture'
                    width={24}
                    height={24}
                    className='rounded w-6 h-6 sm:w-7 sm:h-7'
                  />
                  <span className='text-sm sm:text-lg font-bold tracking-tight'>
                    <span className='text-black'>V</span>
                    <span className='text-gray-900'>Furniture</span>
                  </span>
                </Link>
              </div>

              {/* CENTER: Search Bar - HIDDEN ON MOBILE */}
              <div className='hidden md:flex flex-1 max-w-[800px] mx-6 lg:mx-8'>
                <SearchBar
                  className="w-full"
                />
              </div>

              {/* RIGHT: Actions - MOBILE OPTIMIZED */}
              <div className='flex items-center gap-0.5 sm:gap-2'>

                {/* Desktop Navigation Links - HIDDEN ON MOBILE */}
                <nav className='hidden xl:flex items-center gap-1 mr-2'>
                  {NAV_ITEMS.map(({ href, label }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`relative group text-xs sm:text-sm font-medium px-2 py-1.5 transition-colors duration-200 rounded ${isActive
                            ? "text-black bg-gray-50"
                            : "text-gray-800 hover:text-black hover:bg-gray-50 capitalize"
                          }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`absolute left-0 -bottom-1 h-0.5 bg-black transition-all duration-300 ease-out ${isActive ? "w-full" : "w-0 group-hover:w-full"
                            }`}
                        />
                      </Link>
                    );
                  })}
                </nav>

                {/* Action buttons - MOBILE OPTIMIZED */}
                <div className='flex items-center gap-0.5 sm:gap-3'>
                  {/* Search Button - ONLY ON MOBILE */}
                  <motion.button
                    onClick={openSearch}
                    className='md:hidden p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-all duration-200'
                    aria-label='Search'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Search size={19} />
                  </motion.button>

                  {/* Wishlist Icon - HIDDEN ON SMALL MOBILE */}
                  <Link
                    href='/wishlist'
                    className='relative p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-all duration-200'
                    aria-label='Wishlist'
                  >
                    <Heart size={19} />
                    {wishlistCount > 0 && (
                      <motion.span
                        className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </motion.span>
                    )}
                  </Link>

                  {/* Cart Icon - ALWAYS VISIBLE */}
                  <Link
                    href='/cart'
                    className='relative p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-all duration-200'
                    aria-label='Shopping cart'
                  >
                    <ShoppingCart size={19} />
                    {cartCount > 0 && (
                      <motion.span
                        className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black text-white text-xs rounded-full flex items-center justify-center font-medium'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </Link>

                  {/* Auth/Profile - MOBILE OPTIMIZED */}
                  {authLoading ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  ) : user ? (
                    <div className='relative'>
                      <motion.button
                        onClick={toggleDropdown}
                        onMouseEnter={openDropdown}
                        className='p-0.5 rounded hover:bg-gray-100 transition-colors duration-200'
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Avatar
                          src={user?.photoURL || ""}
                          alt='User Avatar'
                          fallbackText={user?.name?.[0]?.toUpperCase() || "U"}
                        />
                      </motion.button>
                      <UserDropdown
                        isOpen={isDropdownOpen}
                        onClose={closeDropdown}
                      />
                    </div>
                  ) : (
                    <motion.button
                      onClick={openAuth}
                      className='flex items-center p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-all duration-200'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label='Login'
                    >
                      <User size={19} />
                      <span className='hidden lg:inline ml-1.5 text-xs'>Login</span>
                    </motion.button>
                  )}

                  {/* Desktop Menu Button - HIDDEN ON MOBILE */}
                  <motion.button
                    onClick={openSidebar}
                    className='hidden sm:flex xl:hidden p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-all duration-200'
                    aria-label='Open menu'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Menu size={19} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className='relative bg-white border-t border-gray-100'
          onMouseLeave={handleCategoryLeave}
        >
          <div className='max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8'>
            <nav className='hidden lg:block'>
              {CategoryNavigation}
            </nav>

            <nav className='hidden md:block lg:hidden'>
              {TabletCategories}
            </nav>
            <div className='md:hidden py-2 h-10 flex items-center'>
              <button
                onClick={openSearch}
                className='flex-1 flex items-center bg-gray-50 border border-gray-200 px-3 py-2 cursor-text hover:bg-gray-100 transition-colors duration-200 text-left'
                aria-label='Search furniture'
              >
                <Search size={19} className='text-gray-400 mr-2.5 flex-shrink-0' />
                <span className='text-sm text-gray-500 truncate'>
                  {"Search furniture..."}
                </span>
              </button>
            </div>
          </div>

          {/* MEGA MENU DROPDOWN - ONLY FOR DESKTOP */}
          <AnimatePresence>
            {activeCategory && (
              <MegaMenu
                category={activeCategory}
                onClose={closeMegaMenu}
                onClearTimeout={clearCategoryTimeout}
              />
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Sticky Header on Scroll - MOBILE RESPONSIVE */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            className='fixed top-0 left-0 right-0 z-[10001] bg-white/95 backdrop-blur-md border-b border-gray-300 shadow-sm'
            onMouseLeave={handleCategoryLeave}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
          >
            <div className='max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8'>
              {/* DESKTOP: Category Navigation */}
              <nav className='hidden lg:block'>
                {CategoryNavigation}
              </nav>

              {/* TABLET: Simplified Categories */}
              <nav className='hidden md:block lg:hidden'>
                {TabletCategories}
              </nav>

              {/* MOBILE: Search Input/Button - REPLACES CATEGORIES IN STICKY TOO */}
              <div className='md:hidden py-2 h-10 flex items-center'>
                <button
                  onClick={openSearch}
                  className='flex-1 flex items-center bg-gray-50 border border-gray-200 px-3 py-2 cursor-text hover:bg-gray-100 transition-colors duration-200 text-left'
                  aria-label='Search furniture'
                >
                  <Search size={19} className='text-gray-400 mr-2.5 flex-shrink-0' />
                  <span className='text-sm text-gray-500 truncate'>
                    {"Search furniture..."}
                  </span>
                </button>
              </div>
            </div>

            {/* MEGA MENU for Sticky Header - ONLY FOR DESKTOP */}
            <AnimatePresence>
              {activeCategory && (
                <MegaMenu
                  category={activeCategory}
                  onClose={closeMegaMenu}
                  onClearTimeout={clearCategoryTimeout}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
    </>
  );
};

export default Header;