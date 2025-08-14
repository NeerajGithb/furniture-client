"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, User, Menu, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import AuthModal from "./AuthModal";
import SearchModal from "./SearchModal";
import UserDropdown from "./UserDropdown";

// Avatar Component
const Avatar = ({ src, alt, fallbackText }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700'>
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
      onError={() => setImageError(true)}
    />
  );
};

const navItems = [
  { href: "/orders", label: "My Orders" },
  { href: "/wishlist", label: "Wishlist" },
];

const categories = [
  {
    name: "Beds",
    groups: [
      {
        title: "Bedroom Essentials",
        items: [
          { name: "Beds & Mattresses", slug: "beds-and-mattresses" },
          { name: "Bedside Tables", slug: "bedside-tables" },
          { name: "Contemporary Bedside", slug: "contemporary-bedside" },
          { name: "Modern Bedside", slug: "modern-bedside" },
          { name: "Traditional Bedside", slug: "traditional-bedside" },
          { name: "Storage Beds", slug: "storage-beds" },
        ],
      },
    ],
  },
  {
    name: "Sofas",
    groups: [
      {
        title: "Seating Solutions",
        items: [
          { name: "3 Seater Sofas", slug: "3-seater-sofas" },
          { name: "2 Seater Sofas", slug: "2-seater-sofas" },
          { name: "1 Seater Sofas", slug: "1-seater-sofas" },
          { name: "Sofa Sets", slug: "sofa-sets" },
          { name: "Customized Sofas", slug: "customized-sofas" },
          { name: "Reclining Sofas", slug: "reclining-sofas" },
        ],
      },
    ],
  },
  {
    name: "Dining",
    groups: [
      {
        title: "Dining Collections",
        items: [
          { name: "4 Seater Dining Sets", slug: "4-seater-dining" },
          { name: "6 Seater Dining Sets", slug: "6-seater-dining" },
          { name: "8 Seater Dining Sets", slug: "8-seater-dining" },
          { name: "2 Seater Dining Sets", slug: "2-seater-dining" },
          { name: "Bar Height Tables", slug: "bar-height-tables" },
        ],
      },
    ],
  },
  {
    name: "Sectionals",
    groups: [
      {
        title: "Modular Seating",
        items: [
          { name: "L-Shaped Sectionals", slug: "l-shaped-sectionals" },
          { name: "U-Shaped Sectionals", slug: "u-shaped-sectionals" },
          { name: "Corner Sofas", slug: "corner-sofas" },
          { name: "Modular Pieces", slug: "modular-pieces" },
        ],
      },
    ],
  },
  {
    name: "Chairs",
    groups: [
      {
        title: "Accent Seating",
        items: [
          { name: "Armchairs", slug: "armchairs" },
          { name: "Accent Chairs", slug: "accent-chairs" },
          { name: "Rocking Chairs", slug: "rocking-chairs" },
          { name: "Office Chairs", slug: "office-chairs" },
          { name: "Dining Chairs", slug: "dining-chairs" },
        ],
      },
    ],
  },
  {
    name: "Storage",
    groups: [
      {
        title: "Organization",
        items: [
          { name: "Wardrobes", slug: "wardrobes" },
          { name: "Chest of Drawers", slug: "chest-of-drawers" },
          { name: "Bookshelves", slug: "bookshelves" },
          { name: "TV Units", slug: "tv-units" },
          { name: "Storage Ottomans", slug: "storage-ottomans" },
        ],
      },
    ],
  },
];

