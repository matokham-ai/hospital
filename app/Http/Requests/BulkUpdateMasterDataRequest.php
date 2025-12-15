<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateMasterDataRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->can('bulk update master data');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'entity_type' => 'required|in:departments,wards,beds,test_catalogs,drug_formulary',
            'updates' => 'required|array|min:1|max:100',
            'updates.*.id' => 'required|integer',
            'updates.*.data' => 'required|array',
            'force_update' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'entity_type.required' => 'Entity type is required.',
            'entity_type.in' => 'Invalid entity type selected.',
            'updates.required' => 'Updates array is required.',
            'updates.min' => 'At least one update is required.',
            'updates.max' => 'Cannot update more than 100 records at once.',
            'updates.*.id.required' => 'ID is required for each update.',
            'updates.*.data.required' => 'Data is required for each update.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $entityType = $this->entity_type;
            $updates = $this->updates ?? [];

            // Validate entity existence based on type
            foreach ($updates as $index => $update) {
                $id = $update['id'] ?? null;
                if ($id) {
                    $exists = match ($entityType) {
                        'departments' => \App\Models\Department::where('id', $id)->exists(),
                        'wards' => \App\Models\Ward::where('id', $id)->exists(),
                        'beds' => \App\Models\Bed::where('id', $id)->exists(),
                        'test_catalogs' => \App\Models\TestCatalog::where('id', $id)->exists(),
                        'drug_formulary' => \App\Models\DrugFormulary::where('id', $id)->exists(),
                        default => false,
                    };

                    if (!$exists) {
                        $validator->errors()->add("updates.{$index}.id", "The {$entityType} with ID {$id} does not exist.");
                    }
                }
            }

            // Check for duplicate IDs in the same request
            $ids = collect($updates)->pluck('id')->filter();
            $duplicates = $ids->duplicates();
            if ($duplicates->isNotEmpty()) {
                $validator->errors()->add('updates', 'Duplicate IDs found in updates: ' . $duplicates->implode(', '));
            }
        });
    }
}
