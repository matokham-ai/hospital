<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceCatalogue;

class ServiceCatalogueSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            // Consultations
            [
                'code' => 'CONS001',
                'name' => 'General Physician Consultation',
                'category' => ServiceCatalogue::CATEGORY_CONSULTATION,
                'description' => 'General medical consultation',
                'unit_price' => 2000.00,
                'unit_of_measure' => 'session',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'CONS002',
                'name' => 'Specialist Consultation',
                'category' => ServiceCatalogue::CATEGORY_CONSULTATION,
                'description' => 'Specialist medical consultation',
                'unit_price' => 30000.00,
                'unit_of_measure' => 'session',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'CONS003',
                'name' => 'Emergency Consultation',
                'category' => ServiceCatalogue::CATEGORY_CONSULTATION,
                'description' => 'Emergency medical consultation',
                'unit_price' => 39000.00,
                'unit_of_measure' => 'session',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'CONS004',
                'name' => 'Follow-up Consultation',
                'category' => ServiceCatalogue::CATEGORY_CONSULTATION,
                'description' => 'Follow-up medical consultation',
                'unit_price' => 13000.00,
                'unit_of_measure' => 'session',
                'is_active' => true,
                'is_billable' => true,
            ],

            // Lab Tests
            [
                'code' => 'LAB001',
                'name' => 'Complete Blood Count (CBC)',
                'category' => ServiceCatalogue::CATEGORY_LAB_TEST,
                'description' => 'Complete blood count with differential',
                'unit_price' => 5850.00,
                'unit_of_measure' => 'test',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'LAB002',
                'name' => 'Blood Sugar Test',
                'category' => ServiceCatalogue::CATEGORY_LAB_TEST,
                'description' => 'Random/fasting blood glucose test',
                'unit_price' => 3250.00,
                'unit_of_measure' => 'test',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'LAB003',
                'name' => 'Lipid Profile',
                'category' => ServiceCatalogue::CATEGORY_LAB_TEST,
                'description' => 'Complete lipid panel test',
                'unit_price' => 8450.00,
                'unit_of_measure' => 'test',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'LAB004',
                'name' => 'Liver Function Test',
                'category' => ServiceCatalogue::CATEGORY_LAB_TEST,
                'description' => 'Comprehensive liver function panel',
                'unit_price' => 11050.00,
                'unit_of_measure' => 'test',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'LAB005',
                'name' => 'Urine Analysis',
                'category' => ServiceCatalogue::CATEGORY_LAB_TEST,
                'description' => 'Complete urine analysis',
                'unit_price' => 3900.00,
                'unit_of_measure' => 'test',
                'is_active' => true,
                'is_billable' => true,
            ],

            // Imaging
            [
                'code' => 'IMG001',
                'name' => 'Chest X-Ray',
                'category' => ServiceCatalogue::CATEGORY_IMAGING,
                'description' => 'Chest radiograph examination',
                'unit_price' => 10400.00,
                'unit_of_measure' => 'study',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'IMG002',
                'name' => 'CT Scan - Head',
                'category' => ServiceCatalogue::CATEGORY_IMAGING,
                'description' => 'Computed tomography of head',
                'unit_price' => 58500.00,
                'unit_of_measure' => 'study',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'IMG003',
                'name' => 'Ultrasound - Abdomen',
                'category' => ServiceCatalogue::CATEGORY_IMAGING,
                'description' => 'Abdominal ultrasound examination',
                'unit_price' => 15600.00,
                'unit_of_measure' => 'study',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'IMG004',
                'name' => 'ECG',
                'category' => ServiceCatalogue::CATEGORY_IMAGING,
                'description' => 'Electrocardiogram',
                'unit_price' => 6500.00,
                'unit_of_measure' => 'study',
                'is_active' => true,
                'is_billable' => true,
            ],

            // Medications
            [
                'code' => 'MED001',
                'name' => 'IV Fluid - Normal Saline 500ml',
                'category' => ServiceCatalogue::CATEGORY_MEDICATION,
                'description' => 'Intravenous normal saline solution',
                'unit_price' => 1950.00,
                'unit_of_measure' => 'bag',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'MED002',
                'name' => 'Antibiotic - Ceftriaxone 1g',
                'category' => ServiceCatalogue::CATEGORY_MEDICATION,
                'description' => 'Ceftriaxone injection 1g',
                'unit_price' => 3250.00,
                'unit_of_measure' => 'vial',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'MED003',
                'name' => 'Pain Relief - Morphine 10mg',
                'category' => ServiceCatalogue::CATEGORY_MEDICATION,
                'description' => 'Morphine injection 10mg',
                'unit_price' => 4550.00,
                'unit_of_measure' => 'ampoule',
                'is_active' => true,
                'is_billable' => true,
            ],

            // Procedures
            [
                'code' => 'PROC001',
                'name' => 'IV Cannulation',
                'category' => ServiceCatalogue::CATEGORY_PROCEDURE,
                'description' => 'Intravenous cannula insertion',
                'unit_price' => 5200.00,
                'unit_of_measure' => 'procedure',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'PROC002',
                'name' => 'Wound Dressing - Simple',
                'category' => ServiceCatalogue::CATEGORY_PROCEDURE,
                'description' => 'Simple wound cleaning and dressing',
                'unit_price' => 4550.00,
                'unit_of_measure' => 'procedure',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'PROC003',
                'name' => 'Blood Transfusion',
                'category' => ServiceCatalogue::CATEGORY_PROCEDURE,
                'description' => 'Blood transfusion procedure',
                'unit_price' => 26000.00,
                'unit_of_measure' => 'procedure',
                'is_active' => true,
                'is_billable' => true,
            ],

            // Bed Charges
            [
                'code' => 'BED001',
                'name' => 'General Ward - per day',
                'category' => ServiceCatalogue::CATEGORY_BED_CHARGE,
                'description' => 'General ward accommodation per day',
                'unit_price' => 23400.00,
                'unit_of_measure' => 'day',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'BED002',
                'name' => 'Private Room - per day',
                'category' => ServiceCatalogue::CATEGORY_BED_CHARGE,
                'description' => 'Private room accommodation per day',
                'unit_price' => 45500.00,
                'unit_of_measure' => 'day',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'BED003',
                'name' => 'ICU - per day',
                'category' => ServiceCatalogue::CATEGORY_BED_CHARGE,
                'description' => 'Intensive care unit per day',
                'unit_price' => 104000.00,
                'unit_of_measure' => 'day',
                'is_active' => true,
                'is_billable' => true,
            ],

            // Consumables
            [
                'code' => 'SUPP001',
                'name' => 'Surgical Gloves - pair',
                'category' => ServiceCatalogue::CATEGORY_CONSUMABLE,
                'description' => 'Sterile surgical gloves',
                'unit_price' => 325.00,
                'unit_of_measure' => 'pair',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'SUPP002',
                'name' => 'Disposable Syringe 5ml',
                'category' => ServiceCatalogue::CATEGORY_CONSUMABLE,
                'description' => 'Disposable syringe 5ml',
                'unit_price' => 195.00,
                'unit_of_measure' => 'piece',
                'is_active' => true,
                'is_billable' => true,
            ],
            [
                'code' => 'SUPP003',
                'name' => 'Gauze Pads - pack',
                'category' => ServiceCatalogue::CATEGORY_CONSUMABLE,
                'description' => 'Sterile gauze pads pack',
                'unit_price' => 1040.00,
                'unit_of_measure' => 'pack',
                'is_active' => true,
                'is_billable' => true,
            ],

            // Nursing Services
            [
                'code' => 'NURS001',
                'name' => 'Nursing Care - per day',
                'category' => ServiceCatalogue::CATEGORY_NURSING,
                'description' => 'General nursing care per day',
                'unit_price' => 15600.00,
                'unit_of_measure' => 'day',
                'is_active' => true,
                'is_billable' => true,
            ],
        ];

        foreach ($services as $service) {
            ServiceCatalogue::updateOrCreate(
                ['code' => $service['code']],
                $service
            );
        }
    }
}
