<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ScheduledReportMail extends Mailable
{
    use Queueable, SerializesModels;

    protected $reportConfig;
    protected $filePath;
    protected $filename;

    public function __construct($reportConfig, $filePath, $filename)
    {
        $this->reportConfig = $reportConfig;
        $this->filePath = $filePath;
        $this->filename = $filename;
    }

    public function build()
    {
        $reportName = ucfirst(str_replace('_', ' ', $this->reportConfig['type']));
        
        return $this->subject("HMS Scheduled Report: {$reportName}")
                    ->view('emails.scheduled-report')
                    ->with([
                        'reportConfig' => $this->reportConfig,
                        'reportName' => $reportName,
                        'generatedAt' => now()->format('Y-m-d H:i:s')
                    ])
                    ->attach($this->filePath, [
                        'as' => $this->filename,
                        'mime' => $this->reportConfig['format'] === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    ]);
    }
}