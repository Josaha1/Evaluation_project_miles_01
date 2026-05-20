<?php
namespace Database\Seeders;

use App\Models\RatingScale;
use Illuminate\Database\Seeder;

class RatingScalesSeeder extends Seeder
{
    public function run()
    {
        $this->createFivePointScale();
        $this->createExpectationScale();
        $this->createSatisfactionScale();
        $this->createConfidenceScale();
    }

    private function createFivePointScale()
    {
        RatingScale::create([
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
        ]);
    }

    private function createExpectationScale()
    {
        RatingScale::create([
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
        ]);
    }

    private function createSatisfactionScale()
    {
        RatingScale::create([
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
        ]);
    }

    private function createConfidenceScale()
    {
        RatingScale::create([
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
        ]);
    }
}