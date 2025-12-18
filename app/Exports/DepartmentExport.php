<?php

namespace App\Exports;

use App\Models\Department;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class DepartmentExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting, WithStyles, ShouldAutoSize
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        $query = Department::query();

        // Apply filters
        if (isset($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (isset($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->withCount(['wards', 'testCatalogs'])
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Code',
            'Icon',
            'Description',
            'Status',
            'Sort Order',
            'Total Wards',
            'Total Tests',
            'Created At',
            'Updated At',
        ];
    }

    /**
     * @param mixed $department
     * @return array
     */
    public function map($department): array
    {
        return [
            $department->id,
            $department->name,
            $department->code,
            $department->icon,
            $department->description,
            ucfirst($department->status),
            $department->sort_order,
            $department->wards_count,
            $department->test_catalogs_count,
            $department->created_at->format('Y-m-d H:i:s'),
            $department->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @return array
     */
    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_NUMBER,
            'G' => NumberFormat::FORMAT_NUMBER,
            'H' => NumberFormat::FORMAT_NUMBER,
            'I' => NumberFormat::FORMAT_NUMBER,
            'J' => NumberFormat::FORMAT_DATE_DATETIME,
            'K' => NumberFormat::FORMAT_DATE_DATETIME,
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text.
            1 => ['font' => ['bold' => true]],
        ];
    }
}