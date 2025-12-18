import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Calendar,
  ChevronDown,
  Command,
  Home,
  Menu,
  X,
  Activity,
  LayoutDashboard,
  Building2,
  Bed,
  TestTube,
  Pill,
  UserCog,
  SlidersHorizontal,

} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performLogout } from '@/utils/logout';

interface IUser {
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

interface HMSLayoutProps {
  children: React.ReactNode;
  user?: IUser;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any> | string;
  children?: { name: string; href: string; icon?: React.ReactNode }[];
}

// --- Navigation ---
const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: '📅',
    children: [
      { name: "Today's Appointments", href: '/appointments/today' },
      { name: 'Schedule Appointment', href: '/appointments/create' },
      { name: 'Calendar View', href: '/appointments/calendar' },
    ],
  },
  {
    name: 'OPD Management',
    href: '/opd',
    icon: '🩺',
    children: [
      { name: 'Dashboard', href: '/opd/dashboard' },
      { name: 'Patient Queue', href: '/opd/queue' },
      { name: 'Consultations', href: '/opd/consultations' },
      { name: 'Prescriptions', href: '/opd/prescriptions' },
    ],
  },
  {
    name: 'Inpatient Management',
    href: '/inpatient',
    icon: '🛏️',
    children: [
      { name: 'Dashboard', href: '/inpatient/dashboard' },
      { name: 'Admissions & Beds', href: '/inpatient/admissions' },
      { name: 'Patient Care Plans', href: '/inpatient/care-plans' },
      { name: 'Medication Administration', href: '/inpatient/medications' },
      { name: 'Labs & Diagnostics', href: '/inpatient/labs' },
      { name: 'Doctor Rounds', href: '/inpatient/rounds' },
      { name: 'Billing & Charges', href: '/inpatient/billing-charges' },
      { name: 'Reports & Analytics', href: '/inpatient/reports' },
    ],
  },
  {
    name: 'Pharmacy',
    href: '/pharmacy',
    icon: '💊',
    children: [
      { name: 'Dashboard', href: '/pharmacy/dashboard' },
      { name: 'Prescriptions', href: '/pharmacy/prescriptions' },
      { name: 'Inventory', href: '/pharmacy/inventory' },
      { name: 'Stock Movements', href: '/pharmacy/inventory/movements' },
    ],
  },
  {
    name: 'Billing & Payments',
    href: '/billing',
    icon: '💰',
    children: [
      { name: 'Dashboard', href: '/billing/dashboard' },
      { name: 'Invoices', href: '/invoices' },
      { name: 'Payments', href: '/payments' },
      { name: 'Insurance Claims', href: '/insurance' },
    ],
  },
  {
    name: 'Reports & Analytics',
    href: '/reports',
    icon: '📊',
    children: [
      { name: 'Analytics Dashboard', href: '/reports' },
      { name: 'Patient Census', href: '/reports?tab=census' },
      { name: 'Bed Occupancy', href: '/reports?tab=beds' },
      { name: 'Lab TAT Analysis', href: '/reports?tab=lab' },
      { name: 'Pharmacy Reports', href: '/pharmacy/reports' },
      { name: 'Revenue Analysis', href: '/reports?tab=revenue' },
      { name: 'Disease Statistics', href: '/reports?tab=disease' },
      { name: 'Scheduled Reports', href: '/reports/scheduled' },
      { name: 'Inpatient Reports', href: '/inpatient/reports' },
    ],
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Settings,
    children: [
      { name: 'Admin Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: 'Departments', href: '/admin/departments', icon: <Building2 className="w-4 h-4" /> },
      { name: 'Wards & Beds', href: '/admin/wards', icon: <Bed className="w-4 h-4" /> },
      { name: 'Test Catalogs', href: '/admin/tests', icon: <TestTube className="w-4 h-4" /> },
      { name: 'Drug Formulary', href: '/admin/drug-formulary', icon: <Pill className="w-4 h-4" /> },

    ],
  },

  {
    name: 'Settings',
    href: '/settings',
    icon: '⚙️',
    children: [
      { name: 'User Management',href: '/admin/users', icon: <UserCog className="w-4 h-4" /> },
      { name: 'System Settings', href: '/admin/settings', icon: <SlidersHorizontal className="w-4 h-4" /> },

    ],
  },
];

// --- Motion Variants ---
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
    transition: { type: 'spring' as const, stiffness: 120, damping: 12 },
  },
};

export default function HMSLayout({ children, user }: HMSLayoutProps) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.children && item.children.some((c) => url.startsWith(c.href))) {
        setExpandedItems((prev) =>
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }
    });
  }, [url]);

  const ensureExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev : [...prev, itemName]
    );
  };

  const { auth } = usePage().props as any;
  const currentUser = user ?? auth?.user;

  const handleLogout = () => {
    performLogout();
  };

  const renderIcon = (Icon: React.ComponentType<any> | string, active: boolean) =>
    typeof Icon === 'string' ? (
      <span className="text-lg">{Icon}</span>
    ) : (
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-white/80'}`} />
    );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
                   border-b border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
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
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hospital Management
                </p>
              </div>
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-300" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold">
                  {currentUser?.name ?? 'User'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUser?.role ?? 'Staff'}
                </div>
              </div>
                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </button>
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    <div className="px-4 py-2 text-sm border-b border-slate-100 dark:border-slate-700">
                      {user?.email}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Shell */}
      <div className="flex">
        {/* 🌊 Oceanic Gradient Sidebar */}
        <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40">
          <div
            className="flex grow flex-col gap-y-5 overflow-y-auto
            bg-gradient-to-b from-teal-600 via-cyan-700 to-sky-800
            text-white shadow-lg border-r border-teal-900/20 px-6 py-6
            backdrop-blur-xl relative"
          >
            {/* optional subtle glow */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),transparent_70%)]" />
            <motion.nav
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3 relative z-10"
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = url.startsWith(item.href);
                const isExpanded = expandedItems.includes(item.name);
                return (
                  <motion.div key={item.name} variants={itemVariants} className="space-y-2">
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => item.children && ensureExpanded(item.name)}
                        className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                          isActive
                            ? 'bg-white/15 text-white shadow-md shadow-cyan-500/20'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isActive ? 'bg-white/25' : 'bg-white/10 group-hover:bg-white/20'
                          }`}
                        >
                          {renderIcon(Icon, isActive)}
                        </div>
                        <span className="flex-1">{item.name}</span>
                      </Link>
                      {item.children && (
                        <button
                          onClick={() => ensureExpanded(item.name)}
                          className="p-2 ml-2 rounded-xl hover:bg-white/10"
                        >
                          <ChevronDown
                            className={`w-4 h-4 text-white transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {item.children && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-12 space-y-1 overflow-hidden border-l-2 border-white/20 pl-4"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`block px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                url === child.href
                                  ? 'bg-white/20 text-white'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:pl-80 flex-1 min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
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
    </div>
  );
}
