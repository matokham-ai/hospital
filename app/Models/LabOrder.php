<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id', 'patient_id', 'ordered_by', 'test_name', 'status',
        'priority', 'expected_completion_at', 'clinical_notes', 'test_id'
    ];

    protected $casts = [
        'expected_completion_at' => 'datetime'
    ];

    public function encounter() { return $this->belongsTo(Encounter::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
    public function physician() { return $this->belongsTo(Physician::class, 'ordered_by'); }
    public function result() { return $this->hasOne(LabResult::class); }
    public function results() { return $this->hasMany(LabResult::class); }
    public function billingItems() { return $this->morphMany(BillItem::class, 'reference'); }

    /**
     * Get the test catalog entry for this lab order
     */
    public function testCatalog()
    {
        return $this->belongsTo(TestCatalog::class, 'test_id');
    }

    protected static function booted()
    {
        static::created(function ($labOrder) {
            \App\Events\LabOrderCreated::dispatch($labOrder);
        });
    }

    /**
     * Check if this lab order is urgent priority
     */
    public function isUrgent(): bool
    {
        return $this->priority === 'urgent';
    }

    /**
     * Check if this lab order is fast priority
     */
    public function isFast(): bool
    {
        return $this->priority === 'fast';
    }

    /**
     * Check if this lab order is normal priority
     */
    public function isNormal(): bool
    {
        return $this->priority === 'normal';
    }

    /**
     * Set the priority level for this lab order
     * 
     * @param string $priority One of: urgent, fast, normal
     * @throws \InvalidArgumentException if priority is invalid
     */
    public function setPriority(string $priority): void
    {
        $validPriorities = ['urgent', 'fast', 'normal'];
        
        if (!in_array($priority, $validPriorities)) {
            throw new \InvalidArgumentException(
                "Invalid priority level. Must be one of: " . implode(', ', $validPriorities)
            );
        }

        $this->priority = $priority;
        $this->save();
    }

    /**
     * Get the priority level display name
     */
    public function getPriorityLabel(): string
    {
        return match($this->priority) {
            'urgent' => 'Urgent',
            'fast' => 'Fast',
            'normal' => 'Normal',
            default => 'Normal'
        };
    }

    /**
     * Get the priority level color for UI display
     */
    public function getPriorityColor(): string
    {
        return match($this->priority) {
            'urgent' => 'red',
            'fast' => 'orange',
            'normal' => 'blue',
            default => 'gray'
        };
    }

    /**
     * Calculate and set the expected completion time based on priority
     * Uses turnaround time from test catalog if available
     */
    public function calculateExpectedCompletion(): void
    {
        $turnaroundHours = config('lab.priorities.' . $this->priority . '.turnaround_hours', 24);
        
        // If test catalog is available, use its turnaround time
        if ($this->testCatalog && $this->testCatalog->turnaround_time) {
            $turnaroundHours = $this->testCatalog->turnaround_time;
            
            // Adjust based on priority
            if ($this->priority === 'urgent') {
                $turnaroundHours = min($turnaroundHours, 2);
            } elseif ($this->priority === 'fast') {
                $turnaroundHours = min($turnaroundHours, 6);
            }
        }

        $this->expected_completion_at = now()->addHours($turnaroundHours);
        $this->save();
    }

    /**
     * Scope to filter by priority level
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope to get urgent orders
     */
    public function scopeUrgent($query)
    {
        return $query->where('priority', 'urgent');
    }

    /**
     * Scope to get fast orders
     */
    public function scopeFast($query)
    {
        return $query->where('priority', 'fast');
    }

    /**
     * Scope to get normal orders
     */
    public function scopeNormal($query)
    {
        return $query->where('priority', 'normal');
    }
}
