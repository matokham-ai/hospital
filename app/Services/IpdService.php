<?php

namespace App\Services;

use App\Models\Encounter;
use App\Models\BedAssignment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class IpdService
{
    /**
     * Get IPD admissions with filters and pagination
     */
    public function getIpdAdmissions($filters = [], $perPage = 15)
    {
        $query = Encounter::with(['patient', 'bedAssignments.bed.ward'])
            ->where('type', 'IPD')
            ->where('status', 'ACTIVE');

        if (!empty($filters['ward_id'])) {
            $query->whereHas('bedAssignments.bed', function ($q) use ($filters) {
                $q->where('ward_id', $filters['ward_id']);
            });
        }

        if (!empty($filters['physician_id'])) {
            $query->where('attending_physician_id', $filters['physician_id']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Admit a patient
     */
    public function admitPatient($data)
    {
        DB::beginTransaction();
        
        try {
            $encounter = Encounter::create([
                'encounter_number' => 'IPD-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'patient_id' => $data['patient_id'],
                'type' => 'IPD',
                'status' => 'ACTIVE',
                'admission_datetime' => $data['admission_datetime'] ?? now(),
                'attending_physician_id' => $data['attending_physician_id'],
                'chief_complaint' => $data['chief_complaint'],
                'priority' => $data['priority'] ?? 'NORMAL',
            ]);

            if (!empty($data['bed_id'])) {
                $this->assignBed($encounter->id, $data['bed_id']);
            }

            DB::commit();
            return $encounter;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Transfer patient to another bed
     */
    public function transferPatient($encounter, $data)
    {
        DB::beginTransaction();
        
        try {
            // Release current bed assignment
            $this->releaseBedAssignment($encounter->id);
            
            // Assign new bed
            $assignment = $this->assignBed($encounter->id, $data['bed_id'], $data['transfer_notes'] ?? 'Patient transfer');
            
            DB::commit();
            return $assignment;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Discharge a patient
     */
    public function dischargePatient($encounter, $data)
    {
        DB::beginTransaction();
        
        try {
            // Update encounter status
            $encounter->update([
                'status' => 'COMPLETED',
                'discharge_datetime' => $data['discharge_datetime'] ?? now(),
                'discharge_summary' => $data['discharge_summary'] ?? null,
                'discharge_condition' => $data['discharge_condition'] ?? null,
            ]);

            // Release bed assignment
            $this->releaseBedAssignment($encounter->id, $data['discharge_summary'] ?? 'Patient discharged');

            DB::commit();
            return $encounter;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Assign bed to encounter
     */
    private function assignBed($encounterId, $bedId, $notes = 'Bed assignment')
    {
        // Check if bed is available
        $bed = DB::table('beds')->where('id', $bedId)->first();
        if (!$bed || $bed->status !== 'available') {
            throw new \Exception('Bed is not available');
        }

        // Create bed assignment
        $assignment = BedAssignment::create([
            'encounter_id' => $encounterId,
            'bed_id' => $bedId,
            'assigned_at' => now(),
            'assigned_by' => auth()->user()->name ?? 'System',
            'assignment_notes' => $notes,
        ]);

        // Update bed status
        DB::table('beds')->where('id', $bedId)->update([
            'status' => 'occupied',
            'updated_at' => now(),
        ]);

        return $assignment;
    }

    /**
     * Release bed assignment for encounter
     */
    private function releaseBedAssignment($encounterId, $notes = 'Bed released')
    {
        // Find active bed assignment
        $assignment = BedAssignment::where('encounter_id', $encounterId)
            ->whereNull('released_at')
            ->first();

        if ($assignment) {
            // Release the assignment
            $assignment->update([
                'released_at' => now(),
                'released_by' => auth()->user()->name ?? 'System',
                'release_notes' => $notes,
            ]);

            // Update bed status to available
            DB::table('beds')->where('id', $assignment->bed_id)->update([
                'status' => 'available',
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Get IPD census data
     */
    public function getIpdCensus($filters = [])
    {
        $query = Encounter::where('type', 'IPD')->where('status', 'ACTIVE');

        if (!empty($filters['ward_id'])) {
            $query->whereHas('bedAssignments.bed', function ($q) use ($filters) {
                $q->where('ward_id', $filters['ward_id']);
            });
        }

        return [
            'total_admissions' => $query->count(),
            'by_ward' => $this->getCensusByWard($filters),
        ];
    }

    /**
     * Get ward census
     */
    public function getWardCensus($wardId)
    {
        $totalBeds = DB::table('beds')->where('ward_id', $wardId)->count();
        $occupiedBeds = DB::table('beds')->where('ward_id', $wardId)->where('status', 'occupied')->count();
        
        return [
            'ward_id' => $wardId,
            'total_beds' => $totalBeds,
            'occupied_beds' => $occupiedBeds,
            'available_beds' => $totalBeds - $occupiedBeds,
            'occupancy_rate' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 1) : 0,
        ];
    }

    /**
     * Get IPD statistics
     */
    public function getIpdStatistics($filters = [])
    {
        $startDate = $filters['start_date'] ?? now()->subDays(30);
        $endDate = $filters['end_date'] ?? now();

        return [
            'total_admissions' => Encounter::where('type', 'IPD')
                ->whereBetween('admission_datetime', [$startDate, $endDate])
                ->count(),
            'total_discharges' => Encounter::where('type', 'IPD')
                ->whereBetween('discharge_datetime', [$startDate, $endDate])
                ->whereNotNull('discharge_datetime')
                ->count(),
            'average_length_of_stay' => $this->getAverageLengthOfStay($startDate, $endDate),
        ];
    }

    /**
     * Get discharge planning list
     */
    public function getDischargePlanningList($filters = [])
    {
        return Encounter::with(['patient', 'bedAssignments.bed'])
            ->where('type', 'IPD')
            ->where('status', 'ACTIVE')
            ->whereDate('admission_datetime', '<=', now()->subDays(3)) // Patients admitted 3+ days ago
            ->get();
    }

    /**
     * Get patient care plan
     */
    public function getPatientCarePlan($encounter)
    {
        return [
            'encounter' => $encounter,
            'prescriptions' => $encounter->prescriptions,
            'vital_signs' => [], // Implement if vitals table exists
            'progress_notes' => [], // Implement if progress notes table exists
        ];
    }

    /**
     * Create discharge summary
     */
    public function createDischargeSummary($encounter, $data)
    {
        // This would typically create a discharge summary document
        // For now, just update the encounter with discharge information
        return $encounter->update([
            'discharge_summary' => $data['discharge_summary'],
            'discharge_condition' => $data['discharge_condition'] ?? 'Stable',
        ]);
    }

    /**
     * Helper methods
     */
    private function getCensusByWard($filters = [])
    {
        return DB::table('wards')
            ->leftJoin('beds', 'wards.wardid', '=', 'beds.ward_id')
            ->leftJoin('bed_assignments', function ($join) {
                $join->on('beds.id', '=', 'bed_assignments.bed_id')
                    ->whereNull('bed_assignments.released_at');
            })
            ->leftJoin('encounters', function ($join) {
                $join->on('bed_assignments.encounter_id', '=', 'encounters.id')
                    ->where('encounters.type', '=', 'IPD')
                    ->where('encounters.status', '=', 'ACTIVE');
            })
            ->select(
                'wards.wardid',
                'wards.name',
                DB::raw('COUNT(beds.id) as total_beds'),
                DB::raw('COUNT(encounters.id) as occupied_beds')
            )
            ->groupBy('wards.wardid', 'wards.name')
            ->get();
    }

    private function getAverageLengthOfStay($startDate, $endDate)
    {
        $avg = Encounter::where('type', 'IPD')
            ->whereBetween('discharge_datetime', [$startDate, $endDate])
            ->whereNotNull('discharge_datetime')
            ->selectRaw('AVG(DATEDIFF(discharge_datetime, admission_datetime)) as avg_days')
            ->value('avg_days');

        return round($avg ?? 0, 1);
    }
}