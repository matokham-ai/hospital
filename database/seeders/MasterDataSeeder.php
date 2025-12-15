<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCategory;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use App\Models\DrugSubstitute;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test departments
        $departments = [
            [
                'deptid' => 'CARD001',
                'name' => 'Cardiology Admin',
                'code' => 'CARD_ADM',
                'description' => 'Heart and cardiovascular system',
                'icon' => 'heart',
                'sort_order' => 1,
                'status' => 'active'
            ],
            [
                'deptid' => 'ORTH001',
                'name' => 'Orthopedics Admin',
                'code' => 'ORTH_ADM',
                'description' => 'Bone and joint care',
                'icon' => 'bone',
                'sort_order' => 2,
                'status' => 'active'
            ],
            [
                'deptid' => 'PEDI001',
                'name' => 'Pediatrics Admin',
                'code' => 'PEDI_ADM',
                'description' => 'Child healthcare',
                'icon' => 'baby',
                'sort_order' => 3,
                'status' => 'active'
            ]
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(
                ['deptid' => $dept['deptid']],
                $dept
            );
        }

        // Create test wards
        $wards = [
            [
                'wardid' => 'WARD001',
                'name' => 'Cardiology Ward',
                'code' => 'CW01',
                'department_id' => 'CARD001',
                'ward_type' => 'GENERAL',
                'total_beds' => 20,
                'floor_number' => 2,
                'description' => 'General cardiology ward',
                'status' => 'active'
            ],
            [
                'wardid' => 'WARD002',
                'name' => 'ICU',
                'code' => 'ICU01',
                'department_id' => 'CARD001',
                'ward_type' => 'ICU',
                'total_beds' => 10,
                'floor_number' => 3,
                'description' => 'Intensive Care Unit',
                'status' => 'active'
            ]
        ];

        foreach ($wards as $ward) {
            Ward::updateOrCreate(
                ['wardid' => $ward['wardid']],
                $ward
            );
        }

        // Create test beds
        $beds = [
            [
                'ward_id' => 'WARD001',
                'bed_number' => 'B001',
                'bed_type' => 'STANDARD',
                'status' => 'AVAILABLE'
            ],
            [
                'ward_id' => 'WARD001',
                'bed_number' => 'B002',
                'bed_type' => 'STANDARD',
                'status' => 'OCCUPIED'
            ],
            [
                'ward_id' => 'WARD002',
                'bed_number' => 'ICU001',
                'bed_type' => 'ICU',
                'status' => 'AVAILABLE'
            ]
        ];

        foreach ($beds as $bed) {
            Bed::updateOrCreate(
                ['ward_id' => $bed['ward_id'], 'bed_number' => $bed['bed_number']],
                $bed
            );
        }

        // Create test categories
        $categories = [
            [
                'name' => 'Hematology',
                'code' => 'HEMA',
                'description' => 'Blood tests',
                'color' => '#EF4444',
                'sort_order' => 1,
                'is_active' => true
            ],
            [
                'name' => 'Biochemistry',
                'code' => 'BIOC',
                'description' => 'Chemical analysis',
                'color' => '#3B82F6',
                'sort_order' => 2,
                'is_active' => true
            ]
        ];

        foreach ($categories as $category) {
            TestCategory::updateOrCreate(
                ['code' => $category['code']],
                $category
            );
        }

        // Create test catalogs
        $testCatalogs = [
            [
                'deptid' => 'CARD001',
                'category_id' => 1,
                'name' => 'Complete Blood Count',
                'code' => 'CBC001',
                'price' => 25.00,
                'turnaround_time' => 2,
                'unit' => 'cells/μL',
                'normal_range' => '4.5-11.0 x 10³',
                'sample_type' => 'Blood',
                'status' => 'active'
            ],
            [
                'deptid' => 'CARD001',
                'category_id' => 2,
                'name' => 'Lipid Profile',
                'code' => 'LIP001',
                'price' => 35.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_range' => '<200',
                'sample_type' => 'Serum',
                'status' => 'active'
            ]
        ];

        foreach ($testCatalogs as $test) {
            TestCatalog::updateOrCreate(
                ['code' => $test['code']],
                $test
            );
        }

        // Create drug formulary
        $drugs = [
            [
                'name' => 'Aspirin 100mg',
                'generic_name' => 'Acetylsalicylic Acid',
                'atc_code' => 'B01AC06',
                'strength' => '100mg',
                'form' => 'tablet',
                'stock_quantity' => 500,
                'reorder_level' => 50,
                'unit_price' => 0.25,
                'manufacturer' => 'Generic Pharma',
                'status' => 'active'
            ],
            [
                'name' => 'Paracetamol 500mg',
                'generic_name' => 'Paracetamol',
                'atc_code' => 'N02BE01',
                'strength' => '500mg',
                'form' => 'tablet',
                'stock_quantity' => 1000,
                'reorder_level' => 100,
                'unit_price' => 0.15,
                'manufacturer' => 'Generic Pharma',
                'status' => 'active'
            ]
        ];

        foreach ($drugs as $drug) {
            DrugFormulary::updateOrCreate(
                ['name' => $drug['name']],
                $drug
            );
        }

        $this->command->info('Master data seeded successfully!');
    }
}
