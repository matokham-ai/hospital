<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Services\DepartmentService;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    protected DepartmentService $departmentService;

    public function __construct(DepartmentService $departmentService)
    {
        $this->departmentService = $departmentService;
    }

    /**
     * 🏢 Display all departments (Inertia view or JSON API)
     */
    public function index(Request $request): Response|\Illuminate\Http\JsonResponse
    {
        $departments = Department::withCount(['wards', 'testCatalogs'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        // Handle JSON fetch (e.g. via fetch/axios from React)
        if ($request->wantsJson() || $request->expectsJson()) {
            // Transform the data to ensure clean JSON structure
            $departmentData = $departments->map(function ($dept) {
                return [
                    'deptid' => $dept->deptid,
                    'name' => $dept->name,
                    'code' => $dept->code,
                    'description' => $dept->description,
                    'status' => $dept->status,
                    'wards_count' => (int) $dept->wards_count,
                    'test_catalogs_count' => (int) $dept->test_catalogs_count,
                ];
            });
            return response()->json($departmentData);
        }

        // Normal Inertia page load
        return Inertia::render('Admin/Departments', [
            'departments' => $departments->map(function ($dept) {
                return [
                    'deptid' => $dept->deptid,
                    'name' => $dept->name,
                    'code' => $dept->code,
                    'description' => $dept->description,
                    'status' => $dept->status,
                    'wards_count' => (int) $dept->wards_count,
                    'test_catalogs_count' => (int) $dept->test_catalogs_count,
                ];
            }),
            'user' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->roles->first()->name ?? 'User',
            ],
            'permissions' => $request->user()->getAllPermissions()->pluck('name'),
        ]);
    }

    /**
     * ➕ Store a new department
     */
    public function store(StoreDepartmentRequest $request)
    {
        $this->departmentService->createDepartment($request->validated());

        return redirect()->back()->with('success', 'Department created successfully.');
    }

    /**
     * ✏️ Update an existing department
     */
    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        $this->departmentService->updateDepartment($department, $request->validated());

        return redirect()->back()->with('success', 'Department updated successfully.');
    }

    /**
     * ❌ Delete (deactivate) a department
     */
    public function destroy(Department $department)
    {
        $canDelete = $this->departmentService->deactivateDepartment($department);

        if (!$canDelete) {
            return redirect()->back()->with([
                'error' => 'Cannot delete department with active references.',
            ]);
        }

        return redirect()->back()->with('success', 'Department deleted successfully.');
    }

    /**
     * 🔄 Reorder departments
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'departments' => 'required|array',
            'departments.*.deptid' => 'required|exists:departments,deptid',
            'departments.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($request->input('departments') as $data) {
            Department::where('deptid', $data['deptid'])->update(['sort_order' => $data['sort_order']]);
        }

        return redirect()->back()->with('success', 'Departments reordered successfully.');
    }

    /**
     * ⚙️ Toggle department status
     */
    public function toggleStatus(Department $department)
    {
        $newStatus = $department->status === 'active' ? 'inactive' : 'active';

        if ($newStatus === 'inactive') {
            $references = $this->departmentService->checkDepartmentReferences($department);
            if (!empty($references)) {
                return redirect()->back()->with([
                    'error' => 'Cannot deactivate department with active references.',
                ]);
            }
        }

        $this->departmentService->updateDepartment($department, ['status' => $newStatus]);

        return redirect()->back()->with('success', 'Department status updated.');
    }

    /**
     * 🧭 Dropdown options (JSON-only endpoint)
     */
    public function options()
    {
        $departments = Department::where('status', 'active')
            ->select('deptid', 'name', 'code')
            ->orderBy('name')
            ->get();

        return response()->json($departments);
    }

    /**
     * 📥 Import (JSON endpoint — used via API)
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        $results = $this->departmentService->importFromCsv($request->file('file'));

        return response()->json([
            'message' => 'Import completed',
            'imported' => $results['imported'],
            'errors' => $results['errors'],
            'skipped' => $results['skipped'],
        ]);
    }

    /**
     * 📤 Export departments (JSON or download)
     */
    public function export(Request $request)
    {
        $filters = $request->only(['status', 'search', 'has_wards', 'has_tests']);
        $format = $request->get('format', 'xlsx');
        $extension = in_array($format, ['xlsx', 'csv']) ? $format : 'xlsx';
        $filename = "departments_export_" . now()->format('Y-m-d_H-i-s') . ".{$extension}";

        $export = new \App\Exports\DepartmentExport($filters);

        return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
    }
}
