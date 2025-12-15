<?php
namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class ReportExport implements FromArray, WithHeadings, WithTitle
{
    protected $data, $type, $start, $end;

    public function __construct($data, $type, $start, $end)
    {
        $this->data = $data;
        $this->type = $type;
        $this->start = $start;
        $this->end = $end;
    }

    public function array(): array
    {
        $rows = [];
        foreach ($this->data as $row) {
            $rows[] = [
                'Encounter ID' => $row['encounter_id'],
                'Patient Name' => $row['patient_name'],
                'Admission Date' => $row['admission_date'],
                'Discharge Date' => $row['discharge_date'],
                'Stay Length (days)' => $row['stay_length_days'],
            ];
        }
        return $rows;
    }

    public function headings(): array
    {
        return ['Encounter ID', 'Patient Name', 'Admission Date', 'Discharge Date', 'Stay Length (days)'];
    }

    public function title(): string
    {
        return strtoupper($this->type) . " Report {$this->start} to {$this->end}";
    }
}
