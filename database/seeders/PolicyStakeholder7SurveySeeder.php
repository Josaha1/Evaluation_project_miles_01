<?php
namespace Database\Seeders;

/**
 * แบบสอบถามกลุ่มคู่ค้า (Survey Type 7)
 */
class PolicyStakeholder7SurveySeeder extends AbstractSurveySeeder
{
    protected $surveyTypeId = 7;

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
        // ชื่อบริษัท/หน่วยงาน
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('org_name', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.1) ชื่อบริษัท/หน่วยงาน',
            'question_type' => 'text_short',
            'order_index'   => 1,
        ]);

        // ประเภทของคู่ค้า
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('org_type', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.2) ประเภทของคู่ค้า',
            'question_type' => 'multiple_choice',
            'order_index'   => 2,
        ], [
            ['text' => 'ผู้รับจ้างงานก่อสร้างวางท่อประปา / งานซ่อมท่อ / งานก่อสร้างโยธา', 'has_text_input' => false],
            ['text' => 'ผู้รับจ้างงานโครงการ', 'has_text_input' => false],
            ['text' => 'จ้างงาน IT', 'has_text_input' => false],
            ['text' => 'ผู้ขาย', 'has_text_input' => false],
            ['text' => 'ที่ปรึกษา / ผู้ให้บริการงานจ้างออกแบบหรือควบคุมงานก่อสร้าง', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

        // ลักษณะความร่วมมือ
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('cooperation_type', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.3) ลักษณะความร่วมมือ',
            'question_type' => 'multiple_choice',
            'order_index'   => 3,
        ], [
            ['text' => 'งานจัดซื้อจัดจ้าง', 'has_text_input' => false],
            ['text' => 'งานจ้างก่อสร้าง', 'has_text_input' => false],
            ['text' => 'งานบริหารโครงการ', 'has_text_input' => false],
            ['text' => 'งานวางแผน / ให้คำปรึกษา / งานให้บริการควบคุมงาน', 'has_text_input' => false],
            ['text' => 'งานระบบ / เทคโนโลยี', 'has_text_input' => false],
            ['text' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

        // ในช่วง 1 ปีที่ผ่านมาท่านเคยดำเนินงานร่วมกับ กปน. หรือไม่
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('cooperation_duration', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.4) ในช่วง 1 ปีที่ผ่านมาท่านเคยดำเนินงานร่วมกับ กปน. หรือไม่',
            'question_type' => 'multiple_choice',
            'order_index'   => 4,
        ], ['ไม่เคย', '1 – 3 ครั้ง', 'มากกว่า 3 ครั้ง']);

        // ท่านเคยเข้าร่วมกิจกรรมส่งเสริมความร่วมมือ เช่น อบรม สัมมนา เวทีรับฟังความคิดเห็นกับ กปน. หรือไม่?
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('meeting_duration', $this->surveyTypeId, $section->order_index),
            'question_text' => '1.5) ท่านเคยเข้าร่วมกิจกรรมส่งเสริมความร่วมมือ เช่น อบรม สัมมนา เวทีรับฟังความคิดเห็นกับ กปน. หรือไม่?',
            'question_type' => 'multiple_choice',
            'order_index'   => 5,
        ], ['เคย', 'ไม่เคย']);
    }

    private function createSection2Questions($section)
    {
        // 2.1) ท่านรับรู้ข้อมูลข่าวสารการจัดซื้อจัดจ้างผ่านช่องทางใด (เลือกตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('get_info', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.1) ท่านรับรู้ข้อมูลข่าวสารการจัดซื้อจัดจ้างผ่านช่องทางใด (เลือกตอบได้มากกว่า 1 ข้อ) ',
            'question_type' => 'checkbox',
            'order_index'   => 1,
            'is_required'   => true,
        ], [
            ['text' => '1) เว็บไซต์การประปานครหลวง', 'has_text_input' => false],
            ['text' => '2) ระบบ e-GP', 'has_text_input' => false],
            ['text' => '3) อีเมลแจ้งเตือน/จดหมายทางการ / ESG', 'has_text_input' => false],
            ['text' => '4) กลุ่มไลน์/เฟซบุ๊ก/ช่องทางดิจิทัลอื่นๆ', 'has_text_input' => false],
            ['text' => '5) งานสัมมนา/การประชุมคู่ค้า/เทคโนโลยี', 'has_text_input' => false],
            ['text' => '6) เจ้าหน้าที่ประสานงาน', 'has_text_input' => false],
            ['text' => '7) อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ]);

        // 2.2) ระดับความพึงพอใจต่อข้อมูลข่าวสารการจัดซื้อจัดจ้าง
        $this->createQuestionWithOptions($section, [
            'code'          => $this->generateQuestionCode('org_type', $this->surveyTypeId, $section->order_index),
            'question_text' => '2.2) ระดับความพึงพอใจต่อข้อมูลข่าวสารการจัดซื้อจัดจ้าง',
            'question_type' => 'multiple_choice',
            'order_index'   => 2,
            'is_required'   => true,
        ], [
            ['text' => '1) ไม่พอใจเลย', 'has_text_input' => false],
            ['text' => '2) ไม่ค่อยพอใจ', 'has_text_input' => false],
            ['text' => '3) ปานกลาง', 'has_text_input' => false],
            ['text' => '4) พอใจ', 'has_text_input' => false],
            ['text' => '5) พอใจมาก', 'has_text_input' => false],
        ]);

        //2.3) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่
        $this->createMissionAwarenessMatrix($section);
        //2.4) ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น
        $this->createMissionNeedsMatrix($section);
        //2.5) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
        $this->createCustomerChannelMatrix($section);
        // 2.6) ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)
        $this->createQuestionWithOptions($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_info', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.6) ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'       => 'checkbox',
            'order_index'         => 6,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
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

    private function createMissionAwarenessMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) แผนการจัดซื้อจัดจ้างประจำปี', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) หลักเกณฑ์การพิจารณาคัดเลือกคู่ค้า', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การแจ้งการเปลี่ยนแปลงข้อกำหนด TOR ที่มีการวิจารณ์', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ประกาศประกวดราคา และผลการจัดซื้อจัดจ้าง', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) ช่องทางร้องเรียนหรือข้อเสนอแนะจากคู่ค้า', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การฝึกอบรมหรือสัมมนาสำหรับคู่ค้า', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) โครงการหรือกิจกรรมที่สนับสนุนชุมชนสังคมอย่างเหมาะสม และต่อเนื่อง เช่น โครงการช่างประปาเพื่อประชาชน การส่งเสริมการใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมประปาพบประชาชน และกิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('mission_info_awareness', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.3) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 3,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
        ], $missionTopics, $this->getAwarenessColumns());
    }
    private function createMissionNeedsMatrix($section)
    {
        $missionTopics = [
            ['value' => 'topic_1', 'label' => '1) แผนการจัดซื้อจัดจ้างประจำปี', 'has_text_input' => false],
            ['value' => 'topic_2', 'label' => '2) หลักเกณฑ์การพิจารณาคัดเลือกคู่ค้า', 'has_text_input' => false],
            ['value' => 'topic_3', 'label' => '3) การแจ้งการเปลี่ยนแปลงข้อกำหนด TOR ที่มีการวิจารณ์', 'has_text_input' => false],
            ['value' => 'topic_4', 'label' => '4) ประกาศประกวดราคา และผลการจัดซื้อจัดจ้าง', 'has_text_input' => false],
            ['value' => 'topic_5', 'label' => '5) ช่องทางร้องเรียนหรือข้อเสนอแนะจากคู่ค้า', 'has_text_input' => false],
            ['value' => 'topic_6', 'label' => '6) การฝึกอบรมหรือสัมมนาสำหรับคู่ค้า', 'has_text_input' => false],
            ['value' => 'topic_7', 'label' => '7) การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาลของ กปน.', 'has_text_input' => false],
            ['value' => 'topic_8', 'label' => '8) ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ', 'has_text_input' => false],
            ['value' => 'topic_9', 'label' => '9) โครงการหรือกิจกรรมที่สนับสนุนชุมชนสังคมอย่างเหมาะสม และต่อเนื่อง เช่น โครงการช่างประปาเพื่อประชาชน การส่งเสริมการใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมประปาพบประชาชน และกิจกรรมยอดน้ำ & เฟรนด์', 'has_text_input' => false],
            ['value' => 'topic_10', 'label' => '10) โครงการพัฒนาแอปพลิเคชัน MWA onMobile', 'has_text_input' => false],
            ['value' => 'topic_11', 'label' => 'อื่น ๆ (โปรดระบุ)', 'has_text_input' => true],
        ];

        $this->createMatrixQuestion($section, [
            'code'                => $this->generateQuestionCode('mission_info_needs', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.4) ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น ',
            'question_type'       => 'matrix',
            'order_index'         => 4,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
        ], $missionTopics, $this->getStandardNeedsColumns());
    }
    //2.5) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
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
        // 2.5) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่
        $this->createMatrixQuestion($section, [
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_preference', $this->surveyTypeId, $section->order_index),
            'question_text'       => '2.5) ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่',
            'question_type'       => 'matrix',
            'order_index'         => 5,
            'is_required'         => true,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ช่องทาง',
        ], $channels, $channelColumns);

    }
    private function createSection3Questions($section)
    {
        $topics = [
            'ความชัดเจนของเอกสารประกวดราคา / TOR',
            'การประสานงานของเจ้าหน้าที่ในทุกขั้นตอน',
            'ความรวดเร็วในการพิจารณาอนุมัติ/เบิกจ่าย',
            'การให้คำแนะนำหรือแนวทางปฏิบัติที่ชัดเจน',
            'การปฏิบัติตามข้อตกลงโดยไม่เปลี่ยนแปลงในระหว่างดำเนินการ',
            'ความยุติธรรมในการตัดสินปัญหา/ข้อพิพาท',
            'ความโปร่งใสในการบริหารงาน',
            'ความพึงพอใจต่อระบบงานจัดซื้อจัดจ้างโดยรวม',
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
                'label' => 'น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก(หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1)',
            ],
            [
                'value' => 'transparency_confidence',
                'label' => 'กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
            ],
            [
                'value' => 'job_security_confidence',
                'label' => 'ความเสมอภาคในการให้โอกาสคู่ค้า',
            ],
            [
                'value' => 'work_environment_confidence',
                'label' => 'ความสามารถในการบริหารจัดการโครงการขนาดใหญ่',
            ],
            [
                'value' => 'leadership_confidence',
                'label' => 'ความชัดเจนของนโยบายและทิศทางองค์กร',
            ],
            [
                'value' => 'social_impact_confidence',
                'label' => 'การรักษาความสัมพันธ์ระยะยาวและยั่งยืนกับคู่ค้า',
            ],
            [
                'value' => 'logic_fix_mwa',
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
