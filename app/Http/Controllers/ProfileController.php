<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Divisions;
use App\Models\Departments;
use App\Models\Position;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        return Inertia::render('Profile'); // หรือหน้าที่เหมาะสม
    }
    public function edit()
    {
        $user = Auth::user();

        return inertia('ProfileEditPage', [
            'user' => $user,
            'divisions' => Divisions::all(),
            'departments' => Departments::all(),
            'positions' => Position::all(),
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $data = $request->validate([
            'prename' => 'required|string|max:255',
            'fname' => 'required|string|max:255',
            'lname' => 'required|string|max:255',
            'sex' => 'nullable|string',
            'position_id' => 'nullable|exists:positions,id',
            'department_id' => 'nullable|exists:departments,id',
            'division_id' => 'nullable|exists:divisions,id',
            'grade' => 'nullable|numeric',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            if ($user->photo && Storage::disk('public')->exists($user->photo)) {
                Storage::disk('public')->delete($user->photo);
            }

            $data['photo'] = $request->file('photo')->store('images/users', 'public');
        }

        $user->update($data);

        return redirect()->route('profile.edit')->with('success', 'อัปเดตโปรไฟล์เรียบร้อยแล้ว');
    }

}
