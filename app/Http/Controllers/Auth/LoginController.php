<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
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
        $this->checkTooManyAttempts($request);

        $credentials = $request->validate([
            'emid'     => 'required|digits:6',
            'password' => 'required|digits:8',
        ]);

        $remember = $request->boolean('remember');
        $key      = $this->throttleKey($request);

        if (Auth::attempt($credentials, $remember)) {
            RateLimiter::clear($key); // reset rate limit

            $request->session()->regenerate(); // ป้องกัน session fixation
            Auth::logoutOtherDevices($request->password);

            // log การเข้าใช้งาน
            Log::info('Login successful', [
                'emid'       => $request->emid,
                'ip'         => $request->ip(),
                'user_agent' => $request->userAgent(),
                'time'       => now(),
            ]);

            // redirect ตาม role
            if (Auth::user()->role === 'admin') {
                return redirect()->route('admindashboard')->with('success', 'ยินดีต้อนรับกลับ Admin!');
            }

            return redirect()->route('dashboard')->with('success', 'ยินดีต้อนรับกลับ!');
        }

        RateLimiter::hit($key, 60); // เพิ่มความถี่ของการบล็อค (60 วินาที)

        Log::warning('Login failed', [
            'emid'       => $request->emid,
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
            'time'       => now(),
        ]);

        return back()->withErrors([
            'emid' => 'ข้อมูลไม่ถูกต้อง',
        ])->onlyInput('emid');
    }

    /**
     * ออกจากระบบ
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();      // ลบ session ทั้งหมด
        $request->session()->regenerateToken(); // สร้าง token ใหม่

        return redirect('/'); // กลับไปหน้าแรก
    }
    protected function checkTooManyAttempts(Request $request)
    {
        $key = $this->throttleKey($request);
        if (RateLimiter::tooManyAttempts($key, 5)) {
            abort(429, 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่...');
        }
    }

    /**
     * สร้าง throttle key ต่อ IP + emid
     */
    protected function throttleKey(Request $request)
    {
        return Str::lower($request->input('emid')) . '|' . $request->ip();
    }
}
