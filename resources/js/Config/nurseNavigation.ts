import {
  Home,
  Users,
  CheckSquare,
  Pill,
  Activity,
  FileText,
  UserCheck,
  MessageSquare,
  Search,
  Building2,
  Calendar,
  Stethoscope,
  Syringe,
  TestTube,
  Bed,
  ClipboardList,
  Heart,
  Droplets,
  BookOpen,
  AlertTriangle,
  PhoneCall,
  Settings,
  BarChart3,
  FileBarChart,
  Microscope,
  ImageIcon,
  TrendingUp,
  FolderOpen,
  UserPlus,
  ArrowRightLeft,
  LogOut,
} from 'lucide-react';

import type { NavigationItem } from "@/types/navigation";

// 🌟 UNIFIED INPATIENT + OUTPATIENT NURSE NAVIGATION
// Comprehensive navigation structure following the premium UX specification

const navigationItems: NavigationItem[] = [
  // 🔵 A. HOME & GLOBAL
  { 
    name: 'Home Dashboard', 
    href: '/nurse/dashboard', 
    icon: Home,
    description: 'Main dashboard'
  },
  { 
    name: 'Universal Search', 
    href: '/nurse/search', 
    icon: Search,
    description: 'Search patients, MRN, phone'
  },
  { 
    name: 'Patient Lists', 
    href: '/nurse/patients', 
    icon: Users,
    description: 'My patients',
    children: [
      { name: 'My Patients', href: '/nurse/patients/my', icon: Users },
      { name: 'My Clinic Patients', href: '/nurse/patients/clinic', icon: Stethoscope },
      { name: 'My Ward Patients', href: '/nurse/patients/ward', icon: Bed },
      { name: 'All Patients', href: '/nurse/patients/all', icon: Users },
    ]
  },
  { 
    name: 'Facility Switcher', 
    href: '/nurse/facility', 
    icon: Building2,
    description: 'Switch units',
    children: [
      { name: 'OPD', href: '/nurse/facility/opd', icon: Stethoscope },
      { name: 'IPD', href: '/nurse/facility/ipd', icon: Bed },
      { name: 'Emergency', href: '/nurse/facility/emergency', icon: AlertTriangle },
      { name: 'ICU', href: '/nurse/facility/icu', icon: Heart },
      { name: 'Maternity', href: '/nurse/facility/maternity', icon: Users },
    ]
  },

  // 🟢 B. OUTPATIENT (OPD) WORKFLOWS
  { 
    name: 'OPD Workflows', 
    href: '/nurse/opd', 
    icon: Stethoscope,
    description: 'Outpatient care',
    children: [
      { name: 'Appointments', href: '/nurse/opd/appointments', icon: Calendar },
      { name: 'Walk-in Queue', href: '/nurse/opd/walk-ins', icon: Users },
      { name: 'Triage Queue', href: '/nurse/opd/triage', icon: Activity },
      { name: 'Consultations', href: '/nurse/opd/consultations', icon: Stethoscope },
      { name: 'Procedures', href: '/nurse/opd/procedures', icon: Syringe },
      { name: 'OPD Prescriptions', href: '/nurse/opd/prescriptions', icon: Pill },
      { name: 'OPD Labs & Imaging', href: '/nurse/opd/orders', icon: TestTube },
    ]
  },

  // 🔴 C. INPATIENT (IPD) WORKFLOWS
  { 
    name: 'IPD Workflows', 
    href: '/nurse/ipd', 
    icon: Bed,
    description: 'Inpatient care',
    children: [
      { name: 'Ward Census', href: '/nurse/ipd/census', icon: BarChart3 },
      { name: 'Bed Allocation', href: '/nurse/ipd/beds', icon: Bed },
      { name: 'Admissions', href: '/nurse/ipd/admissions', icon: UserPlus },
      { name: 'Transfers', href: '/nurse/ipd/transfers', icon: ArrowRightLeft },
      { name: 'Discharges', href: '/nurse/ipd/discharges', icon: LogOut },
      { name: 'Vitals & Monitoring', href: '/nurse/vitals', icon: Activity },
      { name: 'Medication Administration', href: '/nurse/medications', icon: Pill },
      { name: 'Rounds & Assessments', href: '/nurse/assessments', icon: ClipboardList },
      { name: 'Intake/Output', href: '/nurse/ipd/intake-output', icon: Droplets },
      { name: 'Nursing Tasks', href: '/nurse/tasks', icon: CheckSquare },
      { name: 'Care Plans', href: '/nurse/care-plans', icon: BookOpen },
      { name: 'Handover (SBAR)', href: '/nurse/handover', icon: UserCheck },
      { name: 'Safety Alerts', href: '/nurse/alerts', icon: AlertTriangle },
    ]
  },

  // 🟣 D. ORDERS & RESULTS (Shared OPD/IPD)
  { 
    name: 'Orders & Results', 
    href: '/nurse/orders', 
    icon: FileText,
    description: 'Patient orders',
    children: [
      { name: 'All Orders', href: '/nurse/orders', icon: FileText },
      { name: 'Medications', href: '/nurse/orders/medications', icon: Pill },
      { name: 'Lab Orders', href: '/nurse/orders/labs', icon: TestTube },
      { name: 'Imaging Orders', href: '/nurse/orders/imaging', icon: ImageIcon },
      { name: 'Lab Results', href: '/nurse/lab-results', icon: Microscope },
      { name: 'Radiology Reports', href: '/nurse/results/radiology', icon: ImageIcon },
      { name: 'Trend Charts', href: '/nurse/results/trends', icon: TrendingUp },
    ]
  },

  // 🟡 E. DOCUMENTATION
  { 
    name: 'Documentation', 
    href: '/nurse/documentation', 
    icon: FileBarChart,
    description: 'Clinical notes',
    children: [
      { name: 'Nursing Notes', href: '/nurse/documentation', icon: FileText },
      { name: 'Incident Reports', href: '/nurse/documentation/incident', icon: AlertTriangle },
      { name: 'Progress Notes', href: '/nurse/notes/progress', icon: FileText },
      { name: 'Shift Notes', href: '/nurse/notes/shift', icon: ClipboardList },
      { name: 'OPD Notes', href: '/nurse/notes/opd', icon: Stethoscope },
      { name: 'Discharge Notes', href: '/nurse/notes/discharge', icon: LogOut },
      { name: 'Care Plans', href: '/nurse/care-plans', icon: BookOpen },
      { name: 'Patient Documents', href: '/nurse/documents', icon: FolderOpen },
    ]
  },

  // 🟠 F. COMMUNICATION
  { 
    name: 'Communication', 
    href: '/nurse/communication', 
    icon: MessageSquare,
    description: 'Team communication',
    children: [
      { name: 'Messages', href: '/nurse/messages', icon: MessageSquare },
      { name: 'Consult Requests', href: '/nurse/consults', icon: PhoneCall },
      { name: 'Task Assignments', href: '/nurse/task-assignments', icon: CheckSquare },
      { name: 'Notifications', href: '/nurse/notifications', icon: AlertTriangle },
    ]
  },

  // ⚫ G. ADMIN & SETTINGS
  { 
    name: 'Settings', 
    href: '/nurse/settings', 
    icon: Settings,
    description: 'Preferences',
    children: [
      { name: 'Profile', href: '/nurse/settings/profile', icon: Users },
      { name: 'Preferences', href: '/nurse/settings/preferences', icon: Settings },
      { name: 'Notifications', href: '/nurse/settings/notifications', icon: AlertTriangle },
    ]
  },
];

// Export the navigation items as nurseNavigation
export const nurseNavigation = navigationItems;

// Also export the interfaces for use in other components
export type { NavigationItem };