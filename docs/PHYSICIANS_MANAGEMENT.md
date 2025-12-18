# Physicians Management Interface

## Overview
A comprehensive interface for managing hospital physicians with full CRUD operations, built with modern UI/UX using HMSLayout.

## Features

### 1. **Physician Management**
- Add new physicians with complete profile information
- Edit existing physician details
- Delete physicians (with safety checks)
- Search and filter physicians by name, code, specialization, or license number

### 2. **Physician Information**
The system captures the following information:
- **Basic Information**
  - Full Name
  - License Number (unique)
  - Qualification (MD, MBBS, DO, etc.)
  
- **Professional Details**
  - Specialization (Cardiology, Pediatrics, Surgery, etc.)
  - Years of Experience
  - Medical School
  - Consultant Status (checkbox)
  
- **Additional Information**
  - Bio/About section for detailed background

### 3. **Statistics Dashboard**
- Total Physicians count
- Number of Consultants
- Unique Specializations count
- Average Years of Experience

### 4. **UI/UX Features**
- Modern card-based layout with hover effects
- Gradient buttons and headers
- Dark mode support
- Responsive design for mobile and desktop
- Real-time search functionality
- Empty state with helpful messaging
- Toast notifications for success/error feedback

## Files Created/Modified

### Frontend
1. **resources/js/Pages/Admin/Physicians.tsx**
   - Main physicians management page
   - Add/Edit physician modals
   - Physician directory grid
   - Search and statistics

2. **resources/js/Config/adminNavigation.ts**
   - Added "Physicians" link to admin navigation

### Backend
1. **app/Http/Controllers/PhysicianController.php**
   - `index()` - Display all physicians
   - `store()` - Create new physician
   - `update()` - Update physician details
   - `destroy()` - Delete physician

2. **routes/admin.php**
   - Added physician routes under `/admin/physicians`

### Database
- Uses existing `physicians` table with the following structure:
  - `physician_code` (primary key, auto-generated: PHY001, PHY002, etc.)
  - `user_id` (nullable - optional link to user account)
  - `name` (required)
  - `license_number` (required, unique)
  - `specialization` (required)
  - `qualification` (required)
  - `medical_school` (nullable)
  - `years_of_experience` (nullable, integer)
  - `is_consultant` (boolean, default: false)
  - `bio` (nullable, text)
  - `created_at`, `updated_at`, `deleted_at` (timestamps)

## Routes

### Admin Routes (Web)
```
GET     /admin/physicians                   - List all physicians (with optional ?include_trashed=true)
POST    /admin/physicians                   - Create new physician
PUT     /admin/physicians/{code}            - Update physician
DELETE  /admin/physicians/{code}            - Archive physician (soft delete)
POST    /admin/physicians/{code}/restore    - Restore archived physician
DELETE  /admin/physicians/{code}/force      - Permanently delete physician
```

## Usage

### Accessing the Interface
1. Login as an Admin user
2. Navigate to **Administration** → **Physicians** in the sidebar
3. The physicians directory will be displayed

### Adding a Physician
1. Click the "Add Physician" button
2. Fill in the required fields (marked with *)
3. Optionally add medical school, experience, and bio
4. Check "Is Consultant" if applicable
5. Click "Save Physician"

### Editing a Physician
1. Find the physician in the directory
2. Click the "Edit" button on their card
3. Update the desired fields
4. Click "Update Physician"

### Archiving a Physician (Soft Delete)
1. Find the physician in the directory
2. Click the "Archive" button on their card
3. Confirm the archiving in the popup
4. The physician will be moved to archived status but can be restored later

### Viewing Archived Physicians
1. Click the "Show Archived" button in the header
2. Archived physicians will be displayed with a red background and "Archived" badge
3. Click "Hide Archived" to return to active physicians only

### Restoring an Archived Physician
1. Click "Show Archived" to view archived physicians
2. Find the archived physician
3. Click the "Restore" button on their card
4. Confirm the restoration
5. The physician will be restored to active status

### Permanently Deleting a Physician
1. Click "Show Archived" to view archived physicians
2. Find the archived physician
3. Click the "Delete Forever" button on their card
4. Confirm the permanent deletion (⚠️ This action CANNOT be undone!)
5. Note: Permanent deletion may fail if the physician has active appointments or records

### Searching Physicians
- Use the search bar to filter by:
  - Physician name
  - Physician code (PHY001, etc.)
  - Specialization
  - License number

## Validation Rules

### Required Fields
- Name
- License Number (must be unique)
- Specialization
- Qualification

### Optional Fields
- Medical School
- Years of Experience (must be >= 0)
- Is Consultant (defaults to false)
- Bio

## Security
- All routes are protected by authentication
- Only Admin users can access physician management
- CSRF protection on all form submissions
- Input validation on both frontend and backend

## Soft Delete Features

### Implementation
- Physicians are soft-deleted (archived) by default
- Archived physicians are hidden from the main list but can be viewed by clicking "Show Archived"
- Archived physicians can be restored at any time
- Permanent deletion is available for archived physicians only
- The `deleted_at` column tracks when a physician was archived

### Benefits
- Prevents accidental data loss
- Maintains historical records
- Allows for easy restoration of mistakenly deleted physicians
- Preserves referential integrity with appointments and records

### Access Points
1. **Admin Dashboard**: Navigate to Administration → Physicians card
2. **Sidebar Navigation**: Administration → Physicians
3. **Direct URL**: `/admin/physicians`

## Troubleshooting

### "Failed to add physician" Error
If you encounter errors when creating a physician:

1. **Check Required Fields**: Ensure all required fields are filled:
   - Name
   - License Number (must be unique)
   - Specialization
   - Qualification

2. **Duplicate License Number**: Each physician must have a unique license number

3. **Database Issues**: 
   - Ensure migrations have been run: `php artisan migrate`
   - Check that `user_id` is nullable in the database
   - Verify `deleted_at` column exists for soft deletes

4. **Check Laravel Logs**: View detailed error messages in `storage/logs/laravel.log`

5. **Browser Console**: Open browser developer tools (F12) to see detailed error messages

### Common Issues

**Issue**: Physician code not generating
- **Solution**: Check that the last physician's code can be parsed correctly (format: PHY###)

**Issue**: Cannot restore archived physician
- **Solution**: Ensure the physician is actually archived (has a `deleted_at` value)

**Issue**: Cannot permanently delete physician
- **Solution**: The physician may have active appointments or prescriptions. Check relationships first.

## Future Enhancements
- Bulk import physicians from CSV/Excel
- Physician availability scheduling
- Integration with appointment system
- Performance metrics and ratings
- Document uploads (certificates, licenses)
- Email notifications for new physicians
- Advanced filtering by specialization, experience range
- Export physicians list to PDF/Excel
- Bulk archive/restore operations
- Audit trail for physician changes
