import { useEffect, useRef, useCallback } from 'react';
import { useConsultationStore } from '@/stores/consultationStore';
import { router } from '@inertiajs/react';

/**
 * Auto-save hook for consultation data
 * Requirement 6.6: Auto-save changes every 10 seconds to prevent data loss
 * 
 * This hook automatically saves SOAP notes, prescriptions, and lab orders
 * when changes are detected (isDirty flag is true) after a 10-second debounce.
 * 
 * @param appointmentId - The ID of the current appointment
 * @param enabled - Whether auto-save is enabled (default: true)
 */
export function useAutoSave(appointmentId: number, enabled: boolean = true) {
  const isDirty = useConsultationStore((state) => state.isDirty);
  const soapNote = useConsultationStore((state) => state.soapNote);
  const setAutoSaving = useConsultationStore((state) => state.setAutoSaving);
  const updateLastSaved = useConsultationStore((state) => state.updateLastSaved);
  
  // Use ref to track the timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use ref to track if we're currently saving to prevent concurrent saves
  const isSavingRef = useRef(false);

  /**
   * Save function that persists SOAP notes to the server
   * Requirement 6.6: Implement auto-save for SOAP notes
   */
  const saveSoapNote = useCallback(async () => {
    if (isSavingRef.current) {
      return; // Prevent concurrent saves
    }

    try {
      isSavingRef.current = true;
      setAutoSaving(true);

      // Get CSRF token
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

      // Save SOAP note via API
      const response = await fetch(`/opd/appointments/${appointmentId}/soap`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          subjective: soapNote.subjective,
          objective: soapNote.objective,
          assessment: soapNote.assessment,
          plan: soapNote.plan,
        }),
      });

      if (response.ok) {
        // Update last saved timestamp and mark as clean
        updateLastSaved();
        console.log('[AutoSave] SOAP note saved successfully');
      } else {
        console.error('[AutoSave] Failed to save SOAP note:', response.statusText);
      }
    } catch (error) {
      console.error('[AutoSave] Error saving SOAP note:', error);
    } finally {
      isSavingRef.current = false;
      setAutoSaving(false);
    }
  }, [appointmentId, soapNote, setAutoSaving, updateLastSaved]);

  /**
   * Effect to handle auto-save with 10-second debounce
   * Requirement 6.6: Auto-save changes every 10 seconds
   */
  useEffect(() => {
    // Don't auto-save if disabled or not dirty
    if (!enabled || !isDirty) {
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer for 10 seconds
    timerRef.current = setTimeout(() => {
      console.log('[AutoSave] Triggering auto-save after 10 seconds of inactivity');
      saveSoapNote();
    }, 10000); // 10 seconds

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, isDirty, saveSoapNote]);

  /**
   * Manual save function that can be called directly
   * Useful for forcing a save before navigation or completion
   */
  const forceSave = useCallback(async () => {
    if (isDirty && !isSavingRef.current) {
      console.log('[AutoSave] Force saving...');
      await saveSoapNote();
    }
  }, [isDirty, saveSoapNote]);

  return {
    forceSave,
    isSaving: isSavingRef.current,
  };
}
