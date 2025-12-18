import { useState, useEffect, useRef } from 'react';
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
  Clock,
  ChevronDown,
  Command,
  Home,
  Bed,
  UserPlus,
  Pill,
  TestTube,
  Stethoscope,
  FileText,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performLogout } from '@/utils/logout';

interface User {
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

interface HMSLayoutProps {
  children: React.ReactNode;
  user?: User;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  children?: { name: string; href: string }[];
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Admissions & Beds',
    href: '/admissions',
    icon: Bed,
    children: [
      { name: 'Bed Occupancy Map', href: '/admissions/beds' },
      { name: 'Admit New Patient', href: '/admissions/create' },
      { name: 'Transfer Patient', href: '/admissions/transfer' },
      { name: 'Discharge Patient', href: '/admissions/discharge' },
    ],
  },
  {
    name: 'Patient Profiles',
    href: '/patients',
    icon: UserPlus,
    children: [
      { name: 'All Patients', href: '/patients' },
      { name: 'Critical Patients', href: '/patients/critical' },
      { name: 'Add New Patient', href: '/patients/create' },
    ],
  },
  {
    name: 'Medication Admin',
    href: '/medications',
    icon: Pill,
    badge: 12, // Due medications
    children: [
      { name: 'Medication Schedule', href: '/medications/schedule' },
      { name: 'Due Now', href: '/medications/due' },
      { name: 'Administration History', href: '/medications/history' },
    ],
  },
  {
    name: 'Labs & Diagnostics',
    href: '/laboratory',
    icon: TestTube,
    badge: 5, // Pending results
    children: [
      { name: 'Pending Tests', href: '/laboratory/pending' },
      { name: 'Results Review', href: '/laboratory/results' },
      { name: 'Order New Test', href: '/laboratory/order' },
    ],
  },
  {
    name: 'Doctor Rounds',
    href: '/rounds',
    icon: Stethoscope,
    children: [
      { name: 'My Patients', href: '/rounds/my-patients' },
      { name: 'Progress Notes', href: '/rounds/notes' },
      { name: 'Discharge Planning', href: '/rounds/discharge' },
    ],
  },
  {
    name: 'OPD Management',
    href: '/opd',
    icon: FileText,
    children: [
      { name: 'Dashboard', href: '/opd/dashboard' },
      { name: 'Patient Queue', href: '/opd/queue' },
      { name: 'Consultations', href: '/opd/consultations' },
      { name: 'Prescriptions', href: '/opd/prescriptions' },
    ],
  },
  {
    name: 'Reports & Analytics',
    href: '/reports',
    icon: BarChart3,
    children: [
      { name: 'Occupancy Trends', href: '/reports/occupancy' },
      { name: 'Length of Stay', href: '/reports/los' },
      { name: 'Common Diagnoses', href: '/reports/diagnoses' },
    ],
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Settings,
    children: [
      { name: 'Admin Dashboard', href: '/admin/dashboard' },
      { name: 'Departments', href: '/admin/departments' },
      { name: 'Wards & Beds', href: '/admin/wards' },
      { name: 'Test Catalogs', href: '/admin/test-catalogs' },
      { name: 'Drug Formulary', href: '/admin/drug-formulary' },
      { name: 'System Settings', href: '/admin/settings' },
    ],
  },
];

export default function EnhancedHMSLayout({ children, user }: HMSLayoutProps) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentShift, setCurrentShift] = useState('Day Shift');

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Determine shift based on time
      const hour = now.getHours();
      if (hour >= 6 && hour < 14) {
        setCurrentShift('Day Shift');
      } else if (hour >= 14 && hour < 22) {
        setCurrentShift('Evening Shift');
      } else {
        setCurrentShift('Night Shift');
      }
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const mockNotifications = [
    { id: 1, type: 'critical', message: 'Patient in Room 205 - Vitals Alert', time: '2 min ago' },
    { id: 2, type: 'info', message: 'Lab results ready for John Doe', time: '5 min ago' },
    { id: 3, type: 'warning', message: 'Medication due for Room 301', time: '10 min ago' },
  ];

  const handleLogout = () => {
    performLogout();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 transition-colors">
        {/* Top Navbar */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Hospital Logo/Name */}
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HMS</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-gray-900 dark:text-white">MediCare</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hospital Management</p>
                </div>
              </Link>
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-md mx-4" ref={searchRef}>
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Search patients, beds, records...</span>
                  <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </div>
                </button>

                {/* Search Modal */}
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-4">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search patients, beds, admission numbers..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                          autoFocus
                        />
                        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                          Quick search: Patient name, bed number, admission ID
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Date/Time/Shift */}
              <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {currentTime.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} • {currentShift}
                  </div>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {mockNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {mockNotifications.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {mockNotifications.map((notif) => (
                          <div key={notif.id} className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notif.type === 'critical' ? 'bg-red-500' :
                                notif.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">{notif.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out`}>
            <div className="h-full overflow-y-auto pt-4">
              <nav className="px-3 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = url.startsWith(item.href);
                  const isExpanded = expandedItems.includes(item.name);

                  return (
                    <div key={item.name}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                        {item.children && (
                          <button
                            onClick={() => toggleExpanded(item.name)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`} />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {item.children && isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-8 mt-1 space-y-1 overflow-hidden"
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                  url === child.href
                                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
