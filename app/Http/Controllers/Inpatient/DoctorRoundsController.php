<?php

namespace App\Http\Controllers\Inpatient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DoctorRoundsController extends Controller
{
    public function index(Request $request)
    {
        $doctorId = auth()->id();
        $date = $request->input('date', now()->format('Y-m-d'));
        $status = $request->input('status');

        // Get doctor's rounds for the specified date
        $query = DB::table('doctor_rounds as dr')
            ->leftJoin('patients as p', 'dr.patient_id', '=', 'p.id')
            ->leftJoin('users as u', 'dr.doctor_id', '=', 'u.id')
            ->where('dr.doctor_id', $doctorId)
            ->where('dr.round_date', $date)
            ->select(
                'dr.*',
                'p.first_name',
                'p.last_name',
                'p.hospital_id',
                'u.name as doctor_name'
            )
            ->orderBy('dr.status')
            ->orderBy('dr.created_at');

        if ($status) {
            $query->where('dr.status', $status);
        }

        $rounds = $query->get();

        // Update late status for overdue rounds
        $this->updateLateStatus($doctorId, $date);

        // Get summary statistics
        $stats = [
            'total' => $rounds->count(),
            'pending' => $rounds->where('status', 'pending')->count(),
            'in_progress' => $rounds->where('status', 'in_progress')->count(),
            'completed' => $rounds->where('status', 'completed')->count(),
            'late' => $rounds->where('status', 'late')->count(),
        ];

        $assignedPatients = DB::table('patients as p')
            ->join('encounters as e', 'e.patient_id', '=', 'p.id')
            ->join('bed_assignments as ba', 'e.id', '=', 'ba.encounter_id')
            ->select(
                'p.id',
                'p.first_name',
                'p.last_name',
                'p.hospital_id',
                'e.encounter_number',
                'e.admission_datetime',
                'e.attending_physician_id'
            )
            ->where('e.type', 'IPD')
            ->where('e.status', 'ACTIVE')
            ->whereNull('e.discharge_datetime')
            ->whereNull('ba.released_at')
            ->distinct()
            ->orderByDesc('e.admission_datetime')
            ->limit(20)
            ->get();


        return Inertia::render('Inpatient/DoctorRounds', [
            'rounds' => $rounds,
            'stats' => $stats,
            'assignedPatients' => $assignedPatients,
            'currentDate' => $date,
            'filters' => [
                'date' => $date,
                'status' => $status,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|string|exists:patients,id',
            'round_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $roundId = DB::table('doctor_rounds')->insertGetId([
            'patient_id' => $validated['patient_id'],
            'doctor_id' => auth()->id(),
            'round_date' => $validated['round_date'],
            'status' => 'pending',
            'notes' => $validated['notes'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->route('inpatient.rounds')->with('success', 'Round added successfully.');
    }

    public function updateStatus(Request $request, $roundId)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,late'
        ]);

        $updateData = [
            'status' => $validated['status'],
            'updated_at' => now(),
        ];

        // Set timestamps based on status
        if ($validated['status'] === 'in_progress' && !DB::table('doctor_rounds')->where('id', $roundId)->value('start_time')) {
            $updateData['start_time'] = now()->format('H:i:s');
        }

        if ($validated['status'] === 'completed') {
            $updateData['end_time'] = now()->format('H:i:s');
            if (!DB::table('doctor_rounds')->where('id', $roundId)->value('start_time')) {
                $updateData['start_time'] = now()->subMinutes(30)->format('H:i:s'); // Assume 30 min duration
            }
        }

        DB::table('doctor_rounds')
            ->where('id', $roundId)
            ->update($updateData);

        return response()->json(['success' => true]);
    }

    public function addNote(Request $request, $roundId)
    {
        $validated = $request->validate([
            'note' => 'required|string',
            'type' => 'required|in:observation,assessment,plan,medication,vital_signs,general'
        ]);

        DB::table('round_notes')->insert([
            'round_id' => $roundId,
            'note' => $validated['note'],
            'type' => $validated['type'],
            'created_by' => auth()->id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function getNotes($roundId)
    {
        $notes = DB::table('round_notes as rn')
            ->leftJoin('users as u', 'rn.created_by', '=', 'u.id')
            ->where('rn.round_id', $roundId)
            ->select(
                'rn.*',
                'u.name as created_by_name'
            )
            ->orderBy('rn.created_at', 'desc')
            ->get();

        return response()->json($notes);
    }

    public function updateRound(Request $request, $roundId)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'assessment' => 'nullable|string',
            'plan' => 'nullable|string',
            'vital_signs' => 'nullable|array',
            'electronic_signature' => 'nullable|string',
        ]);

        $updateData = $validated;
        $updateData['updated_at'] = now();

        if ($validated['electronic_signature']) {
            $updateData['signed_at'] = now();
        }

        DB::table('doctor_rounds')
            ->where('id', $roundId)
            ->update($updateData);

        return response()->json(['success' => true]);
    }

    private function updateLateStatus($doctorId, $date)
    {
        // Mark rounds as late if they're still pending after 2 hours past start of day
        $cutoffTime = Carbon::parse($date)->addHours(10); // 10 AM cutoff

        if (now()->gt($cutoffTime)) {
            DB::table('doctor_rounds')
                ->where('doctor_id', $doctorId)
                ->where('round_date', $date)
                ->where('status', 'pending')
                ->update([
                    'status' => 'late',
                    'updated_at' => now()
                ]);
        }
    }

    public function show($roundId)
    {
        $round = DB::table('doctor_rounds as dr')
            ->leftJoin('patients as p', 'dr.patient_id', '=', 'p.id')
            ->leftJoin('users as u', 'dr.doctor_id', '=', 'u.id')
            ->where('dr.id', $roundId)
            ->select(
                'dr.*',
                'p.first_name',
                'p.last_name',
                'p.hospital_id',
                'u.name as doctor_name'
            )
            ->first();

        if (!$round) {
            return response()->json(['error' => 'Round not found'], 404);
        }

        $notes = DB::table('round_notes as rn')
            ->leftJoin('users as u', 'rn.created_by', '=', 'u.id')
            ->where('rn.round_id', $roundId)
            ->select(
                'rn.*',
                'u.name as created_by_name'
            )
            ->orderBy('rn.created_at', 'desc')
            ->get();

        return response()->json([
            'round' => $round,
            'notes' => $notes
        ]);
    }
}