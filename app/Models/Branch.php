<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'branch_code',
        'branch_name',
        'location',
        'address',
        'phone',
        'email',
        'status',
        'is_main_branch',
        'manager_id',
    ];

    protected $casts = [
        'is_main_branch' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function billingAccounts()
    {
        return $this->hasMany(BillingAccount::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
