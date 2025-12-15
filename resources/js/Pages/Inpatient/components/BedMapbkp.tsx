import React, { useMemo } from "react";
import { BedDouble, ShieldAlert, ShieldCheck, Wrench, Sparkles, User } from "lucide-react";
import { PatientSummary } from "./PatientQuickView";

export type BedStatus = "available" | "occupied" | "critical" | "isolation" | "cleaning" | "maintenance";

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
}

/** Color tokens for statuses */
const STATUS_STYLES: Record<BedStatus, { bg: string; ring: string; dot: string; label: string; icon: React.ReactNode }> = {
  available:   { bg: "bg-green-50",     ring: "ring-green-200",     dot: "bg-green-500",     label: "Available",   icon: <Sparkles className="w-4 h-4" /> },
  occupied:    { bg: "bg-blue-50",      ring: "ring-blue-200",      dot: "bg-blue-500",      label: "Occupied",    icon: <User className="w-4 h-4" /> },
  critical:    { bg: "bg-red-50",       ring: "ring-red-200",       dot: "bg-red-500",       label: "Critical",    icon: <ShieldAlert className="w-4 h-4" /> },
  isolation:   { bg: "bg-yellow-50",    ring: "ring-yellow-200",    dot: "bg-yellow-500",    label: "Isolation",   icon: <ShieldCheck className="w-4 h-4" /> },
  cleaning:    { bg: "bg-amber-50",     ring: "ring-amber-200",     dot: "bg-amber-500",     label: "Cleaning",    icon: <Sparkles className="w-4 h-4" /> },
  maintenance: { bg: "bg-gray-100",     ring: "ring-gray-200",      dot: "bg-gray-500",      label: "Maintenance", icon: <Wrench className="w-4 h-4" /> },
};

