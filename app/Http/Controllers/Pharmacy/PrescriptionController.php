<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Dispensation;
use App\Models\PharmacyStock;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PrescriptionController extends Controller
{
    /**
     * List pending or active prescriptions
     */
    public function index()
    {
        $prescriptions = Prescription::with(['patient', 'physician'])
            ->whereIn('status', ['pending', 'verified', 'dispensed'])
            ->orderByDesc('id')
            ->paginate(25);

        return Inertia::render('Pharmacist/Prescriptions', [
            'prescriptions' => $prescriptions,
        ]);
    }

    /**
     * View prescription details
     */
    public function show($id)
    {
        $prescription = Prescription::with(['physician', 'patient'])->findOrFail($id);
        
        // Ensure we have proper physician data
        if (!$prescription->physician && $prescription->physician_id) {
            // Try to find physician by physician_code
            $physician = \App\Models\Physician::where('physician_code', $prescription->physician_id)->first();
            if ($physician) {
                $prescription->setRelation('physician', $physician);
            }
        }
        
        // Convert single prescription record to items format for frontend compatibility
        $items = [];
        if ($prescription->drug_name) {
            $items[] = [
                'id' => $prescription->id, // Use prescription ID as item ID for now
                'drug_id' => null, // We don't have a drug_id in current structure
                'dose' => $prescription->dosage,
                'frequency' => $prescription->frequency,
                'duration' => $prescription->duration ? $prescription->duration . ' days' : null,
                'quantity' => $prescription->quantity ?? 1,
                'instructions' => null,
                'drug' => [
                    'generic_name' => $prescription->drug_name,
                    'brand_name' => null,
                    'strength' => $prescription->dosage,
                ]
            ];
        }
        
        // Add items to prescription object
        $prescription->items = collect($items);
        
        return Inertia::render('Pharmacist/PrescriptionDetails', [
            'prescription' => $prescription,
        ]);
    }

    /**
     * Verify prescription before dispensing
     */
    public function verify($id)
    {
        $prescription = Prescription::findOrFail($id);
        $prescription->update(['status' => 'verified']);

        return redirect()->back()->with('success', 'Prescription verified successfully.');
    }

    /**
     * Dispense drugs for a given prescription item
     */
    public function dispense(Request $request, $itemId)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'batch_no' => 'nullable|string',
        ]);

        DB::transaction(function () use ($itemId, $validated) {
            $item = PrescriptionItem::findOrFail($itemId);

            // Record dispensation
            Dispensation::create([
                'prescription_id' => $item->prescription_id,
                'dispensed_by' => auth()->id(),
                'quantity_dispensed' => $validated['quantity'],
                'batch_no' => $validated['batch_no'] ?? null,
                'dispensed_at' => Carbon::now(),
            ]);

            // Reduce stock
            PharmacyStock::where('drug_id', $item->drug_id)
                ->orderBy('expiry_date')
                ->limit(1)
                ->decrement('quantity', $validated['quantity']);

            // Update item quantity (reduce by dispensed amount)
            $remainingQuantity = $item->quantity - $validated['quantity'];
            $item->update(['quantity' => $remainingQuantity]);
            
            // If all items are fully dispensed, mark prescription as dispensed
            $allItemsDispensed = $item->prescription->items()
                ->where('quantity', '>', 0)
                ->count() === 0;
                
            if ($allItemsDispensed) {
                $item->prescription->update(['status' => 'dispensed']);
            }
        });

        return redirect()->back()->with('success', 'Drug dispensed successfully.');
    }

    /**
     * Dispense medication for a single prescription record (not items-based)
     */
    public function dispensePrescription(Request $request, $id)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'batch_no' => 'nullable|string',
        ]);

        DB::transaction(function () use ($id, $validated) {
            $prescription = Prescription::findOrFail($id);

            // Record dispensation
            Dispensation::create([
                'prescription_id' => $prescription->id,
                'dispensed_by' => auth()->id(),
                'quantity_dispensed' => $validated['quantity'],
                'batch_no' => $validated['batch_no'] ?? null,
                'dispensed_at' => Carbon::now(),
            ]);

            // Update prescription status to dispensed
            $prescription->update(['status' => 'dispensed']);
        });

        return redirect()->back()->with('success', 'Prescription dispensed successfully.');
    }

    /**
     * Handle returned drugs (reversal)
     */
    public function returnItem(Request $request, $dispenseId)
    {
        $dispense = Dispensation::with('prescription.items')->findOrFail($dispenseId);
        
        // Find the prescription item that was dispensed (this is a simplified approach)
        // In a real system, you'd want to track which specific item was dispensed
        $prescriptionItem = $dispense->prescription->items->first();
        
        if ($prescriptionItem) {
            PharmacyStock::where('drug_id', $prescriptionItem->drug_id)
                ->increment('quantity', $dispense->quantity_dispensed);
                
            // Restore the item quantity
            $prescriptionItem->increment('quantity', $dispense->quantity_dispensed);
        }

        $dispense->delete();

        return redirect()->back()->with('success', 'Dispensed item successfully returned to stock.');
    }

    /**
     * Add notes to prescription
     */
    public function addNotes(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $prescription = Prescription::findOrFail($id);
        $currentNotes = $prescription->notes ?? '';
        $newNotes = $currentNotes . "\n[" . now()->format('Y-m-d H:i') . " - " . auth()->user()->name . "]: " . $validated['notes'];
        
        $prescription->update(['notes' => trim($newNotes)]);

        return redirect()->back()->with('success', 'Notes added successfully.');
    }
}
