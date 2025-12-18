# Hospital Management System - AI Coding Agent Instructions

## Project Overview
Hospital Management System (HMS) is a **Laravel 12 + React/TypeScript** monolithic application using **Inertia.js** for server-side rendering with client-side navigation. Supports complex clinical workflows for multiple roles (Admin, Doctor, Nurse, Pharmacist, Lab Tech, Radiologist, Cashier, Receptionist).

## Architecture & Tech Stack

### Backend (PHP/Laravel)
- **Framework:** Laravel 12 with Eloquent ORM
- **Authentication:** Session-based (web middleware) with Spatie/Permission for RBAC
- **API:** RESTful endpoints under `/api/*` routes - use `auth:web` NOT `auth:sanctum`
- **Key Services:** [app/Services/](app/Services/) - OpdService, PrescriptionService, LabOrderService, BillingService, etc.
- **Database:** Multiple migrations in [database/migrations/](database/migrations/). Key tables: patients, users, roles, permissions, encounters, appointments, prescriptions, lab_orders, invoices
- **Broadcasting:** Laravel Reverb for real-time notifications
- **File Generation:** DOMPDF for reports, Maatwebsite Excel for exports

### Frontend (React/TypeScript)
- **Framework:** React 18 with Inertia.js (SSR, single-page navigation)
- **Styling:** Tailwind CSS with form components via `@tailwindcss/forms`
- **Build:** Vite with swapped SWC for React (to avoid WASM memory issues)
- **State:** Minimal - Inertia handles server state, occasional Zustand stores
- **Alias:** `@/` maps to [resources/js/](resources/js/)
- **Pages:** Organized by role (Pages/Admin/, Pages/Doctor/, Pages/Nurse/, etc.)

## Critical Authentication & Authorization Pattern

### Why NOT Sanctum?
This app uses **session-based web authentication** (cookies), not API tokens. Sanctum is for token-based APIs. See [gide/API_AUTH_MIDDLEWARE_FIX.md](gide/API_AUTH_MIDDLEWARE_FIX.md).

### Correct Middleware
```php
// ✅ CORRECT for API routes
Route::middleware(['auth:web', 'web'])->name('api.')->group(function () { ... });

// ❌ WRONG - don't use Sanctum
Route::middleware('auth:sanctum')->group(function () { ... });
```

### Role-Based Access Control
- **Backend:** Use `$user->hasRole('Doctor')` or `$user->can('prescribe drugs')`
- **Frontend:** Use `usePermissions()` hook ([resources/js/hooks/usePermissions.tsx](resources/js/hooks/usePermissions.tsx))
- **Seeding:** [database/seeders/RolePermissionSeeder.php](database/seeders/RolePermissionSeeder.php) creates 9 roles with permissions
- **Middleware:** Apply with `Route::middleware('role:Doctor')` or `permission:prescribe drugs`

Example permission check:
```php
// Controller
if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
    return response()->json(['message' => 'Unauthorized'], 403);
}
```

## Data Flow Architecture

### Patient Journey (OPD → Inpatient)
1. **Reception:** Patient registered ([PatientController](app/Http/Controllers/Patient/))
2. **Triage:** Vital signs via TriageService → TriageAssessment model
3. **Consultation:** Doctor creates OpdSoapNote with Prescription + LabOrder
4. **Pharmacy:** Dispensation of prescribed drugs
5. **Lab/Imaging:** Test processing and result entry
6. **Billing:** Invoice generated, payments tracked
7. **Inpatient:** Bed assignment, care plans, nursing notes
8. **Discharge:** Summary and final invoice

**Key Models:** Patient → Encounter → OpdAppointment → OpdSoapNote → Prescription/LabOrder/Invoice

### Module Boundaries (See [routes/](routes/) for routing)
- **Admin:** Master data, users, roles, reports - [routes/admin.php](routes/admin.php)
- **OPD:** Outpatient workflow - [routes/opd.php](routes/opd.php)
- **Inpatient (IPD):** Ward/bed management, care plans - [routes/inpatient.php](routes/inpatient.php)
- **Pharmacy:** Drug stock, dispensing, formulary - [routes/pharmacy.php](routes/pharmacy.php)
- **Billing:** Invoices, payments, tariffs - [routes/billing.php](routes/billing.php)
- **Reports:** Financial, operational analytics - [routes/reports.php](routes/reports.php)
- **API:** [routes/api.php](routes/api.php) - Used by frontend via Inertia

## Common Developer Workflows

### Running Tests
```bash
php artisan test                    # Run all tests
php artisan test tests/Feature/Admin/AdminControllerTest.php  # Single test
npm run test:run                    # Frontend tests with Vitest
```

### Database Operations
```bash
php artisan migrate                 # Run migrations
php artisan db:seed                 # Seed roles/permissions
php artisan db:seed --class=RolePermissionSeeder  # Specific seeder
php artisan tinker                  # REPL for quick queries
```

### Building & Development
```bash
npm run dev                         # Dev server (Vite)
npm run build                       # Production build
php artisan serve                   # Laravel dev server (default :8000)
```

### Debugging Permissions
```bash
# Via Tinker
php artisan tinker
$user = User::find(1);
$user->assignRole('Doctor');
$user->givePermissionTo('prescribe drugs');
$user->hasPermissionTo('prescribe drugs');  // Check
```

