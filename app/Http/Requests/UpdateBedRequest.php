<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->can('update beds');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $bed = $this->route('bed');
        
        return [
            'ward_id' => 'required|exists:wards,id',
            'bed_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('beds', 'bed_number')
                    ->where('ward_id', $this->ward_id)
                    ->ignore($bed),
            ],
            'bed_type' => 'required|in:standard,icu,isolation,maternity,pediatric,surgical',
            'status' => 'required|in:available,occupied,maintenance,reserved,out_of_order',
            'maintenance_notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'ward_id.required' => 'Ward is required.',
            'ward_id.exists' => 'Selected ward does not exist.',
            'bed_number.required' => 'Bed number is required.',
            'bed_number.unique' => 'This bed number already exists in the selected ward.',
            'bed_type.required' => 'Bed type is required.',
            'bed_type.in' => 'Invalid bed type selected.',
            'status.required' => 'Bed status is required.',
            'status.in' => 'Invalid bed status selected.',
            'maintenance_notes.max' => 'Maintenance notes cannot exceed 500 characters.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'bed_number' => strtoupper(trim($this->bed_number ?? '')),
        ]);
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $bed = $this->route('bed');
            
            // Prevent changing status from occupied to maintenance/out_of_order without proper workflow
            if ($bed && $bed->status === 'occupied' && in_array($this->status, ['maintenance', 'out_of_order'])) {
                $validator->errors()->add('status', 'Cannot change status of an occupied bed directly to maintenance or out of order. Please discharge the patient first.');
            }
        });
    }
}
