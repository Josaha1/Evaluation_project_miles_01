<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = collect([
            [
                'emid' => '325412',
                'prename' => 'นาย',
                'fname' => 'Fnameทดสอบ1',
                'lname' => 'lnameทดสอบ1',
                'sex' => 'ชาย',
                'position' => 'ผู้ช่วยผู้ว่าการ',
                'grade' => 11,
                'organize' => 'สายงานผู้ว่าการ',
                'password' => bcrypt('13052541'),
                'birthdate' => '1998-11-13',
                'photo' => 'https://randomuser.me/api/portraits/men/9.jpg',
                'created_at' => now()
            ],
            [
                'emid' => '541265',
                'prename' => 'นาย',
                'fname' => 'Fnameทดสอบ2',
                'lname' => 'lnameทดสอบ2',
                'sex' => 'ชาย',
                'position' => 'เลขานุการ',
                'grade' => 8,
                'organize' => 'สายงานผู้ว่าการ',
                'password' => bcrypt('14052532'),
                'birthdate' => '1989-05-14',
                'photo' => 'https://randomuser.me/api/portraits/men/8.jpg',
                'created_at' => now()
            ],
        ]);

        $users->each(function ($user){
            User::insert($user);
        });
    }
}
