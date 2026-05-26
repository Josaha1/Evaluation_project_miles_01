<?php
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มหน่วยงานเชิงนโยบายและผู้ถือหุ้นภาครัฐ (Survey Type 1)
 */
class PolicyStakeholder1SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 1;

    protected function getSectionTemplates()
    {
        return $this->getStandardSectionTemplates();
    }

    protected function createQuestionsForSection($section, $sectionOrderIndex)
    {
        switch ($sectionOrderIndex) {
            case 1:
                $this->createSection1Questions($section);
                break;
            case 2:
                $this->createSection2Questions($section);
                break;
            case 3:
                $this->createSection3Questions($section);
                break;
            case 4:
                $this->createSection4Questions($section);
                break;
            case 5:
                $this->createSection5Questions($section);
                break;
            case 6:
                $this->createSection6Questions($section);
                break;
        }
    }

    private function createSection1Questions($section)
    {
        // ชื่อหน่วยงาน
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('org_name', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.1 ชื่อหน่วยงาน',
            'question_type' => 'text_short',
            'order_index'   => 1,
        ]);

        // ตำแหน่งของผู้ตอบแบบสอบถาม
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('respondent_position', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.2 ตำแหน่งของผู้ตอบแบบสอบถาม',
            'question_type' => 'text_short',
            'order_index'   => 2,
        ]);

        // บทบาทเกี่ยวข้องกับ กปน.
        $this->createQuestionWithOptions($section, [
            'code'             => $this->generateQuestionCode('org_role', $this->surveyTypeId, $section->order_index),
            'question_text'    => '1.3 หน่วยงานของท่านมีบทบาทเกี่ยวข้องกับ กปน. อย่างไร ',
            'question_type'    => 'multiple_choice',
            'order_index'      => 3,
            'validation_rules' => [
                'required_if_selected' => [
                    'option_text' => 'อื่น ๆ (โปรดระบุ)',
                    'message'     => 'กรุณาระบุบทบาทเกี่ยวข้องกับ กปน.',
                ],
            ],
        ], [
            ['text' => 'กำกับดูแลเชิงนโยบาย', 'has_text_input' => false],
            ['text' => 'วางแผน/ประเมินผลการดำเนินงาน', 'has_text_input' => false],
            ['text' => 'ตรวจสอบธรรมาภิบาล/การบริหารความเสี่ยง', 'has_text_input' => false],
            ['text' => 'ผู้สนับสนุนเชิงงบประมาณ/ทรัพยากร', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true, 'requires_text' => true],
        ]);

        // ระยะเวลาที่เกี่ยวข้องกับ กปน.
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('relationship_duration', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.4 ระยะเวลาที่ท่านหรือหน่วยงานของท่านมีความเกี่ยวข้องกับ กปน.',
            'question_type' => 'multiple_choice',
            'order_index'   => 4,
        ], ['น้อยกว่า 1 ปี', '1-3 ปี', '4-6 ปี', 'มากกว่า 6 ปี']);

        // การให้ข้อเสนอแนะ
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('feedback_history', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.5 ท่านหรือหน่วยงานของท่านเคยมีการให้ข้อเสนอแนะหรือความเห็นต่อ กปน. หรือไม่',
            'question_type' => 'multiple_choice',
            'order_index'   => 5,
        ], [
            'เคย และได้รับการตอบสนอง',
            'เคย แต่ยังไม่ได้รับรายงานผลการดำเนินการ',
            'ไม่เคยให้ข้อเสนอแนะ',
        ]);
    }

    private function createSection2Questions($section)
    {
        // 2.1 ความถี่ในการได้รับข้อมูลข่าวสารหรือรายงานข่าวสารจาก กปน.
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_frequency', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.1 ความถี่ในการได้รับข้อมูลข่าวสารหรือรายงานข่าวสารจาก กปน.',
            'question_type' => 'multiple_choice',
            'order_index'   => 1,
        ], $this->getStandardFrequencyOptions());

        // ช่องทางการได้รับข้อมูล
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_channels', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.2 ท่านได้รับข้อมูลข่าวสารของ กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)',
            'question_type' => 'checkbox',
            'order_index'   => 2,
        ], $this->getStandardChannelOptions());

        // 2.3 ท่านมีความต้องการได้รับข้อมูลข่าวสารของ กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_clarity_chanel', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.3 ท่านมีความต้องการได้รับข้อมูลข่าวสารของ กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)',
            'question_type' => 'checkbox',
            'order_index'   => 3,
        ], $this->getStandardChannelOptions());

        // 2.4 ข้อมูลใดที่ท่านเห็นว่ายัง “ไม่ครอบคลุม” หรือ “ไม่ชัดเจน” (เลือกได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_clarity', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.4 ข้อมูลใดที่ท่านเห็นว่ายัง “ไม่ครอบคลุม” หรือ “ไม่ชัดเจน” (เลือกได้มากกว่า 1 ข้อ)',
            'question_type' => 'checkbox',
            'order_index'   => 4,
        ], [
            ['text' => 'ข้อมูลทางการเงินและงบประมาณ', 'has_text_input' => false],
            ['text' => 'แผนการพัฒนาองค์กรระยะยาว', 'has_text_input' => false],
            ['text' => 'รายงานผลกระทบต่อสิ่งแวดล้อม / ESG', 'has_text_input' => false],
            ['text' => 'ความเสี่ยงเชิงระบบ (Systematic Risk)', 'has_text_input' => false],
            ['text' => 'ความก้าวหน้าเชิงนวัตกรรม/เทคโนโลยี', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

        // 2.5 ท่านต้องการให้ กปน. ปรับปรุงหรือเพิ่มช่องทางการสื่อสารในรูปแบบใด (เลือกได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('communication_improvement', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.5 ท่านต้องการให้ กปน. ปรับปรุงหรือเพิ่มช่องทางการสื่อสารในรูปแบบใด (เลือกได้มากกว่า 1 ข้อ)',
            'question_type' => 'checkbox',
            'order_index'   => 5,
        ], [
            ['text' => 'Policy Brief รายประเด็น', 'has_text_input' => false],
            ['text' => 'Executive Summary สรุปประเด็นเชิงกลยุทธ์', 'has_text_input' => false],
            ['text' => 'Dashboard สำหรับหน่วยงานกำกับ', 'has_text_input' => false],
            ['text' => 'เวทีแลกเปลี่ยนข้อมูลประจำปี', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

        // สร้าง Matrix Questions สำหรับการรับรู้และความต้องการ
        $this->createGeneralAwarenessMatrix($section);
        $this->createGeneralNeedsMatrix($section);
    }

    private function createGeneralAwarenessMatrix($section)
    {
        $topics = [
            ['value' => 'topic_1', 'label' => '1) นโยบายและยุทธศาสตร์องค์กรของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) รายงานผลการดำเนินงานประจำปี และตัวชี้วัดหลัก (KPIs)', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) ความคืบหน้าโครงการลงทุนและโครงสร้างพื้นฐาน', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) งบประมาณ และแผนการใช้จ่ายรายโครงการ', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การบริหารความเสี่ยง และการรับมือกับภาวะวิกฤต', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การดำเนินงานด้านธรรมาภิบาล การส่งเสริมจริยธรรม และมาตรการป้องกันการทุจริต', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การมีส่วนร่วมของหน่วยงานภาครัฐในกิจกรรมของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ความคืบหน้าการบรรลุเป้าหมาย SDGs ด้านน้ำ', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทต่าง ๆ กิจกรรมสำคัญ และผลการดำเนินงาน', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('general_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.6 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 6,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
            'validation_rules'    => [
                'matrix_text_required' => [
                    'rows_with_text' => ['topic_11'],
                    'message'        => 'กรุณาระบุข้อมูลเพิ่มเติมในข้อ "อื่นๆ"',
                ],
            ],
        ], $topics, $this->getAwarenessColumns());

    }

    private function createGeneralNeedsMatrix($section)
    {
        $topics = [
            ['value' => 'topic_1', 'label' => '1) นโยบายและยุทธศาสตร์องค์กรของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) รายงานผลการดำเนินงานประจำปี และตัวชี้วัดหลัก (KPIs)', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) ความคืบหน้าโครงการลงทุนและโครงสร้างพื้นฐาน', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) งบประมาณ และแผนการใช้จ่ายรายโครงการ', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การบริหารความเสี่ยง และการรับมือกับภาวะวิกฤต', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การดำเนินงานด้านธรรมาภิบาล การส่งเสริมจริยธรรม และมาตรการป้องกันการทุจริต', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การมีส่วนร่วมของหน่วยงานภาครัฐในกิจกรรมของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ความคืบหน้าการบรรลุเป้าหมาย SDGs ด้านน้ำ', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทต่าง ๆ กิจกรรมสำคัญ และผลการดำเนินงาน', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('general_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.7 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น ',
            'question_type'       => 'matrix',
            'order_index'         => 7,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
            'validation_rules'    => [
                'matrix_text_required' => [
                    'rows_with_text' => ['topic_11'],
                    'message'        => 'กรุณาระบุข้อมูลเพิ่มเติมในข้อ "อื่นๆ"',
                ],
            ],
        ], $topics, $this->getStandardNeedsColumns());
    }

    private function createSection3Questions($section)
    {
        $topics = [
            '1) ความสอดคล้องของการดำเนินงานกับนโยบายภาครัฐ',
            '2) ความมีประสิทธิภาพของการบริหารจัดการองค์กร',
            '3) ความสามารถในการให้ข้อมูลสำหรับการกำกับดูแลและประเมินผล',
            '4) ความโปร่งใสในการบริหารงาน',
            '5) การดำเนินโครงการหรือกิจกรรมที่สอดคล้องกับเป้าหมายการพัฒนาที่ยั่งยืน (SDGs)',
            '6) การบริหารจัดการในภาวะวิกฤต (ภัยแล้ง, น้ำเค็ม ฯลฯ)',
        ];

        $this->createDualRatingQuestion($section, [
            'code'          => $this->generateQuestionCode('standard_expectation_satisfaction', $this->surveyTypeId, $section->order_index),
            'question_text' => '3.1 กรุณาประเมินความคาดหวังและความพึงพอใจของท่านต่อหัวข้อด้านล่าง โดยให้คะแนนในระดับ 1-5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
            'order_index'   => 1,
        ], $this->ratingScales['expectation'], $this->ratingScales['satisfaction'], $topics);
    }

    private function createSection4Questions($section)
    {
        $this->createComparisonMatrix($section);
    }

    private function createComparisonMatrix($section)
    {
        $topics = [
            'ด้านเนื้อหาของข่าวสารที่นำเสนอ',
            'ด้านรูปแบบของข่าวสารที่นำเสนอ',
            'ด้านช่องทางที่ใช้ในการนำเสนอข่าวสาร',
        ];

        $organizations = [
            ['value' => 'mwa', 'label' => 'กปน.'],
            ['value' => 'egat', 'label' => 'กฟน.'],
            ['value' => 'pwa', 'label' => 'กปภ.'],
        ];

        $this->createMatrixQuestion($section, [
            'code'          => $this->generateQuestionCode('organization_comparison', $this->surveyTypeId, $section->order_index),
            'question_text' => '4.1 หากท่านต้องประเมินผลการดำเนินงานด้านประชาสัมพันธ์ขององค์กรต่อไปนี้ เปรียบเทียบกับ กปน. ในภาพรวมท่านจะให้คะแนนความพึงพอใจในแต่ละเรื่องต่อไปนี้ในระดับเท่าใด',
            'description'   => 'โดยที่ 1 หมายถึง พึงพอใจน้อยที่สุด 2 หมายถึง พึงพอใจน้อย 3 หมายถึง พึงพอใจปานกลาง 4 หมายถึง พึงพอใจมาก และ 5 หมายถึง พึงพอใจมากที่สุด',
            'question_type' => 'comparison_table',
            'order_index'   => 1,
        ], $topics, $organizations, $this->ratingScales['satisfaction']);
    }

    private function createSection5Questions($section)
    {
        $confidenceQuestionId = $this->createConfidenceMatrix($section);
        $concernQuestionId    = $this->createWaterQualityConcernQuestion($section);

    }

    private function createConfidenceMatrix($section)
    {
        $topics = [
            [
                'value' => 'water_quality_confidence',
                'label' => '1) น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก (หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1)',
            ],
            [
                'value' => 'transparency_confidence',
                'label' => '2) กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
            ],
            [
                'value' => 'budget_confidence',
                'label' => '3) กปน. ให้ความคุ้มค่าในการใช้งบประมาณภาครัฐ',
            ],
            [
                'value' => 'leadership_confidence',
                'label' => '4) กปน. มีความสามารถในการเป็นผู้นำด้านโครงสร้างพื้นฐานน้ำ',
            ],
            [
                'value' => 'digital_confidence',
                'label' => '5) กปน. พร้อมรับการเปลี่ยนแปลงสู่ยุคดิจิทัล (Digital Utility)',
            ],
            [
                'value' => 'social_impact_confidence',
                'label' => '6) กปน. สามารถสร้างผลกระทบเชิงบวกต่อเศรษฐกิจและสังคม',
            ],
            [
                'value' => 'complaint_confidence',
                'label' => '7)การจัดการปัญหาเรื่องร้องเรียนและการทุจริตของ กปน.',
            ],
            [
                'value' => 'project_confidence',
                'label' => '8) โครงการต่าง ๆ ของ กปน. เช่น โครงการปรับปรุงเส้นท่อ ประปา โครงการปรับปรุงกิจการประปาแผนหลัก มีส่วนช่วยในการยกระดับคุณภาพชีวิตให้ดีขึ้น',
            ],
        ];

        // Create rating columns (1-5)
        $ratingColumns = [];
        for ($i = 1; $i <= 5; $i++) {
            $ratingColumns[] = [
                'value'  => (string) $i,
                'label'  => (string) $i,
                'config' => [
                    'rating_value' => $i,
                    'scale_label'  => $this->ratingScales['confidence']->scale_labels[$i] ?? "ระดับ {$i}",
                ],
            ];
        }

        $question = $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('confidence_level', $this->surveyTypeId, $section->order_index),
            'question_text'       => '5.1 ท่านมีระดับความเชื่อมั่นต่อ กปน. อย่างไรบ้าง',
            'description'         => 'กรุณาให้ระดับความเชื่อมั่น โดยที่ 1 หมายถึง เชื่อมั่นน้อยที่สุด 2 หมายถึง เชื่อมั่นน้อย 3 หมายถึง เชื่อมั่นปานกลาง 4 หมายถึง เชื่อมั่นมาก และ 5 หมายถึง เชื่อมั่นมากที่สุด',
            'question_type'       => 'matrix',
            'order_index'         => 1,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความเชื่อมั่น กปน.',
            'scale_type'          => 'confidence',
        ], $topics, $ratingColumns, $this->ratingScales['confidence']);

        return $question->id;
    }

    private function createWaterQualityConcernQuestion($section)
    {
        $concerns = [
            ['text' => '1) ไม่มั่นใจในระบบผลิตน้ำประปาของโรงงาน', 'has_text_input' => false],
            ['text' => '2) ไม่มั่นใจในความสะอาดของเส้นท่อ กปน.', 'has_text_input' => false],
            ['text' => '3) ไม่มั่นใจในความสะอาดของระบบประปา หรือถังพักน้ำภายในบ้าน', 'has_text_input' => false],
            ['text' => '4) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        // ✅ FIXED: ปรับแก้ conditional logic ให้ตรงกับโครงสร้างข้อมูลจริง
        $conditionalLogic = [
            'type'       => 'show_if',
            'conditions' => [
                [
                    'question_code' => $this->generateQuestionCode('confidence_level', $this->surveyTypeId, $section->order_index),
                    'operator'      => 'matrix_rating_range',      // ✅ ใช้ operator ที่ถูกต้อง
                    'row_value'     => 'water_quality_confidence', // ✅ key ที่ตรงกับ matrix
                    'min_value'     => 1,
                    'max_value'     => 3,
                ],
            ],
        ];

        $question = $this->createQuestionWithOptions($section, [
            'code'              => $this->generateQuestionCode('water_quality_concern', $this->surveyTypeId, $section->order_index),
            'question_text'     => '5.1.1 ทำไมท่านถึงไม่เชื่อมั่นว่าน้ำประปาสะอาด ดื่มได้',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 2,
            'description'       => 'หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1',
            'conditional_logic' => $conditionalLogic,
        ], $concerns);

        return $question->id;
    }

    private function createSection6Questions($section)
    {
        // ข้อเสนอนโยบายใหม่
        $this->createQuestionWithOptions($section, [
            'code'             => $this->generateQuestionCode('policy_suggestion', $this->surveyTypeId, $section->order_index),
            'question_text'    => '6.1 หากท่านสามารถเสนอ “นโยบายใหม่” หรือแนวทางใหม่ให้ กปน. ได้ 1 ข้อ ท่านจะเสนออะไร และเพราะเหตุใด',
            'question_type'    => 'text_long',
            'is_required'      => false,
            'order_index'      => 1,
            'validation_rules' => ['max_length' => 1000],
        ]);

        // ข้อเสนอแนะเพิ่มเติมด้านการประชาสัมพันธ์
        $this->createQuestionWithOptions($section, [
            'code'             => $this->generateQuestionCode('policy_information', $this->surveyTypeId, $section->order_index),
            'question_text'    => '6.2 ข้อเสนอแนะเพิ่มเติมด้านการประชาสัมพันธ์ของ กปน.',
            'question_type'    => 'text_long',
            'is_required'      => false,
            'order_index'      => 2,
            'validation_rules' => ['max_length' => 1000],
        ]);
    }
}
