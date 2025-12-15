<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ReportsExport implements WithMultipleSheets
{
    protected $data;
    protected $reportType;

    public function __construct($data, $reportType)
    {
        $this->data = $data;
        $this->reportType = $reportType;
    }

    public function sheets(): array
    {
        $sheets = [];

        switch ($this->reportType) {
            case 'patient_census':
                $sheets[] = new PatientCensusSheet($this->data);
                break;
            case 'bed_occupancy':
                $sheets[] = new BedOccupancySheet($this->data);
                break;
            case 'lab_tat':
                $sheets[] = new LabTATSheet($this->data);
                break;
            case 'pharmacy_consumption':
                $sheets[] = new PharmacyConsumptionSheet($this->data);
                break;
            case 'revenue_department':
                $sheets[] = new RevenueSheet($this->data);
                break;
            case 'disease_statistics':
                $sheets[] = new DiseaseStatisticsSheet($this->data);
                break;
        }

        return $sheets;
    }
}

class PatientCensusSheet implements FromCollection, WithHeadings, WithMapping, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data->daily_census);
    }

    public function headings(): array
    {
        return [
            'Date',
            'Inpatients',
            'Outpatients', 
            'Emergency',
            'Total Visits',
            'Admissions',
            'Discharges',
            'Net Admissions'
        ];
    }

    public function map($row): array
    {
        return [
            $row['date'],
            $row['inpatients'],
            $row['outpatients'],
            $row['emergency'],
            $row['total_visits'],
            $row['admissions'],
            $row['discharges'],
            $row['net_admissions']
        ];
    }

    public function title(): string
    {
        return 'Patient Census';
    }
}

class BedOccupancySheet implements FromCollection, WithHeadings, WithMapping, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data->occupancy_trends);
    }

    public function headings(): array
    {
        return [
            'Date',
            'Total Beds',
            'Occupied Beds',
            'Available Beds',
            'Occupancy Rate (%)'
        ];
    }

    public function map($row): array
    {
        return [
            $row['date'],
            $row['total_beds'],
            $row['occupied_beds'],
            $row['available_beds'],
            $row['occupancy_rate']
        ];
    }

    public function title(): string
    {
        return 'Bed Occupancy';
    }
}

class LabTATSheet implements FromCollection, WithHeadings, WithMapping, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data->tat_by_category);
    }

    public function headings(): array
    {
        return [
            'Test Category',
            'Average TAT (Hours)',
            'Total Tests',
            'Delayed Tests',
            'Delay Percentage (%)'
        ];
    }

    public function map($row): array
    {
        return [
            $row['category'],
            $row['avg_tat_hours'],
            $row['total_tests'],
            $row['delayed_tests'],
            $row['delay_percentage']
        ];
    }

    public function title(): string
    {
        return 'Lab TAT Analysis';
    }
}

class PharmacyConsumptionSheet implements FromCollection, WithHeadings, WithMapping, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data->top_drugs_by_quantity);
    }

    public function headings(): array
    {
        return [
            'Drug Name',
            'Total Quantity',
            'Total Value',
            'Unit Cost'
        ];
    }

    public function map($row): array
    {
        return [
            $row->drug->name ?? 'Unknown',
            $row['total_quantity'],
            $row['total_value'],
            $row['total_quantity'] > 0 ? round($row['total_value'] / $row['total_quantity'], 2) : 0
        ];
    }

    public function title(): string
    {
        return 'Pharmacy Consumption';
    }
}

class RevenueSheet implements FromCollection, WithHeadings, WithMapping, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data->revenue_by_department);
    }

    public function headings(): array
    {
        return [
            'Department',
            'Total Revenue',
            'Item Count',
            'Average per Item'
        ];
    }

    public function map($row): array
    {
        return [
            $row['department'],
            $row['total_revenue'],
            $row['item_count'],
            $row['avg_per_item']
        ];
    }

    public function title(): string
    {
        return 'Revenue by Department';
    }
}

class DiseaseStatisticsSheet implements FromCollection, WithHeadings, WithMapping, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data->top_diagnoses);
    }

    public function headings(): array
    {
        return [
            'ICD-10 Code',
            'Diagnosis Description',
            'Count',
            'Percentage'
        ];
    }

    public function map($row): array
    {
        $total = collect($this->data->top_diagnoses)->sum('diagnosis_count');
        $percentage = $total > 0 ? round(($row['diagnosis_count'] / $total) * 100, 2) : 0;
        
        return [
            $row['icd10_code'],
            $row->icd10Code->description ?? 'Unknown',
            $row['diagnosis_count'],
            $percentage . '%'
        ];
    }

    public function title(): string
    {
        return 'Disease Statistics';
    }
}