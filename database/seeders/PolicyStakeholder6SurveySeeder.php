<?php
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มชุมชนและสังคม (Survey Type 6)
 */
class PolicyStakeholder6SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 6;

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
        // 1.1 พื้นที่/ชุมชน - คำถามหลัก
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('community_area_type', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.1 พื้นที่/ชุมชน',
            'question_type'     => 'multiple_choice',
            'order_index'       => 1,
            'is_required'       => true,
            'validation_rules'  => json_encode(['required' => true]),
        ], [
            'ชุมชน',
            'โรงเรียน/สถานศึกษา',
            'ศาสนสถาน',
        ]);

        // 1.1.1 ชุมชน - คำถามย่อย
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('community_role', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.1.1 ชุมชน',
            'question_type'     => 'multiple_choice',
            'order_index'       => 2,
            'is_required'       => true,
           'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('community_area_type', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
            'validation_rules'  => json_encode(['required' => true]),
        ], [
            'ผู้นำชุมชน',
            'คณะกรรมการชุมชน',
            'ประชาชน',
        ]);

        // 1.1.2 โรงเรียน/สถานศึกษา - คำถามย่อย
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('school_role', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.1.2 โรงเรียน/สถานศึกษา',
            'question_type'     => 'multiple_choice',
            'order_index'       => 3,
            'is_required'       => true,
             'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('community_area_type', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
            'validation_rules'  => json_encode(['required' => true]),
        ], [
            'ผู้บริหารโรงเรียน',
            'คุณครู',
        ]);

        // 1.1.3 ศาสนสถาน - คำถามย่อย
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('religious_role', $this->surveyTypeId, $section->order_index),
            'question_text'     => '1.1.3 ศาสนสถาน',
            'question_type'     => 'multiple_choice',
            'order_index'       => 4,
            'is_required'       => true,
             'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('community_area_type', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 3,
                    ],
                ],
            ],
            'validation_rules'  => json_encode(['required' => true]),
        ], [
            'ศาสนาพุทธ (วัด)',
            'ศาสนาอิสลาม (มัสยิด)',
            'ศาสนาคริสต์ (โบสถ์)',
        ]);
    }

    private function createSection2Questions($section)
    {
        // 2.1 ท่านเคยได้รับข้อมูลข่าวสารจาก กปน. หรือไม่ ?
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.1 ท่านเคยได้รับข้อมูลข่าวสารจาก กปน. หรือไม่ ?',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 1,
            'skip_logic'        => [                       // ✅ เปลี่ยนเป็น skip_logic
                'type'            => 'always_skip_to_section', // ✅ เปลี่ยนเป็น always_skip_to_section
                'skip_to_section' => 5,                        // ✅ ข้ามไปส่วนที่ 6
                'conditions'      => [
                    [
                        'option_value' => 2, // ✅ เมื่อเลือกตัวเลือกที่ 2
                    ],
                ],
            ],
        ], [
            ['text' => '1) เคย  ', 'has_text_input' => false],
            ['text' => '2) ไม่เคย เนื่องจาก', 'has_text_input' => true],
        ]);

        // 2.2 ท่านคิดว่าข้อมูลข่าวสารที่ได้รับจาก กปน. มีความน่าเชื่อถือเพียงใด?
        $this->createQuestionWithOptions($section, [
            'code'              => $this->generateQuestionCode('info_credibility', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.2 ท่านคิดว่าข้อมูลข่าวสารที่ได้รับจาก กปน. มีความน่าเชื่อถือเพียงใด?',
            'question_type'     => 'multiple_choice',
            'order_index'       => 2,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย', 'ไม่น่าเชื่อถือเลย']);

        // 2.3 ความถี่ในการได้รับข้อมูลหรือรายงานจาก กปน.
        $this->createQuestionWithOptions($section, [
            'code'              => $this->generateQuestionCode('info_frequency', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.3 ความถี่ในการได้รับข้อมูลหรือรายงานจาก กปน.',
            'question_type'     => 'multiple_choice',
            'order_index'       => 3,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], $this->getStandardFrequencyOptions());
        //2.4 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่
        $this->createMissionAwarenessMatrix($section);
        // 2.4.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mission_info_awareness_chose', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.4.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)',
            'description'       => 'กรณีข้อ 2.4 ตอบ เคย ในประเด็นที่ 8) การรณรงค์การใช้น้ำอย่างรู้คุณค่า กรุณาตอบคำถามข้อ 2.4.1',
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
        $this->createMissionNeedsMatrix($section);
        $this->createCustomerChannelMatrix($section);
        // 2.7 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_info', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.7 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'       => 'checkbox',
            'order_index'         => 8,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ], [
            ['text' => '1) เว็บไซต์ของ กปน.', 'has_text_input' => false],
            ['text' => '2) เฟซบุ๊ก / โซเชียลมีเดียของ กปน.', 'has_text_input' => false],
            ['text' => '3) จดหมายข่าว / อีเมล', 'has_text_input' => false],
            ['text' => '4) การประชุม/เวทีความร่วมมือ', 'has_text_input' => false],
            ['text' => '5) รายงานประจำปี	', 'has_text_input' => false],
            ['text' => '6) การติดต่อเฉพาะราย', 'has_text_input' => false],
            ['text' => '7) ข่าวประชาสัมพันธ์จากสื่อมวลชน', 'has_text_input' => false],
            ['text' => '8) บุคลากรของ กปน.', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

    }
    //2.4 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่
    private function createMissionAwarenessMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) ผลการตรวจสอบคุณภาพน้ำประปา', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) ข้อมูลเกี่ยวกับสารปนเปื้อนหรือความเสี่ยงที่อาจเกิดขึ้น', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) กระบวนการผลิตและส่งจ่ายน้ำประปา', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) แนวทางการตรวจสอบคุณภาพน้ำด้วยตนเองในครัวเรือน', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การหยุดจ่ายน้ำตามแผนซ่อมบำรุง การแจ้งเหตุฉุกเฉินเกี่ยวกับระบบน้ำ และแนวทางการเตรียมตัวในช่วงหยุดจ่ายน้ำ ', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) โครงการพัฒนาแหล่งน้ำและระบบประปาชุมชน', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '7) กิจกรรมส่งเสริมสุขภาพและอนามัยในโรงเรียน/ชุมชน เช่น โครงการรับรองคุณภาพน้ำประปาดื่มได้', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '8) การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) ช่องทางร้องเรียน/เสนอแนะบริการ', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => '12) โครงการหรือกิจกรรมที่สนับสนุนชุมชนสังคมอย่างเหมาะสม และต่อเนื่อง เช่น โครงการช่างประปาเพื่อประชาชน การส่งเสริมการใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมประปาพบประชาชน และกิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => '13) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('customer_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.4 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 4,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], $missionTopics, $this->getAwarenessColumns());
    }
    //2.5 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น
    private function createMissionNeedsMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) ผลการตรวจสอบคุณภาพน้ำประปา', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) ข้อมูลเกี่ยวกับสารปนเปื้อนหรือความเสี่ยงที่อาจเกิดขึ้น', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) กระบวนการผลิตและส่งจ่ายน้ำประปา', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) แนวทางการตรวจสอบคุณภาพน้ำด้วยตนเองในครัวเรือน', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) การหยุดจ่ายน้ำตามแผนซ่อมบำรุง การแจ้งเหตุฉุกเฉินเกี่ยวกับระบบน้ำ และแนวทางการเตรียมตัวในช่วงหยุดจ่ายน้ำ ', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) โครงการพัฒนาแหล่งน้ำและระบบประปาชุมชน', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '7) กิจกรรมส่งเสริมสุขภาพและอนามัยในโรงเรียน/ชุมชน เช่น โครงการรับรองคุณภาพน้ำประปาดื่มได้', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '8) การรณรงค์การใช้น้ำอย่างรู้คุณค่า', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) ช่องทางร้องเรียน/เสนอแนะบริการ', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => '12) โครงการหรือกิจกรรมที่สนับสนุนชุมชนสังคมอย่างเหมาะสม และต่อเนื่อง เช่น โครงการช่างประปาเพื่อประชาชน การส่งเสริมการใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมประปาพบประชาชน และกิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_13', 'label' => '13) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_14', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('mission_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.5 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น ',
            'question_type'       => 'matrix',
            'order_index'         => 6,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
                    ],
                ],
            ],
        ], $missionTopics, $this->getStandardNeedsColumns());
    }

    private function createCustomerChannelMatrix($section)
    {
        $channels = [
            ['value' => 'topic_1', 'label' => '1) เว็บไซต์ของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) เฟซบุ๊ก / โซเชียลมีเดียของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) จดหมายข่าว / อีเมล', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) การประชุม/เวทีความร่วมมือ', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) รายงานประจำปี	', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การติดต่อเฉพาะราย', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) ข่าวประชาสัมพันธ์จากสื่อมวลชน', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) บุคลากรของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $channelColumns = [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];
        // 2.6 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
        $this->createMatrixQuestion($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_preference', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.6 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 7,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ], $channels, $channelColumns);

    }

    private function createSection3Questions($section)
    {
        $topics = [
            // ด้านเนื้อหา
            '1) คุณภาพน้ำประปา',
            '2) ความสะดวกในการติดต่อ กปน.',
            '3) การให้บริการของเจ้าหน้าที่ (อัธยาศัย ความสุภาพ)',
            '4) ความรวดเร็วในการแก้ไขปัญหาเมื่อได้รับการแจ้งเหตุ',
            '5) การแจ้งเตือนเหตุการณ์ (เช่น น้ำไม่ไหล) ล่วงหน้า',
            // ด้านรูปแบบ
            '6) ความโปร่งใสในการบริหารงาน',
            '7) ความพึงพอใจต่อบริการโดยรวมของ กปน.',

        ];

        $this->createDualRatingQuestion($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('customer_expectation_satisfaction', $this->surveyTypeId, $section->order_index),
            'question_text'     => '3.1 กรุณาประเมินความพึงพอใจของท่านต่อหัวข้อด้านล่าง โดยให้คะแนนในระดับ 1 – 5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
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
                'label' => '1) น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก (หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1)',
            ],
            [
                'value' => 'transparency_confidence',
                'label' => '2) มีความสม่ำเสมอในการให้บริการ สามารถให้บริการน้ำประปาตลอด 24 ชั่วโมง',
            ],
            [
                'value' => 'job_security_confidence',
                'label' => '3) การพัฒนาระบบการบริการ โดยนำเทคโนโลยีมาใช้เพื่อเพิ่มความสะดวกกับ ลูกค้า เช่น แอปพลิเคชัน MWA onMobile',
            ],
            [
                'value' => 'work_environment_confidence',
                'label' => '4) กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
            ],
            [
                'value' => 'leadership_confidence',
                'label' => '5) กปน. ให้ความสำคัญกับสังคมและสิ่งแวดล้อม เช่น การจัดอบรมวิชาชีพช่างประปาฟรีให้กับผู้ที่สนใจ',
            ],
            [
                'value' => 'social_impact_confidence',
                'label' => '6) การจัดการปัญหาเรื่องร้องเรียนการทุจริตของ กปน.',
            ],
             [
                'value' => 'maternance_project',
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
