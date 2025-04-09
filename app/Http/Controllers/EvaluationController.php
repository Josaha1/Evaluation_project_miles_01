<?php
namespace App\Http\Controllers;

use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\Question;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EvaluationController extends Controller
{
    public function index()
    {
        return Inertia::render('AdminEvaluationManager', [
            'evaluations' => Evaluation::with([
                'sections.userTypes',
                'aspects.sections.userTypes',
                'questions.aspects.sections.userTypes',
            ])->get(),
        ]);
    }

    public function create(Request $request)
    {
        $userType = $request->input('user_type');

        $sections = Section::with('userTypes')
            ->whereHas('userTypes', fn($q) => $q->where('user_type', $userType))
            ->get();

        $aspects = Aspect::with(['sections.userTypes'])
            ->whereHas('sections.userTypes', fn($q) => $q->where('user_type', $userType))
            ->get();

        $questions = Question::with(['aspects.sections.userTypes'])
            ->whereHas('aspects.sections.userTypes', fn($q) => $q->where('user_type', $userType))
            ->get();

        return Inertia::render('AdminEvaluationCreate', [
            'userType'     => $userType,
            'sections'     => $sections,
            'aspects'      => $aspects,
            'questions'    => $questions,
            'allUserTypes' => ['internal', 'external'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'user_type'    => 'required|string|in:internal,external',
            'grade_min'    => 'required|integer|min:1',
            'grade_max'    => 'required|integer|min:1|gte:grade_min',
            'section_ids'  => 'array',
            'aspect_ids'   => 'array',
            'question_ids' => 'array',
        ]);

        $evaluation = Evaluation::create([
            'title'       => $validated['title'],
            'description' => $validated['description'],
            'user_type'   => $validated['user_type'],
            'grade_min'   => $validated['grade_min'],
            'grade_max'   => $validated['grade_max'],
        ]);

        $evaluation->sections()->sync($validated['section_ids'] ?? []);
        $evaluation->aspects()->sync($validated['aspect_ids'] ?? []);
        $evaluation->questions()->sync($validated['question_ids'] ?? []);

        return redirect()->route('evaluations.index')->with('success', 'สร้างแบบประเมินเรียบร้อย!');
    }

    public function edit(Evaluation $evaluation)
    {
        $userType = $evaluation->user_type;

        $sections  = Section::whereHas('userTypes', fn($q) => $q->where('user_type', $userType))->get();
        $aspects   = Aspect::whereHas('sections.userTypes', fn($q) => $q->where('user_type', $userType))->get();
        $questions = Question::whereHas('aspects.sections.userTypes', fn($q) => $q->where('user_type', $userType))->get();

        $evaluation->load(['sections', 'aspects', 'questions']);

        return Inertia::render('AdminEvaluationEdit', [
            'evaluation' => $evaluation,
            'sections'   => $sections,
            'aspects'    => $aspects,
            'questions'  => $questions,
        ]);
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'grade_min'    => 'required|integer|min:1',
            'grade_max'    => 'required|integer|min:1|gte:grade_min',
            'section_ids'  => 'array',
            'aspect_ids'   => 'array',
            'question_ids' => 'array',
        ]);

        $evaluation->update([
            'title'       => $validated['title'],
            'description' => $validated['description'],
            'grade_min'   => $validated['grade_min'],
            'grade_max'   => $validated['grade_max'],
        ]);

        $evaluation->sections()->sync($validated['section_ids'] ?? []);
        $evaluation->aspects()->sync($validated['aspect_ids'] ?? []);
        $evaluation->questions()->sync($validated['question_ids'] ?? []);

        return redirect()->route('evaluations.index')->with('success', 'อัปเดตแบบประเมินเรียบร้อย!');
    }

    public function destroy(Evaluation $evaluation)
    {
        $evaluation->sections()->detach();
        $evaluation->aspects()->detach();
        $evaluation->questions()->detach();
        $evaluation->delete();

        return redirect()->route('evaluations.index')->with('success', 'ลบแบบประเมินเรียบร้อยแล้ว!');
    }

    public function show(EvaluationAssignment $assignment)
    {
        $this->authorize('view', $assignment);

        $evaluation = $assignment->evaluation()->with(['sections.questions'])->first();

        return Inertia::render('EvaluationShow', [
            'evaluation' => $evaluation,
            'assignment' => $assignment,
        ]);
    }
}
