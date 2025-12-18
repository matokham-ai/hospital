<?php

namespace App\Http\Controllers\Inpatient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class LabDiagnosticsController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $priority = $request->input('priority');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = DB::table('lab_orders as lo')
            ->leftJoin('patients as p', 'lo.patient_id', '=', 'p.id')
            ->leftJoin('users as u', 'lo.ordered_by', '=', 'u.id')
            ->select(
                'lo.id',
                'lo.patient_id',
                'p.first_name',
                'p.last_name',
                'lo.test_name',
                'lo.priority',
                'lo.status',
                'u.name as ordered_by',
                'lo.created_at as ordered_at',
                'lo.updated_at as completed_at'
            )
            ->orderByDesc('lo.created_at');

        // Enhanced search functionality
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('p.first_name', 'like', "%$search%")
                    ->orWhere('p.last_name', 'like', "%$search%")
                    ->orWhere('lo.test_name', 'like', "%$search%")
                    ->orWhere('lo.ordered_by', 'like', "%$search%")
                    ->orWhere('p.id', 'like', "%$search%")
                    ->orWhereRaw("CONCAT(p.first_name, ' ', p.last_name) like ?", ["%$search%"]);
            });
        }

        // Filter by status
        if ($status) {
            $query->where('lo.status', $status);
        }

        // Filter by priority
        if ($priority) {
            $query->where('lo.priority', $priority);
        }

        // Filter by date range
        if ($dateFrom) {
            $query->whereDate('lo.created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('lo.created_at', '<=', $dateTo);
        }

        $tests = $query->paginate(15)->withQueryString();

        // Get available lab tests from the database
        $availableTests = DB::table('lab_tests')
            ->where('is_active', true)
            ->select('id', 'name', 'category', 'price')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        // Get patients for search functionality
        $patients = DB::table('patients')
            ->select('id', 'first_name', 'last_name')
            ->orderBy('first_name')
            ->get();

        $categories = DB::table('lab_orders')
            ->selectRaw('DISTINCT test_name as category')
            ->pluck('category')
            ->toArray();

        // Fetch lab results for completed tests
        $testsWithResults = $tests->getCollection()->map(function ($test) {
            if ($test->status === 'completed') {
                $results = DB::table('lab_results')
                    ->where('lab_order_id', $test->id)
                    ->select('parameter_name as parameter', 'value', 'unit', 'reference_range as referenceRange', 'status', 'description')
                    ->get()
                    ->toArray();
                $test->results = $results;
            }
            return $test;
        });

        $tests->setCollection($testsWithResults);

        return Inertia::render('Inpatient/LabsDiagnostics', [
            'tests' => $tests,
            'availableTests' => $availableTests,
            'patients' => $patients,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'priority' => $priority,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|string|exists:patients,id',
                'test_name' => 'required|string|max:255',
                'priority' => 'required|in:routine,asap,urgent,stat,critical,timed,fast,normal',
            ]);

            // Try to find an active encounter for this patient, or create a default one
            $encounter = DB::table('encounters')
                ->where('patient_id', $validated['patient_id'])
                ->where('status', 'ACTIVE')
                ->first();

            $encounterId = $encounter ? $encounter->id : null;

            // If no active encounter, create a default outpatient encounter for lab orders
            if (!$encounterId) {
                $encounterId = DB::table('encounters')->insertGetId([
                    'encounter_number' => 'LAB-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'patient_id' => $validated['patient_id'],
                    'type' => 'OPD', // Outpatient for lab orders
                    'status' => 'ACTIVE',
                    'admission_datetime' => now(),
                    'chief_complaint' => 'Laboratory investigation',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $labOrderId = DB::table('lab_orders')->insertGetId([
                'patient_id' => $validated['patient_id'],
                'test_name' => $validated['test_name'],
                'priority' => $validated['priority'],
                'status' => 'pending',
                'ordered_by' => auth()->id() ?? 1,
                'encounter_id' => $encounterId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Log the successful creation
            \Log::info('Lab test ordered successfully', [
                'lab_order_id' => $labOrderId,
                'patient_id' => $validated['patient_id'],
                'test_name' => $validated['test_name'],
                'priority' => $validated['priority'],
                'ordered_by' => auth()->id() ?? 1
            ]);

            return redirect()->route('inpatient.labs')->with('success', 'Test ordered successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in lab order creation', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Error creating lab order', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);
            return redirect()->back()->withErrors(['error' => 'Failed to create lab order: ' . $e->getMessage()]);
        }
    }

    public function getResults($orderId)
    {
        $results = DB::table('lab_results')
            ->where('lab_order_id', $orderId)
            ->select('parameter_name as parameter', 'value', 'unit', 'reference_range as referenceRange', 'status', 'description')
            ->get();

        return response()->json($results);
    }

    public function updateStatus(Request $request, $orderId)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled'
        ]);

        $order = DB::table('lab_orders')->where('id', $orderId)->first();

        if (!$order) {
            return response()->json(['error' => 'Lab order not found'], 404);
        }

        DB::table('lab_orders')
            ->where('id', $orderId)
            ->update([
                'status' => $validated['status'],
                'updated_at' => now()
            ]);

        // If marking as completed and no results exist, generate sample results
        if ($validated['status'] === 'completed') {
            $existingResults = DB::table('lab_results')->where('lab_order_id', $orderId)->count();

            if ($existingResults === 0) {
                $this->generateResultsForOrder($orderId, $order->test_name);
            }
        }

        return response()->json(['success' => true, 'message' => 'Status updated successfully']);
    }

    private function generateResultsForOrder($orderId, $testName)
    {
        $results = $this->generateSampleResults($testName, $orderId);

        foreach ($results as $result) {
            DB::table('lab_results')->insert([
                'lab_order_id' => $orderId,
                'parameter_name' => $result['parameter'],
                'value' => $result['value'],
                'unit' => $result['unit'],
                'reference_range' => $result['referenceRange'],
                'status' => $result['status'],
                'description' => $result['description'],
                'result' => $result['value'] . ' ' . $result['unit'],
                'normal_range' => $result['referenceRange'],
                'validated_by' => auth()->user()->name ?? 'System',
                'validated_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function generateSampleResults($testName, $orderId)
    {
        $testNameLower = strtolower($testName);
        $variation = ($orderId % 3) - 1; // -1, 0, or 1 for variation

        if (strpos($testNameLower, 'blood count') !== false || strpos($testNameLower, 'cbc') !== false) {
            return [
                [
                    'parameter' => 'Hemoglobin',
                    'value' => (14.2 + ($variation * 0.5)),
                    'unit' => 'g/dL',
                    'referenceRange' => '12.0-16.0',
                    'status' => $this->getResultStatus(14.2 + ($variation * 0.5), 12.0, 16.0),
                    'description' => 'Hemoglobin carries oxygen from lungs to body tissues'
                ],
                [
                    'parameter' => 'White Blood Cells',
                    'value' => (7.8 + ($variation * 1.2)),
                    'unit' => '×10³/μL',
                    'referenceRange' => '4.0-11.0',
                    'status' => $this->getResultStatus(7.8 + ($variation * 1.2), 4.0, 11.0),
                    'description' => 'White blood cells fight infection and disease'
                ],
                [
                    'parameter' => 'Platelets',
                    'value' => (280 + ($variation * 30)),
                    'unit' => '×10³/μL',
                    'referenceRange' => '150-450',
                    'status' => $this->getResultStatus(280 + ($variation * 30), 150, 450),
                    'description' => 'Platelets help blood clot to stop bleeding'
                ]
            ];
        }

        if (strpos($testNameLower, 'kidney') !== false || strpos($testNameLower, 'renal') !== false) {
            return [
                [
                    'parameter' => 'Creatinine',
                    'value' => (1.1 + ($variation * 0.2)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '0.6-1.2',
                    'status' => $this->getResultStatus(1.1 + ($variation * 0.2), 0.6, 1.2),
                    'description' => 'Waste product filtered by kidneys, elevated levels may indicate kidney dysfunction'
                ],
                [
                    'parameter' => 'Blood Urea Nitrogen (BUN)',
                    'value' => (15 + ($variation * 3)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '7-20',
                    'status' => $this->getResultStatus(15 + ($variation * 3), 7, 20),
                    'description' => 'Waste product from protein breakdown, elevated levels may indicate kidney problems'
                ],
                [
                    'parameter' => 'eGFR',
                    'value' => (85 + ($variation * 10)),
                    'unit' => 'mL/min/1.73m²',
                    'referenceRange' => '>60',
                    'status' => (85 + ($variation * 10)) > 60 ? 'normal' : 'abnormal',
                    'description' => 'Estimated glomerular filtration rate, measures kidney function'
                ],
                [
                    'parameter' => 'Uric Acid',
                    'value' => (5.5 + ($variation * 0.8)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '3.4-7.0',
                    'status' => $this->getResultStatus(5.5 + ($variation * 0.8), 3.4, 7.0),
                    'description' => 'Waste product that can form crystals in joints and kidneys when elevated'
                ]
            ];
        }

        if (strpos($testNameLower, 'liver') !== false || strpos($testNameLower, 'lft') !== false) {
            return [
                [
                    'parameter' => 'ALT (Alanine Aminotransferase)',
                    'value' => (45 + ($variation * 8)),
                    'unit' => 'U/L',
                    'referenceRange' => '7-56',
                    'status' => $this->getResultStatus(45 + ($variation * 8), 7, 56),
                    'description' => 'Enzyme found mainly in the liver, elevated levels may indicate liver damage'
                ],
                [
                    'parameter' => 'AST (Aspartate Aminotransferase)',
                    'value' => (38 + ($variation * 6)),
                    'unit' => 'U/L',
                    'referenceRange' => '10-40',
                    'status' => $this->getResultStatus(38 + ($variation * 6), 10, 40),
                    'description' => 'Enzyme found in liver and other tissues, elevated levels suggest tissue damage'
                ],
                [
                    'parameter' => 'Bilirubin Total',
                    'value' => (0.8 + ($variation * 0.2)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '0.3-1.2',
                    'status' => $this->getResultStatus(0.8 + ($variation * 0.2), 0.3, 1.2),
                    'description' => 'Waste product from breakdown of red blood cells, processed by liver'
                ]
            ];
        }

        if (strpos($testNameLower, 'thyroid') !== false || strpos($testNameLower, 'tsh') !== false) {
            return [
                [
                    'parameter' => 'TSH',
                    'value' => (2.1 + ($variation * 0.5)),
                    'unit' => 'mIU/L',
                    'referenceRange' => '0.4-4.0',
                    'status' => $this->getResultStatus(2.1 + ($variation * 0.5), 0.4, 4.0),
                    'description' => 'Thyroid stimulating hormone, regulates thyroid function'
                ],
                [
                    'parameter' => 'Free T4',
                    'value' => (1.3 + ($variation * 0.2)),
                    'unit' => 'ng/dL',
                    'referenceRange' => '0.8-1.8',
                    'status' => $this->getResultStatus(1.3 + ($variation * 0.2), 0.8, 1.8),
                    'description' => 'Free thyroxine, main thyroid hormone affecting metabolism'
                ]
            ];
        }

        if (strpos($testNameLower, 'lipid') !== false || strpos($testNameLower, 'cholesterol') !== false) {
            return [
                [
                    'parameter' => 'Total Cholesterol',
                    'value' => (180 + ($variation * 20)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '<200',
                    'status' => (180 + ($variation * 20)) < 200 ? 'normal' : 'abnormal',
                    'description' => 'Total cholesterol level in blood'
                ],
                [
                    'parameter' => 'HDL Cholesterol',
                    'value' => (55 + ($variation * 5)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '>40',
                    'status' => (55 + ($variation * 5)) > 40 ? 'normal' : 'abnormal',
                    'description' => 'High-density lipoprotein, "good" cholesterol'
                ],
                [
                    'parameter' => 'LDL Cholesterol',
                    'value' => (110 + ($variation * 15)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '<100',
                    'status' => (110 + ($variation * 15)) < 100 ? 'normal' : 'abnormal',
                    'description' => 'Low-density lipoprotein, "bad" cholesterol'
                ]
            ];
        }

        if (strpos($testNameLower, 'glucose') !== false || strpos($testNameLower, 'sugar') !== false) {
            return [
                [
                    'parameter' => 'Glucose',
                    'value' => (95 + ($variation * 15)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '70-140',
                    'status' => $this->getResultStatus(95 + ($variation * 15), 70, 140),
                    'description' => 'Blood sugar level, important for energy metabolism'
                ]
            ];
        }

        if (strpos($testNameLower, 'urine') !== false) {
            return [
                [
                    'parameter' => 'Bacteria',
                    'value' => $variation > 0 ? 'Light growth' : 'No growth',
                    'unit' => '',
                    'referenceRange' => 'No growth',
                    'status' => $variation > 0 ? 'abnormal' : 'normal',
                    'description' => 'Presence of bacteria may indicate urinary tract infection'
                ],
                [
                    'parameter' => 'White Blood Cells',
                    'value' => (2 + abs($variation)),
                    'unit' => '/hpf',
                    'referenceRange' => '0-5',
                    'status' => $this->getResultStatus(2 + abs($variation), 0, 5),
                    'description' => 'Elevated WBC in urine may indicate inflammation or infection'
                ]
            ];
        }

        // For imaging tests (X-Ray, CT, MRI, Ultrasound, ECG)
        if (strpos($testNameLower, 'x-ray') !== false || strpos($testNameLower, 'xray') !== false ||
            strpos($testNameLower, 'ct') !== false || strpos($testNameLower, 'mri') !== false ||
            strpos($testNameLower, 'ultrasound') !== false || strpos($testNameLower, 'ecg') !== false ||
            strpos($testNameLower, 'scan') !== false) {

            $findings = $variation > 0 ? 'Mild abnormalities noted' : 'Normal findings';
            $status = $variation > 0 ? 'abnormal' : 'normal';

            return [
                [
                    'parameter' => 'Findings',
                    'value' => $findings,
                    'unit' => '',
                    'referenceRange' => 'Normal',
                    'status' => $status,
                    'description' => 'Radiological interpretation of the imaging study'
                ],
                [
                    'parameter' => 'Impression',
                    'value' => $status === 'normal' ? 'No acute abnormalities detected' : 'Further clinical correlation recommended',
                    'unit' => '',
                    'referenceRange' => 'Normal',
                    'status' => $status,
                    'description' => 'Clinical impression based on imaging findings'
                ]
            ];
        }

        // Default for other tests
        return [
            [
                'parameter' => 'Result',
                'value' => 'Normal',
                'unit' => '',
                'referenceRange' => 'Normal',
                'status' => 'normal',
                'description' => 'Test completed successfully with normal findings'
            ]
        ];
    }

    private function getResultStatus($value, $min, $max)
    {
        if ($value < $min || $value > $max) {
            $range = $max - $min;
            $deviation = max(abs($value - $min), abs($value - $max));

            if ($deviation > $range * 0.5) {
                return 'critical';
            }
            return 'abnormal';
        }
        return 'normal';
    }

    public function generatePdf($orderId)
    {
        try {
            $order = DB::table('lab_orders as lo')
                ->leftJoin('patients as p', 'lo.patient_id', '=', 'p.id')
                ->leftJoin('users as u', 'lo.ordered_by', '=', 'u.id')
                ->where('lo.id', $orderId)
                ->select(
                    'lo.*',
                    'p.first_name',
                    'p.last_name',
                    'u.name as ordered_by_name'
                )
                ->first();

            if (!$order) {
                return response()->json(['error' => 'Lab order not found'], 404);
            }

            $results = DB::table('lab_results')
                ->where('lab_order_id', $orderId)
                ->get();

            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('lab-results-pdf', compact('order', 'results'))
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'defaultFont' => 'Arial',
                    'isRemoteEnabled' => true,
                    'isHtml5ParserEnabled' => true,
                ]);

            $filename = 'lab-results-' . $order->patient_id . '-' . date('Y-m-d') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            \Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    public function previewPdf($orderId)
    {
        try {
            $order = DB::table('lab_orders as lo')
                ->leftJoin('patients as p', 'lo.patient_id', '=', 'p.id')
                ->leftJoin('users as u', 'lo.ordered_by', '=', 'u.id')
                ->where('lo.id', $orderId)
                ->select(
                    'lo.*',
                    'p.first_name',
                    'p.last_name',
                    'u.name as ordered_by_name'
                )
                ->first();

            if (!$order) {
                return response()->json(['error' => 'Lab order not found'], 404);
            }

            $results = DB::table('lab_results')
                ->where('lab_order_id', $orderId)
                ->get();

            // Generate PDF for inline viewing
            $pdf = Pdf::loadView('lab-results-pdf', compact('order', 'results'))
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'defaultFont' => 'Arial',
                    'isRemoteEnabled' => true,
                    'isHtml5ParserEnabled' => true,
                ]);

            return $pdf->stream('lab-results-preview.pdf');

        } catch (\Exception $e) {
            \Log::error('PDF Preview Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF preview: ' . $e->getMessage()], 500);
        }
    }

    public function storeResults(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'results' => 'required|array|min:1',
                'results.*.parameter' => 'required|string|max:255',
                'results.*.value' => 'required|string|max:255',
                'results.*.unit' => 'nullable|string|max:100',
                'results.*.reference_range' => 'nullable|string|max:255',
                'results.*.status' => 'required|in:normal,abnormal,critical',
                'results.*.description' => 'nullable|string|max:1000',
            ]);

            $order = DB::table('lab_orders')->where('id', $orderId)->first();

            if (!$order) {
                return response()->json(['error' => 'Lab order not found'], 404);
            }

            // Delete existing results for this order
            DB::table('lab_results')->where('lab_order_id', $orderId)->delete();

            // Insert new results
            foreach ($validated['results'] as $result) {
                DB::table('lab_results')->insert([
                    'lab_order_id' => $orderId,
                    'parameter_name' => $result['parameter'],
                    'value' => $result['value'],
                    'unit' => $result['unit'] ?? '',
                    'reference_range' => $result['reference_range'] ?? '',
                    'status' => $result['status'],
                    'description' => $result['description'] ?? '',
                    'result' => $result['value'] . ' ' . ($result['unit'] ?? ''),
                    'normal_range' => $result['reference_range'] ?? '',
                    'validated_by' => auth()->user()->name ?? 'Lab Technician',
                    'validated_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Mark order as completed
            DB::table('lab_orders')
                ->where('id', $orderId)
                ->update([
                    'status' => 'completed',
                    'updated_at' => now()
                ]);

            \Log::info('Lab results stored successfully', [
                'lab_order_id' => $orderId,
                'result_count' => count($validated['results']),
                'entered_by' => auth()->user()->name ?? 'Unknown'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lab results saved successfully'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in lab results entry', [
                'errors' => $e->errors(),
                'lab_order_id' => $orderId
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Error storing lab results', [
                'error' => $e->getMessage(),
                'lab_order_id' => $orderId
            ]);
            return response()->json([
                'error' => 'Failed to save results: ' . $e->getMessage()
            ], 500);
        }
    }

    public function storeNewTest(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:lab_tests,name',
                'category' => 'required|string|max:100',
                'price' => 'required|numeric|min:0.01',
                'code' => 'nullable|string|max:20|unique:lab_tests,code',
            ]);

            $testId = DB::table('lab_tests')->insertGetId([
                'name' => $validated['name'],
                'category' => $validated['category'],
                'price' => $validated['price'],
                'code' => $validated['code'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            \Log::info('New lab test created successfully', [
                'test_id' => $testId,
                'test_name' => $validated['name'],
                'created_by' => auth()->user()->name ?? 'Unknown'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lab test created successfully',
                'data' => [
                    'id' => $testId,
                    'name' => $validated['name'],
                    'category' => $validated['category'],
                    'price' => $validated['price'],
                    'code' => $validated['code'] ?? null,
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Validation error in creating new lab test', [
                'errors' => $e->errors()
            ]);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating new lab test', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to create lab test: ' . $e->getMessage()
            ], 500);
        }
    }
}
