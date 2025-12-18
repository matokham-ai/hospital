# Requirements Document

## Introduction

This specification defines enhancements to the consultation workflow to enable doctors to identify emergency patients, prescribe medications with instant dispensing for emergencies, and request laboratory tests with priority levels during the consultation process before completing the consultation.

## Glossary

- **Consultation System**: The software module that manages doctor-patient consultations including SOAP notes, prescriptions, and lab orders
- **Emergency Patient**: A patient who has been registered through the emergency department with a triage assessment
- **Drug Formulary**: The hospital's approved list of medications available for prescription
- **Instant Dispensing**: Immediate medication dispensing for emergency patients without requiring separate pharmacy workflow
- **Lab Priority Level**: The urgency classification for laboratory test requests (urgent, fast, normal)
- **SOAP Note**: Subjective, Objective, Assessment, and Plan documentation format for clinical encounters
- **Consultation Completion**: The final action that marks a consultation as finished and triggers billing

## Requirements

### Requirement 1

**User Story:** As a doctor, I want to see if a patient is an emergency patient during consultation, so that I can provide appropriate urgent care and prioritize treatment decisions.

#### Acceptance Criteria

1. WHEN a doctor opens a consultation for a patient THEN the Consultation System SHALL display a prominent emergency indicator in the patient header if the patient has an active emergency record
2. WHEN displaying emergency patient information THEN the Consultation System SHALL show the triage priority level with color coding (red for critical, orange for urgent, yellow for semi-urgent)
3. WHEN displaying emergency patient information THEN the Consultation System SHALL show the chief complaint from the emergency registration in the patient overview snapshot
4. WHEN displaying emergency patient information THEN the Consultation System SHALL show the arrival time and mode of arrival in the context panel
5. WHERE a patient has a triage assessment THEN the Consultation System SHALL display the triage vital signs in the vitals widget with comparison to current vitals
6. WHEN a doctor views emergency patient details THEN the Consultation System SHALL provide quick access to the full triage assessment notes

### Requirement 2

**User Story:** As a doctor, I want to search and select medications from the drug formulary during consultation, so that I can prescribe appropriate medications efficiently.

#### Acceptance Criteria

1. WHEN a doctor initiates medication prescription THEN the Consultation System SHALL provide an autocomplete search interface for the drug formulary with response time under 500 milliseconds
2. WHEN a doctor enters search terms THEN the Consultation System SHALL return matching medications by generic name, brand name, or ATC code within 3 keystrokes
3. WHEN displaying search results THEN the Consultation System SHALL show drug name, strength, form, current stock availability, and a stock status indicator (in-stock, low-stock, out-of-stock)
4. WHEN a doctor selects a medication THEN the Consultation System SHALL auto-populate prescription fields with drug details including suggested dosage based on patient age and weight
5. WHEN a doctor completes prescription details THEN the Consultation System SHALL validate that dosage, frequency, duration, and quantity fields are provided
6. WHEN a doctor prescribes a medication THEN the Consultation System SHALL check for drug interactions with existing patient medications and display warnings if conflicts exist
7. WHEN a doctor prescribes a medication THEN the Consultation System SHALL check patient allergies and prevent prescription if the drug matches known allergies

### Requirement 3

**User Story:** As a doctor, I want to mark prescriptions for instant dispensing for emergency patients, so that critical medications can be provided immediately.

#### Acceptance Criteria

1. WHERE a patient is an emergency patient WHEN a doctor creates a prescription THEN the Consultation System SHALL provide an option to mark for instant dispensing
2. WHEN a prescription is marked for instant dispensing THEN the Consultation System SHALL validate that sufficient stock exists in the pharmacy
3. WHEN a prescription is marked for instant dispensing THEN the Consultation System SHALL reserve the medication quantity in pharmacy stock
4. WHERE a patient is not an emergency patient THEN the Consultation System SHALL not display the instant dispensing option
5. WHEN multiple prescriptions are created THEN the Consultation System SHALL allow selective marking of individual prescriptions for instant dispensing

### Requirement 4

**User Story:** As a doctor, I want to request laboratory tests with priority levels during consultation, so that urgent tests can be processed faster than routine tests.

