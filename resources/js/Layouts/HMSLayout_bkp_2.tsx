// ✨ Your imports stay unchanged
import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  Menu,
  ChevronDown,
  Sun,
  Moon,
  Activity,
  User,
  Bell,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";


import { receptionistNavigation } from "@/Config/receptionistNavigation";
import { adminNavigation } from "@/Config/adminNavigation";
import { doctorNavigation } from "@/Config/doctorNavigation";
import { nurseNavigation } from "@/Config/nurseNavigation";
import { billingNavigation } from "@/Config/billingNavigation";
import { pharmacyNavigation } from "@/Config/pharmacyNavigation";

import SessionMonitor from "@/Components/SessionMonitor";
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
      <SessionMonitor refreshIntervalMinutes={30} />

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
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
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

                return (
                  <motion.div key={item.name} variants={itemVariants} className="mb-2">
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

                return (
                  <motion.div key={item.name} variants={itemVariants} className="mb-2">
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
