<?php

namespace App\Observers;

use App\Services\MasterDataCacheService;
use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use Illuminate\Database\Eloquent\Model;

class MasterDataCacheObserver
{
    protected MasterDataCacheService $cacheService;

    public function __construct(MasterDataCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        $this->invalidateModelCaches($model);
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        $this->invalidateModelCaches($model);
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $this->invalidateModelCaches($model);
    }

    /**
     * Invalidate caches based on model type
     */
    protected function invalidateModelCaches(Model $model): void
    {
        switch (get_class($model)) {
            case Department::class:
                $this->cacheService->invalidateDepartmentCaches($model->deptid);
                break;
                
            case Ward::class:
                $this->cacheService->invalidateWardBedCaches($model->id);
                break;
                
            case Bed::class:
                $this->cacheService->invalidateWardBedCaches($model->ward_id);
                break;
                
            case TestCatalog::class:
                $this->cacheService->invalidateTestCatalogCaches(
                    $model->id, 
                    $model->category ?? null
                );
                break;
                
            case DrugFormulary::class:
                $this->cacheService->invalidateDrugFormularyCaches(
                    $model->id, 
                    $model->atc_code ?? null
                );
                break;
        }
    }
}