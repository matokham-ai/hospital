import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, BedDouble, UserCheck, RefreshCw, Info, Clock, ShieldCheck } from "lucide-react";
import axios from "axios";

import BedMap from "./components/BedMap";
import PatientCard from "./components/PatientCard";
import AlertsFeed from "./components/AlertsFeed";
import ShiftToggle from "./components/ShiftToggle";
import PatientQuickView, { PatientSummary } from "./components/PatientQuickView";
import PatientProfile, { PatientProfileData } from "./components/PatientProfile";
import BedOccupancyModal from "./components/BedOccupancyModal";
import { generateSamplePatientData } from "./utils/samplePatientData";
import AlertDetailsModal from "./components/AlertDetailsModal";

/* ---------------------------------- Types --------------------------------- */
interface DashboardStats {
  totalAdmitted: number;
  criticalPatients: number;
  dischargesToday: number;
  bedsAvailable: number;
}

interface Patient {
  id: number;
  name: string;
  bedNumber: string;
  ward: string;
  status: "stable" | "critical" | "review";
  admissionDate: string;
  diagnosis?: string;
  age?: number;
  gender?: string;
}

interface Props {
  stats: DashboardStats;
  recentPatients: Patient[];
  alerts: any[];
  auth?: {
    user: {
      name: string;
      email: string;
      role: string;
    };
  };
}

/* ------------------------------ Motion presets ----------------------------- */
const fadeUp: any = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" },
};

const popIn: any = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.35, ease: "easeOut" },
};

