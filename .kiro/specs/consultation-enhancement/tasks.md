# Implementation Plan

## Phase 1: Database Schema and Core Models

- [ ] 1. Database schema updates and migrations











  - Create migration for prescriptions table enhancements (instant_dispensing, stock_reserved, stock_reserved_at columns)
  - Create migration for lab_orders table enhancements (priority, expected_completion_at, clinical_notes columns)
  - Add database indexes for performance optimization
  - _Requirements: 3.1, 3.2, 3.3, 4.2, 4.3, 7.3_
-

- [x] 2. Extend Eloquent models with new relationships and methods








  - Add emergencyRecord relationship to OpdAppointment model
  - Add drugFormulary relationship to Prescription model
  - Add testCatalog relationship to LabOrder model
  - Add instant dispensing and stock reservation methods to Prescription model
  - Add priority level methods to LabOrder model
  - _Requirements: 1.1, 3.1, 4.2_

## Phase 2: Backend Services
-

- [x] 3. Create EmergencyService for emergency patient data retrieval




  - Implement getEmergencyDataForPatient method
  - Implement getLatestTriageAssessment method
  - Implement isEmergencyPatient method
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 3.1 Write property test for emergency data retrieval







  - **Property 1: Emergency indicator presence**
  - **Validates: Requirements 1.1**
-

- [ ] 3.2 Write property test for triage priority display




  - **Property 2: Triage priority display**

  - **Validates: Requirements 1.2**

- [ ] 3.3 Write property test for emergency chief complaint




  - **Property 3: Emergency chief complaint inclusion**

 - **Validates: Requirements 1.3**

- [ ] 3.4 Write property test for emergency arrival information




  - **Property 4: Emergency arrival information**
  - **Validates: Requirements 1.4**

- [ ] 3.5 Write property test for triage vitals availability





  - **Property 5: Triage vitals availability**
  - **Validates: Requirements 1.5**

- [x] 4. Create PrescriptionService for medication management






  - Implement createPrescription method with validation
  - Implement validateInstantDispensing method for stock checking
  - Implement reserveStock method for instant dispensing
  - Implement releaseStock method for stock release
  - Implement checkDrugInteractions method
  - Implement checkAllergies method
  - _Requirements: 2.5, 3.2, 3.3, 2.6, 2.7_
- [x] 4.1 Write property test for prescription field validation


  - **Property 10: Prescription field validation**
  - **Validates: Requirements 2.5**

- [x] 4.2 Write property test for instant dispensing stock validation


  - **Property 14: Instant dispensing stock validation**
  - **Validates: Requirements 3.2**

- [x] 4.3 Write property test for stock reservation

  - **Property 15: Stock reservation on instant dispensing**
  - **Validates: Requirements 3.3**

- [x] 4.4 Write property test for drug interaction detection

  - **Property 11: Drug interaction detection**
  - **Validates: Requirements 2.6**

- [x] 4.5 Write property test for allergy prevention

  - **Property 12: Allergy prevention**
  - **Validates: Requirements 2.7**

- [x] 4.6 Write property test for stock release on deletion

  - **Property 31: Stock release on prescription deletion**
  - **Validates: Requirements 6.5** prescription deletion**
  - **Validates: Requirements 6.5**

- [x] 5. Create LabOrderService for laboratory test management





  - Implement createLabOrder method with priority validation
  - Implement updatePriority method
  - Implement getExpectedTurnaroundTime method
  - Implement submitToLaboratory method
  - _Requirements: 4.2, 4.3, 4.4, 5.3_

- [x] 5.1 Write property test for lab order priority requirement


  - **Property 18: Lab order priority requirement**
  - **Validates: Requirements 4.2**

- [x] 5.2 Write property test for urgent order flagging


  - **Property 20: Urgent order flagging**
  - **Validates: Requirements 4.4**

- [x] 5.3 Write property test for independent lab order priorities


  - **Property 21: Independent lab order priorities**
  - **Validates: Requirements 4.5**

- [x] 6. Extend OpdService for enhanced consultation workflow





  - Update startConsultation to include emergency data retrieval
  - Update saveSOAP to handle instant dispensing prescriptions
  - Update completeConsultation to process instant dispensing and lab orders
  - Add method to get consultation summary before completion
  - _Requirements: 1.1, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.1 Write property test for consultation completion summary


  - **Property 22: Completion summary completeness**
  - **Validates: Requirements 5.1**

- [x] 6.2 Write property test for instant dispensing record creation


  - **Property 23: Instant dispensing record creation**
  - **Validates: Requirements 5.2**

- [x] 6.3 Write property test for billing item creation


  - **Property 25: Billing item creation**
  - **Validates: Requirements 5.4**

- [x] 6.4 Write property test for post-completion immutability


  - **Property 26: Post-completion immutability**
  - **Validates: Requirements 5.5**

- [x] 6.5 Write property test for transaction rollback on error


  - **Property 36: Transaction rollback on error**
  - **Validates: Requirements 7.5**

