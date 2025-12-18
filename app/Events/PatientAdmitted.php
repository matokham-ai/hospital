<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PatientAdmitted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $encounterId;
    public $bedId;
    public $bedType;

    public function __construct($encounterId, $bedId, $bedType = 'general')
    {
        $this->encounterId = $encounterId;
        $this->bedId = $bedId;
        $this->bedType = $bedType;
    }
}