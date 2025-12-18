<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Jobs\GenerateScheduledReport;
use Carbon\Carbon;

class RunScheduledReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:run-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run scheduled reports that are due';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for scheduled reports...');

        $dueReports = DB::table('scheduled_reports')
            ->where('is_active', true)
            ->where('next_run_at', '<=', now())
            ->get();

        if ($dueReports->isEmpty()) {
            $this->info('No scheduled reports are due.');
            return;
        }

        $this->info("Found {$dueReports->count()} scheduled reports to run.");

        foreach ($dueReports as $report) {
            try {
                $this->info("Processing report: {$report->name}");

                // Prepare report configuration
                $reportConfig = [
                    'type' => $report->type,
                    'frequency' => $report->frequency,
                    'format' => $report->format,
                    'department_id' => json_decode($report->filters, true)['department_id'] ?? null,
                    'ward_id' => json_decode($report->filters, true)['ward_id'] ?? null,
                ];

                $recipients = json_decode($report->recipients, true);

                // Dispatch the job
                GenerateScheduledReport::dispatch($reportConfig, $recipients);

                // Update the report record
                DB::table('scheduled_reports')
                    ->where('id', $report->id)
                    ->update([
                        'last_run_at' => now(),
                        'next_run_at' => $this->calculateNextRun($report->frequency),
                        'run_count' => $report->run_count + 1,
                        'updated_at' => now()
                    ]);

                $this->info("✓ Queued report: {$report->name}");

            } catch (\Exception $e) {
                $this->error("✗ Failed to process report {$report->name}: {$e->getMessage()}");
            }
        }

        $this->info('Scheduled reports processing completed.');
    }

    /**
     * Calculate next run time based on frequency
     */
    private function calculateNextRun($frequency)
    {
        $now = Carbon::now();
        
        switch ($frequency) {
            case 'daily':
                return $now->addDay()->setTime(6, 0);
            case 'weekly':
                return $now->addWeek()->startOfWeek()->setTime(6, 0);
            case 'monthly':
                return $now->addMonth()->startOfMonth()->setTime(6, 0);
            default:
                return $now->addDay()->setTime(6, 0);
        }
    }
}
