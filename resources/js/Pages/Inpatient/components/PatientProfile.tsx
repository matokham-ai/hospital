import React, { useState, useEffect } from "react";
import {
  X, User, BedDouble, Stethoscope, HeartPulse, Pill,
  FileText, TestTube, Utensils, Activity, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface PatientProfileData {
  id: number | string;
  name: string;
  bedNumber: string;
  ward: string;
  age: number;
  gender: "M" | "F" | "O";
  diagnosis: string;
  admissionDate: string;
  status: "stable" | "critical" | "review" | "isolation";
  vitals?: {
    hr?: number;
    bp?: string;
    temp?: number;
    spo2?: number;
    rr?: number;
    lastUpdated?: string;
  };
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    nextDue: string;
    status: "due" | "given" | "overdue";
  }>;
  progressNotes?: Array<{
    id: string;
    timestamp: string;
    author: string;
    type: "nursing" | "physician" | "therapy";
    content: string;
  }>;
  diagnostics?: Array<{
    id: string;
    type: string;
    date: string;
    result: string;
    status: "pending" | "completed" | "reviewed";
  }>;
  labResults?: Array<{
    id: string;
    test: string;
    value: string;
    reference: string;
    status: "normal" | "abnormal" | "critical";
    date: string;
  }>;
  nursingCharts?: Array<{
    timestamp: string;
    vitals: {
      hr?: number;
      bp?: string;
      temp?: number;
      spo2?: number;
      rr?: number;
    };
    intake: number;
    output: number;
    notes: string;
  }>;
  diet?: {
    type: string;
    restrictions: string[];
    allergies: string[];
    lastMeal: string;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  patient?: PatientProfileData | null;
}

type TabType =
  | "vitals"
  | "medications"
  | "notes"
  | "diagnostics"
  | "labs"
  | "nursing"
  | "diet";

export default function PatientProfile({ open, onClose, patient }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("vitals");

  if (!patient) return null;

  const tabs = [
    { id: "vitals", label: "Vitals", icon: <HeartPulse className="w-4 h-4" /> },
    { id: "medications", label: "Medications", icon: <Pill className="w-4 h-4" /> },
    { id: "notes", label: "Progress Notes", icon: <FileText className="w-4 h-4" /> },
    { id: "diagnostics", label: "Diagnostics", icon: <Activity className="w-4 h-4" /> },
    { id: "labs", label: "Lab Results", icon: <TestTube className="w-4 h-4" /> },
    { id: "nursing", label: "Nursing Charts", icon: <Stethoscope className="w-4 h-4" /> },
    { id: "diet", label: "Diet", icon: <Utensils className="w-4 h-4" /> },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "isolation": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
                          patient?.status || "stable"
                        )}`}
                      >
                        {(patient?.status ?? "STABLE").toString().toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-4 h-4" />
                        Bed {patient.bedNumber}
                      </span>
                      <span>{patient.ward}</span>
                      <span>{patient.diagnosis}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-6">
                <nav className="flex space-x-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "vitals" && <VitalsTab patient={patient} />}
              {activeTab === "medications" && <MedicationsTab patient={patient} />}
              {activeTab === "notes" && <ProgressNotesTab patient={patient} />}
              {activeTab === "diagnostics" && <DiagnosticsTab patient={patient} />}
              {activeTab === "labs" && <LabResultsTab patient={patient} />}
              {activeTab === "nursing" && <NursingChartsTab patient={patient} />}
              {activeTab === "diet" && <DietTab patient={patient} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------- SAFE VITALS TAB -------------------- */
function VitalsTab({ patient }: { patient: PatientProfileData }) {
  const vitals = patient?.vitals;

  // Guard for undefined vitals during first render / live load
  if (!vitals || typeof vitals.hr === "undefined") {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
        <span className="animate-pulse">Fetching live vitals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Current Vitals</h3>
          <span className="text-xs text-gray-500">
            Last updated:{" "}
            {vitals.lastUpdated
              ? new Date(vitals.lastUpdated).toLocaleString()
              : "Live feed active"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <VitalCard label="Heart Rate" value={`${vitals.hr} bpm`} />
          <VitalCard label="Blood Pressure" value={vitals.bp ?? "—/—"} />
          <VitalCard label="Temperature" value={`${vitals.temp?.toFixed(1) ?? "--"}°C`} />
          <VitalCard label="SpO₂" value={`${vitals.spo2 ?? "--"}%`} />
          <VitalCard label="Resp. Rate" value={`${vitals.rr ?? "--"} /min`} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">24-Hour Trend</h3>
        <VitalsChart patient={patient} />
      </div>
    </div>
  );
}

/* -------------------- REST OF YOUR COMPONENTS -------------------- */
/* (no logic changes, only guards added where needed) */
function VitalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function VitalsChart({ patient }: { patient: PatientProfileData }) {
  return (
    <div className="h-64 flex items-center justify-center text-gray-500">
      <span>Vitals chart will be implemented with live data</span>
    </div>
  );
}

function MedicationsTab({ patient }: { patient: PatientProfileData }) {
  const medications = patient?.medications || [];

  if (medications.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <span>No medications data available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Current Medications</h3>
      <div className="space-y-3">
        {medications.map((med, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{med.name}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                med.status === 'due' ? 'bg-yellow-100 text-yellow-800' :
                med.status === 'overdue' ? 'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800'
              }`}>
                {med.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Dosage:</span> {med.dosage}
              </div>
              <div>
                <span className="font-medium">Frequency:</span> {med.frequency}
              </div>
              <div>
                <span className="font-medium">Route:</span> {med.route}
              </div>
              <div>
                <span className="font-medium">Next Due:</span> {med.nextDue}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressNotesTab({ patient }: { patient: PatientProfileData }) {
  const notes = patient?.progressNotes || [];

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <span>No progress notes available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Progress Notes</h3>
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  note.type === 'physician' ? 'bg-blue-100 text-blue-800' :
                  note.type === 'nursing' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {note.type.toUpperCase()}
                </span>
                <span className="font-medium text-gray-900">{note.author}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(note.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosticsTab({ patient }: { patient: PatientProfileData }) {
  const diagnostics = patient?.diagnostics || [];

  if (diagnostics.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <span>No diagnostic data available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Diagnostic Tests</h3>
      <div className="space-y-3">
        {diagnostics.map((diagnostic) => (
          <div key={diagnostic.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{diagnostic.type}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                diagnostic.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                diagnostic.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {diagnostic.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div><span className="font-medium">Date:</span> {diagnostic.date}</div>
              <div><span className="font-medium">Result:</span> {diagnostic.result}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabResultsTab({ patient }: { patient: PatientProfileData }) {
  const labResults = patient?.labResults || [];

  if (labResults.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <span>No lab results available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Laboratory Results</h3>
      <div className="space-y-3">
        {labResults.map((lab) => (
          <div key={lab.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{lab.test}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                lab.status === 'critical' ? 'bg-red-100 text-red-800' :
                lab.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {lab.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Value:</span> {lab.value}
              </div>
              <div>
                <span className="font-medium">Reference:</span> {lab.reference}
              </div>
              <div>
                <span className="font-medium">Date:</span> {lab.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NursingChartsTab({ patient }: { patient: PatientProfileData }) {
  const charts = patient?.nursingCharts || [];

  if (charts.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <span>No nursing charts available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Nursing Charts</h3>
      <div className="space-y-3">
        {charts.map((chart, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">
                {new Date(chart.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
              <VitalCard label="HR" value={`${chart.vitals.hr || '--'} bpm`} />
              <VitalCard label="BP" value={chart.vitals.bp || '--/--'} />
              <VitalCard label="Temp" value={`${chart.vitals.temp?.toFixed(1) || '--'}°C`} />
              <VitalCard label="SpO₂" value={`${chart.vitals.spo2 || '--'}%`} />
              <VitalCard label="RR" value={`${chart.vitals.rr || '--'} /min`} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Intake:</span> {chart.intake}ml
              </div>
              <div>
                <span className="font-medium">Output:</span> {chart.output}ml
              </div>
              <div>
                <span className="font-medium">Balance:</span> {chart.intake - chart.output}ml
              </div>
            </div>
            {chart.notes && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Notes:</span> {chart.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DietTab({ patient }: { patient: PatientProfileData }) {
  const diet = patient?.diet;

  if (!diet) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <span>No diet information available</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Diet Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Diet Type</h4>
            <p className="text-gray-700">{diet.type}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Last Meal</h4>
            <p className="text-gray-700">{diet.lastMeal}</p>
          </div>
        </div>
      </div>

      {diet.restrictions && diet.restrictions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Dietary Restrictions
          </h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {diet.restrictions.map((restriction, index) => (
              <li key={index}>{restriction}</li>
            ))}
          </ul>
        </div>
      )}

      {diet.allergies && diet.allergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Allergies
          </h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {diet.allergies.map((allergy, index) => (
              <li key={index}>{allergy}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

