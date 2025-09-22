'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, ChevronDown, Heart, Plus } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import AuthModal from '../models/AuthModal';
import SearchModal from '../search/SearchModal';
import SearchBar from '../search/SearchBar';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useProductStore } from '@/stores/productStore';
import { useHomeStore } from '@/stores/homeStore';
import UserDropdown from './UserDropdown';
import { useMediaQuery } from '@/utils/useMediaQuery';

const cartCountSelector = (state) => state.cart?.items?.length || 0;
const wishlistCountSelector = (state) => state.wishlist?.items?.length || 0;
const categoriesSelector = (state) => state.categories;
const subcategoriesSelector = (state) => state.subcategories;
const loadingCategoriesSelector = (state) => state.loadingCategories;

const Avatar = memo(({ src, alt, fallbackText }) => {
  const [imageError, setImageError] = useState(false);
  const handleError = useCallback(() => setImageError(true), []);

  if (!src || imageError) {
    return (
      <div className="w-8 h-8 min-h-8 min-w-8 bg-black rounded-full flex items-center justify-center text-xs font-normal text-white">
        {fallbackText}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={28}
      height={28}
      className="w-7 min-h-7 min-w-7 h-7 rounded-full object-cover aspect-square"
      onError={handleError}
    />
  );
});

Avatar.displayName = 'Avatar';

const NAV_ITEMS = [
  { href: '/orders', label: 'Orders' },
  { href: '/categories', label: 'Browse' },
];

const useScrollState = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 100;
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return scrolled;
};

const InspirationItem = memo(({ inspiration, isActive, onEnter, onActivate, onGetPosition }) => {
  const itemRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    onEnter(inspiration.name);
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      onGetPosition(rect);
    }
  }, [inspiration.name, onEnter, onGetPosition]);

  const handleClick = useCallback(() => {
    onActivate(null);
  }, [onActivate]);

  const displayName = inspiration.name.split(' ')[0];

  return (
    <motion.li
      ref={itemRef}
      onMouseEnter={handleMouseEnter}
      className="relative group flex-shrink-0"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.1 }}
    >
      <button
        className="flex items-center gap-1 text-sm font-normal text-gray-800 hover:text-red-600 transition-colors duration-150 py-2.5 px-3  whitespace-nowrap min-w-0"
        onClick={handleClick}
        title={inspiration.name}
      >
        <span className="font-medium truncate">{displayName}</span>
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown size={12} className="text-gray-600" />
        </motion.div>
      </button>
    </motion.li>
  );
});

InspirationItem.displayName = 'InspirationItem';

