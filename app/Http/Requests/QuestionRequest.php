<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Question;

class QuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'survey_section_id' => 'required|exists:survey_sections,id',
            'survey_group_id' => 'nullable|exists:survey_groups,id',
            'question_text' => 'required|string|max:1000',
            'question_type' => 'required|in:' . implode(',', array_keys(Question::QUESTION_TYPES)),
            'is_required' => 'boolean',
            'order_index' => 'integer|min:0',
            'options' => 'nullable|array',
            'options.*.value' => 'required_with:options|string',
            'options.*.label' => 'required_with:options|string',
            'validation_rules' => 'nullable|array',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'survey_section_id.required' => 'กรุณาเลือกส่วนของแบบสำรวจ',
            'survey_section_id.exists' => 'ส่วนของแบบสำรวจไม่ถูกต้อง',
            'question_text.required' => 'กรุณาระบุข้อความคำถาม',
            'question_type.required' => 'กรุณาเลือกประเภทคำถาม',
            'question_type.in' => 'ประเภทคำถามไม่ถูกต้อง',
        ];
    }
}
