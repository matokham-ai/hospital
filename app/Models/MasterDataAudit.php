<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterDataAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'entity_type', 'entity_id', 'action', 'old_values', 'new_values',
        'user_id', 'ip_address', 'user_agent'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'action' => 'string',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeForEntity($query, $entityType, $entityId)
    {
        return $query->where('entity_type', $entityType)
                    ->where('entity_id', $entityId);
    }

    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Validation rules
    public static function validationRules()
    {
        return [
            'entity_type' => 'required|string|in:departments,wards,beds,test_catalogs,drug_formulary',
            'entity_id' => 'required|string',
            'action' => 'required|in:created,updated,deleted,status_changed',
            'old_values' => 'nullable|array',
            'new_values' => 'nullable|array',
            'user_id' => 'required|exists:users,id',
            'ip_address' => 'nullable|ip',
            'user_agent' => 'nullable|string',
        ];
    }

    // Helper methods
    public function getChangedFields()
    {
        if (!$this->old_values || !$this->new_values) {
            return [];
        }

        $changed = [];
        foreach ($this->new_values as $field => $newValue) {
            $oldValue = $this->old_values[$field] ?? null;
            if ($oldValue !== $newValue) {
                $changed[$field] = [
                    'old' => $oldValue,
                    'new' => $newValue
                ];
            }
        }

        return $changed;
    }

    public function getFormattedAction()
    {
        return match($this->action) {
            'created' => 'Created',
            'updated' => 'Updated',
            'deleted' => 'Deleted',
            'status_changed' => 'Status Changed',
            default => ucfirst($this->action)
        };
    }

    // Static methods for creating audit logs
    public static function logCreate($entityType, $entityId, $newValues, $userId, $request = null)
    {
        return static::create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => 'created',
            'new_values' => $newValues,
            'user_id' => $userId,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    public static function logUpdate($entityType, $entityId, $oldValues, $newValues, $userId, $request = null)
    {
        return static::create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => 'updated',
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'user_id' => $userId,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    public static function logDelete($entityType, $entityId, $oldValues, $userId, $request = null)
    {
        return static::create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => 'deleted',
            'old_values' => $oldValues,
            'user_id' => $userId,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}
