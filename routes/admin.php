<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\WardController;
use App\Http\Controllers\TestCatalogController;
use App\Http\Controllers\DrugFormularyController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserSettingsController;
use App\Http\Controllers\Admin\SystemSettingsController;

/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
|
| Here are the API routes for the admin master data management system.
| These routes are protected by authentication and role-based permissions.
|
*/

Route::middleware(['auth', 'admin.access', 'master-data-errors'])->prefix('admin')->name('admin.')->group(function () {
    
    // Admin Dashboard Routes
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard')->middleware('can:view admin dashboard');
    Route::get('/dashboard/stats', [AdminController::class, 'getMasterDataStats'])->name('dashboard.stats')->middleware('can:view admin dashboard');
    Route::get('/dashboard/activity', [AdminController::class, 'getRecentActivity'])->name('dashboard.activity')->middleware('can:view admin dashboard');
    Route::get('/audit-stats', [AdminController::class, 'getAuditStats'])->name('audit-stats')->middleware('can:view admin dashboard');
    Route::get('/export-audit-data', [AdminController::class, 'exportAuditData'])->name('export-audit-data')->middleware('can:export master data');
    Route::get('/navigation-state', [AdminController::class, 'getNavigationState'])->name('navigation.state')->middleware('can:view admin dashboard');

    // Audit and Activity Tracking Routes
    Route::prefix('audit')->name('audit.')->group(function () {
        Route::get('/', [AdminController::class, 'auditLog'])->name('index')->middleware('can:view audit logs');
        Route::get('/activity', [AdminController::class, 'getRecentActivity'])->name('activity')->middleware('can:view audit logs');
        Route::get('/stats', [AdminController::class, 'getAuditStats'])->name('stats')->middleware('can:view audit logs');
        Route::get('/export', [AdminController::class, 'exportAuditData'])->name('export')->middleware('can:export master data');
        Route::get('/entity/{entityType}/{entityId}/history', [AdminController::class, 'getEntityAuditHistory'])->name('entity.history')->middleware('can:view audit logs');
        Route::get('/user/{userId}/summary', [AdminController::class, 'getUserActivitySummary'])->name('user.summary')->middleware('can:view audit logs');
    });

    // Master Data Unified CRUD Routes
    Route::prefix('master-data')->name('master-data.')->group(function () {
        Route::get('/{type}', [MasterDataController::class, 'index'])->name('index')->middleware('can:view admin dashboard');
        Route::post('/{type}', [MasterDataController::class, 'store'])->name('store')->middleware('can:bulk update master data');
        Route::put('/{type}/{id}', [MasterDataController::class, 'update'])->name('update')->middleware('can:bulk update master data');
        Route::delete('/{type}/{id}', [MasterDataController::class, 'destroy'])->name('destroy')->middleware('can:bulk update master data');
        Route::post('/{type}/bulk-update', [MasterDataController::class, 'bulkUpdate'])->name('bulk-update')->middleware('can:bulk update master data');
        Route::get('/{type}/export', [MasterDataController::class, 'export'])->name('export')->middleware('can:export master data');
    });

    // Branch Management Routes
    Route::prefix('branches')->name('branches.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\BranchController::class, 'index'])->name('index')->middleware('can:view admin dashboard');
        Route::get('/{branch}/dashboard', [\App\Http\Controllers\Admin\BranchController::class, 'dashboard'])->name('dashboard')->middleware('can:view admin dashboard');
        Route::post('/', [\App\Http\Controllers\Admin\BranchController::class, 'store'])->name('store')->middleware('can:bulk update master data');
        Route::put('/{branch}', [\App\Http\Controllers\Admin\BranchController::class, 'update'])->name('update')->middleware('can:bulk update master data');
        Route::delete('/{branch}', [\App\Http\Controllers\Admin\BranchController::class, 'destroy'])->name('destroy')->middleware('can:bulk update master data');
        Route::patch('/{branch}/toggle-status', [\App\Http\Controllers\Admin\BranchController::class, 'toggleStatus'])->name('toggle-status')->middleware('can:bulk update master data');
    });

    // Department Management Routes
    Route::prefix('departments')->name('departments.')->group(function () {
        Route::get('/', [DepartmentController::class, 'index'])->name('index')->middleware('can:view departments');
        Route::post('/', [DepartmentController::class, 'store'])->name('store')->middleware('can:create departments');
        
        // Static routes must come before parameterized routes
        Route::post('/reorder', [DepartmentController::class, 'reorder'])->name('reorder')->middleware('can:edit departments');
        Route::get('/options/list', [DepartmentController::class, 'options'])->name('options')->middleware('can:view departments');
        Route::post('/import/csv', [DepartmentController::class, 'import'])->name('import')->middleware('can:import master data');
        Route::get('/export', [DepartmentController::class, 'export'])->name('export')->middleware('can:export master data');
        
        // Parameterized routes come after static routes
        Route::get('/{department}', [DepartmentController::class, 'show'])->name('show')->middleware('can:view departments');
        Route::put('/{department}', [DepartmentController::class, 'update'])->name('update')->middleware('can:edit departments');
        Route::delete('/{department}', [DepartmentController::class, 'destroy'])->name('destroy')->middleware('can:delete departments');
        Route::patch('/{department}/toggle-status', [DepartmentController::class, 'toggleStatus'])->name('toggle-status')->middleware('can:toggle department status');
        Route::get('/{department}/references', [DepartmentController::class, 'checkReferences'])->name('references')->middleware('can:view departments');
    });

    // Ward and Bed Management Routes
    Route::prefix('wards')->name('wards.')->group(function () {
        Route::get('/', [WardController::class, 'index'])->name('index')->middleware('can:view wards');
        Route::post('/', [WardController::class, 'store'])->name('store')->middleware('can:create wards');
        
        // Static routes must come before parameterized routes
        Route::get('/matrix/data', [WardController::class, 'getWardsWithBeds'])->name('matrix.data')->middleware('can:view beds');
        Route::get('/occupancy/matrix', [WardController::class, 'getOccupancyMatrix'])->name('occupancy.matrix')->middleware('can:view bed occupancy');
        Route::get('/options/list', [WardController::class, 'options'])->name('options')->middleware('can:view wards');
        Route::get('/export', [WardController::class, 'export'])->name('export')->middleware('can:export master data');
        
        // Parameterized routes come after static routes
        Route::get('/{ward}', [WardController::class, 'show'])->name('show')->middleware('can:view wards');
        Route::put('/{ward}', [WardController::class, 'update'])->name('update')->middleware('can:edit wards');
        Route::delete('/{ward}', [WardController::class, 'destroy'])->name('destroy')->middleware('can:delete wards');
        Route::get('/{ward}/occupancy/stats', [WardController::class, 'getOccupancyStats'])->name('occupancy.stats')->middleware('can:view bed occupancy');
        Route::post('/{ward}/beds/create', [WardController::class, 'createBeds'])->name('beds.create')->middleware('can:create beds');
    });

    // Bed Management Routes
    Route::prefix('beds')->name('beds.')->group(function () {
        Route::get('/{bed}/details', [WardController::class, 'getBedDetails'])->name('details')->middleware('can:view beds');
        Route::patch('/{bed}/status', [WardController::class, 'updateBedStatus'])->name('update-status')->middleware('can:update bed status');
        Route::post('/bulk-update', [WardController::class, 'bulkUpdateBeds'])->name('bulk-update')->middleware('can:edit beds');
        Route::get('/export', [WardController::class, 'exportBeds'])->name('export')->middleware('can:export master data');
    });

    // Test Catalog Management Routes
    Route::prefix('test-catalogs')->name('test-catalogs.')->group(function () {
        Route::get('/', [TestCatalogController::class, 'index'])->name('index');
        Route::post('/', [TestCatalogController::class, 'store'])->name('store')->middleware('can:create test catalogs');
        Route::put('/{testCatalog}', [TestCatalogController::class, 'update'])->name('update')->middleware('can:edit test catalogs');
        Route::delete('/{testCatalog}', [TestCatalogController::class, 'destroy'])->name('destroy')->middleware('can:delete test catalogs');
        Route::post('/bulk-update', [TestCatalogController::class, 'bulkUpdate'])->name('bulk-update')->middleware('can:edit test catalogs');
    });

    // Alternative route for tests (shorter URL)
    Route::prefix('tests')->name('tests.')->group(function () {
        Route::get('/', [TestCatalogController::class, 'index'])->name('index')->middleware('can:view test catalogs');
        Route::post('/', [TestCatalogController::class, 'store'])->name('store')->middleware('can:create test catalogs');
        Route::put('/{testCatalog}', [TestCatalogController::class, 'update'])->name('update')->middleware('can:edit test catalogs');
        Route::delete('/{testCatalog}', [TestCatalogController::class, 'destroy'])->name('destroy')->middleware('can:delete test catalogs');
        Route::post('/bulk-update', [TestCatalogController::class, 'bulkUpdate'])->name('bulk-update')->middleware('can:edit test catalogs');
    });



    // Physician Management Routes
    Route::prefix('physicians')->name('physicians.')->group(function () {
        Route::get('/', [\App\Http\Controllers\PhysicianController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\PhysicianController::class, 'store'])->name('store');
        Route::put('/{code}', [\App\Http\Controllers\PhysicianController::class, 'update'])->name('update');
        Route::delete('/{code}', [\App\Http\Controllers\PhysicianController::class, 'destroy'])->name('destroy');
        Route::post('/{code}/restore', [\App\Http\Controllers\PhysicianController::class, 'restore'])->name('restore');
        Route::delete('/{code}/force', [\App\Http\Controllers\PhysicianController::class, 'forceDestroy'])->name('force-destroy');
    });

    // Service Category Management Routes
    Route::prefix('categories')->name('categories.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\CategoryController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\Admin\CategoryController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\Admin\CategoryController::class, 'store'])->name('store');
        Route::post('/bulk-update-prices', [\App\Http\Controllers\Admin\CategoryController::class, 'bulkUpdatePrices'])->name('bulk-update-prices');
        Route::patch('/{category}/update-card', [\App\Http\Controllers\Admin\CategoryController::class, 'updateCategoryCard'])->name('update-card');
        Route::patch('/{category}/update-department', [\App\Http\Controllers\Admin\CategoryController::class, 'updateDepartment'])->name('update-department');
        Route::patch('/{category}/toggle-status', [\App\Http\Controllers\Admin\CategoryController::class, 'toggleStatus'])->name('toggle-status');
        Route::get('/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'show'])->name('show');
        Route::get('/{category}/edit', [\App\Http\Controllers\Admin\CategoryController::class, 'edit'])->name('edit');
        Route::put('/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'update'])->name('update');
        Route::delete('/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'destroy'])->name('destroy');
    });

    // Drug Formulary Management Routes
    Route::prefix('drug-formulary')->name('drug-formulary.')->group(function () {
        Route::get('/', [DrugFormularyController::class, 'index'])->name('index');
        Route::post('/', [DrugFormularyController::class, 'store'])->name('store')->middleware('can:create drug formulary');
        
        // Static routes must come before parameterized routes
        Route::get('/forms/list', [DrugFormularyController::class, 'getForms'])->name('forms')->middleware('can:view drug formulary');
        Route::post('/bulk-update-stock', [DrugFormularyController::class, 'bulkUpdateStock'])->name('bulk-update-stock')->middleware('can:manage drug stock');
        Route::get('/low-stock/list', [DrugFormularyController::class, 'getLowStockDrugs'])->name('low-stock')->middleware('can:view drug formulary');
        Route::get('/statistics/data', [DrugFormularyController::class, 'getStatistics'])->name('statistics')->middleware('can:view drug formulary');
        Route::get('/search/advanced', [DrugFormularyController::class, 'search'])->name('search')->middleware('can:view drug formulary');
        Route::get('/options/list', [DrugFormularyController::class, 'options'])->name('options')->middleware('can:view drug formulary');
        Route::post('/import/csv', [DrugFormularyController::class, 'import'])->name('import')->middleware('can:import master data');
        Route::get('/export', [DrugFormularyController::class, 'export'])->name('export')->middleware('can:export master data');
        
        // Parameterized routes come after static routes
        Route::get('/{drugFormulary}', [DrugFormularyController::class, 'show'])->name('show')->middleware('can:view drug formulary');
        Route::put('/{drugFormulary}', [DrugFormularyController::class, 'update'])->name('update')->middleware('can:edit drug formulary');
        Route::delete('/{drugFormulary}', [DrugFormularyController::class, 'destroy'])->name('destroy')->middleware('can:delete drug formulary');
        Route::patch('/{drugFormulary}/stock', [DrugFormularyController::class, 'updateStock'])->name('update-stock')->middleware('can:manage drug stock');
        Route::get('/{drugFormulary}/substitutes', [DrugFormularyController::class, 'getSubstitutes'])->name('substitutes')->middleware('can:view drug substitutes');
        Route::post('/{drugFormulary}/substitutes', [DrugFormularyController::class, 'addSubstitute'])->name('add-substitute')->middleware('can:edit drug formulary');
        Route::delete('/{drugFormulary}/substitutes/{substitute}', [DrugFormularyController::class, 'removeSubstitute'])->name('remove-substitute')->middleware('can:edit drug formulary');
    });


    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserSettingsController::class, 'index'])->name('index');
        Route::post('/{user}/update', [UserSettingsController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserSettingsController::class, 'destroy'])->name('destroy');
    });
 
    // -----------------------------------------------------------------------------
    // REPORTS AND ANALYTICS ROUTES
    // -----------------------------------------------------------------------------
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ReportsController::class, 'index'])->name('index')->middleware('can:view admin dashboard');
        Route::post('/generate/{type}', [\App\Http\Controllers\ReportsController::class, 'generate'])->name('generate')->middleware('can:view admin dashboard');
    });

    // -----------------------------------------------------------------------------
    // ADMIN SYSTEM SETTINGS ROUTES
    // -----------------------------------------------------------------------------
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SystemSettingsController::class, 'index'])->name('index');
        Route::post('/', [SystemSettingsController::class, 'update'])->name('update');
    });

});

// Public API routes (with authentication but no role restriction)
Route::middleware(['auth'])->prefix('api')->name('api.')->group(function () {
    
    // Public master data options for dropdowns/selects
    Route::prefix('master-data')->name('master-data.')->group(function () {
        Route::get('/departments/options', [DepartmentController::class, 'options'])->name('departments.options');
        Route::get('/wards/options', [WardController::class, 'options'])->name('wards.options');
        Route::get('/test-catalogs/options', [TestCatalogController::class, 'options'])->name('test-catalogs.options');
        Route::get('/drug-formulary/options', [DrugFormularyController::class, 'options'])->name('drug-formulary.options');
    });





});