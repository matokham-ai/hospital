<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PatientsExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    protected $patients;

    public function __construct($patients)
    {
        $this->patients = $patients;
    }

    public function collection()
    {
        return collect($this->patients);
    }

    public function headings(): array
    {
        return [
            'Patient Number',
            'Name',
            'Gender',
            'Age',
            'Phone',
            'Email',
            'Date of Birth',
            'Nationality',
            'Registered Date',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text.
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15, // Patient Number
            'B' => 25, // Name
            'C' => 10, // Gender
            'D' => 8,  // Age
            'E' => 15, // Phone
            'F' => 25, // Email
            'G' => 15, // Date of Birth
            'H' => 15, // Nationality
            'I' => 15, // Registered Date
        ];
    }
}