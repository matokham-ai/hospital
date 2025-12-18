<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConsultationCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $encounterId;
    public $physicianId;
    public $consultationType;

    public function __construct($encounterId, $physicianId = null, $consultationType = 'general')
    {
        $this->encounterId = $encounterId;
        $this->physicianId = $physicianId;
        $this->consultationType = $consultationType;
    }
}