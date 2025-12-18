import React from "react";
import { X, User, BedDouble, Stethoscope, HeartPulse, Pill, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface PatientSummary {
  id: number | string;
  name: string;
  bedNumber: string;
  ward: string;
  age?: number;
  gender?: "M" | "F" | "O";
  diagnosis?: string;
  vitals?: {
    hr?: number; // bpm
    bp?: string; // e.g. 120/80
    temp?: number; // °C
    spo2?: number; // %
  };
  medsDue?: Array<{ name: string; time: string }>;
  allergies?: string[];
  notes?: string;
  status?: "available" | "occupied" | "critical" | "isolation" | "cleaning" | "maintenance";
}

interface Props {
  open: boolean;
  onClose: () => void;
  patient?: PatientSummary | null;
}

export default function PatientQuickView({ open, onClose, patient }: Props) {
  return (
    <AnimatePresence>
      {open && patient && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-500">
                    Bed {patient.bedNumber} • {patient.ward}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Diagnosis */}
              {patient.diagnosis && (
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Diagnosis</div>
                    <div className="font-medium text-gray-800">{patient.diagnosis}</div>
                  </div>
                </div>
              )}

              {/* Vitals */}
              {patient.vitals && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Latest Vitals</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <VitalCard label="HR" value={`${patient.vitals.hr ?? "-"} bpm`} icon={<HeartPulse className="w-4 h-4" />} />
                    <VitalCard label="BP" value={patient.vitals.bp ?? "-"} icon={<BedDouble className="w-4 h-4" />} />
                    <VitalCard label="Temp" value={`${patient.vitals.temp ?? "-"} °C`} icon={<AlertTriangle className="w-4 h-4" />} />
                    <VitalCard label="SpO₂" value={`${patient.vitals.spo2 ?? "-"} %`} icon={<HeartPulse className="w-4 h-4" />} />
                  </div>
                </div>
              )}

              {/* Meds due */}
              {patient.medsDue && patient.medsDue.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Medications Due</div>
                  <ul className="space-y-2">
                    {patient.medsDue.map((m, i) => (
                      <li key={`${m.name}-${i}`} className="flex items-center gap-2 text-sm">
                        <Pill className="w-4 h-4 text-indigo-600" />
                        <span className="font-medium text-gray-800">{m.name}</span>
                        <span className="text-gray-500">• {m.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Allergies */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Allergies</div>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((a, i) => (
                      <span key={`${a}-${i}`} className="px-2 py-1 text-xs rounded-full bg-red-50 text-red-700 border border-red-100">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {patient.notes && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Notes</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{patient.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VitalCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="font-semibold text-gray-800">{value}</div>
    </div>
  );
}
