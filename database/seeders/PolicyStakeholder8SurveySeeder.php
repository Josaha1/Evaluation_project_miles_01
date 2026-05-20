<?php
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มพันธมิตร (Survey Type 8)
 */
class PolicyStakeholder8SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 8;

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
            ['text' => '1) กำกับดูแลเชิงนโยบาย', 'has_text_input' => false],
            ['text' => '2) วางแผน/ประเมินผลการดำเนินงาน', 'has_text_input' => false],
            ['text' => '3) ตรวจสอบธรรมาภิบาล/การบริหารความเสี่ยง', 'has_text_input' => false],
            ['text' => '4) ผู้สนับสนุนเชิงงบประมาณ/ทรัพยากร', 'has_text_input' => false],
            ['text' => '5) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true, 'requires_text' => true],
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
        //2.1 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยได้รับ/เคยเห็น/ เคยได้ยินข้อมูลข่าวสารจาก กปน. เช่น ข้อมูลข่าวสารเกี่ยวกับการรณรงค์ประหยัดน้ำ หรือ คุณภาพน้ำประปา หรือ ประกาศน้ำประปาไหลอ่อน-ไม่ไหล เป็นต้น หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.1 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยได้รับ/เคยเห็น/ เคยได้ยินข้อมูลข่าวสารจาก กปน. เช่น ข้อมูลข่าวสารเกี่ยวกับการรณรงค์ประหยัดน้ำ หรือ คุณภาพน้ำประปา หรือ ประกาศน้ำประปาไหลอ่อน-ไม่ไหล เป็นต้น หรือไม่',
            'question_type'     => 'multiple_choice',
            'order_index'       => 1,
        ], [
            '1) ไม่เคยได้รับ/ไม่เคยเห็น/ไม่เคยได้ยิน',
            '2) เคยได้รับ/เคยเห็น/ เคยได้ยิน ',
        ]);

        // 2.2 เพราะเหตุใดท่านจึง ไม่เคยได้รับ/ ไม่เคยเห็น/ ไม่เคยได้ยิน ข้อมูลข่าวสารจาก กปน. (ตอบได้มากกว่า 1 ข้อ) (ไปส่วนที่ 5)
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('no_info_reason', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.2 เพราะเหตุใดท่านจึง ไม่เคยได้รับ/ ไม่เคยเห็น/ ไม่เคยได้ยิน ข้อมูลข่าวสารจาก กปน. (ตอบได้มากกว่า 1 ข้อ) (ไปส่วนที่ 5)',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 2,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1,
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

        // 2.3 ท่านรู้จัก/เคยเห็น/เคยได้ยิน ข้อความ “ประปาคุณภาพ เพื่อชีวิตที่ดี (Quality Water for Quality Living)” หรือไม่
        $this->createQuestionWithOptions($section, [
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('slogan_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'     => '2.3 ท่านรู้จัก/เคยเห็น/เคยได้ยิน ข้อความ “ประปาคุณภาพ เพื่อชีวิตที่ดี (Quality Water for Quality Living)” หรือไม่',
            'question_type'     => 'multiple_choice',
            'order_index'       => 3,
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
        ], [
            'รู้จัก/เคยเห็น/เคยได้ยิน',
            'ไม่รู้จัก/ไม่เคยเห็น/ไม่เคยได้ยิน',
        ]);
        //2.4) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่
        $this->createMissionAwarenessMatrix($section);
        //2.5) ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น
        $this->createMissionNeedsMatrix($section);
        //2.6) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
        $this->createCustomerChannelMatrix($section);
        // 2.7) ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_info', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.7) ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'       => 'checkbox',
            'order_index'         => 6,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], [
            ['text' => '1) เว็บไซต์ของ กปน.', 'has_text_input' => false],
            ['text' => '2) เฟซบุ๊ก / โซเชียลมีเดียของ กปน.', 'has_text_input' => false],
            ['text' => '3) จดหมายข่าว / อีเมล', 'has_text_input' => false],
            ['text' => '4) การประชุม/เวทีความร่วมมือ', 'has_text_input' => false],
            ['text' => '5) รายงานประจำปี', 'has_text_input' => false],
            ['text' => '6) การติดต่อเฉพาะราย', 'has_text_input' => false],
            ['text' => '7) ข่าวประชาสัมพันธ์จากสื่อมวลชน', 'has_text_input' => false],
            ['text' => '8) บุคลากรของ กปน.', 'has_text_input' => false],
            ['text' => '9) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);
    }
    private function createMissionAwarenessMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) แผนยุทธศาสตร์และวิสัยทัศน์ของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) พันธกิจและเป้าหมายการดำเนินงานในระยะสั้น-ยาว', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การผลิตน้ำประปาตามแผนน้ำประปาปลอดภัย (WSP) ได้มาตรฐานขององค์การอนามัยโลก (WHO)', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ข้อตกลงความร่วมมือ เช่น MOU/MOA', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) ข้อมูลในการแลกเปลี่ยนความรู้และเสริมสร้างเครือข่าย เช่น การจัดประชุม สัมมนา หรือเวทีแลกเปลี่ยนความรู้', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การบริหารผลกระทบต่อสังคม เช่น ผลกระทบเชิงบวกจากโครงการ กปน. ต่อผู้มีส่วนได้ส่วนเสีย ความโปร่งใสในการดำเนินงานและการเปิดเผยข้อมูล', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การจัดซื้อจัดจ้างและความร่วมมือทางธุรกิจ เช่น ช่องทางและแบบฟอร์มสำหรับติดต่อหรือสมัครเป็นพันธมิตรทางธุรกิจ', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) โครงการหรือกิจกรรมที่สนับสนุนชุมชนสังคมอย่างเหมาะสม และต่อเนื่อง เช่น โครงการช่างประปาเพื่อประชาชน การส่งเสริมการใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมประปาพบประชาชน และกิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('mission_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.4) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 4,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], $missionTopics, $this->getAwarenessColumns());
    }
    private function createMissionNeedsMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) แผนยุทธศาสตร์และวิสัยทัศน์ของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) พันธกิจและเป้าหมายการดำเนินงานในระยะสั้น-ยาว', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การผลิตน้ำประปาตามแผนน้ำประปาปลอดภัย (WSP) ได้มาตรฐานขององค์การอนามัยโลก (WHO)', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ข้อตกลงความร่วมมือ เช่น MOU/MOA', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) ข้อมูลในการแลกเปลี่ยนความรู้และเสริมสร้างเครือข่าย เช่น การจัดประชุม สัมมนา หรือเวทีแลกเปลี่ยนความรู้', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การบริหารผลกระทบต่อสังคม เช่น ผลกระทบเชิงบวกจากโครงการ กปน. ต่อผู้มีส่วนได้ส่วนเสีย ความโปร่งใสในการดำเนินงานและการเปิดเผยข้อมูล', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การจัดซื้อจัดจ้างและความร่วมมือทางธุรกิจ เช่น ช่องทางและแบบฟอร์มสำหรับติดต่อหรือสมัครเป็นพันธมิตรทางธุรกิจ', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) โครงการหรือกิจกรรมที่สนับสนุนชุมชนสังคมอย่างเหมาะสม และต่อเนื่อง เช่น โครงการช่างประปาเพื่อประชาชน การส่งเสริมการใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมประปาพบประชาชน และกิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => '11) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_12', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('mission_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.5) ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น ',
            'question_type'       => 'matrix',
            'order_index'         => 5,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], $missionTopics, $this->getStandardNeedsColumns());
    }
    //2.6) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
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
            ['value' => 'topic_9', 'label' => '9) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $channelColumns = [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];
        // 2.6) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
        $this->createMatrixQuestion($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_preference', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.6) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 6,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $this->surveyTypeId, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
        ], $channels, $channelColumns);

    }

    private function createSection3Questions($section)
    {
        $topics = [
            // ด้านเนื้อหา
            '1) กปน. มีความชัดเจนในการสื่อสารข้อมูลกับพันธมิตร',
            '2) การประสานงานระหว่าง กปน. กับหน่วยงานของท่านมีประสิทธิภาพ',
            '3) กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
            '4) กปน. เปิดรับข้อเสนอแนะจากพันธมิตรเพื่อนำไปปรับปรุงการดำเนินงาน',
            '5) ความคาดหวังและความพึงพอใจในภาพรวม',

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
            [
                'value' => 'maternance_project',
                'label' => 'โครงการต่าง ๆ ของ กปน. เช่น โครงการปรับปรุงเส้นท่อประปา โครงการปรับปรุงกิจการประปาแผนหลัก มีส่วนช่วยในการยกระดับคุณภาพชีวิตให้ดีขึ้น',
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
