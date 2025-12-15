<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateBedsRequest extends FormRequest
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
            'bed_updates' => 'required|array',
            'bed_updates.*.bed_id' => 'required|exists:beds,id',
            'bed_updates.*.status' => 'required|in:available,occupied,maintenance,reserved,out_of_order',
            'bed_updates.*.maintenance_notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'bed_updates.required' => 'Bed updates are required.',
            'bed_updates.array' => 'Bed updates must be an array.',
            'bed_updates.*.bed_id.required' => 'Bed ID is required for each update.',
            'bed_updates.*.bed_id.exists' => 'One or more bed IDs do not exist.',
            'bed_updates.*.status.required' => 'Status is required for each bed update.',
            'bed_updates.*.status.in' => 'Invalid bed status provided.',
        ];
    }
}