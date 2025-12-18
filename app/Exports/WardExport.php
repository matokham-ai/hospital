<?php

namespace App\Exports;

use App\Models\Ward;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class WardExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting, WithStyles, ShouldAutoSize
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
        $query = Ward::with(['department:id,name,code', 'beds']);

        // Apply filters
        if (isset($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (isset($this->filters['type'])) {
            $query->where('type', $this->filters['type']);
        }

        if (isset($this->filters['department_id'])) {
            $query->where('department_id', $this->filters['department_id']);
        }

        if (isset($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('department_id')
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
            'Type',
            'Department',
            'Department Code',
            'Capacity',
            'Current Occupancy',
            'Occupancy Rate (%)',
            'Floor Number',
            'Description',
            'Status',
            'Total Beds',
            'Available Beds',
            'Occupied Beds',
            'Created At',
            'Updated At',
        ];
    }

    /**
     * @param mixed $ward
     * @return array
     */
    public function map($ward): array
    {
        $totalBeds = $ward->beds->count();
        $occupiedBeds = $ward->beds->where('status', 'occupied')->count();
        $availableBeds = $ward->beds->where('status', 'available')->count();
        $occupancyRate = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0;

        return [
            $ward->id,
            $ward->name,
            ucfirst($ward->type),
            $ward->department->name ?? 'N/A',
            $ward->department->code ?? 'N/A',
            $ward->capacity,
            $occupiedBeds,
            $occupancyRate,
            $ward->floor_number,
            $ward->description,
            ucfirst($ward->status),
            $totalBeds,
            $availableBeds,
            $occupiedBeds,
            $ward->created_at->format('Y-m-d H:i:s'),
            $ward->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @return array
     */
    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_NUMBER,
            'F' => NumberFormat::FORMAT_NUMBER,
            'G' => NumberFormat::FORMAT_NUMBER,
            'H' => NumberFormat::FORMAT_PERCENTAGE_00,
            'I' => NumberFormat::FORMAT_NUMBER,
            'L' => NumberFormat::FORMAT_NUMBER,
            'M' => NumberFormat::FORMAT_NUMBER,
            'N' => NumberFormat::FORMAT_NUMBER,
            'O' => NumberFormat::FORMAT_DATE_DATETIME,
            'P' => NumberFormat::FORMAT_DATE_DATETIME,
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