import React, { useState, useEffect, useRef } from "react";
import { X, User, Bed, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { router } from "@inertiajs/react";
import PatientSearchSelect from "./PatientSearchSelect";
import SearchableSelect from "@/Components/SearchableSelect";
import { Button } from "@/Components/ui/button";


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
  status?: string;
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
  attendingDoctorCode: "",
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
  // 🔹 Place all hooks at the top of your component
  const [query, setQuery] = useState("");
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
      console.log("Doctors data received:", data);
      console.log("First doctor structure:", data[0]);
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
          status: b.status || "available",
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
    if (!form.attendingDoctorCode) return alert("Select an attending doctor.");
    if (!form.icd10Code) return alert("Select an ICD-10 code.");
    if (!form.chiefComplaint.trim()) return alert("Chief complaint is required.");

    const payload = {
      patient_id: selectedPatient.id,
      bed_id: selectedBed.id,
      attending_doctor_id: form.attendingDoctorCode, // Server expects this field name
      attending_physician_code: form.attendingDoctorCode, // Also send this as backup
      admission_type: form.admissionType,    
      priority: form.priority,                 
      chief_complaint: form.chiefComplaint,
      icd10_code: form.icd10Code,
      icd10_description: form.icd10Description,
      admission_notes: form.admissionNotes,
      // Additional fields that might be useful
      secondary_diagnosis: form.secondaryDiagnosis,
      estimated_stay_days: form.estimatedStayDays ? parseInt(form.estimatedStayDays) : null,
      insurance_info: form.insuranceInfo,
      next_of_kin: form.nextOfKin,
      next_of_kin_phone: form.nextOfKinPhone,
    };

    

    console.log("Submitting admission payload", payload);
    console.log("Selected patient object:", selectedPatient);
    console.log("Patient ID being sent:", selectedPatient.id, typeof selectedPatient.id);
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

        console.log("Server response:", { status: response.status, data });
        console.log("Full server response data:", JSON.stringify(data, null, 2));
        if (data.errors) {
          console.log("Validation errors:", data.errors);
        }

        if (response.ok && data.success) {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            handleClose();
            window.location.reload();
          }, 1200);
        } else {
          // More detailed error handling
          const errorMessage = data.message || data.error ||
            (data.errors ? Object.values(data.errors).flat().join(', ') : '') ||
            `Server error (${response.status}): ${JSON.stringify(data)}`;
          throw new Error(errorMessage);
        }
      })
      .catch((error) => {
        console.error("Admission error:", error);
        console.error("Full error details:", error);
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
              <div className="bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Bed className="h-5 w-5 text-blue-600" /> Select Bed
                </h3>

                <div className="w-full">
                  <SearchableSelect
                    options={beds.map((b) => {
                      const status = b.status?.toLowerCase() || "";
                      const isAvailable = ["available", "vacant", "free", "unoccupied"].includes(status);
                      const statusIcon = isAvailable ? "🟢" : "⚪";

                      return {
                        value: b.id.toString(),
                        label: `${statusIcon} Bed ${b.number} - ${b.ward} (${b.type})`,
                        disabled: !isAvailable
                      };
                    })}
                    value={selectedBed?.id?.toString() || ""}
                    onChange={(value) => {
                      const chosen = beds.find((b) => b.id.toString() === value);
                      setSelectedBed(chosen || null);
                    }}
                    placeholder="Search or choose an available bed..."
                  />

                  {/* Selection feedback */}
                  {selectedBed && (
                    <div className="mt-3 text-sm text-blue-700 font-medium flex items-center gap-1">
                      ✓ Selected: Bed {selectedBed.number} ({selectedBed.ward})
                    </div>
                  )}
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
                          value: d.physician_code || d.id?.toString() || '', // ✅ fallback to id if physician_code not available
                          label: `${d.name} — ${d.specialization}`,
                        }))}
                        value={form.attendingDoctorCode}
                        onChange={(v) => setForm((p) => ({ ...p, attendingDoctorCode: v }))} // ✅ use same key
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
