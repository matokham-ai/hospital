import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { X, ClipboardList, Loader2, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Medication Card Component
interface MedicationCardProps {
  medication: any;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  index,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  const [drugSearch, setDrugSearch] = useState("");
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const searchDrugs = async (query: string) => {
    if (query.length < 2) {
      setDrugOptions([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`/api/drugs/search?q=${encodeURIComponent(query)}`);
      setDrugOptions(response.data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Drug search error:', error);
      setDrugOptions([]);
      setShowDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectDrug = (drug: any) => {
    onUpdate(index, 'drug_selection', drug);
    setDrugSearch(drug.full_name || drug.name);
    setShowDropdown(false);
    setDrugOptions([]);

    // Auto-calculate quantity based on frequency and duration
    if (medication.frequency && medication.duration) {
      const frequencyMap: { [key: string]: number } = {
        'Once daily': 1,
        'Twice daily': 2,
        'Three times daily': 3,
        'Four times daily': 4,
        'Every 4 hours': 6,
        'Every 6 hours': 4,
        'Every 8 hours': 3,
      };

      const dailyDoses = frequencyMap[medication.frequency] || 1;
      const durationDays = parseInt(medication.duration.replace(/\D/g, '')) || 7;
      const totalQuantity = dailyDoses * durationDays;

      onUpdate(index, 'quantity', `${totalQuantity} ${drug.form || 'units'}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (drugSearch) {
      const debounceTimer = setTimeout(() => {
        searchDrugs(drugSearch);
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [drugSearch]);

  return (
    <div className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 relative">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">
          Medication {index + 1}
        </h4>
        {canRemove && (
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Drug Search */}
        <div className="relative col-span-2" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Drug Name *
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for drug..."
              value={drugSearch || medication.drug_name}
              onChange={(e) => {
                setDrugSearch(e.target.value);
                if (!e.target.value) {
                  onUpdate(index, 'drug_name', '');
                  setShowDropdown(false);
                  setDrugOptions([]);
                }
              }}
              onFocus={() => {
                if (drugOptions.length > 0) {
                  setShowDropdown(true);
                }
              }}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {searchLoading ? (
                <div className="p-3 text-center text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : drugOptions.length > 0 ? (
                drugOptions.map((drug) => (
                  <div
                    key={drug.id}
                    onClick={() => selectDrug(drug)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer border-b border-gray-100 dark:border-slate-600 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {drug.name} {drug.strength}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {drug.form} • {drug.formatted_price} • Stock: {drug.stock_quantity}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">No drugs found</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Dosage
          </label>
          <input
            type="text"
            placeholder="e.g., 500mg"
            value={medication.dosage}
            onChange={(e) => onUpdate(index, "dosage", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Frequency
          </label>
          <select
            value={medication.frequency}
            onChange={(e) => {
              onUpdate(index, "frequency", e.target.value);
              // Auto-calculate quantity when frequency changes
              if (e.target.value && medication.duration) {
                const frequencyMap: { [key: string]: number } = {
                  'Once daily': 1,
                  'Twice daily': 2,
                  'Three times daily': 3,
                  'Four times daily': 4,
                  'Every 4 hours': 6,
                  'Every 6 hours': 4,
                  'Every 8 hours': 3,
                };

                const dailyDoses = frequencyMap[e.target.value] || 1;
                const durationDays = parseInt(medication.duration.replace(/\D/g, '')) || 7;
                const totalQuantity = dailyDoses * durationDays;

                onUpdate(index, 'quantity', `${totalQuantity} tablets`);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select frequency</option>
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Four times daily">Four times daily</option>
            <option value="Every 4 hours">Every 4 hours</option>
            <option value="Every 6 hours">Every 6 hours</option>
            <option value="Every 8 hours">Every 8 hours</option>
            <option value="As needed">As needed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Duration
          </label>
          <input
            type="text"
            placeholder="e.g., 7 days"
            value={medication.duration}
            onChange={(e) => {
              onUpdate(index, "duration", e.target.value);
              // Auto-calculate quantity when duration changes
              if (e.target.value && medication.frequency) {
                const frequencyMap: { [key: string]: number } = {
                  'Once daily': 1,
                  'Twice daily': 2,
                  'Three times daily': 3,
                  'Four times daily': 4,
                  'Every 4 hours': 6,
                  'Every 6 hours': 4,
                  'Every 8 hours': 3,
                };

                const dailyDoses = frequencyMap[medication.frequency] || 1;
                const durationDays = parseInt(e.target.value.replace(/\D/g, '')) || 7;
                const totalQuantity = dailyDoses * durationDays;

                onUpdate(index, 'quantity', `${totalQuantity} tablets`);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Quantity
          </label>
          <input
            type="text"
            placeholder="Auto-calculated"
            value={medication.quantity}
            onChange={(e) => onUpdate(index, "quantity", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Instructions
          </label>
          <input
            type="text"
            placeholder="e.g., Take with food"
            value={medication.instructions}
            onChange={(e) => onUpdate(index, "instructions", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};

interface SOAPNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  appointmentId: number;
  patient?: {
    id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: string;
    phone?: string;
    allergies?: string[];
    chronic_conditions?: string[];
    alerts?: string[];
  };
  appointmentDetails?: {
    date: string;
    time: string;
    chief_complaint?: string;
    notes?: string;
  };
  appointmentType?: "opd" | "regular";
  existingNote?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

export default function SOAPNotesModal({
  isOpen,
  onClose,
  onComplete,
  appointmentId,
  patient,
  appointmentDetails,
  appointmentType = "opd",
  existingNote,
}: SOAPNotesModalProps) {
  const { toast } = useToast();
  const { data, setData, post, processing, reset } = useForm({
    subjective: existingNote?.subjective || "",
    objective: existingNote?.objective || "",
    assessment: existingNote?.assessment || "",
    plan: existingNote?.plan || "",
    // Medication fields
    medications: [] as Array<{
      drug_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: string;
      instructions: string;
    }>,
  });
  const [completing, setCompleting] = useState(false);
  const [medications, setMedications] = useState([
    {
      drug_id: null,
      drug_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: "",
      instructions: "",
      unit_price: 0,
    },
  ]);


  useEffect(() => {
    if (!isOpen) {
      reset();
      setMedications([{
        drug_id: null,
        drug_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: "",
        instructions: "",
        unit_price: 0,
      }]);
    }
  }, [isOpen]);



  const addMedication = () => {
    setMedications([
      ...medications,
      {
        drug_id: null,
        drug_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: "",
        instructions: "",
        unit_price: 0,
      },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: string, value: any) => {
    const updatedMedications = medications.map((med, i) => {
      if (i === index) {
        if (field === 'drug_selection') {
          // When a drug is selected, auto-fill related fields
          return {
            ...med,
            drug_id: value.id,
            drug_name: value.full_name || value.name,
            dosage: value.strength || "",
            unit_price: value.unit_price || 0,
          };
        }
        return { ...med, [field]: value };
      }
      return med;
    });
    setMedications(updatedMedications);
  };

  const handleSave = () => {
    const formData = {
      ...data,
      medications: medications.filter(med => med.drug_name.trim() !== ""),
    };

    // Update the form data first
    setData(formData as any);

    // Then post
    post(`/opd/appointments/${appointmentId}/soap`, {
      preserveScroll: true,
      onSuccess: () =>
        toast({
          title: "Saved",
          description: "SOAP notes successfully updated.",
          variant: "default",
        }),
      onError: () =>
        toast({
          title: "Save Failed",
          description: "Failed to save SOAP notes. Please retry.",
          variant: "destructive",
        }),
    });
  };

  const handleComplete = () => {
    setCompleting(true);
    const formData = {
      ...data,
      medications: medications.filter(med => med.drug_name.trim() !== ""),
    };

    // Update the form data first
    setData(formData as any);

    post(`/opd/appointments/${appointmentId}/soap`, {
      onSuccess: () => {
        const completeUrl =
          appointmentType === "regular"
            ? `/appointments/${appointmentId}/complete-consultation`
            : `/opd/appointments/${appointmentId}/complete`;
        router.post(completeUrl, {}, {
          onSuccess: () => {
            toast({
              title: "✅ Consultation Completed",
              description:
                "SOAP notes saved and consultation marked complete.",
            });
            setCompleting(false);
            onClose();

            // Call the onComplete callback if provided, otherwise redirect
            if (onComplete) {
              onComplete();
            } else {
              setTimeout(() => router.visit("/opd/consultations"), 1500);
            }
          },
          onError: () => {
            toast({
              title: "❌ Completion Failed",
              description: "Could not complete consultation.",
              variant: "destructive",
            });
            setCompleting(false);
          },
        });
      },
      onError: () => setCompleting(false),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-7xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                <h2 className="text-lg font-semibold">SOAP Notes</h2>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* SOAP Notes Column */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    📋 SOAP Notes
                  </h3>
                  {[
                    { label: "Subjective (History & Symptoms)", key: "subjective" },
                    { label: "Objective (Examination & Vitals)", key: "objective" },
                    { label: "Assessment (Diagnosis)", key: "assessment" },
                    { label: "Plan (Treatment & Follow-up)", key: "plan" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {f.label}
                      </label>
                      <Textarea
                        rows={2}
                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                        value={(data as any)[f.key]}
                        onChange={(e) => setData(f.key as any, e.target.value)}
                        className="resize-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Medications Column */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      💊 Medications & Prescriptions
                    </h3>
                    <Button
                      type="button"
                      onClick={addMedication}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      + Add Medication
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {medications.map((medication, index) => (
                      <MedicationCard
                        key={index}
                        medication={medication}
                        index={index}
                        onUpdate={updateMedication}
                        onRemove={removeMedication}
                        canRemove={medications.length > 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>



            {/* Footer - Sticky */}
            <div className="flex justify-end gap-3 bg-gray-50 dark:bg-slate-800 p-4 border-t border-gray-200 dark:border-slate-700 mt-auto">
              <Button variant="outline" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={processing || completing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={processing || completing}
                className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:opacity-90 text-white"
              >
                {completing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Completing...
                  </>
                ) : (
                  "Complete Consultation"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
