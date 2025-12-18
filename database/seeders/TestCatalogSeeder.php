<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TestCatalog;
use App\Models\TestCategory;

class TestCatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create categories first
        $categories = [
            'Hematology' => 'Blood tests and cell counts',
            'Clinical Chemistry' => 'Blood chemistry and metabolic tests',
            'Microbiology' => 'Culture and sensitivity tests',
            'Serology' => 'Antibody and antigen tests',
            'Urinalysis' => 'Urine tests',
            'Immunology' => 'Immune system tests',
        ];

        $categoryIds = [];
        foreach ($categories as $name => $description) {
            $code = strtoupper(substr(str_replace(' ', '', $name), 0, 3));
            $category = TestCategory::firstOrCreate(
                ['name' => $name],
                [
                    'code' => $code,
                    'description' => $description
                ]
            );
            $categoryIds[$name] = $category->id;
        }

        // Common lab tests
        $tests = [
            // Hematology
            [
                'name' => 'Complete Blood Count (CBC)',
                'code' => 'CBC001',
                'category_id' => $categoryIds['Hematology'],
                'price' => 500.00,
                'turnaround_time' => 2,
                'sample_type' => 'Whole Blood (EDTA)',
                'unit' => 'Various',
                'normal_range' => 'Age and gender specific',
                'instructions' => 'No special preparation required',
                'status' => 'active',
            ],
            [
                'name' => 'Hemoglobin (Hb)',
                'code' => 'HB001',
                'category_id' => $categoryIds['Hematology'],
                'price' => 200.00,
                'turnaround_time' => 1,
                'sample_type' => 'Whole Blood (EDTA)',
                'unit' => 'g/dL',
                'normal_range' => 'M: 13.5-17.5, F: 12.0-15.5',
                'status' => 'active',
            ],
            [
                'name' => 'Platelet Count',
                'code' => 'PLT001',
                'category_id' => $categoryIds['Hematology'],
                'price' => 300.00,
                'turnaround_time' => 2,
                'sample_type' => 'Whole Blood (EDTA)',
                'unit' => 'x10^9/L',
                'normal_range' => '150-400',
                'status' => 'active',
            ],
            [
                'name' => 'ESR (Erythrocyte Sedimentation Rate)',
                'code' => 'ESR001',
                'category_id' => $categoryIds['Hematology'],
                'price' => 250.00,
                'turnaround_time' => 1,
                'sample_type' => 'Whole Blood (EDTA)',
                'unit' => 'mm/hr',
                'normal_range' => 'M: 0-15, F: 0-20',
                'status' => 'active',
            ],

            // Clinical Chemistry
            [
                'name' => 'Fasting Blood Sugar (FBS)',
                'code' => 'FBS001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 300.00,
                'turnaround_time' => 2,
                'sample_type' => 'Serum/Plasma',
                'unit' => 'mg/dL',
                'normal_range' => '70-100',
                'instructions' => 'Patient must fast for 8-12 hours',
                'status' => 'active',
            ],
            [
                'name' => 'Random Blood Sugar (RBS)',
                'code' => 'RBS001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 250.00,
                'turnaround_time' => 1,
                'sample_type' => 'Serum/Plasma',
                'unit' => 'mg/dL',
                'normal_range' => '<140',
                'instructions' => 'No fasting required',
                'status' => 'active',
            ],
            [
                'name' => 'HbA1c (Glycated Hemoglobin)',
                'code' => 'HBA1C001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 800.00,
                'turnaround_time' => 4,
                'sample_type' => 'Whole Blood (EDTA)',
                'unit' => '%',
                'normal_range' => '<5.7',
                'instructions' => 'No fasting required',
                'status' => 'active',
            ],
            [
                'name' => 'Lipid Profile',
                'code' => 'LIPID001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 1200.00,
                'turnaround_time' => 4,
                'sample_type' => 'Serum',
                'unit' => 'mg/dL',
                'normal_range' => 'Total Cholesterol <200, LDL <100, HDL >40',
                'instructions' => 'Patient must fast for 9-12 hours',
                'status' => 'active',
            ],
            [
                'name' => 'Liver Function Tests (LFT)',
                'code' => 'LFT001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 1500.00,
                'turnaround_time' => 6,
                'sample_type' => 'Serum',
                'unit' => 'Various',
                'normal_range' => 'ALT: 7-56 U/L, AST: 10-40 U/L',
                'status' => 'active',
            ],
            [
                'name' => 'Kidney Function Tests (RFT)',
                'code' => 'RFT001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 1200.00,
                'turnaround_time' => 6,
                'sample_type' => 'Serum',
                'unit' => 'Various',
                'normal_range' => 'Creatinine: 0.6-1.2 mg/dL, Urea: 15-40 mg/dL',
                'status' => 'active',
            ],
            [
                'name' => 'Serum Creatinine',
                'code' => 'CREAT001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 400.00,
                'turnaround_time' => 3,
                'sample_type' => 'Serum',
                'unit' => 'mg/dL',
                'normal_range' => 'M: 0.7-1.3, F: 0.6-1.1',
                'status' => 'active',
            ],
            [
                'name' => 'Serum Electrolytes',
                'code' => 'ELEC001',
                'category_id' => $categoryIds['Clinical Chemistry'],
                'price' => 1000.00,
                'turnaround_time' => 4,
                'sample_type' => 'Serum',
                'unit' => 'mmol/L',
                'normal_range' => 'Na: 135-145, K: 3.5-5.0, Cl: 98-107',
                'status' => 'active',
            ],

            // Urinalysis
            [
                'name' => 'Urinalysis (Complete)',
                'code' => 'URINE001',
                'category_id' => $categoryIds['Urinalysis'],
                'price' => 400.00,
                'turnaround_time' => 2,
                'sample_type' => 'Urine (Mid-stream)',
                'unit' => 'Various',
                'normal_range' => 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030',
                'instructions' => 'Collect mid-stream urine in sterile container',
                'status' => 'active',
            ],
            [
                'name' => 'Urine Culture & Sensitivity',
                'code' => 'URINECS001',
                'category_id' => $categoryIds['Microbiology'],
                'price' => 1500.00,
                'turnaround_time' => 48,
                'sample_type' => 'Urine (Mid-stream)',
                'unit' => 'CFU/mL',
                'normal_range' => '<10,000 CFU/mL',
                'instructions' => 'Collect first morning urine in sterile container',
                'status' => 'active',
            ],

            // Microbiology
            [
                'name' => 'Blood Culture & Sensitivity',
                'code' => 'BLOODCS001',
                'category_id' => $categoryIds['Microbiology'],
                'price' => 2000.00,
                'turnaround_time' => 72,
                'sample_type' => 'Whole Blood (Sterile)',
                'unit' => 'Growth/No Growth',
                'normal_range' => 'No Growth',
                'instructions' => 'Collect before antibiotic therapy if possible',
                'status' => 'active',
            ],
            [
                'name' => 'Stool Culture & Sensitivity',
                'code' => 'STOOLCS001',
                'category_id' => $categoryIds['Microbiology'],
                'price' => 1500.00,
                'turnaround_time' => 48,
                'sample_type' => 'Stool',
                'unit' => 'Growth/No Growth',
                'normal_range' => 'Normal Flora',
                'instructions' => 'Collect fresh stool sample',
                'status' => 'active',
            ],

            // Serology
            [
                'name' => 'HIV Screening (ELISA)',
                'code' => 'HIV001',
                'category_id' => $categoryIds['Serology'],
                'price' => 800.00,
                'turnaround_time' => 4,
                'sample_type' => 'Serum',
                'unit' => 'Reactive/Non-reactive',
                'normal_range' => 'Non-reactive',
                'instructions' => 'Pre-test counseling required',
                'status' => 'active',
            ],
            [
                'name' => 'Hepatitis B Surface Antigen (HBsAg)',
                'code' => 'HBSAG001',
                'category_id' => $categoryIds['Serology'],
                'price' => 700.00,
                'turnaround_time' => 4,
                'sample_type' => 'Serum',
                'unit' => 'Reactive/Non-reactive',
                'normal_range' => 'Non-reactive',
                'status' => 'active',
            ],
            [
                'name' => 'Hepatitis C Antibody (Anti-HCV)',
                'code' => 'HCV001',
                'category_id' => $categoryIds['Serology'],
                'price' => 800.00,
                'turnaround_time' => 4,
                'sample_type' => 'Serum',
                'unit' => 'Reactive/Non-reactive',
                'normal_range' => 'Non-reactive',
                'status' => 'active',
            ],
            [
                'name' => 'Widal Test (Typhoid)',
                'code' => 'WIDAL001',
                'category_id' => $categoryIds['Serology'],
                'price' => 600.00,
                'turnaround_time' => 4,
                'sample_type' => 'Serum',
                'unit' => 'Titre',
                'normal_range' => '<1:80',
                'status' => 'active',
            ],
            [
                'name' => 'Malaria Parasite (BS for MP)',
                'code' => 'MALARIA001',
                'category_id' => $categoryIds['Microbiology'],
                'price' => 300.00,
                'turnaround_time' => 1,
                'sample_type' => 'Whole Blood (EDTA)',
                'unit' => 'Positive/Negative',
                'normal_range' => 'Negative',
                'instructions' => 'Collect during fever spike if possible',
                'status' => 'active',
            ],

            // Immunology
            [
                'name' => 'Thyroid Function Tests (TFT)',
                'code' => 'TFT001',
                'category_id' => $categoryIds['Immunology'],
                'price' => 2000.00,
                'turnaround_time' => 24,
                'sample_type' => 'Serum',
                'unit' => 'Various',
                'normal_range' => 'TSH: 0.4-4.0 mIU/L, T3: 80-200 ng/dL, T4: 5-12 μg/dL',
                'status' => 'active',
            ],
            [
                'name' => 'Pregnancy Test (Beta-hCG)',
                'code' => 'PREG001',
                'category_id' => $categoryIds['Immunology'],
                'price' => 500.00,
                'turnaround_time' => 2,
                'sample_type' => 'Serum/Urine',
                'unit' => 'mIU/mL',
                'normal_range' => '<5 (Non-pregnant)',
                'instructions' => 'First morning urine preferred',
                'status' => 'active',
            ],
        ];

        foreach ($tests as $test) {
            TestCatalog::create($test);
        }

        $this->command->info('Test catalog seeded successfully!');
        $this->command->info('Total tests created: ' . count($tests));
    }
}
