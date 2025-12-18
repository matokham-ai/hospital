<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'note_type',
        'content',
        'created_by',
        'note_datetime',
    ];

    protected $casts = [
        'note_datetime' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