#### Acceptance Criteria

1. WHEN a doctor initiates a lab test request THEN the Consultation System SHALL provide a search interface for available lab tests
2. WHEN a doctor selects a lab test THEN the Consultation System SHALL require selection of a priority level from urgent, fast, or normal
3. WHEN displaying priority options THEN the Consultation System SHALL clearly indicate the expected turnaround time for each priority level
4. WHEN a lab order is created with urgent priority THEN the Consultation System SHALL flag the order for immediate laboratory attention
5. WHEN multiple lab tests are requested THEN the Consultation System SHALL allow different priority levels for each test

### Requirement 5

**User Story:** As a doctor, I want to complete all prescriptions and lab orders before finishing the consultation, so that all patient care activities are documented and initiated properly.

#### Acceptance Criteria

1. WHEN a doctor attempts to complete a consultation THEN the Consultation System SHALL display a summary of all prescriptions and lab orders created
2. WHEN completing a consultation with instant dispensing prescriptions THEN the Consultation System SHALL confirm stock reservation and create dispensation records
3. WHEN completing a consultation with lab orders THEN the Consultation System SHALL submit all orders to the laboratory system with their priority levels
4. WHEN a consultation is completed THEN the Consultation System SHALL create billing items for all prescriptions and lab tests
5. WHEN a consultation is completed THEN the Consultation System SHALL prevent further modifications to prescriptions and lab orders

### Requirement 6

**User Story:** As a doctor, I want to view and modify prescriptions and lab orders during consultation before completion, so that I can adjust treatment plans as needed during the consultation.

#### Acceptance Criteria

1. WHEN a doctor views the consultation interface THEN the Consultation System SHALL display all prescriptions created in the current consultation session in a dedicated section with clear visual grouping
2. WHEN a doctor views the consultation interface THEN the Consultation System SHALL display all lab orders created in the current consultation session with their priority levels clearly indicated
3. WHEN a doctor selects a prescription THEN the Consultation System SHALL allow editing of dosage, frequency, duration, quantity, and instant dispensing status
4. WHEN a doctor selects a lab order THEN the Consultation System SHALL allow modification of the priority level and test selection
5. WHEN a doctor deletes a prescription or lab order THEN the Consultation System SHALL remove it from the consultation and release any reserved stock immediately
6. WHEN changes are made to prescriptions or lab orders THEN the Consultation System SHALL auto-save changes every 10 seconds to prevent data loss

### Requirement 7

**User Story:** As a system administrator, I want the consultation workflow to maintain data integrity, so that all clinical and billing records are accurate and consistent.

#### Acceptance Criteria

1. WHEN a prescription is created THEN the Consultation System SHALL link it to the current consultation encounter
2. WHEN a lab order is created THEN the Consultation System SHALL link it to the current consultation encounter
3. WHEN stock is reserved for instant dispensing THEN the Consultation System SHALL create a stock movement record
4. WHEN a consultation is completed THEN the Consultation System SHALL update the consultation status to completed with a timestamp
5. IF an error occurs during consultation completion THEN the Consultation System SHALL rollback all changes and maintain the consultation in draft state


### Requirement 8

**User Story:** As a doctor, I want a streamlined consultation interface with quick access to patient information and clinical tools, so that I can focus on patient care without navigating multiple screens.

#### Acceptance Criteria

1. WHEN a doctor opens a consultation THEN the Consultation System SHALL display a patient overview snapshot showing name, age, gender, MRN, allergies, and current diagnosis within 2 seconds
2. WHEN the consultation interface loads THEN the Consultation System SHALL display a vitals widget in the context panel showing current and trending vital signs
3. WHEN a doctor works in the consultation interface THEN the Consultation System SHALL provide a side navigation panel with quick links to patient history, medications, labs, and timeline
4. WHEN a doctor adds prescriptions or lab orders THEN the Consultation System SHALL display them in the main workspace without requiring navigation to separate screens
5. WHEN the consultation interface is displayed THEN the Consultation System SHALL load all components within 3 seconds on standard hospital network connections
6. WHEN a doctor uses the consultation interface THEN the Consultation System SHALL support keyboard shortcuts for common actions (save, add prescription, add lab order, complete consultation)
