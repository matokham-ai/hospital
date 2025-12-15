<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Drug;

class PrescriptionSeeder extends Seeder
{
    public function run(): void
    {
        // Create simple sample prescriptions
        $prescription1 = Prescription::create([
            'encounter_id' => 1,
            'patient_id' => 'P001',
            'physician_id' => 'DOC001',
            'drug_name' => 'Paracetamol 500mg',
            'dosage' => '500mg',
            'frequency' => 'TID',
            'duration' => 5,
            'quantity' => 15,
            'status' => 'pending',
            'notes' => 'Take after meals'
        ]);

        $prescription2 = Prescription::create([
            'encounter_id' => 2,
            'patient_id' => 'P002',
            'physician_id' => 'DOC002',
            'drug_name' => 'Amoxicillin 250mg',
            'dosage' => '250mg',
            'frequency' => 'BID',
            'duration' => 7,
            'quantity' => 14,
            'status' => 'pending',
            'notes' => 'Complete full course'
        ]);

        $prescription3 = Prescription::create([
            'encounter_id' => 3,
            'patient_id' => 'P001',
            'physician_id' => 'DOC001',
            'drug_name' => 'Ibuprofen 200mg',
            'dosage' => '200mg',
            'frequency' => 'QID',
            'duration' => 3,
            'quantity' => 12,
            'status' => 'pending',
            'notes' => 'Take with food'
        ]);

        $prescription4 = Prescription::create([
            'encounter_id' => 4,
            'patient_id' => 'P003',
            'physician_id' => 'DOC001',
            'drug_name' => 'Aspirin 75mg',
            'dosage' => '75mg',
            'frequency' => 'OD',
            'duration' => 30,
            'quantity' => 30,
            'status' => 'verified',
            'notes' => 'Take in the morning - Verified by pharmacist'
        ]);

        $prescription5 = Prescription::create([
            'encounter_id' => 5,
            'patient_id' => 'P002',
            'physician_id' => 'DOC002',
            'drug_name' => 'Multivitamin',
            'dosage' => '1 tablet',
            'frequency' => 'OD',
            'duration' => 30,
            'quantity' => 30,
            'status' => 'dispensed',
            'notes' => 'Take with breakfast - Dispensed'
        ]);

        // Create prescription items for the prescriptions
        $drugs = Drug::all();
        if ($drugs->count() >= 3) {
            // Create items for prescription 1 (Paracetamol)
            PrescriptionItem::create([
                'prescription_id' => $prescription1->id,
                'drug_id' => $drugs[0]->id, // Paracetamol
                'dose' => '500mg',
                'frequency' => 'TID (3 times daily)',
                'duration' => '5 days',
                'quantity' => 15,
                'route' => 'Oral',
                'instructions' => 'Take after meals with water'
            ]);

            // Create items for prescription 2 (Amoxicillin)
            PrescriptionItem::create([
                'prescription_id' => $prescription2->id,
                'drug_id' => $drugs[1]->id, // Amoxicillin
                'dose' => '250mg',
                'frequency' => 'BID (2 times daily)',
                'duration' => '7 days',
                'quantity' => 14,
                'route' => 'Oral',
                'instructions' => 'Complete full course even if feeling better'
            ]);

            // Create items for prescription 3 (Ibuprofen)
            PrescriptionItem::create([
                'prescription_id' => $prescription3->id,
                'drug_id' => $drugs[2]->id, // Ibuprofen
                'dose' => '200mg',
                'frequency' => 'QID (4 times daily)',
                'duration' => '3 days',
                'quantity' => 12,
                'route' => 'Oral',
                'instructions' => 'Take with food to avoid stomach upset'
            ]);

            // Create multiple items for prescription 4 (combination therapy)
            PrescriptionItem::create([
                'prescription_id' => $prescription4->id,
                'drug_id' => $drugs[0]->id, // Paracetamol
                'dose' => '500mg',
                'frequency' => 'BID (2 times daily)',
                'duration' => '30 days',
                'quantity' => 60,
                'route' => 'Oral',
                'instructions' => 'Take in the morning and evening'
            ]);

            if ($drugs->count() > 1) {
                PrescriptionItem::create([
                    'prescription_id' => $prescription4->id,
                    'drug_id' => $drugs[1]->id, // Amoxicillin
                    'dose' => '250mg',
                    'frequency' => 'OD (once daily)',
                    'duration' => '30 days',
                    'quantity' => 30,
                    'route' => 'Oral',
                    'instructions' => 'Take with breakfast'
                ]);

                // Create item for prescription 5 (Multivitamin - using first drug as placeholder)
                PrescriptionItem::create([
                    'prescription_id' => $prescription5->id,
                    'drug_id' => $drugs[0]->id, // Using Paracetamol as placeholder for multivitamin
                    'dose' => '1 tablet',
                    'frequency' => 'OD (once daily)',
                    'duration' => '30 days',
                    'quantity' => 30,
                    'route' => 'Oral',
                    'instructions' => 'Take with breakfast for best absorption'
                ]);
            }
        }
    }
}