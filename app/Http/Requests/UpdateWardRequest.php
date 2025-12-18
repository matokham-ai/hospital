<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWardRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->can('update wards');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $ward = $this->route('ward');
        
        return [
            'department_id' => 'required|exists:departments,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:general,icu,maternity,pediatric,emergency,surgical',
            'capacity' => ['required', 'integer', 'min:1', new \App\Rules\WardCapacityRule($ward?->id, $this->department_id)],
            'floor_number' => 'nullable|integer|min:0|max:50',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive,maintenance,renovation',
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
            'name.required' => 'Ward name is required.',
            'type.required' => 'Ward type is required.',
            'type.in' => 'Invalid ward type selected.',
            'capacity.required' => 'Ward capacity is required.',
            'capacity.min' => 'Ward capacity must be at least 1.',
            'status.required' => 'Ward status is required.',
            'status.in' => 'Invalid ward status selected.',
        ];
    }
}