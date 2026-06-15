<?php

namespace Database\Seeders;

use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Open access code ให้บุคคลภายนอกเข้าระบบ → กรอกชื่อ+บริษัทเอง → ประเมิน ผวก. ได้เลย
 * โหมด open = ไม่มี stakeholder pre-list (FE ตรวจ stakeholders=[] แล้วเปิดฟอร์มกรอกเอง)
 * รันซ้ำได้ (idempotent) — ใช้ updateOrCreate ตาม code
 */
class OpenGovernorAccessCodeSeeder extends Seeder
{
    // ปรับค่าได้ตามรอบประเมิน
    private const CODE         = 'OPEN-PWK-2569';
    private const GOVERNOR_EMID = '666666';   // นายสุเมธ ตั้งประเสริฐ (ผวก.)
    private const EVALUATION_ID = 34;          // แบบประเมิน ผวก. สำหรับบุคลากรภายนอก
    private const FISCAL_YEAR   = 2026;
    private const ORG_NAME      = 'บุคคลภายนอกทั่วไป (Open)';

    public function run(): void
    {
        $governor = User::where('emid', self::GOVERNOR_EMID)->first();
        if (!$governor) {
            $this->command->error('ไม่พบ ผวก. (emid '.self::GOVERNOR_EMID.') — ยกเลิก seed');
            return;
        }

        $org = ExternalOrganization::firstOrCreate(
            ['name' => self::ORG_NAME],
            ['is_active' => true]
        );

        $code = ExternalAccessCode::updateOrCreate(
            ['code' => self::CODE],
            [
                'external_organization_id' => $org->id,
                'evaluation_id'            => self::EVALUATION_ID,
                'evaluatee_id'             => $governor->id,   // legacy fallback ตอน login
                'fiscal_year'              => self::FISCAL_YEAR,
                'is_used'                  => false,
                'max_uses'                 => null,            // ไม่จำกัดจำนวนผู้เข้าตอบ
                'expires_at'               => null,
            ]
        );

        // pivot: ผูก ผวก. เป็นผู้ถูกประเมินของ code นี้ (ตัวเดียว) — ไม่สร้าง stakeholder row
        DB::table('external_code_evaluatees')->updateOrInsert(
            ['external_access_code_id' => $code->id, 'evaluatee_id' => $governor->id],
            ['evaluation_id' => self::EVALUATION_ID, 'updated_at' => now(), 'created_at' => now()]
        );

        $this->command->info('Open code พร้อม: '.self::CODE.' → ลิงก์ /external/login?code='.self::CODE);
    }
}
