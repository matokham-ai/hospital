import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../../resources/js/hooks/useAutoSave';
import { useConsultationStore } from '../../resources/js/stores/consultationStore';

// Mock fetch
global.fetch = vi.fn();

// Mock CSRF token
const mockCsrfToken = 'test-csrf-token';
document.querySelector = vi.fn((selector: string) => {
  if (selector === 'meta[name="csrf-token"]') {
    return {
      getAttribute: () => mockCsrfToken,
    } as any;
  }
  return null;
});

describe('useAutoSave Hook', () => {
  beforeEach(() => {
    // Reset store before each test
    useConsultationStore.getState().reset();
    
    // Reset fetch mock
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Use fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useAutoSave(1, true));
      
      expect(result.current).toBeDefined();
      expect(result.current.forceSave).toBeInstanceOf(Function);
      expect(result.current.isSaving).toBe(false);
    });

    it('should not auto-save when disabled', async () => {
      const { result } = renderHook(() => useAutoSave(1, false));
      
      // Mark as dirty
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      });

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should not have called fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save after 10 seconds when dirty', async () => {
      const appointmentId = 123;
      const { result } = renderHook(() => useAutoSave(appointmentId, true));
      
      // Set SOAP note data
      act(() => {
        useConsultationStore.getState().setSoapNote({
          subjective: 'Patient complains of headache',
          objective: 'BP: 120/80',
          assessment: 'Tension headache',
          plan: 'Prescribe paracetamol',
        });
      });

      // Verify store is dirty
      expect(useConsultationStore.getState().isDirty).toBe(true);

      // Fast-forward time by 10 seconds and run all timers
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Run all pending promises
      await act(async () => {
        await Promise.resolve();
      });

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/opd/appointments/${appointmentId}/soap`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': mockCsrfToken,
          }),
          body: JSON.stringify({
            subjective: 'Patient complains of headache',
            objective: 'BP: 120/80',
            assessment: 'Tension headache',
            plan: 'Prescribe paracetamol',
          }),
        })
      );
    }, 10000);

    it('should not auto-save when not dirty', async () => {
      const { result } = renderHook(() => useAutoSave(1, true));
      
      // Don't mark as dirty
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should not have called fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should debounce multiple changes within 10 seconds', async () => {
      const appointmentId = 456;
      const { result } = renderHook(() => useAutoSave(appointmentId, true));
      
      // Make multiple changes
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Change 1' });
      });

      act(() => {
        vi.advanceTimersByTime(5000); // 5 seconds
      });

      act(() => {
        useConsultationStore.getState().setSoapNote({ objective: 'Change 2' });
      });

      act(() => {
        vi.advanceTimersByTime(5000); // Another 5 seconds
      });

      act(() => {
        useConsultationStore.getState().setSoapNote({ assessment: 'Change 3' });
      });

      // Fast-forward final 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Run all pending promises
      await act(async () => {
        await Promise.resolve();
      });

      // Should only save once with the latest data
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `/opd/appointments/${appointmentId}/soap`,
        expect.objectContaining({
          body: JSON.stringify({
            subjective: 'Change 1',
            objective: 'Change 2',
            assessment: 'Change 3',
            plan: '',
          }),
        })
      );
    }, 10000);

    it('should update store state after successful save', async () => {
      const { result } = renderHook(() => useAutoSave(1, true));
      
      // Set SOAP note
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      });

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Run all pending promises
      await act(async () => {
        await Promise.resolve();
      });

      // Verify save completed
      const state = useConsultationStore.getState();
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).not.toBeNull();
    }, 10000);

    it('should set auto-saving flag during save', async () => {
      const { result } = renderHook(() => useAutoSave(1, true));
      
      let resolvePromise: any;
      const slowFetch = new Promise(resolve => {
        resolvePromise = resolve;
      });

      // Mock a slow fetch
      (global.fetch as any).mockImplementation(() => slowFetch);

      // Set SOAP note
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      });

      // Fast-forward to trigger save
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Run pending promises to start the save
      await act(async () => {
        await Promise.resolve();
      });

      // Check that auto-saving flag is set
      expect(useConsultationStore.getState().isAutoSaving).toBe(true);

      // Complete the save
      await act(async () => {
        resolvePromise({ ok: true });
        await slowFetch;
      });

      // Check that auto-saving flag is cleared
      expect(useConsultationStore.getState().isAutoSaving).toBe(false);
    }, 10000);
  });

  describe('Force Save', () => {
    it('should force save immediately when called', async () => {
      const appointmentId = 789;
      const { result } = renderHook(() => useAutoSave(appointmentId, true));
      
      // Set SOAP note
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Force save test' });
      });

      // Call force save
      await act(async () => {
        await result.current.forceSave();
      });

      // Should have called fetch immediately
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `/opd/appointments/${appointmentId}/soap`,
        expect.objectContaining({
          body: JSON.stringify({
            subjective: 'Force save test',
            objective: '',
            assessment: '',
            plan: '',
          }),
        })
      );
    });

    it('should not force save when not dirty', async () => {
      const { result } = renderHook(() => useAutoSave(1, true));
      
      // Don't mark as dirty
      
      // Call force save
      await act(async () => {
        await result.current.forceSave();
      });

      // Should not have called fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should prevent concurrent saves', async () => {
      const { result } = renderHook(() => useAutoSave(1, true));
      
      let resolveCount = 0;
      let resolvers: any[] = [];

      // Mock a slow fetch that we can control
      (global.fetch as any).mockImplementation(() => {
        return new Promise(resolve => {
          resolvers.push(() => {
            resolveCount++;
            resolve({ ok: true });
          });
        });
      });

      // Set SOAP note
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      });

      // Call force save multiple times concurrently
      const promise1 = result.current.forceSave();
      const promise2 = result.current.forceSave();
      const promise3 = result.current.forceSave();

      // Wait a bit for all calls to be processed
      await act(async () => {
        await Promise.resolve();
      });

      // Resolve all pending fetches
      for (const resolver of resolvers) {
        await act(async () => {
          resolver();
        });
      }

      await Promise.all([promise1, promise2, promise3]);

      // Should only have called fetch once (concurrent calls prevented)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock fetch to fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAutoSave(1, true));
      
      // Set SOAP note
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      });

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Run all pending promises
      await act(async () => {
        await Promise.resolve();
      });

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Should clear auto-saving flag even on error
      expect(useConsultationStore.getState().isAutoSaving).toBe(false);

      consoleErrorSpy.mockRestore();
    }, 10000);

    it('should handle non-ok response', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock fetch to return error response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useAutoSave(1, true));
      
      // Set SOAP note
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      });

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Run all pending promises
      await act(async () => {
        await Promise.resolve();
      });

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Should not update lastSaved on error
      expect(useConsultationStore.getState().lastSaved).toBeNull();

      consoleErrorSpy.mockRestore();
    }, 10000);
  });

  describe('Cleanup', () => {
    it('should clear timer on unmount', () => {
      const { unmount } = renderHook(() => useAutoSave(1, true));
      
      // Set SOAP note
      act(() => {
        useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      });

      // Unmount before timer fires
      unmount();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should not have called fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
