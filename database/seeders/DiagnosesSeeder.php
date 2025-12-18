<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DiagnosesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🩺 Creating Medical Diagnoses...\n";

        // Get existing encounters
        $encounters = DB::table('encounters')->get();

        if ($encounters->isEmpty()) {
            echo "⚠️  No encounters found. Please seed encounters first.\n";
            return;
        }

        $diagnoses = [];
        $diagnosisId = 1;

        // Common medical diagnoses with ICD-10 codes
        $commonDiagnoses = [
            ['code' => 'I10', 'name' => 'Essential Hypertension'],
            ['code' => 'E11.9', 'name' => 'Type 2 Diabetes Mellitus'],
            ['code' => 'J44.1', 'name' => 'Chronic Obstructive Pulmonary Disease'],
            ['code' => 'J45.9', 'name' => 'Asthma'],
            ['code' => 'K21.9', 'name' => 'Gastroesophageal Reflux Disease'],
            ['code' => 'M79.3', 'name' => 'Chronic Back Pain'],
            ['code' => 'G43.909', 'name' => 'Migraine Headache'],
            ['code' => 'F32.9', 'name' => 'Major Depressive Disorder'],
            ['code' => 'F41.9', 'name' => 'Anxiety Disorder'],
            ['code' => 'J18.9', 'name' => 'Pneumonia'],
            ['code' => 'N39.0', 'name' => 'Urinary Tract Infection'],
            ['code' => 'L30.9', 'name' => 'Dermatitis'],
            ['code' => 'J06.9', 'name' => 'Upper Respiratory Infection'],
            ['code' => 'A09', 'name' => 'Gastroenteritis'],
            ['code' => 'M54.5', 'name' => 'Low Back Pain'],
            ['code' => 'I25.10', 'name' => 'Atherosclerotic Heart Disease'],
            ['code' => 'K25.9', 'name' => 'Peptic Ulcer Disease'],
            ['code' => 'M17.9', 'name' => 'Osteoarthritis of Knee'],
            ['code' => 'E03.9', 'name' => 'Hypothyroidism'],
            ['code' => 'J00', 'name' => 'Common Cold'],
        ];

        // Create 1-2 diagnoses per encounter
        foreach ($encounters as $encounter) {
            $numDiagnoses = rand(1, 2);
            $selectedDiagnoses = collect($commonDiagnoses)->random($numDiagnoses);
            
            foreach ($selectedDiagnoses as $index => $diagnosis) {
                $diagnoses[] = [
                    'id' => $diagnosisId++,
                    'encounter_id' => $encounter->id,
                    'icd10_code' => $diagnosis['code'],
                    'description' => $diagnosis['name'],
                    'type' => $index === 0 ? 'Primary' : 'Secondary',
                    'diagnosed_by' => $encounter->attending_physician_id,
                    'diagnosed_at' => $encounter->admission_datetime,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert diagnoses in chunks
        $chunks = array_chunk($diagnoses, 100);
        foreach ($chunks as $chunk) {
            DB::table('diagnoses')->insert($chunk);
        }

        echo "✅ Created " . count($diagnoses) . " medical diagnoses\n";
        
        // Show summary
        $this->showSummary();
    }

    /**
     * Show summary of created diagnoses
     */
    private function showSummary(): void
    {
        echo "\n📊 Diagnoses Summary:\n";
        
        // Type distribution
        $summary = DB::table('diagnoses')
            ->select('type', DB::raw('COUNT(*) as total'))
            ->groupBy('type')
            ->orderBy('total', 'desc')
            ->get();

        foreach ($summary as $type) {
            echo "   - {$type->type}: {$type->total} diagnoses\n";
        }

        // Most common diagnoses
        echo "\n📈 Most Common Diagnoses:\n";
        $commonDiagnoses = DB::table('diagnoses')
            ->select('description', 'icd10_code', DB::raw('COUNT(*) as count'))
            ->groupBy('description', 'icd10_code')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();

        foreach ($commonDiagnoses as $diagnosis) {
            echo "   - {$diagnosis->description} ({$diagnosis->icd10_code}): {$diagnosis->count} cases\n";
        }

        $totalDiagnoses = DB::table('diagnoses')->count();
        $uniqueEncounters = DB::table('diagnoses')->distinct('encounter_id')->count();
        
        echo "\n🎯 Overall: {$totalDiagnoses} diagnoses across {$uniqueEncounters} encounters\n";
    }
}