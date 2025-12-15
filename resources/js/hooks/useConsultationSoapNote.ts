import { useConsultationStore } from '@/stores/consultationStore';

/**
 * Hook to access and manage SOAP note state
 * Requirement 6.6: Manage SOAP note in consultation state
 */
export function useConsultationSoapNote() {
  const soapNote = useConsultationStore((state) => state.soapNote);
  const setSoapNote = useConsultationStore((state) => state.setSoapNote);

  return {
    soapNote,
    setSoapNote,
  };
}
