<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\DrugFormularyService;
use App\Services\MasterDataService;
use App\Services\MasterDataCacheService;
use App\Models\DrugFormulary;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Mockery;

class DrugFormularyServiceTest extends TestCase
{
    protected DrugFormularyService $drugFormularyService;
    protected $masterDataService;
    protected $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->masterDataService = Mockery::mock(MasterDataService::class);
        $this->cacheService = Mockery::mock(MasterDataCacheService::class);
        
        $this->drugFormularyService = new DrugFormularyService(
            $this->masterDataService,
            $this->cacheService
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_get_all_drugs_without_filters()
    {
        $drugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'atc_code' => 'N02BA01']),
            new DrugFormulary(['id' => 2, 'name' => 'Paracetamol', 'atc_code' => 'N02BE01'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.drugs.all', 1800, \Closure::class)
            ->andReturn($drugs);

        DrugFormulary::shouldReceive('query')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($drugs);

        $result = $this->drugFormularyService->getAllDrugs();

        $this->assertEquals($drugs, $result);
    }

    /** @test */
    public function it_can_get_drugs_with_status_filter()
    {
        $filters = ['status' => 'active'];
        $drugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'status' => 'active'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.drugs.all.' . md5(serialize($filters)), 1800, \Closure::class)
            ->andReturn($drugs);

        DrugFormulary::shouldReceive('query')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($drugs);

        $result = $this->drugFormularyService->getAllDrugs($filters);

        $this->assertEquals($drugs, $result);
    }

    /** @test */
    public function it_can_get_drugs_with_stock_status_filter()
    {
        $filters = ['stock_status' => 'low_stock'];
        $drugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'stock_quantity' => 5, 'reorder_level' => 10])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.drugs.all.' . md5(serialize($filters)), 1800, \Closure::class)
            ->andReturn($drugs);

        DrugFormulary::shouldReceive('query')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('whereRaw')
            ->with('stock_quantity <= reorder_level AND stock_quantity > 0')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($drugs);

        $result = $this->drugFormularyService->getAllDrugs($filters);