const Header = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Scroll states
  const [scrollY, setScrollY] = useState(0);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [showStickyTopbar, setShowStickyTopbar] = useState(false);

  // Refs for measuring header height
  const headerRef = useRef();
  const [headerHeight, setHeaderHeight] = useState(0);

  // Timeout for sticky topbar delay
  const stickyDelayRef = useRef();

  // Search placeholder animation
  const placeholders = [
    "Search for sofas...",
    "Search for beds...",
    "Search for dining sets...",
    "Search for office chairs...",
    "Search for bookshelves...",
  ];

  const [placeholderText, setPlaceholderText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category dropdown states
  const [activeCat, setActiveCat] = useState(null);
  const [prevIdx, setPrevIdx] = useState(0);
  const timeoutRef = useRef();

  // Modal states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Refs
  const avatarRef = useRef();

  // Measure header height on mount
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  // Scroll behavior - like major e-commerce sites
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? "down" : "up";

      setScrollY(currentScrollY);

      // Clear any existing delay timeout
      if (stickyDelayRef.current) {
        clearTimeout(stickyDelayRef.current);
      }

      // When at top - show everything normally
      if (currentScrollY <= 10) {
        setIsHeaderScrolled(false);
        setShowStickyTopbar(false);
      }
      // When header is completely out of viewport - show sticky topbar after delay
      else if (currentScrollY > headerHeight && direction === "down") {
        setIsHeaderScrolled(true);

        // Show sticky topbar after 500ms delay
        stickyDelayRef.current = setTimeout(() => {
          setShowStickyTopbar(true);
        }, 500);
      }
      // When scrolling up but still past header height - keep sticky topbar
      else if (currentScrollY > headerHeight && direction === "up") {
        setIsHeaderScrolled(true);
        setShowStickyTopbar(true);
      }
      // When header comes back into viewport - hide sticky topbar
      else if (currentScrollY <= headerHeight) {
        setIsHeaderScrolled(false);
        setShowStickyTopbar(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (stickyDelayRef.current) {
        clearTimeout(stickyDelayRef.current);
      }
    };
  }, [headerHeight]);

  // Placeholder animation effect
  useEffect(() => {
    const currentPhrase = placeholders[currentPhraseIndex];

    const timeout = setTimeout(
      () => {
        if (isDeleting) {
          setPlaceholderText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        } else {
          setPlaceholderText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }

        if (isDeleting && charIndex === 0) {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % placeholders.length);
        }
      },
      isDeleting ? 50 : 120
    );

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentPhraseIndex, placeholders]);

  // Category dropdown handlers
  const handleEnter = (catName, idx) => {
    clearTimeout(timeoutRef.current);
    setPrevIdx(categories.findIndex((c) => c.name === activeCat));
    setActiveCat(catName);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveCat(null), 150);
  };

  // Modal handlers
  const openSidebar = () => setIsSidebarOpen(true);
  const openSearch = () => setIsSearchOpen(true);
  const openAuth = () => setIsAuthOpen(true);
  const openDropdown = (ref) => setIsDropdownOpen(true);

  const active = categories.find((c) => c.name === activeCat);

  return (
    <>
      {/* Main Header - Scrolls naturally with page */}
      <header ref={headerRef} className='relative z-40 bg-white border-b border-gray-100 shadow-sm'>
        {/* Main Header */}
        <div className='py-3'>
          <div className='px-4 '>
            <div className='flex items-center justify-between h-full'>
              {/* LEFT: Logo + Search */}
              <div className='flex items-center flex-1'>
                <Link
                  href='/'
                  className='flex items-center gap-3 hover:opacity-90 transition-opacity duration-200 mr-8'
                >
                  <Image src='/logo.png' alt='vFurniture' width={40} height={40} className='rounded' />
                  <span className='text-2xl font-bold tracking-tight'>
                    <span className='text-black'>V</span>
                    <span className='text-gray-900'>Furniture</span>
                  </span>
                </Link>

                {/* Desktop Search Bar */}
                <div className='hidden lg:flex flex-1 max-w-2xl'>
                  <div className='relative w-full'>
                    <form
                      onSubmit={(e) => e.preventDefault()}
                      className='flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 w-full hover:border-gray-300 focus-within:border-black focus-within:bg-white transition-all duration-200'
                    >
                      <Search size={20} className='text-gray-400 mr-3 flex-shrink-0' />
                      <input
                        type='text'
                        placeholder={placeholderText}
                        className='w-full text-sm text-gray-900 placeholder:text-gray-500 bg-transparent outline-none'
                      />
                    </form>
                  </div>
                </div>
              </div>

              {/* RIGHT: Navigation + Actions */}
              <div className='flex items-center gap-1 sm:gap-4'>
                {/* Mobile/Tablet Search Button */}
                <motion.button
                  onClick={openSearch}
                  className='lg:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200'
                  aria-label='Search'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search size={20} />
                </motion.button>

                {/* Desktop Navigation Links */}
                <nav className='hidden xl:flex items-center gap-8'>
                  {navItems.map(({ href, label }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`relative group text-sm font-medium px-2 py-1 transition-colors duration-200 ${
                          isActive ? "text-black" : "text-gray-600 hover:text-black"
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`absolute left-0 -bottom-1 h-0.5 bg-black transition-all duration-300 ease-out ${
                            isActive ? "w-full" : "w-0 group-hover:w-full"
                          }`}
                        />
                      </Link>
                    );
                  })}
                </nav>

                {/* Cart Icon */}
                <Link
                  href='/cart'
                  className='relative p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200'
                  aria-label='Shopping cart'
                >
                  <ShoppingCart size={20} />
                  <motion.span
                    className='absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center'
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    0
                  </motion.span>
                </Link>

                {/* Auth/Profile */}
                {!loading && user ? (
                  <div className='relative'>
                    <motion.button
                      ref={avatarRef}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      onMouseEnter={() => setIsDropdownOpen(true)}
                      className='p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200'
                      data-dropdown-trigger
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Avatar
                        src={user?.photoURL || ""}
                        alt='User Avatar'
                        fallbackText={user?.name?.[0]?.toUpperCase() || "U"}
                      />
                    </motion.button>
                    <UserDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
                  </div>
                ) : (
                  <motion.button
                    onClick={openAuth}
                    className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User size={18} />
                    <span className='hidden sm:inline'>Login</span>
                  </motion.button>
                )}

                {/* Mobile Menu Button */}
                <motion.button
                  onClick={openSidebar}
                  className='xl:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 ml-2'
                  aria-label='Open menu'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu size={20} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Topbar - Part of main header, no gap */}
        <div className='relative bg-white border-t border-gray-100' onMouseLeave={handleLeave}>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            {/* DESKTOP: Category Navigation */}
            <nav className='hidden lg:block'>
              <ul className='flex items-center justify-center gap-8 py-4'>
                {categories.map((cat, i) => (
                  <motion.li
                    key={cat.name}
                    onMouseEnter={() => handleEnter(cat.name, i)}
                    className='relative group'
                    whileHover={{ y: -1 }}
                  >
                    <button className='flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-gray-50'>
                      <span>{cat.name}</span>
                      <motion.div animate={{ rotate: activeCat === cat.name ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} />
                      </motion.div>
                    </button>
                    <motion.div
                      className='absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-black'
                      initial={{ width: 0 }}
                      animate={{
                        width: activeCat === cat.name ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* TABLET: Simplified Categories */}
            <nav className='hidden md:block lg:hidden'>
              <ul className='flex items-center justify-center gap-6 py-3 text-sm overflow-x-auto'>
                {categories.slice(0, 4).map((cat) => (
                  <li key={cat.name} className='whitespace-nowrap'>
                    <Link
                      href={`/products?category=${cat.name.toLowerCase()}`}
                      className='text-gray-700 hover:text-black font-medium transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-gray-50'
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href='/categories'
                    className='text-gray-500 hover:text-black text-sm transition-colors duration-200 py-2 px-3'
                  >
                    More...
                  </Link>
                </li>
              </ul>
            </nav>

            {/* MOBILE: Search Bar */}
            <div className='md:hidden py-3'>
              <button
                onClick={openSearch}
                className='w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-left hover:border-gray-300 transition-colors duration-200'
              >
                <Search className='text-gray-400 flex-shrink-0' size={18} />
                <span className='text-sm text-gray-600'>Search furniture...</span>
              </button>
            </div>
          </div>

          {/* MEGA MENU DROPDOWN */}
          <AnimatePresence>
            {active && (
              <motion.div
                key={active.name}
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className='absolute top-full left-0 w-full bg-white shadow-lg border-b border-gray-100 z-50'
                onMouseEnter={() => clearTimeout(timeoutRef.current)}
              >
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
                    {active.groups.map((group, groupIndex) => (
                      <motion.div
                        key={group.title}
                        className='space-y-4'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                      >
                        <h3 className='font-semibold text-sm uppercase tracking-wide text-black border-b border-gray-200 pb-2'>
                          {group.title}
                        </h3>
                        <ul className='space-y-3'>
                          {group.items.map((item, itemIndex) => (
                            <motion.li
                              key={item.slug}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                            >
                              <Link
                                href={`/products?subcategory=${item.slug}`}
                                onClick={() => setActiveCat(null)}
                                className='block text-sm text-gray-700 hover:text-black transition-colors duration-200 py-1 hover:bg-gray-50 px-2 rounded -mx-2'
                              >
                                {item.name}
                              </Link>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}

                    {/* Featured/Promotional Section */}
                    <motion.div
                      className='bg-gray-50 p-6 rounded-lg border border-gray-200'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className='font-semibold text-sm uppercase tracking-wide text-black mb-3'>Featured</h3>
                      <div className='space-y-2'>
                        <p className='text-xs text-gray-600 mb-3'>
                          Discover our latest collections and exclusive offers
                        </p>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Link
                            href='/collections/new-arrivals'
                            className='inline-block text-sm font-medium text-white bg-black px-4 py-2 rounded hover:bg-gray-800 transition-colors duration-200'
                            onClick={() => setActiveCat(null)}
                          >
                            Shop Now
                          </Link>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Sticky Topbar - Only shows when main header is out of viewport */}
      <AnimatePresence>
        {showStickyTopbar && (
          <motion.div
            className='fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg'
            onMouseLeave={handleLeave}
            initial={{
              opacity: 0,
              y: -60,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -60,
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.4,
            }}
          >
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              {/* DESKTOP: Category Navigation */}
              <nav className='hidden lg:block'>
                <ul className='flex items-center justify-center gap-8 py-3'>
                  {categories.map((cat, i) => (
                    <motion.li
                      key={cat.name}
                      onMouseEnter={() => handleEnter(cat.name, i)}
                      className='relative group'
                      whileHover={{ y: -1 }}
                    >
                      <button className='flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-gray-50'>
                        <span>{cat.name}</span>
                        <motion.div
                          animate={{ rotate: activeCat === cat.name ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={14} />
                        </motion.div>
                      </button>
                      <motion.div
                        className='absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-black'
                        initial={{ width: 0 }}
                        animate={{
                          width: activeCat === cat.name ? "100%" : "0%",
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* TABLET: Simplified Categories */}
              <nav className='hidden md:block lg:hidden'>
                <ul className='flex items-center justify-center gap-6 py-3 text-sm overflow-x-auto'>
                  {categories.slice(0, 4).map((cat) => (
                    <li key={cat.name} className='whitespace-nowrap'>
                      <Link
                        href={`/products?category=${cat.name.toLowerCase()}`}
                        className='text-gray-700 hover:text-black font-medium transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-gray-50'
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href='/categories'
                      className='text-gray-500 hover:text-black text-sm transition-colors duration-200 py-2 px-3'
                    >
                      More...
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* MOBILE: Compact Search */}
              <div className='md:hidden py-2'>
                <button
                  onClick={openSearch}
                  className='w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-left hover:border-gray-300 transition-colors duration-200'
                >
                  <Search className='text-gray-400 flex-shrink-0' size={16} />
                  <span className='text-sm text-gray-600'>Search...</span>
                </button>
              </div>
            </div>

            {/* MEGA MENU for Sticky Topbar */}
            <AnimatePresence>
              {active && (
                <motion.div
                  key={active.name}
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    duration: 0.3,
                  }}
                  className='absolute top-full left-0 w-full bg-white shadow-lg border-b border-gray-100 z-40'
                  onMouseEnter={() => clearTimeout(timeoutRef.current)}
                >
                  <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
                      {active.groups.map((group, groupIndex) => (
                        <motion.div
                          key={group.title}
                          className='space-y-4'
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: groupIndex * 0.1 }}
                        >
                          <h3 className='font-semibold text-sm uppercase tracking-wide text-black border-b border-gray-200 pb-2'>
                            {group.title}
                          </h3>
                          <ul className='space-y-3'>
                            {group.items.map((item, itemIndex) => (
                              <motion.li
                                key={item.slug}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                              >
                                <Link
                                  href={`/products?subcategory=${item.slug}`}
                                  onClick={() => setActiveCat(null)}
                                  className='block text-sm text-gray-700 hover:text-black transition-colors duration-200 py-1 hover:bg-gray-50 px-2 rounded -mx-2'
                                >
                                  {item.name}
                                </Link>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}

                      {/* Featured/Promotional Section */}
                      <motion.div
                        className='bg-gray-50 p-6 rounded-lg border border-gray-200'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h3 className='font-semibold text-sm uppercase tracking-wide text-black mb-3'>Featured</h3>
                        <div className='space-y-2'>
                          <p className='text-xs text-gray-600 mb-3'>
                            Discover our latest collections and exclusive offers
                          </p>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                              href='/collections/new-arrivals'
                              className='inline-block text-sm font-medium text-white bg-black px-4 py-2 rounded hover:bg-gray-800 transition-colors duration-200'
                              onClick={() => setActiveCat(null)}
                            >
                              Shop Now
                            </Link>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default Header;
