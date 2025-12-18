/**
 * Consultation State Management Hooks
 * Requirement 6.6: Centralized state management for consultation workflow
 * 
 * This module provides hooks for managing consultation state including:
 * - Appointment and patient data
 * - Emergency patient information
 * - SOAP notes
 * - Prescriptions
 * - Lab orders
 * - Dirty state tracking
 * - Last saved timestamp
 */

export { useConsultationStore } from '@/stores/consultationStore';
export { useConsultationInit } from './useConsultationInit';
export { useConsultationData } from './useConsultationData';
export { useConsultationState } from './useConsultationState';
export { useConsultationSoapNote } from './useConsultationSoapNote';
export { useConsultationPrescriptions } from './useConsultationPrescriptions';
export { useConsultationLabOrders } from './useConsultationLabOrders';
export { useAutoSave } from './useAutoSave';
