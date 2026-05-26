<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * แสดงหน้าล็อกอินของ Admin
     */
    public function showLogin(): Response
    {
        return Inertia::render('Admin/Auth/Login');
    }

    /**
     * ดำเนินการล็อกอิน
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // พยายามล็อกอินผ่าน guard:admin (config/auth.php ต้องกำหนด guard admin ไว้แล้ว)
        if (!Auth::guard('admin')->attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['Email หรือรหัสผ่าน ไม่ถูกต้อง'],
            ]);
        }

        // ถ้าล็อกอินสำเร็จ เรียก $request->session()->regenerate()
        $request->session()->regenerate();

        // เก็บ last_login_at
        /** @var AdminUser $user */
        $user = Auth::guard('admin')->user();
        $user->last_login_at = now();
        $user->save();

        return redirect()->route('admin.dashboard');
    }

    /**
     * ดำเนินการล็อกเอาต์
     */
    public function logout(Request $request)
    {
        Auth::guard('admin')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    /**
     * แสดงหน้าโปรไฟล์ของ Admin (สำหรับแก้ไข)
     */
    public function profile(): Response
    {
        /** @var AdminUser $user */
        $user = Auth::guard('admin')->user();

        return Inertia::render('Admin/Auth/Profile', [
            'user' => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'role'           => $user->role,
                'is_active'      => $user->is_active,
                'last_login_at'  => $user->last_login_at,
            ],
        ]);
    }

    /**
     * อัปเดตข้อมูลโปรไฟล์ (เฉพาะ name, email, password)
     */
    public function updateProfile(Request $request)
    {
        /** @var AdminUser $user */
        $user = Auth::guard('admin')->user();

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:admin_users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $user->name = $data['name'];
        $user->email = $data['email'];

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return redirect()->route('admin.profile')->with('success', 'อัปเดตโปรไฟล์เรียบร้อยแล้ว');
    }
}
