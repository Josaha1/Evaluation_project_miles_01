<?php
namespace App\Http\Requests;

use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

class AdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:admin_users,email,' . $userId,
            'password'  => $this->isMethod('POST') ? 'required|string|min:8' : 'nullable|string|min:8',
            'role'      => 'required|in:' . implode(',', array_keys(AdminUser::ROLES)),
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'กรุณาระบุชื่อ',
            'email.required'    => 'กรุณาระบุอีเมล',
            'email.email'       => 'รูปแบบอีเมลไม่ถูกต้อง',
            'email.unique'      => 'อีเมลนี้ถูกใช้แล้ว',
            'password.required' => 'กรุณาระบุรหัสผ่าน',
            'password.min'      => 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
            'role.required'     => 'กรุณาเลือกบทบาท',
            'role.in'           => 'บทบาทไม่ถูกต้อง',
        ];
    }
}
