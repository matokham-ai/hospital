<?php

namespace App\Imports;

use App\Models\Department;
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

class DepartmentImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
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
        // Check if department already exists
        if (Department::where('code', $row['code'])->exists()) {
            $this->skippedCount++;
            return null;
        }

        $this->importedCount++;

        return new Department([
            'name' => $row['name'],
            'code' => $row['code'],
            'icon' => $row['icon'] ?? 'building',
            'description' => $row['description'] ?? null,
            'status' => $row['status'] ?? 'active',
            'sort_order' => $row['sort_order'] ?? (Department::max('sort_order') + 1),
        ]);
    }

    /**
     * @return array
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:departments,code',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }

    /**
     * @return array
     */
    public function customValidationMessages()
    {
        return [
            'name.required' => 'Department name is required',
            'code.required' => 'Department code is required',
            'code.unique' => 'Department code must be unique',
            'status.in' => 'Status must be either active or inactive',
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