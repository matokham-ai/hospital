<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\ReportsController;
use App\Mail\ScheduledReportMail;
use Carbon\Carbon;

class GenerateScheduledReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $reportConfig;
    protected $recipients;

    public function __construct($reportConfig, $recipients = [])
    {
        $this->reportConfig = $reportConfig;
        $this->recipients = $recipients;
    }

    public function handle()
    {
        try {
            $reportsController = new ReportsController();
            
            // Generate the report based on configuration
            $reportType = $this->reportConfig['type'];
            $format = $this->reportConfig['format'] ?? 'pdf';
            
            // Calculate date range based on frequency
            $dateRange = $this->calculateDateRange($this->reportConfig['frequency']);
            
            // Create a mock request with the parameters
            $request = new \Illuminate\Http\Request([
                'type' => $reportType,
                'start_date' => $dateRange['start'],
                'end_date' => $dateRange['end'],
                'department_id' => $this->reportConfig['department_id'] ?? null,
                'ward_id' => $this->reportConfig['ward_id'] ?? null,
            ]);

            // Generate the report
            if ($format === 'pdf') {
                $response = $reportsController->exportPDF($request);
            } else {
                $response = $reportsController->exportExcel($request);
            }

            // Save the file temporarily
            $filename = "scheduled_report_{$reportType}_" . now()->format('Y_m_d_H_i_s') . ".{$format}";
            $filePath = "temp/reports/{$filename}";
            
            Storage::put($filePath, $response->getContent());

            // Send email to recipients
            foreach ($this->recipients as $recipient) {
                Mail::to($recipient)->send(new ScheduledReportMail(
                    $this->reportConfig,
                    Storage::path($filePath),
                    $filename
                ));
            }

            // Clean up temporary file
            Storage::delete($filePath);

        } catch (\Exception $e) {
            \Log::error('Scheduled report generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function calculateDateRange($frequency)
    {
        $now = Carbon::now();
        
        switch ($frequency) {
            case 'daily':
                return [
                    'start' => $now->subDay()->format('Y-m-d'),
                    'end' => $now->format('Y-m-d')
                ];
            case 'weekly':
                return [
                    'start' => $now->subWeek()->format('Y-m-d'),
                    'end' => $now->format('Y-m-d')
                ];
            case 'monthly':
                return [
                    'start' => $now->subMonth()->format('Y-m-d'),
                    'end' => $now->format('Y-m-d')
                ];
            default:
                return [
                    'start' => $now->subDays(7)->format('Y-m-d'),
                    'end' => $now->format('Y-m-d')
                ];
        }
    }
}