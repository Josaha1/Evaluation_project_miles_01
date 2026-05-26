<?php
namespace Database\Seeders;

use App\Models\RatingScale;
use App\Models\SurveySection;
use Database\Seeders\Traits\SurveySeederTrait;
use Illuminate\Database\Seeder;

abstract class AbstractSurveySeeder extends Seeder
{
    use SurveySeederTrait;

    protected $surveyTypeId;
    protected $ratingScales;

    public function run()
    {
        $this->loadRatingScales();
        $this->createSections();
    }

    protected function loadRatingScales()
    {
        $this->ratingScales = [
            'five_point'   => RatingScale::where('code', 'five_point_scale')->first(),
            'expectation'  => RatingScale::where('code', 'expectation_scale')->first(),
            'satisfaction' => RatingScale::where('code', 'satisfaction_scale')->first(),
            'confidence'   => RatingScale::where('code', 'confidence_scale')->first(),
        ];
    }

    protected function createSections()
    {
        $sectionTemplates = $this->getSectionTemplates();

        foreach ($sectionTemplates as $template) {
            $section = SurveySection::create([
                'survey_type_id' => $this->surveyTypeId,
                'title'          => $template['title'],
                'description'    => $template['description'],
                'order_index'    => $template['order_index'],
                'is_active'      => true,
            ]);

            $this->createQuestionsForSection($section, $template['order_index']);
        }
    }

    // Abstract methods ที่แต่ละ Survey Type ต้อง implement
    abstract protected function getSectionTemplates();
    abstract protected function createQuestionsForSection($section, $sectionOrderIndex);

    // Common section templates
    protected function getStandardSectionTemplates()
    {
        return [
            ['title' => 'ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม', 'description' => 'ข้อมูลพื้นฐานของผู้ตอบแบบสอบถาม', 'order_index' => 1],
            ['title' => 'การรับรู้ข้อมูลข่าวสารของ กปน.', 'description' => 'ช่องทางและการรับรู้ข้อมูลข่าวสารจาก กปน.', 'order_index' => 2],
            ['title' => 'แบบสอบถามวัดความคาดหวังและความพึงพอใจต่อการประชาสัมพันธ์ของ กปน.', 'description' => 'การประเมินความคาดหวังและความพึงพอใจ', 'order_index' => 3],
            ['title' => 'แบบสอบถามวัดความพึงพอใจการประชาสัมพันธ์ของ กปน. เปรียบเทียบกับหน่วยงานอื่น', 'description' => 'การเปรียบเทียบกับหน่วยงานรัฐวิสาหกิจอื่น', 'order_index' => 4],
            ['title' => 'แบบสอบถามวัดความเชื่อมั่นของ กปน.', 'description' => 'ระดับความเชื่อมั่นต่อ กปน.', 'order_index' => 5],
            ['title' => 'ข้อเสนอแนะเพิ่มเติม', 'description' => 'ข้อเสนอแนะและความคิดเห็นเพิ่มเติม', 'order_index' => 6],
        ];
    }

    // Common question creation methods
    protected function createStandardDemographicQuestions($section)
    {
        
    }

    protected function createStandardInfoQuestions($section)
    {
       
    }

    protected function createGeneralSuggestionQuestions($section)
    {
        $this->createQuestionWithOptions($section, [
            'code'             => $this->generateQuestionCode('general_suggestions', $this->surveyTypeId, $section->order_index),
            'question_text'    => 'ข้อเสนอแนะเพิ่มเติม',
            'description'      => 'กรุณาให้ข้อเสนอแนะเพิ่มเติมสำหรับการปรับปรุงการประชาสัมพันธ์ของ กปน.',
            'question_type'    => 'text_long',
            'is_required'      => false,
            'order_index'      => 1,
            'validation_rules' => ['max_length' => 1000, 'min_length' => 10],
            'help_text'        => 'ท่านสามารถแสดงความคิดเห็นเกี่ยวกับการปรับปรุงช่องทาง เนื้อหา หรือรูปแบบการประชาสัมพันธ์',
        ]);
    }
}
