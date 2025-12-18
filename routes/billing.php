<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    BillingDashboardController,
    BillingController,
    InvoiceController,
    PaymentController,
    InsuranceController
};

// 💳 Billing
Route::middleware('auth')->prefix('billing')->name('billing.')->group(function () {
    Route::get('/dashboard', [BillingDashboardController::class, 'index'])->name('dashboard');
    Route::get('/quick-stats', [BillingDashboardController::class, 'getQuickStats'])->name('quick-stats');
    
    // Patient billing management
    Route::get('/patients', [BillingController::class, 'index'])->name('patients');
    Route::post('/create-account', [BillingController::class, 'createAccount'])->name('create-account');

    Route::get('/encounters/{encounter}', [BillingController::class, 'show'])->name('show');
    Route::post('/prescriptions/{prescription}/generate', [BillingController::class, 'generatePrescriptionBill'])->name('prescription.generate');
    Route::post('/encounters/{encounter}/items', [BillingController::class, 'addItem'])->name('add-item');
    
    // API endpoint for getting services by category
    Route::get('/services/by-category', [BillingController::class, 'getServicesByCategory'])->name('services.by-category');

    Route::post('/accounts/{billingAccount}/payment', [BillingController::class, 'processPayment'])->name('process-payment');
});

// 🧾 Invoices
Route::middleware('auth')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('web.invoices.index');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('web.invoices.show');
});

// 💰 Payments
Route::middleware('auth')->group(function () {
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
    Route::get('/payments/{payment}/receipt', [PaymentController::class, 'downloadReceipt'])->name('payments.receipt');
});

// 🛡 Insurance
Route::middleware('auth')->group(function () {
    Route::get('/insurance', [InsuranceController::class, 'index'])->name('insurance.index');
});

// 📊 Discount Reports
Route::middleware('auth')->prefix('reports')->name('reports.')->group(function () {
    Route::get('/discounts', [\App\Http\Controllers\DiscountReportController::class, 'index'])->name('discounts');
    Route::get('/discounts/export', [\App\Http\Controllers\DiscountReportController::class, 'export'])->name('discounts.export');
});
