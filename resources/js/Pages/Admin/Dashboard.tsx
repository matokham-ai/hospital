import { useEffect, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { motion } from "framer-motion";
import RevenueChart from "./RevenueChart";
import PaymentMethodsChart from "./PaymentMethodsChart";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/Components/ui/breadcrumb";

import {
  Settings,
  Building2,
  Bed,
  TestTube,
  Pill,
  Activity,
  RefreshCw,
  Users,
  Calendar as CalendarIcon,
  AlertCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
  Eye,
  ExternalLink,
  Wifi,
} from "lucide-react";

/* =========================================================
   Types
========================================================= */
interface KPIs {
  todayAppointments: number;
  activeAdmissions: number;
  pendingBills: number;
  labsPending: number;
  bedOccupancy: number;
  totalRevenue: number;
  patientsToday: number;
  activeConsultations: number;
  urgentLabTests: number;
}

interface ActivityItem {
  id: number;
  type: string;
  message: string;
  time: string;
  priority: "high" | "medium" | "normal";
}

interface Alert {
  id: number;
  type: "warning" | "error" | "info";
  message: string;
}

interface DepartmentWorkload {
  dept: string;
  load: number; // 0..100
  color: string; // e.g. "blue", "green", etc.
}

interface AdminDashboardProps {
  userName?: string;
  kpis?: KPIs;
  recentActivity?: ActivityItem[];
  alerts?: Alert[];
  departmentWorkload?: DepartmentWorkload[];
  lastUpdated?: string;
}

/* =========================================================
   Helpers
========================================================= */
const formatCurrency = (amount: number = 0) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(
    amount || 0
  );

const alertIcon = (type: Alert["type"]) => {
  const base = "h-4 w-4";
  switch (type) {
    case "error":
      return <AlertCircle className={`${base} text-red-500`} />;
    case "warning":
      return <AlertCircle className={`${base} text-yellow-500`} />;
    default:
      return <AlertCircle className={`${base} text-blue-500`} />;
  }
};

const alertBg = (type: Alert["type"]) => {
  switch (type) {
    case "error":
      return "bg-red-50 border-red-200";
    case "warning":
      return "bg-yellow-50 border-yellow-200";
    default:
      return "bg-blue-50 border-blue-200";
  }
};

// Tailwind needs known classes; map to a fixed palette
const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  sky: "bg-sky-500",
  cyan: "bg-cyan-500",
  teal: "bg-teal-500",
  emerald: "bg-emerald-500",
  green: "bg-green-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

const motionFade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

/* =========================================================
   Component
========================================================= */
export default function AdminDashboard(props: Partial<AdminDashboardProps>) {
  // Safe defaults (prevents .map/.reduce of undefined)
  const {
    userName = "Admin",
    kpis = {
      todayAppointments: 0,
      activeAdmissions: 0,
      pendingBills: 0,
      labsPending: 0,
      bedOccupancy: 0,
      totalRevenue: 0,
      patientsToday: 0,
      activeConsultations: 0,
      urgentLabTests: 0,
    },
    recentActivity = [],
    alerts = [],
    departmentWorkload = [],
    lastUpdated = new Date().toISOString(),
  } = props;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [livePulse, setLivePulse] = useState(false);

  // Sample chart data - TODO: replace with real data from backend
  const sampleRevenueData: { date: string; total: number }[] = [
    { date: "2024-01-01", total: 45000 },
    { date: "2024-01-02", total: 52000 },
    { date: "2024-01-03", total: 48000 },
    { date: "2024-01-04", total: 61000 },
    { date: "2024-01-05", total: 55000 },
    { date: "2024-01-06", total: 67000 },
    { date: "2024-01-07", total: 59000 },
  ];

  const samplePaymentData: { method: string; value: number }[] = [
    { method: "Cash", value: 35 },
    { method: "Insurance", value: 45 },
    { method: "Card", value: 15 },
    { method: "Mobile Money", value: 5 },
  ];

  const nowLabel = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  /* ---------------------------------------------
     Reverb (optional, safe if Echo not present)
  ----------------------------------------------*/
  useEffect(() => {
    // detect connection state in dev/production
    // @ts-ignore
    const echo = (window as any)?.Echo;
    // @ts-ignore
    const sock = echo?.connector?.socket;

    if (sock?.on) {
      sock.on("connect", () => setLiveConnected(true));
      sock.on("disconnect", () => setLiveConnected(false));
    }

    if (echo?.channel) {
      const ch = echo.channel("admin-dashboard");
      // Example events you might broadcast from backend
      ch.listen("BillingUpdated", handleLiveUpdate);
      ch.listen("AdmissionUpdated", handleLiveUpdate);
      ch.listen("LabTestUpdated", handleLiveUpdate);
      return () => {
        ch.stopListening("BillingUpdated");
        ch.stopListening("AdmissionUpdated");
        ch.stopListening("LabTestUpdated");
      };
    }
  }, []);

  const handleLiveUpdate = () => {
    // subtle pulse animation on "LIVE" badge
    setLivePulse(true);
    setTimeout(() => setLivePulse(false), 1200);

    // Light-weight refresh via Inertia (only what matters)
    router.reload({
      only: ["kpis", "recentActivity", "alerts", "departmentWorkload", "lastUpdated"],
      preserveUrl: true,
    });
  };

  /* ---------------------------------------------
     Actions
  ----------------------------------------------*/
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.reload({
        only: ["kpis", "recentActivity", "alerts", "departmentWorkload", "lastUpdated"],
        preserveUrl: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchModalData = async (endpoint: string) => {
    setModalLoading(true);
    setModalData([]);
    try {
      const res = await fetch(endpoint, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Received data:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));

        // Handle different response structures
        let extractedData = [];
        if (Array.isArray(data)) {
          extractedData = data;
        } else if (data && typeof data === 'object') {
          extractedData = data.data || data.departments || data.wards || data.tests || data.drugs || data.items || [];
        }

        console.log('Extracted data:', extractedData);
        setModalData(extractedData);
      } else {
        console.error("Failed to fetch data:", res.statusText);
        setModalData([]);
      }
    } catch (e) {
      console.error("Error fetching data:", e);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  /* ---------------------------------------------
     UI Helpers
  ----------------------------------------------*/
  const LiveBadge = () => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${liveConnected ? "bg-green-600/90 text-white" : "bg-gray-300 text-gray-700"
        } ${livePulse ? "ring-2 ring-offset-2 ring-green-300" : ""}`}
      title={liveConnected ? "Realtime connected" : "Realtime disconnected"}
    >
      <Wifi className="h-3.5 w-3.5" />
      {liveConnected ? "LIVE" : "OFFLINE"}
    </span>
  );

  return (
    <AdminLayout>
      <Head title="Admin Dashboard - MediCare HMS" />

      {/* ======= Gradient Header (combo of Ocean + Medical) ======= */}
      <div className="rounded-2xl border border-teal-100 shadow-sm bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-600 text-white mb-8">
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1">
            <Breadcrumb>
              <BreadcrumbList className="text-white/90">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="opacity-80" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="opacity-80" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <LiveBadge />
            </div>
            <p className="text-white/80 text-sm mt-1">
              Welcome back, {userName}. System overview & quick actions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:block text-white/90 text-sm mr-2">
              {nowLabel}
            </span>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="secondary"
              size="sm"
              className="bg-white/10 border-white/30 hover:bg-white/20"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* ======= Alerts ======= */}
      {alerts && alerts.length > 0 && (
        <motion.div
          {...motionFade}
          className="mb-6 space-y-2 max-w-7xl mx-auto"
        >
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded-lg border flex items-center gap-2 ${alertBg(
                a.type
              )}`}
            >
              {alertIcon(a.type)}
              <span className="text-sm font-medium">{a.message}</span>
            </div>
          ))}
        </motion.div>
      )}

      <div className="space-y-8 max-w-7xl mx-auto">
        {/* ======= KPI Cards ======= */}
        <motion.div
          {...motionFade}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Today&apos;s Appointments
                  </p>
                  <p className="text-2xl font-bold">{kpis.todayAppointments || 0}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Admissions
                  </p>
                  <p className="text-2xl font-bold">{kpis.activeAdmissions || 0}</p>
                </div>
                <Bed className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bed Occupancy</p>
                  <p className="text-2xl font-bold">
                    {(kpis.bedOccupancy || 0).toFixed(0)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Today&apos;s Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(kpis.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                  <p className="text-2xl font-bold">{kpis.pendingBills || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Labs Pending</p>
                  <p className="text-2xl font-bold">{kpis.labsPending || 0}</p>
                </div>
                <TestTube className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    New Patients Today
                  </p>
                  <p className="text-2xl font-bold">{kpis.patientsToday || 0}</p>
                </div>
                <Users className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Consultations
                  </p>
                  <p className="text-2xl font-bold">{kpis.activeConsultations || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue & Collections</CardTitle>
              <CardDescription>Hospital income trends (past 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={sampleRevenueData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution of payment types</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentMethodsChart data={samplePaymentData} />
            </CardContent>
          </Card>
        </div>


        {/* ======= Main Grid ======= */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <motion.div {...motionFade} className="lg:col-span-2">
            <Card className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${a.priority === "high"
                            ? "bg-red-500"
                            : a.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {a.message}
                          </p>
                          <p className="text-xs text-gray-500">{a.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Department Workload + Quick Actions */}
          <div className="space-y-6">
            {/* Department Workload */}
            <motion.div {...motionFade}>
              <Card className="hover:shadow-md transition">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Department Workload
                  </CardTitle>
                  <CardDescription>Current department activity levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {departmentWorkload && departmentWorkload.length > 0 ? (
                      departmentWorkload.map((dept) => {
                        const width = Math.max(
                          0,
                          Math.min(100, Number(dept.load) || 0)
                        );
                        const colorClass =
                          COLOR_MAP[dept.color?.toLowerCase?.() || ""] ||
                          COLOR_MAP.gray;
                        return (
                          <div key={dept.dept} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{dept.dept}</span>
                              <span className="text-gray-500">{width}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${colorClass}`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No department data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions with Premium Modals */}
            <motion.div {...motionFade}>
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
                      <Settings className="h-5 w-5" />
                    </div>
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Streamlined access to key management functions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Departments Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.button
                        onClick={() => fetchModalData("/admin/departments")}
                        className="block w-full p-4 text-left rounded-xl border-0 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 hover:from-blue-100 hover:via-sky-100 hover:to-cyan-100 transition-all duration-300 group shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm group-hover:shadow-md transition-all duration-300">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">
                                Manage Departments
                              </p>
                              <p className="text-sm text-gray-600">
                                Configure hospital departments & structure
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                              Quick View
                            </div>
                            <Eye className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 border-0 shadow-2xl">
                      {/* Premium header with enhanced gradient */}
                      <div className="px-6 py-6 border-b bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-sky-600/90 to-cyan-600/90"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                        <DialogHeader className="p-0 relative z-10">
                          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                              <Building2 className="h-6 w-6" />
                            </div>
                            Department Management
                          </DialogTitle>
                          <DialogDescription className="mt-2 text-blue-100">
                            View and manage hospital departments with real-time data
                          </DialogDescription>
                        </DialogHeader>
                      </div>

                      <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <BarChart3 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {modalLoading ? "Loading..." : `${modalData.length} departments found`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Active hospital departments
                              </p>
                            </div>
                          </div>
                          <Link href="/admin/departments">
                            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-300">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Full Management
                            </Button>
                          </Link>
                        </div>

                        <div className="border-0 rounded-xl shadow-sm bg-white max-h-80 overflow-y-auto">
                          {modalLoading ? (
                            <div className="p-12 text-center">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-4 flex items-center justify-center">
                                  <RefreshCw className="h-6 w-6 animate-spin text-white" />
                                </div>
                                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto animate-ping opacity-20"></div>
                              </div>
                              <p className="text-gray-600 font-medium">Loading departments...</p>
                              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data</p>
                            </div>
                          ) : modalData.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {modalData.map((item: any, idx: number) => (
                                <div key={item.deptid || item.id || idx} className="p-4 border-b">
                                  <div className="font-semibold">{String(item.name || "Unknown")}</div>
                                  <div className="text-sm text-gray-600">
                                    Code: {String(item.code || "N/A")} |
                                    Status: {String(item.status || "N/A")} |
                                    Wards: {String(item.wards_count || 0)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium mb-1">No departments found</p>
                              <p className="text-sm text-gray-500">Start by creating your first department</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Wards Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.button
                        onClick={() => fetchModalData("/admin/wards")}
                        className="block w-full p-4 text-left rounded-xl border-0 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 hover:from-green-100 hover:via-emerald-100 hover:to-teal-100 transition-all duration-300 group shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm group-hover:shadow-md transition-all duration-300">
                              <Bed className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">
                                Manage Wards
                              </p>
                              <p className="text-sm text-gray-600">
                                Configure wards, beds & occupancy
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              Quick View
                            </div>
                            <Eye className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 border-0 shadow-2xl">
                      <div className="px-6 py-6 border-b bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 via-emerald-600/90 to-teal-600/90"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                        <DialogHeader className="p-0 relative z-10">
                          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                              <Bed className="h-6 w-6" />
                            </div>
                            Ward Management
                          </DialogTitle>
                          <DialogDescription className="mt-2 text-green-100">
                            View and manage hospital wards and bed allocation
                          </DialogDescription>
                        </DialogHeader>
                      </div>

                      <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100">
                              <BarChart3 className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {modalLoading ? "Loading..." : `${modalData.length} wards found`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Active hospital wards
                              </p>
                            </div>
                          </div>
                          <Link href="/admin/wards">
                            <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-300">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Full Management
                            </Button>
                          </Link>
                        </div>

                        <div className="border-0 rounded-xl shadow-sm bg-white max-h-80 overflow-y-auto">
                          {modalLoading ? (
                            <div className="p-12 text-center">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 mx-auto mb-4 flex items-center justify-center">
                                  <RefreshCw className="h-6 w-6 animate-spin text-white" />
                                </div>
                                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 mx-auto animate-ping opacity-20"></div>
                              </div>
                              <p className="text-gray-600 font-medium">Loading wards...</p>
                              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data</p>
                            </div>
                          ) : modalData.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {modalData.map((item: any, idx: number) => (
                                <motion.div
                                  key={item.id || idx}
                                  className="p-4 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 transition-all duration-200"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-teal-100 mt-0.5">
                                        <Bed className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                          {item.name || "Unknown Ward"}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                          {item.department && (
                                            <span className="px-2 py-1 rounded-md bg-gray-100 text-xs">
                                              {item.department}
                                            </span>
                                          )}
                                          {item.total_beds && (
                                            <span>{item.total_beds} beds</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      {item.occupancy_rate !== undefined && (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${item.occupancy_rate > 80
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : item.occupancy_rate > 60
                                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                              : "bg-green-50 text-green-700 border-green-200"
                                            }`}
                                        >
                                          {item.occupancy_rate}% occupied
                                        </Badge>
                                      )}
                                      {item.status && (
                                        <Badge
                                          variant={item.status === "active" ? "default" : "secondary"}
                                          className={`text-xs ${item.status === "active"
                                            ? "bg-green-100 text-green-800 border-green-200"
                                            : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                          {item.status}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4 flex items-center justify-center">
                                <Bed className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium mb-1">No wards found</p>
                              <p className="text-sm text-gray-500">Start by creating your first ward</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Test Catalog Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.button
                        onClick={() => fetchModalData("/admin/test-catalogs")}
                        className="block w-full p-4 text-left rounded-xl border-0 bg-gradient-to-r from-purple-50 via-indigo-50 to-violet-50 hover:from-purple-100 hover:via-indigo-100 hover:to-violet-100 transition-all duration-300 group shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-sm group-hover:shadow-md transition-all duration-300">
                              <TestTube className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">
                                Test Catalog
                              </p>
                              <p className="text-sm text-gray-600">
                                Manage laboratory tests & pricing
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                              Quick View
                            </div>
                            <Eye className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 border-0 shadow-2xl">
                      <div className="px-6 py-6 border-b bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-violet-600/90"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                        <DialogHeader className="p-0 relative z-10">
                          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                              <TestTube className="h-6 w-6" />
                            </div>
                            Test Catalog Management
                          </DialogTitle>
                          <DialogDescription className="mt-2 text-purple-100">
                            View and manage laboratory test catalog with pricing
                          </DialogDescription>
                        </DialogHeader>
                      </div>

                      <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100">
                              <BarChart3 className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {modalLoading ? "Loading..." : `${modalData.length} tests found`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Available laboratory tests
                              </p>
                            </div>
                          </div>
                          <Link href="/admin/test-catalogs">
                            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Full Catalog
                            </Button>
                          </Link>
                        </div>

                        <div className="border-0 rounded-xl shadow-sm bg-white max-h-80 overflow-y-auto">
                          {modalLoading ? (
                            <div className="p-12 text-center">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto mb-4 flex items-center justify-center">
                                  <RefreshCw className="h-6 w-6 animate-spin text-white" />
                                </div>
                                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto animate-ping opacity-20"></div>
                              </div>
                              <p className="text-gray-600 font-medium">Loading tests...</p>
                              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data</p>
                            </div>
                          ) : modalData.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {modalData.map((item: any, idx: number) => (
                                <motion.div
                                  key={item.id || idx}
                                  className="p-4 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 transition-all duration-200"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 mt-0.5">
                                        <TestTube className="h-4 w-4 text-purple-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                          {item.name || "Unknown Test"}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                          {item.code && (
                                            <span className="px-2 py-1 rounded-md bg-gray-100 font-mono text-xs">
                                              {item.code}
                                            </span>
                                          )}
                                          {item.category && (
                                            <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs">
                                              {item.category}
                                            </span>
                                          )}
                                          {item.turnaround_time && (
                                            <span className="text-xs text-gray-500">
                                              TAT: {item.turnaround_time}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right flex flex-col gap-2">
                                      {item.price && (
                                        <div className="font-bold text-purple-600 text-lg">
                                          {formatCurrency(item.price)}
                                        </div>
                                      )}
                                      <div className="flex gap-2">
                                        {item.status && (
                                          <Badge
                                            variant={item.status === "active" ? "default" : "secondary"}
                                            className={`text-xs ${item.status === "active"
                                              ? "bg-green-100 text-green-800 border-green-200"
                                              : "bg-gray-100 text-gray-600"
                                              }`}
                                          >
                                            {item.status}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4 flex items-center justify-center">
                                <TestTube className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium mb-1">No tests found</p>
                              <p className="text-sm text-gray-500">Start by adding your first test</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Drug Formulary Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.button
                        onClick={() => fetchModalData("/admin/drug-formulary")}
                        className="block w-full p-4 text-left rounded-xl border-0 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 hover:from-orange-100 hover:via-amber-100 hover:to-yellow-100 transition-all duration-300 group shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm group-hover:shadow-md transition-all duration-300">
                              <Pill className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Drug Formulary</p>
                              <p className="text-sm text-gray-600">Manage medications & inventory</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                              Quick View
                            </div>
                            <Eye className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    </DialogTrigger>

                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 border-0 shadow-2xl">
                      <div className="px-6 py-6 border-b bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 via-amber-600/90 to-yellow-600/90"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                        <DialogHeader className="p-0 relative z-10">
                          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                              <Pill className="h-6 w-6" />
                            </div>
                            Drug Formulary Management
                          </DialogTitle>
                          <DialogDescription className="mt-2 text-orange-100">
                            View and manage hospital drug formulary and medication inventory
                          </DialogDescription>
                        </DialogHeader>
                      </div>

                      <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100">
                              <BarChart3 className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {modalLoading ? "Loading..." : `${modalData.length} drugs found`}
                              </p>
                              <p className="text-sm text-gray-500">Active drug formulary</p>
                            </div>
                          </div>
                          <Link href="/admin/drug-formulary">
                            <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md hover:shadow-lg transition-all duration-300">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Full Management
                            </Button>
                          </Link>
                        </div>

                        <div className="border-0 rounded-xl shadow-sm bg-white max-h-80 overflow-y-auto">
                          {modalLoading ? (
                            <div className="p-12 text-center">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 mx-auto mb-4 flex items-center justify-center">
                                  <RefreshCw className="h-6 w-6 animate-spin text-white" />
                                </div>
                                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 mx-auto animate-ping opacity-20"></div>
                              </div>
                              <p className="text-gray-600 font-medium">Loading drugs...</p>
                              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data</p>
                            </div>
                          ) : modalData.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {modalData.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="p-4 border-b">
                                  <div className="font-semibold">{String(item.name || "Unknown Drug")}</div>
                                  <div className="text-sm text-gray-600">
                                    Generic: {String(item.generic_name || "N/A")} |
                                    Form: {String(item.form || "N/A")} |
                                    Stock: {String(item.stock_quantity || 0)} |
                                    Status: {String(item.status || "N/A")}
                                  </div>
                                  {item.unit_price && (
                                    <div className="text-sm font-medium text-orange-600">
                                      ${String(item.unit_price)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4 flex items-center justify-center">
                                <Pill className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium mb-1">No drugs found</p>
                              <p className="text-sm text-gray-500">Start by adding your first drug to the formulary</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Coming Soon Items */}

                  {/* Reports & Analytics Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.button
                        onClick={() => fetchModalData("/admin/reports")}
                        className="block w-full p-4 text-left rounded-xl border-0 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 hover:from-indigo-100 hover:via-blue-100 hover:to-cyan-100 transition-all duration-300 group shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm group-hover:shadow-md transition-all duration-300">
                              <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Reports & Analytics</p>
                              <p className="text-sm text-gray-600">View system reports & insights</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                              Quick View
                            </div>
                            <Eye className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    </DialogTrigger>

                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 border-0 shadow-2xl">
                      <div className="px-6 py-6 border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-cyan-600/90"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                        <DialogHeader className="p-0 relative z-10">
                          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                              <BarChart3 className="h-6 w-6" />
                            </div>
                            Reports & Analytics
                          </DialogTitle>
                          <DialogDescription className="mt-2 text-indigo-100">
                            Access system reports and analytical insights
                          </DialogDescription>
                        </DialogHeader>
                      </div>

                      <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100">
                              <BarChart3 className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {modalLoading ? "Loading..." : `${modalData.length} reports available`}
                              </p>
                              <p className="text-sm text-gray-500">System analytics and insights</p>
                            </div>
                          </div>
                          <Link href="/admin/reports">
                            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Full Reports
                            </Button>
                          </Link>
                        </div>

                        <div className="border-0 rounded-xl shadow-sm bg-white max-h-80 overflow-y-auto">
                          {modalLoading ? (
                            <div className="p-12 text-center">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto mb-4 flex items-center justify-center">
                                  <RefreshCw className="h-6 w-6 animate-spin text-white" />
                                </div>
                                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto animate-ping opacity-20"></div>
                              </div>
                              <p className="text-gray-600 font-medium">Loading reports...</p>
                              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data</p>
                            </div>
                          ) : modalData.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {modalData.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="p-4 border-b">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-semibold text-gray-900">{String(item.name || "Unknown Report")}</div>
                                      <div className="text-sm text-gray-600 mt-1">{String(item.description || "No description")}</div>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span>Type: {String(item.type || "N/A")}</span>
                                        <span>Records: {String(item.records_count || 0)}</span>
                                        {item.last_generated && (
                                          <span>Last: {new Date(item.last_generated).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'available'
                                        ? 'bg-green-100 text-green-700'
                                        : item.status === 'generating'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {String(item.status || 'unknown')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4 flex items-center justify-center">
                                <BarChart3 className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium mb-1">No reports found</p>
                              <p className="text-sm text-gray-500">Reports will be available once data is generated</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ======= Footer Info ======= */}
        <div className="pt-4 text-center text-sm text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      </div>
    </AdminLayout>
  );
}
