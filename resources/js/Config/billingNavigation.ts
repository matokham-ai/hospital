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

import type { NavigationItem } from "@/types/navigation";

// --- Navigation ---
const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  {
    name: 'OPD Management',
    href: '/opd',
    icon: '🩺',
    children: [
      { name: 'Dashboard', href: '/opd/dashboard' },
    ],
  },
  {
    name: 'Inpatient Management',
    href: '/inpatient',
    icon: '🛏️',
    children: [
      { name: 'Billing & Charges', href: '/inpatient/billing-charges' },
      { name: 'Reports & Analytics', href: '/inpatient/reports' },
    ],
  },
  {
    name: 'Labs & Diagnostics',
    href: '#',
    icon: '🔬',
    children: [
      { name: 'Dashboard', href: '/inpatient/labs' },
      { name: 'Lab Orders', href: '/inpatient/labs' },
      { name: 'Lab Results', href: '/inpatient/labs' },
    ],
  },
  {
    name: 'Billing & Payments',
    href: '/billing',
    icon: '💰',
    children: [
      { name: 'Dashboard', href: '/billing/dashboard' },
      { name: 'Patient Billing', href: '/billing/patients' },
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
];

// Export the navigation items as billingNavigation
export const billingNavigation = navigationItems;

// Also export the interfaces for use in other components
export type { NavigationItem };
