# Inpatient Admission & Bed Assignment Guide

## Overview
This guide explains how to admit patients and assign beds in the inpatient management system.

## Features Implemented

### 1. Enhanced Patient Admission with Searchable Select
- **Location**: Go to `/inpatient/admissions` 
- **Button**: Click "New Admission" button
- **Process**:
  1. Use the searchable dropdown to find patients ready for admission (registered but not yet admitted)
  2. Select a patient from the dropdown list
  3. Review patient details (contact info, allergies, medical history)
  4. Choose an attending doctor
  5. Fill in admission details (diagnosis, complaint, etc.)
  6. Select admission type and priority
  7. Click "Admit Patient" to complete the process

### 2. Bed Assignment for Existing Patients
- **Location**: Go to `/inpatient/admissions`
- **Button**: Click "Assign Beds" button
- **Process**:
  1. View list of admitted patients without bed assignments
  2. View list of available beds
  3. Select a patient and an available bed
  4. Add optional assignment notes
  5. Click "Assign Bed" to complete

### 3. Bed Management Actions
For each bed in the admissions table, you can:
- **Available beds**: Click "Admit" to admit a new patient
- **Occupied beds**: 
  - Click "Transfer" to move patient to another bed
  - Click "Discharge" to discharge the patient

## API Endpoints Created

### Patient Search (Legacy)
- **Endpoint**: `GET /inpatient/api/search-patients?q={query}`
- **Purpose**: Search for patients to admit (legacy endpoint)

### Ready to Admit Patients
- **Endpoint**: `GET /inpatient/api/ready-to-admit?q={query}`
- **Purpose**: Get patients who are registered but not yet admitted as inpatients

### Available Doctors
- **Endpoint**: `GET /inpatient/api/available-doctors`
- **Purpose**: Get list of doctors for admission

### Admit Patient
- **Endpoint**: `POST /inpatient/api/admit-patient`
- **Purpose**: Admit a patient and assign them to a bed
- **Required Fields**:
  - `patientId`: ID of the patient
  - `bedId`: ID of the bed to assign
  - `attendingDoctorId`: ID of the attending doctor
  - `admissionType`: emergency, elective, urgent, or routine
  - `priority`: routine, urgent, or critical
  - `primaryDiagnosis`: Primary diagnosis
  - `chiefComplaint`: Chief complaint

### Unassigned Patients
- **Endpoint**: `GET /inpatient/api/unassigned-patients`
- **Purpose**: Get patients who are admitted but don't have beds

### Assign Bed
- **Endpoint**: `POST /inpatient/api/assign-bed`
- **Purpose**: Assign a bed to an existing patient
- **Required Fields**:
  - `encounter_id`: ID of the patient's encounter
  - `bed_id`: ID of the bed to assign

### Release Bed
- **Endpoint**: `POST /inpatient/api/release-bed`
- **Purpose**: Release a bed assignment
- **Required Fields**:
  - `encounter_id`: ID of the patient's encounter

### Bed Occupancy Data
- **Endpoint**: `GET /inpatient/api/bed-occupancy`
- **Purpose**: Get real-time bed occupancy information

## Database Tables Involved

### Key Tables:
1. **patients** - Patient information
2. **encounters** - Admission records (type='IPD' for inpatients)
3. **beds** - Bed information and status
4. **bed_assignments** - Links patients to beds
5. **users** - Doctor information (with role='Doctor')

### Bed Status Values:
- `AVAILABLE` - Bed is ready for new patient
- `OCCUPIED` - Bed has a patient assigned
- `MAINTENANCE` - Bed is under maintenance
- `CLEANING` - Bed is being cleaned

## Workflow

### Complete Admission Process:
1. **Select Patient** → Use searchable dropdown to find patients ready for admission
2. **Review Details** → Check patient information, allergies, and medical history
3. **Select Bed** → Choose available bed from the list
4. **Fill Details** → Complete admission form with medical details
5. **Assign Doctor** → Select attending physician
6. **Submit** → System creates encounter and bed assignment

### Patient Selection Features:
- **Smart Filtering**: Only shows patients who are registered but not currently admitted
- **Real-time Search**: Type to search by name, phone, email, or patient ID
- **Rich Display**: Shows patient details, contact info, allergies, and medical history
- **Easy Selection**: Click to select, clear button to change selection

### Bed Assignment Only:
1. **View Unassigned** → See patients admitted without beds
2. **Select Patient & Bed** → Choose patient and available bed
3. **Assign** → Create bed assignment record

## Troubleshooting

### Common Issues:

1. **"Bed is not available" error**
   - Check if bed status is 'AVAILABLE'
   - Another patient might have been assigned simultaneously

2. **"No patients found" in search**
   - Verify patient exists in database
   - Try searching by different criteria (name, phone, email)

3. **"No available doctors" error**
   - Ensure users have 'Doctor' role assigned
   - Check user status is 'active'

4. **"No unassigned patients" message**
   - All admitted patients already have beds assigned
   - Check if there are any active IPD encounters

### Database Checks:

```sql
-- Check unassigned patients
SELECT e.id, p.first_name, p.last_name 
FROM encounters e 
JOIN patients p ON e.patient_id = p.id 
LEFT JOIN bed_assignments ba ON e.id = ba.encounter_id AND ba.released_at IS NULL
WHERE e.type = 'IPD' AND e.status = 'ACTIVE' AND ba.id IS NULL;

-- Check available beds
SELECT * FROM beds WHERE status = 'AVAILABLE';

-- Check active doctors
SELECT u.* FROM users u 
JOIN model_has_roles mhr ON u.id = mhr.model_id 
JOIN roles r ON mhr.role_id = r.id 
WHERE r.name = 'Doctor' AND u.status = 'active';
```

## Next Steps

The system now supports:
- ✅ Patient admission with bed assignment
- ✅ Bed assignment for existing patients
- ✅ Real-time bed occupancy tracking
- ✅ Patient search functionality

Future enhancements could include:
- Patient transfer between beds
- Discharge processing
- Bed reservation system
- Automated bed cleaning workflows