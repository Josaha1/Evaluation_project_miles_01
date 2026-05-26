<?php
namespace Database\Seeders;

use App\Models\SurveyType;
use Illuminate\Database\Seeder;

class SurveyTypesSeeder extends Seeder
{
    public function run()
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
}
