import { describe, it, expect, beforeEach } from 'vitest';
import { useConsultationStore } from '../../resources/js/stores/consultationStore';

describe('Consultation Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useConsultationStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useConsultationStore.getState();
      
      expect(state.appointment).toBeNull();
      expect(state.patient).toBeNull();
      expect(state.emergencyData).toBeNull();
      expect(state.triageAssessment).toBeNull();
      expect(state.prescriptions).toEqual([]);
      expect(state.labOrders).toEqual([]);
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
      expect(state.isAutoSaving).toBe(false);
    });

    it('should have initial SOAP note with empty fields', () => {
      const state = useConsultationStore.getState();
      
      expect(state.soapNote).toEqual({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      });
    });
  });

  describe('Appointment Management', () => {
    it('should set appointment', () => {
      const appointment = {
        id: 1,
        appointment_number: 'APT-001',
        patient_id: 1,
        patient: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
        },
        status: 'IN_PROGRESS',
        chief_complaint: 'Headache',
      };

      useConsultationStore.getState().setAppointment(appointment);
      
      expect(useConsultationStore.getState().appointment).toEqual(appointment);
    });

    it('should set patient', () => {
      const patient = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
      };

      useConsultationStore.getState().setPatient(patient);
      
      expect(useConsultationStore.getState().patient).toEqual(patient);
    });
  });

  describe('Emergency Data Management', () => {
    it('should set emergency data', () => {
      const emergencyData = {
        id: 1,
        patient_id: 1,
        chief_complaint: 'Chest pain',
        arrival_mode: 'AMBULANCE',
        arrival_time: '2024-01-01T10:00:00Z',
        status: 'IN_TREATMENT' as const,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      useConsultationStore.getState().setEmergencyData(emergencyData);
      
      expect(useConsultationStore.getState().emergencyData).toEqual(emergencyData);
    });

    it('should set emergency data with triage assessment', () => {
      const emergencyData = {
        id: 1,
        patient_id: 1,
        chief_complaint: 'Chest pain',
        arrival_mode: 'AMBULANCE',
        arrival_time: '2024-01-01T10:00:00Z',
        status: 'IN_TREATMENT' as const,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      const triageAssessment = {
        id: 1,
        emergency_patient_id: 1,
        triage_category: 'CRITICAL' as const,
        temperature: 38.5,
        blood_pressure: '140/90',
        heart_rate: 95,
        assessed_at: '2024-01-01T10:05:00Z',
        created_at: '2024-01-01T10:05:00Z',
        updated_at: '2024-01-01T10:05:00Z',
      };

      useConsultationStore.getState().setEmergencyData(emergencyData, triageAssessment);
      
      expect(useConsultationStore.getState().emergencyData).toEqual(emergencyData);
      expect(useConsultationStore.getState().triageAssessment).toEqual(triageAssessment);
    });
  });

  describe('SOAP Note Management', () => {
    it('should update SOAP note and mark as dirty', () => {
      useConsultationStore.getState().setSoapNote({ subjective: 'Patient complains of headache' });
      
      const state = useConsultationStore.getState();
      expect(state.soapNote.subjective).toBe('Patient complains of headache');
      expect(state.isDirty).toBe(true);
    });

    it('should partially update SOAP note', () => {
      useConsultationStore.getState().setSoapNote({ subjective: 'Subjective data' });
      useConsultationStore.getState().setSoapNote({ objective: 'Objective data' });
      
      const state = useConsultationStore.getState();
      expect(state.soapNote.subjective).toBe('Subjective data');
      expect(state.soapNote.objective).toBe('Objective data');
      expect(state.soapNote.assessment).toBe('');
      expect(state.soapNote.plan).toBe('');
    });
  });

  describe('Prescription Management', () => {
    it('should add prescription and mark as dirty', () => {
      const prescription = {
        id: 1,
        drug_id: 1,
        drug_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'TID',
        duration: 5,
        quantity: 15,
        instant_dispensing: false,
      };

      useConsultationStore.getState().addPrescription(prescription);
      
      const state = useConsultationStore.getState();
      expect(state.prescriptions).toHaveLength(1);
      expect(state.prescriptions[0]).toEqual(prescription);
      expect(state.isDirty).toBe(true);
    });

    it('should update prescription', () => {
      const prescription = {
        id: 1,
        drug_id: 1,
        drug_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'TID',
        duration: 5,
        quantity: 15,
        instant_dispensing: false,
      };

      useConsultationStore.getState().addPrescription(prescription);
      useConsultationStore.getState().updatePrescription(1, { dosage: '1000mg', quantity: 30 });
      
      const state = useConsultationStore.getState();
      expect(state.prescriptions[0].dosage).toBe('1000mg');
      expect(state.prescriptions[0].quantity).toBe(30);
      expect(state.prescriptions[0].frequency).toBe('TID'); // unchanged
    });

    it('should remove prescription', () => {
      const prescription1 = {
        id: 1,
        drug_id: 1,
        drug_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'TID',
        duration: 5,
        quantity: 15,
        instant_dispensing: false,
      };

      const prescription2 = {
        id: 2,
        drug_id: 2,
        drug_name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'BID',
        duration: 3,
        quantity: 6,
        instant_dispensing: false,
      };

      useConsultationStore.getState().addPrescription(prescription1);
      useConsultationStore.getState().addPrescription(prescription2);
      useConsultationStore.getState().removePrescription(1);
      
      const state = useConsultationStore.getState();
      expect(state.prescriptions).toHaveLength(1);
      expect(state.prescriptions[0].id).toBe(2);
    });

    it('should set prescriptions', () => {
      const prescriptions = [
        {
          id: 1,
          drug_id: 1,
          drug_name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'TID',
          duration: 5,
          quantity: 15,
          instant_dispensing: false,
        },
        {
          id: 2,
          drug_id: 2,
          drug_name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'BID',
          duration: 3,
          quantity: 6,
          instant_dispensing: false,
        },
      ];

      useConsultationStore.getState().setPrescriptions(prescriptions);
      
      expect(useConsultationStore.getState().prescriptions).toEqual(prescriptions);
    });
  });

  describe('Lab Order Management', () => {
    it('should add lab order and mark as dirty', () => {
      const labOrder = {
        id: 1,
        test_id: 1,
        test_name: 'Complete Blood Count',
        priority: 'urgent' as const,
        clinical_notes: 'Patient presents with fever',
      };

      useConsultationStore.getState().addLabOrder(labOrder);
      
      const state = useConsultationStore.getState();
      expect(state.labOrders).toHaveLength(1);
      expect(state.labOrders[0]).toEqual(labOrder);
      expect(state.isDirty).toBe(true);
    });

    it('should update lab order', () => {
      const labOrder = {
        id: 1,
        test_id: 1,
        test_name: 'Complete Blood Count',
        priority: 'normal' as const,
      };

      useConsultationStore.getState().addLabOrder(labOrder);
      useConsultationStore.getState().updateLabOrder(1, { priority: 'urgent' });
      
      const state = useConsultationStore.getState();
      expect(state.labOrders[0].priority).toBe('urgent');
    });

    it('should remove lab order', () => {
      const labOrder1 = {
        id: 1,
        test_id: 1,
        test_name: 'Complete Blood Count',
        priority: 'normal' as const,
      };

      const labOrder2 = {
        id: 2,
        test_id: 2,
        test_name: 'Liver Function Test',
        priority: 'fast' as const,
      };

      useConsultationStore.getState().addLabOrder(labOrder1);
      useConsultationStore.getState().addLabOrder(labOrder2);
      useConsultationStore.getState().removeLabOrder(1);
      
      const state = useConsultationStore.getState();
      expect(state.labOrders).toHaveLength(1);
      expect(state.labOrders[0].id).toBe(2);
    });
  });

  describe('State Tracking', () => {
    it('should mark as dirty', () => {
      useConsultationStore.getState().markDirty();
      
      expect(useConsultationStore.getState().isDirty).toBe(true);
    });

    it('should mark as clean', () => {
      useConsultationStore.getState().markDirty();
      useConsultationStore.getState().markClean();
      
      expect(useConsultationStore.getState().isDirty).toBe(false);
    });

    it('should update last saved timestamp and mark as clean', () => {
      const beforeTime = new Date();
      
      useConsultationStore.getState().markDirty();
      useConsultationStore.getState().updateLastSaved();
      
      const state = useConsultationStore.getState();
      const afterTime = new Date();
      
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).not.toBeNull();
      expect(state.lastSaved!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(state.lastSaved!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should set auto-saving state', () => {
      useConsultationStore.getState().setAutoSaving(true);
      expect(useConsultationStore.getState().isAutoSaving).toBe(true);
      
      useConsultationStore.getState().setAutoSaving(false);
      expect(useConsultationStore.getState().isAutoSaving).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should reset all state to initial values', () => {
      // Set up some state
      useConsultationStore.getState().setAppointment({
        id: 1,
        appointment_number: 'APT-001',
        patient_id: 1,
        patient: { id: '1', first_name: 'John', last_name: 'Doe' },
        status: 'IN_PROGRESS',
        chief_complaint: 'Headache',
      });
      useConsultationStore.getState().setSoapNote({ subjective: 'Test' });
      useConsultationStore.getState().addPrescription({
        id: 1,
        drug_id: 1,
        drug_name: 'Test Drug',
        dosage: '500mg',
        frequency: 'TID',
        duration: 5,
        quantity: 15,
        instant_dispensing: false,
      });
      useConsultationStore.getState().markDirty();
      useConsultationStore.getState().updateLastSaved();

      // Reset
      useConsultationStore.getState().reset();

      // Verify reset
      const state = useConsultationStore.getState();
      expect(state.appointment).toBeNull();
      expect(state.patient).toBeNull();
      expect(state.emergencyData).toBeNull();
      expect(state.soapNote).toEqual({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      });
      expect(state.prescriptions).toEqual([]);
      expect(state.labOrders).toEqual([]);
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
      expect(state.isAutoSaving).toBe(false);
    });
  });
});
