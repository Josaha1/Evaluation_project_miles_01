<?php
namespace Database\Seeders\Traits;

use App\Models\Question;
use App\Models\QuestionMatrixOption;
use App\Models\QuestionOption;
use App\Models\QuestionRatingScale;

trait SurveySeederTrait
{
    protected function generateQuestionCode($baseCode, $surveyTypeId, $sectionOrderIndex = null)
    {
        $suffix = "st{$surveyTypeId}";
        if ($sectionOrderIndex) {
            $suffix .= "_s{$sectionOrderIndex}";
        }
        return "{$baseCode}_{$suffix}";
    }

    protected function createQuestionWithOptions($section, $config, $options = [])
    {
        $question = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $config['code'],
            'question_text'     => $config['question_text'],
            'description'       => $config['description'] ?? null,
            'question_type'     => $config['question_type'],
            'is_required'       => $config['is_required'] ?? true,
            'order_index'       => $config['order_index'],
            'validation_rules'  => $config['validation_rules'] ?? null,
            'conditional_logic' => $config['conditional_logic'] ?? null,
            'skip_logic'        => $config['skip_logic'] ?? null,
            'help_text'         => $config['help_text'] ?? null,
        ]);

        if (! empty($options)) {
            foreach ($options as $index => $option) {
                QuestionOption::create([
                    'question_id'    => $question->id,
                    'option_text'    => is_array($option) ? $option['text'] : $option,
                    'option_value'   => $index + 1,
                    'sort_order'     => $index + 1,
                    'has_text_input' => is_array($option) ? ($option['has_text_input'] ?? false) : false,
                    'skip_config' => is_array($option) ? ($option['skip_config'] ?? null) : null,
                ]);
            }
        }

        return $question;
    }

    protected function createMatrixQuestion($section, $config, $rows, $columns, $ratingScale = null)
    {
        $question = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $config['code'],
            'question_text'       => $config['question_text'],
            'description'         => $config['description'] ?? null,
            'question_type'       => $config['question_type'],
            'is_required'         => $config['is_required'] ?? true,
            'order_index'         => $config['order_index'],
            'matrix_row_label'    => $config['matrix_row_label'] ?? 'ประเด็น',
            'matrix_column_label' => $config['matrix_column_label'] ?? 'คำตอบ',
            'conditional_logic'   => $config['conditional_logic'] ?? null,
            'skip_logic'          => $config['skip_logic'] ?? null,
        ]);

        // เชื่อม Rating Scale (ถ้ามี)
        if ($ratingScale) {
            QuestionRatingScale::create([
                'question_id'     => $question->id,
                'rating_scale_id' => $ratingScale->id,
                'scale_type'      => $config['scale_type'] ?? 'default',
            ]);
        }

        // สร้าง rows
        foreach ($rows as $index => $row) {
            QuestionMatrixOption::create([
                'question_id'    => $question->id,
                'type'           => 'row',
                'value'          => is_array($row) ? $row['value'] : "row_" . ($index + 1),
                'label'          => is_array($row) ? $row['label'] : $row,
                'has_text_input' => is_array($row) ? ($row['has_text_input'] ?? false) : false,
                'order_index'    => $index + 1,
                'extra_config'   => is_array($row) ? json_encode($row['config'] ?? []) : null,
            ]);
        }

        // สร้าง columns
        foreach ($columns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id'  => $question->id,
                'type'         => 'column',
                'value'        => is_array($column) ? $column['value'] : "col_" . ($index + 1),
                'label'        => is_array($column) ? $column['label'] : $column,
                'order_index'  => $index + 1,
                'extra_config' => is_array($column) ? json_encode($column['config'] ?? []) : null,
            ]);
        }

        return $question;
    }

    protected function createDualRatingQuestion($section, $config, $expectationScale, $satisfactionScale, $topics)
    {
        $question = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $config['code'],
            'question_text'     => $config['question_text'],
            'description'       => $config['description'] ?? null,
            'question_type'     => 'dual_rating_scale',
            'is_required'       => $config['is_required'] ?? true,
            'order_index'       => $config['order_index'],
            'conditional_logic' => $config['conditional_logic'] ?? null,
            'skip_logic'        => $config['skip_logic'] ?? null,
        ]);

        // เชื่อม Rating Scales
        QuestionRatingScale::create([
            'question_id'     => $question->id,
            'rating_scale_id' => $expectationScale->id,
            'scale_type'      => 'expectation',
        ]);

        QuestionRatingScale::create([
            'question_id'     => $question->id,
            'rating_scale_id' => $satisfactionScale->id,
            'scale_type'      => 'satisfaction',
        ]);

        // สร้าง rows พร้อมจัดกลุ่ม
        $orderIndex = 1;

        foreach ($topics as $topicGroup) {
            if (is_array($topicGroup) && isset($topicGroup['group']) && isset($topicGroup['items'])) {
                foreach ($topicGroup['items'] as $subIndex => $itemLabel) {
                    QuestionMatrixOption::create([
                        'question_id' => $question->id,
                        'type'        => 'row',
                        'value'       => 'topic_' . $orderIndex,
                        'label'       => $itemLabel,
                        'order_index' => $orderIndex,
                        'group'       => $topicGroup['group'], // ⚠️ ต้องมีฟิลด์ group ใน DB ด้วย
                    ]);
                    $orderIndex++;
                }
            } else {
                // fallback: ถ้าไม่ใช่ array group
                QuestionMatrixOption::create([
                    'question_id' => $question->id,
                    'type'        => 'row',
                    'value'       => 'topic_' . $orderIndex,
                    'label'       => is_array($topicGroup) ? $topicGroup['label'] : $topicGroup,
                    'order_index' => $orderIndex,
                    'group'       => null,
                ]);
                $orderIndex++;
            }
        }

        return $question;
    }

    protected function getStandardChannelOptions()
    {
        return [
            ['text' => 'เว็บไซต์ของ กปน.', 'has_text_input' => false],
            ['text' => 'เฟซบุ๊ก / โซเชียลมีเดียของ กปน.', 'has_text_input' => false],
            ['text' => 'จดหมายข่าว / อีเมล', 'has_text_input' => false],
            ['text' => 'การประชุม/เวทีความร่วมมือ', 'has_text_input' => false],
            ['text' => 'รายงานประจำปี', 'has_text_input' => false],
            ['text' => 'การติดต่อเฉพาะราย', 'has_text_input' => false],
            ['text' => 'ข่าวประชาสัมพันธ์จากสื่อมวลชน', 'has_text_input' => false],
            ['text' => 'บุคลากรของ กปน.', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];
    }

    protected function getStandardFrequencyOptions()
    {
        return [
            'ไม่เคยได้รับ',
            '1-3 ครั้งต่อเดือน',
            '2-3 ครั้งต่อเดือน',
            '4-5 ครั้งต่อเดือน',
            'มากกว่า 5 ครั้งต่อเดือน',
        ];
    }

    protected function getStandardNeedsColumns()
    {
        return [
            ['value' => 'high', 'label' => 'ต้องการมาก'],
            ['value' => 'medium', 'label' => 'ต้องการ'],
            ['value' => 'neutral', 'label' => 'ปานกลาง'],
            ['value' => 'low', 'label' => 'ไม่ค่อยต้องการ'],
            ['value' => 'none', 'label' => 'ไม่ต้องการเลย'],
        ];
    }

    protected function getAwarenessColumns()
    {
        return [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];
    }
}