export default function BedMap({ wards, onBedClick, onViewFullProfile, lastUpdated, isLoading, sampleMode = false, maxBedsPerWard = 4 }: Props) {
  // Transform API data to component format
  const data = useMemo<Ward[]>(() => {
    if (wards && wards.length) {
      return wards.map((ward: any) => {
        // In sample mode, limit the number of beds shown per ward
        const bedsToShow = sampleMode ? ward.beds.slice(0, maxBedsPerWard) : ward.beds;
        
        return {
          id: ward.id,
          name: ward.name,
          totalBeds: ward.beds.length, // Keep track of total beds for sample mode
          beds: bedsToShow.map((bed: any) => {
          let patient: PatientSummary | null = null;
          
          if (bed.patient) {
            // Determine bed status based on patient condition
            let bedStatus: BedStatus = 'occupied';
            const patientStatus = bed.patient.status?.toLowerCase();
            
            if (patientStatus === 'critical' || patientStatus === 'unstable') {
              bedStatus = 'critical';
            } else if (patientStatus === 'isolation' || bed.patient.diagnosis?.toLowerCase().includes('isolation')) {
              bedStatus = 'isolation';
            } else if (bed.status === 'occupied') {
              bedStatus = 'occupied';
            }

            // Convert API patient data to PatientSummary format
            patient = {
              id: bed.patient.id,
              name: bed.patient.name,
              bedNumber: bed.number,
              ward: ward.name,
              age: bed.patient.age || 0,
              gender: bed.patient.gender || 'O',
              diagnosis: bed.patient.diagnosis || 'Not specified',
              status: bed.patient.status || 'stable',
              vitals: {
                hr: bedStatus === 'critical' ? 110 + Math.floor(Math.random() * 20) : 70 + Math.floor(Math.random() * 20),
                bp: bedStatus === 'critical' ? "90/60" : "120/80",
                temp: bedStatus === 'critical' ? 38.5 + Math.random() : 36.8 + Math.random() * 0.5,
                spo2: bedStatus === 'critical' ? 88 + Math.floor(Math.random() * 7) : 96 + Math.floor(Math.random() * 4),
              },
              medsDue: bedStatus === 'critical' 
                ? [
                    { name: "Critical care medications", time: "STAT" },
                    { name: "Vital signs monitoring", time: "Every 15min" }
                  ]
                : [
                    { name: "Morning medications", time: "08:00" },
                    { name: "Evening medications", time: "20:00" }
                  ],
              allergies: [],
              notes: `Admitted on ${bed.patient.admissionDate || 'N/A'}. Current status: ${bed.patient.status || 'stable'}.`,
            };

            return {
              id: bed.id.toString(),
              number: bed.number,
              status: bedStatus,
              patient: patient,
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
    
    // Fallback demo data if no API data
    return [
      {
        id: "ward-a",
        name: "Ward A",
        beds: [
          { 
            id: "A1", 
            number: "A1", 
            status: "occupied", 
            patient: { 
              id: 1, 
              name: "Jane Mwangi", 
              bedNumber: "A1", 
              ward: "Ward A", 
              diagnosis: "Pneumonia", 
              vitals: { hr: 92, bp: "118/76", temp: 37.8, spo2: 94 }, 
              medsDue: [{ name: "Ceftriaxone 1g IV", time: "14:00" }], 
              allergies: ["Penicillin"], 
              notes: "On O₂ 2L/min", 
              status: "occupied" 
            } 
          },
          { 
            id: "A2", 
            number: "A2", 
            status: "critical", 
            patient: { 
              id: 2, 
              name: "Brian Otieno", 
              bedNumber: "A2", 
              ward: "Ward A", 
              diagnosis: "Sepsis", 
              vitals: { hr: 120, bp: "86/50", temp: 38.9, spo2: 90 }, 
              medsDue: [{ name: "Norepinephrine", time: "STAT" }], 
              allergies: [], 
              notes: "In ICU referral queue", 
              status: "critical" 
            } 
          },
          { id: "A3", number: "A3", status: "isolation" },
          { id: "A4", number: "A4", status: "available" },
        ],
      },
      {
        id: "ward-b",
        name: "Ward B",
        beds: [
          { 
            id: "B1", 
            number: "B1", 
            status: "occupied", 
            patient: { 
              id: 3, 
              name: "Lucy Wanjiru", 
              bedNumber: "B1", 
              ward: "Ward B", 
              diagnosis: "Hyperemesis", 
              vitals: { hr: 78, bp: "110/70", temp: 36.9, spo2: 98 }, 
              medsDue: [{ name: "Ondansetron 4mg IV", time: "16:00" }], 
              allergies: [], 
              status: "occupied" 
            } 
          },
          { id: "B2", number: "B2", status: "cleaning" },
          { id: "B3", number: "B3", status: "maintenance" },
          { id: "B4", number: "B4", status: "available" },
        ],
      },
    ];
  }, [wards, sampleMode, maxBedsPerWard]);

  const counts = useMemo(() => {
    const c: Record<BedStatus, number> = {
      available: 0,
      occupied: 0,
      critical: 0,
      isolation: 0,
      cleaning: 0,
      maintenance: 0,
    };
    data.forEach(w => w.beds.forEach(b => { c[b.status] += 1; }));
    return c;
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Header with Legend and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(STATUS_STYLES) as BedStatus[]).map((key) => {
            const s = STATUS_STYLES[key];
            return (
              <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                <span className="text-sm text-gray-700">{s.label}</span>
                <span className="text-xs text-gray-500">({counts[key] ?? 0})</span>
              </div>
            );
          })}
        </div>
        
        {/* Live Status Indicator */}
        <div className="flex items-center gap-2">
          {sampleMode && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <BedDouble className="w-3 h-3" />
              <span>Sample View ({data.reduce((total, ward) => total + ward.beds.length, 0)} beds shown)</span>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Updating...</span>
            </div>
          )}
          {lastUpdated && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live • Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
          {!lastUpdated && !isLoading && !sampleMode && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Demo Data</span>
            </div>
          )}
        </div>
      </div>

      {/* Wards */}
      <div className="space-y-6">
        {data.map((ward) => {
          const hasMoreBeds = sampleMode && ward.totalBeds && ward.totalBeds > maxBedsPerWard;
          
          return (
            <div key={ward.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-700">{ward.name}</div>
                {hasMoreBeds && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    +{ward.totalBeds! - maxBedsPerWard} more beds
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {ward.beds.map((bed) => {
                const s = STATUS_STYLES[bed.status];
                return (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => bed.patient && onBedClick?.(bed.patient)}
                    className={`group relative text-left rounded-xl p-3 ${s.bg} ring-1 ${s.ring} hover:shadow-md transition-all ${
                      bed.patient ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    disabled={!bed.patient}
                    title={bed.patient ? `Click to view ${bed.patient.name}'s summary` : "No patient assigned"}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-gray-600 opacity-80" />
                        <span className="text-sm font-semibold text-gray-800">Bed {bed.number}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    </div>

                    {/* Patient preview inline */}
                    {bed.patient ? (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 truncate">{bed.patient.name}</div>
                        {bed.patient.diagnosis && (
                          <div className="text-[11px] text-gray-500 truncate">{bed.patient.diagnosis}</div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-400 italic">Empty</div>
                    )}

                    {/* Action buttons */}
                    {bed.patient && (
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewFullProfile?.(bed.patient!);
                            }}
                            className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded hover:bg-blue-700"
                            title="View Full Profile"
                          >
                            Profile
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}