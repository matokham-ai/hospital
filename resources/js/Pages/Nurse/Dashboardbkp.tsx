import { useMemo, useState } from "react";
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
  id: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  // Debug: Log live patients data
  console.log('Live Patients Data:', livePatients);

  // Use sample data if no live patients (for demo purposes)
  const patientsData = livePatients.length > 0 ? livePatients : [
    {
      id: "1",
      mrn: "MRN-00123",
      name: "John Anderson",
      age: 54,
      gender: "M",
      status: "Critical" as const,
      department: "ICU",
      bed: "ICU-101",
      admittedAt: "2 hours ago",
      diagnosis: "Post-operative cardiac care",
      lastVitals: {
        bp: "140/90",
        hr: 88,
        temp: 37.2,
        spo2: 94,
        time: "14:30"
      },
      pendingActions: {
        medications: 2,
        labs: 1,
        procedures: 0
      },
      type: "IPD" as const
    },
    {
      id: "2",
      mrn: "MRN-00456",
      name: "Sarah Mitchell",
      age: 32,
      gender: "F",
      status: "Stable" as const,
      department: "Maternity",
      bed: "MAT-205",
      admittedAt: "1 day ago",
      diagnosis: "Pneumonia recovery",
      lastVitals: {
        bp: "120/80",
        hr: 72,
        temp: 36.8,
        spo2: 98,
        time: "15:00"
      },
      pendingActions: {
        medications: 1,
        labs: 0,
        procedures: 0
      },
      type: "IPD" as const
    },
    {
      id: "3",
      mrn: "MRN-00789",
      name: "Michael Chen",
      age: 45,
      gender: "M",
      status: "Moderate" as const,
      department: "General Ward",
      bed: "GW-312",
      admittedAt: "3 hours ago",
      diagnosis: "Diabetic monitoring",
      lastVitals: {
        bp: "135/85",
        hr: 82,
        temp: 37.5,
        spo2: 96,
        time: "14:45"
      },
      pendingActions: {
        medications: 3,
        labs: 2,
        procedures: 1
      },
      type: "IPD" as const
    },
    {
      id: "4",
      mrn: "MRN-01234",
      name: "Emily Watson",
      age: 28,
      gender: "F",
      status: "Observation" as const,
      department: "OPD Clinic",
      bed: "OPD",
      admittedAt: "Today",
      diagnosis: "Follow-up consultation",
      lastVitals: {
        bp: "118/75",
        hr: 68,
        temp: 36.6,
        spo2: 99,
        time: "15:15"
      },
      pendingActions: {
        medications: 0,
        labs: 1,
        procedures: 0
      },
      type: "OPD" as const
    },
    {
      id: "5",
      mrn: "MRN-01567",
      name: "Robert Garcia",
      age: 67,
      gender: "M",
      status: "Critical" as const,
      department: "Emergency",
      bed: "ER-04",
      admittedAt: "30 minutes ago",
      diagnosis: "Chest pain evaluation",
      lastVitals: {
        bp: "160/95",
        hr: 105,
        temp: 37.8,
        spo2: 92,
        time: "15:30"
      },
      pendingActions: {
        medications: 1,
        labs: 3,
        procedures: 1
      },
      type: "IPD" as const
    },
    {
      id: "6",
      mrn: "MRN-01890",
      name: "Lisa Thompson",
      age: 41,
      gender: "F",
      status: "Stable" as const,
      department: "OPD Clinic",
      bed: "OPD",
      admittedAt: "Today",
      diagnosis: "Routine checkup",
      lastVitals: {
        bp: "115/70",
        hr: 70,
        temp: 36.5,
        spo2: 99,
        time: "14:00"
      },
      pendingActions: {
        medications: 0,
        labs: 0,
        procedures: 0
      },
      type: "OPD" as const
    }
  ];

  const priorityTasks = useMemo(() => {
    return tasks
      .filter((task) => task.priority === "high" || task.overdue)
      .slice(0, 4);
  }, [tasks]);

  const overdueCount = tasks.filter((t) => t.overdue).length;

  // Filter patients based on search and tab
  const filteredPatients = useMemo(() => {
    return patientsData.filter((patient) => {
      const searchLower = patientSearchQuery.toLowerCase();
      return (
        patient.name.toLowerCase().includes(searchLower) ||
        patient.mrn.toLowerCase().includes(searchLower) ||
        patient.bed.toLowerCase().includes(searchLower)
      );
    });
  }, [patientsData, patientSearchQuery]);

  const criticalPatients = filteredPatients.filter((p) => p.status === "Critical");
  const ipdPatients = filteredPatients.filter((p) => p.type === "IPD");
  const opdPatients = filteredPatients.filter((p) => p.type === "OPD");

  const getStatusColor = (status: LivePatient["status"]) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Moderate":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Stable":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Observation":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <HMSLayout>
      <Head title="Nurse Dashboard" />

      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="mx-auto max-w-[1600px] px-6 py-8">

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                      {userName.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Welcome back, {userName}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {shift.label}
                      </span>
                      <span>•</span>
                      <span>{userRole}</span>
                      <span>•</span>
                      <span className="text-teal-600 font-medium">
                        K-13, General Ward
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">

                {/* IPD Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="px-4 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Bed className="h-4 w-4 text-slate-600" />
                      <span className="font-medium text-slate-700">IPD</span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-60 z-[9999] bg-white rounded-xl border border-slate-200 shadow-xl"
                    onInteractOutside={(e) => {
                      if (e.target.closest(".dropdown-search-zone")) e.preventDefault();
                    }}
                    onCloseAutoFocus={(e) => {
                      if (document.activeElement?.closest(".dropdown-search-zone"))
                        e.preventDefault();
                    }}
                  >
                    {/* Search */}
                    <div className="dropdown-search-zone p-3 pb-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search units..."
                          className="h-9 pl-9 text-sm rounded-lg bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => router.visit("/nurse/ipd")}>
                      <Bed className="mr-2 h-4 w-4" />
                      All IPD
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.visit("/nurse/ipd/census")}>
                      <Users className="mr-2 h-4 w-4" />
                      Ward Census
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.visit("/nurse/ipd/beds")}>
                      <Bed className="mr-2 h-4 w-4" />
                      Bed Allocation
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.visit("/nurse/ipd/admissions")}>
                      <Users className="mr-2 h-4 w-4" />
                      Admissions
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.visit("/nurse/ipd/discharges")}>
                      <Users className="mr-2 h-4 w-4" />
                      Discharges
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* My Patients Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="px-4 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Users className="h-4 w-4 text-slate-600" />
                      <span className="font-medium text-slate-700">My Patients</span>
                      {/* Count Badge like screenshot */}
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        12
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-60 z-[9999] bg-white rounded-xl border border-slate-200 shadow-xl"
                    onInteractOutside={(e) => {
                      if (e.target.closest(".dropdown-search-zone")) e.preventDefault();
                    }}
                    onCloseAutoFocus={(e) => {
                      if (document.activeElement?.closest(".dropdown-search-zone"))
                        e.preventDefault();
                    }}
                  >
                    {/* Search */}
                    <div className="dropdown-search-zone p-3 pb-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search patients..."
                          className="h-9 pl-9 text-sm rounded-lg bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => router.visit("/nurse/patients/my")}>
                      <Users className="mr-2 h-4 w-4" />
                      My Assigned Patients
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.visit("/nurse/patients/clinic")}>
                      <Stethoscope className="mr-2 h-4 w-4" />
                      My Clinic Patients
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.visit("/nurse/patients/ward")}>
                      <Bed className="mr-2 h-4 w-4" />
                      My Ward Patients
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => router.visit("/nurse/patients/all")}>
                      <Users className="mr-2 h-4 w-4" />
                      All Patients
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Start Rounds */}
                <Button className="px-5 h-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Start Rounds
                </Button>

              </div>

            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Patients</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {kpis.assignedPatients}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Admissions today: {dailyActivity.admissions}
                  </p>
                </div>
                <div className="rounded-xl bg-teal-100 p-3">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Meds Given</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {kpis.medicationsGiven}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Due next 4h: {dailyActivity.medicationsDueSoon}
                  </p>
                </div>
                <div className="rounded-xl bg-teal-100 p-3">
                  <Pill className="h-6 w-6 text-teal-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Alerts</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {kpis.alerts}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Resolved today: {dailyActivity.alertsResolved}
                  </p>
                </div>
                <div className="rounded-xl bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Vitals Done</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {kpis.vitalsRecorded}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dailyActivity.lastVitalsDiff
                      ? `Last recorded ${dailyActivity.lastVitalsDiff}`
                      : "No vitals recorded today"}
                  </p>
                </div>
                <div className="rounded-xl bg-teal-100 p-3">
                  <Activity className="h-6 w-6 text-teal-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Tasks, Analytics, Active Unit Overview - Side by Side */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">

            {/* Priority Tasks */}
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Priority Tasks
                    </CardTitle>
                    {overdueCount > 0 && (
                      <Badge className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 border border-red-200">
                        {overdueCount} Overdue
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {priorityTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "group flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer",
                          task.overdue
                            ? "border-red-200 bg-red-50"
                            : "border-slate-200 bg-white hover:border-teal-200"
                        )}
                        onClick={() => router.visit(`/nurse/tasks/${task.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              task.overdue
                                ? "bg-red-500"
                                : task.priority === "high"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            )}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{task.title}</p>
                            {task.patient && (
                              <p className="text-xs text-slate-600">{task.patient}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600">{task.due_time}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg px-3 text-xs font-medium text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                          >
                            Start
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-4 w-full rounded-xl text-sm font-medium text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => router.visit("/nurse/tasks")}
                  >
                    View All Tasks
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

            {/* Analytics */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Patients Per Nurse */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Patients/Nurse
                      </p>
                      <p className="mt-1 text-3xl font-bold text-slate-900">
                        {analytics.patientsPerNurse}
                      </p>
                    </div>
                    <div className="rounded-xl bg-teal-50 px-4 py-2">
                      <p className="text-xs font-medium text-teal-700">
                        Shift Done
                      </p>
                      <p className="text-lg font-bold text-teal-900">
                        {analytics.shiftCompletion}%
                      </p>
                    </div>
                  </div>

                  {/* Pending Orders */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">
                        Pending Orders
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {analytics.pendingOrders.total}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-red-50 p-3 text-center">
                        <p className="text-xs text-red-600">Labs</p>
                        <p className="mt-1 text-xl font-bold text-red-900">
                          {analytics.pendingOrders.labs}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3 text-center">
                        <p className="text-xs text-amber-600">Imaging</p>
                        <p className="mt-1 text-xl font-bold text-amber-900">
                          {analytics.pendingOrders.imaging}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3 text-center">
                        <p className="text-xs text-emerald-600">Medications</p>
                        <p className="mt-1 text-xl font-bold text-emerald-900">
                          {analytics.pendingOrders.medications}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bed Occupancy */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">
                        Bed Occupancy
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {analytics.bedOccupancy.percentage}%
                      </p>
                    </div>
                    <Progress
                      value={analytics.bedOccupancy.percentage}
                      className="h-2 bg-slate-100"
                    />
                    <p className="mt-2 text-xs text-slate-600">
                      {analytics.bedOccupancy.occupied} of {analytics.bedOccupancy.total} beds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Unit Overview */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Active Unit Overview
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => router.visit("/nurse/facility")}
                  >
                    Real-time
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {unitOverview.map((unit) => {
                    const occupancyColor =
                      unit.occupancy.percentage >= 90
                        ? "text-red-600"
                        : unit.occupancy.percentage >= 75
                        ? "text-amber-600"
                        : "text-emerald-600";

                    const updatedLabel =
                      unit.updatedAgo && unit.updatedAgo !== "No recent updates"
                        ? `Updated ${unit.updatedAgo}`
                        : unit.updatedAgo ?? "No recent updates";

                    return (
                      <div
                        key={unit.id}
                        className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-teal-200 hover:shadow-md"
                        onClick={() => router.visit(`/nurse/units/${unit.id}`)}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="rounded-lg bg-teal-100 p-2">
                                <Bed className="h-4 w-4 text-teal-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {unit.name}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {unit.type} • {updatedLabel}
                                </p>
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
                            <span className={cn("font-semibold", occupancyColor)}>
                              {unit.occupancy.percentage}%
                            </span>
                          </div>
                          <Progress
                            value={unit.occupancy.percentage}
                            className="h-1.5 bg-slate-200"
                          />
                          <p className="text-xs text-slate-600">
                            {unit.occupancy.occupied} of {unit.occupancy.capacity} beds
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Patients Section - Full Width */}
          <div className="mb-6">
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Live Patients
                  </CardTitle>
                  <Badge className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-600 border border-teal-200">
                    {patientsData.length} Active
                  </Badge>
                </div>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, MRN, or bed..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200"
                  />
                </div>
              </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 rounded-xl bg-slate-100 p-1">
                      <TabsTrigger value="all" className="rounded-lg text-xs">
                        All
                        <Badge className="ml-2 rounded-full bg-slate-200 px-2 py-0 text-xs">
                          {filteredPatients.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="critical" className="rounded-lg text-xs">
                        Critical
                        <Badge className="ml-2 rounded-full bg-red-100 px-2 py-0 text-xs text-red-700">
                          {criticalPatients.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="ipd" className="rounded-lg text-xs">
                        IPD
                        <Badge className="ml-2 rounded-full bg-blue-100 px-2 py-0 text-xs text-blue-700">
                          {ipdPatients.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="opd" className="rounded-lg text-xs">
                        OPD
                        <Badge className="ml-2 rounded-full bg-emerald-100 px-2 py-0 text-xs text-emerald-700">
                          {opdPatients.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                      {filteredPatients.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">
                          No patients found
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-teal-200 hover:shadow-md"
                            onClick={() => router.visit(`/patients/${patient.id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                                  <Badge className={cn("rounded-full border px-2 py-0 text-xs", getStatusColor(patient.status))}>
                                    {patient.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {patient.age}y • {patient.gender}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {patient.bed}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Stethoscope className="h-3 w-3" />
                                    {patient.department}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    MRN: {patient.mrn}
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-red-500" />
                                        <span className="font-medium">{patient.lastVitals.hr}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Activity className="h-3 w-3 text-blue-500" />
                                        <span className="font-medium">{patient.lastVitals.bp}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                        <span className="font-medium">{patient.lastVitals.spo2}%</span>
                                      </div>
                                    </div>
                                    <span className="text-slate-500">{patient.lastVitals.time}</span>
                                  </div>
                                </div>
                                {(patient.pendingActions.medications > 0 || 
                                  patient.pendingActions.labs > 0 || 
                                  patient.pendingActions.procedures > 0) && (
                                  <div className="mt-2 flex items-center gap-2">
                                    {patient.pendingActions.medications > 0 && (
                                      <Badge className="rounded-full bg-emerald-100 px-2 py-0 text-xs text-emerald-700">
                                        <Pill className="mr-1 h-3 w-3" />
                                        {patient.pendingActions.medications}
                                      </Badge>
                                    )}
                                    {patient.pendingActions.labs > 0 && (
                                      <Badge className="rounded-full bg-amber-100 px-2 py-0 text-xs text-amber-700">
                                        <TestTube className="mr-1 h-3 w-3" />
                                        {patient.pendingActions.labs}
                                      </Badge>
                                    )}
                                    {patient.pendingActions.procedures > 0 && (
                                      <Badge className="rounded-full bg-blue-100 px-2 py-0 text-xs text-blue-700">
                                        <Syringe className="mr-1 h-3 w-3" />
                                        {patient.pendingActions.procedures}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg px-3 text-xs font-medium text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="critical" className="mt-4">
                      {criticalPatients.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">
                          No critical patients
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {criticalPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="group cursor-pointer rounded-xl border border-red-200 bg-red-50 p-4 transition-all hover:border-red-300 hover:shadow-md"
                            onClick={() => router.visit(`/patients/${patient.id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                                  <Badge className="rounded-full border bg-red-100 text-red-700 border-red-200 px-2 py-0 text-xs">
                                    {patient.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {patient.age}y • {patient.gender}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {patient.bed}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Stethoscope className="h-3 w-3" />
                                    {patient.department}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    MRN: {patient.mrn}
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-red-200">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-red-500" />
                                        <span className="font-medium">{patient.lastVitals.hr}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Activity className="h-3 w-3 text-blue-500" />
                                        <span className="font-medium">{patient.lastVitals.bp}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                        <span className="font-medium">{patient.lastVitals.spo2}%</span>
                                      </div>
                                    </div>
                                    <span className="text-slate-500">{patient.lastVitals.time}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-100 hover:text-red-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="ipd" className="mt-4">
                      {ipdPatients.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">
                          No IPD patients
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ipdPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-teal-200 hover:shadow-md"
                            onClick={() => router.visit(`/patients/${patient.id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                                  <Badge className={cn("rounded-full border px-2 py-0 text-xs", getStatusColor(patient.status))}>
                                    {patient.status}
                                  </Badge>
                                  <Badge className="rounded-full bg-blue-100 text-blue-700 px-2 py-0 text-xs">
                                    IPD
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {patient.age}y • {patient.gender}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {patient.bed}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Stethoscope className="h-3 w-3" />
                                    {patient.department}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    MRN: {patient.mrn}
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-red-500" />
                                        <span className="font-medium">{patient.lastVitals.hr}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Activity className="h-3 w-3 text-blue-500" />
                                        <span className="font-medium">{patient.lastVitals.bp}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                        <span className="font-medium">{patient.lastVitals.spo2}%</span>
                                      </div>
                                    </div>
                                    <span className="text-slate-500">{patient.lastVitals.time}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg px-3 text-xs font-medium text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="opd" className="mt-4">
                      {opdPatients.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">
                          No OPD patients
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {opdPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-teal-200 hover:shadow-md"
                            onClick={() => router.visit(`/patients/${patient.id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                                  <Badge className={cn("rounded-full border px-2 py-0 text-xs", getStatusColor(patient.status))}>
                                    {patient.status}
                                  </Badge>
                                  <Badge className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0 text-xs">
                                    OPD
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {patient.age}y • {patient.gender}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {patient.bed}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Stethoscope className="h-3 w-3" />
                                    {patient.department}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    MRN: {patient.mrn}
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-red-500" />
                                        <span className="font-medium">{patient.lastVitals.hr}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Activity className="h-3 w-3 text-blue-500" />
                                        <span className="font-medium">{patient.lastVitals.bp}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                        <span className="font-medium">{patient.lastVitals.spo2}%</span>
                                      </div>
                                    </div>
                                    <span className="text-slate-500">{patient.lastVitals.time}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg px-3 text-xs font-medium text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
