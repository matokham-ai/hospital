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
    name: 'Patients',
    href: '/patients',
    icon: '👥',
    children: [
      { name: 'All Patients', href: '/patients' },
      { name: 'Register New Patient', href: '/patients/create' },
    ],
  },
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
    name: 'Emergency',
    href: '/emergency',
    icon: '🚨',
    children: [
      { name: 'Triage Registration', href: '/emergency' },
      { name: 'Emergency Patients', href: '/emergency/list' },
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
    name: 'Labs & Diagnostics',
    href: '/inpatient/labs',
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
      { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Branches', href: '/admin/branches', icon: Building2 },
      { name: 'Departments', href: '/admin/departments', icon: Building2 },
      { name: 'Wards & Beds', href: '/admin/wards', icon: Bed },
      { name: 'Physicians', href: '/admin/physicians', icon: '👨‍⚕️' },
      { name: 'Service Categories', href: '/admin/categories', icon: '📋' },
      { name: 'Test Catalogs', href: '/admin/tests', icon: TestTube },
      { name: 'Drug Formulary', href: '/admin/drug-formulary', icon: Pill },
      { name: 'Audit Log', href: '/admin/audit', icon: Activity },
    ],
  },

  {
    name: 'Settings',
    href: '/settings',
    icon: '⚙️',
    children: [
      { name: 'User Management', href: '/admin/users', icon: UserCog },
      { name: 'System Settings', href: '/admin/settings', icon: SlidersHorizontal },
    ],
  },
];

// Export the navigation items as adminNavigation
export const adminNavigation = navigationItems;

// Also export the interfaces for use in other components
export type { NavigationItem };
