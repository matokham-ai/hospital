<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $role = $user ? $user->getRoleNames()->first() : 'Guest';

        $query = Patient::with(['contacts']);

        // Apply filters
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('hospital_id', 'like', "%{$search}%")
                  ->orWhereHas('contacts', function ($contactQuery) use ($search) {
                      $contactQuery->where('phone_number', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Gender filter
        if ($gender = $request->input('gender')) {
            $query->where('gender', $gender);
        }

        // Age range filter
        if ($ageMin = $request->input('age_min')) {
            $query->whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) >= ?', [$ageMin]);
        }
        if ($ageMax = $request->input('age_max')) {
            $query->whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) <= ?', [$ageMax]);
        }

        // Location filters
        if ($city = $request->input('city')) {
            $query->whereHas('addresses', function ($addressQuery) use ($city) {
                $addressQuery->where('town_city', 'like', "%{$city}%");
            });
        }
        if ($state = $request->input('state')) {
            $query->whereHas('addresses', function ($addressQuery) use ($state) {
                $addressQuery->where('state_province', 'like', "%{$state}%");
            });
        }

        // Medical condition filters
        if ($request->input('has_allergies')) {
            $query->where(function ($q) {
                $q->whereNotNull('allergies')
                  ->where(function ($subQ) {
                      $subQ->where('allergies', '!=', '')
                           ->orWhere('allergies', '!=', '[]')
                           ->orWhere('allergies', '!=', 'null');
                  });
            });
        }
        if ($request->input('has_chronic_conditions')) {
            $query->where(function ($q) {
                $q->whereNotNull('chronic_conditions')
                  ->where(function ($subQ) {
                      $subQ->where('chronic_conditions', '!=', '')
                           ->orWhere('chronic_conditions', '!=', '[]')
                           ->orWhere('chronic_conditions', '!=', 'null');
                  });
            });
        }

        //  Sort newest first
        $patients = $query->latest()
            ->paginate(10)
            ->through(function ($patient) {
                $primaryContact = $patient->contacts->where('is_primary', true)->first() 
                                ?? $patient->contacts->first();
                
                return [
                    'id' => $patient->id,
                    'patient_number' => $patient->hospital_id, // Using hospital_id as patient number
                    'name' => "{$patient->first_name} {$patient->last_name}",
                    'gender' => ucfirst($patient->gender ?? 'N/A'),
                    'age' => $patient->date_of_birth ? (int) \Carbon\Carbon::parse($patient->date_of_birth)->diffInYears(now()) : '—',
                    'phone' => $primaryContact ? $primaryContact->phone_number : null,
                    'email' => $primaryContact ? $primaryContact->email : null,
                    'status' => 'Active', // Default status since it's not in the database
                    'registered' => $patient->created_at->format('d M Y'),
                ];
            });

        // Calculate additional statistics
        $totalPatients = Patient::count();
        $statistics = [
            'total_patients' => $totalPatients,
            'new_this_month' => Patient::whereMonth('created_at', now()->month)
                                     ->whereYear('created_at', now()->year)
                                     ->count(),
            'new_this_week' => Patient::whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])->count(),
            'gender_distribution' => [
                'male' => Patient::where('gender', 'M')->count(),
                'female' => Patient::where('gender', 'F')->count(),
                'other' => Patient::where('gender', 'O')->count(),
            ],
            'age_groups' => [
                'children' => Patient::whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18')->count(),
                'adults' => Patient::whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 64')->count(),
                'seniors' => Patient::whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) >= 65')->count(),
            ],
            'with_allergies' => Patient::where(function($q) {
                $q->whereNotNull('allergies')
                  ->where('allergies', '!=', '[]')
                  ->where('allergies', '!=', '');
            })->count(),
            'with_chronic_conditions' => Patient::where(function($q) {
                $q->whereNotNull('chronic_conditions')
                  ->where('chronic_conditions', '!=', '[]')
                  ->where('chronic_conditions', '!=', '');
            })->count(),
            'with_email' => Patient::whereHas('contacts', function($q) {
                $q->whereNotNull('email')->where('email', '!=', '');
            })->count(),
        ];

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'statistics' => $statistics,
            'filters' => $request->only([
                'search', 'gender', 'age_min', 'age_max', 'status', 
                'city', 'state', 'has_allergies', 'has_chronic_conditions', 
                'insurance_provider'
            ]),
            'auth' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role,
                ]
            ],
        ]);
    }

    public function show(Request $request, $id)
    {
        try {
            // Validate that the ID is not a search term or invalid format
            if (!is_numeric($id) && !preg_match('/^PAT\d+$/', $id)) {
                throw new \Illuminate\Database\Eloquent\ModelNotFoundException("Invalid patient ID format: {$id}");
            }
            
            $patient = Patient::with(['contacts', 'addresses'])->findOrFail($id);
            
            $primaryContact = $patient->contacts->where('is_primary', true)->first() 
                            ?? $patient->contacts->first();
            
            // Get the most recent active encounter (ACTIVE status) first, then any recent encounter
            $activeEncounter = \DB::table('encounters')
                ->where('patient_id', $patient->id)
                ->where('status', 'ACTIVE')
                ->orderBy('admission_datetime', 'desc')
                ->first();
            
            $recentEncounter = $activeEncounter ?: \DB::table('encounters')
                ->where('patient_id', $patient->id)
                ->orderBy('admission_datetime', 'desc')
                ->first();
            
            $diagnoses = [];
            $bedNumber = null;
            $admissionDate = null;
            $isAdmitted = false;
            
            if ($recentEncounter) {
                // Check if patient is currently admitted (has active encounter)
                $isAdmitted = $activeEncounter !== null;
                
                // Get diagnoses for the most recent encounter
                $diagnosesData = \DB::table('diagnoses')
                    ->where('encounter_id', $recentEncounter->id)
                    ->orderBy('type', 'asc') // Primary first, then Secondary
                    ->get();
                
                foreach ($diagnosesData as $diagnosis) {
                    $diagnoses[] = [
                        'description' => $diagnosis->description,
                        'icd10_code' => $diagnosis->icd10_code,
                        'type' => $diagnosis->type,
                    ];
                }
                
                // Only get bed assignment if patient is currently admitted
                if ($isAdmitted) {
                    $bedAssignment = \DB::table('bed_assignments')
                        ->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
                        ->where('bed_assignments.encounter_id', $recentEncounter->id)
                        ->whereNull('bed_assignments.released_at') // Only active bed assignments
                        ->orderBy('bed_assignments.assigned_at', 'desc')
                        ->select('beds.bed_number')
                        ->first();
                    
                    $bedNumber = $bedAssignment ? $bedAssignment->bed_number : null;
                    $admissionDate = $recentEncounter->admission_datetime;
                }
            }
            
            // Get emergency contact and address info
            $emergencyContact = $patient->contacts->where('contact_type', 'EMERGENCY')->first();
            $primaryAddress = $patient->addresses->where('is_primary', true)->first() 
                            ?? $patient->addresses->first();

            // Calculate age group
            $age = $patient->date_of_birth ? (int) \Carbon\Carbon::parse($patient->date_of_birth)->diffInYears(now()) : 0;
            $ageGroup = 'Adult'; // Default
            if ($age < 0.08) $ageGroup = 'Newborn';
            elseif ($age < 2) $ageGroup = 'Infant';
            elseif ($age < 12) $ageGroup = 'Child';
            elseif ($age < 18) $ageGroup = 'Adolescent';
            elseif ($age < 35) $ageGroup = 'Young Adult';
            elseif ($age < 65) $ageGroup = 'Adult';
            else $ageGroup = 'Senior';

            $patientData = [
                'id' => $patient->id,
                'hospital_id' => $patient->hospital_id,
                'patient_number' => $patient->hospital_id,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'middle_name' => $patient->middle_name,
                'name' => "{$patient->first_name} {$patient->last_name}",
                'gender' => $patient->gender,
                'phone_number' => $primaryContact ? $primaryContact->phone_number : null,
                'phone' => $primaryContact ? $primaryContact->phone_number : null,
                'email' => $primaryContact ? $primaryContact->email : null,
                'status' => 'Active',
                'date_of_birth' => $patient->date_of_birth,
                'age' => $age,
                'age_group' => $ageGroup,
                'marital_status' => $patient->marital_status,
                'nationality' => $patient->nationality,
                'occupation' => $patient->occupation,
                'religion' => $patient->religion,
                'allergies' => is_array($patient->allergies) ? implode(', ', $patient->allergies) : ($patient->allergies ?? ''),
                'chronic_conditions' => is_array($patient->chronic_conditions) ? implode(', ', $patient->chronic_conditions) : ($patient->chronic_conditions ?? ''),
                'current_medications' => '', // Add this field to your database if needed
                'insurance_provider' => '', // Add this field to your database if needed
                'insurance_number' => '', // Add this field to your database if needed
                'notes' => '', // Add this field to your database if needed
                
                // Emergency contact
                'emergency_contact_name' => $emergencyContact ? $emergencyContact->name : null,
                'emergency_contact_phone' => $emergencyContact ? $emergencyContact->phone_number : null,
                'emergency_contact_relationship' => $emergencyContact ? $emergencyContact->relationship : null,
                
                // Address
                'address_line_1' => $primaryAddress ? $primaryAddress->address_line1 : null,
                'address_line_2' => $primaryAddress ? $primaryAddress->address_line2 : null,
                'city' => $primaryAddress ? $primaryAddress->town_city : null,
                'state' => $primaryAddress ? $primaryAddress->state_province : null,
                'postal_code' => $primaryAddress ? $primaryAddress->postal_code : null,
                'country' => $primaryAddress ? $primaryAddress->country : null,
                
                // Medical info
                'diagnoses' => $diagnoses,
                'admission_date' => $admissionDate,
                'bed_number' => $bedNumber,
                'is_admitted' => $isAdmitted,
                'created_at' => $patient->created_at->toISOString(),
                'updated_at' => $patient->updated_at->toISOString(),
                
                // Medical alerts (you can enhance this logic)
                'medical_alerts' => $this->generateMedicalAlerts($patient, $age),
                
                // Recent visits (placeholder - you can implement this)
                'recent_visits' => [],
                
                // Keep legacy fields for backward compatibility
                'diagnosis' => !empty($diagnoses) ? $diagnoses[0]['description'] . ' (' . $diagnoses[0]['icd10_code'] . ')' : null,
            ];
            
            // If it's an AJAX request or wants JSON, return JSON
            if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json($patientData, 200, [
                    'Content-Type' => 'application/json',
                ]);
            }
            
            // Otherwise, return a regular view (for future use)
            return Inertia::render('Patients/Show', [
                'patient' => $patientData,
                'auth' => [
                    'user' => [
                        'name' => Auth::user()->name,
                        'email' => Auth::user()->email,
                        'role' => Auth::user()->getRoleNames()->first(),
                    ]
                ],
            ]);
            
        } catch (\Exception $e) {
            
            if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                $errorMessage = 'Patient not found';
                $statusCode = 404;
                
                // Provide more specific error messages
                if (strpos($e->getMessage(), 'Invalid patient ID format') !== false) {
                    $errorMessage = 'Invalid patient ID format';
                    $statusCode = 400;
                } elseif ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    $errorMessage = 'Patient not found';
                    $statusCode = 404;
                }
                
                return response()->json([
                    'error' => $errorMessage,
                    'message' => $e->getMessage(),
                    'id_searched' => $id
                ], $statusCode, [
                    'Content-Type' => 'application/json',
                ]);
            }
            
            return redirect()->route('web.patients.index')->with('error', 'Patient not found.');
        }
    }

    public function create()
    {
        $user = Auth::user();
        
        return Inertia::render('Patients/Create', [
            'auth' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->getRoleNames()->first(),
                ]
            ],
        ]);
    }

    public function store(Request $request)
    {
        // Validate CSRF token explicitly
        if (!$request->hasValidSignature(false) && !$request->session()->token() === $request->input('_token')) {
            \Log::warning('CSRF token validation issue detected', [
                'session_token' => $request->session()->token(),
                'request_token' => $request->input('_token'),
            ]);
        }

        $validated = $request->validate([
            // Personal Information
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'date_of_birth' => 'required|date|before:today',
            'gender' => 'required|in:M,F,O',
            'marital_status' => 'nullable|string|max:20',
            'occupation' => 'nullable|string|max:100',
            'nationality' => 'nullable|string|max:50',
            'religion' => 'nullable|string|max:50',
            
            // Contact Information
            'phone_number' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'emergency_contact_name' => 'required|string|max:100',
            'emergency_contact_phone' => 'required|string|max:20',
            'emergency_contact_relationship' => 'required|string|max:50',
            
            // Address Information
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:50',
            
            // Medical Information
            'allergies' => 'nullable|string',
            'chronic_conditions' => 'nullable|string',
            'current_medications' => 'nullable|string',
            
            // Insurance & Notes
            'insurance_provider' => 'nullable|string|max:100',
            'insurance_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        try {
            \Log::info('Starting patient creation', ['validated_data' => $validated]);
            
            // Use database transaction for data consistency and concurrent request handling
            $patient = \DB::transaction(function () use ($validated) {
                // Test database connection
                \DB::connection()->getPdo();
                \Log::info('Database connection successful');
                
                // Check if patients table exists
                if (!\Schema::hasTable('patients')) {
                    throw new \Exception('Patients table does not exist. Please run migrations.');
                }
                \Log::info('Patients table exists');
                
                // Generate unique patient ID and hospital ID with row locking to prevent duplicates
                $patientCount = \DB::table('patients')->lockForUpdate()->count();
                $patientId = 'PAT' . str_pad($patientCount + 1, 6, '0', STR_PAD_LEFT);
                $hospitalId = 'HMS-' . date('Y') . '-' . str_pad($patientCount + 1, 6, '0', STR_PAD_LEFT);
                
                \Log::info('Generated IDs', ['patient_id' => $patientId, 'hospital_id' => $hospitalId]);

                // Prepare patient data
                $patientData = [
                    'id' => $patientId,
                    'hospital_id' => $hospitalId,
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'middle_name' => $validated['middle_name'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'gender' => $validated['gender'], // Already in correct format (M, F, O)
                    'marital_status' => $validated['marital_status'],
                    'occupation' => $validated['occupation'],
                    'nationality' => $validated['nationality'],
                    'religion' => $validated['religion'],
                    'allergies' => $validated['allergies'] ? explode(',', $validated['allergies']) : [],
                    'chronic_conditions' => $validated['chronic_conditions'] ? explode(',', $validated['chronic_conditions']) : [],
                    'alerts' => [],
                ];
                
                \Log::info('Creating patient with data', ['patient_data' => $patientData]);
                
                // Create patient
                $patient = Patient::create($patientData);
                
                \Log::info('Patient created successfully', ['patient_id' => $patient->id]);

                // Create primary contact
                \Log::info('Creating primary contact');
                $primaryContact = $patient->contacts()->create([
                    'contact_type' => 'PRIMARY',
                    'phone_number' => $validated['phone_number'],
                    'email' => $validated['email'],
                    'is_primary' => true,
                ]);
                \Log::info('Primary contact created', ['contact_id' => $primaryContact->id]);

                // Create emergency contact if provided
                if (!empty($validated['emergency_contact_phone'])) {
                    \Log::info('Creating emergency contact');
                    $emergencyContact = $patient->contacts()->create([
                        'contact_type' => 'EMERGENCY',
                        'name' => $validated['emergency_contact_name'],
                        'phone_number' => $validated['emergency_contact_phone'],
                        'relationship' => $validated['emergency_contact_relationship'] ?? '',
                        'is_primary' => false,
                    ]);
                    \Log::info('Emergency contact created', ['contact_id' => $emergencyContact->id]);
                }

                // Create address
                \Log::info('Creating address');
                $address = $patient->addresses()->create([
                    'address_type' => 'HOME',
                    'address_line1' => $validated['address_line_1'],
                    'address_line2' => $validated['address_line_2'],
                    'town_city' => $validated['city'],
                    'state_province' => $validated['state'],
                    'postal_code' => $validated['postal_code'],
                    'country' => $validated['country'],
                    'is_primary' => true,
                ]);
                \Log::info('Address created', ['address_id' => $address->id]);
                
                return $patient;
            }, 5); // 5 attempts for deadlock handling

            return redirect()->route('web.patients.index')->with('success', 'Patient registered successfully!');

        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error during patient registration: ' . $e->getMessage(), [
                'request_data' => $request->except(['_token']),
                'sql_error' => $e->errorInfo ?? null,
            ]);
            
            return back()->withErrors([
                'error' => 'Database error: Unable to save patient information. Please try again.'
            ])->withInput();
            
        } catch (\Exception $e) {
            \Log::error('Patient registration failed: ' . $e->getMessage(), [
                'request_data' => $request->except(['_token']),
                'exception' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors([
                'error' => 'Failed to register patient: ' . $e->getMessage()
            ])->withInput();
        }
    }

    public function edit($id)
    {
        $user = Auth::user();
        $patient = Patient::with(['contacts', 'addresses'])->findOrFail($id);
        
        $primaryContact = $patient->contacts->where('is_primary', true)->first() 
                        ?? $patient->contacts->first();
        $emergencyContact = $patient->contacts->where('contact_type', 'EMERGENCY')->first();
        $primaryAddress = $patient->addresses->where('is_primary', true)->first() 
                        ?? $patient->addresses->first();
        
        return Inertia::render('Patients/Edit', [
            'patient' => [
                'id' => $patient->id,
                'hospital_id' => $patient->hospital_id,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'middle_name' => $patient->middle_name,
                'date_of_birth' => $patient->date_of_birth,
                'gender' => $patient->gender,
                'marital_status' => $patient->marital_status,
                'occupation' => $patient->occupation,
                'nationality' => $patient->nationality,
                'religion' => $patient->religion,
                'allergies' => is_array($patient->allergies) ? implode(', ', $patient->allergies) : $patient->allergies,
                'chronic_conditions' => is_array($patient->chronic_conditions) ? implode(', ', $patient->chronic_conditions) : $patient->chronic_conditions,
                
                // Contact info
                'phone_number' => $primaryContact ? $primaryContact->phone_number : '',
                'email' => $primaryContact ? $primaryContact->email : '',
                'emergency_contact_name' => $emergencyContact ? $emergencyContact->name : '',
                'emergency_contact_phone' => $emergencyContact ? $emergencyContact->phone_number : '',
                'emergency_contact_relationship' => $emergencyContact ? $emergencyContact->relationship : '',
                
                // Address info
                'address_line_1' => $primaryAddress ? $primaryAddress->address_line1 : '',
                'address_line_2' => $primaryAddress ? $primaryAddress->address_line2 : '',
                'city' => $primaryAddress ? $primaryAddress->town_city : '',
                'state' => $primaryAddress ? $primaryAddress->state_province : '',
                'postal_code' => $primaryAddress ? $primaryAddress->postal_code : '',
                'country' => $primaryAddress ? $primaryAddress->country : '',
            ],
            'auth' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->getRoleNames()->first(),
                ]
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $patient = Patient::with(['contacts', 'addresses'])->findOrFail($id);
        
        $validated = $request->validate([
            // Personal Information
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'date_of_birth' => 'required|date|before:today',
            'gender' => 'required|in:M,F,O',
            'marital_status' => 'nullable|string|max:20',
            'occupation' => 'nullable|string|max:100',
            'nationality' => 'nullable|string|max:50',
            'religion' => 'nullable|string|max:50',
            
            // Contact Information
            'phone_number' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'emergency_contact_name' => 'required|string|max:100',
            'emergency_contact_phone' => 'required|string|max:20',
            'emergency_contact_relationship' => 'required|string|max:50',
            
            // Address Information
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'required|string|max:50',
            
            // Medical Information
            'allergies' => 'nullable|string',
            'chronic_conditions' => 'nullable|string',
            
            // Notes
            'notes' => 'nullable|string',
        ]);

        try {
            // Update patient
            $patient->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'marital_status' => $validated['marital_status'],
                'occupation' => $validated['occupation'],
                'nationality' => $validated['nationality'],
                'religion' => $validated['religion'],
                'allergies' => $validated['allergies'] ? explode(',', trim($validated['allergies'])) : [],
                'chronic_conditions' => $validated['chronic_conditions'] ? explode(',', trim($validated['chronic_conditions'])) : [],
            ]);

            // Update or create primary contact
            $primaryContact = $patient->contacts->where('is_primary', true)->first();
            if ($primaryContact) {
                $primaryContact->update([
                    'phone_number' => $validated['phone_number'],
                    'email' => $validated['email'],
                ]);
            } else {
                $patient->contacts()->create([
                    'contact_type' => 'PRIMARY',
                    'phone_number' => $validated['phone_number'],
                    'email' => $validated['email'],
                    'is_primary' => true,
                ]);
            }

            // Update or create emergency contact
            $emergencyContact = $patient->contacts->where('contact_type', 'EMERGENCY')->first();
            if ($emergencyContact) {
                $emergencyContact->update([
                    'name' => $validated['emergency_contact_name'],
                    'phone_number' => $validated['emergency_contact_phone'],
                    'relationship' => $validated['emergency_contact_relationship'],
                ]);
            } else {
                $patient->contacts()->create([
                    'contact_type' => 'EMERGENCY',
                    'name' => $validated['emergency_contact_name'],
                    'phone_number' => $validated['emergency_contact_phone'],
                    'relationship' => $validated['emergency_contact_relationship'],
                    'is_primary' => false,
                ]);
            }

            // Update or create address
            $primaryAddress = $patient->addresses->where('is_primary', true)->first();
            if ($primaryAddress) {
                $primaryAddress->update([
                    'address_line1' => $validated['address_line_1'],
                    'address_line2' => $validated['address_line_2'],
                    'town_city' => $validated['city'],
                    'state_province' => $validated['state'],
                    'postal_code' => $validated['postal_code'],
                    'country' => $validated['country'],
                ]);
            } else {
                $patient->addresses()->create([
                    'address_type' => 'HOME',
                    'address_line1' => $validated['address_line_1'],
                    'address_line2' => $validated['address_line_2'],
                    'town_city' => $validated['city'],
                    'state_province' => $validated['state'],
                    'postal_code' => $validated['postal_code'],
                    'country' => $validated['country'],
                    'is_primary' => true,
                ]);
            }

            return redirect()->route('web.patients.index')->with('success', 'Patient updated successfully!');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update patient. Please try again.'])->withInput();
        }
    }

    public function destroy($id)
    {
        Patient::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Patient deleted successfully.');
    }

    public function search(Request $request)
    {
        $query = $request->input('q', '');
        $all = $request->input('all', false);

        $patients = Patient::query()
            ->when($query, function ($q) use ($query) {
                $q->where(function ($subQuery) use ($query) {
                    $subQuery->where('first_name', 'like', "%{$query}%")
                        ->orWhere('last_name', 'like', "%{$query}%")
                        ->orWhere('hospital_id', 'like', "%{$query}%")
                        ->orWhere('phone', 'like', "%{$query}%");
                });
            })
            ->select('id', 'first_name', 'last_name', 'hospital_id', 'phone', 'date_of_birth', 'gender')
            ->limit($all ? 500 : 50)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'first_name' => $patient->first_name,
                    'last_name' => $patient->last_name,
                    'hospital_id' => $patient->hospital_id,
                    'phone' => $patient->phone,
                    'date_of_birth' => $patient->date_of_birth,
                    'gender' => $patient->gender,
                ];
            });

        return response()->json($patients);
    }

    public function exportPdf(Request $request)
    {
        $query = Patient::with(['contacts']);

        // Apply search filter if provided
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('hospital_id', 'like', "%{$search}%")
                  ->orWhereHas('contacts', function ($contactQuery) use ($search) {
                      $contactQuery->where('phone_number', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $patients = $query->latest()->get()->map(function ($patient) {
            $primaryContact = $patient->contacts->where('is_primary', true)->first() 
                            ?? $patient->contacts->first();
            
            return [
                'patient_number' => $patient->hospital_id,
                'name' => "{$patient->first_name} {$patient->last_name}",
                'gender' => ucfirst($patient->gender ?? 'N/A'),
                'age' => $patient->date_of_birth ? (int) \Carbon\Carbon::parse($patient->date_of_birth)->diffInYears(now()) : '—',
                'phone' => $primaryContact ? $primaryContact->phone_number : null,
                'email' => $primaryContact ? $primaryContact->email : null,
                'registered' => $patient->created_at->format('d M Y'),
            ];
        });

        $pdf = \PDF::loadView('exports.patients-pdf', compact('patients'));
        
        return $pdf->download('patients-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        $query = Patient::with(['contacts']);

        // Apply search filter if provided
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('hospital_id', 'like', "%{$search}%")
                  ->orWhereHas('contacts', function ($contactQuery) use ($search) {
                      $contactQuery->where('phone_number', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $patients = $query->latest()->get()->map(function ($patient) {
            $primaryContact = $patient->contacts->where('is_primary', true)->first() 
                            ?? $patient->contacts->first();
            
            return [
                'Patient Number' => $patient->hospital_id,
                'Name' => "{$patient->first_name} {$patient->last_name}",
                'Gender' => ucfirst($patient->gender ?? 'N/A'),
                'Age' => $patient->date_of_birth ? (int) \Carbon\Carbon::parse($patient->date_of_birth)->diffInYears(now()) : '—',
                'Phone' => $primaryContact ? $primaryContact->phone_number : '',
                'Email' => $primaryContact ? $primaryContact->email : '',
                'Date of Birth' => $patient->date_of_birth ? \Carbon\Carbon::parse($patient->date_of_birth)->format('d M Y') : '',
                'Nationality' => $patient->nationality ?? '',
                'Registered Date' => $patient->created_at->format('d M Y'),
            ];
        });

        return \Excel::download(new \App\Exports\PatientsExport($patients), 'patients-' . now()->format('Y-m-d') . '.xlsx');
    }

    private function generateMedicalAlerts($patient, $age)
    {
        $alerts = [];
        
        // Age-based alerts
        if ($age >= 65) {
            $alerts[] = [
                'type' => 'Age Alert',
                'message' => 'Senior patient - consider age-related medication adjustments',
                'severity' => 'medium'
            ];
        }
        
        if ($age < 2) {
            $alerts[] = [
                'type' => 'Pediatric Alert',
                'message' => 'Infant/toddler - special dosing considerations required',
                'severity' => 'high'
            ];
        }
        
        // Allergy alerts
        $allergies = is_array($patient->allergies) ? $patient->allergies : 
                    (is_string($patient->allergies) ? explode(',', $patient->allergies) : []);
        $allergies = array_filter(array_map('trim', $allergies));
        
        if (!empty($allergies)) {
            $allergyList = implode(', ', $allergies);
            $alerts[] = [
                'type' => 'Allergy Alert',
                'message' => "Allergies: {$allergyList}",
                'severity' => 'high'
            ];
        }
        
        // Chronic condition alerts
        $conditions = is_array($patient->chronic_conditions) ? $patient->chronic_conditions : 
                     (is_string($patient->chronic_conditions) ? explode(',', $patient->chronic_conditions) : []);
        $conditions = array_filter(array_map('trim', $conditions));
        
        if (!empty($conditions)) {
            $conditionList = implode(', ', $conditions);
            $alerts[] = [
                'type' => 'Chronic Conditions',
                'message' => "Conditions: {$conditionList}",
                'severity' => 'medium'
            ];
        }
        
        return $alerts;
    }    
}
