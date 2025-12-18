import React from "react";
import { Badge } from "@/Components/ui/badge";
import { Pill, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/Components/ui/tooltip";


interface MedicationSchedule {
  id: number;
  patientId: number;
  patientName: string;
  bedNumber: string;
  medication: string;
  dosage: string;
  time: string;
  status: "due" | "given" | "missed" | "pending";
}

interface MedicationGridProps {
  schedules: MedicationSchedule[];
  onMedicationGiven: (id: number) => void;
  onBarcodeVerification: (id: number) => void;
}

const MedicationGrid: React.FC<MedicationGridProps> = ({
  schedules,
  onMedicationGiven,
  onBarcodeVerification,
}) => {
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const statusColors: Record<string, string> = {
    due: "bg-amber-200 border-amber-300 text-amber-800",
    given: "bg-emerald-200 border-emerald-300 text-emerald-800",
    missed: "bg-rose-200 border-rose-300 text-rose-800",
    pending: "bg-blue-200 border-blue-300 text-blue-800",
  };

  const statusIcons: Record<string, JSX.Element> = {
    due: <Clock className="w-4 h-4 text-amber-600" />,
    given: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    missed: <XCircle className="w-4 h-4 text-rose-600" />,
    pending: <AlertTriangle className="w-4 h-4 text-blue-600" />,
  };

  if (safeSchedules.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10 italic">
        No scheduled medications for this time slot.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Patient</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Bed</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Medication</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Dosage</th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700">Time</th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {safeSchedules.map((schedule, index) => (
              <tr
                key={schedule.id}
                className={`hover:bg-gray-50 transition-all duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                  {schedule.patientName}
                </td>
                <td className="px-6 py-4 text-gray-600">{schedule.bedNumber}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-500" />
                  <span>{schedule.medication}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{schedule.dosage}</td>
                <td className="px-6 py-4 text-center">
                  <Badge variant="outline" className="text-xs">
                    {schedule.time}
                  </Badge>
                </td>

                <td className="px-6 py-4 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        className={`inline-flex items-center gap-1 border ${statusColors[schedule.status]} px-2.5 py-1 rounded-full text-xs font-medium`}
                      >
                        {statusIcons[schedule.status]}
                        <span className="capitalize">{schedule.status}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {schedule.status === "due" && "Scheduled and ready for administration."}
                      {schedule.status === "given" && "Medication successfully administered."}
                      {schedule.status === "missed" && "Missed — not yet administered."}
                      {schedule.status === "pending" && "Upcoming medication not yet due."}
                    </TooltipContent>
                  </Tooltip>
                </td>

                <td className="px-6 py-4 text-center space-x-2">
                  {schedule.status === "due" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onBarcodeVerification(schedule.id)}
                        className="border-blue-400 text-blue-600 hover:bg-blue-50"
                      >
                        Scan
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onMedicationGiven(schedule.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Mark Given
                      </Button>
                    </>
                  )}

                  {schedule.status === "missed" && (
                    <Button
                      size="sm"
                      onClick={() => onMedicationGiven(schedule.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Give Late
                    </Button>
                  )}

                  {schedule.status === "given" && (
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✅ Done
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
};

export default MedicationGrid;
