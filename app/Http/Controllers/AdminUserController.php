<?php
namespace App\Http\Controllers;

use App\Models\Departments;
use App\Models\Divisions;
use App\Models\Factions;
use App\Models\Position;
use App\Models\User;
use App\Services\UserImportService;
use App\Services\UserReconciliationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = User::with(['position', 'department', 'faction', 'division']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('fname', 'like', "%$search%")
                    ->orWhere('lname', 'like', "%$search%")
                    ->orWhere('emid', 'like', "%$search%");
            });
        }

        $users = $query->orderBy('id', 'desc')->paginate(5)->withQueryString();

        return Inertia::render('AdminUserManager', [
            'users'   => $users,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminUserForm', [
            'mode'        => 'create',
            'divisions'   => Divisions::all(),
            'departments' => Departments::all(),
            'factions'    => Factions::all(),
            'position'    => Position::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'emid'          => 'nullable|unique:users,emid',
            'prename'       => 'required',
            'fname'         => 'required',
            'lname'         => 'required',
            'sex'           => 'required',
            'position_id'   => 'required|exists:positions,id',
            'department_id' => 'required|exists:departments,id',
            'faction_id'    => 'required|exists:factions,id',
            'division_id'   => 'required|exists:divisions,id',
            'grade'         => 'required',
            'birthdate'     => 'required|date',
            'user_type'     => 'required|in:internal,external',
            'role'          => 'required|in:user,admin',
            'password'      => 'nullable|string|min:6',
        ]);

        // ✅ รหัสผ่านจากวันเกิดถ้าไม่กรอก
        if (! $request->filled('password')) {
            try {
                $date                  = \Carbon\Carbon::parse($validated['birthdate']);
                $thaiYear              = $date->year + 543;
                $password              = $date->format('dm') . $thaiYear;
                $validated['password'] = Hash::make($password);
            } catch (\Exception $e) {
                return redirect()->back()->withErrors(['birthdate' => 'รูปแบบวันเกิดไม่ถูกต้อง']);
            }
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        // ✅ กรณี user_type == external → generate EMID
        if ($validated['user_type'] === 'external') {
            $prefix     = 'E';
            $divisionId = str_pad($validated['division_id'], 2, '0', STR_PAD_LEFT);
            $last       = User::where('user_type', 'external')
                ->where('emid', 'like', "{$prefix}{$divisionId}%")
                ->orderByDesc('emid')
                ->first();
            $lastNumber        = $last ? intval(substr($last->emid, 3)) : 0;
            $nextNumber        = $lastNumber + 1;
            $validated['emid'] = "{$prefix}{$divisionId}" . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        }

        // ✅ กรณี internal → ต้องกรอก emid เอง และ validate 6 หลัก
        if ($validated['user_type'] === 'internal') {
            if (! $validated['emid']) {
                return redirect()->back()->withErrors(['emid' => 'กรุณาระบุรหัสพนักงาน 6 หลักสำหรับบุคคลภายใน']);
            }

            if (! preg_match('/^\d{6}$/', $validated['emid'])) {
                return redirect()->back()->withErrors(['emid' => 'รหัสพนักงานภายในต้องเป็นตัวเลข 6 หลัก']);
            }

            if (User::where('emid', $validated['emid'])->exists()) {
                return redirect()->back()->withErrors(['emid' => 'รหัสพนักงานนี้ถูกใช้งานแล้ว']);
            }
        }

        try {
            User::create($validated);
            return redirect()->route('admin.users.index')->with('success', 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว');
        } catch (\Exception $e) {
            Log::error('❌ ไม่สามารถสร้างผู้ใช้ได้', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
        }
    }

    public function edit(User $user)
    {
        $user->load(['position', 'department', 'faction', 'division']);
        return Inertia::render('AdminUserForm', [
            'mode'        => 'edit',
            'user'        => [
                 ...$user->toArray(),
                'division_id'   => (string) ($user->division_id ?? optional($user->division)->id),
                'department_id' => (string) ($user->department_id ?? optional($user->department)->id),
                'faction_id'    => (string) ($user->faction_id ?? optional($user->faction)->id),
                'position_id'   => (string) ($user->position_id ?? optional($user->position)->id),
            ],
            'divisions'   => Divisions::all(),
            'departments' => Departments::all(),
            'position'    => Position::all(),
            'factions'    => Factions::all(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'prename'       => 'required',
            'fname'         => 'required',
            'lname'         => 'required',
            'sex'           => 'required',
            'position_id'   => 'required|exists:positions,id',
            'department_id' => 'required|exists:departments,id',
            'faction_id'    => 'required|exists:factions,id',
            'division_id'   => 'required|exists:divisions,id',
            'grade'         => 'required',
            'user_type'     => 'required|in:internal,external',
            'role'          => 'required|in:user,admin',
            'password'      => 'nullable|string|min:6',
        ]);

        // จัดการรหัสผ่าน
        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')->with('success', 'แก้ไขผู้ใช้งานเรียบร้อยแล้ว');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->back()->with('success', 'ลบผู้ใช้เรียบร้อยแล้ว');
    }

    // ========================================
    // Helper Methods สำหรับสร้างข้อมูลใหม่
    // ========================================

    // ========================================
    // Excel Import (รายชื่อพนักงานใหม่)
    // ========================================

    public function showImport()
    {
        return Inertia::render('AdminUserImport', [
            'divisions'   => Divisions::orderBy('name')->get(['id', 'name']),
            'departments' => Departments::orderBy('name')->get(['id', 'name']),
            'factions'    => Factions::orderBy('name')->get(['id', 'name']),
            'positions'   => Position::orderBy('title')->get(['id', 'title']),
        ]);
    }

    public function previewImport(Request $request, UserImportService $service)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        ini_set('memory_limit', '512M');
        set_time_limit(120);

        try {
            $rows = $service->parseFile($request->file('file')->getPathname());
            $preview = $service->buildPreview($rows);
            return response()->json($preview);
        } catch (\Throwable $e) {
            Log::error('UserImport preview failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'อ่านไฟล์ไม่สำเร็จ: ' . $e->getMessage()], 422);
        }
    }

    public function executeImport(Request $request, UserImportService $service)
    {
        $request->validate([
            'rows'     => 'required|array',
            'mappings' => 'nullable|array',
        ]);

        ini_set('memory_limit', '512M');
        set_time_limit(180);

        try {
            $result = $service->execute($request->input('rows'), $request->input('mappings', []));
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('UserImport execute failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'นำเข้าไม่สำเร็จ: ' . $e->getMessage()], 500);
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // User Data Reconciliation (QT-2569-004)
    // ──────────────────────────────────────────────────────────────────

    public function showReconcile()
    {
        return Inertia::render('AdminUserReconcile', [
            'lookups' => [
                'divisions'   => Divisions::orderBy('name')->get(['id', 'name']),
                'departments' => Departments::orderBy('name')->get(['id', 'name']),
                'factions'    => Factions::orderBy('name')->get(['id', 'name']),
                'positions'   => Position::orderBy('title')->get(['id', 'title']),
            ],
        ]);
    }

    public function previewReconcile(Request $request, UserReconciliationService $service)
    {
        $request->validate([
            'files'   => 'required|array|min:1',
            'files.*' => 'file|mimes:xlsx,xls',
        ]);

        ini_set('memory_limit', '512M');
        set_time_limit(180);

        try {
            $paths = collect($request->file('files'))->map->getPathname()->all();
            $excelRows = $service->parseMany($paths);
            $result = $service->diffAgainstDb($excelRows);
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('UserReconcile preview failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'อ่านไฟล์ไม่สำเร็จ: ' . $e->getMessage()], 422);
        }
    }

    public function executeReconcile(Request $request, UserReconciliationService $service)
    {
        $request->validate([
            'diffs'                          => 'required|array',
            'approvals'                      => 'required|array',
            'approvals.*.user_id'            => 'required|integer|exists:users,id',
            'approvals.*.fields'             => 'required|array|min:1',
            'approvals.*.fields.*'           => 'string',
            'blocked_actions'                => 'nullable|array',
            'blocked_actions.*.user_id'      => 'required_with:blocked_actions|integer|exists:users,id',
            'blocked_actions.*.field'        => 'required_with:blocked_actions|string',
            'blocked_actions.*.action'       => 'required_with:blocked_actions|in:create,map,skip',
            'blocked_actions.*.excel_value'  => 'nullable|string',
            'blocked_actions.*.target_id'    => 'nullable|integer',
        ]);

        ini_set('memory_limit', '512M');
        set_time_limit(180);

        try {
            $result = $service->applyChanges(
                $request->input('diffs'),
                $request->input('approvals'),
                $request->input('blocked_actions', [])
            );
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('UserReconcile execute failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'อัปเดตไม่สำเร็จ: ' . $e->getMessage()], 500);
        }
    }

    public function rollbackReconcile(Request $request, UserReconciliationService $service)
    {
        $request->validate([
            'batch_id' => 'required|uuid|exists:user_change_logs,batch_id',
        ]);

        try {
            $result = $service->rollback($request->input('batch_id'));
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('UserReconcile rollback failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'ย้อนกลับไม่สำเร็จ: ' . $e->getMessage()], 500);
        }
    }

    public function storeDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        try {
            $department = Departments::firstOrCreate([
                'name' => $validated['name'],
            ]);

            return redirect()->back()->with([
                'success'         => 'สร้างหน่วยงานใหม่สำเร็จ',
                'newDepartmentId' => $department->id,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ ไม่สามารถสร้างหน่วยงานได้', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['error' => 'ไม่สามารถเพิ่มหน่วยงานได้: ' . $e->getMessage()]);
        }
    }

    public function storeFaction(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        try {
            $faction = Factions::firstOrCreate([
                'name' => $validated['name'],
            ]);

            return redirect()->back()->with([
                'success'      => 'สร้างฝ่ายใหม่สำเร็จ',
                'newFactionId' => $faction->id,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ ไม่สามารถสร้างฝ่ายได้', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['error' => 'ไม่สามารถเพิ่มฝ่ายได้: ' . $e->getMessage()]);
        }
    }

    public function storePosition(Request $request)
    {
        Log::info('📥 กำลังสร้างตำแหน่งใหม่', $request->all());
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        try {
            $position = Position::firstOrCreate([
                'title' => $validated['title'],
            ]);
            Log::info('✅ สร้างตำแหน่งสำเร็จ', ['id' => $position->id]);
            return redirect()->back()->with([
                'message'       => 'สร้างตำแหน่งใหม่สำเร็จ',
                'newPositionId' => $position->id,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ ไม่สามารถสร้างตำแหน่งได้', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['error' => 'ไม่สามารถเพิ่มตำแหน่งได้: ' . $e->getMessage()]);
        }
    }
}
