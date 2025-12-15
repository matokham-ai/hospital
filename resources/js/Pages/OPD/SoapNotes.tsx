import React, { useEffect, useState, useRef, useCallback } from "react";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { useToast } from "@/hooks/use-toast";
import type { PageProps, EmergencyPatient, TriageAssessment } from "@/types";
import EmergencyStatusBadge from "@/Components/Consultation/EmergencyStatusBadge";
import PrescriptionForm from "@/Components/Consultation/PrescriptionForm";
import PrescriptionList from "@/Components/Consultation/PrescriptionList";
import LabTestSearch from "@/Components/Consultation/LabTestSearch";
import LabOrderForm from "@/Components/Consultation/LabOrderForm";
import LabOrderList from "@/Components/Consultation/LabOrderList";
import ConsultationStateIndicator from "@/Components/Consultation/ConsultationStateIndicator";
import CompletionSummaryModal from "@/Components/Consultation/CompletionSummaryModal";
import KeyboardShortcutsModal from "@/Components/Consultation/KeyboardShortcutsModal";
import { useAutoSave, useConsultationStore } from "@/hooks/consultation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

interface DrugFormulary {
  id: number;
  name: string;
  generic_name: string;
  brand_name?: string | null;
  strength: string;
  form: string;
  unit_price: string | number;
  stock_quantity?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_badge_color?: 'green' | 'yellow' | 'red' | 'gray';
}

interface Prescription {
  id: number;
  drug_id: number;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number;
  instant_dispensing: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TestCatalog {
  id: number;
  name: string;
  code: string;
  price: number | string;
  turnaround_time: number;
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
  unit?: string;
  normal_range?: string;
  sample_type?: string;
  instructions?: string;
  status: string;
}

interface LabOrder {
  id: number;
  test_id: number;
  test_name: string;
  priority: 'urgent' | 'fast' | 'normal';
  clinical_notes?: string;
  expected_completion_at?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface SoapNotesProps extends PageProps {
  appointment: {
    id: number;
    type?: "opd" | "regular";
    appointment_number: string;
    patient: {
      id: string;
      first_name: string;
      last_name: string;
    };
    doctor?: {
      physician_code: string;
      name: string;
      specialization: string;
    };
    status: string;
    chief_complaint: string;
  };
  soapNote?:
    | {
        id: number;
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
        vital_signs: any;
      }
    | {
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
        created_at: string;
        created_by: string;
      };
  emergencyData?: EmergencyPatient;
  triageAssessment?: TriageAssessment;
  prescriptions?: Prescription[];
  labOrders?: LabOrder[];
}

export default function SoapNotes({ auth, appointment, soapNote, emergencyData, triageAssessment, prescriptions: initialPrescriptions = [], labOrders: initialLabOrders = [] }: SoapNotesProps) {
  const { props } = usePage();
  const { toast } = useToast();

  // Consultation store
  const setSoapNote = useConsultationStore((state) => state.setSoapNote);
  const storeSoapNote = useConsultationStore((state) => state.soapNote);

  // SOAP form
  const { data, setData, post, processing } = useForm({
    subjective: soapNote?.subjective || "",
    objective: soapNote?.objective || "",
    assessment: soapNote?.assessment || "",
    plan: soapNote?.plan || "",
  });

  const [completing, setCompleting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showKeyboardShortcutsModal, setShowKeyboardShortcutsModal] = useState(false);

  // 💊 Prescription state - Requirements 2.1, 2.2, 2.3, 6.1
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [drugSearch, setDrugSearch] = useState("");
  const [drugSuggestions, setDrugSuggestions] = useState<DrugFormulary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugFormulary | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [loadingDrugs, setLoadingDrugs] = useState(false);

  // 🧪 Lab Order state - Requirements 4.1, 4.2, 4.3, 6.2, 6.4
  const [labOrders, setLabOrders] = useState<LabOrder[]>(initialLabOrders);
  const [selectedTest, setSelectedTest] = useState<TestCatalog | null>(null);
  const [showLabOrderForm, setShowLabOrderForm] = useState(false);
  const [editingLabOrder, setEditingLabOrder] = useState<LabOrder | null>(null);

  // for keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionBoxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Check if patient is emergency patient - Requirement 3.1
  const isEmergencyPatient = !!emergencyData;
  const isConsultationCompleted = appointment.status === 'COMPLETED';

  // Initialize auto-save - Requirement 6.6
  const { forceSave } = useAutoSave(appointment.id, !isConsultationCompleted);

  // -----------------------------
  // KEYBOARD SHORTCUTS - Requirement 8.6
  // -----------------------------
  
  /**
   * Handle add prescription shortcut
   * Requirement 8.6: Ctrl+P to add prescription
   */
  const handleAddPrescriptionShortcut = useCallback(() => {
    if (isConsultationCompleted) return;
    
    // Focus on drug search input
    if (inputRef.current && !showPrescriptionForm) {
      inputRef.current.focus();
      setShowSuggestions(true);
    }
  }, [isConsultationCompleted, showPrescriptionForm]);

  /**
   * Handle add lab order shortcut
   * Requirement 8.6: Ctrl+L to add lab order
   */
  const handleAddLabOrderShortcut = useCallback(() => {
    if (isConsultationCompleted) return;
    
    // Scroll to lab order section and focus
    const labSection = document.querySelector('[data-lab-section]');
    if (labSection) {
      labSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isConsultationCompleted]);

  /**
   * Handle save shortcut
   * Requirement 8.6: Ctrl+S to save
   */
  const handleSaveShortcut = useCallback(() => {
    if (!processing) {
      handleSave();
    }
  }, [processing]);

  /**
   * Handle complete consultation shortcut
   * Requirement 8.6: Ctrl+Enter to complete consultation
   */
  const handleCompleteShortcut = useCallback(() => {
    if (!isConsultationCompleted && !processing && !completing) {
      handleCompleteClick();
    }
  }, [isConsultationCompleted, processing, completing]);

  /**
   * Handle help shortcut
   * Requirement 8.6: ? to show keyboard shortcuts help
   */
  const handleHelpShortcut = useCallback(() => {
    setShowKeyboardShortcutsModal(true);
  }, []);

  // Define keyboard shortcuts - Requirement 8.6
  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrl: true,
      description: 'Save SOAP notes',
      action: handleSaveShortcut,
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Add prescription',
      action: handleAddPrescriptionShortcut,
    },
    {
      key: 'l',
      ctrl: true,
      description: 'Add lab order',
      action: handleAddLabOrderShortcut,
    },
    {
      key: 'Enter',
      ctrl: true,
      description: 'Complete consultation',
      action: handleCompleteShortcut,
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts help',
      action: handleHelpShortcut,
    },
  ];

