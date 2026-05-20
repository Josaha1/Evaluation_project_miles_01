<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
class MainSurveySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // เรียกใช้ Seeder ย่อยๆ ตามลำดับ
            $this->call([
                SurveyTypesSeeder::class,
                RatingScalesSeeder::class,
                PolicyStakeholder1SurveySeeder::class, // กลุ่มหน่วยงานเชิงนโยบาย
                PolicyStakeholder2SurveySeeder::class, // กลุ่มหน่วยงานเชิงภารกิจ
                PolicyStakeholder3SurveySeeder::class, // กลุ่มลูกค้า
                PolicyStakeholder4SurveySeeder::class, // กลุ่มพนักงาน
                PolicyStakeholder5SurveySeeder::class, // กลุ่มสื่อมวลชน
                PolicyStakeholder6SurveySeeder::class, // กลุ่มชุมชน
                PolicyStakeholder7SurveySeeder::class, // กลุ่มคู่ค้า
                PolicyStakeholder8SurveySeeder::class, // กลุ่มพันธมิตร
            ]);
        });
    }
}
