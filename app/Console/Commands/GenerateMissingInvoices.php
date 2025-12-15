<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\InvoiceService;

class GenerateMissingInvoices extends Command
{
    protected $signature = 'invoices:generate-missing';
    protected $description = 'Generate invoices for billing accounts that don\'t have invoices yet';

    public function handle()
    {
        $this->info('Generating missing invoices...');
        
        $invoiceService = new InvoiceService();
        $result = $invoiceService->generateMissingInvoices();
        
        $this->info("Total billing accounts without invoices: {$result['total_accounts']}");
        $this->info("Successfully generated: {$result['generated']}");
        
        if ($result['errors'] > 0) {
            $this->warn("Failed to generate: {$result['errors']}");
        }
        
        $this->info('Done!');
        
        return 0;
    }
}
