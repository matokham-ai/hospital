<?php

namespace App\Imports;

use App\Models\TestCatalog;
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

class TestCatalogImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
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
        // Check if test already exists
        if (TestCatalog::where('code', $row['code'])->exists()) {
            $this->skippedCount++;
            return null;
        }

        // Get department ID if department_code is provided
        $departmentId = 1; // Default department
        if (!empty($row['department_code'])) {
            $department = Department::where('code', $row['department_code'])->first();
            if ($department) {
                $departmentId = $department->id;
            }
        } elseif (!empty($row['department_id'])) {
            $departmentId = $row['department_id'];
        }

        $this->importedCount++;

        return new TestCatalog([
            'name' => $row['name'],
            'code' => $row['code'],
            'category' => $row['category'] ?? 'General',
            'price' => floatval($row['price'] ?? 0),
            'turnaround_time' => intval($row['turnaround_time'] ?? 24),
            'unit' => $row['unit'] ?? null,
            'normal_range' => $row['normal_range'] ?? null,
            'sample_type' => $row['sample_type'] ?? null,
            'department_id' => $departmentId,
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
            'code' => 'required|string|max:20|unique:test_catalogs,code',
            'category' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'turnaround_time' => 'required|integer|min:1',
            'unit' => 'nullable|string|max:50',
            'normal_range' => 'nullable|string',
            'sample_type' => 'nullable|string|max:100',
            'department_id' => 'nullable|exists:departments,id',
            'department_code' => 'nullable|exists:departments,code',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    /**
     * @return array
     */
    public function customValidationMessages()
    {
        return [
            'name.required' => 'Test name is required',
            'code.required' => 'Test code is required',
            'code.unique' => 'Test code must be unique',
            'price.required' => 'Test price is required',
            'price.min' => 'Test price must be greater than or equal to 0',
            'turnaround_time.required' => 'Turnaround time is required',
            'turnaround_time.min' => 'Turnaround time must be at least 1 hour',
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