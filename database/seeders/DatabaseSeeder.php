<?php
namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            SectionSeeder::class,
            AspectSeeder::class,
            QuestionOptionSeeder::class,
        ]);
        \App\Models\Question::factory(30)->create()->each(function ($question) {
            if ($question->type === 'rating') {
                foreach ([
                    ['มากที่สุด', 5],
                    ['มาก', 4],
                    ['ปานกลาง', 3],
                    ['น้อย', 2],
                    ['น้อยที่สุด', 1],
                ] as [$label, $score]) {
                    $question->options()->create(compact('label', 'score'));
                }
            }
        });

        \App\Models\Evaluation::factory(10)->create()->each(function ($evaluation) {
            $questions = \App\Models\Question::all();
            foreach ($questions as $question) {
                \App\Models\Evaluation_answer::create([
                    'evaluation_id' => $evaluation->id,
                    'question_id'   => $question->id,
                    'score'         => $question->type === 'rating' ? rand(1, 5) : null,
                    'answer_text'   => $question->type === 'open_text' ? 'ความคิดเห็นจำลอง' : null,
                ]);
            }
        });

    }
}
