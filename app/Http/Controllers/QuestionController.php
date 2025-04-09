<?php
namespace App\Http\Controllers;

use App\Models\Aspect;
use App\Models\Question;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuestionController extends Controller
{
    // QuestionController.php
    public function index()
    {
        $questions = Question::with(['aspects.sections.userTypes', 'options'])->get();
        $aspects   = Aspect::with('sections.userTypes')->get();
        $sections  = Section::with('userTypes')->get();

        return Inertia::render('AdminQuestionManager', [
            'questions' => $questions,
            'aspects'   => $aspects,
            'sections'  => $sections,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateForm($request);

        $question = Question::create([
            'title' => $validated['title'],
            'type'  => $validated['type'],
        ]);

        $question->aspects()->sync($validated['aspect_ids']);

        if (in_array($validated['type'], ['rating', 'multiple_choice']) && isset($validated['options'])) {
            $question->options()->createMany($validated['options']);
        }
        return redirect()->route('adminquestionmanager')->with('success', 'เพิ่มคำถามเรียบร้อยแล้ว!');
    }

    public function update(Request $request, Question $question)
    {
        $validated = $this->validateForm($request);

        $question->update([
            'title' => $validated['title'],
            'type'  => $validated['type'],
        ]);

        $question->aspects()->sync($validated['aspect_ids']);

        if (in_array($validated['type'], ['rating', 'multiple_choice'])) {
            $question->options()->delete();
            $question->options()->createMany($validated['options']);
        }

        return redirect()->route('adminquestionmanager')->with('success', 'อัปเดตคำถามเรียบร้อยแล้ว!');
    }

    public function destroy(Question $question)
    {
        $question->aspects()->detach();
        $question->options()->delete();
        $question->delete();

        return redirect()->back()->with('success', 'ลบคำถามเรียบร้อยแล้ว!');
    }

    private function validateForm(Request $request): array
    {
        $rules = [
            'title'        => ['required', 'string'],
            'type'         => ['required', 'in:rating,open_text,multiple_choice'],
            'aspect_ids'   => ['required', 'array'],
            'aspect_ids.*' => ['integer'],
        ];

        // ถ้ามีตัวเลือก
        if (in_array($request->type, ['rating', 'multiple_choice'])) {
            $rules['options']         = ['required', 'array', 'min:1'];
            $rules['options.*.label'] = ['required', 'string'];
            $rules['options.*.score'] = ['nullable', 'integer'];
        }

        return $request->validate($rules);
    }
}
