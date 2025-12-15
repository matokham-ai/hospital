import React, { useState, useEffect, useRef } from "react";
import { X, User, Bed, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { router } from "@inertiajs/react";
import PatientSearchSelect from "./PatientSearchSelect";
import SearchableSelect from "@/Components/SearchableSelect";

interface Patient {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth: string;
  gender: "M" | "F" | "O";
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
  registeredDate: string;
}

interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
  department: string;
  physician_code?: string;
  user_id?: number;
}

interface BedData {
  id: number;
  number: string;
  ward: string;
  type: string;
}

interface Icd10 {
  id: number;
  code: string;
  description: string;
  category: string;
  subcategory: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  bed?: BedData | null;
  onSubmit?: (data: any) => void;
}

const defaultForm = {
  patientId: "",
  attendingDoctorId: "",
  admissionType: "emergency",
  priority: "routine",
  icd10Category: "",
  icd10Subcategory: "",
  icd10Code: "",
  icd10Description: "",
  secondaryDiagnosis: "",
  chiefComplaint: "",
  admissionNotes: "",
  estimatedStayDays: "",
  insuranceInfo: "",
  nextOfKin: "",
  nextOfKinPhone: "",
};

export default function AdmissionModal({ open, onClose, bed, onSubmit }: Props) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<BedData[]>([]);
  const [icd10Codes, setIcd10Codes] = useState<Icd10[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(bed || null);
  const [success, setSuccess] = useState(false);

  const doctorSelectRef = useRef<HTMLDivElement>(null);

  // 🔹 Load data on open
  useEffect(() => {
    if (open) {
      fetchDoctors();
      fetchBeds();
      fetchICD10();
    }
  }, [open]);

  useEffect(() => setSelectedBed(bed || null), [bed]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/inpatient/api/available-doctors", { headers: { Accept: "application/json" } });
      const data = await res.json();
      setDoctors(data || []);
    } catch {
      setDoctors([]);
    }
  };

  const fetchBeds = async () => {
    try {
      const res = await fetch("/inpatient/api/available-beds-list", { headers: { Accept: "application/json" } });
      const data = await res.json();
      const mapped =
        data.available_beds?.map((b: any) => ({
          id: b.id,
          number: b.bed_number,
          ward: b.ward_name,
          type: b.bed_type?.toLowerCase() || "general",
        })) || [];
      setBeds(mapped);
    } catch {
      setBeds([]);
    }
  };

  const fetchICD10 = async () => {
    try {
      const res = await fetch("/icd10-codes", { headers: { Accept: "application/json" } });
      setIcd10Codes(await res.json());
    } catch {
      setIcd10Codes([]);
    }
  };

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setForm((prev) => ({
      ...prev,
      patientId: patient?.id?.toString() ?? "",
      nextOfKin: patient?.emergencyContactName || "",
      nextOfKinPhone: patient?.emergencyContactPhone || "",
    }));
    setTimeout(() => doctorSelectRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) return alert("Please select a patient first.");
    if (!selectedBed) return alert("Select a bed for admission.");
    if (!form.attendingDoctorId) return alert("Select an attending doctor.");
    if (!form.icd10Code) return alert("Select an ICD-10 code.");
    if (!form.chiefComplaint.trim()) return alert("Chief complaint is required.");

    const payload = {
      patientId: selectedPatient.id,
      bedId: selectedBed.id,
      attendingDoctorId: form.attendingDoctorId,
      admissionType: form.admissionType,
      priority: form.priority,
      primaryDiagnosis: form.icd10Description,
      secondaryDiagnosis: form.secondaryDiagnosis,
      chiefComplaint: form.chiefComplaint,
      admissionNotes: form.admissionNotes,
      estimatedStayDays: form.estimatedStayDays ? parseInt(form.estimatedStayDays) : null,
      insuranceInfo: form.insuranceInfo,
      nextOfKin: form.nextOfKin,
      nextOfKinPhone: form.nextOfKinPhone,
    };

    console.log("Submitting admission payload", payload);
    setLoading(true);

    // Use fetch instead of Inertia router for API calls
    fetch("/inpatient/api/admit-patient", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await response.json();

        if (response.ok && data.success) {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            handleClose();
            window.location.reload();
          }, 1200);
        } else {
          throw new Error(data.message || 'Admission failed');
        }
      })
      .catch((error) => {
        console.error("Admission error:", error);
        alert(`❌ ${error.message || 'Admission failed. Please check all required fields.'}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleClose = () => {
    setSelectedPatient(null);
    setSelectedBed(bed || null);
    setForm(defaultForm);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white w-full max-w-5xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">🏥 Admit New Patient</h2>
              <p className="text-sm text-gray-600">
                {selectedBed
                  ? `Bed ${selectedBed.number} • ${selectedBed.ward}`
                  : "Select patient and bed to begin admission"}
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Patient selector */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> Select Patient
              </h3>
              <PatientSearchSelect
                selectedPatient={selectedPatient}
                onPatientSelect={handlePatientSelect}
                placeholder="Search for patient..."
              />
            </div>

            {/* Bed selector */}
            {!bed && selectedPatient && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Bed className="h-5 w-5 text-blue-600" /> Select Bed
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {beds.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBed(b)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedBed?.id === b.id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">Bed {b.number}</div>
                          <div className="text-sm text-gray-600">{b.ward}</div>
                          <div className="text-xs text-gray-500 capitalize">{b.type}</div>
                        </div>
                        <div className="text-2xl">{b.type === "icu" ? "🚨" : "🛏️"}</div>
                      </div>
                      {selectedBed?.id === b.id && (
                        <div className="text-xs text-blue-600 mt-2">✓ Selected</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admission Form */}
            {selectedPatient && selectedBed && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Doctor / Type / Priority */}
                  <div className="space-y-4" ref={doctorSelectRef}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Attending Doctor *
                      </label>
                      <SearchableSelect
                        options={doctors.map((d) => ({
                          value: d.user_id?.toString() || d.id?.toString(),
                          label: `${d.name} — ${d.specialization}`,
                        }))}
                        value={form.attendingDoctorId}
                        onChange={(v) => setForm((p) => ({ ...p, attendingDoctorId: v }))}
                        placeholder="Search doctor..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admission Type *</label>
                      <select
                        value={form.admissionType}
                        onChange={(e) => setForm((p) => ({ ...p, admissionType: e.target.value }))}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500"
                      >
                        <option value="emergency">🚨 Emergency</option>
                        <option value="elective">📅 Elective</option>
                        <option value="transfer">🔁 Transfer</option>
                        <option value="observation">👁 Observation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority *</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500"
                      >
                        <option value="routine">🟢 Routine</option>
                        <option value="urgent">🟡 Urgent</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* ICD-10 */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Diagnosis (ICD-10)</label>
                    <SearchableSelect
                      options={Array.from(new Set(icd10Codes.map((c) => c.category))).map((cat, i) => ({
                        value: cat,
                        label: cat,
                        key: `${cat}-${i}`,
                      }))}
                      value={form.icd10Category}
                      onChange={(v) => setForm((p) => ({ ...p, icd10Category: v, icd10Subcategory: "", icd10Code: "", icd10Description: "" }))}
                      placeholder="Select category"
                    />

                    {form.icd10Category && (
                      <SearchableSelect
                        options={Array.from(
                          new Set(
                            icd10Codes
                              .filter((c) => c.category === form.icd10Category)
                              .map((c) => c.subcategory)
                          )
                        ).map((subcategory, i) => ({
                          value: subcategory,
                          label: subcategory,
                          key: `${form.icd10Category}-${subcategory}-${i}`,
                        }))}
                        value={form.icd10Subcategory}
                        onChange={(v) => {
                          const match = icd10Codes.find(
                            (c) => c.category === form.icd10Category && c.subcategory === v
                          );
                          setForm((p) => ({
                            ...p,
                            icd10Subcategory: v,
                            icd10Code: match?.code || "",
                            icd10Description: match?.description || "",
                          }));
                        }}
                        placeholder="Select subcategory"
                      />
                    )}

                    {form.icd10Code && (
                      <div className="mt-2 text-sm bg-gray-100 p-2 rounded text-gray-700">
                        <strong>{form.icd10Code}</strong> — {form.icd10Description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chief Complaint *</label>
                  <textarea
                    value={form.chiefComplaint}
                    onChange={(e) => setForm((p) => ({ ...p, chiefComplaint: e.target.value }))}
                    rows={3}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500"
                    placeholder="Describe the main reason for admission"
                    required
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading || !selectedPatient || !selectedBed}
                    className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all text-white ${loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : success
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" /> Processing...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Success!
                      </>
                    ) : (
                      "Admit Patient"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-600 flex justify-between">
            <span>
              {selectedPatient && selectedBed
                ? `✓ ${selectedPatient.name} → Bed ${selectedBed.number}`
                : "Select patient and bed to continue"}
            </span>
            <span className="italic text-gray-400">Hospital Management Suite</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
