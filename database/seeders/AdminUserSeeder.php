<?php
namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        AdminUser::create([
            'name' => 'Super Administrator',
            'email' => 'admin@mwa.co.th',
            'password' => Hash::make('Mwa@2024!'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        AdminUser::create([
            'name' => 'System Administrator',
            'email' => 'system@mwa.co.th',
            'password' => Hash::make('System@2024!'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        AdminUser::create([
            'name' => 'Report Viewer',
            'email' => 'viewer@mwa.co.th',
            'password' => Hash::make('Viewer@2024!'),
            'role' => 'viewer',
            'is_active' => true,
        ]);
    }
}