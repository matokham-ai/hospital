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
    X,
    Activity,
    Heart,
    Shield,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performLogout } from '@/utils/logout';

interface User {
    name: string;
    email: string;
    role?: string;
    avatar?: string;
}

interface PremiumHMSLayoutProps {
    children: React.ReactNode;
    user?: User;
}

interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    children?: { name: string; href: string }[];
    badge?: number;
    color?: string;
}

const navigationItems: NavigationItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        name: 'Admissions',
        href: '/admissions',
        icon: Bed,
        color: 'from-emerald-500 to-teal-500',
        children: [
            { name: 'Bed Management', href: '/admissions/beds' },
            { name: 'New Admission', href: '/admissions/create' },
            { name: 'Patient Transfer', href: '/admissions/transfer' },
            { name: 'Discharge', href: '/admissions/discharge' },
        ],
    },
    {
        name: 'Patients',
        href: '/patients',
        icon: UserPlus,
        color: 'from-purple-500 to-indigo-500',
        children: [
            { name: 'All Patients', href: '/patients' },
            { name: 'Critical Care', href: '/patients/critical' },
            { name: 'Register Patient', href: '/patients/create' },
        ],
    },
    {
        name: 'Medications',
        href: '/medications',
        icon: Pill,
        badge: 12,
        color: 'from-orange-500 to-red-500',
        children: [
            { name: 'Schedule', href: '/medications/schedule' },
            { name: 'Due Now', href: '/medications/due' },
            { name: 'History', href: '/medications/history' },
        ],
    },
    {
        name: 'Laboratory',
        href: '/laboratory',
        icon: TestTube,
        badge: 5,
        color: 'from-pink-500 to-rose-500',
        children: [
            { name: 'Pending Tests', href: '/laboratory/pending' },
            { name: 'Results', href: '/laboratory/results' },
            { name: 'Order Test', href: '/laboratory/order' },
        ],
    },
    {
        name: 'OPD',
        href: '/opd',
        icon: Stethoscope,
        color: 'from-green-500 to-emerald-500',
        children: [
            { name: 'Dashboard', href: '/opd/dashboard' },
            { name: 'Queue', href: '/opd/queue' },
            { name: 'Consultations', href: '/opd/consultations' },
        ],
    },
    {
        name: 'Reports',
        href: '/reports',
        icon: BarChart3,
        color: 'from-violet-500 to-purple-500',
    },
    {
        name: 'Administration',
        href: '/admin',
        icon: Settings,
        color: 'from-slate-500 to-gray-500',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
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
            stiffness: 100,
            damping: 12,
        },
    },
};

