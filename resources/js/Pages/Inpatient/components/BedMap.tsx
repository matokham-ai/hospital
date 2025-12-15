import React, { useMemo } from "react";
import {
  BedDouble,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Sparkles,
  User,
} from "lucide-react";
import { PatientSummary } from "./PatientQuickView";

export type BedStatus =
  | "available"
  | "occupied"
  | "critical"
  | "isolation"
  | "cleaning"
  | "maintenance";

export interface Bed {
  id: string;
  number: string;
  status: BedStatus;
  patient?: PatientSummary | null;
}

export interface Ward {
  id: string;
  name: string;
  beds: Bed[];
  totalBeds?: number;
}

interface Props {
  wards?: Ward[];
  onBedClick?: (patient: PatientSummary) => void;
  onViewFullProfile?: (patient: PatientSummary) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  sampleMode?: boolean;
  maxBedsPerWard?: number;
  accurateStats?: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    cleaning: number;
  };
}

/** Status color tokens */
const STATUS_STYLES: Record<
  BedStatus,
  { bg: string; ring: string; dot: string; label: string; icon: React.ReactNode }
> = {
  available: {
    bg: "bg-green-50",
    ring: "ring-green-200",
    dot: "bg-green-500",
    label: "Available",
    icon: <Sparkles className="w-4 h-4" />,
  },
  occupied: {
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    label: "Occupied",
    icon: <User className="w-4 h-4" />,
  },
  critical: {
    bg: "bg-red-50",
    ring: "ring-red-200",
    dot: "bg-red-500",
    label: "Critical",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  isolation: {
    bg: "bg-yellow-50",
    ring: "ring-yellow-200",
    dot: "bg-yellow-500",
    label: "Isolation",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  cleaning: {
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    label: "Cleaning",
    icon: <Sparkles className="w-4 h-4" />,
  },
  maintenance: {
    bg: "bg-gray-100",
    ring: "ring-gray-200",
    dot: "bg-gray-500",
    label: "Maintenance",
    icon: <Wrench className="w-4 h-4" />,
  },
};

export default function BedMap({
  wards,
  onBedClick,
  onViewFullProfile,
  lastUpdated,
  isLoading,
  sampleMode = false,
  maxBedsPerWard = 4,
  accurateStats,
}: Props) {
  const data = useMemo<Ward[]>(() => {
    if (wards && wards.length) {
      return wards.map((ward: any) => {
        const bedsToShow = sampleMode
          ? ward.beds.slice(0, maxBedsPerWard)
          : ward.beds;

        return {
          id: ward.id,
          name: ward.name,
          totalBeds: ward.beds.length,
          beds: bedsToShow.map((bed: any) => {
            let patient: PatientSummary | null = null;

            if (bed.patient) {
              let bedStatus: BedStatus = "occupied";
              const status = bed.patient.status?.toLowerCase();
              if (status === "critical" || status === "unstable")
                bedStatus = "critical";
              else if (
                status === "isolation" ||
                bed.patient.diagnosis?.toLowerCase().includes("isolation")
              )
                bedStatus = "isolation";

              patient = {
                id: bed.patient.id,
                name: bed.patient.name,
                bedNumber: bed.number,
                ward: ward.name,
                age: bed.patient.age || 0,
                gender: bed.patient.gender || "O",
                diagnosis: bed.patient.diagnosis || "Not specified",
                status: bed.patient.status || "stable",
                vitals: bed.patient.vitals,
                medsDue: bed.patient.medsDue || [],
                allergies: [],
                notes: `Admitted on ${bed.patient.admissionDate || "N/A"}.`,
              };

              return {
                id: bed.id.toString(),
                number: bed.number,
                status: bedStatus,
                patient,
              };
            }

            return {
              id: bed.id.toString(),
              number: bed.number,
              status: bed.status as BedStatus,
              patient: null,
            };
          }),
        };
      });
    }
    return [];
  }, [wards, sampleMode, maxBedsPerWard]);

  const counts = useMemo(() => {
    // Use accurate statistics if provided, otherwise calculate from data
    if (accurateStats) {
      return {
        available: accurateStats.available,
        occupied: accurateStats.occupied,
        critical: 0, // Not tracked in your SQL queries
        isolation: 0, // Not tracked in your SQL queries
        cleaning: accurateStats.cleaning || 0,
        maintenance: accurateStats.maintenance || 0,
      };
    }
    
    // Fallback to calculating from individual bed data
    const c: Record<BedStatus, number> = {
      available: 0,
      occupied: 0,
      critical: 0,
      isolation: 0,
      cleaning: 0,
      maintenance: 0,
    };
    data.forEach((w) => w.beds.forEach((b) => (c[b.status] += 1)));
    return c;
  }, [data, accurateStats]);

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_STYLES) as BedStatus[]).map((key) => {
            const s = STATUS_STYLES[key];
            return (
              <div
                key={key}
                className="flex items-center gap-2 px-2.5 py-1 bg-white border border-gray-200 rounded-full shadow-sm text-[11px]"
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="text-gray-700">{s.label}</span>
                <span className="text-gray-400">({counts[key] ?? 0})</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {sampleMode && (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              <BedDouble className="w-3 h-3" />
              <span>
                Sample View ({data.reduce((t, w) => t + w.beds.length, 0)} beds)
              </span>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <div className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full"></div>
              <span>Updating...</span>
            </div>
          ) : lastUpdated ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live • {new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
          ) : accurateStats ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Database Stats</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>No Data</span>
            </div>
          )}
        </div>
      </div>

      {/* Wards */}
      <div className="space-y-6">
        {data.map((ward) => (
          <div key={ward.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {ward.name}
              </div>
              {sampleMode && ward.totalBeds! > maxBedsPerWard && (
                <div className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  +{ward.totalBeds! - maxBedsPerWard} more
                </div>
              )}
            </div>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                md:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
                2xl:grid-cols-6
                gap-x-5 gap-y-4
                w-full
                overflow-x-hidden
                place-items-stretch
                px-1
              "
            >

              {ward.beds.map((bed) => {
                const s = STATUS_STYLES[bed.status];
                return (
                  <button
                    key={bed.id}
                    onClick={() => bed.patient && onBedClick?.(bed.patient)}
                    disabled={!bed.patient}
                    title={
                      bed.patient
                        ? `View ${bed.patient.name}'s summary`
                        : "Empty bed"
                    }
                    className={`group relative rounded-lg p-3 ${s.bg} ring-1 ${s.ring}
                      hover:ring-2 hover:ring-primary-300 transition-all
                      text-left focus:outline-none focus:ring-2 focus:ring-primary-400
                      break-words min-h-[100px] sm:min-h-[110px] md:min-h-[120px]
                      ${bed.patient ? "cursor-pointer" : "cursor-default"}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-gray-600 opacity-80" />
                        <span className="text-[12px] sm:text-[13px] font-semibold text-gray-800">
                          {bed.number}
                        </span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    </div>

                    <div className="mt-1.5">
                      {bed.patient ? (
                        <>
                          <div className="text-[12px] text-gray-700 font-medium truncate">
                            {bed.patient.name}
                          </div>
                          {bed.patient.diagnosis && (
                            <div className="text-[11px] text-gray-500 truncate">
                              {bed.patient.diagnosis}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[11px] text-gray-400 italic">
                          Empty
                        </div>
                      )}
                    </div>

                    {bed.patient && (
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewFullProfile?.(bed.patient!);
                          }}
                          className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded hover:bg-blue-700"
                        >
                          Profile
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
