# Appointment Number Generation Fix Summary

## Problem
The application was throwing a database error:
```
SQLSTATE[HY000]: General error: 1364 Field 'appointment_number' doesn't have a default value
```

This occurred when trying to create appointments without providing the `appointment_number` field, which was expected to be auto-generated.

## Root Cause
The `Appointment` and `OpdAppointment` models were not automatically generating the `appointment_number` field when creating new records. Some parts of the codebase were manually generating it, while others were not.

## Solution Implemented

### 1. Updated Appointment Model (`app/Models/Appointment.php`)
- Added `boot()` method to automatically generate `appointment_number` when creating new appointments
- Added `generateAppointmentNumber()` method that creates numbers in format: `APT{YYYYMMDD}{###}`
- Added proper date casting for appointment-related fields
- Added Carbon import for date handling

### 2. Updated OpdAppointment Model (`app/Models/OpdAppointment.php`)
- Added `boot()` method to automatically generate `appointment_number` when creating new appointments
- Updated `generateAppointmentNumber()` method to use consistent format: `OPD{YYYYMMDD}{####}`
- Ensured automatic generation works with the existing manual generation logic

### 3. Updated API Controller (`app/Http/Controllers/API/AppointmentController.php`)
- Changed `appointment_number` validation from `required` to `nullable` since it's now auto-generated
- Maintained uniqueness validation to prevent duplicates

### 4. Updated Patient Controller (`app/Http/Controllers/Patient/AppointmentController.php`)
- Fixed status value from `'scheduled'` to `'SCHEDULED'` to match database enum constraints
- Added `created_by` field to appointment creation (was missing and required)

### 5. Updated OPD Service (`app/Services/OpdService.php`)
- Removed manual `appointment_number` generation since it's now handled by the model
- Removed redundant `generateAppointmentNumber()` private method

### 6. Updated Factories
- **OpdAppointmentFactory**: Removed manual `appointment_number` generation to let the model handle it
- **PhysicianFactory**: Created new factory matching the actual database schema
- **DepartmentFactory**: Created new factory matching the actual database schema

### 7. Fixed Tests
- **AppointmentCreationTest**: Created new test to verify automatic appointment number generation
- **OpdAppointmentTest**: Fixed existing tests to use correct status values and date functions
- Updated test expectations to match the new appointment number format

## Appointment Number Formats

### Regular Appointments
- Format: `APT{YYYYMMDD}{###}`
- Example: `APT20251013001`

### OPD Appointments  
- Format: `OPD{YYYYMMDD}{####}`
- Example: `OPD202510130001`

## Key Benefits

1. **Automatic Generation**: No need to manually provide appointment numbers
2. **Consistency**: All appointments get properly formatted, unique numbers
3. **Thread Safety**: Database-level uniqueness constraints prevent duplicates
4. **Backward Compatibility**: Existing code that manually provides appointment numbers still works
5. **Proper Testing**: Comprehensive tests ensure the functionality works correctly

## Database Schema Compatibility

The fix works with the existing database schema:
- `appointments` table: Uses enum status values (`SCHEDULED`, `CONFIRMED`, etc.)
- `opd_appointments` table: Uses different enum status values (`WAITING`, `IN_PROGRESS`, etc.)
- Both tables have unique constraints on `appointment_number` field

## Testing Results

All tests pass successfully:
- ✅ `AppointmentCreationTest`: 2 tests, 8 assertions
- ✅ `OpdAppointmentTest`: 21 tests, 44 assertions

The fix resolves the original database error while maintaining full backward compatibility and adding proper test coverage.