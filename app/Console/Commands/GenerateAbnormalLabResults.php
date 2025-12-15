<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateAbnormalLabResults extends Command
{
    protected $signature = 'lab:generate-abnormal-results';
    protected $description = 'Generate some abnormal lab results for testing';

    public function handle()
    {
        // Update some existing results to be abnormal for testing
        $results = DB::table('lab_results')->take(5)->get();
        
        foreach ($results as $result) {
            $abnormalValue = $this->generateAbnormalValue($result->parameter_name, $result->value);
            $status = $this->determineStatus($abnormalValue, $result->reference_range);
            
            DB::table('lab_results')
                ->where('id', $result->id)
                ->update([
                    'value' => $abnormalValue,
                    'status' => $status,
                    'updated_at' => now()
                ]);
        }
        
        $this->info('Generated abnormal results for testing purposes!');
        return 0;
    }
    
    private function generateAbnormalValue($parameter, $currentValue)
    {
        $multiplier = rand(120, 200) / 100; // 1.2x to 2x normal value
        
        if (is_numeric($currentValue)) {
            return round($currentValue * $multiplier, 1);
        }
        
        // For non-numeric values
        if (strpos($parameter, 'Bacteria') !== false) {
            return 'Heavy growth';
        }
        
        return $currentValue;
    }
    
    private function determineStatus($value, $referenceRange)
    {
        if (!is_numeric($value)) {
            return 'abnormal';
        }
        
        // Simple logic - if value seems high, mark as abnormal
        return rand(1, 3) === 1 ? 'critical' : 'abnormal';
    }
}