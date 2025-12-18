import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Progress } from "@/Components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";
import {
  Activity,
  AlertTriangle,
  Bed,
  Calendar,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Heart,
  Pill,
  Search,
  Stethoscope,
  Users,
  TrendingUp,
  Clock,
  FileText,
  Phone,
  MapPin,
  Syringe,
  TestTube,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftInfo {
  start: string;
  end: string;
  elapsed: string;
  remaining: string;
  label: string;
}

interface KPIs {
  assignedPatients: number;
  medicationsGiven: number;
  vitalsRecorded: number;
  alerts: number;
}

interface TaskItem {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  due_time: string;
  overdue: boolean;
  patient?: string;
}

interface Analytics {
  patientsPerNurse: string;
  shiftCompletion: number;
  pendingOrders: {
    total: number;
    labs: number;
    imaging: number;
    medications: number;
  };
  bedOccupancy: {
    occupied: number;
    total: number;
    percentage: number;
  };
}

interface DailyActivity {
  admissions: number;
  discharges: number;
  medicationsDueSoon: number;
  alertsResolved: number;
  lastVitalsAt: string | null;
  lastVitalsDiff: string | null;
}

interface UnitOverviewItem {
  id: string;
  name: string;
  type: string;
  patients: number;
  updatedAt?: string | null;
  updatedAgo: string;
  occupancy: {
    occupied: number;
    capacity: number;
    percentage: number;
  };
}

interface ActiveShiftMetrics {
  patientsAssigned: number;
  tasksCompleted: number;
  pendingTasks: number;
  alerts: number;
}

interface LivePatient {
  id: number | string;
  encounterId?: number;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  status: "Critical" | "Stable" | "Moderate" | "Observation";
  department: string;
  bed: string;
  admittedAt: string;
  diagnosis: string;
  lastVitals: {
    bp: string;
    hr: number;
    temp: number;
    spo2: number;
    time: string;
  };
  pendingActions: {
    medications: number;
    labs: number;
    procedures: number;
  };
  type: "IPD" | "OPD";
}

interface NurseDashboardProps {
  userName: string;
  userRole: string;
  shift: ShiftInfo;
  kpis: KPIs;
  activeShift: ActiveShiftMetrics;
  analytics: Analytics;
  unitOverview: UnitOverviewItem[];
  tasks: TaskItem[];
  dailyActivity: DailyActivity;
  livePatients: LivePatient[];
}

export default function Dashboard({
  userName,
  userRole,
  shift,
  kpis,
  activeShift,
  analytics,
  unitOverview,
  tasks,
  dailyActivity,
  livePatients = [],
}: NurseDashboardProps) {
  // Local UI state
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "critical" | "ipd" | "opd">("all");
  const [isIpdMenuOpen, setIsIpdMenuOpen] = useState(false);
  const [isMyPatientsMenuOpen, setIsMyPatientsMenuOpen] = useState(false);

  const handleIpdNavigate = (path: string) => {
    setIsIpdMenuOpen(false);
    router.visit(path);
  };

  const handleMyPatientsNavigate = (path?: string) => {
    setIsMyPatientsMenuOpen(false);
    router.visit(path ?? "/nurse/patients");
  };

  // Use provided livePatients or demo fallback
  const patientsData: LivePatient[] =
    livePatients.length > 0
      ? livePatients
      : [
          {
            id: "1",
            mrn: "MRN-00123",
            name: "John Anderson",
            age: 54,
            gender: "M",
            status: "Critical",
            department: "ICU",
            bed: "ICU-101",
            admittedAt: "2 hours ago",
            diagnosis: "Post-operative cardiac care",
            lastVitals: { bp: "140/90", hr: 88, temp: 37.2, spo2: 94, time: "14:30" },
            pendingActions: { medications: 2, labs: 1, procedures: 0 },
            type: "IPD",
          },
          {
            id: "2",
            mrn: "MRN-00456",
            name: "Sarah Mitchell",
            age: 32,
            gender: "F",
            status: "Stable",
            department: "Maternity",
            bed: "MAT-205",
            admittedAt: "1 day ago",
            diagnosis: "Pneumonia recovery",
            lastVitals: { bp: "120/80", hr: 72, temp: 36.8, spo2: 98, time: "15:00" },
            pendingActions: { medications: 1, labs: 0, procedures: 0 },
            type: "IPD",
          },
          {
            id: "3",
            mrn: "MRN-00789",
            name: "Michael Chen",
            age: 45,
            gender: "M",
            status: "Moderate",
            department: "General Ward",
            bed: "GW-312",
            admittedAt: "3 hours ago",
            diagnosis: "Diabetic monitoring",
            lastVitals: { bp: "135/85", hr: 82, temp: 37.5, spo2: 96, time: "14:45" },
            pendingActions: { medications: 3, labs: 2, procedures: 1 },
            type: "IPD",
          },
          {
            id: "4",
            mrn: "MRN-01234",
            name: "Emily Watson",
            age: 28,
            gender: "F",
            status: "Observation",
            department: "OPD Clinic",
            bed: "OPD",
            admittedAt: "Today",
            diagnosis: "Follow-up consultation",
            lastVitals: { bp: "118/75", hr: 68, temp: 36.6, spo2: 99, time: "15:15" },
            pendingActions: { medications: 0, labs: 1, procedures: 0 },
            type: "OPD",
          },
          {
            id: "5",
            mrn: "MRN-01567",
            name: "Robert Garcia",
            age: 67,
            gender: "M",
            status: "Critical",
            department: "Emergency",
            bed: "ER-04",
            admittedAt: "30 minutes ago",
            diagnosis: "Chest pain evaluation",
            lastVitals: { bp: "160/95", hr: 105, temp: 37.8, spo2: 92, time: "15:30" },
            pendingActions: { medications: 1, labs: 3, procedures: 1 },
            type: "IPD",
          },
          {
            id: "6",
            mrn: "MRN-01890",
            name: "Lisa Thompson",
            age: 41,
            gender: "F",
            status: "Stable",
            department: "OPD Clinic",
            bed: "OPD",
            admittedAt: "Today",
            diagnosis: "Routine checkup",
            lastVitals: { bp: "115/70", hr: 70, temp: 36.5, spo2: 99, time: "14:00" },
            pendingActions: { medications: 0, labs: 0, procedures: 0 },
            type: "OPD",
          },
        ];

  // Priority tasks (high or overdue)
  const priorityTasks = useMemo(() => {
    return tasks.filter((t) => t.priority === "high" || t.overdue).slice(0, 4);
  }, [tasks]);

  const overdueCount = tasks.filter((t) => t.overdue).length;

  // Search + filtering
  const filteredBySearch = useMemo(() => {
    const q = patientSearchQuery.trim().toLowerCase();
    if (!q) return patientsData;
    return patientsData.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.bed.toLowerCase().includes(q)
      );
    });
  }, [patientsData, patientSearchQuery]);

  const filteredPatients = useMemo(() => {
    switch (activeTab) {
      case "critical":
        return filteredBySearch.filter((p) => p.status === "Critical");
      case "ipd":
        return filteredBySearch.filter((p) => p.type === "IPD");
      case "opd":
        return filteredBySearch.filter((p) => p.type === "OPD");
      default:
        return filteredBySearch;
    }
  }, [filteredBySearch, activeTab]);

  const criticalPatients = filteredBySearch.filter((p) => p.status === "Critical");
  const ipdPatients = filteredBySearch.filter((p) => p.type === "IPD");
  const opdPatients = filteredBySearch.filter((p) => p.type === "OPD");

  // status -> color classes (uses your existing helper getStatusColor style)
  const getStatusColor = (status: LivePatient["status"]) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Moderate":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Stable":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Observation":
        // mapping choice C: keep Observation as its own badge color (soft amber)
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <HMSLayout>
      <Head title="Nurse Dashboard" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-300 shadow-md flex items-center justify-center text-lg font-semibold text-white">
                {userName?.charAt(0) ?? "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome back, {userName}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700 font-medium">{shift.label}</span>
                  </span>
                  <span>•</span>
                  <span>{userRole}</span>
                  <span>•</span>
                  <span className="text-primary-600 font-medium">K-13, General Ward</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* IPD Dropdown (pill) */}
              <DropdownMenu
                open={isIpdMenuOpen}
                onOpenChange={(open) => {
                  setIsIpdMenuOpen(open);
                  if (open) setIsMyPatientsMenuOpen(false);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    className="px-4 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center gap-2"
                    aria-haspopup="menu"
                    aria-expanded={isIpdMenuOpen}
                  >
                    <FileText className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-700">IPD</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-60 z-[9999] bg-white rounded-xl border border-slate-200 shadow-xl"
                  onInteractOutside={(e) => {
                    if (e.target instanceof Element && e.target.closest(".dropdown-search-zone")) e.preventDefault();
                  }}
                  onCloseAutoFocus={(e) => {
                    if (document.activeElement?.closest(".dropdown-search-zone")) e.preventDefault();
                  }}
                >
                  <div className="dropdown-search-zone p-3 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Search units..." className="h-9 pl-9 text-sm rounded-lg bg-slate-50" />
                    </div>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleIpdNavigate("/nurse/ipd")}>
                    <Bed className="mr-2 h-4 w-4" />
                    All IPD
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleIpdNavigate("/nurse/ipd/census")}>
                    <Users className="mr-2 h-4 w-4" />
                    Ward Census
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleIpdNavigate("/nurse/ipd/beds")}>
                    <Bed className="mr-2 h-4 w-4" />
                    Bed Allocation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleIpdNavigate("/nurse/ipd/admissions")}>
                    <Users className="mr-2 h-4 w-4" />
                    Admissions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleIpdNavigate("/nurse/ipd/discharges")}>
                    <Users className="mr-2 h-4 w-4" />
                    Discharges
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* My Patients Dropdown (pill with badge) */}
              <DropdownMenu
                open={isMyPatientsMenuOpen}
                onOpenChange={(open) => {
                  setIsMyPatientsMenuOpen(open);
                  if (open) setIsIpdMenuOpen(false);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    className="px-4 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center gap-2"
                    aria-haspopup="menu"
                    aria-expanded={isMyPatientsMenuOpen}
                  >
                    <Users className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-700">My Patients</span>
                    <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700"> {patientsData.length} </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-60 z-[9999] bg-white rounded-xl border border-slate-200 shadow-xl"
                  onInteractOutside={(e) => {
                    if (e.target instanceof Element && e.target.closest(".dropdown-search-zone")) e.preventDefault();
                  }}
                  onCloseAutoFocus={(e) => {
                    if (document.activeElement?.closest(".dropdown-search-zone")) e.preventDefault();
                  }}
                >
                  <div className="dropdown-search-zone p-3 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Search patients..." className="h-9 pl-9 text-sm rounded-lg bg-slate-50" />
                    </div>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleMyPatientsNavigate("/nurse/patients/my")}>
                    <Users className="mr-2 h-4 w-4" />
                    My Assigned Patients
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMyPatientsNavigate("/nurse/patients/clinic")}>
                    <Stethoscope className="mr-2 h-4 w-4" />
                    My Clinic Patients
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMyPatientsNavigate("/nurse/patients/ward")}>
                    <Bed className="mr-2 h-4 w-4" />
                    My Ward Patients
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleMyPatientsNavigate("/nurse/patients/all")}>
                    <Users className="mr-2 h-4 w-4" />
                    All Patients
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button className="px-5 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Start Rounds
              </Button>
            </div>
          </div>

          {/* Top stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Patients</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{kpis.assignedPatients}</p>
                  <p className="mt-1 text-xs text-slate-500">Admissions today: {dailyActivity.admissions}</p>
                </div>
                <div className="rounded-xl bg-primary-50 p-3">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Meds Given</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{kpis.medicationsGiven}</p>
                  <p className="mt-1 text-xs text-slate-500">Due next 4h: {dailyActivity.medicationsDueSoon}</p>
                </div>
                <div className="rounded-xl bg-primary-50 p-3">
                  <Pill className="h-6 w-6 text-primary-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Alerts</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{kpis.alerts}</p>
                  <p className="mt-1 text-xs text-slate-500">Resolved today: {dailyActivity.alertsResolved}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Vitals Done</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{kpis.vitalsRecorded}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dailyActivity.lastVitalsDiff ? `Last recorded ${dailyActivity.lastVitalsDiff}` : "No vitals recorded today"}
                  </p>
                </div>
                <div className="rounded-xl bg-primary-50 p-3">
                  <Activity className="h-6 w-6 text-primary-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mid section: Priority tasks + Analytics + Unit overview */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Priority Tasks */}
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Priority Tasks</CardTitle>
                  {overdueCount > 0 && (
                    <Badge className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 border border-red-200">{overdueCount} Overdue</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 px-6 pb-6">
                <div className="space-y-3">
                  {priorityTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer",
                        task.overdue ? "border-red-200 bg-red-50" : "border-slate-100 bg-white"
                      )}
                      onClick={() => router.visit(`/nurse/tasks/${task.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("h-2 w-2 rounded-full", task.overdue ? "bg-red-500" : task.priority === "high" ? "bg-amber-500" : "bg-blue-500")} />
                        <div>
                          <p className="font-medium text-slate-900">{task.title}</p>
                          {task.patient && <p className="text-xs text-slate-600">{task.patient}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">{task.due_time}</span>
                        <Button size="sm" variant="ghost" className="h-8 rounded-lg px-3 text-xs font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700">Start</Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="ghost" className="mt-4 w-full rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700" onClick={() => router.visit("/nurse/tasks")}>
                  View All Tasks
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 px-6">
                <CardTitle className="text-base font-semibold text-slate-900">Analytics</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-6 pb-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Patients/Nurse</p>
                      <p className="mt-1 text-3xl font-bold text-slate-900">{analytics.patientsPerNurse}</p>
                    </div>
                    <div className="rounded-xl bg-primary-50 px-4 py-2">
                      <p className="text-xs font-medium text-primary-700">Shift Done</p>
                      <p className="text-lg font-bold text-primary-900">{analytics.shiftCompletion}%</p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">Pending Orders</p>
                      <p className="text-lg font-bold text-slate-900">{analytics.pendingOrders.total}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-red-50 p-3 text-center">
                        <p className="text-xs text-red-600">Labs</p>
                        <p className="mt-1 text-xl font-bold text-red-900">{analytics.pendingOrders.labs}</p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3 text-center">
                        <p className="text-xs text-amber-600">Imaging</p>
                        <p className="mt-1 text-xl font-bold text-amber-900">{analytics.pendingOrders.imaging}</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3 text-center">
                        <p className="text-xs text-emerald-600">Medications</p>
                        <p className="mt-1 text-xl font-bold text-emerald-900">{analytics.pendingOrders.medications}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">Bed Occupancy</p>
                      <p className="text-sm font-semibold text-slate-900">{analytics.bedOccupancy.percentage}%</p>
                    </div>
                    <Progress value={analytics.bedOccupancy.percentage} className="h-2 bg-slate-100" />
                    <p className="mt-2 text-xs text-slate-600">{analytics.bedOccupancy.occupied} of {analytics.bedOccupancy.total} beds</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Unit Overview */}
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Active Unit Overview</CardTitle>
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-primary-600 hover:bg-primary-50 hover:text-primary-700" onClick={() => router.visit("/nurse/facility")}>
                    Real-time
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 px-6 pb-6">
                <div className="space-y-4">
                  {unitOverview.map((unit) => {
                    const occupancyColor = unit.occupancy.percentage >= 90 ? "text-red-600" : unit.occupancy.percentage >= 75 ? "text-amber-600" : "text-emerald-600";
                    const updatedLabel = unit.updatedAgo && unit.updatedAgo !== "No recent updates" ? `Updated ${unit.updatedAgo}` : unit.updatedAgo ?? "No recent updates";

                    return (
                      <div key={unit.id} className="group cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-primary-200 hover:shadow-md" onClick={() => router.visit(`/nurse/units/${unit.id}`)}>
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="rounded-lg bg-primary-100 p-2">
                                <Bed className="h-4 w-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{unit.name}</p>
                                <p className="text-xs text-slate-600">{unit.type} • {updatedLabel}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {unit.patients}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Bed Occupancy</span>
                            <span className={cn("font-semibold", occupancyColor)}>{unit.occupancy.percentage}%</span>
                          </div>
                          <Progress value={unit.occupancy.percentage} className="h-1.5 bg-slate-200" />
                          <p className="text-xs text-slate-600">{unit.occupancy.occupied} of {unit.occupancy.capacity} beds</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---------- Live Patients (full-width Lovable style) ---------- */}
          <div className="mb-6">
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-semibold text-slate-900">Patients</CardTitle>
                    <Badge className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">Live</Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search by name, MRN, or bed..."
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        className="h-9 rounded-full pr-3 pl-10 border-slate-200 bg-slate-50 text-sm"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>

                    <div className="hidden sm:block">
                      <div className="inline-flex rounded-full bg-slate-50 p-1">
                        <button
                          onClick={() => setActiveTab("all")}
                          className={cn("px-3 py-1 rounded-full text-sm font-medium", activeTab === "all" ? "bg-white shadow text-slate-900" : "text-slate-600")}
                        >
                          All <span className="ml-2 inline-flex rounded-full bg-slate-200 px-2 py-0 text-xs">{filteredBySearch.length}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("critical")}
                          className={cn("px-3 py-1 rounded-full text-sm font-medium", activeTab === "critical" ? "bg-white shadow text-slate-900" : "text-slate-600")}
                        >
                          Critical <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0 text-xs text-red-700">{criticalPatients.length}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("ipd")}
                          className={cn("px-3 py-1 rounded-full text-sm font-medium", activeTab === "ipd" ? "bg-white shadow text-slate-900" : "text-slate-600")}
                        >
                          IPD <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0 text-xs text-blue-700">{ipdPatients.length}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("opd")}
                          className={cn("px-3 py-1 rounded-full text-sm font-medium", activeTab === "opd" ? "bg-white shadow text-slate-900" : "text-slate-600")}
                        >
                          OPD <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0 text-xs text-emerald-700">{opdPatients.length}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 px-6 pb-6">
                {filteredPatients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">No patients found</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                        onClick={() => router.visit(`/nurse/patients/${patient.id}`)}
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold">
                            {patient.name
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .slice(0, 2)
                              .join("")}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-semibold text-slate-900 truncate">{patient.name}</h4>
                              <Badge className={cn("rounded-full px-2 py-0.5 text-xs font-medium", getStatusColor(patient.status))}>{patient.status}</Badge>
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              <span className="mr-2">{patient.age}y • {patient.gender}</span>
                              <span className="mr-2">•</span>
                              <span className="text-slate-600">{patient.type} • {patient.bed}</span>
                            </div>

                            {patient.diagnosis && <p className="mt-3 text-sm text-slate-600 truncate">{patient.diagnosis}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end text-xs text-slate-500">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-slate-700">
                                <Heart className="h-4 w-4 text-red-500" />
                                <span className="font-medium">{patient.lastVitals.hr}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-700">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{patient.lastVitals.bp}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-700">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                <span className="font-medium">{patient.lastVitals.spo2}%</span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">{patient.lastVitals.time}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (patient.encounterId) {
                                  router.visit(`/nurse/vitals/${patient.encounterId}`);
                                } else {
                                  router.visit(`/nurse/vitals`);
                                }
                              }}
                            >
                              <Activity className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (patient.encounterId) {
                                  router.visit(`/nurse/orders?encounter=${patient.encounterId}`);
                                } else {
                                  router.visit(`/nurse/orders`);
                                }
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                // phone action - provide route if available
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 rounded-full text-primary-600 hover:bg-primary-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.visit(`/nurse/patients/${patient.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* ---------- End Live Patients ---------- */}
        </div>
      </div>
    </HMSLayout>
  );
}
