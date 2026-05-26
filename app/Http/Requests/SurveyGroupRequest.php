<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SurveyGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'order_index' => 'integer|min:0',
            'is_active'   => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'       => 'กรุณาระบุชื่อกลุ่ม',
            'name.max'            => 'ชื่อกลุ่มต้องไม่เกิน 255 ตัวอักษร',
            'description.max'     => 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร',
            'order_index.integer' => 'ลำดับต้องเป็นตัวเลข',
            'order_index.min'     => 'ลำดับต้องมากกว่าหรือเท่ากับ 0',
        ];
    }
}
