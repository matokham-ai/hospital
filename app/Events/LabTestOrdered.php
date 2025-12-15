<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LabTestOrdered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $encounterId;
    public $testId;
    public $testName;
    public $testPrice;

    public function __construct($encounterId, $testId, $testName, $testPrice = null)
    {
        $this->encounterId = $encounterId;
        $this->testId = $testId;
        $this->testName = $testName;
        $this->testPrice = $testPrice;
    }
}