export default function InpatientDashboard({
  stats,
  recentPatients,
  alerts,
  auth,
}: Props) {
  /* ------------------------------ Local state ------------------------------ */
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfileData | null>(null);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // Bed occupancy modal state
  const [bedOccupancyModalOpen, setBedOccupancyModalOpen] = useState(false);

  // Real-time bed data state
  const [bedData, setBedData] = useState<any>(null);
  const [bedDataLoading, setBedDataLoading] = useState(true);
  const [bedDataError, setBedDataError] = useState<string | null>(null);

  /* ------------------------------- Handlers -------------------------------- */
  const handleAlertClick = (alert: any) => {
    setSelectedAlert(alert);
    setAlertModalOpen(true);
  };

  const handleBedClick = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setQuickViewOpen(true);
  };

  const handlePatientCardClick = async (patient: Patient) => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
      const response = await axios.get(`/inpatient/api/patient-details/${patient.id}`, {
        headers: {
          "X-CSRF-TOKEN": token,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const patientData = response.data;

      const patientSummary: PatientSummary = {
        id: patientData.id,
        name: patientData.name,
        bedNumber: patientData.bedNumber,
        ward: patientData.ward,
        age: patientData.age,
        gender: patientData.gender as "M" | "F" | "O",
        diagnosis: patientData.diagnosis,
        status: patientData.status,
        vitals: patientData.vitals,
        medsDue: patientData.medsDue,
        allergies: patientData.allergies,
        notes: patientData.notes,
      };

      setSelectedPatient(patientSummary);
      setQuickViewOpen(true);
    } catch (error: any) {
      console.error("Error fetching patient details:", error);

      // Fallback to basic patient data if API fails
      const patientSummary: PatientSummary = {
        id: patient.id,
        name: patient.name,
        bedNumber: patient.bedNumber,
        ward: patient.ward,
        age: patient.age || 0,
        gender: ((patient.gender as "M" | "F" | "O") || "O") as "M" | "F" | "O",
        diagnosis: patient.diagnosis || "General admission",
        status: patient.status as any,
        vitals: {
          hr: patient.status === "critical" ? 115 : 75,
          bp: patient.status === "critical" ? "90/60" : "120/80",
          temp: patient.status === "critical" ? 38.5 : 36.8,
          spo2: patient.status === "critical" ? 90 : 98,
        },
        medsDue:
          patient.status === "critical"
            ? [{ name: "Critical care medications", time: "STAT" }]
            : [{ name: "Routine medications", time: "08:00" }],
        allergies: [],
        notes: `Admitted on ${patient.admissionDate}. Status: ${patient.status}.`,
      };

      setSelectedPatient(patientSummary);
      setQuickViewOpen(true);
    }
  };

  const fetchBedData = async () => {
    setBedDataLoading(true);
    setBedDataError(null);
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
      const response = await axios.get("/inpatient/api/bed-occupancy", {
        headers: {
          "X-CSRF-TOKEN": token,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      setBedData(response.data);
    } catch (error: any) {
      console.error("Error fetching bed data:", error);
      setBedDataError(error?.response?.data?.message || error?.message || "Failed to load bed data");
    } finally {
      setBedDataLoading(false);
    }
  };

  const handleViewFullProfile = async (patient: Patient) => {
    try {
      const res = await fetch(`/inpatient/patients/${patient.id}`, { headers: { Accept: "application/json" } });
      const data = await res.json();
      setSelectedPatientProfile(data);
      setProfileViewOpen(true);
    } catch {
      // keep your current graceful fallback
      const profile = generateSamplePatientData(patient.id, patient.name, patient.bedNumber, patient.ward);
      setSelectedPatientProfile(profile);
      setProfileViewOpen(true);
    }
  };

  /* -------------------------------- Effects -------------------------------- */
  useEffect(() => {
    fetchBedData();
    const interval = setInterval(fetchBedData, 30000);
    return () => clearInterval(interval);
  }, []);

  /* --------------------------------- Render -------------------------------- */
  return (
    <HMSLayout>
      <Head title="Inpatient Dashboard" />

      {/* Premium Hero (sticky) */}
      <div className="sticky top-0 z-20 border-b border-white/10 dark:border-slate-800/60 backdrop-blur-md">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden bg-ocean-gradient text-white"
          aria-label="Inpatient Dashboard Header"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(600px_200px_at_10%_-10%,rgba(255,255,255,0.25),transparent_60%),radial-gradient(400px_120px_at_90%_-10%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Inpatient Dashboard
              </h1>
              <p className="text-white/90 text-sm md:text-base">
                Welcome back, <span className="font-semibold">{auth?.user?.name || "Clinician"}</span>. Real-time ward activity & patient status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-3 text-white/90">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Auto refresh 30s</span>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm">Night-mode ready</span>
                </div>
              </div>
              <ShiftToggle />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <main className="bg-gray-50 dark:bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Stats */}
          <motion.section {...fadeUp}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<BedDouble className="w-6 h-6" aria-hidden />}
                label="Total Admitted"
                value={stats?.totalAdmitted ?? 0}
                gradient="from-primary-500 to-brand-500"
              />
              <StatCard
                icon={<AlertTriangle className="w-6 h-6" aria-hidden />}
                label="Critical Patients"
                value={stats?.criticalPatients ?? 0}
                gradient="from-danger-500 to-warning-500"
              />
              <StatCard
                icon={<UserCheck className="w-6 h-6" aria-hidden />}
                label="Discharges Today"
                value={stats?.dischargesToday ?? 0}
                gradient="from-success-600 to-success-500"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" aria-hidden />}
                label="Beds Available"
                value={stats?.bedsAvailable ?? 0}
                gradient="from-indigo-600 to-purple-500"
              />
            </div>
          </motion.section>

          {/* Bed map + Alerts */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bed Map */}
            <motion.div {...popIn} className="lg:col-span-2">
              <CardContainer
                title="Live Bed Map"
                subtitle="Sample beds overview - Click 'View Full Map' for complete view"
                action={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBedOccupancyModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm transition"
                    >
                      <BedDouble className="w-4 h-4" />
                      View Full Map
                    </button>
                    <button
                      onClick={fetchBedData}
                      disabled={bedDataLoading}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition"
                      aria-label="Refresh bed data"
                      title="Refresh bed data"
                    >
                      <RefreshCw className={`w-4 h-4 ${bedDataLoading ? "animate-spin" : ""}`} />
                      <span className="text-sm">Refresh</span>
                    </button>
                  </div>
                }
              >
                {/* Legend */}
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
                  <LegendDot className="bg-success-500" label="Stable" />
                  <LegendDot className="bg-warning-500" label="Review" />
                  <LegendDot className="bg-danger-500" label="Critical" />
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Info className="w-4 h-4" />
                    <span>Hover to preview; click to open Quick View</span>
                  </div>
                </div>

                {/* Body */}
                {bedDataLoading ? (
                  <SkeletonBedMap />
                ) : bedDataError ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="text-danger-500 text-4xl mb-2">⚠️</div>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{bedDataError}</p>
                      <button
                        onClick={fetchBedData}
                        className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                    <BedMap
                      wards={bedData?.wards}
                      lastUpdated={bedData?.lastUpdated}
                      isLoading={bedDataLoading}
                      sampleMode={true}
                      maxBedsPerWard={4}
                      onBedClick={handleBedClick}
                      onViewFullProfile={(patient) => {
                        const pp = generateSamplePatientData(
                          patient.id as number,
                          patient.name,
                          patient.bedNumber,
                          patient.ward
                        );
                        setSelectedPatientProfile(pp);
                        setProfileViewOpen(true);
                      }}
                    />
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Alerts */}
            <motion.div {...popIn}>
              <CardContainer title="Recent Alerts" subtitle="Escalated by severity" tone="alert">
                <div className="space-y-3">
                  <AlertsFeed alerts={alerts || []} onAlertClick={handleAlertClick} />
                </div>
              </CardContainer>
            </motion.div>
          </section>

          {/* Recent Admissions */}
          <motion.section {...fadeUp}>
            <CardContainer title="Recent Admissions" subtitle="Latest patients admitted across wards">
              {(!recentPatients || recentPatients.length === 0) ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      onViewProfile={handleViewFullProfile}
                      onViewVitals={handlePatientCardClick}
                    />
                  ))}
                </div>
              )}
            </CardContainer>
          </motion.section>
        </div>
      </main>

      {/* Modals (unchanged APIs) */}
      <PatientQuickView open={quickViewOpen} onClose={() => setQuickViewOpen(false)} patient={selectedPatient} />

      <PatientProfile open={profileViewOpen} onClose={() => setProfileViewOpen(false)} patient={selectedPatientProfile} />

      <AlertDetailsModal open={alertModalOpen} onClose={() => setAlertModalOpen(false)} alert={selectedAlert} />

      <BedOccupancyModal isOpen={bedOccupancyModalOpen} onClose={() => setBedOccupancyModalOpen(false)} />
    </HMSLayout>
  );
}

