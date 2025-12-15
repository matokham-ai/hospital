import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  DollarSign,
  Settings,
} from "lucide-react";
import type { NavigationItem } from "@/types/navigation";

export const receptionistNavigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/receptionist/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Appointments",
    href: "#",
    icon: Calendar,
    children: [
      { name: "Today's Appointments", href: "/appointments/today" },
      { name: "Schedule Appointment", href: "/appointments/create" },
      { name: "View All", href: "/appointments" },
      { name: "Calendar View", href: "/appointments/calendar" },
    ],
  },
  {
    name: "Patients",
    href: "#",
    icon: Users,
    children: [
      { name: "Register New", href: "/patients/create" },
      { name: "All Patients", href: "/patients" },
    ],
  },
  {
    name: "OPD & Queue",
    href: "#",
    icon: ClipboardList,
    children: [
      { name: "OPD Dashboard", href: "/opd/dashboard" },
      { name: "Patient Queue", href: "/opd/queue" },
      { name: "Triage", href: "/opd/triage" },
    ],
  },
  {
    name: "Emergency",
    href: "#",
    icon: "🚨",
    children: [
      { name: "Triage Registration", href: "/emergency" },
      { name: "Emergency Patients", href: "/emergency/list" },
    ],
  },
  {
    name: "Labs & Diagnostics",
    href: "#",
    icon: "🔬",
    children: [
      { name: "Dashboard", href: "/inpatient/labs" },
      { name: "Lab Orders", href: "/inpatient/labs" },
      { name: "Lab Results", href: "/inpatient/labs" },
    ],
  },
  {
    name: "Billing & Payments",
    href: "#",
    icon: DollarSign,
    children: [
      { name: "Invoices", href: "/invoices" },
    ],
  },
  {
    name: "Settings",
    href: "/profile",
    icon: Settings,
  },
];
