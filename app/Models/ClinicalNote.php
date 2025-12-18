<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClinicalNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id', 'note_type', 'subjective', 'objective',
        'assessment', 'plan', 'content', 'notes', 'created_by', 'note_datetime'
    ];

    // Accessor to get notes from content if notes field is empty
    public function getNotesAttribute($value)
    {
        return $value ?: $this->content;
    }

    public function encounter() { return $this->belongsTo(Encounter::class); }
}
