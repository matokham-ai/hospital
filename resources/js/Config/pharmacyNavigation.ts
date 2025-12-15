import { Home } from 'lucide-react';
import type { NavigationItem } from "@/types/navigation";

// --- Navigation ---
const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/pharmacy/dashboard', icon: Home },
  {
    name: 'Prescriptions',
    href: '/pharmacy/prescriptions',
    icon: '📋',
    children: [
      { name: 'All Prescriptions', href: '/pharmacy/prescriptions' },
    ],
  },
  {
    name: 'Drug Formulary',
    href: '/pharmacy/formulary',
    icon: '🔍',
    children: [
      { name: 'Browse Drugs', href: '/pharmacy/formulary' },
      { name: 'Add New Drug', href: '/pharmacy/drugs/create' },
    ],
  },
  {
    name: 'Inventory',
    href: '/pharmacy/inventory',
    icon: '📦',
    children: [
      { name: 'Stock Overview', href: '/pharmacy/inventory' },
      { name: 'Stock Movements', href: '/pharmacy/inventory/movements' },
      { name: 'GRN', href: '/pharmacy/grn' },
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
    name: 'Reports',
    href: '/pharmacy/reports',
    icon: '📊',
  },
];

// Export the navigation items as adminNavigation
export const pharmacyNavigation = navigationItems;

// Also export the interfaces for use in other components
export type { NavigationItem };
