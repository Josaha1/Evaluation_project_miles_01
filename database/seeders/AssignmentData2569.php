<?php

namespace Database\Seeders;

use App\Models\EvaluationAssignment;
use App\Models\User;
use App\Services\EvaluationLookupService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssignmentData2569 extends Seeder
{
    private int $created = 0;
    private int $skipped = 0;
    private int $notFound = 0;
    private array $notFoundNames = [];

    public function run(): void
    {
        $fiscalYear = 2025; // BE 2568

        // Use OLD evaluation forms for fiscal year 2568
        $evalInternal = 3;  // พนักงาน 5-8 ภายใน (เก่า)
        $evalSelf = 5;      // ประเมินตนเอง 5-8 (เก่า)

        $data = $this->getData();

        DB::transaction(function () use ($data, $fiscalYear, $evalInternal, $evalSelf) {
            foreach ($data as $row) {
                $evaluatee = User::where('emid', $row['emid'])->first();
                if (!$evaluatee) {
                    $this->command->warn("Evaluatee not found: {$row['emid']} {$row['fname']} {$row['lname']}");
                    $this->notFound++;
                    continue;
                }

                // Self evaluation — ใช้ form ประเมินตนเอง เก่า (id=5)
                if ($row['self']) {
                    $this->createAssignment($evaluatee->id, $evaluatee->id, $evalSelf, 'self', $fiscalYear);
                }

                // Top (องศาบน) — ใช้ form ภายใน เก่า (id=3)
                foreach ($row['top'] as $name) {
                    $evaluator = $this->findUserByName($name);
                    if ($evaluator) {
                        $this->createAssignment($evaluator->id, $evaluatee->id, $evalInternal, 'top', $fiscalYear);
                    }
                }

                // Bottom (องศาล่าง) — grade 4 ไม่มี
                // skip

                // Left (องศาซ้าย) — ใช้ form ภายใน เก่า (id=3)
                foreach ($row['left'] as $name) {
                    $evaluator = $this->findUserByName($name);
                    if ($evaluator) {
                        $this->createAssignment($evaluator->id, $evaluatee->id, $evalInternal, 'left', $fiscalYear);
                    }
                }
            }
        });

        $this->command->info("Created: {$this->created} | Skipped (duplicate): {$this->skipped} | Not found: {$this->notFound}");
        if (!empty($this->notFoundNames)) {
            $this->command->warn("Names not found in DB:");
            foreach (array_unique($this->notFoundNames) as $name) {
                $this->command->warn("  - {$name}");
            }
        }
    }

    private function createAssignment(int $evaluatorId, int $evaluateeId, int $evaluationId, string $angle, int $fiscalYear): void
    {
        $exists = EvaluationAssignment::where([
            'evaluator_id' => $evaluatorId,
            'evaluatee_id' => $evaluateeId,
            'evaluation_id' => $evaluationId,
            'angle' => $angle,
            'fiscal_year' => $fiscalYear,
        ])->exists();

        if ($exists) {
            $this->skipped++;
            return;
        }

        EvaluationAssignment::create([
            'evaluator_id' => $evaluatorId,
            'evaluatee_id' => $evaluateeId,
            'evaluation_id' => $evaluationId,
            'angle' => $angle,
            'fiscal_year' => $fiscalYear,
        ]);
        $this->created++;
    }

    private function findUserByName(string $fullName): ?User
    {
        $fullName = trim($fullName);
        if (empty($fullName)) return null;

        // Parse: "นาย ชื่อ นามสกุล" or "นายชื่อ นามสกุล"
        // Remove prename prefixes — นางสาว MUST come before นาง to avoid partial match
        $cleaned = preg_replace('/^(นางสาว|นาง|นาย|ดร\.|ผศ\.|รศ\.|ศ\.)\s*/u', '', $fullName);
        $parts = preg_split('/\s+/u', trim($cleaned));

        if (count($parts) < 2) {
            $this->notFoundNames[] = $fullName;
            $this->notFound++;
            return null;
        }

        $fname = $parts[0];
        $lname = $parts[1];

        $user = User::where('fname', $fname)->where('lname', $lname)->first();

        // Try fuzzy match if exact match fails
        if (!$user) {
            $user = User::where('fname', 'LIKE', $fname . '%')
                ->where('lname', 'LIKE', $lname . '%')
                ->first();
        }

        if (!$user) {
            $this->notFoundNames[] = "{$fullName} ({$fname} {$lname})";
            $this->notFound++;
        }

        return $user;
    }

    private function getData(): array
    {
        return [
            [
                'emid' => '301008',
                'fname' => 'นงเยาว์', 'lname' => 'อภิวังค์',
                'self' => true,
                'top' => ['นาย พิรัฐพล ตนานนท์'],
                'bottom' => [],
                'left' => ['นาง สุภาภรณ์ ศรีชลายนต์', 'นางสาว สุธาวี หลวงมูล', 'นางสาว ปาริชาด บุญสวน', 'นาย ศราวุธ แสงนาค', 'นางสาว รติมา ไชยวงศ์ษา', 'นางสาว สุเมษา ม่านมุงศิลป์', 'นาย โอฬาร ศรีสุขเศรษฐ', 'นางสาว รัชนีย์ สุขเปียง', 'นาย อนุชิต บุญศิริ', 'นาย องอาจ ดอนญาติ'],
            ],
            [
                'emid' => '391046',
                'fname' => 'องอาจ', 'lname' => 'ดอนญาติ',
                'self' => true,
                'top' => ['นาย พิรัฐพล ตนานนท์'],
                'bottom' => [],
                'left' => ['นาง สุภาภรณ์ ศรีชลายนต์', 'นางสาว สุธาวี หลวงมูล', 'นางสาว ปาริชาด บุญสวน', 'นาย ศราวุธ แสงนาค', 'นางสาว รติมา ไชยวงศ์ษา', 'นางสาว สุเมษา ม่านมุงศิลป์', 'นาย โอฬาร ศรีสุขเศรษฐ', 'นางสาว รัชนีย์ สุขเปียง', 'นาย อนุชิต บุญศิริ', 'นาง นงเยาว์ อภิวังค์'],
            ],
            [
                'emid' => '381007',
                'fname' => 'ชัยณรงค์', 'lname' => 'เหมือนอบ',
                'self' => true,
                'top' => ['นาย นิรันดร์ พงษ์ธัญญการ'],
                'bottom' => [],
                'left' => ['นาย ธนะวัฒน์ พรหมมณี', 'นาง วิชชุดา แก้วถม', 'นาย กฤษณ์ สารทะวงษ์'],
            ],
            [
                'emid' => '531003',
                'fname' => 'สมจิต', 'lname' => 'ทอดแสน',
                'self' => true,
                'top' => ['นาง นิสา แก้วพินิจ'],
                'bottom' => [],
                'left' => ['นางสาว จุฑารัตน์ จิตรอารีย์รัตน์', 'นางสาว กัญญานัฐ วันขวัญ', 'นาง เพ็ญสุดา ว่องวิษณุพงศ์', 'นาย ศุภสิทธิ์ อัตถไพศาล', 'นางสาว สุภาณี วรบุตร', 'นางสาว อัญชลี ภู่สุนทรธรรม'],
            ],
            [
                'emid' => '591003',
                'fname' => 'ณรงค์ศักดิ์', 'lname' => 'ปัญญารอด',
                'self' => true,
                'top' => ['นาง นิสา แก้วพินิจ'],
                'bottom' => [],
                'left' => ['นางสาว จุฑารัตน์ จิตรอารีย์รัตน์', 'นางสาว กัญญานัฐ วันขวัญ', 'นาง เพ็ญสุดา ว่องวิษณุพงศ์', 'นาย ศุภสิทธิ์ อัตถไพศาล', 'นางสาว สุภาณี วรบุตร', 'นางสาว อัญชลี ภู่สุนทรธรรม'],
            ],
            [
                'emid' => '351023',
                'fname' => 'กิตติภูมิ', 'lname' => 'ไกรธรรม',
                'self' => true,
                'top' => ['นาย กิตติภัฏ ภาคสวัสดิ์'],
                'bottom' => [],
                'left' => ['นางสาว ทาริกา จันทแก้ว', 'นาย ศราวุธ โยธินะเวคิน', 'นาย ชิงชัย เจียมจริต', 'นาย ศุภนัส สท้านวัตร์', 'นาย สุวัฒน์ วรรณโชติ', 'นาย ดนัย ยิ่งยงค์', 'นางสาว สุนิสา บิชา', 'นาย ตรีทศพล เฮ้าลาแสงคำ', 'นาย ภัทรนันท์ ปานหงษ์'],
            ],
            [
                'emid' => '341043',
                'fname' => 'สมชาย', 'lname' => 'แก่นจันทอง',
                'self' => true,
                'top' => ['นาย ธาตรี เล็กสุวัฒน์'],
                'bottom' => [],
                'left' => ['นางสาว บานชื่น ประทุมพฤกษ์', 'นางสาว สิรินุช อินประถม', 'นางสาว กมลพัชร์ เชิดชูบัณฑิต', 'นางสาว รัตนาภรณ์ กิมิฬาร์', 'นางสาว ปรารถนา สุขศิริ', 'นางสาว วชิราภรณ์ ชามน้อย', 'นางสาว รัตนรรณ ทิวถนอม', 'นาย ชวิศ ภูริพัฒน์', 'นาย บัณยวัต รัตนพิไชย', 'นาย ภานุวัฒน์ องอาจ', 'นาย ฐาปนรักษ์ นิลเพชร', 'นางสาว ศศิวิมล อารีการ'],
            ],
            [
                'emid' => '351011',
                'fname' => 'บุญศักดิ์', 'lname' => 'จันทะนะ',
                'self' => true,
                'top' => ['นาง นปภัช สวัสดิ์'],
                'bottom' => [],
                'left' => ['นาง ศจีรัตน์ ศิริเกษมสุข', 'นาย สงกรานต์ สิงห์อำพล', 'นาย วิสุทธิ์ ทองประดิษฐ', 'นางสาว ชลดา ทองโสม', 'นาย ธนภัทร รวีพินิจ', 'นาย ไกรสิทธิ เลี่ยวสมบูรณ์', 'นาย ปิยะพล ทรงประยูร', 'นางสาว รวินทรา จิรวัฒน์จรรยา', 'นาย เจริญวุฒิ หงษ์ทอง'],
            ],
            [
                'emid' => '361064',
                'fname' => 'สาโรจน์', 'lname' => 'จันทรทรี',
                'self' => true,
                'top' => ['นาง จุไรศรี ไชยศรี', 'นาย วัชระ กันตังกุล'],
                'bottom' => [],
                'left' => ['นางสาว นิตยา บัญชา', 'นางสาว สุพรรณิกา จิรปฐมชัย', 'นางสาว กนกอร แอ่งกลาง', 'นางสาว สุพรรษา โปดำ', 'นาย รัตน์พงศ์ กุญชรบุญ', 'นางสาว อัจฉรา เพ็งชัย', 'นาง วารี จันทรทรี', 'นาย ภิรมย์ อันล้ำเลิศ', 'นาย สิปปภาส สมุทรถา', 'นาย ไพจิตร อาจหาญ', 'นาย สมรัก บัวชื่น', 'นาย นุชิต สุรกานต์กุล', 'นาย วรพล เพ็ชรภา', 'นาย ภาณุพงศ์ พูลสิน', 'นางสาว มนภร เหมะชยางกูร', 'นาง นุชนารถ ภัทราบุญญากุล', 'นางสาว ธัญญพร ชาติกำแหง', 'นางสาว สมปรารถนา เปลี่ยนสี'],
            ],
            [
                'emid' => '361068',
                'fname' => 'สมพาน', 'lname' => 'ขาน้อย',
                'self' => true,
                'top' => ['นาง จุไรศรี ไชยศรี', 'นาย วัชระ กันตังกุล'],
                'bottom' => [],
                'left' => ['นางสาว นิตยา บัญชา', 'นางสาว สุพรรณิกา จิรปฐมชัย', 'นางสาว กนกอร แอ่งกลาง', 'นางสาว สุพรรษา โปดำ', 'นาย รัตน์พงศ์ กุญชรบุญ', 'นางสาว อัจฉรา เพ็งชัย', 'นาง วารี จันทรทรี', 'นาย ภิรมย์ อันล้ำเลิศ', 'นาย สิปปภาส สมุทรถา', 'นาย ไพจิตร อาจหาญ', 'นาย สมรัก บัวชื่น', 'นาย นุชิต สุรกานต์กุล', 'นาย วรพล เพ็ชรภา', 'นาย ภาณุพงศ์ พูลสิน', 'นางสาว มนภร เหมะชยางกูร', 'นาง นุชนารถ ภัทราบุญญากุล', 'นางสาว ธัญญพร ชาติกำแหง', 'นางสาว สมปรารถนา เปลี่ยนสี'],
            ],
            [
                'emid' => '361065',
                'fname' => 'ทองดี', 'lname' => 'ดุสดีภักดิ์',
                'self' => true,
                'top' => ['นาย ดำเนิน สารศรี', 'นาง นวลจันทร์ ทารักษ์'],
                'bottom' => [],
                'left' => ['นาย ศุภโชค ศิลปเจริญ', 'นาง จุฬาลักษณ์ จึงประเสริฐ', 'นางสาว มัณฑนา แจ่มศรี', 'นางสาว ธัชพรรณ รมณียจิตโต', 'นาย อรรจน์ภณ ทองโสม', 'นางสาว กุลณิชา ชีรนรวนิชย์', 'นาย สัมฤทธิ์ชัย สนสาขา', 'นางสาว ปารนีย์ บุญช่วย', 'นางสาว ธัญญนันท์ พิทักษ์พงศ์', 'นางสาว พินยา พลแก้ว', 'นาง รัชณิยา รัตนอัมพร', 'นางสาว ณัชชา ถาวรวงศ์', 'นาย นรินทร์วัฒน์ พับพรวนกุล', 'นาย ภูริช สุวรรณขาว', 'นางสาว ชฎาบุศย์ พัฒนศิริ', 'นางสาว สุธินันท์ กันเงิน', 'นาย ชวภณ พรหมมะ', 'นางสาว ปรางค์ทิพย์ พงษ์ประเสริฐ', 'นาย พุทธมนต์ บุญล้อม'],
            ],
        ];
    }
}