const InspirationMegaMenu = memo(
  ({ inspiration, categories, subcategories, onClose, onClearTimeout, tabPosition }) => {
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [expandedSubcategories, setExpandedSubcategories] = useState({});

    const handleMouseEnter = useCallback(() => {
      onClearTimeout();
    }, [onClearTimeout]);

    const handleLinkClick = useCallback(() => {
      onClose();
    }, [onClose]);

    const toggleSubcategories = useCallback((categoryId) => {
      setExpandedSubcategories((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));
    }, []);

    if (!inspiration) return null;

    const inspirationCategories = inspiration.categories || [];
    const maxVisibleCategories = 5;
    const maxVisibleSubcategories = 8;

    const visibleCategories = showAllCategories
      ? inspirationCategories
      : inspirationCategories.slice(0, maxVisibleCategories);

    const hasMoreCategories = inspirationCategories.length > maxVisibleCategories;

    const getDropdownWidthValue = (count, viewportWidth) => {
      if (viewportWidth < 640) return Math.min(viewportWidth - 32, 320);
      if (viewportWidth < 768) return Math.min(viewportWidth - 32, 480);
      if (viewportWidth < 1024) return Math.min(viewportWidth - 64, 640);

      if (count === 0 || count === 1) return 180;
      if (count === 2) return 460;
      if (count === 3) return 640;
      if (count === 4) return 660;
      if (count === 5) return 760;
      return Math.min(1400, count * 160);
    };

    const getGridColumns = (count, viewportWidth) => {
      if (viewportWidth < 640) return 'grid-cols-1';
      if (viewportWidth < 768) return count > 1 ? 'grid-cols-2' : 'grid-cols-1';
      if (viewportWidth < 1024)
        return count > 2 ? 'grid-cols-3' : `grid-cols-${Math.max(1, count)}`;

      if (count === 0 || count === 1) return 'grid-cols-1';
      if (count === 2) return 'grid-cols-2';
      if (count === 3) return 'grid-cols-3';
      if (count === 4) return 'grid-cols-4';
      return 'grid-cols-5';
    };

    const getDropdownPosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = viewportWidth < 640 ? 12 : 16;

      if (viewportWidth < 640) {
        return {
          left: `${padding}px`,
          right: `${padding}px`,
          transform: 'none',
          width: 'auto',
          maxHeight: `${Math.min(viewportHeight * 0.7, 500)}px`,
          overflowY: 'auto',
        };
      }

      const dropdownWidth = getDropdownWidthValue(visibleCategories.length, viewportWidth);

      if (!tabPosition) {
        return {
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${dropdownWidth}px`,
          maxHeight: `${Math.min(viewportHeight * 0.8, 600)}px`,
          overflowY: 'auto',
        };
      }

      const tabCenter = tabPosition.left + tabPosition.width / 2;
      let leftPosition = tabCenter - dropdownWidth / 2;

      const minLeft = padding;
      if (leftPosition < minLeft) {
        leftPosition = minLeft;
      }

      const maxLeft = viewportWidth - dropdownWidth - padding;
      if (leftPosition > maxLeft) {
        leftPosition = maxLeft;
      }

      if (dropdownWidth > viewportWidth - padding * 2) {
        return {
          left: `${padding}px`,
          right: `${padding}px`,
          transform: 'none',
          width: 'auto',
          maxHeight: `${Math.min(viewportHeight * 0.8, 600)}px`,
          overflowY: 'auto',
        };
      }

      return {
        left: `${leftPosition}px`,
        transform: 'none',
        width: `${dropdownWidth}px`,
        maxHeight: `${Math.min(viewportHeight * 0.8, 600)}px`,
        overflowY: 'auto',
      };
    };

    const positionStyle = getDropdownPosition();
    const viewportWidth = window.innerWidth;

    return (
      <motion.div
        key={inspiration.name}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="absolute top-full z-50 bg-white shadow-lg border border-gray-200 rounded-xs"
        style={{
          left: positionStyle.left,
          right: positionStyle.right || 'auto',
          width: positionStyle.width || 'auto',
          transform: positionStyle.transform,
          maxHeight: positionStyle.maxHeight,
          overflowY: positionStyle.overflowY,
          maxWidth: 'calc(100vw - 24px)',
        }}
        onMouseEnter={handleMouseEnter}
      >
        <div className="p-4">
          {visibleCategories.length > 0 ? (
            <motion.div
              className={`grid ${getGridColumns(visibleCategories.length, viewportWidth)} gap-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              {visibleCategories.map((category, categoryIndex) => {
                const categorySubcategories =
                  subcategories?.filter((sub) => {
                    const categoryId =
                      typeof sub.categoryId === 'object' ? sub.categoryId?._id : sub.categoryId;
                    return categoryId === category._id;
                  }) || [];

                const isExpanded = expandedSubcategories[category._id];
                const visibleSubs = isExpanded
                  ? categorySubcategories
                  : categorySubcategories.slice(0, maxVisibleSubcategories);

                const hasMoreSubs = categorySubcategories.length > maxVisibleSubcategories;

                return (
                  <div key={category._id} className="group relative min-w-0">
                    <div className="space-y-3">
                      <div className="relative">
                        <Link
                          href={`/${category.slug || ''}`}
                          onClick={handleLinkClick}
                          className="block text-sm font-semibold text-black hover:text-red-600 transition-colors duration-150 mb-2 leading-tight truncate"
                          title={category.name}
                        >
                          {category.name}
                        </Link>
                        <div className="h-px bg-gray-200" />
                      </div>

                      <div className="space-y-1">
                        {categorySubcategories.length > 0 ? (
                          <>
                            {visibleSubs.map((subcategory) => (
                              <Link
                                key={subcategory._id}
                                href={`/${subcategory.slug}`}
                                onClick={handleLinkClick}
                                className="block text-xs text-gray-600 hover:text-red-600 transition-all duration-150 py-1.5 font-normal px-2 truncate"
                                title={subcategory.name}
                              >
                                {subcategory.name}
                              </Link>
                            ))}

                            {hasMoreSubs && (
                              <button
                                onClick={() => toggleSubcategories(category._id)}
                                className="flex items-center gap-1 text-xs text-black hover:text-red-600 font-semibold py-1.5 mt-2 transition-all duration-150  rounded px-2 w-full text-left"
                              >
                                <span className="truncate">
                                  {isExpanded
                                    ? 'Show less'
                                    : `+${
                                        categorySubcategories.length - maxVisibleSubcategories
                                      } more`}
                                </span>
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="flex-shrink-0"
                                >
                                  <ChevronDown size={10} />
                                </motion.div>
                              </button>
                            )}
                          </>
                        ) : (
                          <Link
                            href={`/${category.slug}`}
                            onClick={handleLinkClick}
                            className="block text-xs text-gray-600 hover:text-red-600 transition-all duration-150 py-1.5 font-normal px-2"
                          >
                            View all
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No categories available</p>
            </div>
          )}

          {hasMoreCategories && !showAllCategories && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <button
                    onClick={() => setShowAllCategories(true)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-black hover:text-red-600 bg-white  px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-150 shadow-sm whitespace-nowrap"
                  >
                    <Plus size={14} className="flex-shrink-0" />
                    <span>Show {inspirationCategories.length - maxVisibleCategories} more</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  },
);

InspirationMegaMenu.displayName = 'InspirationMegaMenu';

const Header = () => {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  const categories = useProductStore(categoriesSelector);
  const subcategories = useProductStore(subcategoriesSelector);
  const loadingCategories = useProductStore(loadingCategoriesSelector);
  const { inspirations, loading: loadingInspirations, fetchInspirations } = useHomeStore();

  const [isMounted, setIsMounted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const initializeRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);

    const initializeData = async () => {
      if (initializeRef.current) return;
      initializeRef.current = true;

      try {
        await useProductStore.getState().initializeProducts();

        const state = useProductStore.getState();
        if (state.categories.length > 0 && state.subcategories.length > 0) {
          setDataLoaded(true);
        }

        await fetchInspirations();

        setDataLoaded(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setDataLoaded(true);
      }
    };

    initializeData();
  }, [fetchInspirations]);

  const [activeInspiration, setActiveInspiration] = useState(null);
  const [tabPosition, setTabPosition] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const scrolled = useScrollState();
  const isMdDown = useMediaQuery('(max-width: 767px)');
  const cartCount = useCartStore(cartCountSelector);
  const wishlistCount = useWishlistStore(wishlistCountSelector);

  const timeoutRef = useRef();

  const transformedInspirations = useMemo(() => {
    if (!inspirations?.length || !categories?.length) return [];

    return inspirations.map((insp) => {
      const matchedCategories = (insp.categories || [])
        .map((catId) => {
          return (
            categories.find((cat) => cat._id === catId) ||
            categories.find((cat) => cat._id === catId._id)
          );
        })
        .filter(Boolean);

      return {
        name: insp.title,
        slug: insp.slug,
        categories: matchedCategories,
      };
    });
  }, [inspirations, categories]);

  const activeInspirationData = useMemo(
    () => transformedInspirations.find((i) => i.name === activeInspiration),
    [transformedInspirations, activeInspiration],
  );

  const handleInspirationEnter = useCallback((inspirationName) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveInspiration(inspirationName);
  }, []);

  const handleGetTabPosition = useCallback((rect) => {
    setTabPosition(rect);
  }, []);

  const handleInspirationLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setActiveInspiration(null);
      setTabPosition(null);
    }, 150);
  }, []);

  const clearInspirationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeMegaMenu = useCallback(() => {
    setActiveInspiration(null);
    setTabPosition(null);
  }, []);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);
  const toggleDropdown = useCallback(() => setIsDropdownOpen((prev) => !prev), []);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const openDropdown = useCallback(() => setIsDropdownOpen(true), []);
  const [currentQuery, setCurrentQuery] = useState('');

  useEffect(() => {
    const syncQuery = () => {
      try {
        const lastQuery = localStorage.getItem('lastSearchQuery');
        if (lastQuery && lastQuery.trim()) {
          setCurrentQuery(lastQuery);
        }
      } catch (error) {
        console.error('Error reading search query:', error);
      }
    };

    syncQuery();
    window.addEventListener('storage', syncQuery);

    const handleQueryUpdate = (event) => {
      if (event.detail?.query) {
        setCurrentQuery(event.detail.query);
      }
    };

    window.addEventListener('searchQueryUpdated', handleQueryUpdate);

    return () => {
      window.removeEventListener('storage', syncQuery);
      window.removeEventListener('searchQueryUpdated', handleQueryUpdate);
    };
  }, []);

  useEffect(() => {
    if (pathname !== '/search') {
      setCurrentQuery('');
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const InspirationNavigation = useMemo(() => {
    const hasCategories = categories?.length > 0;
    const hasInspirations = inspirations?.length > 0;

    if ((!hasCategories && loadingCategories) || (!hasInspirations && loadingInspirations)) {
      return (
        <div className="flex items-center justify-center gap-3 py-2 h-10 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="h-10 flex items-center justify-center overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <ul className="flex items-center justify-start md:justify-center gap-1 px-2 md:px-0 list-none min-w-max">
            {transformedInspirations.map((inspiration) => (
              <InspirationItem
                key={inspiration.name}
                inspiration={inspiration}
                isActive={activeInspiration === inspiration.name}
                onEnter={handleInspirationEnter}
                onActivate={setActiveInspiration}
                onGetPosition={handleGetTabPosition}
              />
            ))}
          </ul>
        </div>
      </div>
    );
  }, [
    categories,
    inspirations,
    loadingCategories,
    loadingInspirations,
    transformedInspirations,
    activeInspiration,
    handleInspirationEnter,
    handleGetTabPosition,
  ]);

  const renderAuthSection = () => {
    if (!isMounted || authLoading) {
      return (
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-gray-800" />
        </div>
      );
    }

    if (user) {
      return (
        <div className="relative flex-shrink-0">
          <motion.button
            onClick={toggleDropdown}
            onMouseEnter={openDropdown}
            data-dropdown-trigger="true"
            className="p-1 rounded hover:bg-gray-50 transition-colors duration-150"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Avatar
              src={user?.photoURL || ''}
              alt="User Avatar"
              fallbackText={user?.name?.[0]?.toUpperCase() || 'U'}
            />
          </motion.button>
          <UserDropdown isOpen={isDropdownOpen} onClose={closeDropdown} />
        </div>
      );
    }

    return (
      <motion.button
        onClick={openAuth}
        className="flex items-center p-2 text-gray-800 hover:text-gray-600 hover:bg-gray-50 rounded transition-all duration-150 flex-shrink-0"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Login"
      >
        <User size={18} />
        <span className="hidden md:inline ml-1.5 text-xs whitespace-nowrap">Login</span>
      </motion.button>
    );
  };

  const fixedHeaderClasses = 'fixed top-0 left-0 right-0 z-50 shadow-[0_2px_1px_rgba(0,0,0,0.15)]';
  const headerClasses = `h-[52px] md:h-14 flex items-center bg-white md:shadow-xs ${
    isMdDown ? fixedHeaderClasses : ''
  }`;

  return (
    <>
      <header className="relative z-50 bg-white border-b border-gray-100">
        <div className={headerClasses}>
          <div className="px-3 sm:px-4 md:px-6 w-full max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between h-full gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                <motion.button
                  onClick={openSidebar}
                  className="md:hidden p-1 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150 flex-shrink-0"
                  aria-label="Open menu"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu size={20} />
                </motion.button>

                <Link
                  href="/"
                  className="flex items-center gap-2 hover:opacity-90 transition-opacity duration-150 min-w-0"
                >
                  <Image
                    src="/logo.png"
                    alt="VFurniture"
                    width={28}
                    height={28}
                    className="rounded w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base font-bold tracking-tight whitespace-nowrap">
                    <span className="text-black">V</span>
                    <span className="text-gray-900">Furniture</span>
                  </span>
                </Link>
              </div>

              <div className="hidden md:flex flex-1 max-w-[600px] mx-4 md:mx-6">
                <SearchBar className="w-full" />
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <nav className="hidden xl:flex items-center gap-1 mr-2">
                  {NAV_ITEMS.map(({ href, label }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`relative group text-sm font-normal px-3 py-2 transition-colors duration-150 rounded whitespace-nowrap ${
                          isActive
                            ? 'text-black bg-gray-50'
                            : 'text-gray-800 hover:text-black hover:bg-gray-50'
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`absolute left-0 -bottom-0.5 h-0.5 bg-black transition-all duration-200 ease-out ${
                            isActive ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                        />
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-1 sm:gap-2 relative max-md:w-full">
                  <motion.div
                    className="flex items-center gap-1 sm:gap-2"
                    animate={{
                      x: scrolled && isMdDown ? -44 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      duration: 0.3,
                    }}
                  >
                    <Link
                      href="/wishlist"
                      className="relative p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150 flex-shrink-0"
                      aria-label="Wishlist"
                    >
                      <Heart size={18} />
                      {wishlistCount > 0 && (
                        <motion.span
                          className="absolute top-1 md:-top-0.5 -right-0.5 md:w-4 md:h-4 h-3 w-3 bg-black text-white text-[8px] md:text-xs rounded-full flex items-center justify-center font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 15,
                          }}
                        >
                          {wishlistCount > 9 ? '9+' : wishlistCount}
                        </motion.span>
                      )}
                    </Link>

                    <Link
                      href="/cart"
                      className="relative p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150 flex-shrink-0"
                      aria-label="Shopping cart"
                    >
                      <ShoppingCart size={18} />
                      {cartCount > 0 && (
                        <motion.span
                          className="absolute top-1 md:-top-0.5 -right-0.5 md:w-4 md:h-4 h-3 w-3 bg-black text-white text-[8px] md:text-xs rounded-full flex items-center justify-center font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 15,
                          }}
                        >
                          {cartCount > 9 ? '9+' : cartCount}
                        </motion.span>
                      )}
                    </Link>

                    {renderAuthSection()}
                  </motion.div>

                  <AnimatePresence>
                    {scrolled && isMdDown && (
                      <motion.div
                        className="absolute right-0 top-1/2 transform -translate-y-1/2"
                        initial={{ opacity: 0, x: 44 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 44 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                          duration: 0.3,
                        }}
                      >
                        <motion.button
                          onClick={openSearch}
                          className="md:hidden p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150 flex-shrink-0 bg-white"
                          aria-label="Search"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Search size={18} />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {scrolled && !isMdDown && (
            <motion.div
              className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
              onMouseLeave={handleInspirationLeave}
              initial={{ y: -100, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.8,
                  ease: 'easeInOut',
                },
              }}
              exit={{
                y: -100,
                opacity: 0,
                transition: {
                  duration: 0,
                  ease: 'easeIn',
                },
              }}
            >
              <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6">
                <nav className="hidden md:block">{InspirationNavigation}</nav>
              </div>

              <AnimatePresence>
                {activeInspirationData && (
                  <InspirationMegaMenu
                    inspiration={activeInspirationData}
                    categories={categories}
                    subcategories={subcategories}
                    onClose={closeMegaMenu}
                    onClearTimeout={clearInspirationTimeout}
                    tabPosition={tabPosition}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="relative bg-white md:border-t md:border-gray-100 max-md:mt-[52px] max-md:px-1"
          onMouseLeave={handleInspirationLeave}
        >
          <div className="max-w-[1600px] mx-auto px-2 md:px-6">
            <nav className={`md:block ${scrolled && !isMdDown ? 'hidden' : 'hidden md:block'}`}>
              {InspirationNavigation}
            </nav>

            <div className="md:hidden h-[60px] py-[10px] flex items-center">
              <AnimatePresence>
                {!isSearchOpen && (
                  <motion.div
                    key="search-bar"
                    className="w-full"
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <motion.button
                      onClick={openSearch}
                      className="w-full flex items-center justify-between bg-white border border-gray-200 px-2 py-[9px] cursor-text hover:bg-gray-100 transition-colors duration-150 text-left rounded-xs"
                      aria-label="Search furniture"
                      whileTap={{ scale: 0.98 }}
                    >
                      <span
                        className={`text-sm truncate ${
                          currentQuery ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}
                      >
                        {currentQuery || 'What are you looking for?'}
                      </span>
                      <Search size={16} className="text-gray-600 flex-shrink-0" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {activeInspirationData && (!scrolled || isMdDown) && (
              <InspirationMegaMenu
                inspiration={activeInspirationData}
                categories={categories}
                subcategories={subcategories}
                onClose={closeMegaMenu}
                onClearTimeout={clearInspirationTimeout}
                tabPosition={tabPosition}
              />
            )}
          </AnimatePresence>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} initialQuery={currentQuery} />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
    </>
  );
};

export default Header;
