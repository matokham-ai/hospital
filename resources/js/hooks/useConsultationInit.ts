import { useEffect } from 'react';
import { useConsultationStore } from '@/stores/consultationStore';
import type { EmergencyPatient, TriageAssessment } from '@/types';

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

interface UseConsultationInitProps {
  appointment: Appointment;
  soapNote?: SoapNote;
  emergencyData?: EmergencyPatient;
  triageAssessment?: TriageAssessment;
  prescriptions?: Prescription[];
  labOrders?: LabOrder[];
}

/**
 * Hook to initialize the consultation store with server data
 * This should be called once when the consultation page loads
 * Requirement 6.6: Initialize consultation state
 */
export function useConsultationInit({
  appointment,
  soapNote,
  emergencyData,
  triageAssessment,
  prescriptions = [],
  labOrders = [],
}: UseConsultationInitProps) {
  const {
    setAppointment,
    setPatient,
    setEmergencyData,
    setSoapNote,
    setPrescriptions,
    setLabOrders,
    reset,
  } = useConsultationStore();

  useEffect(() => {
    // Initialize store with server data
    setAppointment(appointment);
    setPatient(appointment.patient);
    
    if (emergencyData) {
      setEmergencyData(emergencyData, triageAssessment);
    }
    
    if (soapNote) {
      setSoapNote(soapNote);
    }
    
    setPrescriptions(prescriptions);
    setLabOrders(labOrders);

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [
    appointment,
    soapNote,
    emergencyData,
    triageAssessment,
    prescriptions,
    labOrders,
    setAppointment,
    setPatient,
    setEmergencyData,
    setSoapNote,
    setPrescriptions,
    setLabOrders,
    reset,
  ]);
}
