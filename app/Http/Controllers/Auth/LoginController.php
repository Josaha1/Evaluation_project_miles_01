<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoginController extends Controller
{
    /**
     * แสดงฟอร์มเข้าสู่ระบบ
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * ดำเนินการเข้าสู่ระบบ
     */
    public function login(Request $request)
    {
        // ตรวจสอบข้อมูลที่รับมา
        $credentials = $request->validate([
            'emid' => 'required|min:6|max:6|regex:/^\d{6}$/',
            'password' => 'required|min:8|max:8|regex:/^\d{8}$/',
        ]);

        // remember me
        $remember = $request->boolean('remember');

        // ตรวจสอบข้อมูลเข้าสู่ระบบ
        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate(); // สร้าง session ใหม่
            
            Auth::logoutOtherDevices($request->password);

            // เช็ค role
            if (Auth::user()->role === 'admin') {
                return redirect()->route('admindashboard')->with('success', 'ยินดีต้อนรับกลับ Admin!');
            }

            // ถ้าไม่ใช่ admin
            return redirect()->route('dashboard')->with('success', 'ยินดีต้อนรับกลับ!');
        }

        // ถ้าไม่สำเร็จ
        return back()->withErrors([
            'emid' => 'ข้อมูลที่ระบุไม่ตรงกับบัญชีในระบบของเรา',
            'password' => 'รหัสผ่านไม่ถูกต้อง โปรดระบุให้ตรงตามแบบ'
        ])->onlyInput('emid', 'password');
    }

    /**
     * ออกจากระบบ
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate(); // ลบ session ทั้งหมด
        $request->session()->regenerateToken(); // สร้าง token ใหม่

        return redirect('/'); // กลับไปหน้าแรก
    }
} 