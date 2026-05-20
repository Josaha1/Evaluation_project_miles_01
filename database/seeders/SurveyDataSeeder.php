<?php
namespace Database\Seeders;

use App\Models\Question;
use App\Models\QuestionMatrixOption;
use App\Models\QuestionOption;
use App\Models\QuestionRatingScale;
use App\Models\RatingScale;
use App\Models\SurveySection;
use App\Models\SurveyType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SurveyDataSeeder extends Seeder
{
    public function run()
    {
        DB::transaction(function () {
            // สร้าง Survey Types ทั้ง 8 กลุ่ม
            $this->createSurveyTypes();

            // สร้าง Rating Scales
            $ratingScales = $this->createRatingScales();

            // สร้าง Sections และ Questions สำหรับแต่ละ Survey Type
            $this->createSectionsAndQuestions($ratingScales);
        });
    }

    private function createSurveyTypes()
    {
        $surveyTypes = [
            [
                'name'         => 'แบบสอบถามกลุ่มหน่วยงานเชิงนโยบายและผู้ถือหุ้นภาครัฐ',
                'code'         => 'policy_stakeholder1_survey_2568',
                'target_group' => 'หน่วยงานเชิงนโยบายและผู้ถือหุ้นภาครัฐ',
            ],
            [
                'name'         => 'แบบสอบถามกลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ',
                'code'         => 'policy_stakeholder2_survey_2568',
                'target_group' => 'หน่วยงานที่เกี่ยวข้องในเชิงภารกิจ',
            ],
            [
                'name'         => 'แบบสอบถามกลุ่มลูกค้า',
                'code'         => 'policy_stakeholder3_survey_2568',
                'target_group' => 'ลูกค้า',
            ],
            [
                'name'         => 'แบบสอบถามกลุ่มพนักงานและผู้ปฏิบัติ',
                'code'         => 'policy_stakeholder4_survey_2568',
                'target_group' => 'พนักงานและผู้ปฏิบัติ',
            ],
            [
                'name'         => 'แบบสอบถามกลุ่มสื่อมวลชน',
                'code'         => 'policy_stakeholder5_survey_2568',
                'target_group' => 'สื่อมวลชน',
            ],
            [
                'name'         => 'แบบสอบถามกลุ่มชุมชนและสังคม',
                'code'         => 'policy_stakeholder6_survey_2568',
                'target_group' => 'ชุมชนและสังคม',
            ],
            [
                'name'         => 'แบบสอบถามกลุ่มคู่ค้า',
                'code'         => 'policy_stakeholder7_survey_2568',
                'target_group' => 'คู่ค้า',
            ],
            [
                'name'         => 'แบบสอบถามกลุ่มพันธมิตร',
                'code'         => 'policy_stakeholder8_survey_2568',
                'target_group' => 'พันธมิตร',
            ],
        ];

        foreach ($surveyTypes as $type) {
            SurveyType::create([
                'name'                  => $type['name'],
                'code'                  => $type['code'],
                'description'           => 'โครงการจ้างที่ปรึกษาสำรวจการรับรู้ข้อมูลข่าวสารของผู้มีส่วนได้ส่วนเสีย ของการประปานครหลวง ปีงบประมาณ 2568',
                'target_group'          => $type['target_group'],
                'is_active'             => true,
                'has_conditional_logic' => true,
                'max_responses_per_ip'  => 1,
                'allow_anonymous'       => false,
                'published_at'          => now(),
                'settings'              => [
                    'objective'       => 'เพื่อประเมินผลสัมฤทธิ์ของการดำเนินงานด้านการประชาสัมพันธ์ และนำผลสำรวจที่ได้ไปพัฒนาและปรับปรุงเนื้อหารูปแบบ ช่องทางการประชาสัมพันธ์ รวมถึงการนำผลสำรวจมาพัฒนาและปรับปรุงการดำเนินงานให้สามารถตอบสนองความต้องการ ความคาดหวังของผู้มีส่วนได้ส่วนเสียให้มีประสิทธิภาพมากยิ่งขึ้น',
                    'confidentiality' => 'คำตอบของท่านจะถูกเก็บไว้เป็นความลับ และข้อมูลที่ได้รับจะนำไปใช้พัฒนาและปรับปรุงการดำเนินงานการประชาสัมพันธ์ของ กปน. เท่านั้น',
                ],
            ]);
        }
    }

    private function createRatingScales()
    {
        return [
            'five_point'   => RatingScale::create([
                'name'         => 'มาตราส่วน 5 ระดับ',
                'code'         => 'five_point_scale',
                'min_value'    => 1,
                'max_value'    => 5,
                'scale_labels' => [
                    1 => 'น้อยที่สุด',
                    2 => 'น้อย',
                    3 => 'ปานกลาง',
                    4 => 'มาก',
                    5 => 'มากที่สุด',
                ],
                'is_active'    => true,
            ]),
            'expectation'  => RatingScale::create([
                'name'         => 'มาตราส่วนความคาดหวัง',
                'code'         => 'expectation_scale',
                'min_value'    => 1,
                'max_value'    => 5,
                'scale_labels' => [
                    1 => 'คาดหวังน้อยที่สุด',
                    2 => 'คาดหวังน้อย',
                    3 => 'คาดหวังปานกลาง',
                    4 => 'คาดหวังมาก',
                    5 => 'คาดหวังมากที่สุด',
                ],
                'is_active'    => true,
            ]),
            'satisfaction' => RatingScale::create([
                'name'         => 'มาตราส่วนความพึงพอใจ',
                'code'         => 'satisfaction_scale',
                'min_value'    => 1,
                'max_value'    => 5,
                'scale_labels' => [
                    1 => 'พึงพอใจน้อยที่สุด',
                    2 => 'พึงพอใจน้อย',
                    3 => 'พึงพอใจปานกลาง',
                    4 => 'พึงพอใจมาก',
                    5 => 'พึงพอใจมากที่สุด',
                ],
                'is_active'    => true,
            ]),
            'confidence'   => RatingScale::create([
                'name'         => 'มาตราส่วนความเชื่อมั่น',
                'code'         => 'confidence_scale',
                'min_value'    => 1,
                'max_value'    => 5,
                'scale_labels' => [
                    1 => 'เชื่อมั่นน้อยที่สุด',
                    2 => 'เชื่อมั่นน้อย',
                    3 => 'เชื่อมั่นปานกลาง',
                    4 => 'เชื่อมั่นมาก',
                    5 => 'เชื่อมั่นมากที่สุด',
                ],
                'is_active'    => true,
            ]),
        ];
    }

    private function createSectionsAndQuestions($ratingScales)
    {
        // สร้าง sections สำหรับแต่ละ survey type
        for ($surveyTypeId = 1; $surveyTypeId <= 8; $surveyTypeId++) {
            $this->createSectionsForSurveyType($surveyTypeId, $ratingScales);
        }
    }

    private function createSectionsForSurveyType($surveyTypeId, $ratingScales)
    {
        // กำหนด sections สำหรับแต่ละกลุ่ม
        $sectionTemplates = $this->getSectionTemplates($surveyTypeId);

        foreach ($sectionTemplates as $template) {
            $section = SurveySection::create([
                'survey_type_id' => $surveyTypeId,
                'title'          => $template['title'],
                'description'    => $template['description'],
                'order_index'    => $template['order_index'],
                'is_active'      => true,
            ]);

            $this->createQuestionsForSection($section, $ratingScales, $surveyTypeId);
        }
    }

    private function getSectionTemplates($surveyTypeId)
    {
        // กลุ่มลูกค้า (3) มี section พิเศษ "แบบสอบถามคัดกรอง"
        if ($surveyTypeId == 3) {
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

        // กลุ่มสื่อมวลชน (5) มี section พิเศษ
        if ($surveyTypeId == 5) {
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
         

        // กลุ่มอื่นๆ ใช้ template มาตรฐาน 6 sections
        return [
            ['title' => 'ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม', 'description' => 'ข้อมูลพื้นฐานของผู้ตอบแบบสอบถาม', 'order_index' => 1],
            ['title' => 'การรับรู้ข้อมูลข่าวสารของ กปน.', 'description' => 'ช่องทางและการรับรู้ข้อมูลข่าวสารจาก กปน.', 'order_index' => 2],
            ['title' => 'แบบสอบถามวัดความคาดหวังและความพึงพอใจต่อการประชาสัมพันธ์ของ กปน.', 'description' => 'การประเมินความคาดหวังและความพึงพอใจ', 'order_index' => 3],
            ['title' => 'แบบสอบถามวัดความพึงพอใจการประชาสัมพันธ์ของ กปน. เปรียบเทียบกับหน่วยงานอื่น', 'description' => 'การเปรียบเทียบกับหน่วยงานรัฐวิสาหกิจอื่น', 'order_index' => 4],
            ['title' => 'แบบสอบถามวัดความเชื่อมั่นของ กปน.', 'description' => 'ระดับความเชื่อมั่นต่อ กปน.', 'order_index' => 5],
            ['title' => 'ข้อเสนอแนะเพิ่มเติม', 'description' => 'ข้อเสนอแนะและความคิดเห็นเพิ่มเติม', 'order_index' => 6],
        ];
    }

    private function createQuestionsForSection($section, $ratingScales, $surveyTypeId)
    {
        switch ($section->order_index) {
            case 1:
                $this->createSection1Questions($section, $surveyTypeId);
                break;

            case 2:
                if ($surveyTypeId == 3) {
                    $this->createScreeningQuestions($section); // แบบสอบถามคัดกรอง
                } else {
                    $this->createSection2Questions($section, $surveyTypeId);
                }
                break;

            case 3:
                if ($surveyTypeId == 3) {
                    $this->createSection2Questions($section, $surveyTypeId); // การรับรู้ข้อมูลข่าวสาร
                } else {
                    $this->createSection3Questions($section, $ratingScales, $surveyTypeId);
                }
                break;

            case 4:
                if ($surveyTypeId == 3) {
                    $this->createSection3Questions($section, $ratingScales, $surveyTypeId);
                } else {
                    $this->createSection4Questions($section, $ratingScales);
                }
                break;

            case 5:
                if ($surveyTypeId == 3) {
                    $this->createSection4Questions($section, $ratingScales);
                } elseif ($surveyTypeId == 5) {
                    $this->createMediaCollaborationQuestions($section, $ratingScales);
                } else {
                    $this->createSection5Questions($section, $ratingScales, $surveyTypeId);
                }
                break;

            case 6:
                // กลุ่มลูกค้า (3) ให้เรียก Section5Questions
                if ($surveyTypeId == 3) {
                    $this->createSection5Questions($section, $ratingScales, $surveyTypeId);
                } else {
                    $this->createSection6Questions($section, $surveyTypeId);
                }
                break;

            case 7:
                // กลุ่มลูกค้า และสื่อมวลชน (5) มี section ที่ 7 อยู่แล้ว ให้เรียก Section6Questions
                $this->createSection6Questions($section, $surveyTypeId);
                break;
        }
    }

    private function generateQuestionCode($baseCode, $surveyTypeId, $sectionOrderIndex = null)
    {
        $suffix = "st{$surveyTypeId}";
        if ($sectionOrderIndex) {
            $suffix .= "_s{$sectionOrderIndex}";
        }
        return "{$baseCode}_{$suffix}";
    }

    private function createSection1Questions($section, $surveyTypeId)
    {
        if ($surveyTypeId == 3) {
            // กลุ่มลูกค้า
            $this->createCustomerDemographicQuestions($section);
        } elseif (in_array($surveyTypeId, [1, 2, 4, 5, 6, 7, 8])) {
            // กลุ่มหน่วยงานต่างๆ
            $this->createOrganizationDemographicQuestions($section, $surveyTypeId);
        }
    }

    private function createCustomerDemographicQuestions($section)
    {
        // 1.1 เพศ
        $genderQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => 'gender_' . $section->survey_type_id,
            'question_text'     => 'เพศ',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        $genderOptions = ['ชาย', 'หญิง', 'เพศทางเลือก'];
        foreach ($genderOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $genderQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 1.2 อายุ
        Question::create([
            'survey_section_id' => $section->id,
            'code'              => 'age_' . $section->survey_type_id,
            'question_text'     => 'อายุ',
            'question_type'     => 'number',
            'is_required'       => true,
            'order_index'       => 2,
            'validation_rules'  => ['min' => 15, 'max' => 100],
        ]);

        // 1.3 ระดับการศึกษา
        $educationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => 'education_' . $section->survey_type_id,
            'question_text'     => 'ระดับการศึกษาที่สำเร็จขั้นสูงสุด',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 3,
        ]);

        $educationOptions = [
            'มัธยมศึกษาตอนต้นหรือต่ำกว่า',
            'มัธยมศึกษาตอนปลาย/ปวช.',
            'อนุปริญญา/ปวส.',
            'ปริญญาตรี',
            'สูงกว่าปริญญาตรี',
        ];
        foreach ($educationOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $educationQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 1.4 อาชีพ
        $occupationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => 'occupation_' . $section->survey_type_id,
            'question_text'     => 'อาชีพ',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 4,
        ]);

        $occupationOptions = [
            ['text' => 'ข้าราชการ/รัฐวิสาหกิจ', 'has_text_input' => false],
            ['text' => 'พนักงานบริษัท', 'has_text_input' => false],
            ['text' => 'ธุรกิจส่วนตัว ผู้ประกอบการ', 'has_text_input' => false],
            ['text' => 'นักศึกษา', 'has_text_input' => false],
            ['text' => 'แม่บ้าน/พ่อบ้าน', 'has_text_input' => false],
            ['text' => 'รับจ้างแรงงานทั่วไป', 'has_text_input' => false],
            ['text' => 'ฟรีแลนซ์/อาชีพอิสระ', 'has_text_input' => false],
            ['text' => 'เกษียณ/ว่างงาน', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($occupationOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $occupationQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }
    }

    private function createOrganizationDemographicQuestions($section, $surveyTypeId)
    {
        // 1.1 ชื่อหน่วยงาน
        Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('org_name', $surveyTypeId, $section->order_index),
            'question_text'     => 'ชื่อหน่วยงาน',
            'question_type'     => 'text_short',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        if ($surveyTypeId == 2) {
            // กลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ
            $this->createMissionRelatedOrgQuestions($section);
        } else {
            // กลุ่มอื่นๆ ใช้คำถามมาตรฐาน
            $this->createStandardOrgQuestions($section);
        }
    }

    private function createMissionRelatedOrgQuestions($section)
    {
        // 1.2 ประเภทหน่วยงาน
        $orgTypeQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('org_type', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ประเภทหน่วยงาน',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 2,
        ]);

        $orgTypeOptions = [
            ['text' => 'หน่วยงานราชการ', 'has_text_input' => false],
            ['text' => 'รัฐวิสาหกิจ', 'has_text_input' => false],
            ['text' => 'เอกชน', 'has_text_input' => false],
            ['text' => 'องค์กรปกครองส่วนท้องถิ่น', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($orgTypeOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $orgTypeQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }

        // 1.3 ลักษณะความร่วมมือ/ความเกี่ยวข้องกับ กปน.
        $cooperationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('cooperation_type', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ลักษณะความร่วมมือ/ความเกี่ยวข้องกับ กปน. (สามารถเลือกได้มากกว่า 1 ข้อ)',
            'question_type'     => 'checkbox',
            'is_required'       => true,
            'order_index'       => 3,
        ]);

        $cooperationOptions = [
            ['text' => 'งานวางแผนร่วม', 'has_text_input' => false],
            ['text' => 'งานก่อสร้าง/โยธา', 'has_text_input' => false],
            ['text' => 'การให้บริการข้อมูล', 'has_text_input' => false],
            ['text' => 'การจัดการน้ำเสีย/สิ่งแวดล้อม', 'has_text_input' => false],
            ['text' => 'งานประชาสัมพันธ์', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($cooperationOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $cooperationQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }

        // 1.4 ระยะเวลาในการมีความร่วมมือกับ กปน.
        $durationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('cooperation_duration', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ระยะเวลาในการมีความร่วมมือกับ กปน.',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 4,
        ]);

        $durationOptions = ['น้อยกว่า 1 ปี', '1-3 ปี', 'มากกว่า 3 ปี'];
        foreach ($durationOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $durationQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }
    }

    private function createStandardOrgQuestions($section)
    {
        // 1.2 ตำแหน่งของผู้ตอบแบบสอบถาม
        Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('respondent_position', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ตำแหน่งของผู้ตอบแบบสอบถาม',
            'question_type'     => 'text_short',
            'is_required'       => true,
            'order_index'       => 2,
        ]);

        // 1.3 บทบาทเกี่ยวข้องกับ กปน.
        $roleQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('org_role', $section->survey_type_id, $section->order_index),
            'question_text'     => 'หน่วยงานของท่านมีบทบาทเกี่ยวข้องกับ กปน. อย่างไร',
            'question_type'     => 'checkbox',
            'is_required'       => true,
            'order_index'       => 3,
        ]);

        $roleOptions = [
            ['text' => 'กำกับดูแลเชิงนโยบาย', 'has_text_input' => false],
            ['text' => 'วางแผน/ประเมินผลการดำเนินงาน', 'has_text_input' => false],
            ['text' => 'ตรวจสอบธรรมาภิบาล/การบริหารความเสี่ยง', 'has_text_input' => false],
            ['text' => 'ผู้สนับสนุนเชิงงบประมาณ/ทรัพยากร', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($roleOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $roleQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }

        // 1.4 ระยะเวลาที่เกี่ยวข้องกับ กปน.
        $durationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('relationship_duration', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ระยะเวลาที่ท่านหรือหน่วยงานของท่านมีความเกี่ยวข้องกับ กปน.',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 4,
        ]);

        $durationOptions = ['น้อยกว่า 1 ปี', '1-3 ปี', '4-6 ปี', 'มากกว่า 6 ปี'];
        foreach ($durationOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $durationQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 1.5 การให้ข้อเสนอแนะ
        $feedbackQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('feedback_history', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านหรือหน่วยงานของท่านเคยมีการให้ข้อเสนอแนะหรือความเห็นต่อ กปน. หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 5,
        ]);

        $feedbackOptions = [
            'เคย และได้รับการตอบสนอง',
            'เคย แต่ยังไม่ได้รับรายงานผลการดำเนินการ',
            'ไม่เคยให้ข้อเสนอแนะ',
        ];
        foreach ($feedbackOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $feedbackQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }
    }

    private function createScreeningQuestions($section)
    {
        // 2.1 ท่านรู้จักการประปานครหลวง (กปน.) หรือไม่
        $knowledgeQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mwa_knowledge', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านรู้จักการประปานครหลวง (กปน.) หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 1,
            // เงื่อนไข: ถ้าตอบ "ไม่รู้จัก" ให้ยุติแบบสอบถาม
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
        ]);

        $knowledgeOptions = ['รู้จัก', 'ไม่รู้จัก (ยุติแบบสอบถาม)'];
        foreach ($knowledgeOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $knowledgeQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 2.2 ท่านอาศัยอยู่ในจังหวัดใด
        $provinceQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('province', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านอาศัยอยู่ในจังหวัดใด',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 2,
            // เงื่อนไข: แสดงเฉพาะเมื่อคำถามก่อนหน้าตอบ "รู้จัก"
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('mwa_knowledge', $section->survey_type_id, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // รู้จัก
                    ],
                ],
            ],
        ]);

        $provinceOptions = ['กรุงเทพมหานคร', 'นนทบุรี', 'สมุทรปราการ'];
        foreach ($provinceOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $provinceQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }
    }

    private function createSection2Questions($section, $surveyTypeId)
    {
        if ($surveyTypeId == 2) {
            // กลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ
            $this->createMissionRelatedInfoQuestions($section);
        } elseif ($surveyTypeId == 3) {
            // กลุ่มลูกค้า
            $this->createCustomerInfoQuestions($section);
        } else {
            // กลุ่มอื่นๆ
            $this->createStandardInfoQuestions($section);
        }
    }

    private function createMissionRelatedInfoQuestions($section)
    {
        // 2.1 ท่านรับรู้ข้อมูลข่าวสารจาก กปน. ผ่านช่องทางใดบ้าง
        $channelsQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('info_channels', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านรับรู้ข้อมูลข่าวสารจาก กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)',
            'question_type'     => 'checkbox',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        $channelOptions = [
            ['text' => 'เว็บไซต์ของ กปน.', 'has_text_input' => false],
            ['text' => 'เฟซบุ๊ก / โซเชียลมีเดียของ กปน.', 'has_text_input' => false],
            ['text' => 'จดหมายข่าว / อีเมล', 'has_text_input' => false],
            ['text' => 'การประชุม/เวทีความร่วมมือ', 'has_text_input' => false],
            ['text' => 'รายงานประจำปี', 'has_text_input' => false],
            ['text' => 'การติดต่อเฉพาะราย', 'has_text_input' => false],
            ['text' => 'ข่าวประชาสัมพันธ์จากสื่อมวลชน', 'has_text_input' => false],
            ['text' => 'บุคลากรของ กปน.', 'has_text_input' => false],
            ['text' => 'ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['text' => 'โฆษณาข้างรถประจำทาง', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($channelOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $channelsQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }

        // 2.2 ความถี่ในการได้รับข้อมูลหรือรายงานจาก กปน.
        $frequencyQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('info_frequency', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ความถี่ในการได้รับข้อมูลหรือรายงานจาก กปน.',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 2,
        ]);

        $frequencyOptions = [
            'ไม่เคยได้รับ',
            '1-3 ครั้งต่อเดือน',
            '2-3 ครั้งต่อเดือน',
            '4-5 ครั้งต่อเดือน',
            'มากกว่า 5 ครั้งต่อเดือน',
        ];
        foreach ($frequencyOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $frequencyQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 2.3 ความน่าเชื่อถือของข้อมูล
        $credibilityQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('info_credibility', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านคิดว่าข้อมูลข่าวสารที่ได้รับจาก กปน. มีความน่าเชื่อถือเพียงใด?',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 3,
        ]);

        $credibilityOptions = ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย', 'ไม่น่าเชื่อถือเลย'];
        foreach ($credibilityOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $credibilityQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 2.4 ความชัดเจนของเนื้อหา
        $clarityQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('content_clarity', $section->survey_type_id, $section->order_index),
            'question_text'     => 'เนื้อหาของข่าวสารจาก กปน. มีความชัดเจน เข้าใจง่ายหรือไม่?',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 4,
        ]);

        $clarityOptions = ['ชัดเจนมาก', 'ค่อนข้างชัดเจน', 'ปานกลาง', 'ไม่ชัดเจน', 'ไม่เข้าใจเลย'];
        foreach ($clarityOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $clarityQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 2.5 และ 2.6 Matrix Questions
        $this->createMissionRelatedMatrixQuestions($section);
    }

    private function createMissionRelatedMatrixQuestions($section)
    {
        // 2.5 การรับรู้ข้อมูลข่าวสาร
        $awarenessQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('mission_info_awareness', $section->survey_type_id, $section->order_index),
            'question_text'       => '2.5 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 5,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
        ]);

        // สร้าง rows สำหรับกลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ
        $missionTopics = [
            'แผนงานการบำรุงรักษาท่อ/โครงข่ายน้ำในพื้นที่',
            'การหยุดจ่ายน้ำ / น้ำไหลอ่อน ในเขตพื้นที่รับผิดชอบ',
            'ข้อมูลคุณภาพน้ำที่อาจส่งผลกระทบต่อสาธารณสุขหรือสิ่งแวดล้อม',
            'ช่องทางแจ้งเหตุหรือการประสานงานฉุกเฉินกับ กปน.',
            'การร่วมดำเนินโครงการ CSR หรือกิจกรรมพัฒนาชุมชนร่วมกัน',
            'แนวทางร่วมมือในการวางแผนงานระหว่างหน่วยงาน',
            'การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล',
            'ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสาร ต่าง ๆ',
            'โครงการพัฒนาแอปพลิเคชัน MWA onMobile',
            'อื่นๆ (โปรดระบุ)',
        ];

        foreach ($missionTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id'  => $awarenessQ->id,
                'type'         => 'row',
                'value'        => 'mission_topic_' . ($index + 1),
                'label'        => $topic,
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'has_text_input' => str_contains($topic, 'อื่นๆ'),
                ]),
            ]);
        }

        // สร้าง columns
        $awarenessColumns = [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];

        foreach ($awarenessColumns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id' => $awarenessQ->id,
                'type'        => 'column',
                'value'       => $column['value'],
                'label'       => $column['label'],
                'order_index' => $index + 1,
            ]);
        }

        // 2.6 ความต้องการข้อมูลข่าวสาร
        $needsQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('mission_info_needs', $section->survey_type_id, $section->order_index),
            'question_text'       => '2.6 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 6,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
        ]);

        // ใช้ topics เดียวกัน
        foreach ($missionTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id'  => $needsQ->id,
                'type'         => 'row',
                'value'        => 'mission_topic_' . ($index + 1),
                'label'        => $topic,
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'has_text_input' => str_contains($topic, 'อื่นๆ'),
                ]),
            ]);
        }

        // สร้าง columns สำหรับความต้องการ
        $needsColumns = [
            ['value' => 'high', 'label' => 'ต้องการมาก'],
            ['value' => 'medium', 'label' => 'ต้องการ'],
            ['value' => 'neutral', 'label' => 'ปานกลาง'],
            ['value' => 'low', 'label' => 'ไม่ค่อยต้องการ'],
            ['value' => 'none', 'label' => 'ไม่ต้องการเลย'],
        ];

        foreach ($needsColumns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id' => $needsQ->id,
                'type'        => 'column',
                'value'       => $column['value'],
                'label'       => $column['label'],
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createCustomerInfoQuestions($section)
    {
        // 3.1 การได้รับข้อมูลข่าวสารจาก กปน.
        $receivedInfoQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('customer_received_info', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยได้รับ/เคยเห็น/ เคยได้ยิน ข้อมูลข่าวสารจาก กปน. เช่น ข้อมูลข่าวสารเกี่ยวกับการรณรงค์ประหยัดน้ำ หรือ คุณภาพน้ำประปา หรือ ประกาศน้ำประปาไหลอ่อน-ไม่ไหล เป็นต้น หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 1,
            // Skip Logic: ถ้าตอบ "เคยได้รับ" ไป 3.2, ถ้าตอบ "ไม่เคยได้รับ" ไป 3.1.1 แล้วข้ามไปส่วนที่ 6
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
        ]);

        $receivedOptions = [
            'เคยได้รับ/เคยเห็น/ เคยได้ยิน (ไปข้อ 3.2)',
            'ไม่เคยได้รับ/ไม่เคยเห็น/ไม่เคยได้ยิน (ไปข้อ 3.1.1)',
        ];
        foreach ($receivedOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $receivedInfoQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 3.1.1 เหตุผลที่ไม่เคยได้รับข้อมูล
        $noInfoReasonQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => 'no_info_reason_st3_s3',
            'question_text'     => '3.1.1 เพราะเหตุใดท่านจึง ไม่เคยได้รับ/ ไม่เคยเห็น/ ไม่เคยได้ยิน ข้อมูลข่าวสารจาก กปน. (ตอบได้มากกว่า 1 ข้อ) (ไปต่อในส่วนที่ 6)',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 2,
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => 'customer_received_info_st3_s3',
                        'operator'      => 'equals',
                        'value'         => 2,
                    ],
                ],
            ],
            'skip_logic'        => [
                'type'            => 'always_skip_to_section',
                'skip_to_section' => 6,
            ],
        ]);

        $noInfoReasons = [
            ['text' => 'ไม่สามารถเข้าถึงช่องทางในการรับข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => 'ไม่มีความสนใจในข้อมูลข่าวสาร', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($noInfoReasons as $index => $reason) {
            QuestionOption::create([
                'question_id'    => $noInfoReasonQ->id,
                'option_text'    => $reason['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $reason['has_text_input'],
            ]);
        }

        // 3.2 การรู้จัก slogan
        $sloganQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('slogan_awareness', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านรู้จัก/เคยเห็น/เคยได้ยิน ข้อความ "ประปาคุณภาพ เพื่อชีวิตที่ดี (Quality Water for Quality Living)" หรือไม่',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 3,
            // เงื่อนไข: แสดงเฉพาะเมื่อตอบ "เคยได้รับ" ในคำถาม 3.1
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $section->survey_type_id, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ]);

        $sloganOptions = [
            'รู้จัก/เคยเห็น/เคยได้ยิน',
            'ไม่รู้จัก/ไม่เคยเห็น/ไม่เคยได้ยิน',
        ];
        foreach ($sloganOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $sloganQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 3.3 และ 3.4 Matrix Questions สำหรับลูกค้า
        $this->createCustomerMatrixQuestions($section);

        // 3.3.1 พฤติกรรมการประหยัดน้ำ
        $this->createWaterSavingBehaviorQuestion($section);

        // 3.5 และ 3.6 Channel awareness และ preference
        $this->createCustomerChannelQuestions($section);
    }

    private function createCustomerMatrixQuestions($section)
    {
        // 3.3 การรับรู้ข้อมูลข่าวสาร
        $awarenessQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_info_awareness', $section->survey_type_id, $section->order_index),
            'question_text'       => '3.3 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 4,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'เคย / ไม่เคย',
            // เงื่อนไข: แสดงเฉพาะเมื่อตอบ "เคยได้รับ" ในคำถาม 3.1
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $section->survey_type_id, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ]);

        // Customer topics
        $customerTopics = [
            'การให้บริการของสำนักงานประปาสาขา การรับรองมาตรฐานการให้บริการของศูนย์ราชการสะดวก และ Call Center 1125',
            'การให้บริการด้วย Digital Service อาทิ การชำระเงินผ่านช่องทางอิเล็กทรอนิกส์ MWA onMobile บริการ e-bill / e-Tax Invoice & e-Receipt การรับแจ้งท่อประปาแตกรั่ว เป็นต้น',
            'การพัฒนานวัตกรรมและเทคโนโลยีของ กปน. เพื่อเพิ่มประสิทธิภาพในการทำงาน อาทิ โครงการนวัตกรรมลูกค้า (VOC to Innovation) เป็นต้น',
            'ผลิตภัณฑ์และบริการเกี่ยวกับธุรกิจที่เกี่ยวเนื่องของ กปน. ได้แก่ งานล้างถังพักน้ำ และบริการ Health Care Solution',
            'การผลิตน้ำประปาตามแผนน้ำประปาปลอดภัย (WSP) ได้มาตรฐานขององค์การอนามัยโลก (WHO)',
            'โครงการปรับปรุงเส้นท่อประปาใหม่ เพื่อลดการแตกรั่วของท่อประปา',
            'การรณรงค์การใช้น้ำอย่างรู้คุณค่า', // ประเด็นที่ 7 - จะมีคำถามเงื่อนไข 3.3.1
            'ฉลากประหยัดน้ำเบอร์ 5 เบอร์ 4 เบอร์ 3',
            'การกำกับดูแลกิจการที่ดีและมีธรรมาภิบาล',
            'การดำเนินงานด้านความรับผิดชอบต่อสังคมและสิ่งแวดล้อม (CSR) เช่น การพัฒนาชุมชนสำคัญ การใช้น้ำอย่างรู้คุณค่าผ่านฉลากประหยัดน้ำ การสร้างระบบประปาโรงเรียน กิจกรรมยอดน้ำ & เฟรนด์',
            'การดำเนินงานเพื่อสาธารณประโยชน์ตามนโยบายของรัฐบาลและกระทรวงมหาดไทย ที่เป็นประโยชน์ต่อสังคมส่วนรวม เช่น การสนับสนุนงานบรรเทาสาธารณภัย เป็นต้น',
            'การลงทุนเพื่อเพิ่มศักยภาพในระบบประปา เช่น การขยายกำลังการผลิต การก่อสร้างอุโมงค์ส่งน้ำ และสถานีสูบน้ำ',
            'การดำเนินงานด้านการลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2) เช่น ลดปริมาณการใช้กระดาษ ลดปริมาณการใช้ไฟฟ้าในอาคาร ลดการใช้ไฟฟ้าในกระบวนการผลิตน้ำ ลดการใช้น้ำมัน และโครงการใช้พลังงานแสงอาทิตย์ (Solar Cell) เป็นต้น',
            'การประกาศแจ้งเตือนก่อนการหยุดจ่ายน้ำเพื่อซ่อมแซมท่อประปา',
            'ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทด้านต่าง ๆ กิจกรรมสำคัญ รายงานผลการดำเนินงาน และข่าวสารต่าง ๆ เช่น วารสารน้ำก๊อก เป็นต้น',
            'โครงการพัฒนาแอปพลิเคชัน MWA onMobile',
            'อื่น ๆ (โปรดระบุ)',
        ];

        foreach ($customerTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id'  => $awarenessQ->id,
                'type'         => 'row',
                'value'        => 'customer_topic_' . ($index + 1),
                'label'        => $topic,
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'has_text_input'       => str_contains($topic, 'อื่น ๆ'),
                    'triggers_conditional' => $index == 6 ? 'water_saving_behavior' : null, // ประเด็นที่ 7
                ]),
            ]);
        }

        // สร้าง columns
        $awarenessColumns = [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];

        foreach ($awarenessColumns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id' => $awarenessQ->id,
                'type'        => 'column',
                'value'       => $column['value'],
                'label'       => $column['label'],
                'order_index' => $index + 1,
            ]);
        }

        // 3.4 ความต้องการข้อมูลข่าวสาร
        $needsQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_info_needs', $section->survey_type_id, $section->order_index),
            'question_text'       => '3.4 ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 5,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
            // เงื่อนไข: แสดงเฉพาะเมื่อตอบ "เคยได้รับ" ในคำถาม 3.1
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $section->survey_type_id, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ]);

        // ใช้ topics เดียวกัน
        foreach ($customerTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id'  => $needsQ->id,
                'type'         => 'row',
                'value'        => 'customer_topic_' . ($index + 1),
                'label'        => $topic,
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'has_text_input' => str_contains($topic, 'อื่น ๆ'),
                ]),
            ]);
        }

        // สร้าง columns สำหรับความต้องการ
        $needsColumns = [
            ['value' => 'high', 'label' => 'ต้องการมาก'],
            ['value' => 'medium', 'label' => 'ต้องการ'],
            ['value' => 'neutral', 'label' => 'ปานกลาง'],
            ['value' => 'low', 'label' => 'ไม่ค่อยต้องการ'],
            ['value' => 'none', 'label' => 'ไม่ต้องการเลย'],
        ];

        foreach ($needsColumns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id' => $needsQ->id,
                'type'        => 'column',
                'value'       => $column['value'],
                'label'       => $column['label'],
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createWaterSavingBehaviorQuestion($section)
    {
        // 3.3.1 พฤติกรรมการประหยัดน้ำ
        $behaviorQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('water_saving_behavior', $section->survey_type_id, $section->order_index),
            'question_text'     => '3.3.1 ท่านมีพฤติกรรมการประหยัดตรงกับข้อใดบ้าง (ตอบได้มากกว่า 1 ข้อ)',
            'description'       => 'กรณีข้อ 3.3 ตอบ เคย ในประเด็นที่ 7) การรณรงค์การใช้น้ำอย่างรู้คุณค่า กรุณาตอบคำถามข้อ 3.3.1',
            'question_type'     => 'checkbox',
            'is_required'       => false,
            'order_index'       => 6,
            // เงื่อนไข: แสดงเฉพาะเมื่อตอบ "เคย" ในประเด็นที่ 7 ของคำถาม 3.3
            'conditional_logic' => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_info_awareness', $section->survey_type_id, $section->order_index),
                        'operator'      => 'matrix_contains',
                        'row_value'     => 'customer_topic_7', // ประเด็นที่ 7
                        'column_value'  => 'yes',
                    ],
                ],
            ],
        ]);

        $behaviors = [
            'ใช้ฝักบัวรดน้ำแทนสายยาง และไม่ลดน้ำต้นไม้ตอนแดดจัด เพราะจะทำให้น้ำระเหยไว',
            'อาบน้ำด้วยฝักบัวรูเล็ก และปิดน้ำระหว่างถูสบู่และสระผม',
            'เช็ดคราบอาหารออกก่อนล้างจาน',
            'ตรวจสอบรอยรั่วของระบบท่อประปา และสุขภัณฑ์สม่ำเสมอ หากพบรอยรั่วรีบซ่อมแซมทันที',
            'ล้างผักและผลไม้มีภาชนะรองน้ำทุกครั้ง แทนการล้างโดยตรงจากก๊อกและนำน้ำที่ใช้แล้วไปรดน้ำต้นไม้ต่อได้',
            'ซักผ้าแต่พอดีและปรับโหมด ECO เพื่อประหยัดน้ำ',
            'ถูพื้น ทำความสะอาดทุกครั้งใช้ถังรองน้ำ',
            'รินน้ำให้เพียงพอต่อความต้องการ และใช้แก้วน้ำส่วนตัวเพื่อจะได้ล้างแก้วแค่ใบเดียว',
            'รองน้ำใส่ถังเพื่อล้างรถ แทนการใช้สายยางฉีดโดยตรง',
            'เมื่อพบท่อประปาแตกรั่วรีบแจ้งการประปานครหลวง เพื่อจัดส่งเจ้าหน้าที่เข้าซ่อมโดยด่วน ผ่านช่องทางดังต่อไปนี้ MWA Call Center โทร 1125 Line @MWAthailand Application MWA onMobile สำนักงานประปาสาขา',
        ];

        foreach ($behaviors as $index => $behavior) {
            QuestionOption::create([
                'question_id'  => $behaviorQ->id,
                'option_text'  => $behavior,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }
    }

    private function createCustomerChannelQuestions($section)
    {
        // 3.5 และ 3.6 Channel awareness และ preference
        $channelQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('customer_channel_awareness_preference', $section->survey_type_id, $section->order_index),
            'question_text'       => '3.5 ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารของ กปน. ผ่านช่องทางต่อไปนี้หรือไม่ และ 3.6 ช่องทางที่ท่านสะดวก หรือต้องการรับข่าวสารของ กปน. (ตอบได้มากกว่า 1 ข้อ)',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 7,
            'matrix_row_label'    => 'ช่องทาง',
            'matrix_column_label' => '3.5 เคย/ไม่เคย | 3.6 ต้องการ',
            // เงื่อนไข: แสดงเฉพาะเมื่อตอบ "เคยได้รับ" ในคำถาม 3.1
            'conditional_logic'   => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('customer_received_info', $section->survey_type_id, $section->order_index),
                        'operator'      => 'equals',
                        'value'         => 1, // เคยได้รับ
                    ],
                ],
            ],
        ]);

        $channels = [
            'โทรทัศน์',
            'วิทยุ',
            'หนังสือพิมพ์',
            'โปสเตอร์ แผ่นพับ ใบปลิว',
            'เว็บไซต์ กปน. (www.mwa.co.th)',
            'เว็บไซต์อื่น ๆ เช่น มติชนออนไลน์ ไทยรัฐออนไลน์ sanook.com',
            'เฟซบุ๊ก กปน. (www.facebook.com/MWAthailand)',
            'เฟซบุ๊กอื่น ๆ เช่น Facebook สวพ. FM.91 Facebook จส.100',
            'แอปพลิเคชัน MWA onMobile',
            'ไลน์ กปน. (@MWAthailand)',
            'ยูทูป กปน. (MWAthailand)',
            'X (ทวิตเตอร์) กปน. (MWAthailand)',
            'อินสตาแกรม กปน. (MWAthailand)',
            'Tiktok กปน. (MWAthailand)',
            'กิจกรรมรณรงค์และการจัดนิทรรศการ',
            'ป้ายโฆษณากลางแจ้ง',
            'โฆษณาข้างรถประจำทาง',
            'อื่น ๆ ระบุ',
        ];

        foreach ($channels as $index => $channel) {
            QuestionMatrixOption::create([
                'question_id'  => $channelQ->id,
                'type'         => 'row',
                'value'        => 'channel_' . ($index + 1),
                'label'        => $channel,
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'has_text_input' => str_contains($channel, 'อื่น ๆ'),
                ]),
            ]);
        }

        // สร้าง columns สำหรับ awareness และ preference
        $channelColumns = [
            ['value' => 'aware_yes', 'label' => 'เคย (3.5)'],
            ['value' => 'aware_no', 'label' => 'ไม่เคย (3.5)'],
            ['value' => 'prefer_yes', 'label' => 'ต้องการ (3.6)'],
        ];

        foreach ($channelColumns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id' => $channelQ->id,
                'type'        => 'column',
                'value'       => $column['value'],
                'label'       => $column['label'],
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createStandardInfoQuestions($section)
    {
        // คำถามมาตรฐานสำหรับกลุ่มอื่นๆ
        // 2.1 ความถี่ในการได้รับข้อมูลข่าวสาร
        $frequencyQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('info_frequency', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ความถี่ในการได้รับข้อมูลข่าวสารหรือรายงานข่าวสารจาก กปน.',
            'question_type'     => 'multiple_choice',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        $frequencyOptions = [
            'ไม่เคยได้รับ',
            '1-3 ครั้งต่อเดือน',
            '2-3 ครั้งต่อเดือน',
            '4-5 ครั้งต่อเดือน',
            'มากกว่า 5 ครั้งต่อเดือน',
        ];
        foreach ($frequencyOptions as $index => $option) {
            QuestionOption::create([
                'question_id'  => $frequencyQ->id,
                'option_text'  => $option,
                'option_value' => $index + 1,
                'sort_order'   => $index + 1,
            ]);
        }

        // 2.2 ช่องทางการได้รับข้อมูล
        $channelsQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('info_channels', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านได้รับข้อมูลข่าวสารของ กปน. ผ่านช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)',
            'question_type'     => 'checkbox',
            'is_required'       => true,
            'order_index'       => 2,
        ]);

        $channelOptions = [
            ['text' => 'เว็บไซต์ของ กปน.', 'has_text_input' => false],
            ['text' => 'เฟซบุ๊ก / โซเชียลมีเดียของ กปน.', 'has_text_input' => false],
            ['text' => 'จดหมายข่าว / อีเมล', 'has_text_input' => false],
            ['text' => 'การประชุม/เวทีความร่วมมือ', 'has_text_input' => false],
            ['text' => 'รายงานประจำปี', 'has_text_input' => false],
            ['text' => 'การติดต่อเฉพาะราย', 'has_text_input' => false],
            ['text' => 'ข่าวประชาสัมพันธ์จากสื่อมวลชน', 'has_text_input' => false],
            ['text' => 'บุคลากรของ กปน.', 'has_text_input' => false],
            ['text' => 'ป้ายโฆษณากลางแจ้ง', 'has_text_input' => false],
            ['text' => 'โฆษณาข้างรถประจำทาง', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($channelOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $channelsQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }

        // 2.3 ข้อมูลใดที่ท่านเห็นว่ายัง "ไม่ครอบคลุม" หรือ "ไม่ชัดเจน" (เลือกได้มากกว่า 1 ข้อ)
        $clarityQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('info_clarity', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ข้อมูลใดที่ท่านเห็นว่ายัง "ไม่ครอบคลุม" หรือ "ไม่ชัดเจน" (เลือกได้มากกว่า 1 ข้อ)',
            'question_type'     => 'checkbox',
            'is_required'       => true,
            'order_index'       => 3,
        ]);

        $clarityOptions = [
            ['text' => 'ข้อมูลทางการเงินและงบประมาณ', 'has_text_input' => false],
            ['text' => 'แผนการพัฒนาองค์กรระยะยาว', 'has_text_input' => false],
            ['text' => 'รายงานผลกระทบต่อสิ่งแวดล้อม / ESG', 'has_text_input' => false],
            ['text' => 'ความเสี่ยงเชิงระบบ (Systematic Risk)', 'has_text_input' => false],
            ['text' => 'ความก้าวหน้าเชิงนวัตกรรม/เทคโนโลยี', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($clarityOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $clarityQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }

        // 2.4 ท่านต้องการให้ กปน. ปรับปรุงหรือเพิ่มช่องทางการสื่อสารในรูปแบบใด (เลือกได้มากกว่า 1 ข้อ)
        $communityQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('info_communit', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ท่านต้องการให้ กปน. ปรับปรุงหรือเพิ่มช่องทางการสื่อสารในรูปแบบใด (เลือกได้มากกว่า 1 ข้อ)',
            'question_type'     => 'checkbox',
            'is_required'       => true,
            'order_index'       => 4,
        ]);

        $communityOptions = [
            ['text' => 'Policy Brief รายประเด็น ', 'has_text_input' => false],
            ['text' => 'Executive Summary สรุปประเด็นเชิงกลยุทธ์', 'has_text_input' => false],
            ['text' => 'Dashboard สำหรับหน่วยงานกำกับ', 'has_text_input' => false],
            ['text' => 'เวทีแลกเปลี่ยนข้อมูลประจำปี', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($communityOptions as $index => $option) {
            QuestionOption::create([
                'question_id'    => $communityQ->id,
                'option_text'    => $option['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $option['has_text_input'],
            ]);
        }
        // เพิ่มคำถามอื่นๆ ตามแต่ละกลุ่ม
        $this->createGeneralInfoMatrixQuestions($section);
    }

    private function createGeneralInfoMatrixQuestions($section)
    {
        // สร้าง Matrix Questions สำหรับการรับรู้และความต้องการ
        $this->createGeneralAwarenessQuestion($section);
        $this->createGeneralNeedsQuestion($section);
    }

    private function createGeneralAwarenessQuestion($section)
    {
        $awarenessQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('general_info_awareness', $section->survey_type_id, $section->order_index),
            'question_text'       => 'ตั้งแต่เดือนตุลาคม 2567 เป็นต้นมา ท่านเคยรับรู้/เคยเห็น/เคยได้ยิน ข้อมูลข่าวสารต่อไปนี้จาก กปน. หรือไม่',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 5,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'การรับรู้',
        ]);

        // General topics (สำหรับกลุ่มอื่นๆ)
        $generalTopics = [
            'นโยบายและยุทธศาสตร์องค์กรของ กปน.',
            'รายงานผลการดำเนินงานประจำปี และตัวชี้วัดหลัก (KPIs)',
            'ความคืบหน้าโครงการลงทุนและโครงสร้างพื้นฐาน',
            'งบประมาณ และแผนการใช้จ่ายรายโครงการ',
            'การบริหารความเสี่ยง และการรับมือกับภาวะวิกฤต',
            'การดำเนินงานด้านธรรมาภิบาล การส่งเสริมจริยธรรม และมาตรการป้องกันการทุจริต',
            'การมีส่วนร่วมของหน่วยงานภาครัฐในกิจกรรมของ กปน.',
            'ความคืบหน้าการบรรลุเป้าหมาย SDGs ด้านน้ำ',
            'ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทต่าง ๆ กิจกรรมสำคัญ และผลการดำเนินงาน',
            'โครงการพัฒนาแอปพลิเคชัน MWA onMobile',
            'อื่นๆ (โปรดระบุ)',
        ];

        foreach ($generalTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id'  => $awarenessQ->id,
                'type'         => 'row',
                'value'        => 'general_topic_' . ($index + 1),
                'label'        => $topic,
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'has_text_input' => str_contains($topic, 'อื่นๆ'),
                ]),
            ]);
        }

        // สร้าง columns
        $awarenessColumns = [
            ['value' => 'yes', 'label' => 'เคย'],
            ['value' => 'no', 'label' => 'ไม่เคย'],
        ];

        foreach ($awarenessColumns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id' => $awarenessQ->id,
                'type'        => 'column',
                'value'       => $column['value'],
                'label'       => $column['label'],
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createGeneralNeedsQuestion($section)
    {
        $needsQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('general_info_needs', $section->survey_type_id, $section->order_index),
            'question_text'       => 'ข้อมูลข่าวสารประเภทใดที่ท่านต้องการให้ กปน. ประชาสัมพันธ์เพิ่มมากขึ้น',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 6,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความต้องการข้อมูลข่าวสารจาก กปน.',
        ]);

        // ใช้ topics เดียวกัน
        $generalTopics = [
            'นโยบายและยุทธศาสตร์องค์กรของ กปน.',
            'รายงานผลการดำเนินงานประจำปี และตัวชี้วัดหลัก (KPIs)',
            'ความคืบหน้าโครงการลงทุนและโครงสร้างพื้นฐาน',
            'งบประมาณ และแผนการใช้จ่ายรายโครงการ',
            'การบริหารความเสี่ยง และการรับมือกับภาวะวิกฤต',
            'การดำเนินงานด้านธรรมาภิบาล การส่งเสริมจริยธรรม และมาตรการป้องกันการทุจริต',
            'การมีส่วนร่วมของหน่วยงานภาครัฐในกิจกรรมของ กปน.',
            'ความคืบหน้าการบรรลุเป้าหมาย SDGs ด้านน้ำ',
            'ทิศทางการดำเนินงาน เช่น แผนวิสาหกิจ แผนแม่บทต่าง ๆ กิจกรรมสำคัญ และผลการดำเนินงาน',
            'โครงการพัฒนาแอปพลิเคชัน MWA onMobile',
            'อื่นๆ (โปรดระบุ)',
        ];

        foreach ($generalTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id'  => $needsQ->id,
                'type'         => 'row',
                'value'        => 'general_topic_' . ($index + 1),
                'label'        => $topic,
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'has_text_input' => str_contains($topic, 'อื่นๆ'),
                ]),
            ]);
        }

        // สร้าง columns สำหรับความต้องการ
        $needsColumns = [
            ['value' => 'high', 'label' => 'ต้องการมาก'],
            ['value' => 'medium', 'label' => 'ต้องการ'],
            ['value' => 'neutral', 'label' => 'ปานกลาง'],
            ['value' => 'low', 'label' => 'ไม่ค่อยต้องการ'],
            ['value' => 'none', 'label' => 'ไม่ต้องการเลย'],
        ];

        foreach ($needsColumns as $index => $column) {
            QuestionMatrixOption::create([
                'question_id' => $needsQ->id,
                'type'        => 'column',
                'value'       => $column['value'],
                'label'       => $column['label'],
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createSection3Questions($section, $ratingScales, $surveyTypeId)
    {
        if ($surveyTypeId == 2) {
            // กลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ
            $this->createMissionRelatedExpectationQuestions($section, $ratingScales);
        } elseif ($surveyTypeId == 3) {
            // กลุ่มลูกค้า
            $this->createCustomerExpectationQuestions($section, $ratingScales);
        } else {
            // กลุ่มอื่นๆ
            $this->createStandardExpectationQuestions($section, $ratingScales);
        }
    }

    private function createMissionRelatedExpectationQuestions($section, $ratingScales)
    {
        $expectationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('mission_expectation_satisfaction', $section->survey_type_id, $section->order_index),
            'question_text'     => '3.1 กรุณาประเมินความพึงพอใจของท่านต่อหัวข้อด้านล่าง โดยให้คะแนนในระดับ 1-5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
            'question_type'     => 'dual_rating_scale',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        // เชื่อม Rating Scales
        QuestionRatingScale::create([
            'question_id'     => $expectationQ->id,
            'rating_scale_id' => $ratingScales['expectation']->id,
            'scale_type'      => 'expectation',
        ]);

        QuestionRatingScale::create([
            'question_id'     => $expectationQ->id,
            'rating_scale_id' => $ratingScales['satisfaction']->id,
            'scale_type'      => 'satisfaction',
        ]);

        // Matrix Options สำหรับกลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ
        $missionTopics = [
            'ความชัดเจนของการประสานงาน',
            'ความรวดเร็วในการดำเนินงาน',
            'ความถูกต้องของข้อมูล',
            'ความสามารถในการแก้ไขปัญหา',
            'การมีส่วนร่วมในการวางแผน/ตัดสินใจ',
            'ความโปร่งใสในการบริหารงาน',
            'คุณภาพของการบริการโดยภาพรวม',
        ];

        foreach ($missionTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id' => $expectationQ->id,
                'type'        => 'row',
                'value'       => 'mission_exp_topic_' . ($index + 1),
                'label'       => $topic,
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createCustomerExpectationQuestions($section, $ratingScales)
    {
        $expectationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('customer_expectation_satisfaction', $section->survey_type_id, $section->order_index),
            'question_text'     => '4.1 จากการรับรู้ข้อมูลข่าวสารของ กปน. ท่านมีความคาดหวัง และความพึงพอใจต่อการประชาสัมพันธ์ของ กปน. อย่างไร จากคะแนน 1-5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
            'question_type'     => 'dual_rating_scale',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        // เชื่อม Rating Scales
        QuestionRatingScale::create([
            'question_id'     => $expectationQ->id,
            'rating_scale_id' => $ratingScales['expectation']->id,
            'scale_type'      => 'expectation',
        ]);

        QuestionRatingScale::create([
            'question_id'     => $expectationQ->id,
            'rating_scale_id' => $ratingScales['satisfaction']->id,
            'scale_type'      => 'satisfaction',
        ]);

        // Matrix Options สำหรับลูกค้า
        $customerExpTopics = [
            // ด้านเนื้อหา
            'ตรงกับความต้องการ',
            'น่าสนใจ',
            'ทันสมัยหรือมีความเป็นปัจจุบัน',
            'ชัดเจน ครบถ้วนสมบูรณ์ตามความต้องการ',
            'ประโยชน์ที่ได้รับ',
            // ด้านรูปแบบ
            'เข้าใจง่าย',
            'รูปแบบในการแสดงผลมีความเหมาะสม สวยงาม น่าสนใจ',
            // ช่องทางในการสื่อสาร
            'เหมาะสมกับประเภทของข้อมูล',
            'เข้าถึงได้ง่าย',
            'มีการโต้ตอบกัน (Interaction) ระหว่างผู้รับสารและผู้ส่งสาร',
        ];

        foreach ($customerExpTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id' => $expectationQ->id,
                'type'        => 'row',
                'value'       => 'customer_exp_topic_' . ($index + 1),
                'label'       => $topic,
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createStandardExpectationQuestions($section, $ratingScales)
    {
        $expectationQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('standard_expectation_satisfaction', $section->survey_type_id, $section->order_index),
            'question_text'     => 'กรุณาประเมินความคาดหวังและความพึงพอใจของท่านต่อหัวข้อด้านล่าง',
            'description'       => 'โดยให้คะแนนในระดับ 1-5 โดยที่ 1 หมายถึง คาดหวัง/พึงพอใจน้อยที่สุด 2 หมายถึง คาดหวัง/พึงพอใจน้อย 3 หมายถึง คาดหวัง/พึงพอใจปานกลาง 4 หมายถึง คาดหวัง/พึงพอใจมาก และ 5 หมายถึง คาดหวัง/พึงพอใจมากที่สุด',
            'question_type'     => 'dual_rating_scale',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        // เชื่อม Rating Scales
        QuestionRatingScale::create([
            'question_id'     => $expectationQ->id,
            'rating_scale_id' => $ratingScales['expectation']->id,
            'scale_type'      => 'expectation',
        ]);

        QuestionRatingScale::create([
            'question_id'     => $expectationQ->id,
            'rating_scale_id' => $ratingScales['satisfaction']->id,
            'scale_type'      => 'satisfaction',
        ]);

        // Matrix Options สำหรับกลุ่มมาตรฐาน
        $standardTopics = [
            'ความสอดคล้องของการดำเนินงานกับนโยบายภาครัฐ',
            'ความมีประสิทธิภาพของการบริหารจัดการองค์กร',
            'ความสามารถในการให้ข้อมูลสำหรับการกำกับดูแลและประเมินผล',
            'ความโปร่งใสในการบริหารงาน',
            'การดำเนินโครงการหรือกิจกรรมที่สอดคล้องกับเป้าหมายการพัฒนาที่ยั่งยืน (SDGs)',
            'การบริหารจัดการในภาวะวิกฤต (ภัยแล้ง, น้ำเค็ม ฯลฯ)',
        ];

        foreach ($standardTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id' => $expectationQ->id,
                'type'        => 'row',
                'value'       => 'standard_exp_topic_' . ($index + 1),
                'label'       => $topic,
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createSection4Questions($section, $ratingScales)
    {
        $comparisonQ = Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('organization_comparison', $section->survey_type_id, $section->order_index),
            'question_text'     => 'หากท่านต้องประเมินผลการดำเนินงานด้านประชาสัมพันธ์ขององค์กรต่อไปนี้ เปรียบเทียบกับ กปน. ในภาพรวมท่านจะให้คะแนนความพึงพอใจในแต่ละเรื่องต่อไปนี้ในระดับเท่าใด',
            'description'       => 'โดยที่ 1 หมายถึง พึงพอใจน้อยที่สุด 2 หมายถึง พึงพอใจน้อย 3 หมายถึง พึงพอใจปานกลาง 4 หมายถึง พึงพอใจมาก และ 5 หมายถึง พึงพอใจมากที่สุด',
            'question_type'     => 'comparison_table',
            'is_required'       => true,
            'order_index'       => 1,
        ]);

        QuestionRatingScale::create([
            'question_id'     => $comparisonQ->id,
            'rating_scale_id' => $ratingScales['satisfaction']->id,
            'scale_type'      => 'satisfaction',
        ]);

        // Comparison topics (rows)
        $comparisonTopics = [
            'ด้านเนื้อหาของข่าวสารที่นำเสนอ',
            'ด้านรูปแบบของข่าวสารที่นำเสนอ',
            'ด้านช่องทางที่ใช้ในการนำเสนอข่าวสาร',
        ];

        foreach ($comparisonTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id' => $comparisonQ->id,
                'type'        => 'row',
                'value'       => 'comparison_topic_' . ($index + 1),
                'label'       => $topic,
                'order_index' => $index + 1,
            ]);
        }

        // Comparison organizations (columns)
        $organizations = [
            ['value' => 'mwa', 'label' => 'กปน.'],
            ['value' => 'egat', 'label' => 'กฟน.'],
            ['value' => 'pwa', 'label' => 'กปภ.'],
        ];

        foreach ($organizations as $index => $org) {
            QuestionMatrixOption::create([
                'question_id' => $comparisonQ->id,
                'type'        => 'column',
                'value'       => $org['value'],
                'label'       => $org['label'],
                'order_index' => $index + 1,
            ]);
        }
    }

    private function createMediaCollaborationQuestions($section, $ratingScales)
    {
        // สำหรับกลุ่มสื่อมวลชน - ความพึงพอใจจากการร่วมงานกับฝ่ายสื่อสารองค์กร
        $collaborationQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('media_collaboration_satisfaction', $section->survey_type_id, $section->order_index),
            'question_text'       => 'แบบสอบถามวัดความพึงพอใจจากการร่วมงานกับฝ่ายสื่อสารองค์กรของ กปน.',
            'description'         => 'กรุณาประเมินความพึงพอใจของท่านจากการร่วมงานกับฝ่ายสื่อสารองค์กรของ กปน. โดยให้คะแนนในระดับ 1-5',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 1,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความพึงพอใจ',
        ]);

        QuestionRatingScale::create([
            'question_id'     => $collaborationQ->id,
            'rating_scale_id' => $ratingScales['satisfaction']->id,
            'scale_type'      => 'satisfaction',
        ]);

        // ประเด็นสำหรับสื่อมวลชน
        $mediaTopics = [
            'ความรวดเร็วในการตอบสนองต่อการขอข้อมูล',
            'ความถูกต้องและครบถ้วนของข้อมูลที่ได้รับ',
            'ความเป็นมิตรและความร่วมมือของเจ้าหน้าที่',
            'ความสะดวกในการประสานงาน',
            'คุณภาพของข้อมูลข่าวสารที่ได้รับ',
            'ความน่าเชื่อถือของแหล่งข้อมูล',
        ];

        foreach ($mediaTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id' => $collaborationQ->id,
                'type'        => 'row',
                'value'       => 'media_topic_' . ($index + 1),
                'label'       => $topic,
                'order_index' => $index + 1,
            ]);
        }

        // สร้าง columns สำหรับ Rating (1-5)
        for ($i = 1; $i <= 5; $i++) {
            QuestionMatrixOption::create([
                'question_id'  => $collaborationQ->id,
                'type'         => 'column',
                'value'        => (string) $i,
                'label'        => (string) $i,
                'order_index'  => $i,
                'extra_config' => json_encode([
                    'rating_value' => $i,
                    'scale_label'  => $ratingScales['satisfaction']->scale_labels[$i] ?? "ระดับ {$i}",
                ]),
            ]);
        }
    }

    private function createSection5Questions($section, $ratingScales, $surveyTypeId)
    {
        // 5.1 คำถามหลัก - ระดับความเชื่อมั่น
        $confidenceQ = Question::create([
            'survey_section_id'   => $section->id,
            'code'                => $this->generateQuestionCode('confidence_level', $surveyTypeId, $section->order_index),
            'question_text'       => 'ท่านมีระดับความเชื่อมั่นต่อ กปน. อย่างไรบ้าง',
            'description'         => 'กรุณาให้ระดับความเชื่อมั่น โดยที่ 1 หมายถึง เชื่อมั่นน้อยที่สุด 2 หมายถึง เชื่อมั่นน้อย 3 หมายถึง เชื่อมั่นปานกลาง 4 หมายถึง เชื่อมั่นมาก และ 5 หมายถึง เชื่อมั่นมากที่สุด',
            'question_type'       => 'matrix',
            'is_required'         => true,
            'order_index'         => 1,
            'matrix_row_label'    => 'ประเด็น',
            'matrix_column_label' => 'ความเชื่อมั่น กปน.',
        ]);

        // เชื่อม Rating Scale
        QuestionRatingScale::create([
            'question_id'     => $confidenceQ->id,
            'rating_scale_id' => $ratingScales['confidence']->id,
            'scale_type'      => 'confidence',
        ]);

        // กำหนด confidence topics ตาม survey type
        $confidenceTopics = $this->getConfidenceTopics($surveyTypeId);

        foreach ($confidenceTopics as $index => $topic) {
            QuestionMatrixOption::create([
                'question_id'  => $confidenceQ->id,
                'type'         => 'row',
                'value'        => $topic['value'],
                'label'        => $topic['label'],
                'order_index'  => $index + 1,
                'extra_config' => json_encode([
                    'description'     => $topic['description'] ?? '',
                    'has_conditional' => $topic['has_conditional'] ?? false,
                ]),
            ]);
        }

        // สร้าง columns สำหรับ Rating (1-5)
        for ($i = 1; $i <= 5; $i++) {
            QuestionMatrixOption::create([
                'question_id'  => $confidenceQ->id,
                'type'         => 'column',
                'value'        => (string) $i,
                'label'        => (string) $i,
                'order_index'  => $i,
                'extra_config' => json_encode([
                    'rating_value' => $i,
                    'scale_label'  => $ratingScales['confidence']->scale_labels[$i] ?? "ระดับ {$i}",
                ]),
            ]);
        }

        // 5.1.1 คำถามเงื่อนไข (ถ้าตอบคะแนนความเชื่อมั่น 1-3 ในข้อแรก)
        $this->createWaterQualityConcernQuestion($section, $confidenceQ);
    }

    private function getConfidenceTopics($surveyTypeId)
    {
        if ($surveyTypeId == 2) {
            // กลุ่มหน่วยงานที่เกี่ยวข้องในเชิงภารกิจ
            return [
                [
                    'value'           => 'water_quality_confidence',
                    'label'           => 'น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก (หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1)',
                    'has_conditional' => true,
                ],
                [
                    'value'           => 'transparency_confidence',
                    'label'           => 'กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'csr_confidence',
                    'label'           => 'กปน. สนับสนุนการดำเนินงานที่เกี่ยวกับความรับผิดชอบต่อสังคม และสิ่งแวดล้อม เช่น โครงการช่างประปาเพื่อประชาชน และโครงการเสริมสร้างความเข้มแข็งของชุมชนสำคัญ',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'management_confidence',
                    'label'           => 'ความสามารถในการบริหารจัดการน้ำประปาอย่างมีประสิทธิภาพ',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'feedback_confidence',
                    'label'           => 'ความพร้อมในการรับฟังความคิดเห็นและตอบสนองต่อข้อเสนอแนะ',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'vision_confidence',
                    'label'           => 'ความเชื่อมั่นในวิสัยทัศน์และทิศทางการพัฒนาองค์กร',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'complaint_confidence',
                    'label'           => 'การจัดการปัญหาเรื่องร้องเรียนและการทุจริตของ กปน.',
                    'has_conditional' => false,
                ],
            ];
        } elseif ($surveyTypeId == 3) {
            // กลุ่มลูกค้า
            return [
                [
                    'value'           => 'water_quality_confidence',
                    'label'           => 'น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก (หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 6.1.1)',
                    'has_conditional' => true,
                ],
                [
                    'value'           => 'service_consistency_confidence',
                    'label'           => 'มีความสม่ำเสมอในการให้บริการ สามารถให้บริการน้ำประปาตลอด 24 ชั่วโมง',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'technology_confidence',
                    'label'           => 'การพัฒนาระบบการบริการ โดยนำเทคโนโลยีมาใช้เพื่อเพิ่มความสะดวกกับ ลูกค้า เช่น แอปพลิเคชัน MWA onMobile',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'transparency_confidence',
                    'label'           => 'กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'csr_confidence',
                    'label'           => 'กปน. สนับสนุนการดำเนินงานที่เกี่ยวกับความรับผิดชอบต่อสังคม และสิ่งแวดล้อม เช่น โครงการช่างประปาเพื่อประชาชน และโครงการเสริมสร้างความเข้มแข็งของชุมชนสำคัญ',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'complaint_confidence',
                    'label'           => 'การจัดการปัญหาเรื่องร้องเรียนการทุจริตของ กปน.',
                    'has_conditional' => false,
                ],
            ];
        } else {
            // กลุ่มอื่นๆ
            return [
                [
                    'value'           => 'water_quality_confidence',
                    'label'           => 'น้ำประปาที่ กปน. ผลิต สะอาด ดื่มได้ มีคุณภาพตามมาตรฐานองค์การอนามัยโลก (หากตอบคะแนนความเชื่อมั่นที่ 1-3 กรุณาตอบข้อ 5.1.1)',
                    'has_conditional' => true,
                ],
                [
                    'value'           => 'transparency_confidence',
                    'label'           => 'กปน. ดำเนินงานอย่างโปร่งใส โดยยึดหลักธรรมาภิบาล',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'budget_confidence',
                    'label'           => 'กปน. ให้ความคุ้มค่าในการใช้งบประมาณภาครัฐ',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'leadership_confidence',
                    'label'           => 'กปน. มีความสามารถในการเป็นผู้นำด้านโครงสร้างพื้นฐานน้ำ',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'digital_confidence',
                    'label'           => 'กปน. พร้อมรับการเปลี่ยนแปลงสู่ยุคดิจิทัล (Digital Utility)',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'social_impact_confidence',
                    'label'           => 'กปน. สามารถสร้างผลกระทบเชิงบวกต่อเศรษฐกิจและสังคม',
                    'has_conditional' => false,
                ],
                [
                    'value'           => 'complaint_confidence',
                    'label'           => 'การจัดการปัญหาเรื่องร้องเรียนและการทุจริตของ กปน.',
                    'has_conditional' => false,
                ],
            ];
        }
    }

    private function createWaterQualityConcernQuestion($section, $parentQuestion)
    {
        $concernQ = Question::create([
            'survey_section_id'  => $section->id,
            'parent_question_id' => $parentQuestion->id,
            'code'               => $this->generateQuestionCode('water_quality_concern', $section->survey_type_id, $section->order_index),
            'question_text'      => 'ทำไมท่านถึงไม่เชื่อมั่นว่าน้ำประปาสะอาด ดื่มได้',
            'question_type'      => 'checkbox',
            'is_required'        => false,
            'order_index'        => 2,
            // เงื่อนไข: แสดงเฉพาะเมื่อตอบคะแนนความเชื่อมั่น 1-3 ในข้อแรกของคำถามหลัก
            'conditional_logic'  => [
                'type'       => 'show_if',
                'conditions' => [
                    [
                        'question_code' => $this->generateQuestionCode('confidence_level', $section->survey_type_id, $section->order_index),
                        'operator'      => 'matrix_rating_range',
                        'row_value'     => 'water_quality_confidence',
                        'min_value'     => 1,
                        'max_value'     => 3,
                    ],
                ],
            ],
        ]);

        $concerns = [
            ['text' => 'ไม่มั่นใจในระบบผลิตน้ำประปาของโรงงาน', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของเส้นท่อ กปน.', 'has_text_input' => false],
            ['text' => 'ไม่มั่นใจในความสะอาดของระบบประปา หรือถังพักน้ำภายในบ้าน', 'has_text_input' => false],
            ['text' => 'อื่น ๆ โปรดระบุ', 'has_text_input' => true],
        ];

        foreach ($concerns as $index => $concern) {
            QuestionOption::create([
                'question_id'    => $concernQ->id,
                'option_text'    => $concern['text'],
                'option_value'   => $index + 1,
                'sort_order'     => $index + 1,
                'has_text_input' => $concern['has_text_input'],
            ]);
        }
    }

    private function createSection6Questions($section, $surveyTypeId)
    {
        // ข้อเสนอแนะเพิ่มเติม
        if ($surveyTypeId == 1) {
            // กลุ่มหน่วยงานเชิงนโยบาย - มีคำถามพิเศษ
            $this->createPolicyGroupSuggestionQuestions($section);
        } else {
            // กลุ่มอื่นๆ ใช้คำถามทั่วไป
            $this->createGeneralSuggestionQuestions($section, $surveyTypeId);
        }
    }

    private function createPolicyGroupSuggestionQuestions($section)
    {
        // 6.1 ข้อเสนอนโยบายใหม่
        Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('policy_suggestion', $section->survey_type_id, $section->order_index),
            'question_text'     => 'หากท่านสามารถเสนอ "นโยบายใหม่" หรือแนวทางใหม่ให้ กปน. ได้ 1 ข้อ ท่านจะเสนออะไร และเพราะเหตุใด',
            'question_type'     => 'text_long',
            'is_required'       => false,
            'order_index'       => 1,
            'validation_rules'  => ['max_length' => 1000],
        ]);

        // 6.2 ข้อเสนอแนะเพิ่มเติมด้านการประชาสัมพันธ์ของ กปน.
        Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('policy_information', $section->survey_type_id, $section->order_index),
            'question_text'     => 'ข้อเสนอแนะเพิ่มเติมด้านการประชาสัมพันธ์ของ กปน.',
            'question_type'     => 'text_long',
            'is_required'       => false,
            'order_index'       => 2,
            'validation_rules'  => ['max_length' => 1000],
        ]);
    }

    private function createGeneralSuggestionQuestions($section, $surveyTypeId)
    {
        // ข้อเสนอแนะเพิ่มเติม
        Question::create([
            'survey_section_id' => $section->id,
            'code'              => $this->generateQuestionCode('general_suggestions', $surveyTypeId, $section->order_index),
            'question_text'     => 'ข้อเสนอแนะเพิ่มเติม',
            'description'       => 'กรุณาให้ข้อเสนอแนะเพิ่มเติมสำหรับการปรับปรุงการประชาสัมพันธ์ของ กปน.',
            'question_type'     => 'text_long',
            'is_required'       => false,
            'order_index'       => 1,
            'validation_rules'  => [
                'max_length' => 1000,
                'min_length' => 10,
            ],
            'help_text'         => 'ท่านสามารถแสดงความคิดเห็นเกี่ยวกับการปรับปรุงช่องทาง เนื้อหา หรือรูปแบบการประชาสัมพันธ์',
        ]);
    }
}
