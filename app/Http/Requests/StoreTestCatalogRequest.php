<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTestCatalogRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->can('create test catalogs');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'department_id' => 'required|exists:departments,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:test_catalogs,code|regex:/^[A-Z0-9_-]+$/',
            'category' => 'required|string|max:100|in:Hematology,Biochemistry,Microbiology,Immunology,Pathology,Radiology,Cardiology,Endocrinology,Toxicology,Genetics',
            'price' => ['required', 'numeric', 'min:0', new \App\Rules\TestPriceRule()],
            'turnaround_time' => 'required|integer|min:1|max:168', // Max 1 week
            'unit' => 'nullable|string|max:50',
            'normal_range' => 'nullable|string|max:500',
            'sample_type' => 'nullable|string|max:100|in:Blood,Urine,Stool,Saliva,Tissue,Swab,CSF,Other',
            'status' => 'required|in:active,inactive',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'department_id.required' => 'Department is required.',
            'department_id.exists' => 'Selected department does not exist.',
            'name.required' => 'Test name is required.',
            'code.required' => 'Test code is required.',
            'code.unique' => 'This test code is already in use.',
            'category.required' => 'Test category is required.',
            'price.required' => 'Test price is required.',
            'price.min' => 'Test price must be at least 0.',
            'turnaround_time.required' => 'Turnaround time is required.',
            'turnaround_time.min' => 'Turnaround time must be at least 1 hour.',
            'turnaround_time.max' => 'Turnaround time cannot exceed 168 hours (1 week).',
            'status.required' => 'Test status is required.',
            'status.in' => 'Invalid test status selected.',
        ];
    }
}