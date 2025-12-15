import { Head, Link, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Users, Search, Eye, Stethoscope, Building2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface Patient {
  id: number | string;
  name: string;
  age: number;
  gender: string;
  bed: string;
  ward: string;
  encounter_id: number | null;
  last_vitals: string | null;
  type: "IPD" | "OPD";
  admitted_at: string | null;
}

interface Props {
  patients: Patient[];
  filters: {
    search: string;
    scope: "assigned" | "clinic" | "ward" | "all";
    counts: Record<string, number>;
  };
  meta: {
    title: string;
    subtitle: string;
  };
  currentRoute?: string | null;
}

/* --- (imports unchanged) --- */

/* imports remain the same */

export default function PatientsIndex({ patients, filters, meta, currentRoute }: Props) {
  const [search, setSearch] = useState(filters.search || "");

  const filterLinks = useMemo(() => [
    { key: "assigned", label: "My Patients", count: filters.counts?.assigned ?? patients.length, routeName: "nurse.patients.my", icon: Users },
    { key: "clinic", label: "Clinic", count: filters.counts?.clinic ?? 0, routeName: "nurse.patients.clinic", icon: Stethoscope },
    { key: "ward", label: "Ward", count: filters.counts?.ward ?? 0, routeName: "nurse.patients.ward", icon: Building2 },
    { key: "all", label: "All Patients", count: filters.counts?.all ?? patients.length, routeName: "nurse.patients.all", icon: Users },
  ], [filters.counts, patients.length]);

  const handleSearch = (value: string) => {
    setSearch(value);
    router.get(route(currentRoute ?? "nurse.patients"), { search: value }, {
      preserveState: true,
      replace: true,
    });
  };

  const emptyStateLabel = {
    clinic: "No clinic patients found",
    ward: "No ward patients found",
    all: "No active patients found",
    assigned: "No assigned patients",
  }[filters.scope];

  return (
    <HMSLayout>
      <Head title={`${meta.title ?? "Patients"} - Nurse Dashboard`} />

      {/* 🎨 PREMIUM MEDICARE PRO BACKGROUND - Soft pastel gradient */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
        <div className="space-y-6 pb-10 px-6 pt-6">

          {/* ---------------- PREMIUM HEADER WITH SOFT SHADOW ---------------- */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {meta.title}
                </h1>
                <p className="text-sm text-slate-600 mt-1">{meta.subtitle}</p>
              </div>

              {/* PREMIUM SEARCH BOX */}
              <div className="relative w-full max-w-xs sm:max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search patients..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-11 rounded-xl bg-white/90 shadow-md shadow-blue-100/50 border-blue-100 focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300 h-11"
                />
              </div>
            </div>
          </div>

          {/* ---------------- LOVABLE FILTER PILLS WITH PASTEL COLORS ---------------- */}
          <div className="flex flex-wrap gap-3">
            {filterLinks.map((option) => {
              const Icon = option.icon;
              const isActive = filters.scope === option.key;

              return (
                <button
                  key={option.key}
                  onClick={() => router.get(route(option.routeName), { search }, { preserveState: true, replace: true })}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    "border backdrop-blur-sm",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-blue-200/50 scale-105"
                      : "bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-md shadow-slate-100/50 hover:shadow-lg hover:scale-105"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                  <span className={cn(
                    "ml-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                  )}>
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---------------- PREMIUM PATIENT CARDS WITH SOFT SHADOWS ---------------- */}
          <div className="bg-white/60 backdrop-blur-sm border border-white rounded-2xl shadow-xl shadow-blue-100/50 p-6">

            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-200/50">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Active Patients <span className="text-blue-600">({patients.length})</span>
              </h2>
            </div>

            {/* PREMIUM GRID WITH LOVABLE CARDS */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="group rounded-2xl bg-gradient-to-br from-white to-blue-50/30 shadow-lg shadow-blue-100/50 border border-white p-6 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    {/* PREMIUM AVATAR WITH GRADIENT */}
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-7 w-7 text-white" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3>
                      <p className="text-sm text-slate-600 font-medium">
                        {patient.age}y • {patient.gender}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {patient.type === "IPD" ? (
                          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 font-semibold flex items-center gap-1.5 shadow-sm">
                            <Building2 className="h-3.5 w-3.5" /> {patient.ward} • Bed {patient.bed}
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5 shadow-sm">
                            <Stethoscope className="h-3.5 w-3.5" /> Clinic / OPD
                          </span>
                        )}

                        {patient.last_vitals && (
                          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-medium shadow-sm">
                            Vitals: {new Date(patient.last_vitals).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM ACTION BUTTONS */}
                  <div className="mt-5 flex gap-3">
                    <Button
                      onClick={() => router.visit(`/nurse/patients/${patient.id}`)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 transition-all duration-200"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </Button>

                    {patient.encounter_id && (
                      <Button
                        variant="outline"
                        className="rounded-xl border-2 border-blue-200 bg-white/80 hover:bg-blue-50 text-blue-600 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => router.visit(`/nurse/vitals/${patient.encounter_id}`)}
                        size="sm"
                      >
                        Vitals
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ---------------- LOVABLE EMPTY STATE ---------------- */}
            {patients.length === 0 && (
              <div className="py-20 text-center">
                <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Users className="h-10 w-10 text-blue-400" />
                </div>
                <p className="text-slate-600 text-lg font-medium">{emptyStateLabel}</p>

                {filters.scope !== "all" && (
                  <Button 
                    asChild 
                    variant="link" 
                    className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <Link href={route("nurse.patients.all")}>View all patients →</Link>
                  </Button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </HMSLayout>
  );
}