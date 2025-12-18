<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BedAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id', 'bed_id', 'assigned_at', 'released_at',
        'assigned_by', 'released_by', 'assignment_notes', 'release_notes'
    ];

    public function encounter() {
        return $this->belongsTo(Encounter::class, 'encounter_id', 'id');
    }

    public function bed() {
        return $this->belongsTo(Bed::class, 'bed_id', 'id');
    }

}
