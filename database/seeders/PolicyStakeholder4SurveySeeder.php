<?php
// =================== PolicyStakeholder4SurveySeeder.php ===================
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มพนักงานและผู้ปฏิบัติ (Survey Type 4)
 */
class PolicyStakeholder4SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 4;

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
        // เพศ
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('gender', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.1 เพศ',
            'question_type'     => 'multiple_choice',
            'order_index'       => 1,
        ], ['ชาย', 'หญิง', 'เพศทางเลือก']);

        // อายุ
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('age', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.2 อายุ',
            'question_type'     => 'number',
            'order_index'       => 2,
            'validation_rules'  => ['min' => 15, 'max' => 100],
        ]);

        // ปัจจุบันท่านทำงานในสายงานใด
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('org_role', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.3 ปัจจุบันท่านทำงานในสายงานใด',
            'question_type' => 'multiple_choice',
            'order_index'   => 3,
        ], ['สายงานผู้ว่าการ', 'สายงานบริหาร', 'สายงานการเงิน', 'สายงานผลิตน้ำ', 'สายงานบริการด้านตะวันตก', 'สายงานวิศวกรรม', 'สายงานบริการด้านตะวันออก', 'สายงานแผนและพัฒนา', 'สายงานเทคโนโลยีดิจิทัล']);

        // ระดับ
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('level', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.4 ระดับ',
            'question_type' => 'multiple_choice',
            'order_index'   => 4,
        ], ['ผู้ปฏิบัติงาน', 'ระดับ 1-5', 'ระดับ 6-7', 'ระดับ 8', 'ระดับ 9', 'ระดับ 10 และเทียบเท่าขึ้นไป']);

        // สถานที่ปฏิบัติงาน
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('place_work', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.5 สถานที่ปฏิบัติงาน',
            'question_type'     => 'multiple_choice',
            'order_index'       => 5,
        ], [
            ['text' => 'สำนักงานใหญ่', 'has_text_input' => false],
            ['text' => 'สำนักงานประปาสาขา', 'has_text_input' => false],
            ['text' => 'โรงงานผลิตน้ำ', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
        // การศึกษาที่สำเร็จสูงสุด
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('education', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.6 การศึกษาที่สำเร็จสูงสุด',
            'question_type'     => 'multiple_choice',
            'order_index'       => 6,
        ], [
            'มัธยมศึกษาตอนต้นหรือต่ำกว่า',
            'มัธยมศึกษาตอนปลาย/ปวช.',
            'อนุปริญญา/ปวส.',
            'ปริญญาตรี',
            'สูงกว่าปริญญาตรี',
        ]);
    }

    private function createSection2Questions($section)
    {
        // 2.1 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยได้รับ/เคยเห็น/ เคยได้ยิน ข้อมูลข่าวสารจาก กปน. เช่น ข้อมูลข่าวสารเกี่ยวกับการรณรงค์ประหยัดน้ำ หรือ คุณภาพน้ำประปา หรือ ประกาศน้ำประปาไหลอ่อน-ไม่ไหล เป็นต้น หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.1 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยได้รับ/เคยเห็น/ เคยได้ยิน ข้อมูลข่าวสารจาก กปน. เช่น ข้อมูลข่าวสารเกี่ยวกับการรณรงค์ประหยัดน้ำ หรือ คุณภาพน้ำประปา หรือ ประกาศน้ำประปาไหลอ่อน-ไม่ไหล เป็นต้น หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 1,
        ], ['เคยได้รับ/เคยเห็น/ เคยได้ยิน', 'ไม่เคยได้รับ/ไม่เคยเห็น/ไม่เคยได้ยิน']);

        // 2.1.1 เพราะเหตุใดท่านจึง ไม่เคยได้รับ/ ไม่เคยเห็น/ ไม่เคยได้ยิน ข้อมูลข่าวสารจาก กปน. (ตอบได้มากกว่า 1 ข้อ) (ไปต่อส่วนที่ 5)
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.1.1 เพราะเหตุใดท่านจึง ไม่เคยได้รับ/ ไม่เคยเห็น/ ไม่เคยได้ยิน ข้อมูลข่าวสารจาก กปน. (ตอบได้มากกว่า 1 ข้อ) (ไปต่อส่วนที่ 5)',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 2,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
            'skip_logic'        => [
                'type'            => 'always_skip_to_section',
                'skip_to_section' => 5,
            ],
        ], [
            ['text' => '1) ไม่สามารถเข้าถึงช่องทางในการรับข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => '2) ไม่มีความสนใจในข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => '3) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
        // 2.2 ท่านรู้จัก/เคยเห็น/เคยได้ยิน “วิสัยทัศน์” ของ กปน. หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_hear_vision', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.2 ท่านรู้จัก/เคยเห็น/เคยได้ยิน “วิสัยทัศน์” ของ กปน. หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => false,
            'order_index'       => 3,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], [
            ['text' => '1) รู้จัก/เคยเห็น/เคยได้ยิน', 'has_text_input' => false],
            ['text' => '2) ไม่รู้จัก/ไม่เคยเห็น/ไม่เคยได้ยิน', 'has_text_input' => false],
        ]);

        // 2.3 ท่านทราบหรือไม่ว่า วิสัยทัศน์ของ กปน. ในปัจจุบัน คือข้อใดต่อไปนี้
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_vision', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.3 ท่านทราบหรือไม่ว่า วิสัยทัศน์ของ กปน. ในปัจจุบัน คือข้อใดต่อไปนี้',
            'question_type'     => 'multiple_choice',
            'is_required'       => false,
            'order_index'       => 4,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_vision', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], [
            ['text' => '1) เป็นองค์กรสมรรถนะสูงที่ให้บริการงานประปา มีธรรมาภิบาล และได้มาตรฐานในระดับสากล', 'has_text_input' => false],
            ['text' => '2) มุ่งสู่องค์กรที่เป็นเลิศและยั่งยืน ด้านการให้บริการและบริหารจัดการน้ำประปา', 'has_text_input' => false],
            ['text' => '3) ประปาคุณภาพ เพื่อชีวิตที่ดี (Quality Water for Quality Living)', 'has_text_input' => false],
            ['text' => '4) เป็นองค์กรให้บริการงานประปาอย่างมีคุณภาพ เพื่อวิถีชีวิตเมืองมหานคร', 'has_text_input' => false],
        ]);

        // 2.4 ท่านรู้จัก/เคยเห็น/เคยได้ยิน “ค่านิยม” ของ กปน. หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_hear_values', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.4 ท่านรู้จัก/เคยเห็น/เคยได้ยิน “ค่านิยม” ของ กปน. หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => false,
            'order_index'       => 5,
            'conditional_logic' => [
                'type'       => 'show_if',
                'operator'   => 'OR',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_vision', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_vision', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], [
            ['text' => '1) รู้จัก/เคยเห็น/เคยได้ยิน', 'has_text_input' => false],
            ['text' => '2) ไม่รู้จัก/ไม่เคยเห็น/ไม่เคยได้ยิน', 'has_text_input' => false],
        ]);

        // 2.5 ท่านทราบหรือไม่ว่าค่านิยมของ กปน. (QWATER) ในปัจจุบัน คือข้อใดต่อไปนี้
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_values', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.5 ท่านทราบหรือไม่ว่าค่านิยมของ กปน. (QWATER) ในปัจจุบัน คือข้อใดต่อไปนี้',
            'question_type'     => 'multiple_choice',
            'is_required'       => false,
            'order_index'       => 6,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_values', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], [
            ['text' => '1) มุ่งมั่นเพื่อปวงชน', 'has_text_input' => false],
            ['text' => '2) มุ่งเน้นลูกค้า โปร่งใส มีคุณธรรม ให้บริการด้วยประสิทธิภาพ', 'has_text_input' => false],
            ['text' => '3) มุ่งมั่น พัฒนาตน พัฒนางาน บริการสังคม ด้วยความโปร่งใส ใส่ใจคุณภาพ', 'has_text_input' => false],
            ['text' => '4) คุณภาพที่ยั่งยืน มุ่งมั่นเพื่อสิ่งที่ดียิ่งขึ้น ปรับตัวว่องไว ฉลาดใช้เทคโนโลยี มองธุรกิจกว้างไกล สร้างชื่อเสียงความภูมิใจให้ กปน.', 'has_text_input' => false],
        ]);

        // 2.6 ท่านรู้จัก/เคยเห็น/เคยได้ยิน “พันธกิจ” ของ กปน. หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_hear_mission', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.6 ท่านรู้จัก/เคยเห็น/เคยได้ยิน “พันธกิจ” ของ กปน. หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => false,
            'order_index'       => 7,
            'conditional_logic' => [
                'type'       => 'show_if',
                'operator'   => 'OR',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_values', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_values', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], [
            ['text' => '1) รู้จัก/เคยเห็น/เคยได้ยิน', 'has_text_input' => false],
            ['text' => '2) ไม่รู้จัก/ไม่เคยเห็น/ไม่เคยได้ยิน', 'has_text_input' => false],
        ]);

        // 2.7 ท่านทราบหรือไม่ว่า พันธกิจของ กปน. ในปัจจุบัน คือข้อใดต่อไปนี้
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_mission', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.7 ท่านทราบหรือไม่ว่า พันธกิจของ กปน. ในปัจจุบัน คือข้อใดต่อไปนี้',
            'question_type'     => 'multiple_choice',
            'is_required'       => false,
            'order_index'       => 8,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_mission', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], [
            [
                'text'           => '1) สร้างการเติบโตและความยั่งยืนของงานประปา ดำเนินการขยายแนวทางประปาให้ครอบคลุมพื้นที่ใหม่ ด้วยการพัฒนาระบบน้ำดิบ - ผลิต - จ่าย พัฒนาเทคโนโลยีและนวัตกรรมด้านการประปา ส่งเสริมการพัฒนาบุคลากร เพื่อให้บริการที่มีคุณภาพสูงสุด',
                'has_text_input' => false,
            ],
            [
                'text'           => '2) ผลิต จัดส่ง และจำหน่ายน้ำประปาที่มีคุณภาพ อย่างเพียงพอและมีประสิทธิภาพ สำรวจ จัดหาแหล่งน้ำดิบ จัดให้มีกิจการน้ำดิบ เพื่อใช้ในการผลิต จัดส่ง และจำหน่ายน้ำประปา ส่งเสริมธุรกิจการประปา ดำเนินธุรกิจอื่นที่เกี่ยวกับ หรือสืบเนื่องจากธุรกิจการประปา',
                'has_text_input' => false,
            ],
            [
                'text'           => '3) ดำเนินธุรกิจหลักด้านน้ำอย่างครบวงจร โดยให้บริการน้ำที่มีมาตรฐานสูงแก่ชุมชนในพื้นที่บริการ เพื่อคุณภาพชีวิตของประชาชนที่ดีขึ้น พร้อมทั้งใส่ใจสิ่งแวดล้อมและการพัฒนาอย่างยั่งยืน',
                'has_text_input' => false,
            ],
        ]);
        // new 2.8 การปฏิบัติงานและแผนปฏิบัติการที่ท่านได้รับมอบหมายเป็นส่วนช่วยให้ กปน. สามารถบรรลุเป้าหมายขององค์กรได้
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('know_target_mwa', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.8 การปฏิบัติงานและแผนปฏิบัติการที่ท่านได้รับมอบหมายเป็นส่วนช่วยให้ กปน. สามารถบรรลุเป้าหมายขององค์กรได้',
            'question_type'     => 'multiple_choice',
            'is_required'       => false,
            'order_index'       => 9,
             'conditional_logic' => [
                'type'       => 'show_if',
                'operator'   => 'OR',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_mission', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_mission', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], [
            [
                'text'           => '1) รู้และเข้าใจ',
                'has_text_input' => false,
            ],
            [
                'text'           => '2) ไม่รู้และไม่เข้าใจ',
                'has_text_input' => false,
            ],

        ]);
        // 2.8 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่
        $this->createGeneralAwarenessMatrix($section);
        // 2.9 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น (ตอบได้มากกว่า 1)
        $this->createGeneralNeedsMatrix($section);

        // 2.9.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('water_saving_behavior', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.9.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)',
            'description'       => 'กรณีข้อ 2.9 ตอบ เคย ในประเด็นที่ 1) การรณรงค์การใช้น้ำอย่างรู้คุณค่า กรุณาตอบคำถามข้อ 2.8.1',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 11,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_hear_mission', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], [
            [
                'text'           => '1) ใช้น้ำอย่างสำนึกและประหยัด และไม่ลืมปิดน้ำไม่ให้ไหลเปลืองเปล่า เพราะจะทำให้น้ำที่ประปานครหลวงผลิตไป',
                'has_text_input' => false,
            ],
            [
                'text'           => '2) อาบน้ำด้วยฝักบัวขนาดเล็ก และปิดน้ำระหว่างสบู่และสระผม',
                'has_text_input' => false,
            ],
            [
                'text'           => '3) เช็ดคราบอาหารออกก่อนล้างจาน',
                'has_text_input' => false,
            ],
            [
                'text'           => '4) ตรวจสอบอุปกรณ์ของระบบท่อประปา และอุปกรณ์ที่สำคัญอย่าง ท่าน้ำประปาให้อยู่ในสภาพดี และสถานที่สำคัญแบบที่เหมาะสม',
                'has_text_input' => false,
            ],
            [
                'text'           => '5) สำหรับเครื่องใช้ไฟฟ้าประจำบ้าน แทนการสละเอียดเปรียงจากก๊อกและน้ำท่อที่แพงสำปรุงค่าไม่มีดอลเย่น',
                'has_text_input' => false,
            ],
            [
                'text'           => '6) อุ่นก๊อกแพงอีเล็กบ้านโฮม ECO เพื่อประชาสัมพันธ์',
                'has_text_input' => false,
            ],
            [
                'text'           => '7) กู้ใส น้ำความเมื่อไรต้องการที่ใช้ในงานบ้าน',
                'has_text_input' => false,
            ],
            [
                'text'           => '8) ดื่มน้ำให้เพียงพอต่อความต้องการ และใช้แก้วน้ำส่วนตัวเพื่อลดใช้สินค้าแทนที่เดียว',
                'has_text_input' => false,
            ],
            [
                'text'           => '9) รองน้ำใส่ขังเพื่อรำสะอาด แทนการใช้สายยางฉีดโดยตรง',
                'has_text_input' => false,
            ],
            [
                'text'           => '10) เมื่อพบท่อประปาแตก/รั่วของการประปานครหลวง เพื่อรีบแจ้งหน่วยที่เกี่ยวข้องโดยด่วน ท่านสามารถแจ้งผ่านช่องทาง MWA Call Center โทร 1125, Line @MWAthailand, Application MWA onMobile, สำนักงานประปาสาขา',
                'has_text_input' => false,
            ],
        ]);
        $this->createInternalCommunicationMatrix($section);
        // 2.12 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_news', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.12 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 13,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], [
            ['text' => '1) อินทราเน็ต', 'has_text_input' => false],
            ['text' => '2) E-mail', 'has_text_input' => false],
            ['text' => '3) หนังสือเวียน', 'has_text_input' => false],
            ['text' => '4) การประชุม/แถลงนโยบาย', 'has_text_input' => false],
            ['text' => '5) ผู้บริหารตรวจเยี่ยมหน่วยงาน', 'has_text_input' => false],
            ['text' => '6) ประกาศ บอร์ดประชาสัมพันธ์ โปสเตอร์ แผ่นพับแบ็ค', 'has_text_input' => false],
            ['text' => '7) กิจกรรมรณรงค์ และการจัดนิทรรศการ', 'has_text_input' => false],
            ['text' => '8) วารสารนักกีฬา', 'has_text_input' => false],
            ['text' => '9) สื่อประชาสัมพันธ์ข่าวสารของ กปน. เช่น ประชาชนรู้ ข่าวประชาสัมพันธ์ รอบรั้ว กปน.', 'has_text_input' => false],
            ['text' => '10) ระบบ KM Portal', 'has_text_input' => false],
            ['text' => '11) Line Application', 'has_text_input' => false],
            ['text' => '12) Facebook ภายใน กปน. กลุ่ม MWA Connect ', 'has_text_input' => false],
            ['text' => '13) Facebook ภายใน กปน. กลุ่ม MWA Community', 'has_text_input' => false],
            ['text' => '14) ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['text' => '15) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

    }

    private function createGeneralAwarenessMatrix($section)
    {
        $topics = [
            ['value' => 'topic_1', 'label' => '1) การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) ฉลากประหยัดน้ำเบอร์ 5 เบอร์ 4 เบอร์ 3', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การดำเนินงานด้านลดน้ำสูญเสียขององค์กร', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) คุณภาพน้ำประปาตามแผนน้ำประปาปลอดภัย (Water Safety Plan)', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การส่งเสริมและพัฒนานวัตกรรม เทคโนโลยีของ กปน. เพื่อเพิ่มประสิทธิภาพในการทำงาน การจัดทำระบบเพื่อรองรับ Digital Transformation', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การให้บริการลูกค้าทุกช่องทางของ กปน. เช่น การให้บริการที่สำนักงานประปาสาขา การให้ บริการผ่านระบบดิจิทัล เช่น แอปพลิเคชัน MWA onMobile /e-Tax /e-Bill /e-Receipt', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลขององค์กร', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) การดำเนินงานด้านความรับผิดชอบต่อสังคม (CSR) เช่น การจัดอบรมวิชาชีพช่างประปาฟรีให้กับผู้ที่สนใจ การตรวจสอบถังพักน้ำการสร้างระบบประปาโรงเรียน การตรวจสอบคุณภาพน้ำให้กับโรงเรียนและโรงพยาบาล กิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) การดำเนินงานเพื่อสาธารณประโยชน์ตามนโยบายของรัฐบาลและกระทรวงมหาดไทยที่เป็นประโยชน์ต่อสังคมส่วนรวม เช่น การสนับสนุนงานบรรเทาสาธารณภัย เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) นโยบายการลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2) ขององค์กร เช่น ลดปริมาณการใช้กระดาษ ลดปริมาณการใช้ไฟฟ้าในอาคารลดการใช้ไฟฟ้าในกระบวกการผลิตน้ำ ลดการใช้น้ำมัน และโครงการใช้พลังงานแสงอาทิตย์ (Solar Cell) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) การบริหารความเสี่ยงและควบคุมภายใน', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => '12) การจัดการความรู้ (KM)', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => '13) การรณรงค์เสริมสร้างวัฒนธรรมองค์กรและยกระดับความผูกพันต่อองค์กร', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => '14) การเปลี่ยนแปลงสภาพแวดล้อมภายนอกที่สำคัญที่มีผลกระทบกับการดำเนินงานของ กปน. เช่น แนวทางการดำเนินงาน BCG Model (Bio Economy-Circular-Economy-Green Economy) ของ กปน. เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => '15) การตัดสินใจของ กปน. ที่สำคัญที่กระทบต่อผู้มีส่วนได้ส่วนเสียทุกกลุ่ม  เช่น การลงทุนเพื่อเสริมสร้างความมั่นคงระบบประปา โครงการปรับปรุงกิจการประปาแผนหลักครั้งที่ 9 และครั้งที่ 10', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => '16) ผลิตภัณฑ์ และบริการธุรกิจที่เกี่ยวเนื่องของ กปน. ประกอบด้วย 5 ธุรกิจ ได้แก่ งานบริการด้านการออกแบบและปรับปรุงระบบประปา งานบริการประปาครบวงจรสำหรับสถานที่ใช้น้ำ ศูนย์บริการทดสอบงานประปา บริการด้านนวัตกรรมและเทคโนโลยี และศูนย์ความเป็นเลิศด้านระบบประปา', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => '17) การบริหารความต่อเนื่องทางธุรกิจ (BCMS)', 'has_text_input' => false],
            ['value' => 'topic_18', 'label' => '18) การดำเนินงานด้านความปลอดภัยและอาชีวอนามัย', 'has_text_input' => false],
            ['value' => 'topic_19', 'label' => '19) การปรับปรุงโครงสร้างองค์กรและโครงสร้างผังบริหารของ  กปน.', 'has_text_input' => false],
            ['value' => 'topic_20', 'label' => '20) ประเด็นการสื่อสารตามเกณฑ์ Enablers เช่น แผนวิสาหกิจและแผนปฏิบัติการของ ยุทธศาสตร์ด้านผู้มี ส่วนได้ส่วนเสีย ยุทธศาสตร์ด้านลูกค้าและการตลาด กฎบัตรและมาตรฐานการบริการ หลักการกำกับดูแลด้านการบริหารจัดการเทคโนโลยีดิจิทัล แผนปฏิบัติการดิจิทัล เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_21', 'label' => '21) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_22', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('general_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.9 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 10,
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
        ], $topics, $this->getAwarenessColumns());
    }

    private function createGeneralNeedsMatrix($section)
    {
        $topics = [
            ['value' => 'topic_1', 'label' => '1) การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) ฉลากประหยัดน้ำเบอร์ 5 เบอร์ 4 เบอร์ 3', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การดำเนินงานด้านลดน้ำสูญเสียขององค์กร', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) คุณภาพน้ำประปาตามแผนน้ำประปาปลอดภัย (Water Safety Plan)', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การส่งเสริมและพัฒนานวัตกรรม เทคโนโลยีของ กปน. เพื่อเพิ่มประสิทธิภาพในการทำงาน การจัดทำระบบเพื่อรองรับ Digital Transformation', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การให้บริการลูกค้าทุกช่องทางของ กปน. เช่น การให้บริการที่สำนักงานประปาสาขา การให้ บริการผ่านระบบดิจิทัล เช่น แอปพลิเคชัน MWA onMobile /e-Tax /e-Bill /e-Receipt', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลขององค์กร', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) การดำเนินงานด้านความรับผิดชอบต่อสังคม (CSR) เช่น การจัดอบรมวิชาชีพช่างประปาฟรีให้กับผู้ที่สนใจ การตรวจสอบถังพักน้ำการสร้างระบบประปาโรงเรียน การตรวจสอบคุณภาพน้ำให้กับโรงเรียนและโรงพยาบาล กิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) การดำเนินงานเพื่อสาธารณประโยชน์ตามนโยบายของรัฐบาลและกระทรวงมหาดไทยที่เป็นประโยชน์ต่อสังคมส่วนรวม เช่น การสนับสนุนงานบรรเทาสาธารณภัย เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) นโยบายการลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2) ขององค์กร เช่น ลดปริมาณการใช้กระดาษ ลดปริมาณการใช้ไฟฟ้าในอาคารลดการใช้ไฟฟ้าในกระบวกการผลิตน้ำ ลดการใช้น้ำมัน และโครงการใช้พลังงานแสงอาทิตย์ (Solar Cell) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) การบริหารความเสี่ยงและควบคุมภายใน', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => '12) การจัดการความรู้ (KM)', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => '13) การรณรงค์เสริมสร้างวัฒนธรรมองค์กรและยกระดับความผูกพันต่อองค์กร', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => '14) การเปลี่ยนแปลงสภาพแวดล้อมภายนอกที่สำคัญที่มีผลกระทบกับการดำเนินงานของ กปน. เช่น แนวทางการดำเนินงาน BCG Model (Bio Economy-Circular-Economy-Green Economy) ของ กปน. เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => '15) การตัดสินใจของ กปน. ที่สำคัญที่กระทบต่อผู้มีส่วนได้ส่วนเสียทุกกลุ่ม  เช่น การลงทุนเพื่อเสริมสร้างความมั่นคงระบบประปา โครงการปรับปรุงกิจการประปาแผนหลักครั้งที่ 9 และครั้งที่ 10', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => '16) ผลิตภัณฑ์ และบริการธุรกิจที่เกี่ยวเนื่องของ กปน. ประกอบด้วย 5 ธุรกิจ ได้แก่ งานบริการด้านการออกแบบและปรับปรุงระบบประปา งานบริการประปาครบวงจรสำหรับสถานที่ใช้น้ำ ศูนย์บริการทดสอบงานประปา บริการด้านนวัตกรรมและเทคโนโลยี และศูนย์ความเป็นเลิศด้านระบบประปา', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => '17) การบริหารความต่อเนื่องทางธุรกิจ (BCMS)', 'has_text_input' => false],
            ['value' => 'topic_18', 'label' => '18) การดำเนินงานด้านความปลอดภัยและอาชีวอนามัย', 'has_text_input' => false],
            ['value' => 'topic_19', 'label' => '19) การปรับปรุงโครงสร้างองค์กรและโครงสร้างผังบริหารของ  กปน.', 'has_text_input' => false],
            ['value' => 'topic_20', 'label' => '20) ประเด็นการสื่อสารตามเกณฑ์ Enablers เช่น แผนวิสาหกิจและแผนปฏิบัติการของ ยุทธศาสตร์ด้านผู้มี ส่วนได้ส่วนเสีย ยุทธศาสตร์ด้านลูกค้าและการตลาด กฎบัตรและมาตรฐานการบริการ หลักการกำกับดูแลด้านการบริหารจัดการเทคโนโลยีดิจิทัล แผนปฏิบัติการดิจิทัล เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_21', 'label' => '21) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_22', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('general_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.10 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น (ตอบได้มากกว่า 1)',
            'question_type'       => 'matrix',
            'order_index'         => 12,
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
        ], $topics, $this->getStandardNeedsColumns());
    }
    private function createInternalCommunicationMatrix($section)
    {

        // ช่องทางการสื่อสารภายในองค์กร
        $channels = [
            ['value' => 'channel_1', 'label' => '1) อินทราเน็ต', 'has_text_input' => false],
            ['value' => 'channel_2', 'label' => '2) E-mail', 'has_text_input' => false],
            ['value' => 'channel_3', 'label' => '3) หนังสือเวียน', 'has_text_input' => false],
            ['value' => 'channel_4', 'label' => '4) การประชุม/แถลงนโยบาย', 'has_text_input' => false],
            ['value' => 'channel_5', 'label' => '5) ผู้บริหารตรวจเยี่ยมหน่วยงาน', 'has_text_input' => false],
            ['value' => 'channel_6', 'label' => '6) ประกาศ บอร์ดประชาสัมพันธ์ โปสเตอร์ แผ่นพับแบ็ค', 'has_text_input' => false],
            ['value' => 'channel_7', 'label' => '7) กิจกรรมสัมมงค์ และการจัดนิทรรศการ', 'has_text_input' => false],
            ['value' => 'channel_8', 'label' => '8) วารสารนักกีฬา', 'has_text_input' => false],
            ['value' => 'channel_9', 'label' => '9) สื่อประชาสัมพันธ์ข่าวสารของ กปน. เช่น ประชาชนรู้ ข่าวประชาสัมพันธ์ รอบรั้ว กปน.', 'has_text_input' => false],
            ['value' => 'channel_10', 'label' => '10) ระบบ KM Portal', 'has_text_input' => false],
            ['value' => 'channel_11', 'label' => '11) Line Application', 'has_text_input' => false],
            ['value' => 'channel_12', 'label' => '12) Facebook ภายใน กปน. กลุ่ม MWA Connect', 'has_text_input' => false],
            ['value' => 'channel_13', 'label' => '13) Facebook ภายใน กปน. กลุ่ม MWA Community', 'has_text_input' => false],
            ['value' => 'channel_14', 'label' => '14) ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['value' => 'channel_15', 'label' => '15) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],

        ];

        // สร้างคำถาม 2.11 - ช่องทางที่เคยได้รับข้อมูล
        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('communication_channels_received', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.11 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยได้รับ/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 12,
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
            'matrix_row_label'    => 'ช่องทาง',
            'matrix_column_label' => 'การรับรู้',
        ], $channels, $this->getAwarenessColumns());

    }

    private function createSection3Questions($section)
    {
        $topics = [
            [
                'group' => 'ด้านเนื้อหา',
                'items' => [
                    'ตรงกับความต้องการ',
                    'น่าสนใจ',
                    'ทันสมัยหรือมีความเป็นปัจจุบัน',
                    'ชัดเจน ครบถ้วนสมบูรณ์ตามความต้องการ',
                    'ประโยชน์ที่ได้รับ',
                ],
            ],
            [
                'group' => 'ด้านรูปแบบ',
                'items' => [
                    'เข้าใจง่าย',
                    'รูปแบบในการแสดงผลมีความเหมาะสม สวยงาม น่าสนใจ',
                ],
            ],
            [
                'group' => 'ช่องทางในการสื่อสาร',
                'items' => [
                    'เหมาะสมกับประเภทของข้อมูล',
                    'เข้าถึงได้ง่าย',
                    'มีการโต้ตอบกัน (Interaction) ระหว่างผู้รับสารและผู้ส่งสาร',
                ],
            ],
        ];

        $this->createDualRatingQuestion($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('customer_expectation_satisfaction', $this->surveyTypeId, $section->order_index),
            'question_text'     => '3.1 จากการรับรู้ข้อมูลข่าวสารของ กปน. ท่านมีความคาดหวัง และความพึงพอใจต่อการประชาสัมพันธ์ของ กปน. อย่างไร จากคะแนน 1-5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
            'order_index'       => 1,
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
        $topics = [
            [
                'value' => 'water_quality_confidence',
                'label' => 'น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก (หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1)',
            ],
            [
                'value' => 'transparency_confidence',
                'label' => 'มีความสม่ำเสมอในการให้บริการ สามารถให้บริการน้ำประปาตลอด 24 ชั่วโมง',
            ],
            [
                'value' => 'job_security_confidence',
                'label' => 'การพัฒนาระบบการบริการ โดยนำเทคโนโลยีมาใช้เพื่อเพิ่มความสะดวกกับ ลูกค้า เช่น แอปพลิเคชัน MWA onMobile',
            ],
            [
                'value' => 'work_environment_confidence',
                'label' => 'กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
            ],
            [
                'value' => 'leadership_confidence',
                'label' => 'กปน. สนับสนุนการดำเนินงานที่เกี่ยวกับความรับผิดชอบต่อสังคม และสิ่งแวดล้อม เช่น โครงการช่างประปาเพื่อประชาชน และโครงการเสริมสร้างความเข้มแข็งของชุมชนสำคัญ',
            ],
            [
                'value' => 'social_impact_confidence',
                'label' => 'การจัดการปัญหาเรื่องร้องเรียนการทุจริตของ กปน.',
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

        // คำถามเงื่อนไข
        $concerns = [
            ['text' => 'ไม่มั่นใจในระบบผลิตน้ำประปาของโรงงาน', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของเส้นท่อ กปน.', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของระบบประปา หรือถังพักน้ำภายในบ้าน', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('water_quality_concern', $this->surveyTypeId, $section->order_index),
            'question_text' => 'ทำไมท่านถึงไม่เชื่อมั่นว่าน้ำประปาสะอาด ดื่มได้',
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
