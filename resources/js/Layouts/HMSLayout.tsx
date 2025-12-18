// ✨ Your imports stay unchanged
import React, { useState, useRef, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import {
  Menu,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Activity,
  User,
  Bell,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


import { receptionistNavigation } from "@/Config/receptionistNavigation";
import { adminNavigation } from "@/Config/adminNavigation";
import { doctorNavigation } from "@/Config/doctorNavigation";
import { nurseNavigation } from "@/Config/nurseNavigation";
import { billingNavigation } from "@/Config/billingNavigation";
import { pharmacyNavigation } from "@/Config/pharmacyNavigation";

import SessionWarning from "@/Components/SessionWarning";
import { Toaster } from "@/Components/ui/toast";

interface IUser {
  name: string;
  email: string;
  role?: string;
}

interface HMSLayoutProps {
  children: React.ReactNode;
  user?: IUser;
}

// 🚀 Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 12 },
  },
};

export default function HMSLayout({ children, user }: HMSLayoutProps) {
  const { url } = usePage();
  const { auth } = usePage().props as any;

  const currentUser = user ?? auth?.user;

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // ROLE BASED NAVIGATION
  let navigationItems = receptionistNavigation;
  switch (currentUser?.role) {
    case "Admin": navigationItems = adminNavigation; break;
    case "Doctor": navigationItems = doctorNavigation; break;
    case "Nurse": navigationItems = nurseNavigation; break;
    case "Billing": navigationItems = billingNavigation; break;
    case "Receptionist": navigationItems = receptionistNavigation; break;
    case "Pharmacist": navigationItems = pharmacyNavigation; break;
    default: navigationItems = receptionistNavigation;
  }



  const renderIcon = (Icon: any, active: boolean) => {
    // If Icon is a string (emoji), render it as text
    if (typeof Icon === 'string') {
      return <span className="text-xl">{Icon}</span>;
    }
    // Otherwise, render it as a React component
    return <Icon className={`w-5 h-5 ${active ? "text-white" : "text-white/80"}`} />;
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>

      {/* TOP NAVBAR */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wide text-slate-800 dark:text-white">
                  MediCare Pro
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Hospital Management</p>
              </div>
            </Link>
          </div>

          {/* RIGHT NAV ITEMS */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:block text-sm">Search</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>

            {/* Dark Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {currentUser?.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {currentUser?.email || ''}
                      </p>
                      {currentUser?.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                          {currentUser.role}
                        </span>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* LAYOUT SECTION */}
      <div className="flex">

        {/* BACKDROP ON MOBILE */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR - Always visible on desktop (lg+), toggleable on mobile */}
        <aside className="hidden lg:block lg:sticky lg:top-0 w-80 h-screen bg-gradient-to-b from-teal-600 via-cyan-700 to-sky-800 text-white shadow-lg overflow-y-auto scrollbar-premium">
          <div className="h-full px-6 pt-24 pb-6">
            <motion.nav variants={containerVariants} initial="hidden" animate="visible">
              {navigationItems.map((item) => {
                const active = url.startsWith(item.href);
                const expanded = expandedItems.includes(item.name);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <motion.div key={item.name} variants={itemVariants} className="mb-2">
                    {hasChildren ? (
                      <div>
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition
                          ${active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"}`}
                        >
                          <div className={`p-2 rounded-lg ${active ? "bg-white/30" : "bg-white/10"}`}>
                            {renderIcon(item.icon, active)}
                          </div>
                          <span className="flex-1 text-left">{item.name}</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
                        </button>
                        {expanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.children?.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`block px-4 py-2 rounded-lg text-sm transition
                                ${url.startsWith(child.href) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition
                        ${active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"}`}
                      >
                        <div className={`p-2 rounded-lg ${active ? "bg-white/30" : "bg-white/10"}`}>
                          {renderIcon(item.icon, active)}
                        </div>
                        <span>{item.name}</span>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </motion.nav>
          </div>
        </aside>

        {/* MOBILE SIDEBAR */}
        <aside
          className={`lg:hidden fixed top-0 left-0 h-screen w-80 z-40 bg-gradient-to-b from-teal-600 via-cyan-700 to-sky-800 text-white shadow-lg transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full px-6 pt-24 pb-6 overflow-y-auto scrollbar-premium">
            <motion.nav variants={containerVariants} initial="hidden" animate="visible">
              {navigationItems.map((item) => {
                const active = url.startsWith(item.href);
                const expanded = expandedItems.includes(item.name);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <motion.div key={item.name} variants={itemVariants} className="mb-2">
                    {hasChildren ? (
                      <div>
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition
                          ${active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"}`}
                        >
                          <div className={`p-2 rounded-lg ${active ? "bg-white/30" : "bg-white/10"}`}>
                            {renderIcon(item.icon, active)}
                          </div>
                          <span className="flex-1 text-left">{item.name}</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
                        </button>
                        {expanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.children?.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm transition
                                ${url.startsWith(child.href) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition
                        ${active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"}`}
                      >
                        <div className={`p-2 rounded-lg ${active ? "bg-white/30" : "bg-white/10"}`}>
                          {renderIcon(item.icon, active)}
                        </div>
                        <span>{item.name}</span>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </motion.nav>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-900">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <SessionWarning warningMinutes={10} />
      <Toaster />
    </div>
  );
}