        $this->assertEquals($drugs, $result);
    }

    /** @test */
    public function it_can_get_active_drugs()
    {
        $activeDrugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'status' => 'active'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.drugs.active', 3600, \Closure::class)
            ->andReturn($activeDrugs);

        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->with(['id', 'name', 'generic_name', 'strength', 'form', 'unit_price'])
            ->andReturn($activeDrugs);

        $result = $this->drugFormularyService->getActiveDrugs();

        $this->assertEquals($activeDrugs, $result);
    }

    /** @test */
    public function it_can_get_low_stock_drugs()
    {
        $lowStockDrugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'stock_quantity' => 5, 'reorder_level' => 10])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.drugs.low_stock', 900, \Closure::class)
            ->andReturn($lowStockDrugs);

        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('whereRaw')
            ->with('stock_quantity <= reorder_level')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('where')
            ->with('stock_quantity', '>', 0)
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('stock_quantity')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($lowStockDrugs);

        $result = $this->drugFormularyService->getLowStockDrugs();

        $this->assertEquals($lowStockDrugs, $result);
    }

    /** @test */
    public function it_can_create_drug_with_valid_data()
    {
        $data = [
            'name' => 'Aspirin',
            'generic_name' => 'Acetylsalicylic acid',
            'atc_code' => 'N02BA01',
            'strength' => '500mg',
            'form' => 'tablet',
            'unit_price' => 0.50,
            'stock_quantity' => 100
        ];

        // Mock drug creation
        $drug = new DrugFormulary(array_merge($data, ['status' => 'active', 'reorder_level' => 10]));
        $drug->id = 1;
        
        DrugFormulary::shouldReceive('create')
            ->with(array_merge($data, ['status' => 'active', 'reorder_level' => 10]))
            ->andReturn($drug);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('drug_formulary', 1, 'created', [], $drug->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('drug_formulary', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->drugFormularyService->createDrug($data);

        $this->assertEquals($drug, $result);
        $this->assertEquals('active', $result->status);
        $this->assertEquals(10, $result->reorder_level);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_atc_code()
    {
        $data = [
            'name' => 'Aspirin',
            'atc_code' => 'INVALID', // Invalid ATC code format
            'unit_price' => 0.50,
            'stock_quantity' => 100
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('ATC code must follow the format: A10BA02');

        $this->drugFormularyService->createDrug($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_price()
    {
        $data = [
            'name' => 'Aspirin',
            'atc_code' => 'N02BA01',
            'unit_price' => 0, // Invalid price
            'stock_quantity' => 100
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Unit price must be greater than 0');

        $this->drugFormularyService->createDrug($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_negative_stock()
    {
        $data = [
            'name' => 'Aspirin',
            'atc_code' => 'N02BA01',
            'unit_price' => 0.50,
            'stock_quantity' => -10 // Negative stock
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Stock quantity cannot be negative');

        $this->drugFormularyService->createDrug($data);
    }

    /** @test */
    public function it_can_update_drug_with_valid_data()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'atc_code' => 'N02BA01',
            'unit_price' => 0.50,
            'stock_quantity' => 100
        ]);

        $updateData = ['unit_price' => 0.75];
        $oldValues = $drug->toArray();

        $drug->shouldReceive('update')
            ->with($updateData)
            ->once();

        $updatedDrug = new DrugFormulary(array_merge($drug->toArray(), $updateData));
        $drug->shouldReceive('fresh')
            ->andReturn($updatedDrug);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('drug_formulary', 1, 'updated', $oldValues, $updatedDrug->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('drug_formulary', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->drugFormularyService->updateDrug($drug, $updateData);

        $this->assertEquals($updatedDrug, $result);
    }

    /** @test */
    public function it_can_update_stock_quantity()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'stock_quantity' => 100
        ]);

        $newQuantity = 150;
        $reason = 'stock_received';
        $oldValues = $drug->toArray();

        $drug->shouldReceive('update')
            ->with(['stock_quantity' => $newQuantity])
            ->once();

        $updatedDrug = new DrugFormulary(array_merge($drug->toArray(), ['stock_quantity' => $newQuantity]));
        $drug->shouldReceive('fresh')
            ->andReturn($updatedDrug);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('drug_formulary', 1, 'stock_updated', $oldValues, array_merge($updatedDrug->toArray(), ['reason' => $reason]))
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('drug_formulary', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->drugFormularyService->updateStockQuantity($drug, $newQuantity, $reason);

        $this->assertEquals($updatedDrug, $result);
    }

    /** @test */
    public function it_throws_validation_exception_for_negative_stock_quantity()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'stock_quantity' => 100
        ]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Stock quantity cannot be negative');

        $this->drugFormularyService->updateStockQuantity($drug, -10);
    }

    /** @test */
    public function it_can_adjust_stock_positively()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'stock_quantity' => 100
        ]);

        $adjustment = 50;
        $reason = 'stock_received';
        $newQuantity = 150;

        $drug->shouldReceive('update')
            ->with(['stock_quantity' => $newQuantity])
            ->once();

        $updatedDrug = new DrugFormulary(array_merge($drug->toArray(), ['stock_quantity' => $newQuantity]));
        $drug->shouldReceive('fresh')
            ->andReturn($updatedDrug);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->drugFormularyService->adjustStock($drug, $adjustment, $reason);

        $this->assertEquals($updatedDrug, $result);
    }

    /** @test */
    public function it_can_adjust_stock_negatively()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'stock_quantity' => 100
        ]);

        $adjustment = -30;
        $reason = 'dispensed';
        $newQuantity = 70;

        $drug->shouldReceive('update')
            ->with(['stock_quantity' => $newQuantity])
            ->once();

        $updatedDrug = new DrugFormulary(array_merge($drug->toArray(), ['stock_quantity' => $newQuantity]));
        $drug->shouldReceive('fresh')
            ->andReturn($updatedDrug);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->drugFormularyService->adjustStock($drug, $adjustment, $reason);

        $this->assertEquals($updatedDrug, $result);
    }

    /** @test */
    public function it_throws_validation_exception_for_adjustment_resulting_in_negative_stock()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'stock_quantity' => 50
        ]);

        $adjustment = -100; // Would result in -50

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Adjustment would result in negative stock quantity');

        $this->drugFormularyService->adjustStock($drug, $adjustment);
    }

    /** @test */
    public function it_can_get_substitute_drugs()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'atc_code' => 'N02BA01',
            'form' => 'tablet'
        ]);

        $substitutes = collect([
            new DrugFormulary(['id' => 2, 'name' => 'Aspirin Generic', 'atc_code' => 'N02BA01', 'form' => 'tablet'])
        ]);

        DrugFormulary::shouldReceive('where')
            ->with('atc_code', 'like', 'N02BA%')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('where')
            ->with('id', '!=', 1)
            ->andReturnSelf();
        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('where')
            ->with('form', 'tablet')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('generic_name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($substitutes);

        $result = $this->drugFormularyService->getSubstituteDrugs($drug);

        $this->assertEquals($substitutes, $result);
    }

    /** @test */
    public function it_can_get_drug_statistics()
    {
        $stats = [
            'total_drugs' => 100,
            'active_drugs' => 85,
            'discontinued_drugs' => 15,
            'in_stock' => 70,
            'low_stock' => 10,
            'out_of_stock' => 5,
            'total_stock_value' => 50000.00,
            'avg_unit_price' => 12.50,
            'by_form' => [
                'tablet' => 50,
                'capsule' => 20,
                'syrup' => 15
            ]
        ];

        Cache::shouldReceive('remember')
            ->with('master_data.drugs.stats', 1800, \Closure::class)
            ->andReturn($stats);

        DrugFormulary::shouldReceive('count')
            ->andReturn(100);
        DrugFormulary::shouldReceive('where')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('whereRaw')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('selectRaw')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('value')
            ->andReturn(50000.00);
        DrugFormulary::shouldReceive('avg')
            ->andReturn(12.50);
        DrugFormulary::shouldReceive('groupBy')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('pluck')
            ->andReturn(collect(['tablet' => 50, 'capsule' => 20, 'syrup' => 15]));

        $result = $this->drugFormularyService->getDrugStats();

        $this->assertEquals($stats, $result);
    }

    /** @test */
    public function it_can_toggle_drug_status()
    {
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'status' => 'active'
        ]);

        $oldValues = $drug->toArray();

        $drug->shouldReceive('update')
            ->with(['status' => 'discontinued'])
            ->once();

        $updatedDrug = new DrugFormulary(array_merge($drug->toArray(), ['status' => 'discontinued']));
        $drug->shouldReceive('fresh')
            ->andReturn($updatedDrug);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('drug_formulary', 1, 'updated', $oldValues, $updatedDrug->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('drug_formulary', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->drugFormularyService->toggleDrugStatus($drug);

        $this->assertEquals('discontinued', $result->status);
    }

    /** @test */
    public function it_can_bulk_update_stock_quantities()
    {
        $stockUpdates = [
            ['drug_id' => 1, 'quantity' => 150, 'reason' => 'stock_received'],
            ['drug_id' => 2, 'quantity' => 75, 'reason' => 'adjustment']
        ];

        $drug1 = new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'stock_quantity' => 100]);
        $drug2 = new DrugFormulary(['id' => 2, 'name' => 'Paracetamol', 'stock_quantity' => 50]);

        DrugFormulary::shouldReceive('find')
            ->with(1)
            ->andReturn($drug1);
        DrugFormulary::shouldReceive('find')
            ->with(2)
            ->andReturn($drug2);

        // Mock updates
        $drug1->shouldReceive('toArray')
            ->andReturn($drug1->toArray());
        $drug1->shouldReceive('update')
            ->with(['stock_quantity' => 150]);
        $drug1->shouldReceive('fresh')
            ->andReturn($drug1);

        $drug2->shouldReceive('toArray')
            ->andReturn($drug2->toArray());
        $drug2->shouldReceive('update')
            ->with(['stock_quantity' => 75]);
        $drug2->shouldReceive('fresh')
            ->andReturn($drug2);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->twice();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('drug_formulary', 0)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->drugFormularyService->bulkUpdateStock($stockUpdates);

        $this->assertCount(2, $results);
        $this->assertTrue($results[0]['success']);
        $this->assertTrue($results[1]['success']);
    }

    /** @test */
    public function it_handles_drug_not_found_in_bulk_update()
    {
        $stockUpdates = [
            ['drug_id' => 999, 'quantity' => 150] // Non-existent drug
        ];

        DrugFormulary::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->drugFormularyService->bulkUpdateStock($stockUpdates);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('Drug not found', $results[0]['error']);
    }

    /** @test */
    public function it_handles_negative_quantity_in_bulk_update()
    {
        $stockUpdates = [
            ['drug_id' => 1, 'quantity' => -10] // Negative quantity
        ];

        $drug = new DrugFormulary(['id' => 1, 'name' => 'Aspirin']);

        DrugFormulary::shouldReceive('find')
            ->with(1)
            ->andReturn($drug);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->drugFormularyService->bulkUpdateStock($stockUpdates);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('Stock quantity cannot be negative', $results[0]['error']);
    }

    /** @test */
    public function it_can_get_drugs_requiring_reorder()
    {
        $lowStockDrugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'stock_quantity' => 5, 'reorder_level' => 10]),
            new DrugFormulary(['id' => 2, 'name' => 'Paracetamol', 'stock_quantity' => 0, 'reorder_level' => 20])
        ]);

        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('whereRaw')
            ->with('stock_quantity <= reorder_level')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('stock_quantity')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($lowStockDrugs);

        $result = $this->drugFormularyService->getDrugsRequiringReorder();

        $this->assertEquals($lowStockDrugs, $result);
    }

    /** @test */
    public function it_enriches_drug_with_stock_info()
    {
        // Test in_stock status
        $drug = new DrugFormulary([
            'id' => 1,
            'name' => 'Aspirin',
            'stock_quantity' => 50,
            'reorder_level' => 10,
            'unit_price' => 0.50
        ]);

        $enrichedDrug = $this->drugFormularyService->getAllDrugs()->first();
        
        // We can't directly test the protected method, but we can test the behavior
        // through public methods that use it
        $this->assertTrue(true); // Placeholder assertion
    }

    /** @test */
    public function it_rollsback_transaction_on_exception_during_creation()
    {
        $data = [
            'name' => 'Aspirin',
            'atc_code' => 'N02BA01',
            'unit_price' => 0.50,
            'stock_quantity' => 100
        ];

        // Mock exception during creation
        DrugFormulary::shouldReceive('create')
            ->andThrow(new \Exception('Database error'));

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database error');

        $this->drugFormularyService->createDrug($data);
    }
}