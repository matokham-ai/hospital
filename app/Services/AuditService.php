<?php

namespace App\Services;

use App\Models\MasterDataAudit;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuditService
{
    /**
     * Get recent activity for dashboard display
     *
     * @param int $limit
     * @param array $filters
     * @return \Illuminate\Support\Collection
     */
    public function getRecentActivity(int $limit = 20, array $filters = []): \Illuminate\Support\Collection
    {
        try {
            $cacheKey = 'audit.recent_activity.' . md5(serialize($filters)) . ".{$limit}";
            
            return Cache::remember($cacheKey, 300, function () use ($limit, $filters) {
                $query = MasterDataAudit::with('user')
                    ->orderBy('created_at', 'desc');

                // Apply filters
                if (isset($filters['entity_type']) && !empty($filters['entity_type'])) {
                    $query->where('entity_type', $filters['entity_type']);
                }

                if (isset($filters['action']) && !empty($filters['action'])) {
                    $query->where('action', $filters['action']);
                }

                if (isset($filters['user_id']) && !empty($filters['user_id'])) {
                    $query->where('user_id', $filters['user_id']);
                }

                if (isset($filters['date_from']) && !empty($filters['date_from'])) {
                    $query->where('created_at', '>=', $filters['date_from']);
                }

                if (isset($filters['date_to']) && !empty($filters['date_to'])) {
                    $query->where('created_at', '<=', $filters['date_to']);
                }

                $results = $query->limit($limit)->get();
                
                return $results->map(function ($audit) {
                    return $this->formatAuditRecord($audit);
                });
            });
        } catch (\Exception $e) {
            \Log::error('Error in AuditService::getRecentActivity: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return collect([]); // Return empty collection on error
        }
    }

    /**
     * Get audit history for a specific entity
     *
     * @param string $entityType
     * @param int $entityId
     * @param int $limit
     * @return Collection
     */
    public function getEntityHistory(string $entityType, int $entityId, int $limit = 50): Collection
    {
        return MasterDataAudit::with('user')
            ->forEntity($entityType, $entityId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($audit) {
                return $this->formatAuditRecord($audit, true);
            });
    }

    /**
     * Get audit statistics for dashboard
     *
     * @param array $filters
     * @return array
     */
    public function getAuditStats(array $filters = []): array
    {
        $cacheKey = 'audit.stats.' . md5(serialize($filters));
        
        return Cache::remember($cacheKey, 1800, function () use ($filters) {
            $query = MasterDataAudit::query();

            // Apply date filters
            if (isset($filters['date_from'])) {
                $query->where('created_at', '>=', $filters['date_from']);
            } else {
                // Default to last 30 days
                $query->where('created_at', '>=', now()->subDays(30));
            }

            if (isset($filters['date_to'])) {
                $query->where('created_at', '<=', $filters['date_to']);
            }

            $baseQuery = clone $query;

            return [
                'total_changes' => $baseQuery->count(),
                'changes_by_action' => $this->getChangesByAction($query),
                'changes_by_entity' => $this->getChangesByEntity($query),
                'changes_by_user' => $this->getChangesByUser($query),
                'changes_by_day' => $this->getChangesByDay($query),
                'most_active_users' => $this->getMostActiveUsers($query),
                'most_changed_entities' => $this->getMostChangedEntities($query),
            ];
        });
    }

    /**
     * Get user activity summary
     *
     * @param int $userId
     * @param array $filters
     * @return array
     */
    public function getUserActivitySummary(int $userId, array $filters = []): array
    {
        $query = MasterDataAudit::where('user_id', $userId);

        // Apply date filters
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        } else {
            $query->where('created_at', '>=', now()->subDays(30));
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $baseQuery = clone $query;

        return [
            'total_actions' => $baseQuery->count(),
            'actions_by_type' => $query->select('action', DB::raw('count(*) as count'))
                                     ->groupBy('action')
                                     ->pluck('count', 'action')
                                     ->toArray(),
            'entities_modified' => $query->select('entity_type', DB::raw('count(*) as count'))
                                        ->groupBy('entity_type')
                                        ->pluck('count', 'entity_type')
                                        ->toArray(),
            'recent_activity' => $this->getRecentActivity(10, ['user_id' => $userId]),
            'first_activity' => $baseQuery->orderBy('created_at', 'asc')->first()?->created_at,
            'last_activity' => $baseQuery->orderBy('created_at', 'desc')->first()?->created_at,
        ];
    }

    /**
     * Export audit data for reporting
     *
     * @param array $filters
     * @return Collection
     */
    public function exportAuditData(array $filters = []): Collection
    {
        $query = MasterDataAudit::with('user');

        // Apply filters
        if (isset($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')
                    ->get()
                    ->map(function ($audit) {
                        return [
                            'id' => $audit->id,
                            'entity_type' => $audit->entity_type,
                            'entity_id' => $audit->entity_id,
                            'action' => $audit->action,
                            'user_name' => $audit->user->name ?? 'System',
                            'user_email' => $audit->user->email ?? '',
                            'changes' => $this->formatChanges($audit),
                            'ip_address' => $audit->ip_address,
                            'user_agent' => $audit->user_agent,
                            'created_at' => $audit->created_at->format('Y-m-d H:i:s'),
                        ];
                    });
    }

    /**
     * Clean up old audit records
     *
     * @param int $daysToKeep
     * @return int Number of records deleted
     */
    public function cleanupOldAudits(int $daysToKeep = 365): int
    {
        $cutoffDate = now()->subDays($daysToKeep);
        
        return MasterDataAudit::where('created_at', '<', $cutoffDate)->delete();
    }

    /**
     * Format audit record for display
     *
     * @param MasterDataAudit $audit
     * @param bool $includeDetails
     * @return array
     */
    protected function formatAuditRecord(MasterDataAudit $audit, bool $includeDetails = false): array
    {
        try {
            $formatted = [
                'id' => $audit->id,
                'entity_type' => $audit->entity_type,
                'entity_id' => $audit->entity_id,
                'action' => $audit->action,
                'formatted_action' => $audit->getFormattedAction(),
                'user_name' => $audit->user?->name ?? 'System',
                'user_id' => $audit->user_id,
                'created_at' => $audit->created_at?->toISOString(),
                'created_at_human' => $audit->created_at?->diffForHumans(),
                'formatted_date' => $audit->created_at?->format('M j, Y g:i A'),
                'time_ago' => $audit->created_at?->diffForHumans(),
                'summary' => $this->generateActivitySummary($audit),
                'description' => $this->generateActivitySummary($audit), // Add description field for compatibility
            ];

            if ($includeDetails) {
                $formatted['changes'] = $audit->getChangedFields();
                $formatted['old_values'] = $audit->old_values;
                $formatted['new_values'] = $audit->new_values;
                $formatted['ip_address'] = $audit->ip_address;
                $formatted['user_agent'] = $audit->user_agent;
            }

            return $formatted;
        } catch (\Exception $e) {
            \Log::error('Error formatting audit record: ' . $e->getMessage(), [
                'audit_id' => $audit->id ?? 'unknown',
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            // Return minimal safe record
            return [
                'id' => $audit->id ?? 0,
                'entity_type' => $audit->entity_type ?? 'Unknown',
                'entity_id' => $audit->entity_id ?? 0,
                'action' => $audit->action ?? 'unknown',
                'user_name' => 'System',
                'created_at' => now()->toISOString(),
                'created_at_human' => 'Unknown time',
                'description' => 'Error loading activity details'
            ];
        }
    }

    /**
     * Generate human-readable activity summary
     *
     * @param MasterDataAudit $audit
     * @return string
     */
    protected function generateActivitySummary(MasterDataAudit $audit): string
    {
        $entityName = str_replace('_', ' ', $audit->entity_type);
        $entityName = rtrim($entityName, 's'); // Remove plural 's'
        
        switch ($audit->action) {
            case 'created':
                return "Created new {$entityName}";
            case 'updated':
                $changes = array_keys($audit->new_values ?? []);
                if (count($changes) === 1) {
                    return "Updated {$entityName} {$changes[0]}";
                } else {
                    return "Updated {$entityName} (" . count($changes) . " fields)";
                }
            case 'deleted':
                return "Deleted {$entityName}";
            case 'status_changed':
                $oldStatus = $audit->old_values['status'] ?? 'unknown';
                $newStatus = $audit->new_values['status'] ?? 'unknown';
                return "Changed {$entityName} status from {$oldStatus} to {$newStatus}";
            case 'restored':
                return "Restored {$entityName}";
            default:
                return "Modified {$entityName}";
        }
    }

    /**
     * Format changes for export
     */
    protected function formatChanges(MasterDataAudit $audit): string
    {
        $changes = $audit->getChangedFields();
        
        if (empty($changes)) {
            return '';
        }

        $formatted = [];
        foreach ($changes as $field => $change) {
            $formatted[] = "{$field}: '{$change['old']}' → '{$change['new']}'";
        }

        return implode('; ', $formatted);
    }

    /**
     * Get changes grouped by action
     */
    protected function getChangesByAction($query): array
    {
        return $query->select('action', DB::raw('count(*) as count'))
                    ->groupBy('action')
                    ->pluck('count', 'action')
                    ->toArray();
    }

    /**
     * Get changes grouped by entity type
     */
    protected function getChangesByEntity($query): array
    {
        return $query->select('entity_type', DB::raw('count(*) as count'))
                    ->groupBy('entity_type')
                    ->pluck('count', 'entity_type')
                    ->toArray();
    }

    /**
     * Get changes grouped by user
     */
    protected function getChangesByUser($query): array
    {
        return $query->join('users', 'master_data_audits.user_id', '=', 'users.id')
                    ->select('users.name', DB::raw('count(*) as count'))
                    ->groupBy('users.id', 'users.name')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->pluck('count', 'name')
                    ->toArray();
    }

    /**
     * Get changes grouped by day
     */
    protected function getChangesByDay($query): array
    {
        return $query->select(
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('count(*) as count')
                    )
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy('date')
                    ->pluck('count', 'date')
                    ->toArray();
    }

    /**
     * Get most active users
     */
    protected function getMostActiveUsers($query): array
    {
        return $query->join('users', 'master_data_audits.user_id', '=', 'users.id')
                    ->select('users.name', 'users.email', DB::raw('count(*) as count'))
                    ->groupBy('users.id', 'users.name', 'users.email')
                    ->orderBy('count', 'desc')
                    ->limit(5)
                    ->get()
                    ->toArray();
    }

    /**
     * Get most changed entities
     */
    protected function getMostChangedEntities($query): array
    {
        return $query->select('entity_type', 'entity_id', DB::raw('count(*) as count'))
                    ->groupBy('entity_type', 'entity_id')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->get()
                    ->toArray();
    }
}