  // Enable keyboard shortcuts - Requirement 8.6
  useKeyboardShortcuts(keyboardShortcuts, true);

  // Sync form data with consultation store - Requirement 6.6
  useEffect(() => {
    setSoapNote({
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
    });
  }, [data.subjective, data.objective, data.assessment, data.plan, setSoapNote]);

  // flash messages
  useEffect(() => {
    if (props.flash?.success) {
      toast({
        title: "Success",
        description: props.flash.success,
        variant: "default",
      });
    }
    if (props.flash?.error) {
      toast({
        title: "Error",
        description: props.flash.error,
        variant: "destructive",
      });
    }
  }, [props.flash, toast]);

  // -----------------------------
  // 1) LOAD DEFAULT DRUGS ON MOUNT
  // -----------------------------
  useEffect(() => {
    // show all drugs by default (or first page of them)
    const loadInitialDrugs = async () => {
      try {
        setLoadingDrugs(true);
        const res = await fetch("/inpatient/api/search-formulary-drugs");
        if (res.ok) {
          const json = await res.json();
          setDrugSuggestions(json);
        }
      } catch (err) {
        console.error("Failed to load default formulary:", err);
      } finally {
        setLoadingDrugs(false);
      }
    };
    loadInitialDrugs();
  }, []);

  // -----------------------------
  // 2) DEBOUNCED SEARCH
  // -----------------------------
  const debouncedSearch = useCallback(
    (() => {
      let timer: number | undefined;
      return (term: string) => {
        if (timer) {
          window.clearTimeout(timer);
        }
        timer = window.setTimeout(async () => {
          // if less than 2 chars → show base list (don’t filter too hard)
          if (term.trim().length < 2) {
            // just leave existing list
            setShowSuggestions(true);
            setHighlightedIndex(-1);
            return;
          }

          try {
            setLoadingDrugs(true);
            const res = await fetch(
              `/inpatient/api/search-formulary-drugs?q=${encodeURIComponent(term)}`
            );
            if (res.ok) {
              const json = await res.json();
              setDrugSuggestions(json);
              setShowSuggestions(true);
              setHighlightedIndex(json.length ? 0 : -1);
            }
          } catch (error) {
            console.error("Formulary search failed:", error);
          } finally {
            setLoadingDrugs(false);
          }
        }, 300);
      };
    })(),
    []
  );

