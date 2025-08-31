"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { usePathname } from "next/navigation";
import AuthModal from "./AuthModal";

const categories = [
  { name: "Sofas", slug: "sofas", image: "/images/categories/sofa.jpg" },
  { name: "Living", slug: "living", image: "/images/categories/living.jpg" },
  { name: "Bedroom", slug: "bedroom", image: "/images/categories/bedroom.jpg" },
  { name: "Dining & Kitchen", slug: "dining-kitchen", image: "/images/categories/dining.jpg" },
  { name: "Storage", slug: "storage", image: "/images/categories/storage.jpg" },
  { name: "Study & Office", slug: "study-office", image: "/images/categories/office.jpg" },
  { name: "Modular Furniture", slug: "modular", image: "/images/categories/modular.jpg" },
];

const quickLinkItems = [
  { href: "/orders", label: "My Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact/Help" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, loading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className='fixed inset-0 bg-black/50 z-[999]'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Sidebar */}
            <motion.aside
              className='fixed top-0 left-0 h-full w-[85%] bg-white z-[1000] p-4 overflow-y-auto shadow-2xl'
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              {/* Header */}
              <div className='flex justify-between items-center mb-4'>
                <span className='text-2xl font-bold tracking-tight'>
                  <span className='text-[#2B2F42]'>V</span>
                  <span className='text-[#C62878]'>Furniture</span>
                </span>
                <button onClick={onClose}>
                  <X className='text-gray-600 hover:text-black transition' />
                </button>
              </div>

              {/* Auth Block */}
              <div className='mb-4'>
                {!loading && user ? (
                  <Link
                    href='/account'
                    onClick={onClose}
                    className='flex items-center justify-between bg-gray-100 rounded-sm px-3 py-2 hover:bg-gray-200 transition'
                  >
                    <div className='flex items-center gap-2 overflow-hidden'>
                      <Avatar
                        src={user?.photoURL || ""}
                        alt='User Avatar'
                        fallbackText={user?.name?.[0]?.toUpperCase() || "U"}
                      />
                      <span className='text-sm font-semibold text-gray-800 truncate max-w-[140px]'>
                        {user?.email || "User"}
                      </span>
                    </div>
                    <span className='text-xs text-blue-600 font-medium'>Account</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthOpen(true);
                      onClose();
                    }}
                    className='w-full py-2 text-sm bg-black text-white rounded-sm font-medium hover:bg-gray-900 transition'
                  >
                    Login / Signup
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className='border-t pt-3 space-y-1'>
                {categories.map(({ name, slug, image }) => (
                  <Link
                    key={slug}
                    href={`/category/${slug}`}
                    onClick={onClose}
                    className='flex items-center justify-between gap-2 py-2 hover:bg-gray-50 px-2 rounded transition'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 relative rounded-sm overflow-hidden'>
                        <Image src={image} alt={name} fill priority className='object-cover' />
                      </div>
                      <span className='text-sm text-gray-800'>{name}</span>
                    </div>
                    <ChevronRight size={18} className='text-gray-400' />
                  </Link>
                ))}
              </div>

              {/* Quick Links */}
              <div className='border-t pt-4 flex flex-col space-y-2'>
                {quickLinkItems.map(({ href, label }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={`relative group px-3 py-2 rounded-sm transition-all duration-200 font-medium text-sm
                        ${
                          isActive
                            ? "bg-gray-100 text-black shadow-sm"
                            : "text-gray-600 hover:text-black hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className='relative z-10'>{label}</span>
                      <span
                        className={`absolute left-3 right-3 bottom-1 h-0.5 bg-black rounded-full transition-all duration-300 ease-out 
                          ${
                            isActive
                              ? "opacity-100 w-[calc(100%-1.5rem)]"
                              : "opacity-0 group-hover:opacity-100 group-hover:w-[calc(100%-1.5rem)]"
                          }
                        `}
                      />
                    </Link>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
