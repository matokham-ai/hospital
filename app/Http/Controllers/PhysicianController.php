<?php

namespace App\Http\Controllers;

use App\Models\Physician;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PhysicianController extends Controller
{
    /**
     * Display a listing of physicians
     */
    public function index(Request $request): Response
    {
        // Check if we should include trashed physicians
        $includeTrashed = $request->get('include_trashed', false);
        
        $query = Physician::query();
        
        if ($includeTrashed) {
            $query->withTrashed();
        }
        
        $physicians = $query->orderBy('physician_code', 'asc')->get();

        return Inertia::render('Admin/Physicians', [
            'physicians' => $physicians,
            'includeTrashed' => $includeTrashed,
        ]);
    }

    /**
     * Store a newly created physician
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license_number' => 'required|string|max:50|unique:physicians,license_number',
            'specialization' => 'required|string|max:100',
            'qualification' => 'required|string|max:100',
            'medical_school' => 'nullable|string|max:255',
            'years_of_experience' => 'nullable|integer|min:0',
            'is_consultant' => 'nullable|boolean',
            'bio' => 'nullable|string',
        ]);

        // Log the incoming request for debugging
        \Log::info('Creating physician with data:', $validated);

        DB::beginTransaction();
        try {
            // Generate physician code - include soft deleted to avoid duplicates
            // Get the highest numeric value from existing physician codes
            $lastPhysician = Physician::withTrashed()
                ->selectRaw('MAX(CAST(SUBSTRING(physician_code, 4) AS UNSIGNED)) as max_number')
                ->first();
            
            $nextNumber = ($lastPhysician && $lastPhysician->max_number) ? $lastPhysician->max_number + 1 : 1;
            $physicianCode = 'PHY' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            // Create physician record
            $physician = Physician::create([
                'physician_code' => $physicianCode,
                'name' => $validated['name'],
                'license_number' => $validated['license_number'],
                'specialization' => $validated['specialization'],
                'qualification' => $validated['qualification'],
                'medical_school' => $validated['medical_school'] ?? null,
                'years_of_experience' => $validated['years_of_experience'] ?? null,
                'is_consultant' => $validated['is_consultant'] ?? false,
                'bio' => $validated['bio'] ?? null,
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Physician added successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating physician: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'data' => $validated ?? []
            ]);
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create physician: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Update the specified physician
     */
    public function update(Request $request, string $code)
    {
        $physician = Physician::where('physician_code', $code)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license_number' => 'required|string|max:50|unique:physicians,license_number,' . $physician->physician_code . ',physician_code',
            'specialization' => 'required|string|max:100',
            'qualification' => 'required|string|max:100',
            'medical_school' => 'nullable|string|max:255',
            'years_of_experience' => 'nullable|integer|min:0',
            'is_consultant' => 'nullable|boolean',
            'bio' => 'nullable|string',
        ]);

        try {
            $physician->update([
                'name' => $validated['name'],
                'license_number' => $validated['license_number'],
                'specialization' => $validated['specialization'],
                'qualification' => $validated['qualification'],
                'medical_school' => $validated['medical_school'] ?? null,
                'years_of_experience' => $validated['years_of_experience'] ?? null,
                'is_consultant' => $validated['is_consultant'] ?? false,
                'bio' => $validated['bio'] ?? null,
            ]);

            return redirect()->back()->with('success', 'Physician updated successfully');
        } catch (\Exception $e) {
            \Log::error('Error updating physician: ' . $e->getMessage());
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update physician: ' . $e->getMessage()]);
        }
    }

    /**
     * Soft delete the specified physician
     */
    public function destroy(string $code)
    {
        try {
            $physician = Physician::where('physician_code', $code)->firstOrFail();
            
            // Soft delete the physician
            $physician->delete();

            return redirect()->back()->with('success', 'Physician archived successfully');
        } catch (\Exception $e) {
            \Log::error('Error deleting physician: ' . $e->getMessage());
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to archive physician.']);
        }
    }

    /**
     * Restore a soft-deleted physician
     */
    public function restore(string $code)
    {
        try {
            $physician = Physician::withTrashed()->where('physician_code', $code)->firstOrFail();
            
            if (!$physician->trashed()) {
                return redirect()->back()->withErrors(['error' => 'Physician is not archived.']);
            }
            
            $physician->restore();

            return redirect()->back()->with('success', 'Physician restored successfully');
        } catch (\Exception $e) {
            \Log::error('Error restoring physician: ' . $e->getMessage());
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to restore physician.']);
        }
    }

    /**
     * Permanently delete the specified physician
     */
    public function forceDestroy(string $code)
    {
        try {
            $physician = Physician::withTrashed()->where('physician_code', $code)->firstOrFail();
            
            // Check if physician has any appointments or records
            // Add your relationship checks here if needed
            // Example: if ($physician->appointments()->exists()) { ... }
            
            $physician->forceDelete();

            return redirect()->back()->with('success', 'Physician permanently deleted');
        } catch (\Exception $e) {
            \Log::error('Error permanently deleting physician: ' . $e->getMessage());
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to permanently delete physician. They may have active appointments or records.']);
        }
    }
}
