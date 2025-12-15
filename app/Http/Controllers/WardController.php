<?php

namespace App\Http\Controllers;

use App\Models\Ward;
use App\Models\Bed;
use App\Services\WardService;
use App\Services\QueryOptimizationService;
use App\Services\MasterDataCacheService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class WardController extends Controller
{
    protected WardService $wardService;
    protected QueryOptimizationService $queryService;
    protected MasterDataCacheService $cacheService;

    public function __construct(
        WardService $wardService,
        QueryOptimizationService $queryService,
        MasterDataCacheService $cacheService
    ) {
        $this->wardService = $wardService;
        $this->queryService = $queryService;
        $this->cacheService = $cacheService;
    }

    /**
     * Return wards list (for both Inertia page + JSON request)
     */
    public function index(Request $request): Response|JsonResponse
    {
        if ($request->wantsJson() || $request->expectsJson()) {
            $wards = DB::table('wards as w')
                ->leftJoin('departments as d', 'w.department_id', '=', 'd.deptid')
                ->where('w.status', '=', 'active')
                ->select(
                    'w.wardid',
                    'w.name',
                    'w.code',
                    'w.department_id',
                    'd.name as department_name',
                    'w.ward_type',
                    'w.total_beds',
                    'w.status'
                )
                ->orderBy('w.name', 'asc')
                ->get()
                ->map(function ($ward) {
                    return [
                        'id' => $ward->wardid,
                        'wardid' => $ward->wardid,
                        'name' => $ward->name,
                        'code' => $ward->code,
                        'ward_type' => $ward->ward_type,
                        'total_beds' => (int) $ward->total_beds,
                        'status' => $ward->status,
                        'department' => $ward->department_name ? [
                            'id' => $ward->department_id,
                            'name' => $ward->department_name
                        ] : null,
                        'beds' => [],
                        'available_beds' => null,
                        'occupancy_rate' => null,
                    ];
                });

            return response()->json($wards);
        }

        // Inertia render (for React page) - with bed statistics
        $wards = DB::table('wards as w')
            ->leftJoin('beds as b', 'b.ward_id', '=', 'w.wardid')
            ->leftJoin('departments as d', 'w.department_id', '=', 'd.deptid')
            ->where('w.status', '=', 'active')
            ->groupBy(
                'w.wardid',
                'w.name',
                'w.code',
                'w.ward_type',
                'w.total_beds',
                'w.status',
                'w.department_id',
                'd.name'
            )
            ->orderBy('w.name')
            ->select(
                'w.wardid',
                'w.name',
                'w.code',
                'w.ward_type',
                'w.total_beds',
                'w.status',
                'w.department_id',
                'd.name as department_name',
                DB::raw('COUNT(b.id) as actual_bed_count'),
                DB::raw('SUM(CASE WHEN LOWER(b.status) = "occupied" THEN 1 ELSE 0 END) as occupied_beds'),
                DB::raw('SUM(CASE WHEN LOWER(b.status) = "available" THEN 1 ELSE 0 END) as available_beds'),
                DB::raw('ROUND((SUM(CASE WHEN LOWER(b.status) = "occupied" THEN 1 ELSE 0 END) / NULLIF(COUNT(b.id), 0)) * 100, 1) as occupancy_rate')
            )
            ->get()
            ->map(function ($ward) {
                // Fetch actual beds for this ward
                $beds = Bed::where('ward_id', $ward->wardid)
                    ->orderBy('bed_number')
                    ->get()
                    ->map(function ($bed) {
                        return [
                            'id' => $bed->id,
                            'bed_number' => $bed->bed_number,
                            'bed_type' => $bed->bed_type,
                            'status' => $bed->status,
                            'last_occupied_at' => $bed->last_occupied_at,
                        ];
                    });

                return [
                    'id' => $ward->wardid,
                    'wardid' => $ward->wardid,
                    'name' => $ward->name,
                    'code' => $ward->code,
                    'ward_type' => $ward->ward_type,
                    'total_beds' => (int) $ward->total_beds,
                    'status' => $ward->status,
                    'department' => $ward->department_name ? [
                        'id' => $ward->department_id,
                        'name' => $ward->department_name
                    ] : null,
                    'beds' => $beds->values()->toArray(),
                    'available_beds' => (int) $ward->available_beds,
                    'occupancy_rate' => (float) $ward->occupancy_rate,
                ];
            });

        return Inertia::render('Admin/Wards', [
            'wards' => $wards->values(),
            'user' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->roles->first()->name ?? 'User',
            ],
            'permissions' => $request->user()->getAllPermissions()->pluck('name'),
        ]);
    }

    /**
     * Store a newly created ward
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:general,icu,emergency,maternity,pediatric,surgical,isolation,private',
            'department_id' => 'required|exists:departments,deptid',
            'capacity' => 'nullable|integer|min:1',
        ]);

        // Generate a unique ward ID
        $wardId = 'W' . str_pad((Ward::count() + 1), 4, '0', STR_PAD_LEFT);

        // Generate a code from the name
        $code = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $validated['name']), 0, 10));

        $ward = Ward::create([
            'wardid' => $wardId,
            'name' => $validated['name'],
            'code' => $code,
            'ward_type' => strtoupper($validated['type']),
            'department_id' => $validated['department_id'],
            'total_beds' => $validated['capacity'] ?? 0,
            'status' => 'active',
        ]);

        return response()->json([
            'id' => $ward->wardid,
            'name' => $ward->name,
            'type' => $ward->ward_type,
            'department_id' => $ward->department_id,
            'capacity' => $ward->total_beds,
        ], 201);
    }

    /**
     * Display the specified ward
     */
    public function show(string $id): JsonResponse
    {
        $ward = Ward::with('department')->findOrFail($id);

        $bedsQuery = Bed::where('ward_id', $ward->wardid);
        $totalBeds = $bedsQuery->count();
        $availableBeds = (clone $bedsQuery)->where('status', 'available')->count();
        $occupiedBeds = (clone $bedsQuery)->where('status', 'occupied')->count();
        $occupancyRate = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 1) : 0;

        return response()->json([
            'id' => $ward->wardid,
            'name' => $ward->name,
            'type' => $ward->ward_type,
            'department_id' => $ward->department_id,
            'capacity' => $ward->total_beds,
            'status' => $ward->status,
            'occupancy_rate' => $occupancyRate,
            'available_beds_count' => $availableBeds,
            'department' => $ward->department ? [
                'id' => $ward->department->deptid,
                'name' => $ward->department->name,
            ] : null,
        ]);
    }

    /**
     * Update the specified ward
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $ward = Ward::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:general,icu,emergency,maternity,pediatric,surgical,isolation,private',
            'department_id' => 'sometimes|exists:departments,deptid',
            'capacity' => 'sometimes|integer|min:1',
        ]);

        if (isset($validated['name'])) {
            $ward->name = $validated['name'];
        }
        if (isset($validated['type'])) {
            $ward->ward_type = strtoupper($validated['type']);
        }
        if (isset($validated['department_id'])) {
            $ward->department_id = $validated['department_id'];
        }
        if (isset($validated['capacity'])) {
            $ward->total_beds = $validated['capacity'];
        }

        $ward->save();

        return response()->json([
            'id' => $ward->wardid,
            'name' => $ward->name,
            'type' => $ward->ward_type,
            'department_id' => $ward->department_id,
            'capacity' => $ward->total_beds,
        ]);
    }

    /**
     * Remove the specified ward
     */
    public function destroy(string $id): JsonResponse
    {
        $ward = Ward::findOrFail($id);

        // Check if ward has beds
        $bedCount = Bed::where('ward_id', $ward->wardid)->count();
        if ($bedCount > 0) {
            return response()->json([
                'error' => 'Cannot delete ward with existing beds'
            ], 409);
        }

        $ward->delete();

        return response()->json([
            'message' => 'Ward deleted successfully'
        ]);
    }

    /**
     * Get detailed bed information including patient data
     */
    public function getBedDetails(string $bedId): JsonResponse
    {
        $bed = Bed::with([
            'ward.department',
            'bedAssignments' => function ($query) {
                $query->whereNull('released_at')
                    ->with(['encounter.patient']);
            }
        ])->findOrFail($bedId);

        $currentAssignment = $bed->bedAssignments->first();
        $patient = $currentAssignment?->encounter?->patient;

        return response()->json([
            'bed' => [
                'id' => $bed->id,
                'bed_number' => $bed->bed_number,
                'bed_type' => $bed->bed_type,
                'status' => $bed->status,
                'last_occupied_at' => $bed->last_occupied_at,
                'maintenance_notes' => $bed->maintenance_notes,
            ],
            'ward' => [
                'id' => $bed->ward->wardid,
                'name' => $bed->ward->name,
                'code' => $bed->ward->code,
                'ward_type' => $bed->ward->ward_type,
                'floor_number' => $bed->ward->floor_number,
                'department' => $bed->ward->department ? [
                    'id' => $bed->ward->department->deptid,
                    'name' => $bed->ward->department->name,
                ] : null,
            ],
            'patient' => $patient ? [
                'id' => $patient->id,
                'patient_number' => $patient->patient_number,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'date_of_birth' => $patient->date_of_birth,
                'gender' => $patient->gender,
                'blood_group' => $patient->blood_group,
                'phone' => $patient->phone,
            ] : null,
            'assignment' => $currentAssignment ? [
                'id' => $currentAssignment->id,
                'assigned_at' => $currentAssignment->assigned_at,
                'assignment_notes' => $currentAssignment->assignment_notes,
                'encounter_id' => $currentAssignment->encounter_id,
            ] : null,
        ]);
    }

    /**
     * Wards with bed counts (used by dashboards / matrix)
     */
    public function getWardsWithBeds(): JsonResponse
    {
        $wards = DB::table('wards as w')
            ->leftJoin('beds as b', 'b.ward_id', '=', 'w.wardid')
            ->leftJoin('departments as d', 'w.department_id', '=', 'd.deptid')
            ->where('w.status', '=', 'active')
            ->groupBy(
                'w.wardid',
                'w.name',
                'w.code',
                'w.ward_type',
                'w.floor_number',
                'w.status',
                'w.department_id',
                'd.name'
            )
            ->orderBy('w.name')
            ->select(
                DB::raw('NULL as id'), // 🧩 your TS wants an id:number — give it a dummy one
                'w.wardid',
                'w.name',
                'w.code',
                'w.ward_type',
                'w.floor_number',
                'w.status',
                'w.department_id',
                'd.name as department_name',
                DB::raw('COUNT(b.id) as total_beds'),
                DB::raw('SUM(CASE WHEN LOWER(b.status) = "occupied" THEN 1 ELSE 0 END) as occupied_beds'),
                DB::raw('SUM(CASE WHEN LOWER(b.status) = "available" THEN 1 ELSE 0 END) as available_beds'),
                DB::raw('ROUND((SUM(CASE WHEN LOWER(b.status) = "occupied" THEN 1 ELSE 0 END) / NULLIF(COUNT(b.id), 0)) * 100, 1) as occupancy_rate')
            )
            ->get()
            ->map(function ($ward, $index) {
                return [
                    'id' => $index + 1, // ✅ satisfy your “id: number”
                    'wardid' => $ward->wardid,
                    'name' => $ward->name,
                    'code' => $ward->code,
                    'ward_type' => $ward->ward_type,
                    'total_beds' => (int) $ward->total_beds,
                    'available_beds' => (int) $ward->available_beds,
                    'occupancy_rate' => (float) $ward->occupancy_rate,
                    'floor_number' => $ward->floor_number,
                    'status' => $ward->status,
                    'department' => $ward->department_name ? [
                        'id' => $ward->department_id ? (int) $ward->department_id : 0,
                        'name' => $ward->department_name,
                    ] : null,
                    'beds' => [], // ✅ always defined for TS safety
                ];
            });

        // Now fetch actual beds for each ward
        $wardsWithBeds = $wards->map(function ($ward) {
            $beds = Bed::where('ward_id', $ward['wardid'])
                ->orderBy('bed_number')
                ->get()
                ->map(function ($bed) {
                    return [
                        'id' => $bed->id,
                        'bed_number' => $bed->bed_number,
                        'bed_type' => $bed->bed_type,
                        'status' => $bed->status,
                        'last_occupied_at' => $bed->last_occupied_at,
                    ];
                });

            $ward['beds'] = $beds->values()->toArray();
            \Log::info('Ward ' . $ward['wardid'] . ' has ' . count($ward['beds']) . ' beds');
            return $ward;
        });

        return response()->json($wardsWithBeds->values());
    }

    /**
     * Get occupancy matrix for all wards
     */
    public function getOccupancyMatrix(): JsonResponse
    {
        $wards = Ward::with(['beds' => function ($query) {
            $query->orderBy('bed_number');
        }])->where('status', 'active')->get();

        $matrix = $wards->map(function ($ward) {
            $beds = $ward->beds->map(function ($bed) {
                return [
                    'id' => $bed->id,
                    'bed_number' => $bed->bed_number,
                    'bed_type' => $bed->bed_type,
                    'status' => $bed->status,
                ];
            });

            $totalBeds = $ward->beds->count();
            $occupiedBeds = $ward->beds->where('status', 'occupied')->count();
            $occupancyRate = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 1) : 0;

            return [
                'ward_id' => $ward->wardid,
                'ward_name' => $ward->name,
                'ward_type' => $ward->ward_type,
                'capacity' => $totalBeds,
                'occupancy_rate' => $occupancyRate,
                'beds' => $beds->values()->toArray(),
            ];
        });

        return response()->json($matrix->values());
    }

    /**
     * Get ward occupancy statistics
     */
    public function getOccupancyStats(string $id): JsonResponse
    {
        $ward = Ward::findOrFail($id);
        $beds = Bed::where('ward_id', $ward->wardid)->get();

        $totalBeds = $beds->count();
        $occupiedBeds = $beds->where('status', 'occupied')->count();
        $availableBeds = $beds->where('status', 'available')->count();
        $maintenanceBeds = $beds->where('status', 'maintenance')->count();
        $reservedBeds = $beds->where('status', 'reserved')->count();
        $occupancyRate = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 1) : 0;

        return response()->json([
            'total_beds' => $totalBeds,
            'occupied_beds' => $occupiedBeds,
            'available_beds' => $availableBeds,
            'maintenance_beds' => $maintenanceBeds,
            'reserved_beds' => $reservedBeds,
            'occupancy_rate' => $occupancyRate,
        ]);
    }

    /**
     * Get ward options for dropdowns
     */
    public function options(): JsonResponse
    {
        $wards = Ward::where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($ward) {
                return [
                    'id' => $ward->wardid,
                    'name' => $ward->name,
                    'type' => $ward->ward_type,
                ];
            });

        return response()->json($wards->values());
    }

    /**
     * Export wards data
     */
    public function export(): JsonResponse
    {
        $wards = Ward::with('department')->get()->map(function ($ward) {
            return [
                'id' => $ward->wardid,
                'name' => $ward->name,
                'type' => $ward->ward_type,
                'department' => $ward->department?->name,
                'capacity' => $ward->total_beds,
                'status' => $ward->status,
            ];
        });

        return response()->json($wards);
    }

    /**
     * Export beds data
     */
    public function exportBeds(): JsonResponse
    {
        $beds = Bed::with('ward')->get()->map(function ($bed) {
            return [
                'id' => $bed->id,
                'bed_number' => $bed->bed_number,
                'bed_type' => $bed->bed_type,
                'status' => $bed->status,
                'ward' => $bed->ward?->name,
                'last_occupied_at' => $bed->last_occupied_at,
            ];
        });

        return response()->json($beds);
    }

    /**
     * Update bed status
     */
    public function updateBedStatus(Request $request, string $bedId): JsonResponse
    {
        $bed = Bed::findOrFail($bedId);

        $validated = $request->validate([
            'status' => 'required|string|in:available,occupied,maintenance,reserved',
            'maintenance_notes' => 'nullable|string',
        ]);

        $bed->status = $validated['status'];
        if (isset($validated['maintenance_notes'])) {
            $bed->maintenance_notes = $validated['maintenance_notes'];
        }
        $bed->save();

        return response()->json([
            'id' => $bed->id,
            'status' => $bed->status,
            'maintenance_notes' => $bed->maintenance_notes,
        ]);
    }

    /**
     * Bulk update beds
     */
    public function bulkUpdateBeds(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bed_updates' => 'required|array',
            'bed_updates.*.bed_id' => 'required|exists:beds,id',
            'bed_updates.*.status' => 'required|string|in:available,occupied,maintenance,reserved',
        ]);

        foreach ($validated['bed_updates'] as $update) {
            $bed = Bed::find($update['bed_id']);
            if ($bed) {
                $bed->status = $update['status'];
                $bed->save();
            }
        }

        return response()->json([
            'message' => 'Beds updated successfully',
            'updated_count' => count($validated['bed_updates']),
        ]);
    }

    /**
     * Create beds for a ward
     */
    public function createBeds(Request $request, string $wardId): JsonResponse
    {
        $ward = Ward::findOrFail($wardId);

        $validated = $request->validate([
            'bed_count' => 'required|integer|min:1|max:100',
            'bed_type' => 'required|string|in:standard,icu,isolation,pediatric',
            'bed_number_prefix' => 'nullable|string|max:10',
        ]);

        $prefix = $validated['bed_number_prefix'] ?? 'B';
        $bedsCreated = 0;

        for ($i = 1; $i <= $validated['bed_count']; $i++) {
            Bed::create([
                'ward_id' => $ward->wardid,
                'bed_number' => sprintf('%s-%02d', $prefix, $i),
                'bed_type' => $validated['bed_type'],
                'status' => 'available',
            ]);
            $bedsCreated++;
        }

        return response()->json([
            'message' => 'Beds created successfully',
            'beds_created' => $bedsCreated,
        ]);
    }

}
