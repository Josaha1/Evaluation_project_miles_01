<?php
namespace App\Http\Controllers;

use App\Models\Departments;
use App\Models\Divisions;
use App\Models\Factions;
use App\Models\Position;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
            Log::error('❌ ไม่สามารถสร้างตำแหน่งได้', ['error' => $e->getMessage()]);
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
                'success'      => 'สร้างหน่วยงานใหม่สำเร็จ',
                'newFactionId' => $faction->id,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ ไม่สามารถสร้างตำแหน่งได้', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['error' => 'ไม่สามารถเพิ่มหน่วยงานได้: ' . $e->getMessage()]);
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
            'faction'     => Factions::all(),
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

        ]);

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

        return redirect()->back()->with('success', 'ลบความสัมพันธ์เรียบร้อยแล้ว');
    }
}
