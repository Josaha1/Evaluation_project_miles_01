<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $data = $request->validate([
            'prename'  => 'required|string|max:255',
            'fname'    => 'required|string|max:255',
            'lname'    => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'grade'    => 'nullable|numeric',
            'photo'    => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
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
