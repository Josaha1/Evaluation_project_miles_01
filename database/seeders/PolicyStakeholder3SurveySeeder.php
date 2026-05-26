<?php
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มลูกค้า (Survey Type 3)
 * - มี section พิเศษ "แบบสอบถามคัดกรอง"
 * - มีคำถามเงื่อนไขที่ซับซ้อน
 */
class PolicyStakeholder3SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 3;

    protected function getSectionTemplates()
    {
        return [
            ['title' => 'ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม', 'description' => 'ข้อมูลพื้นฐานของผู้ตอบแบบสอบถาม', 'order_index' => 1],
            ['title' => 'แบบสอบถามคัดกรอง', 'description' => 'แบบสอบถามคัดกรองผู้ตอบแบบสอบถาม', 'order_index' => 2],
            ['title' => 'การรับรู้ข้อมูลข่าวสารของ กปน.', 'description' => 'ช่องทางและการรับรู้ข้อมูลข่าวสารจาก กปน.', 'order_index' => 3],
            ['title' => 'แบบสอบถามวัดความคาดหวังและความพึงพอใจต่อการประชาสัมพันธ์ของ กปน.', 'description' => 'การประเมินความคาดหวังและความพึงพอใจ', 'order_index' => 4],
            ['title' => 'แบบสอบถามวัดความพึงพอใจการประชาสัมพันธ์ของ กปน. เปรียบเทียบกับหน่วยงานอื่น', 'description' => 'การเปรียบเทียบกับหน่วยงานรัฐวิสาหกิจอื่น', 'order_index' => 5],
            ['title' => 'แบบสอบถามวัดความเชื่อมั่นของ กปน.', 'description' => 'ระดับความเชื่อมั่นต่อ กปน.', 'order_index' => 6],
            ['title' => 'ข้อเสนอแนะเพิ่มเติม', 'description' => 'ข้อเสนอแนะและความคิดเห็นเพิ่มเติม', 'order_index' => 7],
        ];
    }

    protected function createQuestionsForSection($section, $sectionOrderIndex)
    {
        switch ($sectionOrderIndex) {
            case 1:
                $this->createSection1Questions($section);
                break;
            case 2:
                $this->createScreeningQuestions($section);
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
            case 7:
                $this->createSection7Questions($section);
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

        // ระดับการศึกษา
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('education', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.3 ระดับการศึกษาที่สำเร็จขั้นสูงสุด',
            'question_type'     => 'multiple_choice',
            'order_index'       => 3,
        ], [
            'มัธยมศึกษาตอนต้นหรือต่ำกว่า',
            'มัธยมศึกษาตอนปลาย/ปวช.',
            'อนุปริญญา/ปวส.',
            'ปริญญาตรี',
            'สูงกว่าปริญญาตรี',
        ]);

        // อาชีพ
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('occupation', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.4 อาชีพ',
            'question_type'     => 'multiple_choice',
            'order_index'       => 4,
        ], [
            ['text' => 'ข้าราชการ/รัฐวิสาหกิจ', 'has_text_input' => false],
            ['text' => 'พนักงานบริษัท', 'has_text_input' => false],
            ['text' => 'ธุรกิจส่วนตัว ผู้ประกอบการ', 'has_text_input' => false],
            ['text' => 'นักศึกษา', 'has_text_input' => false],
            ['text' => 'แม่บ้าน/พ่อบ้าน', 'has_text_input' => false],
            ['text' => 'รับจ้างแรงงานทั่วไป', 'has_text_input' => false],
            ['text' => 'ฟรีแลนซ์/อาชีพอิสระ', 'has_text_input' => false],
            ['text' => 'เกษียณ/ว่างงาน', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

        // 1.5 ท่านอยู่ในพื้นที่การใช้น้ำกลุ่มใด
        $question = $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('group_user', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.5 ท่านอยู่ในพื้นที่การใช้น้ำกลุ่มใด',
            'question_type'     => 'multiple_choice',
            'order_index'       => 5,
            'is_screening'      => true, // ✅ เป็นคำถาม screening
            'description'       => 'กรณีตอบ "อยู่ในพื้นที่การใช้น้ำเขตอื่น ๆ" ไม่ต้องตอบแบบสอบถามส่วนที่ 5',
        ], [
            [
                'text'           => '1) อยู่ในพื้นที่การใช้น้ำ กรุงเทพมหานคร นนทบุรี หรือสมุทรปราการ',
                'value'          => 'bangkok_area',
                'option_value'   => 'bangkok_area', // ✅ เพิ่ม option_value
                'has_text_input' => false,
            ],
            [
                'text'           => '2) อยู่ในพื้นที่การใช้น้ำเขตอื่น ๆ',
                'value'          => 'other_area',
                'option_value'   => 'other_area', // ✅ เพิ่ม option_value
                'has_text_input' => false,
                // ✅ ปรับปรุง skip configuration ให้ถูกต้อง
                'skip_config'    => [
                    'enabled'        => true,
                    'action'         => 'skip_section',
                    'target_section' => 5, // ข้ามส่วนที่ 5
                    'reason'         => 'ไม่อยู่ในพื้นที่ กทม. นนทบุรี สมุทรปราการ',
                    'skip_type'      => 'section',
                ],
            ],
        ]);
        \App\Models\SurveyConditionalRule::create([
            'survey_type_id'      => $this->surveyTypeId,
            'trigger_question_id' => $question->id,
            'target_section_id'   => 5, // target section ที่ต้องข้าม
            'rule_type'           => 'skip_section',
            'condition_operator'  => 'equals',
            'condition_value'     => ['other_area'],
            'action'              => 'skip_section',
            'action_parameters'   => [
                'target_section' => 5,
                'reason'         => 'ไม่อยู่ในพื้นที่ กทม. นนทบุรี สมุทรปราการ',
                'skip_type'      => 'section',
                'next_section'   => 6,
            ],
            'condition_metadata'  => [
                'question_code'       => $this->generateQuestionCode('group_user', $this->surveyTypeId, $section->order_index),
                'trigger_option'      => 'other_area',
                'target_section_name' => 'แบบสอบถามวัดความพึงพอใจการประชาสัมพันธ์ของ กปน. เปรียบเทียบกับหน่วยงานอื่น',
            ],
            'description'         => 'ข้ามส่วนที่ 5 เมื่อตอบว่าอยู่ในเขตอื่นๆ',
            'priority'            => 10,
            'is_active'           => true,
        ]);
    }

    private function createScreeningQuestions($section)
    {
        // 2.1 ท่านรู้จักการประปานครหลวง (กปน.) หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.1 ท่านรู้จักการประปานครหลวง (กปน.) หรือไม่',
            'question_type'     => 'multiple_choice',
            'order_index'       => 1,
            'conditional_logic' => [
                'type'       => 'terminate_survey',
                'conditions' => [
                    [
                        'value'   => 2, // ไม่รู้จัก
                        'action'  => 'terminate',
                        'message' => 'ขอขอบคุณสำหรับการตอบแบบสอบถาม',
                    ],
                ],
            ],
        ], ['รู้จัก', 'ไม่รู้จัก (ยุติแบบสอบถาม)']);

        // 2.2 ท่านอาศัยอยู่ในจังหวัดใด
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('province', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.2 ท่านอาศัยอยู่ในจังหวัดใด',
            'question_type'     => 'multiple_choice',
            'order_index'       => 2,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // รู้จัก
                    ],
                ],
            ],
        ], ['กรุงเทพมหานคร', 'นนทบุรี', 'สมุทรปราการ']);
    }

    private function createSection3Questions($section)
    {
        // 3.1 การได้รับข้อมูลข่าวสารจาก กปน.
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
            'question_text'     => '3.1 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยได้รับ/เคยเห็น/ เคยได้ยิน ข้อมูลข่าวสารจาก กปน. เช่น ข้อมูลข่าวสารเกี่ยวกับการรณรงค์ประหยัดน้ำ หรือ คุณภาพน้ำประปา หรือ ประกาศน้ำประปาไหลอ่อน-ไม่ไหล เป็นต้น หรือไม่',
            'question_type'     => 'multiple_choice',
            'order_index'       => 1,
            'conditional_logic' => [
                'type'       => 'skip_logic',
                'conditions' => [
                    [
                        'value'         => 1, // เคยได้รับ
                        'action'        => 'continue',
                        'next_question' => 'customer_slogan_awareness',
                    ],
                    [
                        'value'           => 2, // ไม่เคยได้รับ
                        'action'          => 'show_next_then_skip',
                        'next_question'   => 'no_info_reason',
                        'skip_to_section' => 6, // ข้ามไปส่วนที่ 6
                    ],
                ],
            ],
        ], [
            'เคยได้รับ/เคยเห็น/ เคยได้ยิน',
            'ไม่เคยได้รับ/ไม่เคยเห็น/ไม่เคยได้ยิน',
        ]);

        // 3.1.1 เหตุผลที่ไม่เคยได้รับข้อมูล
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('no_info_reason', $this->surveyTypeId, $section->order_index),
            'question_text'     => '3.1.1 เพราะเหตุใดท่านจึง ไม่เคยได้รับ/ ไม่เคยเห็น/ ไม่เคยได้ยิน ข้อมูลข่าวสารจาก กปน. (ตอบได้มากกว่า 1 ข้อ) (ไปต่อในส่วนที่ 6)',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 2,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
            'skip_logic'        => [
                'type'            => 'always_skip_to_section',
                'skip_to_section' => 6,
            ],
        ], [
            ['text' => 'ไม่สามารถเข้าถึงช่องทางในการรับข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => 'ไม่มีความสนใจในข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

        // 3.2 การรู้จัก slogan
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('slogan_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'     => '3.2 ท่านรู้จัก/เคยเห็น/เคยได้ยิน ข้อความ "ประปาคุณภาพ เพื่อชีวิตที่ดี (Quality Water for Quality Living)" หรือไม่',
            'question_type'     => 'multiple_choice',
            'order_index'       => 3,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ], [
            'รู้จัก/เคยเห็น/เคยได้ยิน',
            'ไม่รู้จัก/ไม่เคยเห็น/ไม่เคยได้ยิน',
        ]);

        // 3.3 Matrix Questions
        $this->createCustomerAwarenessMatrix($section);

        // 3.3.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mission_info_awareness_chose', $this->surveyTypeId, $section->order_index),
            'question_text'     => '3.3.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)',
            'description'       => 'กรณีข้อ 3.3 ตอบ เคย ในประเด็นที่ 7) การรณรงค์การใช้น้ำอย่างรู้คุณค่า กรุณาตอบคำถามข้อ 3.3.1',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 5,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_info_awareness', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'matrix_row_answered',
                        'value'         => [
                            'row_value'    => 'topic_7',
                            'column_value' => 'yes',
                            'matrix_type'  => 'awareness',
                        ],
                    ],
                ],
            ],
        ], [
            [
                'text'           => '1) ใช้ฝักบัวรดน้ำแทนสายยาง และไม่ลดน้ำต้นไม้ตอนแดดจัด เพราะจะทำให้น้ำระเหยไว',
                'has_text_input' => false,
            ],
            [
                'text'           => '2) อาบน้ำด้วยฝักบัวรูเล็ก และปิดน้ำระหว่างถูสบู่และสระผม',
                'has_text_input' => false,
            ],
            [
                'text'           => '3) เช็ดคราบอาหารออกก่อนล้างจาน',
                'has_text_input' => false,
            ],
            [
                'text'           => '4) ตรวจสอบรอยรั่วของระบบท่อประปา และสุขภัณฑ์สม่ำเสมอ หากพบรอยรั่วรีบซ่อมแซมทันที',
                'has_text_input' => false,
            ],
            [
                'text'           => '5) ล้างผักและผลไม้มีภาชนะรองน้ำทุกครั้ง แทนการล้างโดยตรงจากก๊อกและนำน้ำที่ใช้แล้วไปรดน้ำต้นไม้ต่อได้',
                'has_text_input' => false,
            ],
            [
                'text'           => '6) ซักผ้าแต่พอดีและปรับโหมด ECO เพื่อประหยัดน้ำ',
                'has_text_input' => false,
            ],
            [
                'text'           => '7) ถูพื้น ทำความสะอาดทุกครั้งใช้ถังรองน้ำ',
                'has_text_input' => false,
            ],
            [
                'text'           => '8) รินน้ำให้เพียงพอต่อความต้องการ และใช้แก้วน้ำส่วนตัวเพื่อจะได้ล้างแก้วแค่ใบเดียว',
                'has_text_input' => false,
            ],
            [
                'text'           => '9) รองน้ำใส่ถังเพื่อล้างรถ แทนการใช้สายยางฉีดโดยตรง',
                'has_text_input' => false,
            ],
            [
                'text'           => '10) เมื่อพบท่อประปาแตก/รั่วของการประปานครหลวง เพื่อรีบแจ้งหน่วยที่เกี่ยวข้องโดยด่วน ท่านสามารถแจ้งผ่านช่องทาง MWA Call Center โทร 1125, Line @MWAthailand, Application MWA onMobile, สำนักงานประปาสาขา',
                'has_text_input' => false,
            ],
        ]);

        //3.4
        $this->createCustomerNeedsMatrix($section);

        // 3.5 และ 3.6 Channel awareness และ preference
        $this->createCustomerChannelMatrix($section);
    }

    private function createCustomerAwarenessMatrix($section)
    {
        $customerTopics = [
            ['value' => 'topic_1', 'label' => 'การให้บริการของสำนักงานประปาสาขา การรับรองมาตรฐานการให้บริการของศูนย์ราชการสะดวก และ Call Center 1125', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => 'การให้บริการด้วย Digital Service อาทิ การชำระเงินผ่านช่องทางอิเล็กทรอนิกส์ MWA onMobile บริการ e-bill / e-Tax Invoice & e-Receipt การรับแจ้งท่อประปาแตกรั่ว เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => 'การพัฒนานวัตกรรมและเทคโนโลยีของ กปน. เพื่อเพิ่มประสิทธิภาพในการทำงาน อาทิ โครงการนวัตกรรมลูกค้า (VOC to Innovation) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => 'ผลิตภัณฑ์และบริการเกี่ยวกับธุรกิจที่เกี่ยวเนื่องของ กปน. ได้แก่ งานล้างถังพักน้ำ และบริการ Health Care Solution', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => 'การผลิตน้ำประปาตามแผนน้ำประปาปลอดภัย (WSP) ได้มาตรฐานขององค์การอนามัยโลก (WHO)', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => 'โครงการปรับปรุงเส้นท่อประปาใหม่ เพื่อลดการแตกรั่วของท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => 'การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => 'ฉลากประหยัดน้ำเบอร์ 5 เบอร์ 4 เบอร์ 3', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => 'การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => 'การดำเนินงานด้านความรับผิดชอบต่อสังคมและสิ่งแวดล้อม (CSR) เช่น การพัฒนาชุมชนสำคัญ การใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => 'การดำเนินงานเพื่อสาธารณประโยชน์ตามนโยบายของรัฐบาลและกระทรวงมหาดไทย ที่เป็นประโยชน์ต่อสังคมส่วนรวม เช่น การสนับสนุนงานบรรเทาสาธารณภัย เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => 'การลงทุนเพื่อเพิ่มศักยภาพในระบบประปา เช่น การขยายกำลังการผลิต การก่อสร้างอุโมงค์ส่งน้ำ และสถานีสูบน้ำ', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => 'การดำเนินงานด้านการลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2) เช่น ลดปริมาณการใช้กระดาษ ลดปริมาณการใช้ไฟฟ้าในอาคาร ลดการใช้ไฟฟ้าในกระบวนการผลิตน้ำ ลดการใช้น้ำมัน และโครงการใช้พลังงานแสงอาทิตย์ (Solar Cell) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => 'การประกาศแจ้งเตือนก่อนการหยุดจ่ายน้ำเพื่อซ่อมแซมท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => 'ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ เช่น วารสารน้ำก๊อก เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => 'โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '3.3 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 4,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'เคย / ไม่เคย',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ], $customerTopics, $this->getAwarenessColumns());
    }

    private function createCustomerNeedsMatrix($section)
    {
        $customerTopics = [
            ['value' => 'topic_1', 'label' => 'การให้บริการของสำนักงานประปาสาขา การรับรองมาตรฐานการให้บริการของศูนย์ราชการสะดวก และ Call Center 1125', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => 'การให้บริการด้วย Digital Service อาทิ การชำระเงินผ่านช่องทางอิเล็กทรอนิกส์ MWA onMobile บริการ e-bill / e-Tax Invoice & e-Receipt การรับแจ้งท่อประปาแตกรั่ว เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => 'การพัฒนานวัตกรรมและเทคโนโลยีของ กปน. เพื่อเพิ่มประสิทธิภาพในการทำงาน อาทิ โครงการนวัตกรรมลูกค้า (VOC to Innovation) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => 'ผลิตภัณฑ์และบริการเกี่ยวกับธุรกิจที่เกี่ยวเนื่องของ กปน. ได้แก่ งานล้างถังพักน้ำ และบริการ Health Care Solution', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => 'การผลิตน้ำประปาตามแผนน้ำประปาปลอดภัย (WSP) ได้มาตรฐานขององค์การอนามัยโลก (WHO)', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => 'โครงการปรับปรุงเส้นท่อประปาใหม่ เพื่อลดการแตกรั่วของท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => 'การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => 'ฉลากประหยัดน้ำเบอร์ 5 เบอร์ 4 เบอร์ 3', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => 'การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => 'การดำเนินงานด้านความรับผิดชอบต่อสังคมและสิ่งแวดล้อม (CSR) เช่น การพัฒนาชุมชนสำคัญ การใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => 'การดำเนินงานเพื่อสาธารณประโยชน์ตามนโยบายของรัฐบาลและกระทรวงมหาดไทย ที่เป็นประโยชน์ต่อสังคมส่วนรวม เช่น การสนับสนุนงานบรรเทาสาธารณภัย เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => 'การลงทุนเพื่อเพิ่มศักยภาพในระบบประปา เช่น การขยายกำลังการผลิต การก่อสร้างอุโมงค์ส่งน้ำ และสถานีสูบน้ำ', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => 'การดำเนินงานด้านการลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2) เช่น ลดปริมาณการใช้กระดาษ ลดปริมาณการใช้ไฟฟ้าในอาคาร ลดการใช้ไฟฟ้าในกระบวนการผลิตน้ำ ลดการใช้น้ำมัน และโครงการใช้พลังงานแสงอาทิตย์ (Solar Cell) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => 'การประกาศแจ้งเตือนก่อนการหยุดจ่ายน้ำเพื่อซ่อมแซมท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => 'ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ เช่น วารสารน้ำก๊อก เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => 'โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '3.4 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น',
            'question_type'       => 'matrix',
            'order_index'         => 6,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ], $customerTopics, $this->getStandardNeedsColumns());
    }

    private function createCustomerChannelMatrix($section)
    {
        $channels = [
            ['value' => 'topic_1', 'label' => 'โทรทัศน์', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => 'วิทยุ', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => 'หนังสือพิมพ์', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => 'โปสเตอร์ แผ่นพับ ใบปลิว', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => 'เว็บไซต์ กปน. (www.mwa.co.th)', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => 'เว็บไซต์อื่น ๆ เช่น มติชนออนไลน์ ไทยรัฐออนไลน์ sanook.com', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => 'เฟซบุ๊ก กปน. (www.facebook.com/MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => 'เฟซบุ๊กอื่น ๆ เช่น Facebook สวพ. FM.91 Facebook จส.100', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => 'แอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => 'ไลน์ กปน. (@MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => 'ยูทูป กปน. (MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => 'X (ทวิตเตอร์) กปน. (MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => 'อินสตาแกรม กปน. (MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => 'Tiktok กปน. (MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => 'กิจกรรมรณรงค์และการจัดนิทรรศการ', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => 'ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => 'โฆษณาข้างรถประจำทาง', 'has_text_input' => false],
            ['value' => 'topic_18', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $channelColumns = [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];
        // 3.5 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
        $this->createMatrixQuestion($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_preference', $this->surveyTypeId, $section->order_index),
            'question_text'       => '3.5 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 7,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ], $channels, $channelColumns);
        // 3.6 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_info', $this->surveyTypeId, $section->order_index),
            'question_text'       => '3.6 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'       => 'checkbox',
            'order_index'         => 8,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ], [
            ['text' => 'โทรทัศน์', 'has_text_input' => false],
            ['text' => 'วิทยุ', 'has_text_input' => false],
            ['text' => 'หนังสือพิมพ์', 'has_text_input' => false],
            ['text' => 'โปสเตอร์ แผ่นพับ ใบปลิว', 'has_text_input' => false],
            ['text' => 'เว็บไซต์ กปน. (www.mwa.co.th)', 'has_text_input' => false],
            ['text' => 'เว็บไซต์อื่น ๆ เช่น มติชนออนไลน์ ไทยรัฐออนไลน์ sanook.com', 'has_text_input' => false],
            ['text' => 'เฟซบุ๊ก กปน. (www.facebook.com/MWAthailand)', 'has_text_input' => false],
            ['text' => 'เฟซบุ๊กอื่น ๆ เช่น Facebook สวพ. FM.91 Facebook จส.100', 'has_text_input' => false],
            ['text' => 'แอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['text' => 'ไลน์ กปน. (@MWAthailand)', 'has_text_input' => false],
            ['text' => 'ยูทูป กปน. (MWAthailand)', 'has_text_input' => false],
            ['text' => 'X (ทวิตเตอร์) กปน. (MWAthailand)', 'has_text_input' => false],
            ['text' => 'อินสตาแกรม กปน. (MWAthailand)', 'has_text_input' => false],
            ['text' => 'Tiktok กปน. (MWAthailand)', 'has_text_input' => false],
            ['text' => 'กิจกรรมรณรงค์และการจัดนิทรรศการ', 'has_text_input' => false],
            ['text' => 'ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['text' => 'โฆษณาข้างรถประจำทาง', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
    }

    private function createSection4Questions($section)
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
            'question_text'     => '4.1 จากการรับรู้ข้อมูลข่าวสารของ กปน. ท่านมีความคาดหวัง และความพึงพอใจต่อการประชาสัมพันธ์ของ กปน. อย่างไร จากคะแนน 1-5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
            'order_index'       => 1,
        ], $this->ratingScales['expectation'], $this->ratingScales['satisfaction'], $topics);
    }

    private function createSection5Questions($section)
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
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('organization_comparison', $this->surveyTypeId, $section->order_index),
            'question_text'     => '5.1 หากท่านต้องประเมินผลการดำเนินงานด้านประชาสัมพันธ์ขององค์กรต่อไปนี้ เปรียบเทียบกับ กปน. ในภาพรวมท่านจะให้คะแนนความพึงพอใจในแต่ละเรื่องต่อไปนี้ในระดับเท่าใด',
            'description'       => 'โดยที่ 1 หมายถึง พึงพอใจน้อยที่สุด 2 หมายถึง พึงพอใจน้อย 3 หมายถึง พึงพอใจปานกลาง 4 หมายถึง พึงพอใจมาก และ 5 หมายถึง พึงพอใจมากที่สุด',
            'question_type'     => 'comparison_table',
            'order_index'       => 1,

        ], $topics, $organizations, $this->ratingScales['satisfaction']);
    }

    private function createSection6Questions($section)
    {
        $topics = [
            [
                'value' => 'water_quality_confidence',
                'label' => 'น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก (หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 6.1.1)',
            ],
            [
                'value' => 'service_consistency_confidence',
                'label' => 'มีความสม่ำเสมอในการให้บริการ สามารถให้บริการน้ำประปาตลอด 24 ชั่วโมง',
            ],
            [
                'value' => 'technology_confidence',
                'label' => 'การพัฒนาระบบการบริการ โดยนำเทคโนโลยีมาใช้เพื่อเพิ่มความสะดวกกับ ลูกค้า เช่น แอปพลิเคชัน MWA onMobile',
            ],
            [
                'value' => 'transparency_confidence',
                'label' => 'กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
            ],
            [
                'value' => 'csr_confidence',
                'label' => 'กปน. สนับสนุนการดำเนินงานที่เกี่ยวกับความรับผิดชอบต่อสังคม และสิ่งแวดล้อม เช่น โครงการช่างประปาเพื่อประชาชน และโครงการเสริมสร้างความเข้มแข็งของชุมชนสำคัญ',
            ],
            [
                'value' => 'complaint_confidence',
                'label' => 'การจัดการปัญหาเรื่องร้องเรียนการทุจริตของ กปน.',
            ],
             [
                'value' => 'complaint_plan',
                'label' => 'โครงการต่าง ๆ ของ กปน. เช่น โครงการปรับปรุงกิจการประปาแผนหลัก มีส่วนช่วยในการยกระดับคุณภาพชีวิตให้ดีขึ้น',
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
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('confidence_level', $this->surveyTypeId, $section->order_index),
            'question_text'       => '6.1 ท่านมีระดับความเชื่อมั่นต่อ กปน. อย่างไรบ้าง',
            'description'         => 'กรุณาให้ระดับความเชื่อมั่น โดยที่ 1 หมายถึง เชื่อมั่นน้อยที่สุด 2 หมายถึง เชื่อมั่นน้อย 3 หมายถึง เชื่อมั่นปานกลาง 4 หมายถึง เชื่อมั่นมาก และ 5 หมายถึง เชื่อมั่นมากที่สุด',
            'question_type'       => 'matrix',
            'order_index'         => 1,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความเชื่อมั่น กปน.',
            'scale_type'          => 'confidence',
        ], $topics, $ratingColumns, $this->ratingScales['confidence']);

        // 6.1.1 คำถามเงื่อนไข
        $concerns = [
            ['text' => 'ไม่มั่นใจในระบบผลิตน้ำประปาของโรงงาน', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของเส้นท่อ กปน.', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของระบบประปา หรือถังพักน้ำภายในบ้าน', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('water_quality_concern', $this->surveyTypeId, $section->order_index),
            'question_text'     => '6.1.1 ทำไมท่านถึงไม่เชื่อมั่นว่าน้ำประปาสะอาด ดื่มได้',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 2,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('confidence_level', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'matrix_rating_range',
                        'row_value'     => 'water_quality_confidence',
                        'min_value'     => 1,
                        'max_value'     => 3,
                    ],
                ],
            ],
        ], $concerns);

        // 6.1.2 ท่านใช้น้ำประปาบริโภคในกิจกรรมใดบ้าง (สามารถเลือกตอบได้มากกว่าหนึ่งข้อ)
         $this->createQuestionWithOptions($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_activity', $this->surveyTypeId, $section->order_index),
            'question_text'       => '6.1.2 ท่านใช้น้ำประปาบริโภคในกิจกรรมใดบ้าง (สามารถเลือกตอบได้มากกว่าหนึ่งข้อ)',
            'question_type'       => 'checkbox',
            'order_index'         => 3,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
        ], [
            ['text' => 'ดื่มโดยตรงจากก๊อกน้ำ', 'has_text_input' => false],
            ['text' => 'ดื่มหลังจากกรองด้วยเครื่องกรองน้ำ', 'has_text_input' => false],
            ['text' => ' ดื่มหลังจากการต้มให้เดือด', 'has_text_input' => false],
            ['text' => 'ใช้ชงชา/กาแฟ/เครื่องดื่มต่างๆ', 'has_text_input' => false],
            ['text' => 'ใช้สำหรับปรุงอาหาร', 'has_text_input' => false],
            ['text' => 'ล้างวัตถุดิบอาหาร เช่น ผัก ผลไม้ เนื้อสัตว์', 'has_text_input' => false],
            ['text' => 'ไม่ได้ใช้น้ำประปาเพื่อบริโภค', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
    }

    private function createSection7Questions($section)
    {
        $this->createGeneralSuggestionQuestions($section);
    }
}
