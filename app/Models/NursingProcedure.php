<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingProcedure extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'encounter_id',
        'ordered_by',
        'assigned_to',
        'procedure_type',
        'location',
        'description',
        'priority',
        'status',
        'scheduled_at',
        'completed_at',
        'completed_by',
        'notes',
        'complications',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function encounter(): BelongsTo
    {
        return $this->belongsTo(Encounter::class);
    }

    public function orderedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ordered_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'overdue']);
    }

    public function scopeForToday($query)
    {
        return $query->whereDate('scheduled_at', today());
    }

    public function getIsOverdueAttribute(): bool
    {
        if (! $this->scheduled_at || $this->status === 'completed') {
            return false;
        }

        return $this->scheduled_at->isPast();
    }

    public function markCompleted(array $attributes = []): void
    {
        $this->fill([
            'status' => 'completed',
            'completed_at' => $attributes['completed_at'] ?? now(),
            'completed_by' => $attributes['completed_by'] ?? null,
            'notes' => $attributes['notes'] ?? $this->notes,
            'complications' => $attributes['complications'] ?? $this->complications,
        ])->save();
    }
}
