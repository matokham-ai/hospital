<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Physician extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The primary key is not auto-incrementing and is a string.
     * 
     */
    protected $table = 'physicians';

    protected $primaryKey = 'physician_code';
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'physician_code',
        'user_id',
        'name',
        'license_number',
        'specialization',
        'qualification',
        'medical_school',
        'years_of_experience',
        'is_consultant',
        'bio',
        'department_id', // ✅ include if it exists in your schema
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_consultant' => 'boolean',
        'years_of_experience' => 'integer',
        'deleted_at' => 'datetime',
    ];

    /**
     * Hide unneeded timestamps when serializing (optional)
     */
    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    /**
     * Relationships
     */

    // 🔗 Link back to user (for login account reference only)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // 🔗 Department relationship (if you have departments table)
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    // 🔗 Prescriptions written by this doctor
    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'physician_id', 'physician_code');
    }

    // 🔗 Appointments handled by this doctor
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'physician_id', 'physician_code');
    }

}

