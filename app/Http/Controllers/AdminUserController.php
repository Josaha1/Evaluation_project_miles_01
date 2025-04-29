<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('fname', 'like', "%$search%")
                    ->orWhere('lname', 'like', "%$search%")
                    ->orWhere('emid', 'like', "%$search%")
                    ->orWhere('organize', 'like', "%$search%");
            });
        }
        $users = $query->orderBy('id', 'desc')->paginate(5)->withQueryString();

        return Inertia::render('AdminUserManager', [
            'users'   => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminUserForm', [
            'mode' => 'create',
        ]);
    }

    public function store(Request $request)
    {

        $validated = $request->validate([
            'emid'      => 'required|digits:6|unique:users',
            'prename'   => 'required',
            'fname'     => 'required',
            'lname'     => 'required',
            'sex'       => 'required',
            'position'  => 'required',
            'grade'     => 'required',
            'organize'  => 'required',
            'birthdate' => 'required|date',
            'user_type' => 'required|in:internal,external',
            'role'      => 'required|in:user,admin',
            'password'  => 'required|min:6',
        ]);

        try {
            $validated['password'] = Hash::make($validated['password']);
            User::create($validated);

            return redirect()->route('admin.users.index')->with('success', 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
        }
    }

    public function edit(User $user)
    {
        return Inertia::render('AdminUserForm', [
            'mode' => 'edit',
            'user' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'prename'   => 'required',
            'fname'     => 'required',
            'lname'     => 'required',
            'sex'       => 'required',
            'position'  => 'required',
            'grade'     => 'required',
            'organize'  => 'required',
            'birthdate' => 'required|date',
            'user_type' => 'required|in:internal,external',
            'role'      => 'required|in:user,admin',
            'password'  => 'nullable|min:6',
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

        return redirect()->route('admin.users.index')->with('success', 'ลบผู้ใช้งานเรียบร้อยแล้ว');
    }
}
