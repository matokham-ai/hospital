<?php

namespace App\Traits;

trait HasDoctorAttribute
{
    /**
     * Returns a unified doctor object with id, name, specialization, and department info.
     */
    public function getDoctorAttribute()
    {
        // 1️⃣ If model has a doctor() relationship (OPD case)
        if (method_exists($this, 'doctor')) {
            $doc = $this->doctor()->first(); // <-- FIX: call the relationship
            if ($doc) {
                return (object) [
                    'id' => $doc->id ?? null,
                    'name' => $doc->name ?? 'Not assigned',
                    'specialization' => $doc->specialization
                        ?? optional($doc->profile)->specialization
                        ?? 'General',
                    'department' => optional($doc->department)->name ?? null,
                ];
            }
        }

        // 2️⃣ If model has a physician() relationship (Regular Appointment case)
        if (method_exists($this, 'physician')) {
            $doc = $this->physician()->first(); // <-- FIX: call the relationship
            if ($doc) {
                return (object) [
                    'id' => $doc->physician_code ?? null,
                    'name' => $doc->name ?? 'Not assigned',
                    'specialization' => $doc->specialization ?? 'General',
                    'department' => optional($doc->department)->name ?? null,
                ];
            }
        }

        // 3️⃣ Default fallback (no doctor/physician found)
        return (object) [
            'id' => null,
            'name' => 'Not assigned',
            'specialization' => null,
            'department' => null,
        ];
    }
}
