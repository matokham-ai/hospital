<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Pharmacy\{
    PharmacyController,
    PrescriptionController,
    InventoryController
};

// 💊 Pharmacy — Inertia pages + sessioned actions
Route::middleware('auth')->prefix('pharmacy')->name('pharmacy.')->group(function () {
    // Dashboard & Formulary
    Route::get('/dashboard', [PharmacyController::class, 'index'])->name('dashboard');
    Route::get('/', [PharmacyController::class, 'index'])->name('index');
    Route::get('/formulary', [PharmacyController::class, 'formulary'])->name('formulary');
    Route::get('/drugs/create', [PharmacyController::class, 'createDrug'])->name('drugs.create');
    Route::post('/drugs', [PharmacyController::class, 'storeDrug'])->name('drugs.store');
    
    // Test route to verify Inertia is working
    Route::get('/test-wizard', function() {
        return \Inertia\Inertia::render('Pharmacist/DrugWizard', [
            'manufacturers' => [],
            'atcCodes' => [],
        ]);
    })->name('test.wizard');
    Route::get('/substitutes/{id}', [PharmacyController::class, 'substitutes'])->name('substitutes');
    Route::post('/interaction', [PharmacyController::class, 'checkInteraction'])->name('interaction');

    // Prescriptions
    Route::get('/prescriptions', [PrescriptionController::class, 'index'])->name('prescriptions');
    Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show'])->name('prescriptions.show');
    Route::post('/prescriptions/{id}/verify', [PrescriptionController::class, 'verify'])->name('prescriptions.verify');
    Route::post('/prescriptions/{id}/notes', [PrescriptionController::class, 'addNotes'])->name('prescriptions.notes');
    Route::post('/prescriptions/item/{itemId}/dispense', [PrescriptionController::class, 'dispense'])->name('dispense');
    Route::post('/prescriptions/{id}/dispense', [PrescriptionController::class, 'dispensePrescription'])->name('prescriptions.dispense');
    Route::post('/dispensations/{dispenseId}/return', [PrescriptionController::class, 'returnItem'])->name('return');

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::put('/inventory/{stock}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory/{stock}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
    Route::get('/inventory/drugs', [InventoryController::class, 'getDrugs'])->name('inventory.drugs');
    Route::get('/inventory/stores', [InventoryController::class, 'getStores'])->name('inventory.stores');

    // GRN
    Route::get('/grn', [InventoryController::class, 'grnIndex'])->name('grn.index');
    Route::get('/grn/create', [InventoryController::class, 'grnCreate'])->name('grn.create');
    Route::post('/grn', [InventoryController::class, 'storeGrn'])->name('grn.store');
    Route::get('/grn/{grn}', [InventoryController::class, 'grnShow'])->name('grn.show');

    // Movements
    Route::get('/inventory/movements', [InventoryController::class, 'movements'])->name('movements');

    // Reports
    Route::get('/reports', [PharmacyController::class, 'reports'])->name('reports');
    Route::get('/reports/dispensing', [PharmacyController::class, 'dispensingReport'])->name('reports.dispensing');
    Route::get('/reports/stock', [PharmacyController::class, 'stockReport'])->name('reports.stock');
    Route::get('/reports/expiry', [PharmacyController::class, 'expiryReport'])->name('reports.expiry');
});
