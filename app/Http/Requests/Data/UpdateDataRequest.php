<?php

namespace App\Http\Requests\Data;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDataRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => ['required', 'max:191'],
            'records' => ['array', 'min:1'],
            'records.*.type' => ['required', Rule::in(['text', 'textarea', 'boolean'])],
            'records.*.name' => ['required', 'max:191'],
            'records.*.value' => ['nullable'],
        ];
    }
}
