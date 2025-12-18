import { useConsultationStore } from '@/stores/consultationStore';

/**
 * Hook to access and manage prescription state
 * Requirement 6.6: Manage prescriptions in consultation state
 */
export function useConsultationPrescriptions() {
  const prescriptions = useConsultationStore((state) => state.prescriptions);
  const addPrescription = useConsultationStore((state) => state.addPrescription);
  const updatePrescription = useConsultationStore((state) => state.updatePrescription);
  const removePrescription = useConsultationStore((state) => state.removePrescription);
  const setPrescriptions = useConsultationStore((state) => state.setPrescriptions);

  return {
    prescriptions,
    addPrescription,
    updatePrescription,
    removePrescription,
    setPrescriptions,
  };
}
