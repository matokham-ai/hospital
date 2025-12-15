<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImagingReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'imaging_order_id', 'findings', 'conclusion',
        'validated_by', 'validated_at'
    ];

    public function imagingOrder() { return $this->belongsTo(ImagingOrder::class); }
    public function validator() { return $this->belongsTo(User::class, 'validated_by'); }
}
