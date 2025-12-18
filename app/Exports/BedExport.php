<?php

namespace App\Exports;

use App\Models\Bed;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class BedExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting, WithStyles, ShouldAutoSize
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
        $query = Bed::with(['ward:id,name,type,department_id', 'ward.department:id,name,code']);

        // Apply filters
        if (isset($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (isset($this->filters['bed_type'])) {
            $query->where('bed_type', $this->filters['bed_type']);
        }

        if (isset($this->filters['ward_id'])) {
            $query->where('ward_id', $this->filters['ward_id']);
        }

        if (isset($this->filters['department_id'])) {
            $query->whereHas('ward', function ($q) {
                $q->where('department_id', $this->filters['department_id']);
            });
        }

        if (isset($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('bed_number', 'like', "%{$search}%")
                  ->orWhere('bed_type', 'like', "%{$search}%")
                  ->orWhere('maintenance_notes', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('ward_id')
                    ->orderBy('bed_number')
                    ->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID',
            'Bed Number',
            'Bed Type',
            'Ward',
            'Ward Type',
            'Department',
            'Department Code',
            'Status',
            'Last Occupied At',
            'Maintenance Notes',
            'Created At',
            'Updated At',
        ];
    }

    /**
     * @param mixed $bed
     * @return array
     */
    public function map($bed): array
    {
        return [
            $bed->id,
            $bed->bed_number,
            ucfirst($bed->bed_type),
            $bed->ward->name ?? 'N/A',
            ucfirst($bed->ward->type ?? 'N/A'),
            $bed->ward->department->name ?? 'N/A',
            $bed->ward->department->code ?? 'N/A',
            ucfirst($bed->status),
            $bed->last_occupied_at ? $bed->last_occupied_at->format('Y-m-d H:i:s') : 'Never',
            $bed->maintenance_notes,
            $bed->created_at->format('Y-m-d H:i:s'),
            $bed->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @return array
     */
    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_NUMBER,
            'I' => NumberFormat::FORMAT_DATE_DATETIME,
            'K' => NumberFormat::FORMAT_DATE_DATETIME,
            'L' => NumberFormat::FORMAT_DATE_DATETIME,
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