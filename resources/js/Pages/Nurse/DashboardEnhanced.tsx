import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Progress } from "@/Components/ui/progress";
import FacilitySwitcher from "@/Components/Nurse/FacilitySwitcher";
import PatientListSelector from "@/Components/Nurse/PatientListSelector";
import {
  Activity,
  AlertTriangle,
  Bed,
  Calendar,
  ClipboardList,
  Droplet,
  Heart,
  Pill,
  Search,
  Stethoscope,
  Thermometer,
  Timer,
  Users,
  Wind,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

type PatientAcuity = "critical" | "high-risk" | "stable" | "routine";

interface PatientVitals {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  respiratory_rate?: number | null;
  recorded_at?: string;
}

interface PatientBadges {
  labs_pending: number;
  meds_due: number;
  alerts: number;
  new_orders: number;
}

interface PatientCard {
  id: number | string;
  encounter_id: number;
  name: string;
  age: number;
  sex: string;
  bed_number: string;
  ward: string;
  acuity: PatientAcuity;
  vitals: PatientVitals | null;
  badges: PatientBadges;
  next_medication: string;
}

type TaskPriority = "high" | "medium" | "low";

interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  due_time: string;
  overdue: boolean;
  count: number;
  type: string;
}

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
  pendingTasks: number;
}

interface ShiftSummary {
  patients: number;
  pendingMeds: number;
  overdueVitals: number;
  alerts: number;
  tasksDue: number;
  opdAppointments: number;
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
  riskDistribution: {
    critical: number;
    high: number;
    stable: number;
    routine: number;
  };
}

interface UnitOverviewItem {
  id: string;
  name: string;
  type: string;
  patients: number;
  updatedAgo: string;
  occupancy: {
    occupied: number;
    capacity: number;
    percentage: number;
  };
}

interface NurseDashboardProps {
  userName: string;
  userRole: string;
  shift: ShiftInfo;
  kpis: KPIs;
  shiftSummary: ShiftSummary;
  analytics: Analytics;
  unitOverview: UnitOverviewItem[];
  patients: PatientCard[];
  tasks: TaskItem[];
}

const acuityConfig: Record<PatientAcuity, { badge: string; ring: string }> = {
  critical: {
    badge: "bg-red-500",
    ring: "border-red-200 hover:border-red-300",
  },
  "high-risk": {
    badge: "bg-amber-500",
    ring: "border-amber-200 hover:border-amber-300",
  },
  stable: {
    badge: "bg-emerald-500",
    ring: "border-emerald-200 hover:border-emerald-300",
  },
  routine: {
    badge: "bg-slate-500",
    ring: "border-slate-200 hover:border-slate-300",
  },
};

const riskSegments = [
  { key: "critical", label: "Critical", color: "bg-red-500" },
  { key: "high", label: "High Risk", color: "bg-amber-500" },
  { key: "stable", label: "Stable", color: "bg-emerald-500" },
  { key: "routine", label: "Routine", color: "bg-slate-400" },
] as const;

type RiskKey = typeof riskSegments[number]["key"];

type VitalMetric = "bp_systolic" | "heart_rate" | "temperature" | "spo2";

const vitalThresholds: Record<VitalMetric, { min?: number; max?: number }> = {
  bp_systolic: { min: 95, max: 160 },
  heart_rate: { min: 55, max: 110 },
  temperature: { min: 35.5, max: 38 },
  spo2: { min: 94 },
};

const facilityColorMap: Record<string, string> = {
  OPD: "bg-blue-500",
  IPD: "bg-purple-500",
  ICU: "bg-orange-500",
  Emergency: "bg-red-500",
  default: "bg-slate-500",
};

const facilityIconMap: Record<string, typeof Bed> = {
  OPD: Stethoscope,
  IPD: Bed,
  ICU: Heart,
  Emergency: AlertTriangle,
  default: Building2,
};

function getAcuityLabel(acuity: PatientAcuity) {
  switch (acuity) {
    case "critical":
      return "Critical";
    case "high-risk":
      return "High Risk";
    case "stable":
      return "Stable";
    default:
      return "Routine";
  }
}

