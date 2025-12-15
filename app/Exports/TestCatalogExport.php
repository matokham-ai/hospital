<?php

namespace App\Exports;

use App\Models\TestCatalog;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class TestCatalogExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting, WithStyles, ShouldAutoSize
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
        $query = TestCatalog::with('department:id,name,code');

        // Apply filters
        if (isset($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (isset($this->filters['category'])) {
            $query->where('category', $this->filters['category']);
        }

        if (isset($this->filters['department_id'])) {
            $query->where('department_id', $this->filters['department_id']);
        }

        if (isset($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('category')
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
            'Category',
            'Department',
            'Department Code',
            'Price',
            'Turnaround Time (Hours)',
            'Unit',
            'Normal Range',
            'Sample Type',
            'Status',
            'Created At',
            'Updated At',
        ];
    }

    /**
     * @param mixed $test
     * @return array
     */
    public function map($test): array
    {
        return [
            $test->id,
            $test->name,
            $test->code,
            $test->category,
            $test->department->name ?? 'N/A',
            $test->department->code ?? 'N/A',
            $test->price,
            $test->turnaround_time,
            $test->unit,
            $test->normal_range,
            $test->sample_type,
            ucfirst($test->status),
            $test->created_at->format('Y-m-d H:i:s'),
            $test->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @return array
     */
    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_NUMBER,
            'G' => '"KES "#,##0.00',
            'H' => NumberFormat::FORMAT_NUMBER,
            'M' => NumberFormat::FORMAT_DATE_DATETIME,
            'N' => NumberFormat::FORMAT_DATE_DATETIME,
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