<?php

namespace App\Imports;

use App\Models\DrugFormulary;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Throwable;

class DrugFormularyImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    use Importable, SkipsErrors, SkipsFailures;

    protected $importedCount = 0;
    protected $skippedCount = 0;

    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        // Check if drug already exists (by name and strength combination)
        if (DrugFormulary::where('name', $row['name'])
                         ->where('strength', $row['strength'] ?? '1mg')
                         ->exists()) {
            $this->skippedCount++;
            return null;
        }

        $this->importedCount++;

        return new DrugFormulary([
            'name' => $row['name'],
            'generic_name' => $row['generic_name'],
            'atc_code' => $row['atc_code'] ?? null,
            'strength' => $row['strength'] ?? '1mg',
            'form' => $row['form'] ?? 'tablet',
            'stock_quantity' => intval($row['stock_quantity'] ?? 0),
            'reorder_level' => intval($row['reorder_level'] ?? 10),
            'unit_price' => floatval($row['unit_price'] ?? 0),
            'manufacturer' => $row['manufacturer'] ?? null,
            'status' => $row['status'] ?? 'active',
        ]);
    }

    /**
     * @return array
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'generic_name' => 'required|string|max:255',
            'atc_code' => 'nullable|string|max:20|regex:/^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$/',
            'strength' => 'required|string|max:100',
            'form' => 'required|in:tablet,capsule,syrup,injection,cream,ointment,drops,inhaler',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'manufacturer' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,discontinued',
        ];
    }

    /**
     * @return array
     */
    public function customValidationMessages()
    {
        return [
            'name.required' => 'Drug name is required',
            'generic_name.required' => 'Generic name is required',
            'atc_code.regex' => 'ATC code must follow the format: A00AA00',
            'strength.required' => 'Drug strength is required',
            'form.required' => 'Drug form is required',
            'form.in' => 'Drug form must be one of: tablet, capsule, syrup, injection, cream, ointment, drops, inhaler',
            'stock_quantity.required' => 'Stock quantity is required',
            'stock_quantity.min' => 'Stock quantity must be greater than or equal to 0',
            'reorder_level.required' => 'Reorder level is required',
            'reorder_level.min' => 'Reorder level must be greater than or equal to 0',
            'unit_price.required' => 'Unit price is required',
            'unit_price.min' => 'Unit price must be greater than or equal to 0',
            'status.in' => 'Status must be either active or discontinued',
        ];
    }

    /**
     * Get the count of imported records
     */
    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    /**
     * Get the count of skipped records
     */
    public function getSkippedCount(): int
    {
        return $this->skippedCount;
    }

    /**
     * Get import results
     */
    public function getResults(): array
    {
        return [
            'imported' => $this->importedCount,
            'skipped' => $this->skippedCount,
            'errors' => $this->failures(),
        ];
    }
}