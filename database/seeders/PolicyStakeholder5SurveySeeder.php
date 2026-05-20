<?php
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มสื่อมวลชน (Survey Type 5)
 * - มี section พิเศษ "แบบสอบถามวัดความพึงพอใจจากการร่วมงานกับฝ่ายสื่อสารองค์กร"
 */
class PolicyStakeholder5SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 5;

    protected function getSectionTemplates()
    {
        return [
            ['title' => 'ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม', 'description' => 'ข้อมูลพื้นฐานของผู้ตอบแบบสอบถาม', 'order_index' => 1],
            ['title' => 'แบบสอบถามวัดการรับรู้ข้อมูลข่าวสารของ กปน.', 'description' => 'ช่องทางและการรับรู้ข้อมูลข่าวสารจาก กปน.', 'order_index' => 2],
            ['title' => 'แบบสอบถามวัดความคาดหวังและความพึงพอใจต่อการประชาสัมพันธ์ของ กปน.', 'description' => 'การประเมินความคาดหวังและความพึงพอใจ', 'order_index' => 3],
            ['title' => 'แบบสอบถามวัดการรับรู้และความพึงพอใจข้อมูลข่าวสารของ กปน. เปรียบเทียบกับหน่วยงานอื่น', 'description' => 'การเปรียบเทียบกับหน่วยงานรัฐวิสาหกิจอื่น', 'order_index' => 4],
            ['title' => 'แบบสอบถามวัดความพึงพอใจจากการร่วมงานกับฝ่ายสื่อสารองค์กรของ กปน.', 'description' => 'ความพึงพอใจจากการร่วมงาน', 'order_index' => 5],
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

        // ประเภทสื่อที่ทำงานปัจจุบัน
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('social', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.3 ประเภทสื่อที่ทำงานปัจจุบัน',
            'question_type' => 'multiple_choice',
            'order_index'   => 3,
        ], [
            ['text' => 'โทรทัศน์', 'has_text_input' => false],
            ['text' => 'วิทยุ', 'has_text_input' => false],
            ['text' => 'หนังสือพิมพ์', 'has_text_input' => false],
            ['text' => 'สื่อออนไลน์', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
        // ตำแหน่งการทำงานปัจจุบัน
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('org_role', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.4 ตำแหน่งการทำงานปัจจุบัน',
            'question_type' => 'multiple_choice',
            'order_index'   => 4,
        ], [
            ['text' => 'ผู้จัดรายการ/ผู้ประกาศข่าว', 'has_text_input' => false],
            ['text' => 'บรรณาธิการ/หัวหน้ากองข่าว/ ผู้ช่วยฯ', 'has_text_input' => false],
            ['text' => 'โปรดิวเซอร์/ทีมงานเบื้องหลัง', 'has_text_input' => false],
            ['text' => 'ผู้สื่อข่าวภาคสนาม/ช่างภาพภาคสนาม', 'has_text_input' => false],
            ['text' => 'ผู้บริหาร/ผู้อำนวยการ/ผู้จัดการ', 'has_text_input' => false],
            ['text' => 'นักประชาสัมพันธ์', 'has_text_input' => false],
            ['text' => 'คอลัมนิสต์', 'has_text_input' => false],
            ['text' => 'ผู้ดูแลเว็บไซต์', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
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
            'question_text'     => '2.1.1 เพราะเหตุใดท่านจึง ไม่เคยได้รับ/ ไม่เคยเห็น/ ไม่เคยได้ยิน ข้อมูลข่าวสารจาก กปน. (ตอบได้มากกว่า 1 ข้อ) (ไปต่อส่วนที่ 6)',
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
                'skip_to_section' => 6,
            ],
        ], [
            ['text' => '1) ไม่สามารถเข้าถึงช่องทางในการรับข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => '2) ไม่มีความสนใจในข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => '3) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
        // 2.2 ท่านรู้จัก/เคยเห็น/เคยได้ยิน ข้อความ “ประปาคุณภาพ เพื่อชีวิตที่ดี (Quality Water for Quality Living)” หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_hear_vision', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.2 ท่านรู้จัก/เคยเห็น/เคยได้ยิน ข้อความ “ประปาคุณภาพ เพื่อชีวิตที่ดี (Quality Water for Quality Living)” หรือไม่',
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
        // 2.3 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่
        $this->createGeneralAwarenessMatrix($section);
        //2.3.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mission_info_awareness_chose', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.3.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)',
            'description'       => 'กรณีข้อ 2.3 ตอบ เคย ในประเด็นที่ 7) การรณรงค์การใช้น้ำอย่างรู้คุณค่า กรุณาตอบคำถามข้อ 2.3.1',
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
                'text'           => '8) รินน้ำให้เพียงพอต่อความต้องการ แนะนำให้ใช้แก้วน้ำส่วนตัวเพื่อจะได้ล้างแก้วแค่ใบเดียว',
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
        // 2.4 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น (ตอบได้มากกว่า 1)
        $this->createGeneralNeedsMatrix($section);
        // 2.5 2.6
        $this->createCustomerChannelMatrix($section);

    }
    private function createGeneralAwarenessMatrix($section)
    {
        $topics = [
            ['value' => 'topic_1', 'label' => '1) การให้บริการของสำนักงานประปาสาขา การรับรองมาตรฐานการให้บริการของศูนย์ราชการสะดวก และ Call Center 1125', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) การให้บริการด้วย Digital Service อาทิ การชำระเงินผ่านช่องทางอิเล็กทรอนิกส์ MWA onMobile บริการ e-bill / e-Tax Invoice & e-Reciept การรับแจ้งท่อประปาแตกรั่ว เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การพัฒนานวัตกรรมและเทคโนโลยีของ กปน. เพื่อเพิ่มประสิทธิภาพในการทำงาน อาทิ นวัตกรรมธารารักษ์ เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ผลิตภัณฑ์ และบริการเกี่ยวกับธุรกิจที่เกี่ยวเนื่องของ กปน. ได้แก่ งานล้างถังพักน้ำ และบริการ Health Care Solution', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การผลิตน้ำประปาตามแผนน้ำประปาปลอดภัย (WSP) ได้มาตรฐานขององค์การอนามัยโลก (WHO)', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) โครงการปรับปรุงเส้นท่อประปาใหม่ เพื่อลดการแตกรั่วของท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ฉลากประหยัดน้ำเบอร์ 5 เบอร์ 4 เบอร์ 3', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) การดำเนินงานด้านความรับผิดชอบต่อสังคมและสิ่งแวดล้อม (CSR) เช่น การพัฒนาชุมชนสำคัญ การใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) การดำเนินงานเพื่อสาธารณประโยชน์ตามนโยบายของรัฐบาลและกระทรวงมหาดไทยที่เป็นประโยชน์ต่อสังคมส่วนรวม เช่น การสนับสนุนงานบรรเทาสาธารณภัย เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => '12) การลงทุนเพื่อเพิ่มศักยภาพในระบบประปา เช่น การขยายกำลังการผลิต การก่อสร้างอุโมงค์ส่งน้ำ และสถานีสูบน้ำ', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => '13) การดำเนินงานด้านการลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2) เช่น ลดปริมาณการใช้กระดาษ ลดปริมาณการใช้ไฟฟ้าในอาคาร ลดการใช้ไฟฟ้าในกระบวนการผลิตน้ำ ลดการใช้น้ำมัน และโครงการใช้พลังงานแสงอาทิตย์ (Solar Cell) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => '14) การประกาศแจ้งเตือนก่อนการหยุดจ่ายน้ำเพื่อซ่อมแซมท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => '15) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ เช่น วารสารน้ำก๊อก เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => '16) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('customer_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.3 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 4,
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
            ['value' => 'topic_1', 'label' => '1) การให้บริการของสำนักงานประปาสาขา การรับรองมาตรฐานการให้บริการของศูนย์ราชการสะดวก และ Call Center 1125', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) การให้บริการด้วย Digital Service อาทิ การชำระเงินผ่านช่องทางอิเล็กทรอนิกส์ MWA onMobile บริการ e-bill / e-Tax Invoice & e-Reciept การรับแจ้งท่อประปาแตกรั่ว เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การพัฒนานวัตกรรมและเทคโนโลยีของ กปน. เพื่อเพิ่มประสิทธิภาพในการทำงาน อาทิ นวัตกรรมธารารักษ์ เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ผลิตภัณฑ์ และบริการเกี่ยวกับธุรกิจที่เกี่ยวเนื่องของ กปน. ได้แก่ งานล้างถังพักน้ำ และบริการ Health Care Solution', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การผลิตน้ำประปาตามแผนน้ำประปาปลอดภัย (WSP) ได้มาตรฐานขององค์การอนามัยโลก (WHO)', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) โครงการปรับปรุงเส้นท่อประปาใหม่ เพื่อลดการแตกรั่วของท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ฉลากประหยัดน้ำเบอร์ 5 เบอร์ 4 เบอร์ 3', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) การดำเนินงานด้านความรับผิดชอบต่อสังคมและสิ่งแวดล้อม (CSR) เช่น การพัฒนาชุมชนสำคัญ การใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) การดำเนินงานเพื่อสาธารณประโยชน์ตามนโยบายของรัฐบาลและกระทรวงมหาดไทยที่เป็นประโยชน์ต่อสังคมส่วนรวม เช่น การสนับสนุนงานบรรเทาสาธารณภัย เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => '12) การลงทุนเพื่อเพิ่มศักยภาพในระบบประปา เช่น การขยายกำลังการผลิต การก่อสร้างอุโมงค์ส่งน้ำ และสถานีสูบน้ำ', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => '13) การดำเนินงานด้านการลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2) เช่น ลดปริมาณการใช้กระดาษ ลดปริมาณการใช้ไฟฟ้าในอาคาร ลดการใช้ไฟฟ้าในกระบวนการผลิตน้ำ ลดการใช้น้ำมัน และโครงการใช้พลังงานแสงอาทิตย์ (Solar Cell) เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => '14) การประกาศแจ้งเตือนก่อนการหยุดจ่ายน้ำเพื่อซ่อมแซมท่อประปา', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => '15) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ เช่น วารสารน้ำก๊อก เป็นต้น', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => '16) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('general_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.4 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น (ตอบได้มากกว่า 1)',
            'question_type'       => 'matrix',
            'order_index'         => 6,
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
    private function createCustomerChannelMatrix($section)
    {
        $channels = [
            ['value' => 'topic_1', 'label' => '1) โทรทัศน์ ', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) วิทยุ', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) หนังสือพิมพ์', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) โปสเตอร์ แผ่นพับ ใบปลิว', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) เว็บไซต์ กปน. (www.mwa.co.th)', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) เว็บไซต์อื่น ๆ เช่น มติชนออนไลน์ ไทยรัฐออนไลน์ sanook.com', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) เฟซบุ๊ก กปน. (www.facebook.com/MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) เฟซบุ๊กอื่น ๆ เช่น Facebook สวพ. FM.91 Facebook จส.100', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) แอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) ไลน์ กปน. (@MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) ยูทูป กปน. (MWAthailand) ', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => '12) X (ทวิตเตอร์) กปน. (MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => '13) X (ทวิตเตอร์) ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => '14) อินสตาแกรม กปน. (MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_15', 'label' => '15) อินสตาแกรม ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_16', 'label' => '16) Tiktok กปน. (MWAthailand)', 'has_text_input' => false],
            ['value' => 'topic_17', 'label' => '17) Tiktok ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_18', 'label' => '18) กิจกรรมรณรงค์ และการจัดนิทรรศการ', 'has_text_input' => false],
            ['value' => 'topic_19', 'label' => '19) ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['value' => 'topic_20', 'label' => '20) โฆษณาข้างรถประจำทาง', 'has_text_input' => false],
            ['value' => 'topic_21', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $channelColumns = [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];
        // 2.5 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
        $this->createMatrixQuestion($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_preference', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.5 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 7,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
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
        ], $channels, $channelColumns);
        // 2.6 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_info', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.6 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'       => 'checkbox',
            'order_index'         => 8,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
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
        ], [
            ['text' => '1) โทรทัศน์ ', 'has_text_input' => false],
            ['text' => '2) วิทยุ', 'has_text_input' => false],
            ['text' => '3) หนังสือพิมพ์', 'has_text_input' => false],
            ['text' => '4) โปสเตอร์ แผ่นพับ ใบปลิว', 'has_text_input' => false],
            ['text' => '5) เว็บไซต์ กปน. (www.mwa.co.th)', 'has_text_input' => false],
            ['text' => '6) เว็บไซต์อื่น ๆ เช่น มติชนออนไลน์ ไทยรัฐออนไลน์ sanook.com', 'has_text_input' => false],
            ['text' => '7) เฟซบุ๊ก กปน. (www.facebook.com/MWAthailand)', 'has_text_input' => false],
            ['text' => '8) เฟซบุ๊กอื่น ๆ เช่น Facebook สวพ. FM.91 Facebook จส.100', 'has_text_input' => false],
            ['text' => '9) แอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['text' => '10) ไลน์ กปน. (@MWAthailand)', 'has_text_input' => false],
            ['text' => '11) ยูทูป กปน. (MWAthailand) ', 'has_text_input' => false],
            ['text' => '12) X (ทวิตเตอร์) กปน. (MWAthailand)', 'has_text_input' => false],
            ['text' => '13) X (ทวิตเตอร์) ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['text' => '14) อินสตาแกรม กปน. (MWAthailand)', 'has_text_input' => false],
            ['text' => '15) อินสตาแกรม ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['text' => '16) Tiktok กปน. (MWAthailand)', 'has_text_input' => false],
            ['text' => '17) Tiktok ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['text' => '18) กิจกรรมรณรงค์ และการจัดนิทรรศการ', 'has_text_input' => false],
            ['text' => '19) ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['text' => '20) โฆษณาข้างรถประจำทาง', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
         // 2.7 สื่อมวลชนมีการนำข้อมูลของ กปน. เผยแพร่ช่องทางใดบ้าง (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_output', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.7 สื่อมวลชนมีการนำข้อมูลของ กปน. เผยแพร่ช่องทางใดบ้าง (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'       => 'checkbox',
            'order_index'         => 9,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
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
        ], [
            ['text' => '1) โทรทัศน์ ', 'has_text_input' => false],
            ['text' => '2) วิทยุ', 'has_text_input' => false],
            ['text' => '3) หนังสือพิมพ์', 'has_text_input' => false],
            ['text' => '4) โปสเตอร์ แผ่นพับ ใบปลิว', 'has_text_input' => false],
            ['text' => '5) เว็บไซต์อื่น ๆ เช่น มติชนออนไลน์ ไทยรัฐออนไลน์ sanook.com', 'has_text_input' => false],
            ['text' => '6) เฟซบุ๊กอื่น ๆ เช่น Facebook สวพ. FM.91 Facebook จส.100', 'has_text_input' => false],
            ['text' => '7) X (ทวิตเตอร์) ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['text' => '8) อินสตาแกรม ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['text' => '9) Tiktok ผู้ใช้งานอื่น ๆ ไม่ใช่ของ กปน.', 'has_text_input' => false],
            ['text' => '10) กิจกรรมรณรงค์ และการจัดนิทรรศการ', 'has_text_input' => false],
            ['text' => '11) ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['text' => '12) โฆษณาข้างรถประจำทาง', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
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
        // สำหรับกลุ่มสื่อมวลชน - ความพึงพอใจจากการร่วมงานกับฝ่ายสื่อสารองค์กร
        $mediaTopics = [
            'ความรวดเร็วในการตอบสนองต่อการขอข้อมูล',
            'ความถูกต้องของข้อมูลข่าวสาร',
            'ความครบถ้วนสมบูรณ์ของข้อมูลข่าวสาร',
            'ความน่าสนใจของข้อมูลข่าวสาร',
            'ช่องทางในการส่งข้อมูลข่าวสาร',
            'การประสานงานและช่องทางในการติดต่อกับเจ้าหน้าที่ กปน.',
            'ความโปร่งใสในการบริหารงาน',
        ];

        // Create rating columns (1-5)
        $ratingColumns = [];
        for ($i = 1; $i <= 5; $i++) {
            $ratingColumns[] = [
                'value'  => (string) $i,
                'label'  => (string) $i,
                'config' => [
                    'rating_value' => $i,
                    'scale_label'  => $this->ratingScales['satisfaction']->scale_labels[$i] ?? "ระดับ {$i}",
                ],
            ];
        }

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('media_collaboration_satisfaction', $this->surveyTypeId, $section->order_index),
            'question_text'       => '5.1 แบบสอบถามวัดความพึงพอใจจากการร่วมงานกับฝ่ายสื่อสารองค์กรของ กปน.',
            'description'         => 'กรุณาประเมินความพึงพอใจของท่านจากการร่วมงานกับฝ่ายสื่อสารองค์กรของ กปน. โดยให้คะแนนในระดับ 1-5',
            'question_type'       => 'matrix',
            'order_index'         => 1,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความพึงพอใจ',
            'scale_type'          => 'satisfaction',
        ], $mediaTopics, $ratingColumns, $this->ratingScales['satisfaction']);
    }

    private function createSection6Questions($section)
    {
        $topics = [
            [
                'value' => 'water_quality_confidence',
                'label' => '1) น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก(หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 6.1.1)',
            ],
            [
                'value' => 'transparency_confidence',
                'label' => '2) มีความสม่ำเสมอในการให้บริการ สามารถให้บริการน้ำประปาตลอด 24 ชั่วโมง',
            ],
            [
                'value' => 'budget_confidence',
                'label' => '3) การพัฒนาระบบการบริการ โดยนำเทคโนโลยีมาใช้เพื่อเพิ่มความสะดวกกับ ลูกค้า เช่น แอปพลิเคชัน MWA onMobile',
            ],
            [
                'value' => 'leadership_confidence',
                'label' => '4) กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
            ],
            [
                'value' => 'digital_confidence',
                'label' => '5) กปน. สนับสนุนการดำเนินงานที่เกี่ยวกับความรับผิดชอบต่อสังคม และสิ่งแวดล้อม เช่น โครงการช่างประปาเพื่อประชาชน และโครงการเสริมสร้างความเข้มแข็งของชุมชนสำคัญ',
            ],
            [
                'value' => 'social_impact_confidence',
                'label' => '6) การจัดการปัญหาเรื่องร้องเรียนการทุจริตของ กปน.',
            ],
            [
                'value' => 'complaint_confidence',
                'label' => '7) โครงการต่าง ๆ ของ กปน. เช่น โครงการปรับปรุงเส้นท่อประปา โครงการปรับปรุงกิจการประปาแผนหลัก มีส่วนช่วยในการยกระดับคุณภาพชีวิตให้ดีขึ้น',
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
            'question_text'       => '6.1 ท่านมีระดับความเชื่อมั่นต่อ กปน. อย่างไรบ้าง',
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
    }

    private function createSection7Questions($section)
    {

        // เพิ่มคำถามเฉพาะสื่อมวลชน
        $this->createQuestionWithOptions($section, [
            'code'             => $this->generateQuestionCode('media_suggestion', $this->surveyTypeId, $section->order_index),
            'question_text'    => 'ข้อเสนอแนะเพิ่มเติมต่อการประชาสัมพันธ์ของ กปน.',
            'description'      => 'กรุณาให้ข้อเสนอแนะเกี่ยวกับการปรับปรุงการประสานงานและการให้บริการข้อมูลข่าวสารแก่สื่อมวลชน',
            'question_type'    => 'text_long',
            'is_required'      => false,
            'order_index'      => 2,
            'validation_rules' => ['max_length' => 1000],
            'help_text'        => 'เช่น การปรับปรุงกระบวนการแถลงข่าว การเพิ่มช่องทางการติดต่อ หรือการจัดหาข้อมูลเบื้องหลัง',
        ]);
    }
}