export default function PremiumHMSLayout({ children, user }: PremiumHMSLayoutProps) {
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
        { id: 1, type: 'critical', message: 'Patient in Room 205 - Vitals Alert', time: '2 min ago', icon: Heart },
        { id: 2, type: 'info', message: 'Lab results ready for John Doe', time: '5 min ago', icon: TestTube },
        { id: 3, type: 'warning', message: 'Medication due for Room 301', time: '10 min ago', icon: Pill },
        { id: 4, type: 'success', message: 'Patient discharged successfully', time: '15 min ago', icon: Shield },
    ];

    const handleLogout = () => {
        performLogout();
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
            {/* Background with premium gradients */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/20 transition-all duration-1000" />

            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [360, 180, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-teal-400/10 to-emerald-400/10 rounded-full blur-3xl"
                />
            </div>

            <div className="relative z-10">
                {/* Premium Glass Navbar */}
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-lg shadow-black/5"
                >
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Left Section */}
                            <div className="flex items-center gap-6">
                                {/* Mobile menu button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="lg:hidden p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 backdrop-blur-sm border border-white/20 transition-all duration-300"
                                >
                                    <motion.div
                                        animate={{ rotate: sidebarOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                    </motion.div>
                                </motion.button>

                                {/* Hospital Logo/Name */}
                                <Link href="/dashboard" className="flex items-center gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className="relative"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                                            <Activity className="w-6 h-6 text-white" />
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl opacity-20 blur-md"
                                        />
                                    </motion.div>
                                    <div className="hidden sm:block">
                                        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                            MediCare Pro
                                        </h1>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            Advanced Hospital Management
                                        </p>
                                    </div>
                                </Link>
                            </div>

                            {/* Center Section - Premium Search */}
                            <div className="flex-1 max-w-lg mx-8" ref={searchRef}>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="relative"
                                >
                                    <button
                                        onClick={() => setSearchOpen(true)}
                                        className="w-full flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-700/40 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-600/30 hover:border-blue-300/50 dark:hover:border-blue-500/50 transition-all duration-300 shadow-lg shadow-black/5"
                                    >
                                        <Search className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                                            Search patients, records, appointments...
                                        </span>
                                        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            <Command className="w-3 h-3" />
                                            <span>K</span>
                                        </div>
                                    </button>

                                    {/* Premium Search Modal */}
                                    <AnimatePresence>
                                        {searchOpen && (
                                            <>
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                                                    onClick={() => setSearchOpen(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    className="absolute top-full mt-4 w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-slate-600/30 z-50 overflow-hidden"
                                                >
                                                    <div className="p-6">
                                                        <div className="relative">
                                                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                placeholder="Search patients, beds, admission numbers..."
                                                                className="w-full pl-12 pr-4 py-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-2xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="mt-6 space-y-3">
                                                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
                                                                Quick Actions
                                                            </div>
                                                            {['New Patient Registration', 'Emergency Admission', 'Lab Test Order', 'Medication Schedule'].map((action, index) => (
                                                                <motion.div
                                                                    key={action}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: index * 0.1 }}
                                                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-slate-600 cursor-pointer transition-all duration-300"
                                                                >
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                                        <Zap className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{action}</span>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>

                            {/* Right Section */}
                            <div className="flex items-center gap-4">
                                {/* Time/Shift Display */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="hidden md:flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-700/40 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-600/30 shadow-lg shadow-black/5"
                                >
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    <div className="text-sm">
                                        <div className="font-bold text-slate-800 dark:text-white">
                                            {currentTime.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {currentTime.toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })} • {currentShift}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Dark Mode Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-3 rounded-2xl bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-700/40 backdrop-blur-xl border border-white/30 dark:border-slate-600/30 hover:border-yellow-300/50 dark:hover:border-yellow-500/50 transition-all duration-300 shadow-lg shadow-black/5"
                                >
                                    <motion.div
                                        animate={{ rotate: darkMode ? 180 : 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {darkMode ? (
                                            <Sun className="w-5 h-5 text-yellow-500" />
                                        ) : (
                                            <Moon className="w-5 h-5 text-slate-600" />
                                        )}
                                    </motion.div>
                                </motion.button>

                                {/* Premium Notifications */}
                                <div className="relative" ref={notifRef}>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                                        className="relative p-3 rounded-2xl bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-700/40 backdrop-blur-xl border border-white/30 dark:border-slate-600/30 hover:border-red-300/50 dark:hover:border-red-500/50 transition-all duration-300 shadow-lg shadow-black/5"
                                    >
                                        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                        {mockNotifications.length > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
                                            >
                                                {mockNotifications.length}
                                            </motion.span>
                                        )}
                                    </motion.button>

                                    <AnimatePresence>
                                        {notificationsOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className="absolute right-0 mt-4 w-96 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-slate-600/30 z-50 overflow-hidden"
                                            >
                                                <div className="p-6 border-b border-slate-200/50 dark:border-slate-600/50">
                                                    <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                                        Notifications
                                                    </h3>
                                                </div>
                                                <div className="max-h-80 overflow-y-auto">
                                                    {mockNotifications.map((notif, index) => {
                                                        const Icon = notif.icon;
                                                        return (
                                                            <motion.div
                                                                key={notif.id}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="p-4 border-b border-slate-100/50 dark:border-slate-700/50 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-300 cursor-pointer"
                                                            >
                                                                <div className="flex items-start gap-4">
                                                                    <div className={`p-2 rounded-xl ${notif.type === 'critical' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                                                                        notif.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                                                            notif.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                                                                'bg-gradient-to-r from-blue-500 to-indigo-500'
                                                                        } shadow-lg`}>
                                                                        <Icon className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                                            {notif.message}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                                                            {notif.time}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Premium User Profile */}
                                <div className="relative" ref={profileRef}>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                        className="flex items-center gap-3 p-2 pr-4 rounded-2xl bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-700/40 backdrop-blur-xl border border-white/30 dark:border-slate-600/30 hover:border-teal-300/50 dark:hover:border-teal-500/50 transition-all duration-300 shadow-lg shadow-black/5"
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                                                {user?.avatar ? (
                                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-white" />
                                                )}
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl opacity-20 blur-sm"
                                            />
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <div className="text-sm font-bold text-slate-800 dark:text-white">
                                                {user?.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                {user?.role}
                                            </div>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    </motion.button>

                                    <AnimatePresence>
                                        {profileDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className="absolute right-0 mt-4 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-slate-600/30 z-50 overflow-hidden"
                                            >
                                                <div className="p-6">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                                                            <User className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-white">
                                                                {user?.name}
                                                            </div>
                                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                                {user?.email}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Link
                                                            href="/profile"
                                                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-700 dark:hover:to-slate-600 rounded-xl transition-all duration-300"
                                                        >
                                                            <User className="w-4 h-4" />
                                                            Profile Settings
                                                        </Link>
                                                        <Link
                                                            href="/settings"
                                                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-700 dark:hover:to-slate-600 rounded-xl transition-all duration-300"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                            Preferences
                                                        </Link>
                                                        <hr className="my-3 border-slate-200/50 dark:border-slate-600/50" />
                                                        <button
                                                            type="button"
                                                            onClick={handleLogout}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 rounded-xl transition-all duration-300"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            Sign Out
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.nav>

                <div className="flex">
                    {/* Premium Glass Sidebar */}
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{
                            x: sidebarOpen ? 0 : -300,
                            opacity: sidebarOpen ? 1 : 0
                        }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                            } lg:translate-x-0 lg:opacity-100 fixed lg:static inset-y-0 left-0 z-40 w-80 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-r border-white/30 dark:border-slate-700/50 transition-all duration-500 ease-in-out shadow-2xl`}
                    >
                        <div className="h-full overflow-y-auto pt-6">
                            <motion.nav
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="px-6 space-y-3"
                            >
                                {navigationItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = url.startsWith(item.href);
                                    const isExpanded = expandedItems.includes(item.name);

                                    return (
                                        <motion.div
                                            key={item.name}
                                            variants={itemVariants}
                                            className="space-y-2"
                                        >
                                            <div className="flex items-center">
                                                <Link
                                                    href={item.href}
                                                    className={`flex-1 flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 group ${isActive
                                                        ? `bg-gradient-to-r ${item.color || 'from-teal-500 to-cyan-600'} text-white shadow-lg shadow-teal-500/25`
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-white/60 hover:to-white/40 dark:hover:from-slate-800/60 dark:hover:to-slate-700/40 hover:shadow-lg hover:shadow-black/5'
                                                        }`}
                                                >
                                                    <motion.div
                                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                                        className={`p-2 rounded-xl ${isActive
                                                            ? 'bg-white/20'
                                                            : `bg-gradient-to-r ${item.color || 'from-slate-100 to-white'} dark:from-slate-700 dark:to-slate-600 group-hover:shadow-md`
                                                            }`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
                                                    </motion.div>
                                                    <span className="flex-1">{item.name}</span>
                                                    {item.badge && (
                                                        <motion.span
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg"
                                                        >
                                                            {item.badge}
                                                        </motion.span>
                                                    )}
                                                </Link>
                                                {item.children && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => toggleExpanded(item.name)}
                                                        className="p-2 ml-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300"
                                                    >
                                                        <motion.div
                                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                                        </motion.div>
                                                    </motion.button>
                                                )}
                                            </div>

                                            <AnimatePresence>
                                                {item.children && isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="ml-12 space-y-2 overflow-hidden"
                                                    >
                                                        {item.children.map((child, childIndex) => (
                                                            <motion.div
                                                                key={child.name}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: childIndex * 0.1 }}
                                                            >
                                                                <Link
                                                                    href={child.href}
                                                                    className={`block px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${url === child.href
                                                                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 shadow-md'
                                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-800/50 dark:hover:to-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200'
                                                                        }`}
                                                                >
                                                                    {child.name}
                                                                </Link>
                                                            </motion.div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </motion.nav>
                        </div>
                    </motion.aside>

                    {/* Main Content */}
                    <main className="flex-1 min-h-screen">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="p-8"
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>

                {/* Mobile sidebar overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
