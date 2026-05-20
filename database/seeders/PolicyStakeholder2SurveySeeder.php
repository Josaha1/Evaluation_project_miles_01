<?php
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ (Survey Type 2)
 * - มีคำถามเฉพาะเจาะจงเกี่ยวกับความร่วมมือทางภารกิจ
 */
class PolicyStakeholder2SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 2;

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
        // 1.3 หน่วยงานของท่านมีบทบาทเกี่ยวข้องกับ กปน. อย่างไร 
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
            ['text' => '1) งานวางแผนร่วม', 'has_text_input' => false],
            ['text' => '2) งานก่อสร้าง/โยธา', 'has_text_input' => false],
            ['text' => '3) การให้บริการข้อมูล', 'has_text_input' => false],
            ['text' => '4) การจัดการน้ำเสีย/สิ่งแวดล้อม', 'has_text_input' => false],
             ['text' => '5) งานประชาสัมพันธ์', 'has_text_input' => false],
            ['text' => '6) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true, 'requires_text' => true],
        ]);

        // 1.4 ระยะเวลาที่ท่านหรือหน่วยงานของท่านมีความเกี่ยวข้องกับ กปน.
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('cooperation_duration', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.4 ระยะเวลาที่ท่านหรือหน่วยงานของท่านมีความเกี่ยวข้องกับ กปน.',
            'question_type' => 'multiple_choice',
            'order_index'   => 4,
        ], ['น้อยกว่า 1 ปี', '1-3 ปี', 'มากกว่า 3 ปี', 'มากกว่า 6 ปี']);

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
        // 2.1 ท่านรับรู้ข้อมูลข่าวสารจาก กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_channels', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.1 ท่านรับรู้ข้อมูลข่าวสารจาก กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)',
            'question_type' => 'checkbox',
            'order_index'   => 1,
        ], $this->getStandardChannelOptions());

        // 2.2 ท่านมีความต้องการในการรับรู้ข้อมูลข่าวสารจาก กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_want', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.2 ท่านมีความต้องการในการรับรู้ข้อมูลข่าวสารจาก กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)',
            'question_type' => 'checkbox',
            'order_index'   => 2,
        ], $this->getStandardChannelOptions());

        // 2.3 ความถี่ในการได้รับข้อมูลหรือรายงานจาก กปน.
         $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_frequency', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.3 ความถี่ในการได้รับข้อมูลหรือรายงานจาก กปน.',
            'question_type' => 'multiple_choice',
            'order_index'   => 3,
        ], $this->getStandardFrequencyOptions());

        //2.4 ท่านคิดว่าข้อมูลข่าวสารที่ได้รับจาก กปน. มีความน่าเชื่อถือเพียงใด?
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('info_credibility', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.4 ท่านคิดว่าข้อมูลข่าวสารที่ได้รับจาก กปน. มีความน่าเชื่อถือเพียงใด?',
            'question_type' => 'multiple_choice',
            'order_index'   => 4,
        ], ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย', 'ไม่น่าเชื่อถือเลย']);

        // 2.5 เนื้อหาของข่าวสารจาก กปน. มีความชัดเจน เข้าใจง่ายหรือไม่?
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('content_clarity', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.5 เนื้อหาของข่าวสารจาก กปน. มีความชัดเจน เข้าใจง่ายหรือไม่?',
            'question_type' => 'multiple_choice',
            'order_index'   => 5,
        ], ['ชัดเจนมาก', 'ค่อนข้างชัดเจน', 'ปานกลาง', 'ไม่ชัดเจน', 'ไม่เข้าใจเลย']);

        // Matrix Questions สำหรับภารกิจ
        $this->createMissionAwarenessMatrix($section);
        $this->createMissionNeedsMatrix($section);
    }

    private function createMissionAwarenessMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) แผนงานการบำรุงรักษาท่อ/โครงข่ายน้ำในพื้นที่', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) การหยุดจ่ายน้ำ / น้ำไหลอ่อนในเขตพื้นที่รับผิดชอบ', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) ข้อมูลคุณภาพน้ำที่อาจส่งผลกระทบต่อสาธารณสุขหรือสิ่งแวดล้อม', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ช่องทางแจ้งเหตุหรือการประสานงานฉุกเฉินกับ กปน.', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การร่วมดำเนินโครงการ CSR หรือกิจกรรมพัฒนาชุมชนร่วมกัน', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) แนวทางร่วมมือในการวางแผนงานระหว่างหน่วยงาน', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสาร   ต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('mission_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.6 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 6,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
        ], $missionTopics, $this->getAwarenessColumns());
    }

    private function createMissionNeedsMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) แผนงานการบำรุงรักษาท่อ/โครงข่ายน้ำในพื้นที่', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) การหยุดจ่ายน้ำ / น้ำไหลอ่อนในเขตพื้นที่รับผิดชอบ', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) ข้อมูลคุณภาพน้ำที่อาจส่งผลกระทบต่อสาธารณสุขหรือสิ่งแวดล้อม', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ช่องทางแจ้งเหตุหรือการประสานงานฉุกเฉินกับ กปน.', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การร่วมดำเนินโครงการ CSR หรือกิจกรรมพัฒนาชุมชนร่วมกัน', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) แนวทางร่วมมือในการวางแผนงานระหว่างหน่วยงาน', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสาร   ต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('mission_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.7 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น',
            'question_type'       => 'matrix',
            'order_index'         => 7,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
        ], $missionTopics, $this->getStandardNeedsColumns());
    }

    private function createSection3Questions($section)
    {

        $topics = [
            '1) ความชัดเจนของการประสานงาน',
            '2) ความรวดเร็วในการดำเนินงาน',
            '3) ความถูกต้องของข้อมูล',
            '4) ความสามารถในการแก้ไขปัญหา ',
            '5) การมีส่วนร่วมในการวางแผน/ตัดสินใจ ',
            '6) ความโปร่งใสในการบริหารงาน',
            '7) คุณภาพของการบริการโดยภาพรวม',
        ];

        $this->createDualRatingQuestion($section, [
            'code'          => $this->generateQuestionCode('standard_expectation_satisfaction', $this->surveyTypeId, $section->order_index),
            'question_text' => '3.1 กรุณาประเมินความคาดหวังและความพึงพอใจของท่านต่อหัวข้อด้านล่าง โดยให้คะแนนในระดับ 1-5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
            'order_index'   => 1,
        ], $this->ratingScales['expectation'], $this->ratingScales['satisfaction'], $topics);
    }

    private function createSection4Questions($section)
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
        $this->createConfidenceMatrix($section);
        $this->createWaterQualityConcernQuestion($section);
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
                'label' => '3) กปน. สนับสนุนการดำเนินงานที่เกี่ยวกับความรับผิดชอบต่อสังคม และสิ่งแวดล้อม เช่น โครงการช่างประปาเพื่อประชาชน และโครงการเสริมสร้างความเข้มแข็งของชุมชนสำคัญ',
            ],
            [
                'value' => 'leadership_confidence',
                'label' => '4) ความสามารถในการบริหารจัดการน้ำประปาอย่างมีประสิทธิภาพ',
            ],
            [
                'value' => 'digital_confidence',
                'label' => '5) ความพร้อมในการรับฟังความคิดเห็นและตอบสนองต่อข้อเสนอแนะ',
            ],
            [
                'value' => 'social_impact_confidence',
                'label' => '6) ความเชื่อมั่นในวิสัยทัศน์และทิศทางการพัฒนาองค์กร',
            ],
            [
                'value' => 'complaint_confidence',
                'label' => '7) การจัดการปัญหาเรื่องร้องเรียนและการทุจริตของ กปน.',
            ],
            [
                'value' => 'uplife_confidence',
                'label' => '8) โครงการต่าง ๆ ของ กปน. เช่น โครงการปรับปรุงเส้นท่อประปา โครงการปรับปรุงกิจการประปาแผนหลัก มีส่วนช่วยในการยกระดับคุณภาพชีวิตให้ดีขึ้น',
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

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('confidence_level', $this->surveyTypeId, $section->order_index),
            'question_text'       => '5.1 ท่านมีระดับความเชื่อมั่นต่อ กปน. อย่างไรบ้าง',
            'description'         => 'กรุณาให้ระดับความเชื่อมั่น โดยที่ 1 หมายถึง เชื่อมั่นน้อยที่สุด 2 หมายถึง เชื่อมั่นน้อย 3 หมายถึง เชื่อมั่นปานกลาง 4 หมายถึง เชื่อมั่นมาก และ 5 หมายถึง เชื่อมั่นมากที่สุด',
            'question_type'       => 'matrix',
            'order_index'         => 1,

            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความเชื่อมั่น กปน.',
            'scale_type'          => 'confidence',
        ], $topics, $ratingColumns, $this->ratingScales['confidence']);
    }

    private function createWaterQualityConcernQuestion($section)
    {
        $concerns = [
            ['text' => 'ไม่มั่นใจในระบบผลิตน้ำประปาของโรงงาน', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของเส้นท่อ กปน.', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของระบบประปา หรือถังพักน้ำภายในบ้าน', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('water_quality_concern', $this->surveyTypeId, $section->order_index),
            'question_text' => '5.1.1 ทำไมท่านถึงไม่เชื่อมั่นว่าน้ำประปาสะอาด ดื่มได้',
            'question_type' => 'checkbox',
            'is_required'   => false,
            'order_index'   => 2,
            'description'   => 'หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1',
        ], $concerns);
    }

    private function createSection6Questions($section)
    {
        $this->createGeneralSuggestionQuestions($section);
    }
}
