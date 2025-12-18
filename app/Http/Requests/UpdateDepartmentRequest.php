<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->can('edit departments');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:10',
                Rule::unique('departments', 'code')->ignore($this->route('department'), 'deptid'),
                new \App\Rules\DepartmentCodeRule(),
            ],
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive',
            'sort_order' => 'nullable|integer|min:0|max:9999',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Department name is required.',
            'code.required' => 'Department code is required.',
            'code.unique' => 'This department code is already in use.',
            'status.required' => 'Department status is required.',
            'status.in' => 'Department status must be either active or inactive.',
        ];
    }
}