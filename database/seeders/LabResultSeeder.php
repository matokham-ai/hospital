<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LabResultSeeder extends Seeder
{
    public function run()
    {
        // Get completed lab orders
        $completedOrders = DB::table('lab_orders')
            ->where('status', 'completed')
            ->get();

        if ($completedOrders->isEmpty()) {
            $this->command->info('No completed lab orders found. Please ensure lab orders are seeded first.');
            return;
        }

        foreach ($completedOrders as $order) {
            $results = $this->generateResultsForTest($order->test_name, $order->id);
            
            foreach ($results as $result) {
                DB::table('lab_results')->insert([
                    'lab_order_id' => $order->id,
                    'parameter_name' => $result['parameter'],
                    'value' => $result['value'],
                    'unit' => $result['unit'],
                    'reference_range' => $result['referenceRange'],
                    'status' => $result['status'],
                    'description' => $result['description'],
                    'result' => $result['value'] . ' ' . $result['unit'], // Legacy field
                    'normal_range' => $result['referenceRange'], // Legacy field
                    'validated_by' => 'System',
                    'validated_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info('Lab results seeded successfully for ' . $completedOrders->count() . ' completed orders!');
    }

    private function generateResultsForTest($testName, $orderId)
    {
        $testNameLower = strtolower($testName);
        
        // Add some variation to make results more realistic
        $variation = ($orderId % 3) - 1; // -1, 0, or 1 for variation
        
        if (strpos($testNameLower, 'blood count') !== false || strpos($testNameLower, 'cbc') !== false) {
            return [
                [
                    'parameter' => 'Hemoglobin',
                    'value' => (14.2 + ($variation * 0.5)),
                    'unit' => 'g/dL',
                    'referenceRange' => '12.0-16.0',
                    'status' => $this->getStatus(14.2 + ($variation * 0.5), 12.0, 16.0),
                    'description' => 'Hemoglobin carries oxygen from lungs to body tissues'
                ],
                [
                    'parameter' => 'White Blood Cells',
                    'value' => (7.8 + ($variation * 1.2)),
                    'unit' => '×10³/μL',
                    'referenceRange' => '4.0-11.0',
                    'status' => $this->getStatus(7.8 + ($variation * 1.2), 4.0, 11.0),
                    'description' => 'White blood cells fight infection and disease'
                ],
                [
                    'parameter' => 'Platelets',
                    'value' => (280 + ($variation * 30)),
                    'unit' => '×10³/μL',
                    'referenceRange' => '150-450',
                    'status' => $this->getStatus(280 + ($variation * 30), 150, 450),
                    'description' => 'Platelets help blood clot to stop bleeding'
                ],
                [
                    'parameter' => 'Hematocrit',
                    'value' => (42.5 + ($variation * 2)),
                    'unit' => '%',
                    'referenceRange' => '36-48',
                    'status' => $this->getStatus(42.5 + ($variation * 2), 36, 48),
                    'description' => 'Percentage of blood volume occupied by red blood cells'
                ]
            ];
        }
        
        if (strpos($testNameLower, 'liver') !== false || strpos($testNameLower, 'lft') !== false) {
            return [
                [
                    'parameter' => 'ALT (Alanine Aminotransferase)',
                    'value' => (45 + ($variation * 8)),
                    'unit' => 'U/L',
                    'referenceRange' => '7-56',
                    'status' => $this->getStatus(45 + ($variation * 8), 7, 56),
                    'description' => 'Enzyme found mainly in the liver, elevated levels may indicate liver damage'
                ],
                [
                    'parameter' => 'AST (Aspartate Aminotransferase)',
                    'value' => (38 + ($variation * 6)),
                    'unit' => 'U/L',
                    'referenceRange' => '10-40',
                    'status' => $this->getStatus(38 + ($variation * 6), 10, 40),
                    'description' => 'Enzyme found in liver and other tissues, elevated levels suggest tissue damage'
                ],
                [
                    'parameter' => 'Bilirubin Total',
                    'value' => (0.8 + ($variation * 0.2)),
                    'unit' => 'mg/dL',
                    'referenceRange' => '0.3-1.2',
                    'status' => $this->getStatus(0.8 + ($variation * 0.2), 0.3, 1.2),
                    'description' => 'Waste product from breakdown of red blood cells, processed by liver'
                ],
                [
                    'parameter' => 'Alkaline Phosphatase',
                    'value' => (85 + ($variation * 15)),
                    'unit' => 'U/L',
                    'referenceRange' => '44-147',
                    'status' => $this->getStatus(85 + ($variation * 15), 44, 147),
                    'description' => 'Enzyme found in liver and bones, elevated levels may indicate liver or bone disease'
                ]
            ];
        }
        
        if (strpos($testNameLower, 'blood sugar') !== false || strpos($testNameLower, 'glucose') !== false || strpos($testNameLower, 'rbs') !== false) {
            $glucoseValue = 95 + ($variation * 15);
            return [
                [
                    'parameter' => 'Glucose',
                    'value' => $glucoseValue,
                    'unit' => 'mg/dL',
                    'referenceRange' => '70-140',
                    'status' => $this->getStatus($glucoseValue, 70, 140),
                    'description' => 'Blood sugar level, important for energy metabolism'
                ],
                [
                    'parameter' => 'HbA1c',
                    'value' => (5.4 + ($variation * 0.3)),
                    'unit' => '%',
                    'referenceRange' => '<5.7',
                    'status' => (5.4 + ($variation * 0.3)) < 5.7 ? 'normal' : 'abnormal',
                    'description' => 'Average blood sugar over past 2-3 months'
                ]
            ];
        }
        
        if (strpos($testNameLower, 'thyroid') !== false || strpos($testNameLower, 'tsh') !== false) {
            return [
                [
                    'parameter' => 'TSH',
                    'value' => (2.1 + ($variation * 0.5)),
                    'unit' => 'mIU/L',
                    'referenceRange' => '0.4-4.0',
                    'status' => $this->getStatus(2.1 + ($variation * 0.5), 0.4, 4.0),
                    'description' => 'Thyroid stimulating hormone, regulates thyroid function'
                ],
                [
                    'parameter' => 'Free T4',
                    'value' => (1.3 + ($variation * 0.2)),
                    'unit' => 'ng/dL',
                    'referenceRange' => '0.8-1.8',
                    'status' => $this->getStatus(1.3 + ($variation * 0.2), 0.8, 1.8),
                    'description' => 'Free thyroxine, main thyroid hormone affecting metabolism'
                ],
                [
                    'parameter' => 'Free T3',
                    'value' => (3.2 + ($variation * 0.3)),
                    'unit' => 'pg/mL',
                    'referenceRange' => '2.3-4.2',
                    'status' => $this->getStatus(3.2 + ($variation * 0.3), 2.3, 4.2),
                    'description' => 'Free triiodothyronine, active form of thyroid hormone'
                ]
            ];
        }
        
        if (strpos($testNameLower, 'urine') !== false || strpos($testNameLower, 'culture') !== false) {
            return [
                [
                    'parameter' => 'Bacteria',
                    'value' => $variation > 0 ? 'Light growth' : 'No growth',
                    'unit' => '',
                    'referenceRange' => 'No growth',
                    'status' => $variation > 0 ? 'abnormal' : 'normal',
                    'description' => 'Presence of bacteria may indicate urinary tract infection'
                ],
                [
                    'parameter' => 'White Blood Cells',
                    'value' => (2 + abs($variation)),
                    'unit' => '/hpf',
                    'referenceRange' => '0-5',
                    'status' => $this->getStatus(2 + abs($variation), 0, 5),
                    'description' => 'Elevated WBC in urine may indicate inflammation or infection'
                ],
                [
                    'parameter' => 'Red Blood Cells',
                    'value' => abs($variation),
                    'unit' => '/hpf',
                    'referenceRange' => '0-2',
                    'status' => $this->getStatus(abs($variation), 0, 2),
                    'description' => 'RBC in urine may indicate bleeding in urinary tract'
                ]
            ];
        }
        
        // Default results for unknown tests
        return [
            [
                'parameter' => 'Result',
                'value' => 'Normal',
                'unit' => '',
                'referenceRange' => 'Normal',
                'status' => 'normal',
                'description' => 'Test completed successfully with normal findings'
            ]
        ];
    }

    private function getStatus($value, $min, $max)
    {
        if ($value < $min || $value > $max) {
            // Determine if it's critical (very far from normal)
            $range = $max - $min;
            $deviation = max(abs($value - $min), abs($value - $max));
            
            if ($deviation > $range * 0.5) {
                return 'critical';
            }
            return 'abnormal';
        }
        return 'normal';
    }
}