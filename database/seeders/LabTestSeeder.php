<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LabTestSeeder extends Seeder
{
    public function run()
    {
        $labTests = [
            // Hematology Tests
            [
                'code' => 'CBC001',
                'name' => 'Complete Blood Count (CBC)',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => 'Various',
                'normal_range' => 'Age/Gender Specific',
                'price' => 1500.00,
                'is_active' => true
            ],
            [
                'code' => 'HGB001',
                'name' => 'Hemoglobin',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => 'g/dL',
                'normal_range' => '12.0-16.0',
                'price' => 800.00,
                'is_active' => true
            ],
            [
                'code' => 'HCT001',
                'name' => 'Hematocrit',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => '%',
                'normal_range' => '36-48',
                'price' => 700.00,
                'is_active' => true
            ],
            [
                'code' => 'WBC001',
                'name' => 'White Blood Cell Count',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => '×10³/μL',
                'normal_range' => '4.0-11.0',
                'price' => 900.00,
                'is_active' => true
            ],
            [
                'code' => 'PLT001',
                'name' => 'Platelet Count',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => '×10³/μL',
                'normal_range' => '150-450',
                'price' => 1000.00,
                'is_active' => true
            ],
            [
                'code' => 'ESR001',
                'name' => 'Erythrocyte Sedimentation Rate (ESR)',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => 'mm/hr',
                'normal_range' => '0-20',
                'price' => 1200.00,
                'is_active' => true
            ],

            // Clinical Chemistry
            [
                'code' => 'BMP001',
                'name' => 'Basic Metabolic Panel',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'Various',
                'normal_range' => 'Test Specific',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'CMP001',
                'name' => 'Comprehensive Metabolic Panel',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'Various',
                'normal_range' => 'Test Specific',
                'price' => 3500.00,
                'is_active' => true
            ],
            [
                'code' => 'GLU001',
                'name' => 'Glucose (Fasting)',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '70-100',
                'price' => 800.00,
                'is_active' => true
            ],
            [
                'code' => 'GLU002',
                'name' => 'Glucose (Random)',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '70-140',
                'price' => 800.00,
                'is_active' => true
            ],
            [
                'code' => 'HBA1C',
                'name' => 'Hemoglobin A1c',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => '%',
                'normal_range' => '<5.7',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'CREAT1',
                'name' => 'Creatinine',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '0.6-1.2',
                'price' => 900.00,
                'is_active' => true
            ],
            [
                'code' => 'BUN001',
                'name' => 'Blood Urea Nitrogen (BUN)',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '7-20',
                'price' => 700.00,
                'is_active' => true
            ],
            [
                'code' => 'EGFR01',
                'name' => 'Estimated GFR',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mL/min/1.73m²',
                'normal_range' => '>60',
                'price' => 1000.00,
                'is_active' => true
            ],

            // Liver Function Tests
            [
                'code' => 'LFT001',
                'name' => 'Liver Function Panel',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'Various',
                'normal_range' => 'Test Specific',
                'price' => 3000.00,
                'is_active' => true
            ],
            [
                'code' => 'ALT001',
                'name' => 'Alanine Aminotransferase (ALT)',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'U/L',
                'normal_range' => '7-56',
                'price' => 1000.00,
                'is_active' => true
            ],
            [
                'code' => 'AST001',
                'name' => 'Aspartate Aminotransferase (AST)',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'U/L',
                'normal_range' => '10-40',
                'price' => 1000.00,
                'is_active' => true
            ],
            [
                'code' => 'BILI01',
                'name' => 'Bilirubin (Total)',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '0.3-1.2',
                'price' => 900.00,
                'is_active' => true
            ],
            [
                'code' => 'ALP001',
                'name' => 'Alkaline Phosphatase',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'U/L',
                'normal_range' => '44-147',
                'price' => 1200.00,
                'is_active' => true
            ],

            // Lipid Panel
            [
                'code' => 'LIPID1',
                'name' => 'Lipid Panel',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'Various',
                'normal_range' => 'Test Specific',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'CHOL01',
                'name' => 'Total Cholesterol',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '<200',
                'price' => 800.00,
                'is_active' => true
            ],
            [
                'code' => 'HDL001',
                'name' => 'HDL Cholesterol',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '>40',
                'price' => 900.00,
                'is_active' => true
            ],
            [
                'code' => 'LDL001',
                'name' => 'LDL Cholesterol',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '<100',
                'price' => 1000.00,
                'is_active' => true
            ],
            [
                'code' => 'TRIG01',
                'name' => 'Triglycerides',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mg/dL',
                'normal_range' => '<150',
                'price' => 900.00,
                'is_active' => true
            ],

            // Thyroid Function Tests
            [
                'code' => 'TFT001',
                'name' => 'Thyroid Function Panel',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'Various',
                'normal_range' => 'Test Specific',
                'price' => 4500.00,
                'is_active' => true
            ],
            [
                'code' => 'TSH001',
                'name' => 'Thyroid Stimulating Hormone (TSH)',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'mIU/L',
                'normal_range' => '0.4-4.0',
                'price' => 1500.00,
                'is_active' => true
            ],
            [
                'code' => 'FT4001',
                'name' => 'Free T4',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'ng/dL',
                'normal_range' => '0.8-1.8',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'FT3001',
                'name' => 'Free T3',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'pg/mL',
                'normal_range' => '2.3-4.2',
                'price' => 2800.00,
                'is_active' => true
            ],

            // Cardiac Markers
            [
                'code' => 'TROP01',
                'name' => 'Troponin I',
                'category' => 'Cardiology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '<0.04',
                'price' => 3500.00,
                'is_active' => true
            ],
            [
                'code' => 'CK001',
                'name' => 'Creatine Kinase (CK)',
                'category' => 'Cardiology',
                'sample_type' => 'Blood',
                'units' => 'U/L',
                'normal_range' => '30-200',
                'price' => 1500.00,
                'is_active' => true
            ],
            [
                'code' => 'CKMB01',
                'name' => 'CK-MB',
                'category' => 'Cardiology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '<6.3',
                'price' => 2500.00,
                'is_active' => true
            ],

            // Inflammatory Markers
            [
                'code' => 'CRP001',
                'name' => 'C-Reactive Protein (CRP)',
                'category' => 'Immunology',
                'sample_type' => 'Blood',
                'units' => 'mg/L',
                'normal_range' => '<3.0',
                'price' => 1000.00,
                'is_active' => true
            ],
            [
                'code' => 'PCT001',
                'name' => 'Procalcitonin',
                'category' => 'Immunology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '<0.25',
                'price' => 2500.00,
                'is_active' => true
            ],

            // Coagulation Studies
            [
                'code' => 'PT001',
                'name' => 'Prothrombin Time (PT)',
                'category' => 'Coagulation',
                'sample_type' => 'Blood',
                'units' => 'seconds',
                'normal_range' => '11-13',
                'price' => 1500.00,
                'is_active' => true
            ],
            [
                'code' => 'PTT001',
                'name' => 'Partial Thromboplastin Time (PTT)',
                'category' => 'Coagulation',
                'sample_type' => 'Blood',
                'units' => 'seconds',
                'normal_range' => '25-35',
                'price' => 1500.00,
                'is_active' => true
            ],
            [
                'code' => 'INR001',
                'name' => 'International Normalized Ratio (INR)',
                'category' => 'Coagulation',
                'sample_type' => 'Blood',
                'units' => 'ratio',
                'normal_range' => '0.8-1.1',
                'price' => 1000.00,
                'is_active' => true
            ],

            // Urinalysis
            [
                'code' => 'URIN01',
                'name' => 'Urinalysis (Complete)',
                'category' => 'Urinalysis',
                'sample_type' => 'Urine',
                'units' => 'Various',
                'normal_range' => 'Test Specific',
                'price' => 1000.00,
                'is_active' => true
            ],
            [
                'code' => 'UMIC01',
                'name' => 'Urine Microscopy',
                'category' => 'Urinalysis',
                'sample_type' => 'Urine',
                'units' => '/hpf',
                'normal_range' => 'Test Specific',
                'price' => 800.00,
                'is_active' => true
            ],
            [
                'code' => 'UCULT1',
                'name' => 'Urine Culture',
                'category' => 'Microbiology',
                'sample_type' => 'Urine',
                'units' => 'CFU/mL',
                'normal_range' => '<10,000',
                'price' => 3000.00,
                'is_active' => true
            ],

            // Electrolytes
            [
                'code' => 'NA001',
                'name' => 'Sodium',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mEq/L',
                'normal_range' => '136-145',
                'price' => 700.00,
                'is_active' => true
            ],
            [
                'code' => 'K001',
                'name' => 'Potassium',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mEq/L',
                'normal_range' => '3.5-5.0',
                'price' => 700.00,
                'is_active' => true
            ],
            [
                'code' => 'CL001',
                'name' => 'Chloride',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mEq/L',
                'normal_range' => '98-107',
                'price' => 700.00,
                'is_active' => true
            ],
            [
                'code' => 'CO2001',
                'name' => 'Carbon Dioxide',
                'category' => 'Clinical Chemistry',
                'sample_type' => 'Blood',
                'units' => 'mEq/L',
                'normal_range' => '22-28',
                'price' => 700.00,
                'is_active' => true
            ],

            // Vitamins and Minerals
            [
                'code' => 'VITD1',
                'name' => 'Vitamin D (25-OH)',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '30-100',
                'price' => 3000.00,
                'is_active' => true
            ],
            [
                'code' => 'VITB12',
                'name' => 'Vitamin B12',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => 'pg/mL',
                'normal_range' => '200-900',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'FOLAT1',
                'name' => 'Folate',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '2.7-17.0',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'IRON01',
                'name' => 'Iron',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => 'μg/dL',
                'normal_range' => '60-170',
                'price' => 1500.00,
                'is_active' => true
            ],
            [
                'code' => 'FERR01',
                'name' => 'Ferritin',
                'category' => 'Hematology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '15-150',
                'price' => 2500.00,
                'is_active' => true
            ],

            // Tumor Markers
            [
                'code' => 'PSA001',
                'name' => 'Prostate Specific Antigen (PSA)',
                'category' => 'Oncology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '<4.0',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'CEA001',
                'name' => 'Carcinoembryonic Antigen (CEA)',
                'category' => 'Oncology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '<3.0',
                'price' => 3000.00,
                'is_active' => true
            ],
            [
                'code' => 'AFP001',
                'name' => 'Alpha-Fetoprotein (AFP)',
                'category' => 'Oncology',
                'sample_type' => 'Blood',
                'units' => 'ng/mL',
                'normal_range' => '<10.0',
                'price' => 2500.00,
                'is_active' => true
            ],

            // Infectious Disease
            [
                'code' => 'HEPA01',
                'name' => 'Hepatitis A Antibody (IgM)',
                'category' => 'Serology',
                'sample_type' => 'Blood',
                'units' => 'Index',
                'normal_range' => '<0.9',
                'price' => 3500.00,
                'is_active' => true
            ],
            [
                'code' => 'HEPB01',
                'name' => 'Hepatitis B Surface Antigen',
                'category' => 'Serology',
                'sample_type' => 'Blood',
                'units' => 'Index',
                'normal_range' => '<1.0',
                'price' => 3000.00,
                'is_active' => true
            ],
            [
                'code' => 'HEPC01',
                'name' => 'Hepatitis C Antibody',
                'category' => 'Serology',
                'sample_type' => 'Blood',
                'units' => 'Index',
                'normal_range' => '<1.0',
                'price' => 3500.00,
                'is_active' => true
            ],
            [
                'code' => 'HIV001',
                'name' => 'HIV 1/2 Antibody',
                'category' => 'Serology',
                'sample_type' => 'Blood',
                'units' => 'Index',
                'normal_range' => '<1.0',
                'price' => 4500.00,
                'is_active' => true
            ],

            // Hormones
            [
                'code' => 'CORT01',
                'name' => 'Cortisol',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'μg/dL',
                'normal_range' => '6-23',
                'price' => 2500.00,
                'is_active' => true
            ],
            [
                'code' => 'INSUL1',
                'name' => 'Insulin',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'μU/mL',
                'normal_range' => '2.6-24.9',
                'price' => 3000.00,
                'is_active' => true
            ],
            [
                'code' => 'TEST01',
                'name' => 'Testosterone',
                'category' => 'Endocrinology',
                'sample_type' => 'Blood',
                'units' => 'ng/dL',
                'normal_range' => '300-1000',
                'price' => 3500.00,
                'is_active' => true
            ]
        ];

        // Insert all lab tests
        foreach ($labTests as $test) {
            DB::table('lab_tests')->insert(array_merge($test, [
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }

        $this->command->info('Lab tests seeded successfully! Added ' . count($labTests) . ' lab tests.');
    }
}