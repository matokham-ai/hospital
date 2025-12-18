<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBedStatusRequest extends FormRequest
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
        return [
            'bed_number' => 'sometimes|required|string|max:20',
            'bed_type' => 'sometimes|required|in:STANDARD,ICU,ISOLATION,PRIVATE',
            'status' => 'sometimes|required|in:available,occupied,maintenance,reserved,out_of_order',
            'maintenance_notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'bed_number.required' => 'Bed number is required.',
            'bed_number.max' => 'Bed number cannot exceed 20 characters.',
            'bed_type.required' => 'Bed type is required.',
            'bed_type.in' => 'Invalid bed type selected.',
            'status.required' => 'Bed status is required.',
            'status.in' => 'Invalid bed status selected.',
            'maintenance_notes.max' => 'Maintenance notes cannot exceed 500 characters.',
        ];
    }
}