## Phase 3: API Endpoints

- [x] 7. Enhance drug formulary search API endpoint








  - Update existing GET /api/drugs/search endpoint with autocomplete optimization
  - Ensure search by generic name, brand name, and ATC code
  - Include stock availability in response
  - Add response caching for performance
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7.1 Write property test for multi-field drug search




  - **Property 7: Multi-field drug search**
  - **Validates: Requirements 2.2**

- [x] 7.2 Write property test for complete search result data

  - **Property 8: Complete search result data**
  - **Validates: Requirements 2.3**

- [x] 8. Enhance lab test search API endpoint





  - Update existing GET /api/test-catalogs/search endpoint
  - Implement search with category filtering
  - Include turnaround time information
  - _Requirements: 4.1, 4.3_

- [x] 9. Create API endpoints for prescription management









  - Create POST /api/opd/appointments/{id}/prescriptions endpoint
  - Create PUT /api/opd/appointments/{id}/prescriptions/{prescriptionId} endpoint
  - Create DELETE /api/opd/appointments/{id}/prescriptions/{prescriptionId} endpoint
  - Add validation for instant dispensing
  - Add allergy and interaction checking
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 6.3, 6.5_

- [x] 9.1 Write property test for prescription auto-population




  - **Property 9: Prescription auto-population**
  - **Validates: Requirements 2.4**

- [x] 9.2 Write property test for emergency instant dispensing availability

  - **Property 13: Emergency instant dispensing availability**
  - **Validates: Requirements 3.1**

- [x] 9.3 Write property test for non-emergency instant dispensing restriction

  - **Property 16: Non-emergency instant dispensing restriction**
  - **Validates: Requirements 3.4**

- [x] 9.4 Write property test for selective instant dispensing

  - **Property 17: Selective instant dispensing**
  - **Validates: Requirements 3.5**

- [x] 9.5 Write property test for prescription encounter linkage

  - **Property 32: Prescription encounter linkage**
  - **Validates: Requirements 7.1**

- [x] 10. Create API endpoints for lab order management







  - Create POST /api/opd/appointments/{id}/lab-orders endpoint
  - Create PUT /api/opd/appointments/{id}/lab-orders/{labOrderId} endpoint
  - Create DELETE /api/opd/appointments/{id}/lab-orders/{labOrderId} endpoint
  - Add priority level validation
  - _Requirements: 4.2, 4.4, 4.5, 6.4_

- [x] 10.1 Write property test for lab order encounter linkage



  - **Property 33: Lab order encounter linkage**
  - **Validates: Requirements 7.2**

- [x] 11. Create API endpoint for consultation completion





  - Create POST /api/opd/appointments/{id}/complete endpoint
  - Implement completion summary generation
  - Add transaction handling for all completion steps
  - Trigger billing item creation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.4, 7.5_

- [x] 11.1 Write property test for consultation completion status update


  - **Property 35: Consultation completion status update**
  - **Validates: Requirements 7.4**

## Phase 4: Frontend Components - Emergency & Patient Info

- [x] 12. Create React component for emergency status indicator





  - Create EmergencyStatusBadge component at resources/js/Components/Consultation/EmergencyStatusBadge.tsx
  - Implement triage priority color coding
  - Add tooltip with emergency details
  - Style for prominence in patient header
  - _Requirements: 1.1, 1.2_

- [x] 13. Enhance existing SoapNotes component with emergency patient detection





  - Update resources/js/Pages/OPD/SoapNotes.tsx to fetch and display emergency data
  - Integrate EmergencyStatusBadge in patient header
  - Add emergency context panel with arrival info and triage vitals
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

## Phase 5: Frontend Components - Prescription Management

- [x] 14. Enhance drug formulary search in SoapNotes component





  - Update existing drug search functionality in resources/js/Pages/OPD/SoapNotes.tsx
  - Implement debounced search (300ms) if not already present
  - Display stock availability indicators
  - Ensure keyboard navigation support
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 15. Create React component for prescription form with instant dispensing





  - Create PrescriptionForm component at resources/js/Components/Consultation/PrescriptionForm.tsx
  - Implement dosage, frequency, duration, quantity fields
  - Add instant dispensing checkbox (conditional on emergency status)
  - Implement drug interaction warnings display
  - Implement allergy conflict blocking
  - Add form validation
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.1, 3.4_

- [x] 16. Create React component for prescription list display





  - Create PrescriptionList component at resources/js/Components/Consultation/PrescriptionList.tsx
  - Display all prescriptions with edit/delete actions
  - Show instant dispensing status
  - Implement inline editing
  - _Requirements: 6.1, 6.3_

- [x] 16.1 Write property test for prescription display in consultation






  - **Property 27: Prescription display in consultation**
  - **Validates: Requirements 6.1**

- [x] 16.2 Write property test for prescription editability


  - **Property 29: Prescription editability before completion**
  - **Validates: Requirements 6.3**

