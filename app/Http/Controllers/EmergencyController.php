<?php

namespace App\Http\Controllers;

use App\Models\EmergencyPatient;
use App\Models\TriageAssessment;
use App\Models\EmergencyOrder;
use App\Models\OpdAppointment;
use App\Services\OpdService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmergencyController extends Controller
{
    protected OpdService $opdService;

    public function __construct(OpdService $opdService)
    {
        $this->opdService = $opdService;
    }

    public function index()
    {
        // Default page is the triage registration
        return Inertia::render('Emergency/Create');
    }

    public function list()
    {
        $patients = EmergencyPatient::with(['latestTriage', 'assignedDoctor'])
            ->whereIn('status', ['active', 'admitted']) // Show both active and admitted patients
            ->orderBy('arrival_time', 'desc')
            ->get();

        return Inertia::render('Emergency/List', [
            'patients' => $patients
        ]);
    }

    public function create()
    {
        return Inertia::render('Emergency/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|exists:patients,id',
            'temp_name' => 'required_without:patient_id|string',
            'temp_contact' => 'nullable|string',
            'gender' => 'nullable|in:male,female,other',
            'age' => 'nullable|integer',
            'chief_complaint' => 'required|string',
            'history_of_present_illness' => 'nullable|string',
            'arrival_mode' => 'required|in:ambulance,walk-in,police,referral',
        ]);

        $validated['arrival_time'] = now();
        $emergencyPatient = EmergencyPatient::create($validated);

        return redirect()->route('emergency.triage', $emergencyPatient->id)
            ->with('success', 'Emergency patient registered successfully');
    }

    public function triage($id)
    {
        $patient = EmergencyPatient::with('latestTriage')->findOrFail($id);
        return Inertia::render('Emergency/Triage', [
            'patient' => $patient
        ]);
    }

    public function storeTriage(Request $request, $id)
    {
        $validated = $request->validate([
            'triage_category' => 'required|in:red,yellow,green,black',
            'temperature' => 'nullable|numeric',
            'blood_pressure' => 'nullable|string',
            'heart_rate' => 'nullable|integer',
            'respiratory_rate' => 'nullable|integer',
            'oxygen_saturation' => 'nullable|integer',
            'gcs_eye' => 'nullable|integer|min:1|max:4',
            'gcs_verbal' => 'nullable|integer|min:1|max:5',
            'gcs_motor' => 'nullable|integer|min:1|max:6',
            'assessment_notes' => 'nullable|string',
            'disposition' => 'required|in:emergency,opd', // Decision after triage
        ]);

        $validated['emergency_patient_id'] = $id;
        $validated['assessed_by'] = auth()->id();
        $validated['assessed_at'] = now();
        $validated['gcs_total'] = ($validated['gcs_eye'] ?? 0) + 
                                   ($validated['gcs_verbal'] ?? 0) + 
                                   ($validated['gcs_motor'] ?? 0);

        TriageAssessment::create($validated);

        // Handle disposition
        if ($validated['disposition'] === 'opd') {
            // Move to OPD - create OPD appointment
            $patient = EmergencyPatient::findOrFail($id);
            
            // Create OPD appointment for this emergency patient
            $opdAppointment = OpdAppointment::create([
                'type' => 'opd',
                'appointment_number' => 'OPD-' . now()->format('Ymd') . '-' . str_pad(OpdAppointment::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT),
                'patient_id' => $patient->patient_id, // Link to actual patient if exists
                'emergency_patient_id' => $patient->id, // Link to emergency record
                'appointment_date' => now()->toDateString(),
                'status' => 'WAITING',
                'chief_complaint' => $patient->chief_complaint,
                'queue_number' => OpdAppointment::where('appointment_date', now()->toDateString())
                    ->where('status', 'WAITING')
                    ->max('queue_number') + 1,
            ]);
            
            // Update emergency patient status
            $patient->update(['status' => 'transferred']);
            
            return redirect()->route('opd.queue')
                ->with('success', 'Patient triaged and added to OPD queue');
        }

        // Keep as emergency
        return redirect()->route('emergency.show', $id)
            ->with('success', 'Patient triaged and kept in emergency');
    }

    public function show($id)
    {
        $patient = EmergencyPatient::with(['triageAssessments', 'orders', 'assignedDoctor'])
            ->findOrFail($id);
        
        // Get available doctors from physicians table
        $doctors = DB::table('physicians')
            ->select('physician_code as id', 'name')
            ->whereNotNull('physician_code')
            ->orderBy('name')
            ->get();
        


        return Inertia::render('Emergency/Show', [
            'patient' => $patient->toArray(),
            'doctors' => $doctors
        ]);
    }

    public function storeOrder(Request $request, $id)
    {
        $validated = $request->validate([
            'order_type' => 'required|in:lab,imaging,medication,procedure,consultation',
            'order_name' => 'required|string',
            'order_details' => 'nullable|string',
            'priority' => 'required|in:stat,urgent,routine',
        ]);

        $validated['emergency_patient_id'] = $id;
        $validated['ordered_by'] = auth()->id();
        $validated['ordered_at'] = now();

        EmergencyOrder::create($validated);

        return back()->with('success', 'Emergency order created');
    }

    public function transfer(Request $request, $id)
    {
        $validated = $request->validate([
            'destination' => 'required|in:ward,icu,discharge',
            'notes' => 'nullable|string',
        ]);

        $patient = EmergencyPatient::findOrFail($id);
        
        $status = match($validated['destination']) {
            'ward', 'icu' => 'admitted',
            'discharge' => 'discharged',
        };

        $patient->update(['status' => $status]);

        return redirect()->route('emergency.list')
            ->with('success', 'Patient transferred successfully');
    }

    public function assignDoctor(Request $request, $id)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:physicians,physician_code',
        ]);

        $patient = EmergencyPatient::findOrFail($id);

        // Assign the physician_code instead of a user_id
        $patient->update([
            'assigned_to' => $validated['doctor_id']
        ]);

        return back()->with('success', 'Doctor assigned successfully');
    }


    public function edit($id)
    {
        $patient = EmergencyPatient::with('assignedDoctor')->findOrFail($id);
        
        return Inertia::render('Emergency/Edit', [
            'patient' => $patient
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'temp_name' => 'required|string',
            'temp_contact' => 'nullable|string',
            'gender' => 'nullable|in:male,female,other',
            'age' => 'nullable|integer',
            'chief_complaint' => 'required|string',
            'history_of_present_illness' => 'nullable|string',
            'arrival_mode' => 'required|in:ambulance,walk-in,police,referral',
            'assigned_to' => 'nullable|exists:physicians,physician_code',
        ]);

        $patient = EmergencyPatient::findOrFail($id);
        $patient->update($validated);

        return redirect()->route('emergency.show', $id)
            ->with('success', 'Patient details updated successfully');
    }

    public function destroy($id)
    {
        $patient = EmergencyPatient::findOrFail($id);
        $patient->delete();

        return redirect()->route('emergency.list')
            ->with('success', 'Patient record deleted successfully');
    }
}
