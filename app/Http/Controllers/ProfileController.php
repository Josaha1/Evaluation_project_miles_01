<?php
namespace App\Http\Controllers;

use App\Models\Departments;
use App\Models\Divisions;
use App\Models\Factions;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        return Inertia::render('Profile');
    }

    public function edit()
    {
        $user = Auth::user();
        $user->load(['division', 'department', 'faction', 'position']);

        return Inertia::render('ProfileEditPage', [
            'divisions'   => Divisions::all(),
            'departments' => Departments::all(),
            'factions'    => Factions::all(),
            'positions'   => Position::all(),
            'user'        => [
                 ...$user->toArray(),
                'division_id'   => $user->division_id ? (string) $user->division_id : null,
                'department_id' => $user->department_id ? (string) $user->department_id : null,
                'faction_id'    => $user->faction_id ? (string) $user->faction_id : null,
                'position_id'   => $user->position_id ? (string) $user->position_id : null,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        try {
            // ทำความสะอาดข้อมูลก่อน validation
            $input = $request->all();

            // แปลง empty string เป็น null สำหรับ nullable fields เท่านั้น
            $nullableFields = ['prename', 'sex', 'division_id', 'department_id', 'faction_id', 'position_id', 'grade'];
            foreach ($nullableFields as $field) {
                if (isset($input[$field]) && $input[$field] === '') {
                    $input[$field] = null;
                }
            }

            $request->merge($input);

            // กฎการ validate
            $validationRules = [
                'prename'       => 'nullable|string|max:255',
                'fname'         => 'required|string|max:255',
                'lname'         => 'required|string|max:255',
                'sex'           => 'nullable|string|in:ชาย,หญิง',
                'division_id'   => 'nullable|exists:divisions,id',
                'department_id' => 'nullable|exists:departments,id',
                'faction_id'    => 'nullable|exists:factions,id',
                'position_id'   => 'nullable|exists:positions,id',
                'grade'         => 'nullable|numeric|min:1|max:20',
                'birthdate'     => 'nullable|date|before:today',
                'password'              => 'nullable|string|min:6',
                'password_confirmation' => 'nullable|string|same:password',
            ];

            // เพิ่ม validation สำหรับ photo เฉพาะเมื่อมีไฟล์ส่งมา
            if ($request->hasFile('photo')) {
                $validationRules['photo'] = 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048';
            }

            $validated = $request->validate($validationRules, [
                'fname.required'       => 'กรุณาระบุชื่อ',
                'lname.required'       => 'กรุณาระบุนามสกุล',
                'fname.string'         => 'ชื่อต้องเป็นข้อความ',
                'lname.string'         => 'นามสกุลต้องเป็นข้อความ',
                'fname.max'            => 'ชื่อต้องไม่เกิน 255 ตัวอักษร',
                'lname.max'            => 'นามสกุลต้องไม่เกิน 255 ตัวอักษร',
                'sex.in'               => 'เพศต้องเป็น ชาย หรือ หญิง',
                'division_id.exists'   => 'สายงานที่เลือกไม่ถูกต้อง',
                'department_id.exists' => 'หน่วยงานที่เลือกไม่ถูกต้อง',
                'faction_id.exists'    => 'ฝ่ายที่เลือกไม่ถูกต้อง',
                'position_id.exists'   => 'ตำแหน่งที่เลือกไม่ถูกต้อง',
                'grade.numeric'        => 'ระดับต้องเป็นตัวเลข',
                'grade.min'            => 'ระดับต้องมากกว่า 0',
                'grade.max'            => 'ระดับต้องไม่เกิน 20',
                'birthdate.date'       => 'รูปแบบวันเกิดไม่ถูกต้อง',
                'birthdate.before'     => 'วันเกิดต้องเป็นวันในอดีต',
                'password.min'                      => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
                'password_confirmation.same'        => 'การยืนยันรหัสผ่านไม่ตรงกัน',
                'photo.image'          => 'ไฟล์ต้องเป็นรูปภาพ',
                'photo.mimes'          => 'รูปภาพต้องเป็นไฟล์ประเภท jpeg, png, jpg, gif, webp',
                'photo.max'            => 'ขนาดไฟล์ต้องไม่เกิน 2MB',
            ]);

            // ✅ Enhanced: จัดการรูปภาพสำหรับ Shared Hosting
            if ($request->hasFile('photo')) {
                // ลบรูปเก่าถ้ามี
                $this->deleteOldPhoto($user->photo);

                // บันทึกรูปใหม่
                $photoPath          = $this->savePhotoForSharedHosting($request->file('photo'), $user->id);
                $validated['photo'] = $photoPath;

                Log::info('Profile photo updated', [
                    'user_id'    => $user->id,
                    'photo_path' => $photoPath,
                ]);
            }

            // จัดการรหัสผ่าน
            if (! empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
                Log::info('Password updated for user', ['user_id' => $user->id]);
            } else {
                unset($validated['password']);
            }

            // อัปเดตข้อมูลผู้ใช้
            $user->update($validated);

            Log::info('Profile updated successfully', [
                'user_id'        => $user->id,
                'updated_fields' => array_keys($validated),
            ]);

            return redirect()->route('profile.edit')->with('success', 'อัปเดตโปรไฟล์เรียบร้อยแล้ว');

        } catch (ValidationException $e) {
            Log::warning('Profile validation failed', [
                'user_id'    => $user->id,
                'errors'     => $e->errors(),
                'input_data' => $request->all(),
            ]);

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();

        } catch (\Exception $e) {
            Log::error('Profile update error', [
                'user_id'    => $user->id,
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
                'input_data' => $request->all(),
            ]);

            return redirect()->back()
                ->withErrors(['error' => 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์ กรุณาลองใหม่อีกครั้ง'])
                ->withInput();
        }
    }

    /**
     * Save photo for shared hosting environment
     */
    private function savePhotoForSharedHosting($photo, $userId)
    {
        $fileName = 'user_' . $userId . '_' . time() . '.' . $photo->getClientOriginalExtension();

        // สำหรับ Shared Hosting - บันทึกไปที่ public_html/storage
        $publicHtmlStoragePath = base_path('../public_html/storage/images/users');

        // สร้างโฟลเดอร์ถ้ายังไม่มี
        if (! file_exists($publicHtmlStoragePath)) {
            mkdir($publicHtmlStoragePath, 0755, true);
        }

        // ย้ายไฟล์ไปยัง public_html/storage
        $photo->move($publicHtmlStoragePath, $fileName);

        // Return path ที่เก็บใน database
        return 'images/users/' . $fileName;
    }

    /**
     * Delete old photo from both locations
     */
    private function deleteOldPhoto($photoPath)
    {
        if (! $photoPath || $photoPath === 'images/default.png') {
            return;
        }

        // ลบจาก storage/app/public (Laravel default)
        if (Storage::disk('public')->exists($photoPath)) {
            Storage::disk('public')->delete($photoPath);
        }

        // ลบจาก public_html/storage (Shared hosting)
        $publicHtmlFile = base_path('../public_html/storage/' . $photoPath);
        if (file_exists($publicHtmlFile)) {
            unlink($publicHtmlFile);
        }

        Log::info('Old photo deleted', ['photo_path' => $photoPath]);
    }

    public function show()
    {
        $user = Auth::user();
        $user->load(['division', 'department', 'faction', 'position']);

        return Inertia::render('ProfileShow', [
            'user' => $user,
        ]);
    }

    // Helper method สำหรับสร้างหน่วยงานใหม่
    public function storeDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
        ], [
            'name.required' => 'กรุณาระบุชื่อหน่วยงาน',
            'name.unique'   => 'ชื่อหน่วยงานนี้มีอยู่แล้ว',
        ]);

        try {
            $department = Departments::create([
                'name' => $validated['name'],
            ]);

            Log::info('New department created from profile', [
                'department_id' => $department->id,
                'name'          => $department->name,
                'created_by'    => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'เพิ่มหน่วยงานใหม่เรียบร้อยแล้ว');

        } catch (\Exception $e) {
            Log::error('Failed to create department from profile', [
                'error'   => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            throw ValidationException::withMessages([
                'error' => 'ไม่สามารถเพิ่มหน่วยงานได้ กรุณาลองใหม่อีกครั้ง',
            ]);
        }
    }

    // Helper method สำหรับสร้างฝ่ายใหม่
    public function storeFaction(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:factions,name',
        ], [
            'name.required' => 'กรุณาระบุชื่อฝ่าย',
            'name.unique'   => 'ชื่อฝ่ายนี้มีอยู่แล้ว',
        ]);

        try {
            $faction = Factions::create([
                'name' => $validated['name'],
            ]);

            Log::info('New faction created from profile', [
                'faction_id' => $faction->id,
                'name'       => $faction->name,
                'created_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'เพิ่มฝ่ายใหม่เรียบร้อยแล้ว');

        } catch (\Exception $e) {
            Log::error('Failed to create faction from profile', [
                'error'   => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            throw ValidationException::withMessages([
                'error' => 'ไม่สามารถเพิ่มฝ่ายได้ กรุณาลองใหม่อีกครั้ง',
            ]);
        }
    }

    // Helper method สำหรับสร้างตำแหน่งใหม่
    public function storePosition(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:positions,title',
        ], [
            'title.required' => 'กรุณาระบุชื่อตำแหน่ง',
            'title.unique'   => 'ตำแหน่งนี้มีอยู่แล้ว',
        ]);

        try {
            $position = Position::create([
                'title' => $validated['title'],
            ]);

            Log::info('New position created from profile', [
                'position_id' => $position->id,
                'title'       => $position->title,
                'created_by'  => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'เพิ่มตำแหน่งใหม่เรียบร้อยแล้ว');

        } catch (\Exception $e) {
            Log::error('Failed to create position from profile', [
                'error'   => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            throw ValidationException::withMessages([
                'error' => 'ไม่สามารถเพิ่มตำแหน่งได้ กรุณาลองใหม่อีกครั้ง',
            ]);
        }
    }
}
