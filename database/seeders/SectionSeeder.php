<?php
namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;
use App\Models\SectionUserType;
class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            [
                'name'       => 'สมรรถนะบุคลากร',
                'user_types' => ['internal_9_12', 'internal_5_8'],
            ],
            [
                'name'       => 'วัฒนธรรมองค์กร I-EA-T',
                'user_types' => ['internal_9_12', 'external_9_12'],
            ],
            [
                'name'       => 'คำถามปลายเปิด',
                'user_types' => ['internal_9_12', 'external_9_12', 'internal_5_8'],
            ],
        ];

        foreach ($sections as $sectionData) {
            $section = Section::create(['name' => $sectionData['name']]);

            foreach ($sectionData['user_types'] as $type) {
                SectionUserType::create([
                    'section_id' => $section->id,
                    'user_type'  => $type,
                ]);
            }
        }
    }
}
