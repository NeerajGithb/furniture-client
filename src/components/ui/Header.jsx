"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  Heart,
  Plus,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import AuthModal from "../models/AuthModal";
import SearchModal from "../search/SearchModal";
import SearchBar from "../search/SearchBar";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useProductStore } from "@/stores/productStore";
import { useHomeStore } from "@/stores/homeStore";
import UserDropdown from "./UserDropdown";

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
      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-xs font-normal text-white">
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
      className="w-7 h-7 rounded-full object-cover"
      onError={handleError}
    />
  );
});

Avatar.displayName = "Avatar";

const NAV_ITEMS = [
  { href: "/orders", label: "Orders" },
  { href: "/categories", label: "Browse" },
];

const useScrollState = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 80; // Increased threshold to prevent flickering
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial state
    setScrolled(window.scrollY > 80);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return scrolled;
};

const InspirationItem = memo(
  ({ inspiration, isActive, onEnter, onActivate }) => {
    const handleMouseEnter = useCallback(() => {
      onEnter(inspiration.name);
    }, [inspiration.name, onEnter]);

    const handleClick = useCallback(() => {
      onActivate(null);
    }, [onActivate]);

    const displayName = inspiration.name.split(" ")[0];

    return (
      <motion.li
        onMouseEnter={handleMouseEnter}
        className="relative group flex-shrink-0"
        whileHover={{ y: -1 }}
        transition={{ duration: 0.1 }}
      >
        <button
          className="flex items-center gap-1.5 text-sm font-normal text-gray-800 hover:text-black transition-colors duration-150 py-[10px] px-3 rounded hover:bg-gray-50 whitespace-nowrap"
          onClick={handleClick}
          title={inspiration.name}
        >
          <span className="font-semibold">{displayName}</span>
          <motion.div
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <ChevronDown size={12} className="text-gray-600" />
          </motion.div>
        </button>
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-[1px] bg-black rounded-full"
          initial={{ width: 0 }}
          animate={{ width: isActive ? "80%" : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </motion.li>
    );
  }
);

InspirationItem.displayName = "InspirationItem";

const InspirationMegaMenu = memo(
  ({ inspiration, categories, subcategories, onClose, onClearTimeout }) => {
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
    const maxVisibleCategories = 6;
    const maxVisibleSubcategories = 10;

    const visibleCategories = showAllCategories
      ? inspirationCategories
      : inspirationCategories.slice(0, maxVisibleCategories);

    const hasMoreCategories =
      inspirationCategories.length > maxVisibleCategories;

    const getGridColumns = (count) => {
      if (count === 1) return "grid-cols-1 max-w-xs";
      if (count === 2) return "grid-cols-2 max-w-lg";
      if (count === 3) return "grid-cols-3 max-w-2xl";
      if (count === 4) return "grid-cols-4 max-w-4xl";
      return "grid-cols-6 max-w-[1400px]";
    };

    return (
      <motion.div
        key={inspiration.name}
        initial={{ opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-200 z-40"
        onMouseEnter={handleMouseEnter}
      >
        <div
          className={`relative ${getGridColumns(
            visibleCategories.length
          )} mx-auto px-4 py-6`}
        >
          <motion.div
            className={`grid ${
              getGridColumns(visibleCategories.length).split(" ")[0]
            } gap-4`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.2 }}
          >
            {visibleCategories.map((category, categoryIndex) => {
              const categorySubcategories =
                subcategories?.filter((sub) => {
                  const categoryId =
                    typeof sub.categoryId === "object"
                      ? sub.categoryId._id
                      : sub.categoryId;
                  return categoryId === category._id;
                }) || [];

              const isExpanded = expandedSubcategories[category._id];
              const visibleSubs = isExpanded
                ? categorySubcategories
                : categorySubcategories.slice(0, maxVisibleSubcategories);

              const hasMoreSubs =
                categorySubcategories.length > maxVisibleSubcategories;

              return (
                <div
                  key={category._id}
                  className="group relative border-l border-gray-100 pl-3"
                >
                  <div className="space-y-2">
                    <div className="relative">
                      <Link
                        href={`/${category.slug}`}
                        onClick={handleLinkClick}
                        className="block text-sm font-bold text-black hover:text-gray-600 transition-colors duration-150 mb-2 leading-tight"
                        title={category.name}
                      >
                        {category.name}
                      </Link>
                      <div className="h-px bg-gray-100" />
                    </div>

                    <div>
                      {categorySubcategories.length > 0 ? (
                        <>
                          {visibleSubs.map((subcategory) => (
                            <Link
                              key={subcategory._id}
                              href={`/products?c=${category.slug}&sc=${subcategory.slug}`}
                              onClick={handleLinkClick}
                              className="block text-xs text-gray-600 hover:text-black transition-all duration-150 py-0.5 font-normal"
                              title={subcategory.name}
                            >
                              {subcategory.name}
                            </Link>
                          ))}

                          {hasMoreSubs && (
                            <button
                              onClick={() => toggleSubcategories(category._id)}
                              className="flex items-center gap-1 text-xs text-black hover:text-gray-600 font-semibold py-1 mt-1 transition-all duration-150"
                            >
                              {isExpanded
                                ? "Show less"
                                : `+${
                                    categorySubcategories.length -
                                    maxVisibleSubcategories
                                  } more`}
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.15 }}
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
                          className="block text-xs text-gray-600 hover:text-black transition-all duration-150 py-0.5 font-normal"
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

          {hasMoreCategories && !showAllCategories && (
            <motion.div
              className="mt-4 text-center"
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
                    className="inline-flex items-center gap-2 text-xs font-semibold text-black hover:text-gray-600 bg-white hover:bg-gray-50 px-4 py-2 rounded border border-gray-200 hover:border-gray-300 transition-all duration-150 shadow-sm"
                  >
                    <Plus size={14} />
                    Show {inspirationCategories.length -
                      maxVisibleCategories}{" "}
                    more
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }
);

InspirationMegaMenu.displayName = "InspirationMegaMenu";

const Header = () => {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  const categories = useProductStore(categoriesSelector);
  const subcategories = useProductStore(subcategoriesSelector);
  const loadingCategories = useProductStore(loadingCategoriesSelector);
  const {
    inspirations,
    loading: loadingInspirations,
    fetchInspirations,
  } = useHomeStore();

  const initializeRef = useRef(false);
  useEffect(() => {
    if (!initializeRef.current) {
      useProductStore.getState().initialize();
      fetchInspirations();
      initializeRef.current = true;
    }
  }, [fetchInspirations]);

  const [activeInspiration, setActiveInspiration] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scrolled = useScrollState();

  const cartCount = useCartStore(cartCountSelector);
  const wishlistCount = useWishlistStore(wishlistCountSelector);

  const timeoutRef = useRef();

  const transformedInspirations = useMemo(() => {
    if (!inspirations?.length) return [];
    return inspirations.map((insp) => ({
      name: insp.title,
      slug: insp.slug,
      categories: insp.categories || [],
    }));
  }, [JSON.stringify(inspirations)]);

  const activeInspirationData = useMemo(
    () => transformedInspirations.find((i) => i.name === activeInspiration),
    [transformedInspirations, activeInspiration]
  );

  const handleInspirationEnter = useCallback((inspirationName) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveInspiration(inspirationName);
  }, []);

  const handleInspirationLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveInspiration(null), 120);
  }, []);

  const clearInspirationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeMegaMenu = useCallback(() => {
    setActiveInspiration(null);
  }, []);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);
  const toggleDropdown = useCallback(
    () => setIsDropdownOpen((prev) => !prev),
    []
  );
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const openDropdown = useCallback(() => setIsDropdownOpen(true), []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const InspirationNavigation = useMemo(() => {
    if (loadingInspirations) {
      return (
        <div className="flex items-center justify-center gap-3 py-2 h-10">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-12 h-2 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="h-10 flex items-center justify-center overflow-hidden">
        <ul className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto scrollbar-hide px-2 lg:px-0 w-full list-none">
          {transformedInspirations.map((inspiration) => (
            <InspirationItem
              key={inspiration.name}
              inspiration={inspiration}
              isActive={activeInspiration === inspiration.name}
              onEnter={handleInspirationEnter}
              onActivate={setActiveInspiration}
            />
          ))}
        </ul>
      </div>
    );
  }, [
    loadingInspirations,
    JSON.stringify(transformedInspirations),
    activeInspiration,
    handleInspirationEnter,
  ]);

  const TabletInspirations = useMemo(() => {
    if (loadingInspirations) {
      return (
        <div className="h-10 flex items-center justify-center gap-2 px-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="w-16 h-2 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      );
    }

    return (
      <div className="h-10 flex items-center justify-center px-3">
        <div className="flex items-center justify-start md:justify-center gap-3 text-xs overflow-x-auto scrollbar-hide w-full">
          {transformedInspirations.slice(0, 5).map((inspiration) => {
            const displayName =
              inspiration.name.length > 12
                ? `${inspiration.name.slice(0, 12)}...`
                : inspiration.name;
            return (
              <div key={inspiration.name} className="flex-shrink-0">
                <Link
                  href={`/inspirations/${inspiration.slug}`}
                  className="text-gray-800 hover:text-black font-normal transition-colors duration-150 py-2 px-2 rounded hover:bg-gray-50 capitalize whitespace-nowrap"
                  title={inspiration.name}
                >
                  {displayName}
                </Link>
              </div>
            );
          })}
          {transformedInspirations.length > 5 && (
            <div className="flex-shrink-0">
              <Link
                href="/inspirations"
                className="text-gray-600 hover:text-black text-xs transition-colors duration-150 py-2 px-2 whitespace-nowrap"
              >
                More
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }, [loadingInspirations, JSON.stringify(transformedInspirations)]);

  return (
    <>
      <header className="relative z-30 bg-white border-b border-gray-200">
        <div className="h-14 flex items-center">
          <div className="px-3 sm:px-4 lg:px-6 w-full max-w-[1500px] mx-auto">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                <motion.button
                  onClick={openSidebar}
                  className="sm:hidden p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150"
                  aria-label="Open menu"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu size={18} />
                </motion.button>

                <Link
                  href="/"
                  className="flex items-center gap-2 hover:opacity-90 transition-opacity duration-150"
                >
                  <Image
                    src="/logo.png"
                    alt="VFurniture"
                    width={24}
                    height={24}
                    className="rounded w-6 h-6 sm:w-7 sm:h-7"
                  />
                  <span className="text-sm sm:text-base font-bold tracking-tight">
                    <span className="text-black">V</span>
                    <span className="text-gray-900">Furniture</span>
                  </span>
                </Link>
              </div>

              <div className="hidden md:flex flex-1 max-w-[600px] mx-4 lg:mx-6">
                <SearchBar className="w-full" />
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <nav className="hidden xl:flex items-center gap-1 mr-2">
                  {NAV_ITEMS.map(({ href, label }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`relative group text-sm font-normal px-2 py-1.5 transition-colors duration-150 rounded ${
                          isActive
                            ? "text-black bg-gray-50"
                            : "text-gray-800 hover:text-black hover:bg-gray-50"
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`absolute left-0 -bottom-0.5 h-0.5 bg-black transition-all duration-200 ease-out ${
                            isActive ? "w-full" : "w-0 group-hover:w-full"
                          }`}
                        />
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-1 sm:gap-2">
                  <motion.button
                    onClick={openSearch}
                    className="md:hidden p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150"
                    aria-label="Search"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Search size={18} />
                  </motion.button>

                  <Link
                    href="/wishlist"
                    className="relative p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150"
                    aria-label="Wishlist"
                  >
                    <Heart size={18} />
                    {wishlistCount > 0 && (
                      <motion.span
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-black text-white text-xs rounded-full flex items-center justify-center font-normal"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        {wishlistCount > 9 ? "9+" : wishlistCount}
                      </motion.span>
                    )}
                  </Link>

                  <Link
                    href="/cart"
                    className="relative p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150"
                    aria-label="Shopping cart"
                  >
                    <ShoppingCart size={18} />
                    {cartCount > 0 && (
                      <motion.span
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-black text-white text-xs rounded-full flex items-center justify-center font-normal"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        {cartCount > 9 ? "9+" : cartCount}
                      </motion.span>
                    )}
                  </Link>

                  {authLoading ? (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  ) : user ? (
                    <div className="relative">
                      <motion.button
                        onClick={toggleDropdown}
                        onMouseEnter={openDropdown}
                        data-dropdown-trigger="true" // Add this attribute
                        className="p-1 rounded hover:bg-gray-50 transition-colors duration-150"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Avatar
                          src={user?.photoURL || ""}
                          alt="User Avatar"
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
                      className="flex items-center p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Login"
                    >
                      <User size={18} />
                      <span className="hidden lg:inline ml-1.5 text-xs">
                        Login
                      </span>
                    </motion.button>
                  )}
                  <motion.button
                    onClick={openSidebar}
                    className="hidden sm:flex xl:hidden p-2 text-gray-800 hover:text-black hover:bg-gray-50 rounded transition-all duration-150"
                    aria-label="Open menu"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Menu size={18} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative bg-white border-t border-gray-100"
          onMouseLeave={handleInspirationLeave}
        >
          <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">
            <nav className="hidden lg:block">{InspirationNavigation}</nav>

            <nav className="hidden md:block lg:hidden">
              {TabletInspirations}
            </nav>

            <div className="md:hidden py-2 h-10 flex items-center">
              <button
                onClick={openSearch}
                className="flex-1 flex items-center bg-gray-50 border border-gray-200 px-3 py-2.5 cursor-text hover:bg-gray-100 transition-colors duration-150 text-left rounded"
                aria-label="Search furniture"
              >
                <Search
                  size={16}
                  className="text-gray-500 mr-2 flex-shrink-0"
                />
                <span className="text-xs text-gray-500 truncate">
                  Search furniture...
                </span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {activeInspirationData && (
              <InspirationMegaMenu
                inspiration={activeInspirationData}
                categories={categories}
                subcategories={subcategories}
                onClose={closeMegaMenu}
                onClearTimeout={clearInspirationTimeout}
              />
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Sticky Header - Only render when scrolled */}
      <AnimatePresence mode="wait">
        {scrolled && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-[10001] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
            onMouseLeave={handleInspirationLeave}
            initial={{ y: -100, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.8, // smoother slide-in
                ease: "easeInOut",
              },
            }}
            exit={{
              y: -100,
              opacity: 0,
              transition: {
                duration: 0, // sudden/fast exit
                ease: "easeIn",
              },
            }}
          >
            <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">
              <nav className="hidden lg:block">{InspirationNavigation}</nav>

              <nav className="hidden md:block lg:hidden">
                {TabletInspirations}
              </nav>

              <div className="md:hidden py-2 h-10 flex items-center">
                <button
                  onClick={openSearch}
                  className="flex-1 flex items-center bg-gray-50 border border-gray-200 px-3 py-2.5 cursor-text hover:bg-gray-100 transition-colors duration-150 text-left rounded"
                  aria-label="Search furniture"
                >
                  <Search
                    size={16}
                    className="text-gray-500 mr-2 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-500 truncate">
                    Search furniture...
                  </span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {activeInspirationData && (
                <InspirationMegaMenu
                  inspiration={activeInspirationData}
                  categories={categories}
                  subcategories={subcategories}
                  onClose={closeMegaMenu}
                  onClearTimeout={clearInspirationTimeout}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
    </>
  );
};

export default Header;
