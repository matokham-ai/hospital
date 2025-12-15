import React from "react";
import { Clock, Pill } from "lucide-react";

interface MedicationSchedule {
  id: number;
  patientName: string;
  time: string;
  medication: string;
  dosage: string;
  status: string;
}

interface MedicationTimelineProps {
  schedules: MedicationSchedule[];
  onMedicationGiven: (id: number) => void;
}

export default function MedicationTimeline({ schedules, onMedicationGiven }: MedicationTimelineProps) {
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const patients = [...new Set(safeSchedules.map((s) => s.patientName))];
  const times = ["06", "08", "10", "12", "14", "16", "18", "20", "22", "00", "02", "04"];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm p-4">
      <div className="min-w-max">
        <div className="grid grid-cols-[150px_repeat(12,80px)] gap-2">
          <div></div>
          {times.map((t) => (
            <div key={t} className="text-xs font-semibold text-gray-600 text-center">{t}:00</div>
          ))}

          {patients.map((patient) => (
            <>
              <div className="font-medium text-gray-700 py-2">{patient}</div>
              {times.map((t) => {
                const meds = safeSchedules.filter(
                  (s) => s.patientName === patient && s.time.startsWith(t)
                );
                return (
                  <div key={t} className="relative h-10 flex items-center justify-center">
                    {meds.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => onMedicationGiven(m.id)}
                        className={`absolute rounded-full px-3 py-1 text-xs text-white flex items-center gap-1 shadow-sm transition-all ${
                          m.status === "given"
                            ? "bg-emerald-500"
                            : m.status === "due"
                            ? "bg-amber-500"
                            : m.status === "missed"
                            ? "bg-rose-500"
                            : "bg-blue-400"
                        } hover:scale-105`}
                        title={`${m.medication} ${m.dosage}`}
                      >
                        <Pill className="w-3 h-3" />
                        {m.medication}
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
