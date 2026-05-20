<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * แสดงรายชื่อผู้ใช้งาน (AdminUser) ทั้งหมด
     */
    public function index(Request $request): Response
    {
        $perPage = $request->input('perpage', 20);
        $query = AdminUser::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(fn($q) => 
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            );
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($u) => [
                'id'            => $u->id,
                'name'          => $u->name,
                'email'         => $u->email,
                'role'          => $u->role,
                'is_active'     => $u->is_active,
                'last_login_at' => optional($u->last_login_at)->format('Y-m-d H:i'),
                'created_at'    => $u->created_at->format('Y-m-d'),
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'filters' => $request->only(['search', 'perpage']),
        ]);
    }

    /**
     * แสดงฟอร์มสร้างผู้ใช้งานใหม่
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Users/Create', [
            'roles' => ['super_admin', 'admin', 'viewer'],
        ]);
    }

    /**
     * บันทึกผู้ใช้งานใหม่
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:admin_users,email',
            'password' => 'required|string|min:8|confirmed',
            'role'     => ['required', Rule::in(['super_admin','admin','viewer'])],
            'is_active'=> 'boolean',
        ]);

        AdminUser::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'is_active'=> $data['is_active'] ?? true,
        ]);

        return redirect()->route('admin.users.index')
            ->with('success', 'สร้างผู้ใช้งานใหม่เรียบร้อยแล้ว');
    }

    /**
     * แสดงรายละเอียดผู้ใช้ (View) หรือฟอร์มแก้ไข (Edit)
     */
    public function show(AdminUser $user): Response
    {
        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'is_active'    => $user->is_active,
                'last_login_at'=> optional($user->last_login_at)->format('Y-m-d H:i'),
                'created_at'   => $user->created_at->format('Y-m-d'),
                'updated_at'   => $user->updated_at->format('Y-m-d'),
            ],
            'roles' => ['super_admin', 'admin', 'viewer'],
        ]);
    }

    /**
     * แสดงฟอร์มแก้ไขผู้ใช้งาน
     */
    public function edit(AdminUser $user): Response
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'is_active'    => $user->is_active,
            ],
            'roles' => ['super_admin', 'admin', 'viewer'],
        ]);
    }

    /**
     * อัปเดตข้อมูลผู้ใช้งาน
     */
    public function update(Request $request, AdminUser $user)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required','email',Rule::unique('admin_users','email')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role'     => ['required', Rule::in(['super_admin','admin','viewer'])],
            'is_active'=> 'boolean',
        ]);

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->role = $data['role'];
        $user->is_active = $data['is_active'] ?? true;

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return redirect()->route('admin.users.index')
            ->with('success', 'อัปเดตผู้ใช้งานเรียบร้อยแล้ว');
    }

    /**
     * ลบผู้ใช้งาน
     */
    public function destroy(AdminUser $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'ลบผู้ใช้งานเรียบร้อยแล้ว');
    }

    /**
     * สลับสถานะ active/inactive ของผู้ใช้งาน (Ajax หรือ form POST)
     */
    public function toggleActive(AdminUser $user)
    {
        $user->is_active = !$user->is_active;
        $user->save();

        return redirect()->route('admin.users.index')
            ->with('success', 'สลับสถานะผู้ใช้งานเรียบร้อยแล้ว');
    }
}
