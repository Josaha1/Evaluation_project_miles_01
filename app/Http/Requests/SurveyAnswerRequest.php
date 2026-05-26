<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SurveyAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'answers' => 'required|array',
            'answers.*' => 'nullable',
        ];
    }

    public function messages(): array
    {
        return [
            'answers.required' => 'กรุณาระบุคำตอบ',
            'answers.array' => 'รูปแบบข้อมูลไม่ถูกต้อง',
        ];
    }
}