<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Section;
class AspectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $section1 = Section::where('name', 'like', '%สมรรถนะ%')->first();
        $section2 = Section::where('name', 'like', '%วัฒนธรรม%')->first();
    
        $aspects = [
            // ส่วนที่ 1
            ['1.1 ความเป็นผู้นำ'],
            ['1.2 วิสัยทัศน์'],
            ['1.3 ทักษะการติดต่อสื่อสาร'],
            ['1.4 ความคิดสร้างสรรค์'],
            ['1.5 จริยธรรม'],
            ['1.6 ความร่วมมือ'],
            // ส่วนที่ 2
            ['2.1 การรับรู้ค่านิยม'],
            ['2.2 ความเข้าใจค่านิยม'],
            ['2.3 ความเข้าใจพฤติกรรม'],
            ['2.4 การยอมรับพฤติกรรม'],
            ['2.5 การแสดงพฤติกรรม'],
        ];
    
        foreach ($aspects as [$name]) {
            \App\Models\Aspect::create([
                
                'name' => $name,
            ]);
        }
    }
}
