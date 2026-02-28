<?php

namespace Database\Seeders;

use App\Models\Evaluation;
use App\Models\Part;
use App\Models\Aspect;
use App\Models\Question;
use App\Models\Option;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GovernorEvaluationSeeder extends Seeder
{
    /**
     * Seed governor (ผู้ว่าการ กนอ.) evaluation forms — grade 13
     * Creates 3 evaluations: Internal, External, Self
     */
    public function run(): void
    {
        DB::transaction(function () {
            $this->command->info('Creating Governor Evaluations (Grade 13)...');

            // Evaluation 1: Internal 360 for Governor
            $internalEval = $this->createInternalGovernorEvaluation();
            $this->command->info("  Created: Internal Governor Evaluation (ID: {$internalEval->id})");

            // Evaluation 2: External 360 for Governor
            $externalEval = $this->createExternalGovernorEvaluation();
            $this->command->info("  Created: External Governor Evaluation (ID: {$externalEval->id})");

            // Evaluation 3: Self-evaluation for Governor
            $selfEval = $this->createSelfGovernorEvaluation();
            $this->command->info("  Created: Self Governor Evaluation (ID: {$selfEval->id})");

            $this->command->info('Governor Evaluations seeded successfully!');
        });
    }

    /**
     * Internal 360 for Governor (บุคลากรภายใน ประเมินผู้ว่าการ)
     */
    private function createInternalGovernorEvaluation(): Evaluation
    {
        $eval = Evaluation::create([
            'title' => 'แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายใน',
            'description' => 'แบบประเมินผู้ว่าการการนิคมอุตสาหกรรมแห่งประเทศไทย โดยบุคลากรภายในองค์กร',
            'status' => 'published',
            'user_type' => 'internal',
            'grade_min' => 13,
            'grade_max' => 13,
        ]);

        // Part 1: 360 Degree Criteria
        $part1 = Part::create([
            'evaluation_id' => $eval->id,
            'title' => 'ส่วนที่ 1 การประเมินตามเกณฑ์การประเมิน 360 องศา สำหรับผู้ว่าการ กนอ.',
            'order' => 1,
        ]);

        $this->createGovernorInternalPart1Aspects($part1);

        // Part 2: Organizational Culture
        $part2 = Part::create([
            'evaluation_id' => $eval->id,
            'title' => 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร',
            'order' => 2,
        ]);

        $this->createCultureAspects($part2, 'internal');

        return $eval;
    }

    /**
     * External 360 for Governor (บุคลากรภายนอก ประเมินผู้ว่าการ)
     */
    private function createExternalGovernorEvaluation(): Evaluation
    {
        $eval = Evaluation::create([
            'title' => 'แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายนอก',
            'description' => 'แบบประเมินผู้ว่าการการนิคมอุตสาหกรรมแห่งประเทศไทย โดยบุคลากรภายนอกองค์กร',
            'status' => 'published',
            'user_type' => 'external',
            'grade_min' => 13,
            'grade_max' => 13,
        ]);

        // Part 1: External Evaluation Criteria
        $part1 = Part::create([
            'evaluation_id' => $eval->id,
            'title' => 'ส่วนที่ 1 แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายนอก',
            'order' => 1,
        ]);

        $this->createGovernorExternalPart1Aspects($part1);

        // Part 2: Organizational Culture
        $part2 = Part::create([
            'evaluation_id' => $eval->id,
            'title' => 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร',
            'order' => 2,
        ]);

        $this->createCultureAspects($part2, 'external');

        return $eval;
    }

    /**
     * Self-evaluation for Governor (ผู้ว่าการ ประเมินตนเอง)
     */
    private function createSelfGovernorEvaluation(): Evaluation
    {
        $eval = Evaluation::create([
            'title' => 'แบบประเมิน 360 องศา สำหรับประเมินตนเอง ผู้ว่าการ กนอ.',
            'description' => 'แบบประเมินตนเองสำหรับผู้ว่าการการนิคมอุตสาหกรรมแห่งประเทศไทย',
            'status' => 'published',
            'user_type' => 'internal',
            'grade_min' => 13,
            'grade_max' => 13,
        ]);

        // Part 1: Self-evaluation criteria (same as internal)
        $part1 = Part::create([
            'evaluation_id' => $eval->id,
            'title' => 'ส่วนที่ 1 การประเมินตามเกณฑ์การประเมิน 360 องศา',
            'order' => 1,
        ]);

        $this->createGovernorSelfPart1Aspects($part1);

        // Part 2: Organizational Culture (self-evaluation version with knowledge questions)
        $part2 = Part::create([
            'evaluation_id' => $eval->id,
            'title' => 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร',
            'order' => 2,
        ]);

        $this->createSelfCultureAspects($part2);

        // Part 3: Open-ended Questions
        $part3 = Part::create([
            'evaluation_id' => $eval->id,
            'title' => 'ส่วนที่ 3 ประเด็นคำถามปลายเปิด',
            'order' => 3,
        ]);

        $this->createOpenEndedAspect($part3);

        return $eval;
    }

    // ========================================================================
    // Part 1: Governor Internal Evaluation — 6 Aspects
    // ========================================================================

    private function createGovernorInternalPart1Aspects(Part $part): void
    {
        // Aspect 1: Leadership (30%)
        $a1 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านความเป็นผู้นำ (Leadership)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a1, [
            'ผู้ว่าการสามารถกำหนดทิศทางเชิงกลยุทธ์และนำพาองค์กรให้บรรลุเป้าหมายระดับชาติได้',
            'ผู้ว่าการแสดงภาวะผู้นำในการตัดสินใจเชิงนโยบายที่ส่งผลกระทบต่อการพัฒนานิคมอุตสาหกรรม',
            'ผู้ว่าการสนับสนุนและสร้างแรงบันดาลใจให้บุคลากรทุกระดับทุ่มเทในการทำงาน',
            'ผู้ว่าการสามารถบริหารจัดการในสถานการณ์วิกฤตและนำองค์กรผ่านความท้าทายได้อย่างมีประสิทธิภาพ',
        ]);

        // Aspect 2: Vision (25%)
        $a2 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านการมีวิสัยทัศน์ (Vision)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a2, [
            'ผู้ว่าการมีวิสัยทัศน์ชัดเจนในการพัฒนานิคมอุตสาหกรรมให้เป็นมาตรฐานระดับสากล',
            'ผู้ว่าการส่งเสริมการพัฒนาที่ยั่งยืนโดยคำนึงถึงผลกระทบด้านสิ่งแวดล้อม สังคม และเศรษฐกิจ',
            'ผู้ว่าการมีแนวทางการกำกับดูแลที่ส่งเสริมการเติบโตอย่างยั่งยืนขององค์กร',
        ]);

        // Aspect 3: Communication (15%)
        $a3 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านการติดต่อสื่อสาร (Communication)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a3, [
            'ผู้ว่าการสามารถสื่อสารวิสัยทัศน์และนโยบายให้บุคลากรทุกระดับเข้าใจและนำไปปฏิบัติได้',
            'ผู้ว่าการมีทักษะการสื่อสารกับผู้มีส่วนได้ส่วนเสียทั้งภายในและภายนอกองค์กรได้อย่างมีประสิทธิภาพ',
            'ผู้ว่าการสามารถสื่อสารเชิงรุกเพื่อสร้างความเข้าใจและความไว้วางใจในสถานการณ์ที่มีความอ่อนไหว',
            'ผู้ว่าการใช้ช่องทางดิจิทัลและสื่อสมัยใหม่เพื่อเข้าถึงผู้ที่เกี่ยวข้องได้อย่างเหมาะสม',
        ]);

        // Aspect 4: Thinking & Innovation (10%)
        $a4 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านความสามารถในการคิดและนวัตกรรม (Thinking and Innovation)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a4, [
            'ผู้ว่าการส่งเสริมให้องค์กรนำนวัตกรรมมาใช้เพื่อเพิ่มขีดความสามารถในการแข่งขัน',
            'ผู้ว่าการสามารถนำข้อมูลเชิงวิเคราะห์มาสนับสนุนการตัดสินใจเชิงนโยบายได้อย่างเหมาะสม',
            'ผู้ว่าการมีแนวทางในการนำเทคโนโลยีดิจิทัลมาพัฒนากระบวนการทำงานและบริการขององค์กร',
        ]);

        // Aspect 5: Ethics (10%)
        $a5 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านจริยธรรมในการปฏิบัติงาน (Ethics)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a5, [
            'ผู้ว่าการดำเนินงานด้วยความซื่อสัตย์ โปร่งใส และเป็นแบบอย่างด้านธรรมาภิบาล',
            'ผู้ว่าการส่งเสริมวัฒนธรรมองค์กรที่เน้นความยุติธรรมและจริยธรรม',
            'ผู้ว่าการเคารพในความแตกต่างของผู้มีส่วนได้ส่วนเสียทั้งภายในและภายนอก',
            'ผู้ว่าการเป็นแบบอย่างของการปฏิบัติงานที่คำนึงถึงจริยธรรมและความถูกต้อง',
        ]);

        // Aspect 6: Interpersonal & Collaboration (10%)
        $a6 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านทักษะระหว่างบุคคลและความร่วมมือ (Interpersonal Skills and Collaboration)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a6, [
            'ผู้ว่าการสามารถสร้างความสัมพันธ์ที่ดีและประสานงานกับหน่วยงานภาครัฐและเอกชนได้อย่างมีประสิทธิภาพ',
            'ผู้ว่าการรับฟังความคิดเห็นที่หลากหลายและนำมาใช้ในการตัดสินใจอย่างรอบด้าน',
            'ผู้ว่าการสนับสนุนการทำงานร่วมกันระหว่างหน่วยงานเพื่อบรรลุเป้าหมายองค์กร',
            'ผู้ว่าการสามารถสร้างความไว้วางใจกับทุกฝ่ายที่เกี่ยวข้อง',
        ]);
    }

    // ========================================================================
    // Part 1: Governor External Evaluation — 6 Aspects (External perspective)
    // ========================================================================

    private function createGovernorExternalPart1Aspects(Part $part): void
    {
        // Aspect 1: Leadership & Management
        $a1 = Aspect::create(['part_id' => $part->id, 'name' => 'ความสามารถในการเป็นผู้นำและการบริหารจัดการ', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a1, [
            'ผู้ว่าการสามารถวางแผนกลยุทธ์และกำกับดูแลการดำเนินงานที่สอดคล้องกับเป้าหมายระดับชาติได้ครอบคลุมทุกมิติ',
            'ผู้ว่าการสามารถแสดงความเป็นผู้นำในการแก้ไขปัญหาเชิงซับซ้อนได้อย่างชัดเจน',
            'ผู้ว่าการมีแนวทางในการสร้างความร่วมมือกับหน่วยงานภายนอกเพื่อส่งเสริมการพัฒนานิคมอุตสาหกรรม',
        ]);

        // Aspect 2: Sustainability
        $a2 = Aspect::create(['part_id' => $part->id, 'name' => 'การส่งเสริมความยั่งยืน (Sustainability)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a2, [
            'ผู้ว่าการมีวิธีการสนับสนุนการดำเนินงานที่คำนึงถึงผลกระทบด้านสิ่งแวดล้อมได้อย่างเหมาะสม',
            'ผู้ว่าการส่งเสริมการทำงานร่วมกันในระดับชุมชนและสร้างผลประโยชน์ทางเศรษฐกิจได้อย่างมีความเป็นธรรม',
            'ผู้ว่าการมีแนวทางส่งเสริมความรับผิดชอบต่อสังคมขององค์กร (CSR) ได้อย่างเหมาะสม',
        ]);

        // Aspect 3: Communication & Relationship
        $a3 = Aspect::create(['part_id' => $part->id, 'name' => 'ทักษะการติดต่อสื่อสารและการสร้างความสัมพันธ์', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a3, [
            'ผู้ว่าการสามารถสื่อสารกับหน่วยงานภายนอกเพื่อแก้ไขปัญหาและส่งเสริมความร่วมมือได้อย่างมีประสิทธิภาพ',
            'ผู้ว่าการสามารถสร้างเครือข่ายความสัมพันธ์ที่เป็นประโยชน์ต่อองค์กรและชุมชนได้เข้มแข็ง',
            'ผู้ว่าการใช้เทคโนโลยีเพื่อสื่อสารและสร้างความเข้าใจกับหน่วยงานภายนอกได้อย่างชัดเจน',
        ]);

        // Aspect 4: Thinking & Innovation
        $a4 = Aspect::create(['part_id' => $part->id, 'name' => 'ความสามารถในการคิดและนวัตกรรม', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a4, [
            'ผู้ว่าการสามารถใช้ข้อมูลเชิงวิเคราะห์เพื่อสนับสนุนการตัดสินใจที่สำคัญได้ทันท่วงที',
            'ผู้ว่าการส่งเสริมนวัตกรรมและการนำเทคโนโลยีมาใช้ในการพัฒนาองค์กรได้อย่างเหมาะสม',
            'ผู้ว่าการสามารถนำเสนอแนวคิดสร้างสรรค์เพื่อแก้ไขปัญหาและพัฒนาองค์กรได้อย่างเหมาะสม',
        ]);

        // Aspect 5: Ethics
        $a5 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านจริยธรรมในการปฏิบัติงาน', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a5, [
            'ผู้ว่าการมีแนวทางในการส่งเสริมธรรมาภิบาลและความโปร่งใสในการบริหารองค์กร',
            'ผู้ว่าการปฏิบัติงานโดยคำนึงถึงความยุติธรรมและจริยธรรม',
            'ผู้ว่าการแสดงเป็นแบบอย่างที่ชัดเจนของการรักษาจรรยาบรรณในการทำงาน',
        ]);

        // Aspect 6: Interpersonal & Collaboration
        $a6 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านทักษะระหว่างบุคคลและความร่วมมือ', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a6, [
            'ผู้ว่าการสามารถสร้างความสัมพันธ์ที่ดีกับหน่วยงานภายนอกเพื่อบรรลุเป้าหมายได้อย่างเหมาะสม',
            'ผู้ว่าการมีวิธีการรับฟังความคิดเห็นที่หลากหลายและใช้ข้อมูลนั้นในการตัดสินใจได้อย่างชัดเจน',
            'ผู้ว่าการสนับสนุนการทำงานร่วมกันระหว่างองค์กรเพื่อบรรลุเป้าหมายร่วมกัน',
        ]);
    }

    // ========================================================================
    // Part 1: Governor Self-Evaluation — 6 Aspects
    // ========================================================================

    private function createGovernorSelfPart1Aspects(Part $part): void
    {
        // Same 6 aspects as internal but with self-evaluation perspective
        $a1 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านความเป็นผู้นำ (Leadership)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a1, [
            'ท่านสามารถกำหนดทิศทางเชิงกลยุทธ์และนำพาองค์กรให้บรรลุเป้าหมายระดับชาติได้',
            'ท่านสามารถตัดสินใจเชิงนโยบายที่ส่งผลกระทบเชิงบวกต่อการพัฒนานิคมอุตสาหกรรม',
            'ท่านสนับสนุนและสร้างแรงบันดาลใจให้บุคลากรทุกระดับทุ่มเทในการทำงาน',
            'ท่านสามารถบริหารจัดการในสถานการณ์วิกฤตและนำองค์กรผ่านความท้าทายได้',
        ]);

        $a2 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านการมีวิสัยทัศน์ (Vision)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a2, [
            'ท่านมีวิสัยทัศน์ชัดเจนในการพัฒนานิคมอุตสาหกรรมให้เป็นมาตรฐานระดับสากล',
            'ท่านส่งเสริมการพัฒนาที่ยั่งยืนโดยคำนึงถึงผลกระทบด้านสิ่งแวดล้อม สังคม และเศรษฐกิจ',
            'ท่านมีแนวทางการกำกับดูแลที่ส่งเสริมการเติบโตอย่างยั่งยืนขององค์กร',
        ]);

        $a3 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านการติดต่อสื่อสาร (Communication)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a3, [
            'ท่านสามารถสื่อสารวิสัยทัศน์และนโยบายให้บุคลากรทุกระดับเข้าใจและนำไปปฏิบัติได้',
            'ท่านมีทักษะการสื่อสารกับผู้มีส่วนได้ส่วนเสียทั้งภายในและภายนอกองค์กรได้อย่างมีประสิทธิภาพ',
            'ท่านสามารถสื่อสารเชิงรุกเพื่อสร้างความเข้าใจและความไว้วางใจในสถานการณ์ที่มีความอ่อนไหว',
            'ท่านใช้ช่องทางดิจิทัลและสื่อสมัยใหม่เพื่อเข้าถึงผู้ที่เกี่ยวข้องได้อย่างเหมาะสม',
        ]);

        $a4 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านความสามารถในการคิดและนวัตกรรม (Thinking and Innovation)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a4, [
            'ท่านส่งเสริมให้องค์กรนำนวัตกรรมมาใช้เพื่อเพิ่มขีดความสามารถในการแข่งขัน',
            'ท่านสามารถนำข้อมูลเชิงวิเคราะห์มาสนับสนุนการตัดสินใจเชิงนโยบายได้อย่างเหมาะสม',
            'ท่านมีแนวทางในการนำเทคโนโลยีดิจิทัลมาพัฒนากระบวนการทำงานและบริการขององค์กร',
        ]);

        $a5 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านจริยธรรมในการปฏิบัติงาน (Ethics)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a5, [
            'ท่านดำเนินงานด้วยความซื่อสัตย์ โปร่งใส และเป็นแบบอย่างด้านธรรมาภิบาล',
            'ท่านส่งเสริมวัฒนธรรมองค์กรที่เน้นความยุติธรรมและจริยธรรม',
            'ท่านเคารพในความแตกต่างของผู้มีส่วนได้ส่วนเสียทั้งภายในและภายนอก',
            'ท่านเป็นแบบอย่างของการปฏิบัติงานที่คำนึงถึงจริยธรรมและความถูกต้อง',
        ]);

        $a6 = Aspect::create(['part_id' => $part->id, 'name' => 'ด้านทักษะระหว่างบุคคลและความร่วมมือ (Interpersonal Skills and Collaboration)', 'has_subaspects' => false]);
        $this->createRatingQuestions($part, $a6, [
            'ท่านสามารถสร้างความสัมพันธ์ที่ดีและประสานงานกับหน่วยงานภาครัฐและเอกชนได้อย่างมีประสิทธิภาพ',
            'ท่านรับฟังความคิดเห็นที่หลากหลายและนำมาใช้ในการตัดสินใจอย่างรอบด้าน',
            'ท่านสนับสนุนการทำงานร่วมกันระหว่างหน่วยงานเพื่อบรรลุเป้าหมายองค์กร',
            'ท่านสามารถสร้างความไว้วางใจกับทุกฝ่ายที่เกี่ยวข้อง',
        ]);
    }

    // ========================================================================
    // Part 2: Culture Aspects (Internal/External)
    // ========================================================================

    private function createCultureAspects(Part $part, string $type): void
    {
        // Aspect 2.1: Recognition of I-EA-T values
        $a1 = Aspect::create([
            'part_id' => $part->id,
            'name' => '2.1 การยอมรับพฤติกรรมตามค่านิยม "I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน"',
            'has_subaspects' => false,
        ]);

        $cultureQuestions = [
            'บุคลากรมีมุมมองเชิงกลยุทธ์ มองเห็นโอกาสทางธุรกิจ คิดเป็นระบบ และสามารถตัดสินใจโดยพิจารณาผลกระทบในหลายด้าน',
            'บุคลากรสามารถคิดสร้างสรรค์ ริเริ่มสิ่งใหม่ ๆ และพัฒนานวัตกรรมหรือแนวทางใหม่ในการทำงาน',
            'บุคลากรมีความสามารถในการใช้เทคโนโลยี วิเคราะห์ข้อมูล และนำข้อมูลมาปรับปรุงงานอย่างต่อเนื่อง',
            'บุคลากรมีความสามารถในการปรับตัว ฟื้นตัวจากความผิดพลาด และเปิดใจรับฟังความคิดเห็นที่แตกต่าง',
            'บุคลากรสามารถสร้างความสัมพันธ์ที่ดี ทำงานร่วมกับผู้อื่น และสื่อสารประสานงานได้อย่างมีประสิทธิภาพ',
            'บุคลากรมีความรับผิดชอบ ปฏิบัติงานตามมาตรฐานอย่างถูกต้องแม่นยำ และสามารถรายงานผลได้อย่างมืออาชีพ',
            'บุคลากรยึดมั่นในหลักจริยธรรม มีความโปร่งใส และคำนึงถึงผลกระทบของงานต่อองค์กรและสังคม',
            'บุคลากรมีความตระหนักรู้เกี่ยวกับความเสี่ยง และสามารถจัดการความเสี่ยงในงานได้อย่างเหมาะสม',
        ];
        $this->createRatingQuestions($part, $a1, $cultureQuestions);

        // Aspect 2.2: Demonstrated behavior
        $a2 = Aspect::create([
            'part_id' => $part->id,
            'name' => '2.2 การแสดงพฤติกรรมตามค่านิยม "I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน"',
            'has_subaspects' => false,
        ]);

        // Same questions for behavior demonstration
        $this->createRatingQuestions($part, $a2, $cultureQuestions);
    }

    // ========================================================================
    // Part 2: Self-evaluation Culture Aspects (with knowledge-test questions)
    // ========================================================================

    private function createSelfCultureAspects(Part $part): void
    {
        // Aspect 2.1: Recognition of values
        $a1 = Aspect::create([
            'part_id' => $part->id,
            'name' => '2.1 การรับรู้ค่านิยม "I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน"',
            'has_subaspects' => false,
        ]);

        // Choice questions about organizational values
        $q1 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a1->id,
            'title' => 'ค่านิยมใหม่" ของ กนอ. ที่ได้เริ่มมีการใช้มาตั้งแต่ ปีงบประมาณ 2567 (ภาษาไทย) คือ',
            'type' => 'choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q1, [
            ['label' => 'เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน', 'score' => 1],
            ['label' => 'ใฝ่เรียนรู้ มุ่งมั่น สร้างสรรค์ รับผิดชอบ', 'score' => 0],
            ['label' => 'ซื่อสัตย์ โปร่งใส มีวินัย ใส่ใจบริการ', 'score' => 0],
            ['label' => 'สามัคคี มีวินัย ใส่ใจคุณภาพ', 'score' => 0],
        ]);

        $q2 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a1->id,
            'title' => 'ค่านิยมใหม่" ของ กนอ. ที่ได้เริ่มมีการใช้มาตั้งแต่ ปีงบประมาณ 2567 (ภาษาอังกฤษ)  คือ',
            'type' => 'choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q2, [
            ['label' => 'I-EA-T for Sustainability', 'score' => 1],
            ['label' => 'IEAT Smart Organization', 'score' => 0],
            ['label' => 'Excellence for People', 'score' => 0],
            ['label' => 'Innovation Driven Enterprise', 'score' => 0],
        ]);

        $q3 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a1->id,
            'title' => 'ท่านรับรู้ข้อมูลค่านิยม กนอ. จากใคร (เลือกได้มากกว่า 1 ข้อ)',
            'type' => 'multiple_choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q3, [
            ['label' => 'ผู้ว่าการ/ผู้บริหารระดับสูง', 'score' => null],
            ['label' => 'ผู้บังคับบัญชาโดยตรง', 'score' => null],
            ['label' => 'เพื่อนร่วมงาน', 'score' => null],
            ['label' => 'สื่อภายในองค์กร (Intranet, Line Group)', 'score' => null],
            ['label' => 'การอบรม/สัมมนา', 'score' => null],
        ]);

        $q4 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a1->id,
            'title' => 'ท่านรับรู้ข้อมูลค่านิยมของ กนอ. จากช่องทางใดบ้าง (เลือกได้มากกว่า 1 ข้อ)',
            'type' => 'multiple_choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q4, [
            ['label' => 'การประชุมภายใน', 'score' => null],
            ['label' => 'อีเมล / จดหมายเวียน', 'score' => null],
            ['label' => 'เว็บไซต์ / Intranet', 'score' => null],
            ['label' => 'สื่อสังคมออนไลน์ (Line, Facebook)', 'score' => null],
            ['label' => 'โปสเตอร์ / สื่อประชาสัมพันธ์', 'score' => null],
        ]);

        // Aspect 2.2: Understanding of values
        $a2 = Aspect::create([
            'part_id' => $part->id,
            'name' => '2.2 ความเข้าใจค่านิยม "I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน"',
            'has_subaspects' => false,
        ]);

        $q5 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a2->id,
            'title' => 'ข้อใดแสดงความหมายของ I-EA-T ได้ถูกต้องที่สุด',
            'type' => 'choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q5, [
            ['label' => 'I = IQ (เก่งคิด), E = EQ (เก่งคน), A = AQ (เก่งงาน), T = TQ (เก่งเทคโนโลยี)', 'score' => 1],
            ['label' => 'I = Innovation, E = Excellence, A = Agility, T = Teamwork', 'score' => 0],
            ['label' => 'I = Integrity, E = Ethics, A = Accountability, T = Transparency', 'score' => 0],
            ['label' => 'I = Intelligence, E = Engagement, A = Achievement, T = Trust', 'score' => 0],
        ]);

        $q6 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a2->id,
            'title' => 'ข้อความใดต่อไปนี้เป็นค่านิยมของ กนอ. ในภาษาไทย',
            'type' => 'choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q6, [
            ['label' => 'กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน', 'score' => 1],
            ['label' => 'กนอ. ซื่อสัตย์ โปร่งใส มีวินัย ใส่ใจบริการ', 'score' => 0],
            ['label' => 'กนอ. สามัคคี มุ่งมั่น สร้างสรรค์ พัฒนา', 'score' => 0],
            ['label' => 'กนอ. คิดใหม่ ทำจริง รวมพลัง สร้างอนาคต', 'score' => 0],
        ]);

        // Aspect 2.3: Understanding of desired behaviors
        $a3 = Aspect::create([
            'part_id' => $part->id,
            'name' => '2.3 ความเข้าใจเกี่ยวกับพฤติกรรมพึงประสงค์ของค่านิยม "I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน"',
            'has_subaspects' => false,
        ]);

        $q7 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a3->id,
            'title' => 'ข้อใด ไม่ใช่ พฤติกรรมพึงประสงค์ ภายใต้ค่านิยม "เก่งคิด – IQ"',
            'type' => 'choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q7, [
            ['label' => 'การยึดติดกับวิธีการทำงานเดิมโดยไม่เปิดรับมุมมองใหม่', 'score' => 1],
            ['label' => 'การคิดเชิงกลยุทธ์และวิเคราะห์อย่างเป็นระบบ', 'score' => 0],
            ['label' => 'การตัดสินใจโดยพิจารณาผลกระทบรอบด้าน', 'score' => 0],
            ['label' => 'การมองเห็นโอกาสทางธุรกิจและการพัฒนา', 'score' => 0],
        ]);

        $q8 = Question::create([
            'part_id' => $part->id,
            'aspect_id' => $a3->id,
            'title' => 'ข้อใด ไม่ใช่ พฤติกรรมพึงประสงค์ ภายใต้ค่านิยม "เก่งงาน – TQ (Technology Quotient)"',
            'type' => 'choice',
            'order' => 1,
        ]);
        $this->createChoiceOptions($q8, [
            ['label' => 'การหลีกเลี่ยงการใช้เทคโนโลยีใหม่ในการทำงาน', 'score' => 1],
            ['label' => 'การนำเทคโนโลยีมาปรับปรุงกระบวนการทำงาน', 'score' => 0],
            ['label' => 'การวิเคราะห์ข้อมูลเพื่อพัฒนาการตัดสินใจ', 'score' => 0],
            ['label' => 'การเรียนรู้เครื่องมือดิจิทัลเพื่อเพิ่มประสิทธิภาพ', 'score' => 0],
        ]);
    }

    // ========================================================================
    // Part 3: Open-ended Questions (Self-evaluation only)
    // ========================================================================

    private function createOpenEndedAspect(Part $part): void
    {
        $aspect = Aspect::create([
            'part_id' => $part->id,
            'name' => 'ประเด็นคำถามปลายเปิด',
            'has_subaspects' => false,
        ]);

        Question::create([
            'part_id' => $part->id,
            'aspect_id' => $aspect->id,
            'title' => 'จงยกตัวอย่างพฤติกรรมที่พึงประสงค์ของค่านิยมหัวข้อ "เก่งงาน AQ (Adversity Quotient) ซึ่งสะท้อน ความเป็นมืออาชีพในการทำงาน (Professional) มาสั้น ๆ เพื่อเป็นตัวอย่าง',
            'type' => 'open_text',
            'order' => 1,
        ]);
    }

    // ========================================================================
    // Helper: Create rating questions with 1-5 scale options
    // ========================================================================

    private function createRatingQuestions(Part $part, Aspect $aspect, array $questionTitles): void
    {
        foreach ($questionTitles as $title) {
            $question = Question::create([
                'part_id' => $part->id,
                'aspect_id' => $aspect->id,
                'title' => $title,
                'type' => 'rating',
                'order' => 1,
            ]);

            // Create 5-point rating scale (same as existing evaluations)
            for ($score = 5; $score >= 1; $score--) {
                Option::create([
                    'question_id' => $question->id,
                    'label' => (string) $score,
                    'score' => $score,
                ]);
            }
        }
    }

    /**
     * Helper: Create choice/multiple-choice options
     */
    private function createChoiceOptions(Question $question, array $options): void
    {
        foreach ($options as $option) {
            Option::create([
                'question_id' => $question->id,
                'label' => $option['label'],
                'score' => $option['score'],
            ]);
        }
    }
}