/* ============================== Subcomponents ============================== */

function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gradient: string; // e.g. "from-primary-500 to-brand-500"
}) {
  return (
    <motion.div
      {...popIn}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card-light dark:shadow-card-dark"
      role="region"
      aria-label={`${label} card`}
    >
      <div className={`absolute -top-8 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-30 transition`} />
      <div className="p-5">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-md mb-3 bg-gradient-to-br ${gradient}`}>
          {icon}
        </div>
        <div className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 leading-tight">{value}</div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">{label}</div>
      </div>
    </motion.div>
  );
}

function CardContainer({
  title,
  subtitle,
  children,
  scrollable = false,
  action,
  tone,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  action?: React.ReactNode;
  tone?: "alert" | "neutral";
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900
      ${tone === "alert" ? "border-danger-100 dark:border-danger-900/60" : "border-gray-100 dark:border-slate-800"}
      shadow-card-light dark:shadow-card-dark`}
    >
      <div className="px-6 py-4 flex items-start justify-between border-b border-gray-100/80 dark:border-slate-800/80">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className={`p-6 ${scrollable ? "max-h-[350px] overflow-y-auto" : ""}`}>{children}</div>
    </section>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${className}`} />
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
    </div>
  );
}

function SkeletonBedMap() {
  return (
    <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <UserCheck className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-700 dark:text-gray-200 font-medium">No recent admissions</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">Admitted patients will appear here.</p>
    </div>
  );
}
