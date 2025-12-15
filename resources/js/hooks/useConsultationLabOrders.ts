import { useConsultationStore } from '@/stores/consultationStore';

/**
 * Hook to access and manage lab order state
 * Requirement 6.6: Manage lab orders in consultation state
 */
export function useConsultationLabOrders() {
  const labOrders = useConsultationStore((state) => state.labOrders);
  const addLabOrder = useConsultationStore((state) => state.addLabOrder);
  const updateLabOrder = useConsultationStore((state) => state.updateLabOrder);
  const removeLabOrder = useConsultationStore((state) => state.removeLabOrder);
  const setLabOrders = useConsultationStore((state) => state.setLabOrders);

  return {
    labOrders,
    addLabOrder,
    updateLabOrder,
    removeLabOrder,
    setLabOrders,
  };
}
