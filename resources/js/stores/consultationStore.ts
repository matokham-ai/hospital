import { create } from 'zustand';
import type { EmergencyPatient, TriageAssessment } from '@/types';

// Type definitions for consultation state
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

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  medical_record_number?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
}

interface Appointment {
  id: number;
  type?: "opd" | "regular";
  appointment_number: string;
  patient_id: number;
  patient: Patient;
  doctor?: {
    physician_code: string;
    name: string;
    specialization: string;
  };
  status: string;
  chief_complaint: string;
}

interface SoapNote {
  id?: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vital_signs?: any;
}

// Consultation State Interface - Requirement 6.6
interface ConsultationState {
  // Core data
  appointment: Appointment | null;
  patient: Patient | null;
  emergencyData: EmergencyPatient | null;
  triageAssessment: TriageAssessment | null;
  soapNote: SoapNote;
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  
  // State tracking - Requirement 6.6
  isDirty: boolean;
  lastSaved: Date | null;
  isAutoSaving: boolean;
  
  // Actions
  setAppointment: (appointment: Appointment) => void;
  setPatient: (patient: Patient) => void;
  setEmergencyData: (emergencyData: EmergencyPatient | null, triageAssessment?: TriageAssessment | null) => void;
  setSoapNote: (soapNote: Partial<SoapNote>) => void;
  setPrescriptions: (prescriptions: Prescription[]) => void;
  setLabOrders: (labOrders: LabOrder[]) => void;
  
  // Prescription actions
  addPrescription: (prescription: Prescription) => void;
  updatePrescription: (id: number, prescription: Partial<Prescription>) => void;
  removePrescription: (id: number) => void;
  
  // Lab order actions
  addLabOrder: (labOrder: LabOrder) => void;
  updateLabOrder: (id: number, labOrder: Partial<LabOrder>) => void;
  removeLabOrder: (id: number) => void;
  
  // State management
  markDirty: () => void;
  markClean: () => void;
  updateLastSaved: () => void;
  setAutoSaving: (isAutoSaving: boolean) => void;
  
  // Reset
  reset: () => void;
}

// Initial SOAP note state
const initialSoapNote: SoapNote = {
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};

// Create the consultation store - Requirement 6.6
export const useConsultationStore = create<ConsultationState>((set) => ({
  // Initial state
  appointment: null,
  patient: null,
  emergencyData: null,
  triageAssessment: null,
  soapNote: initialSoapNote,
  prescriptions: [],
  labOrders: [],
  isDirty: false,
  lastSaved: null,
  isAutoSaving: false,
  
  // Core setters
  setAppointment: (appointment) => set({ appointment }),
  
  setPatient: (patient) => set({ patient }),
  
  setEmergencyData: (emergencyData, triageAssessment = null) => 
    set({ emergencyData, triageAssessment }),
  
  setSoapNote: (soapNote) => 
    set((state) => ({ 
      soapNote: { ...state.soapNote, ...soapNote },
      isDirty: true 
    })),
  
  setPrescriptions: (prescriptions) => set({ prescriptions }),
  
  setLabOrders: (labOrders) => set({ labOrders }),
  
  // Prescription actions
  addPrescription: (prescription) => 
    set((state) => ({ 
      prescriptions: [...state.prescriptions, prescription],
      isDirty: true 
    })),
  
  updatePrescription: (id, prescription) => 
    set((state) => ({
      prescriptions: state.prescriptions.map((p) => 
        p.id === id ? { ...p, ...prescription } : p
      ),
      isDirty: true
    })),
  
  removePrescription: (id) => 
    set((state) => ({
      prescriptions: state.prescriptions.filter((p) => p.id !== id),
      isDirty: true
    })),
  
  // Lab order actions
  addLabOrder: (labOrder) => 
    set((state) => ({ 
      labOrders: [...state.labOrders, labOrder],
      isDirty: true 
    })),
  
  updateLabOrder: (id, labOrder) => 
    set((state) => ({
      labOrders: state.labOrders.map((l) => 
        l.id === id ? { ...l, ...labOrder } : l
      ),
      isDirty: true
    })),
  
  removeLabOrder: (id) => 
    set((state) => ({
      labOrders: state.labOrders.filter((l) => l.id !== id),
      isDirty: true
    })),
  
  // State management
  markDirty: () => set({ isDirty: true }),
  
  markClean: () => set({ isDirty: false }),
  
  updateLastSaved: () => set({ lastSaved: new Date(), isDirty: false }),
  
  setAutoSaving: (isAutoSaving) => set({ isAutoSaving }),
  
  // Reset all state
  reset: () => set({
    appointment: null,
    patient: null,
    emergencyData: null,
    triageAssessment: null,
    soapNote: initialSoapNote,
    prescriptions: [],
    labOrders: [],
    isDirty: false,
    lastSaved: null,
    isAutoSaving: false,
  }),
}));
