<?php

namespace App\Observers;

use App\Models\MasterDataAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class MasterDataAuditObserver
{
    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        $this->logAuditEvent($model, 'created', [], $model->getAttributes());
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        $original = $model->getOriginal();
        $changes = $model->getChanges();
        
        // Only log if there are actual changes
        if (!empty($changes)) {
            $this->logAuditEvent($model, 'updated', $original, $changes);
        }
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $this->logAuditEvent($model, 'deleted', $model->getAttributes(), []);
    }

    /**
     * Handle the model "restored" event.
     */
    public function restored(Model $model): void
    {
        $this->logAuditEvent($model, 'restored', [], $model->getAttributes());
    }

    /**
     * Log audit event for the model
     */
    protected function logAuditEvent(Model $model, string $action, array $oldValues, array $newValues): void
    {
        // Skip if this is already an audit model to prevent infinite loops
        if ($model instanceof MasterDataAudit) {
            return;
        }

        // Get entity type from model class
        $entityType = $this->getEntityTypeFromModel($model);
        
        // Skip if not a master data entity
        if (!$entityType) {
            return;
        }

        // Filter sensitive fields
        $oldValues = $this->filterSensitiveFields($oldValues);
        $newValues = $this->filterSensitiveFields($newValues);

        // Create audit record
        MasterDataAudit::create([
            'entity_type' => $entityType,
            'entity_id' => $model->getKey(),
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'user_id' => Auth::id() ?: null,
            'ip_address' => Request::ip() ?: '127.0.0.1',
            'user_agent' => Request::userAgent() ?: 'System',
        ]);
    }

    /**
     * Get entity type string from model class
     */
    protected function getEntityTypeFromModel(Model $model): ?string
    {
        $modelClass = get_class($model);
        
        return match ($modelClass) {
            'App\Models\Department' => 'departments',
            'App\Models\Ward' => 'wards',
            'App\Models\Bed' => 'beds',
            'App\Models\TestCatalog' => 'test_catalogs',
            'App\Models\DrugFormulary' => 'drug_formulary',
            default => null,
        };
    }

    /**
     * Filter out sensitive fields from audit data
     */
    protected function filterSensitiveFields(array $data): array
    {
        $sensitiveFields = [
            'password',
            'remember_token',
            'api_token',
            'created_at',
            'updated_at',
        ];

        return array_diff_key($data, array_flip($sensitiveFields));
    }

    /**
     * Check if audit logging is enabled for the model
     */
    protected function shouldAudit(Model $model): bool
    {
        // Check if model has audit disabled
        if (method_exists($model, 'isAuditEnabled')) {
            return $model->isAuditEnabled();
        }

        // Check if audit is globally disabled
        if (config('audit.enabled', true) === false) {
            return false;
        }

        return true;
    }
}