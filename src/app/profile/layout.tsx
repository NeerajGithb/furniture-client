// app/profile/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  CreditCard,
  Heart,
  Star,
  Bell,
  Gift,
  HelpCircle,
  LogOut,
  Loader2,
  User,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { fetchWithCredentials } from "@/utils/fetchWithCredentials";
import { resetApp } from "@/stores/globalStoreManager";

const navItems = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Orders", href: "/orders", icon: Package },
  { label: "Addresses", href: "/profile/address", icon: MapPin },
  { label: "Payments", href: "/profile/payments", icon: CreditCard },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Reviews", href: "/profile/reviews", icon: Star },
  { label: "Notifications", href: "/profile/notifications", icon: Bell },
  { label: "Coupons", href: "/profile/coupons", icon: Gift },
  { label: "Settings", href: "/profile/settings", icon: Settings },
  { label: "Support", href: "/support", icon: HelpCircle },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const { setUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetchWithCredentials("/api/auth/logout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Logout failed");
        setIsLoggingOut(false);
        return;
      }

      setUser(null);
      await resetApp();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (err) {
      toast.error("Something went wrong");
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-9xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-xs p-6 shadow-lg border border-white/20 sticky top-8">
              
              {/* Profile Header */}
              <div className="text-center pb-6 border-b border-gray-100">
                <div className="relative inline-block mb-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-16 h-16 rounded-sm object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-sm flex items-center justify-center text-white font-medium shadow-xl">
                      {(user.name || "").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Navigation */}
              <nav className="py-4 space-y-1">
                {navItems.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link key={href} href={href}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-black text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="pt-4 border-t border-gray-100">
                <motion.button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  whileHover={!isLoggingOut ? { x: 2 } : {}}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm font-medium transition-all duration-200 ${
                    isLoggingOut
                      ? "cursor-not-allowed text-gray-400 bg-gray-50"
                      : "text-red-600 hover:text-red-700 hover:bg-red-50"
                  }`}
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {isLoggingOut ? "Signing Out..." : "Sign Out"}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-white/80 backdrop-blur-sm rounded-xs shadow-lg border border-white/20 min-h-[600px] overflow-hidden"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}