function isVitalAbnormal(metric: VitalMetric, value?: number | null) {
  if (value === undefined || value === null) {
    return false;
  }

  const range = vitalThresholds[metric];
  if (!range) {
    return false;
  }

  if (range.min !== undefined && value < range.min) {
    return true;
  }

  if (range.max !== undefined && value > range.max) {
    return true;
  }

  return false;
}

function taskTone(priority: TaskPriority, overdue: boolean) {
  if (overdue) {
    return "border-red-200 bg-red-50";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50";
  }

  if (priority === "medium") {
    return "border-blue-200 bg-blue-50";
  }

  return "border-slate-200 bg-white";
}

export default function DashboardEnhanced({
  userName,
  userRole,
  shift,
  kpis,
  shiftSummary,
  analytics,
  unitOverview,
  patients,
  tasks,
}: NurseDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAcuity, setSelectedAcuity] = useState<PatientAcuity | "all">("all");

  const acuityCounts = useMemo(() => {
    return patients.reduce(
      (acc, patient) => {
        acc[patient.acuity] = (acc[patient.acuity] || 0) + 1;
        return acc;
      },
      { critical: 0, "high-risk": 0, stable: 0, routine: 0 } as Record<PatientAcuity, number>
    );
  }, [patients]);

  const facilities = useMemo(() => {
    if (!unitOverview?.length) {
      return undefined;
    }

    return unitOverview.map((unit) => {
      const occupancy = unit.occupancy?.percentage ?? 0;
      const status = occupancy >= 90 ? "Critical" : occupancy >= 75 ? "High Load" : "Normal";
      const trend = occupancy >= 85 ? "up" : occupancy <= 50 ? "down" : "stable";
      const color = facilityColorMap[unit.type] ?? facilityColorMap.default;
      const Icon = facilityIconMap[unit.type] ?? facilityIconMap.default;

      return {
        id: unit.id,
        name: unit.name,
        type: unit.type as "OPD" | "IPD" | "Emergency" | "ICU" | "Maternity" | "OR",
        icon: Icon,
        patientCount: unit.patients,
        capacity: unit.occupancy?.capacity,
        color,
        status,
        trend,
        lastUpdated: unit.updatedAgo,
      };
    });
  }, [unitOverview]);

  const patientLists = useMemo(() => {
    const criticalCount = acuityCounts["critical"];
    const highRiskCount = acuityCounts["high-risk"];
    const ipdUnit = unitOverview.find((unit) => unit.type === "IPD");
    const opdUnit = unitOverview.find((unit) => unit.type === "OPD");

    return [
      {
        id: "my-patients",
        name: "My Patients",
        description: "Assigned this shift",
        icon: Users,
        count: kpis.assignedPatients,
        color: "bg-indigo-500",
        trend: kpis.assignedPatients > 0 ? "up" : "stable",
        updatedAt: "Synced moments ago",
        tags: ["Rounds", "Handover"],
        priority: "important" as const,
      },
      {
        id: "critical",
        name: "Critical Watch",
        description: "High acuity focus",
        icon: Heart,
        count: criticalCount + highRiskCount,
        color: "bg-red-500",
        trend: criticalCount > 0 ? "up" : "stable",
        updatedAt: "Escalation ready",
        tags: ["ICU", "High risk"],
        priority: (criticalCount > 0 ? "critical" : "important") as const,
      },
      {
        id: "ward",
        name: "Ward Census",
        description: "IPD occupancy",
        icon: Bed,
        count: ipdUnit?.patients ?? patients.length,
        color: "bg-purple-500",
        trend: "stable" as const,
        updatedAt: ipdUnit?.updatedAgo ?? "Updated",
        tags: ["IPD"],
        priority: "standard" as const,
      },
      {
        id: "opd",
        name: "Clinic Queue",
        description: "OPD follow-ups",
        icon: Stethoscope,
        count: opdUnit?.patients ?? 0,
        color: "bg-blue-500",
        trend: opdUnit && opdUnit.occupancy.percentage > 70 ? "up" : "stable",
        updatedAt: opdUnit?.updatedAgo ?? "",
        tags: ["OPD"],
        priority: "standard" as const,
      },
    ];
  }, [acuityCounts, kpis.assignedPatients, patients.length, unitOverview]);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return patients.filter((patient) => {
      const matchesAcuity = selectedAcuity === "all" || patient.acuity === selectedAcuity;
      if (!matchesAcuity) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        patient.name,
        patient.bed_number,
        patient.ward,
        patient.next_medication,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [patients, searchQuery, selectedAcuity]);

  const riskDistribution = analytics.riskDistribution ?? { critical: 0, high: 0, stable: 0, routine: 0 };
  const riskTotal = Math.max(
    1,
    (Object.values(riskDistribution) as number[]).reduce((total, value) => total + value, 0)
  );

  const overdueCount = tasks.filter((task) => task.overdue).length;

  const shiftTiles = [
    {
      label: "Patients",
      value: shiftSummary.patients,
      icon: Users,
      tone: "border-slate-200 bg-slate-50",
    },
    {
      label: "Pending Meds",
      value: shiftSummary.pendingMeds,
      icon: Pill,
      tone: "border-purple-200 bg-purple-50 text-purple-700",
    },
    {
      label: "Overdue Vitals",
      value: shiftSummary.overdueVitals,
      icon: Activity,
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Active Alerts",
      value: shiftSummary.alerts,
      icon: AlertTriangle,
      tone: "border-red-200 bg-red-50 text-red-700",
    },
    {
      label: "Tasks Due",
      value: shiftSummary.tasksDue,
      icon: ClipboardList,
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      label: "OPD Visits",
      value: shiftSummary.opdAppointments,
      icon: Calendar,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  ];

  const summaryCards = [
    {
      label: "Assigned Patients",
      value: kpis.assignedPatients,
      caption: "This shift",
      icon: Users,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Medications Given",
      value: kpis.medicationsGiven,
      caption: "Today",
      icon: Pill,
      tone: "bg-purple-50 text-purple-700",
    },
    {
      label: "Vitals Recorded",
      value: kpis.vitalsRecorded,
      caption: "24h cover",
      icon: Activity,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending Actions",
      value: kpis.pendingTasks,
      caption: "Needs follow-up",
      icon: ClipboardList,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  const acuityFilters = [
    {
      id: "all" as const,
      label: "All",
      count: patients.length,
      tone: "border-slate-200",
    },
    {
      id: "critical" as const,
      label: "Critical",
      count: acuityCounts["critical"],
      tone: "border-red-200 bg-red-50 text-red-700",
    },
    {
      id: "high-risk" as const,
      label: "High Risk",
      count: acuityCounts["high-risk"],
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      id: "stable" as const,
      label: "Stable",
      count: acuityCounts["stable"],
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      id: "routine" as const,
      label: "Routine",
      count: acuityCounts["routine"],
      tone: "border-slate-200 bg-slate-50 text-slate-600",
    },
  ];

  return (
    <HMSLayout>
      <Head title="Nurse Command Center" />
      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <span>{userRole}</span>
              <span className="text-slate-400">•</span>
              <span>{shift.label}</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Welcome back, {userName}</h1>
              <p className="text-sm text-slate-500">Command center overview of your current shift.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Elapsed {shift.elapsed} • Remaining {shift.remaining}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <span>{analytics.shiftCompletion}% shift completion</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FacilitySwitcher
              currentFacility={facilities?.[0]?.id}
              facilities={facilities}
            />
            <PatientListSelector
              currentList="my-patients"
              lists={patientLists}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.caption}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{card.label}</p>
                  </div>
                  <div className={cn("rounded-2xl p-3", card.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg font-semibold">
                  <span>Shift Snapshot</span>
                  <span className="text-sm font-medium text-slate-700">{analytics.shiftCompletion}% done</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {shiftTiles.map((tile) => {
                    const Icon = tile.icon;
                    return (
                      <div
                        key={tile.label}
                        className={cn(
                          "flex flex-col gap-2 rounded-xl border px-4 py-3",
                          tile.tone
                        )}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Icon className="h-4 w-4" />
                          <span>{tile.label}</span>
                        </div>
                        <span className="text-2xl font-semibold">{tile.value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900">Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Patients / Nurse</p>
                      <p className="text-2xl font-semibold text-slate-900">{analytics.patientsPerNurse}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      Staffing balanced
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Shift Completion</span>
                      <span className="font-semibold text-slate-700">{analytics.shiftCompletion}%</span>
                    </div>
                    <Progress value={analytics.shiftCompletion} className="mt-2 h-2 bg-slate-200" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">Pending Orders</p>
                    <p className="text-xs text-slate-500">{analytics.pendingOrders.total} total</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-center text-blue-700">
                        <p className="text-lg font-semibold">{analytics.pendingOrders.labs}</p>
                        <span>Lab</span>
                      </div>
                      <div className="rounded-lg bg-purple-50 px-3 py-2 text-center text-purple-700">
                        <p className="text-lg font-semibold">{analytics.pendingOrders.imaging}</p>
                        <span>Imaging</span>
                      </div>
                      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-emerald-700">
                        <p className="text-lg font-semibold">{analytics.pendingOrders.medications}</p>
                        <span>Meds</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Bed Occupancy</span>
                      <span className="font-semibold text-slate-700">
                        {analytics.bedOccupancy.occupied}/{analytics.bedOccupancy.total} beds ({analytics.bedOccupancy.percentage}%)
                      </span>
                    </div>
                    <Progress value={analytics.bedOccupancy.percentage} className="mt-2 h-2 bg-slate-200" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">Risk Distribution</p>
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                      {riskSegments.map((segment) => {
                        const value = riskDistribution[segment.key as RiskKey] || 0;
                        if (value <= 0) {
                          return null;
                        }
                        const width = (value / riskTotal) * 100;
                        return (
                          <span
                            key={segment.key}
                            className={cn(segment.color, "h-full")}
                            style={{ width: `${width}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      {riskSegments.map((segment) => (
                        <div key={segment.key} className="flex items-center gap-2">
                          <span className={cn(segment.color, "inline-block h-2.5 w-2.5 rounded-full")}></span>
                          <span className="font-medium text-slate-600">
                            {segment.label}: {riskDistribution[segment.key as RiskKey] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900">Active Unit Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {unitOverview.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-xl border border-slate-200 px-4 py-3 hover:border-[hsl(var(--primary))]/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{unit.name}</p>
                          <p className="text-xs text-slate-500">{unit.updatedAgo}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                          {unit.type}
                        </Badge>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Patients</span>
                          <span className="font-semibold text-slate-700">{unit.patients}</span>
                        </div>
                        <Progress value={unit.occupancy.percentage} className="mt-2 h-2 bg-slate-200" />
                        <div className="mt-2 flex items-center justify-between">
                          <span>Bed Occupancy</span>
                          <span className="font-semibold text-slate-700">
                            {unit.occupancy.occupied}/{unit.occupancy.capacity} beds ({unit.occupancy.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-3 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Patient Roster</p>
                    <h2 className="text-xl font-semibold text-slate-900">My Patients</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl border-slate-200 text-sm"
                      onClick={() => router.visit("/nurse/vitals")}
                    >
                      <Activity className="mr-2 h-4 w-4" /> Record Vitals
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-slate-200 text-sm"
                      onClick={() => router.visit("/nurse/medications")}
                    >
                      <Pill className="mr-2 h-4 w-4" /> Med Round
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by name, bed, or ward"
                      className="h-11 w-full rounded-xl border-slate-200 pl-9 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {acuityFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setSelectedAcuity(filter.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                          filter.tone,
                          selectedAcuity === filter.id && "ring-1 ring-[hsl(var(--primary))]"
                        )}
                      >
                        <span>{filter.label}</span>
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-slate-600">
                          {filter.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredPatients.map((patient) => {
                    const styles = acuityConfig[patient.acuity];
                    return (
                      <Card
                        key={patient.id}
                        className={cn(
                          "group cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
                          styles.ring
                        )}
                        onClick={() => router.visit(`/nurse/patients/${patient.id}`)}
                      >
                        <CardContent className="space-y-4 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{patient.name}</h3>
                              <p className="text-sm text-slate-500">
                                {patient.age} yrs • {patient.sex} • Bed {patient.bed_number}
                              </p>
                              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                                <Stethoscope className="h-3.5 w-3.5" /> {patient.ward || "General"}
                              </div>
                            </div>
                            <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold text-white", styles.badge)}>
                              {getAcuityLabel(patient.acuity)}
                            </Badge>
                          </div>

                          {patient.vitals ? (
                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                              <div className={cn("flex items-center gap-2", isVitalAbnormal("bp_systolic", patient.vitals.bp_systolic) && "text-red-600 font-semibold")}>
                                <Heart className="h-3.5 w-3.5" />
                                <span>{patient.vitals.bp_systolic}/{patient.vitals.bp_diastolic} mmHg</span>
                              </div>
                              <div className={cn("flex items-center gap-2", isVitalAbnormal("heart_rate", patient.vitals.heart_rate) && "text-red-600 font-semibold")}>
                                <Activity className="h-3.5 w-3.5" />
                                <span>{patient.vitals.heart_rate} bpm</span>
                              </div>
                              <div className={cn("flex items-center gap-2", isVitalAbnormal("temperature", patient.vitals.temperature) && "text-red-600 font-semibold")}>
                                <Thermometer className="h-3.5 w-3.5" />
                                <span>{patient.vitals.temperature}°C</span>
                              </div>
                              <div className={cn("flex items-center gap-2", isVitalAbnormal("spo2", patient.vitals.spo2) && "text-red-600 font-semibold")}>
                                <Wind className="h-3.5 w-3.5" />
                                <span>{patient.vitals.spo2}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Droplet className="h-3.5 w-3.5 text-slate-500" />
                                <span>RR {patient.vitals.respiratory_rate || "N/A"}</span>
                              </div>
                              <p className="text-right text-[11px] text-slate-500">
                                {patient.vitals.recorded_at
                                  ? new Date(patient.vitals.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : ""}
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                              No recent vitals recorded
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {patient.badges.labs_pending > 0 && (
                              <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                                {patient.badges.labs_pending} Labs
                              </Badge>
                            )}
                            {patient.badges.meds_due > 0 && (
                              <Badge variant="outline" className="rounded-full border-purple-200 bg-purple-50 text-purple-700">
                                {patient.badges.meds_due} Meds
                              </Badge>
                            )}
                            {patient.badges.alerts > 0 && (
                              <Badge className="rounded-full bg-red-500 text-white">
                                {patient.badges.alerts} Alerts
                              </Badge>
                            )}
                            {patient.badges.new_orders > 0 && (
                              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                                {patient.badges.new_orders} Orders
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                              Next med: <span className="font-semibold text-slate-700">{patient.next_medication}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 rounded-lg border-slate-200 text-xs font-medium"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  router.visit(`/nurse/vitals/${patient.encounter_id}`);
                                }}
                              >
                                Vitals
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 rounded-lg border-slate-200 text-xs font-medium"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  router.visit(`/nurse/medications/${patient.encounter_id}`);
                                }}
                              >
                                Meds
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 rounded-lg border-slate-200 text-xs font-medium"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  router.visit(`/nurse/patients/${patient.id}`);
                                }}
                              >
                                Notes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredPatients.length === 0 && (
                  <Card className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
                    <Users className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm">No patients match “{searchQuery}”. Adjust filters to see more.</p>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <span>Priority Tasks</span>
                  <Badge variant="destructive" className="rounded-full text-xs">
                    {overdueCount} Overdue
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-3",
                      taskTone(task.priority, task.overdue)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{task.due_time}</span>
                          {task.count > 1 && <span>• {task.count} items</span>}
                          {task.overdue && (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-lg border-slate-200 text-xs font-semibold"
                      onClick={() => router.visit("/nurse/tasks")}
                    >
                      Start
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-slate-200"
                  onClick={() => router.visit("/nurse/tasks")}
                >
                  View All Tasks
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">Shift Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>• Triage alerts auto-escalate when vitals exceed critical thresholds.</p>
                <p>• Ensure medication rounds complete before {shift.end} to maintain compliance.</p>
                <p>• Coordinate with OPD for {shiftSummary.opdAppointments} follow-up patients expected this afternoon.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