## Project Conventions & Patterns

### 1. Service-Oriented Backend
Every module has a Service class ([app/Services/](app/Services/)) handling business logic:
- `OpdService` - Consultation workflow (SOAP notes, prescriptions, lab orders)
- `BillingService` - Invoice generation, payment tracking
- `PrescriptionService` - Prescription validation, drug interactions
- `LabOrderService` - Test ordering, result processing

**Pattern:** Controller delegates to Service, Service handles DB transactions and validation.

### 2. API Response Format
All API responses use `response()->json()` with consistent structure:
```php
// Success
response()->json(['success' => true, 'data' => $data], 200);
// Error
response()->json(['message' => 'Error description'], 400);
```

### 3. Frontend Props Pattern (Inertia)
Controllers pass data via `return inertia('PageName', [...props])`:
```php
// Controller
return inertia('OpdConsultation', [
    'patient' => $patient,
    'appointments' => $appointments,
    'auth' => ['user' => auth()->user()],
]);

// Component
export default function ({ patient, appointments, auth }: Props) {
  // access auth.user.roles, patient.name, etc.
}
```

### 4. Branch/Tenant Awareness
System supports multi-branch operations - many tables have `branch_id`:
- Filter queries with: `whereNull('branch_id')->orWhere('branch_id', $user->branch_id)`
- When creating records, include: `'branch_id' => $user->branch_id ?? null`

### 5. Master Data Audit Trail
Critical data (departments, beds, drug formulary) is audited via `MasterDataAudit`:
- Auto-tracked by `MasterDataAuditObserver`
- Models use `MasterDataCacheService` for caching
- Changes logged to `master_data_audits` table

### 6. Error Handling
- Custom exceptions: [app/Exceptions/](app/Exceptions/) (DepartmentInUseException, BedOccupancyConflictException, etc.)
- Registered in [bootstrap/app.php](bootstrap/app.php) with specific renderers
- Use descriptive messages for user feedback

## Testing Conventions

### Backend Tests
Located in [tests/Feature/](tests/Feature/). Pattern:
```php
class AdminControllerTest extends TestCase {
    protected $admin, $unauthorized;
    
    public function setUp(): void {
        parent::setUp();
        // Create roles and users
        $this->admin = User::factory()->create();
        $this->admin->assignRole('Admin');
    }
    
    public function test_authenticated_admin_can_access() {
        $response = $this->actingAs($this->admin)->getJson('/admin/dashboard');
        $response->assertStatus(200);
    }
}
```

### Frontend Tests
Run with `npm run test:run`. Use Vitest + React Testing Library.

## Key Files to Know

| File | Purpose |
|------|---------|
| [app/Http/Controllers/](app/Http/Controllers/) | Request handlers organized by role |
| [app/Models/](app/Models/) | Eloquent models (50+ entities) |
| [app/Services/](app/Services/) | Business logic services |
| [routes/](routes/) | 20+ route files organized by module |
| [resources/js/Pages/](resources/js/Pages/) | React pages by role (Admin, Doctor, Nurse, etc.) |
| [resources/js/Components/](resources/js/Components/) | Reusable UI components |
| [resources/js/hooks/usePermissions.tsx](resources/js/hooks/usePermissions.tsx) | Permission checking hook |
| [config/permission.php](config/permission.php) | Spatie/Permission config |
| [database/seeders/](database/seeders/) | Role, permission, test data seeders |

## Quick Decisions Guide

**When adding a feature:**
1. **Is it a workflow?** → Create Service, then Controller using that Service
2. **Does it need auth?** → Use `auth:web` middleware, check permissions with Spatie
3. **Multiple roles involved?** → Check [resources/js/Config/doctorPermissions.ts](resources/js/Config/doctorPermissions.ts) pattern for FE permissions
4. **New data table?** → Create migration, model, seeder; add audit observer if master data
5. **API endpoint?** → Route in [routes/api.php](routes/api.php) with `['auth:web', 'web']` middleware
6. **Frontend page?** → Create in Pages/{Role}/, use inertia props for data, usePermissions hook for conditional UI
7. **Real-time updates?** → Use Laravel Reverb (configured in [config/broadcasting.php](config/broadcasting.php))

## Known Gotchas

- **401 Errors on API calls?** Check if using `auth:sanctum` - change to `auth:web`
- **Missing permissions?** Run `php artisan db:seed --class=RolePermissionSeeder`
- **Build memory issues?** Vite is optimized in [vite.config.js](vite.config.js) - use `npm run build:low-memory` if needed
- **Session not persisting?** Verify `.env` has `SESSION_DRIVER=database` and middleware includes `web`
- **Inertia invalid response?** Check error boundary in [resources/js/app.tsx](resources/js/app.tsx)

## Resources
- API docs: [docs/API_CONSULTATION_ENHANCEMENT.md](docs/API_CONSULTATION_ENHANCEMENT.md)
- Guide docs: [gide/](gide/) - Check IMPLEMENTATION_SUMMARY.md for feature overview
- Spatie/Permission: Uses version 6.21 with roles, permissions, model-based access
- Inertia.js: [resources/js/Pages/](resources/js/Pages/) for page structure examples
