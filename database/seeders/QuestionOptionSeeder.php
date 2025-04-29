<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Question;

class QuestionOptionSeeder extends Seeder
{
    public function run(): void
    {
        $ratingQuestions = Question::where('type', 'rating')->get();

        foreach ($ratingQuestions as $question) {
            foreach ([
                ['label' => 'มากที่สุด', 'score' => 5],
                ['label' => 'มาก', 'score' => 4],
                ['label' => 'ปานกลาง', 'score' => 3],
                ['label' => 'น้อย', 'score' => 2],
                ['label' => 'น้อยที่สุด', 'score' => 1],
            ] as $option) {
                $question->options()->create($option);
            }
        }
    }
}
