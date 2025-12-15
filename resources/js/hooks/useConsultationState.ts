import { useConsultationStore } from '@/stores/consultationStore';

/**
 * Hook to access consultation state tracking
 * Requirement 6.6: Track unsaved changes and last saved timestamp
 */
export function useConsultationState() {
  const isDirty = useConsultationStore((state) => state.isDirty);
  const lastSaved = useConsultationStore((state) => state.lastSaved);
  const isAutoSaving = useConsultationStore((state) => state.isAutoSaving);
  const markDirty = useConsultationStore((state) => state.markDirty);
  const markClean = useConsultationStore((state) => state.markClean);
  const updateLastSaved = useConsultationStore((state) => state.updateLastSaved);
  const setAutoSaving = useConsultationStore((state) => state.setAutoSaving);

  return {
    isDirty,
    lastSaved,
    isAutoSaving,
    markDirty,
    markClean,
    updateLastSaved,
    setAutoSaving,
  };
}
