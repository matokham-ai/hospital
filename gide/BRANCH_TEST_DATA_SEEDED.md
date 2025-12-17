# Branch Test Data Seeding Complete

## Summary

All tables have been successfully seeded with branch-aware test data for proof of concept testing.

## Seeded Data Overview

### Branches (3)
- **HQ001** - Main Hospital - Nairobi (Main Branch)
- **BR002** - Westlands Branch
- **BR003** - Mombasa Branch

### Per Branch Data

#### Users (36 total - 12 per branch)
- 2 Admins
- 2 Doctors
- 2 Nurses
- 2 Receptionists
- 2 Pharmacists
- 2 Lab Technicians

**Login Credentials:**
- Email format: `{role}{number}.{branch_code}@hospital.com`
- Example: `doctor1.hq001@hospital.com`
- Password: `password` (for all users)

#### Physicians (6 total - 2 per branch)
- Linked to doctor users
- License numbers: `LIC-{BRANCH_CODE}-{RANDOM}`
- Specializations: General Practice, Internal Medicine, Pediatrics

#### Patients (30 total - 10 per branch)
- Patient IDs: `PAT-{BRANCH_CODE}-{NUMBER}`
- Hospital IDs: `{BRANCH_CODE}-{NUMBER}`
- Email format: `patient{number}.{branch_code}@example.com`

#### Departments (18 total - 6 per branch)
- Emergency (ER)
- Outpatient (OPD)
- Inpatient (IPD)
- Pharmacy (PHARM)
- Laboratory (LAB)
- Radiology (RAD)

#### Wards (12 total - 4 per branch)
- General Ward
- ICU
- Maternity
- Pediatric

#### Beds (60 total - 20 per branch)
- 5 beds per ward
- Mix of available and occupied status
- Types: standard, icu, private

### Global Data

#### Drugs (5 in formulary)
- Paracetamol 500mg (Tablet)
- Amoxicillin 250mg (Capsule)
- Ibuprofen 400mg (Tablet)
- Metformin 500mg (Tablet)
- Omeprazole 20mg (Capsule)

#### Services per Branch
**Tariffs:**
- Consultation - KES 1,000
- Admission - KES 5,000
- Bed per day - KES 2,000
- Nursing care - KES 1,500

**Service Catalogue:**
- X-Ray (Radiology) - KES 3,000
- Ultrasound (Radiology) - KES 4,000
- ECG (Cardiology) - KES 2,000
- Physiotherapy (Therapy) - KES 2,500

## Testing the Branch System

### 1. Test Branch Selector
- Login with any user
- Check that branch selector shows correct branches
- Switch between branches
- Verify data filters by selected branch

### 2. Test Branch-Specific Data
- View patients list - should show only patients from selected branch
- View appointments - should show only appointments for selected branch
- Check billing - should show only billing for selected branch

### 3. Test User Branch Assignment
- Each user is assigned to a specific branch
- Users should see their assigned branch by default
- Admin users can switch between all branches

### 4. Test Data Isolation
- Create new records (patients, appointments, etc.)
- Verify they are assigned to the current branch
- Switch branches and verify records don't appear

## Seeder File

The comprehensive seeder is located at:
`database/seeders/ComprehensiveBranchTestSeeder.php`

### Re-running the Seeder

To clear and re-seed all data:
```bash
php artisan db:seed
```

Or specifically:
```bash
php artisan db:seed --class=ComprehensiveBranchTestSeeder
```

**Note:** The seeder automatically clears existing data before seeding to prevent duplicates.

## Next Steps

1. Test the branch selector component in the UI
2. Verify branch filtering works across all modules
3. Test branch-specific reports and dashboards
4. Validate branch permissions and access control
5. Test multi-branch workflows (transfers, referrals, etc.)

## Database Configuration

The seeder is configured in `database/seeders/DatabaseSeeder.php` to run automatically with:
```bash
php artisan db:seed
```
