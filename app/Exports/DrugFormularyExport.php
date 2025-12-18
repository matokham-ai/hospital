<?php

namespace App\Exports;

use App\Models\DrugFormulary;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class DrugFormularyExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting, WithStyles, ShouldAutoSize
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
        $query = DrugFormulary::with('substitutes');

        // Apply filters
        if (isset($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (isset($this->filters['form'])) {
            $query->where('form', $this->filters['form']);
        }

        if (isset($this->filters['low_stock']) && $this->filters['low_stock']) {
            $query->whereRaw('stock_quantity <= reorder_level');
        }

        if (isset($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('atc_code', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('name')
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
            'Generic Name',
            'ATC Code',
            'Strength',
            'Form',
            'Stock Quantity',
            'Reorder Level',
            'Unit Price',
            'Manufacturer',
            'Stock Status',
            'Substitutes Count',
            'Status',
            'Created At',
            'Updated At',
        ];
    }

    /**
     * @param mixed $drug
     * @return array
     */
    public function map($drug): array
    {
        // Determine stock status
        $stockStatus = 'In Stock';
        if ($drug->stock_quantity == 0) {
            $stockStatus = 'Out of Stock';
        } elseif ($drug->stock_quantity <= $drug->reorder_level) {
            $stockStatus = 'Low Stock';
        }

        return [
            $drug->id,
            $drug->name,
            $drug->generic_name,
            $drug->atc_code,
            $drug->strength,
            ucfirst($drug->form),
            $drug->stock_quantity,
            $drug->reorder_level,
            $drug->unit_price,
            $drug->manufacturer,
            $stockStatus,
            $drug->substitutes->count(),
            ucfirst($drug->status),
            $drug->created_at->format('Y-m-d H:i:s'),
            $drug->updated_at->format('Y-m-d H:i:s'),
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
            'I' => '"KES "#,##0.00',
            'L' => NumberFormat::FORMAT_NUMBER,
            'N' => NumberFormat::FORMAT_DATE_DATETIME,
            'O' => NumberFormat::FORMAT_DATE_DATETIME,
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