  // -----------------------------
  // 3) HANDLE DRUG INPUT CHANGE
  // -----------------------------
  const handleDrugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDrugSearch(value);
    setSelectedDrug(null); // user is changing text manually
    
    // If user clears the input, show all drugs again
    if (value.trim() === "") {
      setShowSuggestions(true);
      // Reload default drugs
      fetch("/inpatient/api/search-formulary-drugs")
        .then(res => res.json())
        .then(json => setDrugSuggestions(json))
        .catch(err => console.error("Failed to reload drugs:", err));
    } else {
      setShowSuggestions(true);
      debouncedSearch(value);
    }
  };

  // -----------------------------
  // 4) HANDLE DRUG SELECT (CLICK)
  // -----------------------------
  const handleDrugSelect = (drug: DrugFormulary) => {
    handleDrugSelectForForm(drug);
    setHighlightedIndex(-1);
  };

  // keyboard navigation
  const handleDrugInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || drugSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < drugSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : drugSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < drugSuggestions.length) {
        handleDrugSelect(drugSuggestions[highlightedIndex]);
      } else if (drugSuggestions.length === 1) {
        handleDrugSelect(drugSuggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------
  // HELPERS
  // -----------------------------
  const buildDrugDisplayName = (drug: DrugFormulary) => {
    // prefer generic + strength + (form)
    const parts = [
      drug.generic_name || drug.name,
      drug.strength ? drug.strength : "",
      drug.form ? `(${drug.form})` : "",
    ].filter(Boolean);
    return parts.join(" ");
  };

  // -----------------------------
  // SAVE SOAP
  // -----------------------------
  const handleSave = () => {
    post(`/opd/appointments/${appointment.id}/soap`);
  };

  // -----------------------------
  // PRESCRIPTION MANAGEMENT - Requirements 2.4, 2.5, 6.1, 6.3
  // -----------------------------
  
  /**
   * Handle prescription save from PrescriptionForm
   * Requirement 2.4, 2.5: Create prescription with validation
   */
  const handleSavePrescription = async (prescriptionData: any) => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
      
      const response = await fetch(`/api/opd/appointments/${appointment.id}/prescriptions`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(prescriptionData),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON - likely an authentication redirect
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed to save prescription",
          description: result.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      // Add new prescription to list - Requirement 6.1
      setPrescriptions([...prescriptions, result.data]);
      
      // Reset form state
      setShowPrescriptionForm(false);
      setSelectedDrug(null);
      setDrugSearch("");
      
      toast({
        title: "Prescription saved",
        description: "Prescription has been added to the consultation",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to save prescription:", error);
      toast({
        title: "Error",
        description: "Failed to save prescription. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle prescription edit
   * Requirement 6.3: Allow editing prescriptions before completion
   */
  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    // Find the drug in suggestions or fetch it
    const drug = drugSuggestions.find(d => d.id === prescription.drug_id);
    if (drug) {
      setSelectedDrug(drug);
      setDrugSearch(buildDrugDisplayName(drug));
    }
    setShowPrescriptionForm(true);
  };

  /**
   * Handle prescription delete
   * Requirement 6.5: Delete prescription and release reserved stock
   */
  const handleDeletePrescription = async (prescriptionId: number) => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
      
      const response = await fetch(`/api/opd/appointments/${appointment.id}/prescriptions/${prescriptionId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON - likely an authentication redirect
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed to delete prescription",
          description: result.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      // Remove prescription from list
      setPrescriptions(prescriptions.filter(p => p.id !== prescriptionId));
      
      toast({
        title: "Prescription deleted",
        description: "Prescription has been removed and stock released",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete prescription:", error);
      toast({
        title: "Error",
        description: "Failed to delete prescription. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle drug selection from search
   * Requirement 2.1, 2.2: Drug formulary search
   */
  const handleDrugSelectForForm = (drug: DrugFormulary) => {
    setSelectedDrug(drug);
    setDrugSearch(buildDrugDisplayName(drug));
    setShowSuggestions(false);
    setShowPrescriptionForm(true);
  };

  // -----------------------------
  // LAB ORDER MANAGEMENT - Requirements 4.1, 4.2, 4.3, 6.2, 6.4
  // -----------------------------

  /**
   * Handle test selection from search
   * Requirement 4.1: Lab test search
   */
  const handleTestSelect = (test: TestCatalog) => {
    setSelectedTest(test);
    setShowLabOrderForm(true);
  };

  /**
   * Handle lab order save
   * Requirement 4.2: Create lab order with priority
   */
  const handleSaveLabOrder = async (labOrderData: any) => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
      
      const response = await fetch(`/api/opd/appointments/${appointment.id}/lab-orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(labOrderData),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON - likely an authentication redirect
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed to save lab order",
          description: result.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      // Add new lab order to list - Requirement 6.2
      setLabOrders([...labOrders, result.data]);
      
      // Reset form state
      setShowLabOrderForm(false);
      setSelectedTest(null);
      
      toast({
        title: "Lab order saved",
        description: "Lab order has been added to the consultation",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to save lab order:", error);
      toast({
        title: "Error",
        description: "Failed to save lab order. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle lab order edit
   * Requirement 6.4: Allow editing lab orders before completion
   */
  const handleEditLabOrder = (labOrder: LabOrder) => {
    setEditingLabOrder(labOrder);
    // Find the test in catalog or create a mock test object
    const test: TestCatalog = {
      id: labOrder.test_id,
      name: labOrder.test_name,
      code: '',
      price: 0,
      turnaround_time: 24,
      status: 'active',
    };
    setSelectedTest(test);
    setShowLabOrderForm(true);
  };

  /**
   * Handle lab order delete
   * Requirement 6.4: Delete lab order
   */
  const handleDeleteLabOrder = async (labOrderId: number) => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
      
      const response = await fetch(`/api/opd/appointments/${appointment.id}/lab-orders/${labOrderId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON - likely an authentication redirect
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed to delete lab order",
          description: result.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      // Remove lab order from list
      setLabOrders(labOrders.filter(l => l.id !== labOrderId));
      
      toast({
        title: "Lab order deleted",
        description: "Lab order has been removed from the consultation",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete lab order:", error);
      toast({
        title: "Error",
        description: "Failed to delete lab order. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  // -----------------------------
  // COMPLETE CONSULTATION - Requirements 5.1, 5.2, 5.3, 5.4, 5.5
  // -----------------------------
  
  /**
   * Handle completion button click
   * Requirement 5.1: Display summary before completion
   */
  const handleCompleteClick = () => {
    setShowCompletionModal(true);
  };

  /**
   * Handle consultation completion confirmation
   * Requirements 5.1, 5.2, 5.3, 5.4, 5.5:
   * - Display summary of all prescriptions and lab orders (5.1)
   * - Confirm stock reservation and create dispensation records for instant dispensing (5.2)
   * - Submit all lab orders to laboratory system with priority levels (5.3)
   * - Create billing items for all prescriptions and lab tests (5.4)
   * - Prevent further modifications after completion (5.5)
   */
  const handleConfirmComplete = async () => {
    setCompleting(true);

    try {
      // Force save any pending changes before completing - Requirement 6.6
      await forceSave();

      // 1) Save SOAP notes first
      await new Promise<void>((resolve, reject) => {
        post(`/opd/appointments/${appointment.id}/soap`, {
          onSuccess: () => resolve(),
          onError: (errors) => reject(errors),
        });
      });

      // 2) Complete consultation via new API endpoint
      // This handles instant dispensing, lab order submission, and billing
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
      
      const response = await fetch(`/api/opd/appointments/${appointment.id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to complete consultation");
      }

      // Success - close modal and show success message
      setShowCompletionModal(false);
      
      toast({
        title: "✅ Consultation Completed",
        description: `Successfully processed ${result.data.summary.prescriptions_processed} prescriptions and ${result.data.summary.lab_orders_submitted} lab orders.`,
        variant: "default",
      });

      // Redirect to consultations list after a short delay
      setTimeout(() => {
        router.visit("/opd/consultations");
      }, 1500);

    } catch (error: any) {
      console.error("Error completing consultation:", error);
      
      toast({
        title: "❌ Completion Failed",
        description: error.message || "Failed to complete the consultation. Please try again.",
        variant: "destructive",
      });
      
      setCompleting(false);
      setShowCompletionModal(false);
    }
  };

  return (
    <HMSLayout user={auth.user}>
      <Head
        title={`SOAP Notes - ${appointment.patient.first_name} ${appointment.patient.last_name}`}
      />

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  SOAP Notes
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-600">
                    {appointment.patient.first_name}{" "}
                    {appointment.patient.last_name} -{" "}
                    {appointment.appointment_number}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      appointment.type === "opd"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {appointment.type === "opd" ? "Walk-in" : "Scheduled"}
                  </span>
                  {/* Emergency Status Badge - Requirements 1.1, 1.2 */}
                  {emergencyData && (
                    <EmergencyStatusBadge
                      emergencyData={emergencyData}
                      triageAssessment={triageAssessment}
                    />
                  )}
                </div>
                {/* Auto-save status indicator - Requirement 6.6 */}
                <div className="mt-2">
                  <ConsultationStateIndicator />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                <button
                  onClick={() => setShowKeyboardShortcutsModal(true)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  title="Keyboard Shortcuts (Press ?)"
                >
                  <span className="text-lg">⌨️</span>
                  <span className="hidden sm:inline">Shortcuts</span>
                </button>
                <button
                  onClick={() => {
                    // Scroll to prescription section and focus on drug search
                    const prescriptionSection = document.querySelector('[data-prescription-section]');
                    if (prescriptionSection) {
                      prescriptionSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Focus on drug search input after scroll
                      setTimeout(() => {
                        const drugInput = document.querySelector('[data-drug-search-input]') as HTMLInputElement;
                        if (drugInput) {
                          drugInput.focus();
                        }
                      }, 500);
                    }
                  }}
                  disabled={isConsultationCompleted}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  title="Prescribe medication for this patient"
                >
                  <span className="text-lg">💊</span>
                  <span>Prescribe</span>
                </button>
                <button
                  onClick={() => {
                    // Scroll to lab section
                    const labSection = document.querySelector('[data-lab-section]');
                    if (labSection) {
                      labSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Focus on lab search after scroll
                      setTimeout(() => {
                        const labInput = document.querySelector('[data-lab-search-input]') as HTMLInputElement;
                        if (labInput) {
                          labInput.focus();
                        }
                      }, 500);
                    }
                  }}
                  disabled={isConsultationCompleted}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  title="Order lab tests for this patient"
                >
                  <span className="text-lg">🧪</span>
                  <span>Order Tests</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {processing ? "Saving..." : "Save Notes"}
                </button>
                <button
                  onClick={handleCompleteClick}
                  disabled={processing || completing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {completing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Completing...
                    </>
                  ) : (
                    <>✅ Complete Consultation</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Patient
                </label>
                <p className="text-gray-900">
                  {appointment.patient.first_name}{" "}
                  {appointment.patient.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Doctor
                </label>
                <p className="text-gray-900">
                  {appointment.doctor?.name || "Not assigned"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Chief Complaint
                </label>
                <p className="text-gray-900">
                  {appointment.chief_complaint || "General consultation"}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Context Panel - Requirements 1.3, 1.4, 1.5, 1.6 */}
          {emergencyData && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🚨</span>
                </div>
                <h2 className="text-xl font-bold text-red-900">
                  Emergency Patient Context
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Chief Complaint - Requirement 1.3 */}
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <label className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                    Emergency Chief Complaint
                  </label>
                  <p className="text-gray-900 mt-2 font-medium">
                    {emergencyData.chief_complaint}
                  </p>
                  {emergencyData.history_of_present_illness && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {emergencyData.history_of_present_illness}
                    </p>
                  )}
                </div>

                {/* Arrival Information - Requirement 1.4 */}
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <label className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                    Arrival Information
                  </label>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-xs text-gray-600">Arrival Time:</span>
                      <p className="text-gray-900 font-medium">
                        {new Date(emergencyData.arrival_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Mode of Arrival:</span>
                      <p className="text-gray-900 font-medium">
                        {emergencyData.arrival_mode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Triage Vitals - Requirement 1.5 */}
                {triageAssessment && (
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <label className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                      Triage Vital Signs
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      {triageAssessment.temperature && (
                        <div>
                          <span className="text-gray-600">Temp:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {triageAssessment.temperature}°C
                          </span>
                        </div>
                      )}
                      {triageAssessment.blood_pressure && (
                        <div>
                          <span className="text-gray-600">BP:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {triageAssessment.blood_pressure}
                          </span>
                        </div>
                      )}
                      {triageAssessment.heart_rate && (
                        <div>
                          <span className="text-gray-600">HR:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {triageAssessment.heart_rate} bpm
                          </span>
                        </div>
                      )}
                      {triageAssessment.respiratory_rate && (
                        <div>
                          <span className="text-gray-600">RR:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {triageAssessment.respiratory_rate} /min
                          </span>
                        </div>
                      )}
                      {triageAssessment.oxygen_saturation && (
                        <div>
                          <span className="text-gray-600">SpO2:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {triageAssessment.oxygen_saturation}%
                          </span>
                        </div>
                      )}
                      {triageAssessment.gcs_total && (
                        <div>
                          <span className="text-gray-600">GCS:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {triageAssessment.gcs_total}/15
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Triage Assessment Notes - Requirement 1.6 */}
                {triageAssessment?.assessment_notes && (
                  <div className="bg-white rounded-lg p-4 border border-red-200 md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                      Triage Assessment Notes
                    </label>
                    <p className="text-gray-900 mt-2">
                      {triageAssessment.assessment_notes}
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      Assessed at: {new Date(triageAssessment.assessed_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SOAP Notes Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Subjective */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjective (Patient&apos;s History & Symptoms)
                </label>
                <textarea
                  value={data.subjective}
                  onChange={(e) => setData("subjective", e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Patient reports..."
                />
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objective (Physical Examination & Vital Signs)
                </label>
                <textarea
                  value={data.objective}
                  onChange={(e) => setData("objective", e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Physical examination reveals..."
                />
              </div>

              {/* Assessment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment (Diagnosis & Clinical Impression)
                </label>
                <textarea
                  value={data.assessment}
                  onChange={(e) => setData("assessment", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Primary diagnosis..."
                />
              </div>

              {/* Plan + Prescription */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan (Treatment & Follow-up)
                </label>
                <textarea
                  value={data.plan}
                  onChange={(e) => setData("plan", e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Treatment plan and recommendations..."
                />

                {/* 💊 Prescription Section - Requirements 2.1, 2.2, 2.3, 6.1, 6.3 */}
                <div className="pt-6 border-t border-gray-200 mt-6" data-prescription-section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    💊 Prescription Management
                    {loadingDrugs && (
                      <span className="text-xs text-gray-400">
                        loading formulary...
                      </span>
                    )}
                  </h2>

                  {/* Drug Search - Requirements 2.1, 2.2, 2.3 */}
                  {!showPrescriptionForm && !isConsultationCompleted && (
                    <div className="mb-6">
                      <div className="relative">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Search Drug Formulary
                        </label>
                        <input
                          ref={inputRef}
                          type="text"
                          data-drug-search-input
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type to search drugs by name, generic name, or ATC code..."
                          value={drugSearch}
                          onChange={handleDrugInputChange}
                          onFocus={() => {
                            setShowSuggestions(true);
                          }}
                          onKeyDown={handleDrugInputKeyDown}
                        />

                        {showSuggestions && (
                          <div
                            ref={suggestionBoxRef}
                            className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
                          >
                            {loadingDrugs ? (
                              <div className="px-3 py-3 text-sm text-gray-500 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                Searching...
                              </div>
                            ) : drugSuggestions.length === 0 ? (
                              <div className="px-3 py-3 text-sm text-gray-500">
                                {drugSearch.trim().length > 0 
                                  ? `No drugs found matching "${drugSearch}"`
                                  : "No drugs available in formulary"}
                              </div>
                            ) : (
                              <>
                                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                                  {drugSuggestions.length} drug{drugSuggestions.length !== 1 ? 's' : ''} found
                                </div>
                                {drugSuggestions.map((drug, idx) => {
                                  const isHighlighted = idx === highlightedIndex;
                                  
                                  // Stock status badge configuration - Requirement 2.3
                                  const stockBadgeConfig = {
                                    in_stock: { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: '✓' },
                                    low_stock: { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: '⚠' },
                                    out_of_stock: { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: '✗' },
                                  };
                                  
                                  const stockConfig = drug.stock_status 
                                    ? stockBadgeConfig[drug.stock_status] 
                                    : null;
                                  
                                  return (
                                    <div
                                      key={drug.id}
                                      onClick={() => handleDrugSelect(drug)}
                                      className={`px-3 py-2 cursor-pointer transition-colors ${
                                        isHighlighted
                                          ? "bg-blue-50 border-l-2 border-blue-500"
                                          : "hover:bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-gray-900">
                                            {buildDrugDisplayName(drug)}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {drug.brand_name
                                              ? `Brand: ${drug.brand_name}`
                                              : ""}
                                            {drug.unit_price
                                              ? ` • KES ${drug.unit_price}`
                                              : ""}
                                          </div>
                                        </div>
                                        {/* Stock availability indicator - Requirement 2.3 */}
                                        {stockConfig && (
                                          <div className="flex items-center gap-1">
                                            <span 
                                              className={`px-2 py-1 text-xs font-medium rounded-full ${stockConfig.color} flex items-center gap-1`}
                                              title={`${drug.stock_quantity || 0} units available`}
                                            >
                                              <span>{stockConfig.icon}</span>
                                              <span className="hidden sm:inline">{stockConfig.label}</span>
                                            </span>
                                            {drug.stock_quantity !== undefined && (
                                              <span className="text-xs text-gray-500 ml-1">
                                                ({drug.stock_quantity})
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription Form - Requirements 2.4, 2.5, 2.6, 2.7, 3.1, 3.4 */}
                  {showPrescriptionForm && selectedDrug && (
                    <div className="mb-6">
                      <PrescriptionForm
                        drug={selectedDrug}
                        patient={appointment.patient as any}
                        isEmergencyPatient={isEmergencyPatient}
                        appointmentId={appointment.id}
                        onSave={handleSavePrescription}
                        onCancel={() => {
                          setShowPrescriptionForm(false);
                          setSelectedDrug(null);
                          setDrugSearch("");
                          setEditingPrescription(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Prescription List - Requirements 6.1, 6.3 */}
                  <div className="mt-6">
                    <PrescriptionList
                      prescriptions={prescriptions}
                      isConsultationCompleted={isConsultationCompleted}
                      onEdit={handleEditPrescription}
                      onDelete={handleDeletePrescription}
                    />
                  </div>
                </div>

                {/* 🧪 Lab Order Section - Requirements 4.1, 4.2, 4.3, 6.2, 6.4 */}
                <div className="pt-6 border-t border-gray-200 mt-6" data-lab-section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    🧪 Laboratory Tests
                  </h2>

                  {/* Lab Test Search - Requirements 4.1, 4.3 */}
                  {!showLabOrderForm && !isConsultationCompleted && (
                    <div className="mb-6">
                      <LabTestSearch
                        onSelect={handleTestSelect}
                      />
                    </div>
                  )}

                  {/* Lab Order Form - Requirements 4.2, 4.3 */}
                  {showLabOrderForm && selectedTest && (
                    <div className="mb-6">
                      <LabOrderForm
                        test={selectedTest}
                        onSave={handleSaveLabOrder}
                        onCancel={() => {
                          setShowLabOrderForm(false);
                          setSelectedTest(null);
                          setEditingLabOrder(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Lab Order List - Requirements 6.2, 6.4 */}
                  <div className="mt-6">
                    <LabOrderList
                      labOrders={labOrders}
                      isConsultationCompleted={isConsultationCompleted}
                      onEdit={handleEditLabOrder}
                      onDelete={handleDeleteLabOrder}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Summary Modal - Requirements 5.1, 5.2, 5.3, 5.4, 5.5 */}
      <CompletionSummaryModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={handleConfirmComplete}
        prescriptions={prescriptions}
        labOrders={labOrders}
        isLoading={completing}
      />

      {/* Keyboard Shortcuts Help Modal - Requirement 8.6 */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcutsModal}
        onClose={() => setShowKeyboardShortcutsModal(false)}
        shortcuts={keyboardShortcuts}
      />
    </HMSLayout>
  );
}
