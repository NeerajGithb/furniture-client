"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Settings, User, ShoppingBag, MapPin, LayoutDashboard, LogOut, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

const Avatar = ({ src, alt, fallbackText }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='w-8 h-8 bg-gray-900 flex items-center justify-center text-sm font-bold text-white border border-gray-700'
      >
        {fallbackText}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className='w-8 h-8 border border-gray-700'
    >
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className='w-8 h-8 object-cover'
        onError={() => setImageError(true)}
      />
    </motion.div>
  );
};

const userMenuItems = [
  {
    id: "profile",
    label: "My Profile",
    icon: User,
    href: "/account",
  },
  {
    id: "orders",
    label: "My Orders",
    icon: ShoppingBag,
    href: "/orders",
    badge: 2,
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: MapPin,
    href: "/address",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export default function UserDropdown({ isOpen, onClose }) {
  const dropdownRef = useRef(null);
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle click outside and viewport visibility
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest("[data-dropdown-trigger]")
      ) {
        onClose();
      }
    };

    const handleScroll = () => {
      if (dropdownRef.current && isOpen) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const isOutOfViewport =
          rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth;

        if (isOutOfViewport) {
          onClose();
        }
      }
    };

    const handleResize = () => {
      if (isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleMenuClick = async (item) => {
    setLoadingStates((prev) => ({ ...prev, [item.id]: true }));

    // Start navigation immediately but keep loading state
    router.push(item.href);

    // Keep loading state active - will be cleared when component unmounts or page changes
    // In a real app, you'd clear this when the new page loads
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Logout failed");
        setIsLoggingOut(false);
        return;
      }

      setUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    } catch (err) {
      toast.error("Something went wrong");
      setIsLoggingOut(false);
    }
  };

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      filter: "blur(2px)",
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
  };

  return (
    <div className='relative'>
      <AnimatePresence mode='wait'>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='absolute right-0 top-full mt-2 w-full sm:w-62 bg-white shadow-2xl border-2 border-gray-900 overflow-hidden z-[60]'
          >
            {/* User Profile Section */}
            <motion.div variants={itemVariants} className='p-1 bg-gray-900 text-white border-b border-gray-800'>
              <div className='flex items-center gap-3'>
                <Avatar
                  src={user?.photoURL || user?.avatar}
                  alt={user?.name || user?.displayName}
                  fallbackText={
                    user?.name?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || "U"
                  }
                />
                <div className='flex-1 min-w-0'>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className='text-sm font-bold text-white truncate'
                  >
                    {user?.name || user?.displayName || "User"}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className='text-xs text-gray-300 truncate'
                  >
                    {user?.email || "user@example.com"}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Menu Items */}
            <div className='py-1 bg-white'>
              {userMenuItems.map((item, index) => {
                const IconComponent = item.icon;
                const isLoading = loadingStates[item.id];

                return (
                  <motion.button
                    key={item.id}
                    variants={itemVariants}
                    custom={index}
                    onClick={() => handleMenuClick(item)}
                    disabled={isLoading}
                    whileHover={
                      !isLoading
                        ? {
                            backgroundColor: "#f8f9fa",
                            x: 4,
                            transition: { duration: 0.2 },
                          }
                        : {}
                    }
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm border-b border-gray-100 transition-all duration-200 ${
                      isLoading ? "cursor-not-allowed bg-gray-50" : "hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <motion.div
                      className='relative w-4 h-4'
                      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                      transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                    >
                      {isLoading ? (
                        <Loader2 className='w-4 h-4 text-gray-900 animate-spin' />
                      ) : (
                        <IconComponent className='w-4 h-4 text-gray-900' />
                      )}
                    </motion.div>
                    <span className={`flex-1 font-medium text-gray-900 ${isLoading ? "opacity-75" : ""}`}>
                      {item.label}
                    </span>
                    {item.badge && !isLoading && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          delay: 0.3 + index * 0.1,
                        }}
                        className='bg-gray-900 text-white text-xs px-1.5 py-0.5 font-bold min-w-[20px] text-center'
                      >
                        {item.badge}
                      </motion.span>
                    )}
                    {isLoading && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className='absolute bottom-0 left-0 h-0.5 bg-gray-900'
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    )}
                  </motion.button>
                );
              })}

              {/* Admin Dashboard (if admin) */}
              {user?.role === "admin" && (
                <motion.button
                  variants={itemVariants}
                  onClick={() => handleMenuClick({ id: "admin", href: "/admin", label: "Admin Dashboard" })}
                  disabled={loadingStates.admin}
                  whileHover={
                    !loadingStates.admin
                      ? {
                          backgroundColor: "#f3f4f6",
                          x: 4,
                          transition: { duration: 0.2 },
                        }
                      : {}
                  }
                  whileTap={!loadingStates.admin ? { scale: 0.98 } : {}}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm border-b border-gray-300 transition-all duration-200 ${
                    loadingStates.admin ? "cursor-not-allowed bg-gray-50" : "hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <motion.div
                    className='relative w-4 h-4'
                    animate={loadingStates.admin ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                      loadingStates.admin ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }
                    }
                  >
                    {loadingStates.admin ? (
                      <Loader2 className='w-4 h-4 text-gray-900 animate-spin' />
                    ) : (
                      <LayoutDashboard className='w-4 h-4 text-gray-900' />
                    )}
                  </motion.div>
                  <span className={`flex-1 font-medium text-gray-900 ${loadingStates.admin ? "opacity-75" : ""}`}>
                    Admin Dashboard
                  </span>
                  {loadingStates.admin && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      className='absolute bottom-0 left-0 h-0.5 bg-gray-900'
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  )}
                </motion.button>
              )}
            </div>

            {/* Logout Section */}
            <motion.div variants={itemVariants} className='border-t-2 border-gray-900 bg-gray-900'>
              <motion.button
                onClick={handleLogout}
                disabled={isLoggingOut}
                whileHover={
                  !isLoggingOut
                    ? {
                        backgroundColor: "#1f2937",
                        x: 4,
                        transition: { duration: 0.2 },
                      }
                    : {}
                }
                whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                  isLoggingOut ? "cursor-not-allowed text-gray-400" : "text-white hover:bg-gray-800 cursor-pointer"
                }`}
              >
                <motion.div
                  className='relative w-4 h-4 z-10'
                  animate={isLoggingOut ? { rotate: 360 } : { rotate: 0 }}
                  transition={isLoggingOut ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                >
                  {isLoggingOut ? <Loader2 className='w-4 h-4 animate-spin' /> : <LogOut className='w-4 h-4' />}
                </motion.div>
                <span className='z-10 relative'>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                {isLoggingOut && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent'
                  />
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
