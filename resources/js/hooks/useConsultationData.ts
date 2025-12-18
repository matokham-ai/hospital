import { useConsultationStore } from '@/stores/consultationStore';

/**
 * Hook to access all consultation data
 * Requirement 6.6: Access appointment, patient, emergency data, SOAP note, prescriptions, lab orders
 */
export function useConsultationData() {
  const appointment = useConsultationStore((state) => state.appointment);
  const patient = useConsultationStore((state) => state.patient);
  const emergencyData = useConsultationStore((state) => state.emergencyData);
  const triageAssessment = useConsultationStore((state) => state.triageAssessment);
  const soapNote = useConsultationStore((state) => state.soapNote);
  const prescriptions = useConsultationStore((state) => state.prescriptions);
  const labOrders = useConsultationStore((state) => state.labOrders);

  // Derived state
  const isEmergencyPatient = !!emergencyData;
  const isConsultationCompleted = appointment?.status === 'COMPLETED';

  return {
    appointment,
    patient,
    emergencyData,
    triageAssessment,
    soapNote,
    prescriptions,
    labOrders,
    isEmergencyPatient,
    isConsultationCompleted,
  };
}
