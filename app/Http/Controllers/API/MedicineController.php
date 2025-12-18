<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrugFormulary;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MedicineController extends Controller
{
    /**
     * Get medicines with filtering and search
     */
    public function index(Request $request): JsonResponse
    {
        $query = DrugFormulary::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        // Filter by category/form
        if ($request->filled('category')) {
            $query->where('form', $request->get('category'));
        }

        // Filter by stock status
        if ($request->filled('stock_status')) {
            switch ($request->get('stock_status')) {
                case 'in_stock':
                    $query->where('stock_quantity', '>', 0);
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', '<=', 0);
                    break;
                case 'low_stock':
                    $query->whereColumn('stock_quantity', '<=', 'reorder_level')
                          ->where('stock_quantity', '>', 0);
                    break;
            }
        }

        // Only active medicines by default
        $query->where('status', 'active');

        $perPage = $request->get('per_page', 20);
        $medicines = $query->orderBy('name')->paginate($perPage);

        // Transform the data
        $medicines->getCollection()->transform(function ($medicine) {
            return $this->transformMedicine($medicine);
        });

        return response()->json($medicines);
    }

    /**
     * Get a specific medicine
     */
    public function show(Request $request, $id): JsonResponse
    {
        $medicine = DrugFormulary::findOrFail($id);
        
        return response()->json($this->transformMedicineDetail($medicine));
    }

    /**
     * Transform drug formulary to medicine format
     */
    private function transformMedicine($drug)
    {
        return [
            'id' => $drug->id,
            'name' => $drug->name,
            'genericName' => $drug->generic_name,
            'strength' => $drug->strength,
            'form' => ucfirst($drug->form),
            'manufacturer' => $drug->manufacturer ?? 'Unknown',
            'category' => $this->mapFormToCategory($drug->form),
            'price' => (float) $drug->unit_price,
            'stock' => $drug->stock_quantity,
            'description' => $this->generateDescription($drug),
            'sideEffects' => $this->getSideEffects($drug),
            'contraindications' => $this->getContraindications($drug),
            'dosage' => $this->getRecommendedDosage($drug),
            'inStock' => $drug->stock_quantity > 0,
            'stockStatus' => $this->getStockStatus($drug),
            'reorderLevel' => $drug->reorder_level,
            'expiryDate' => $drug->expiry_date ? $drug->expiry_date->format('Y-m-d') : null,
            'batchNumber' => $drug->batch_number,
            'atcCode' => $drug->atc_code
        ];
    }

    /**
     * Transform drug formulary to detailed medicine format
     */
    private function transformMedicineDetail($drug)
    {
        $medicine = $this->transformMedicine($drug);
        
        // Add additional details
        $medicine['substitutes'] = []; // Substitutes functionality disabled for now
        
        $medicine['notes'] = $drug->notes;
        $medicine['createdAt'] = $drug->created_at->format('Y-m-d H:i:s');
        $medicine['updatedAt'] = $drug->updated_at->format('Y-m-d H:i:s');

        return $medicine;
    }

    /**
     * Map form to category
     */
    private function mapFormToCategory($form)
    {
        $mapping = [
            'tablet' => 'Oral Medication',
            'capsule' => 'Oral Medication',
            'syrup' => 'Liquid Medication',
            'injection' => 'Injectable',
            'cream' => 'Topical',
            'ointment' => 'Topical',
            'drops' => 'Drops',
            'inhaler' => 'Respiratory',
            'other' => 'Other'
        ];

        return $mapping[strtolower($form)] ?? 'Other';
    }

    /**
     * Generate description based on drug properties
     */
    private function generateDescription($drug)
    {
        $category = $this->mapFormToCategory($drug->form);
        return "A {$category} containing {$drug->generic_name} in {$drug->strength} strength.";
    }

    /**
     * Get side effects (would typically come from drug database)
     */
    private function getSideEffects($drug)
    {
        // This would typically come from a comprehensive drug database
        // For now, return common side effects based on form/category
        $commonSideEffects = [
            'tablet' => ['Nausea', 'Headache', 'Dizziness'],
            'capsule' => ['Stomach upset', 'Drowsiness', 'Dry mouth'],
            'syrup' => ['Nausea', 'Vomiting', 'Diarrhea'],
            'injection' => ['Pain at injection site', 'Swelling', 'Redness'],
            'cream' => ['Skin irritation', 'Redness', 'Itching'],
            'ointment' => ['Local irritation', 'Burning sensation'],
            'drops' => ['Local irritation', 'Temporary blurred vision'],
            'inhaler' => ['Throat irritation', 'Cough', 'Hoarseness']
        ];

        return $commonSideEffects[strtolower($drug->form)] ?? ['Consult healthcare provider'];
    }

    /**
     * Get contraindications (would typically come from drug database)
     */
    private function getContraindications($drug)
    {
        // This would typically come from a comprehensive drug database
        // For now, return general contraindications
        return [
            'Known allergy to ' . $drug->generic_name,
            'Severe liver disease (consult physician)',
            'Pregnancy (consult physician)'
        ];
    }

    /**
     * Get recommended dosage (would typically come from drug database)
     */
    private function getRecommendedDosage($drug)
    {
        // This would typically come from a comprehensive drug database
        // For now, return generic dosage based on form
        $dosagePatterns = [
            'tablet' => "1-2 tablets as directed by physician",
            'capsule' => "1 capsule as directed by physician", 
            'syrup' => "5-10ml as directed by physician",
            'injection' => "As prescribed by physician",
            'cream' => "Apply thin layer to affected area",
            'ointment' => "Apply to affected area as directed",
            'drops' => "1-2 drops as directed",
            'inhaler' => "1-2 puffs as needed"
        ];

        return $dosagePatterns[strtolower($drug->form)] ?? "As directed by physician";
    }

    /**
     * Get stock status
     */
    private function getStockStatus($drug)
    {
        if ($drug->stock_quantity <= 0) {
            return 'out_of_stock';
        } elseif ($drug->stock_quantity <= $drug->reorder_level) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }
}