- [x] 17. Integrate prescription components into SoapNotes





  - Update resources/js/Pages/OPD/SoapNotes.tsx to use PrescriptionForm and PrescriptionList
  - Replace existing medication management with new components
  - Connect to new API endpoints
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.3_

## Phase 6: Frontend Components - Lab Order Management

- [x] 18. Create React component for lab test search





  - Create LabTestSearch component at resources/js/Components/Consultation/LabTestSearch.tsx
  - Implement autocomplete with category filtering
  - Display turnaround time information
  - _Requirements: 4.1, 4.3_

- [x] 19. Create React component for lab order form





  - Create LabOrderForm component at resources/js/Components/Consultation/LabOrderForm.tsx
  - Implement priority level selection with radio buttons
  - Display expected turnaround time for each priority
  - Add clinical notes textarea
  - _Requirements: 4.2, 4.3_

- [x] 20. Create React component for lab order list display





  - Create LabOrderList component at resources/js/Components/Consultation/LabOrderList.tsx
  - Display all lab orders with priority badges
  - Show edit/delete actions
  - Implement inline editing
  - _Requirements: 6.2, 6.4_

- [x] 20.1 Write property test for lab order display with priority


  - **Property 28: Lab order display with priority**
  - **Validates: Requirements 6.2**

- [x] 20.2 Write property test for lab order editability



  - **Property 30: Lab order editability before completion**
  - **Validates: Requirements 6.4**

- [x] 21. Integrate lab order components into SoapNotes





  - Update resources/js/Pages/OPD/SoapNotes.tsx to include lab order management section
  - Add LabTestSearch, LabOrderForm, and LabOrderList components
  - Connect to new API endpoints
  - _Requirements: 4.1, 4.2, 4.3, 6.2, 6.4_

## Phase 7: Consultation Completion & State Management

- [x] 22. Implement consultation state management





  - Create consultation context with React Context or Zustand
  - Implement state for appointment, patient, emergency data, SOAP note, prescriptions, lab orders
  - Add isDirty flag for tracking unsaved changes
  - Implement lastSaved timestamp
  - _Requirements: 6.6_

- [x] 23. Implement auto-save functionality




  - Create useAutoSave hook with 10-second debounce
  - Implement auto-save for SOAP notes
  - Implement auto-save for prescriptions and lab orders
  - Add visual indicator for save status
  - _Requirements: 6.6_

- [x] 24. Create consultation completion modal





  - Create CompletionSummaryModal component at resources/js/Components/Consultation/CompletionSummaryModal.tsx
  - Display summary of all prescriptions and lab orders
  - Show instant dispensing prescriptions separately
  - Add confirmation button
  - Implement loading state during completion
  - _Requirements: 5.1_

- [x] 25. Update consultation completion flow in SoapNotes










  - Update existing completion logic in resources/js/Pages/OPD/SoapNotes.tsx
  - Integrate CompletionSummaryModal
  - Connect to new completion API endpoint
  - Handle instant dispensing and lab order submission
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Phase 8: Configuration & Background Jobs

- [x] 26. Create configuration file for lab priorities





  - Create config/lab.php with priority definitions
  - Define turnaround times for each priority level
  - Define color codes for priority badges
  - _Requirements: 4.3_

- [x] 27. Implement stock reservation cleanup job





  - Create scheduled job to release expired stock reservations
  - Set reservation expiry to 30 minutes
  - Run job every 5 minutes
  - Log released reservations
  - _Requirements: 3.3_

- [x] 27.1 Write property test for stock movement audit trail


  - **Property 34: Stock movement audit trail**
  - **Validates: Requirements 7.3**

## Phase 9: UX Enhancements

- [x] 28. Implement error handling and validation





  - Add error boundary components
  - Implement validation error display
  - Add toast notifications for success/error messages
  - Implement retry logic for failed API calls
  - _Requirements: 7.5_

- [x] 29. Add keyboard shortcuts support





  - Implement keyboard shortcut handler
  - Add shortcuts for save (Ctrl+S), add prescription (Ctrl+P), add lab order (Ctrl+L)
  - Add shortcut for complete consultation (Ctrl+Enter)
  - Display keyboard shortcuts help modal
  - _Requirements: 8.6_

- [x] 30. Implement accessibility features





  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation for all forms
  - Add focus management for modals
  - Ensure color contrast meets WCAG AA standards
  - Add screen reader announcements for validation errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Phase 10: Testing & Documentation

- [x] 31. Write property test for vitals widget data inclusion





  - **Property 37: Vitals widget data inclusion**
  - **Validates: Requirements 8.2**

- [x] 32. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 33. Write integration tests for end-to-end consultation flow





  - Test complete consultation workflow from start to completion
  - Test emergency patient workflow with instant dispensing
  - Test stock management integration
  - Test billing integration
  - _Requirements: All_

- [x] 34. Create API documentation





  - Document all new API endpoints
  - Add request/response examples
  - Document error codes and messages
  - _Requirements: All_

- [x] 35. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
