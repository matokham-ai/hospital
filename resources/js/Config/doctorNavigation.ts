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
  { name: 'Dashboard', href: '/doctor/dashboard', icon: Home },
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
      { name: 'Triage', href: '/opd/triage' },
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

];

// Export the navigation items as doctorNavigation
export const doctorNavigation = navigationItems;

// Also export the interfaces for use in other components
export type { NavigationItem, IUser, HMSLayoutProps };