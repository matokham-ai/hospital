<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDrugFormularyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->can('update drug formulary');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $drugFormulary = $this->route('drugFormulary');
        
        return [
            'name' => 'required|string|max:255',
            'generic_name' => 'required|string|max:255',
            'atc_code' => ['nullable', 'string', 'max:20', new \App\Rules\AtcCodeRule()],
            'strength' => 'required|string|max:100|regex:/^[\d\.]+(mg|g|ml|mcg|IU|%)\s*(\/\s*[\d\.]+(mg|g|ml|mcg|IU|%)?)?$/',
            'form' => 'required|in:tablet,capsule,syrup,injection,cream,ointment,drops,inhaler,powder,gel,patch,spray',
            'stock_quantity' => 'required|integer|min:0|max:999999',
            'reorder_level' => 'required|integer|min:0|max:999999',
            'unit_price' => 'required|numeric|min:0|max:99999.99',
            'manufacturer' => 'nullable|string|max:255',
            'status' => 'required|in:active,discontinued',
            'substitute_ids' => 'nullable|array|max:10',
            'substitute_ids.*' => [
                'exists:drug_formulary,id',
                function ($attribute, $value, $fail) use ($drugFormulary) {
                    if ($drugFormulary && $value == $drugFormulary->id) {
                        $fail('A drug cannot be a substitute for itself.');
                    }
                },
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Drug name is required.',
            'generic_name.required' => 'Generic name is required.',
            'atc_code.regex' => 'ATC code must follow the format: A00AA00 (e.g., A02BC01).',
            'strength.required' => 'Drug strength is required.',
            'form.required' => 'Drug form is required.',
            'form.in' => 'Invalid drug form selected.',
            'stock_quantity.required' => 'Stock quantity is required.',
            'stock_quantity.min' => 'Stock quantity must be at least 0.',
            'reorder_level.required' => 'Reorder level is required.',
            'reorder_level.min' => 'Reorder level must be at least 0.',
            'unit_price.required' => 'Unit price is required.',
            'unit_price.min' => 'Unit price must be at least 0.',
            'status.required' => 'Drug status is required.',
            'status.in' => 'Invalid drug status selected.',
            'substitute_ids.array' => 'Substitute IDs must be an array.',
            'substitute_ids.*.exists' => 'One or more substitute drug IDs do not exist.',
        ];
    }
}