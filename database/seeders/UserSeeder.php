<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $positions = [
            'เจ้าหน้าที่บริหารงานทั่วไป',
            'นักวิชาการคอมพิวเตอร์',
            'เจ้าหน้าที่การเงินและบัญชี',
            'นักวิชาการพัสดุ',
            'เจ้าหน้าที่ประชาสัมพันธ์',
            'วิศวกรโยธา',
            'วิศวกรเครื่องกล',
            'เจ้าหน้าที่ธุรการ',
            'ผู้ช่วยผู้อำนวยการ',
        ];

        $organizes = [
            'สายงานผู้ว่าการ',
            'สายงานบริหารกลาง',
            'สายงานก่อสร้าง',
            'สายงานวิศวกรรม',
            'สายงานบัญชีและการเงิน',
            'สายงานบริการประชาชน',
        ];

        $prenames = ['นาย', 'นางสาว', 'นาง'];
        $sexes = ['ชาย', 'หญิง'];

        $fixedUsers = [
            [
                'emid'       => '350101',
                'prename'    => 'นางสาว',
                'fname'      => 'ปคุณดา',
                'lname'      => 'ชั้นบุญ',
                'sex'        => 'หญิง',
                'position'   => 'ผู้ช่วยผู้อำนวยการ',
                'grade'      => '11',
                'organize'   => 'สายงานผู้ว่าการ',
                'password'   => Hash::make('13112541'),
                'birthdate'  => '1951-10-02',
                'photo'      => null,
                'role'       => 'admin',
                'user_type'  => 'internal',
            ],
            [
                'emid'       => '000000',
                'prename'    => 'นาย',
                'fname'      => 'อัฏฐพล',
                'lname'      => 'นิติสุพรทวีทรัพย์',
                'sex'        => 'ชาย',
                'position'   => 'ผู้ช่วยผู้อำนวยการ',
                'grade'      => '11',
                'organize'   => 'สายงานผู้ว่าการ',
                'password'   => Hash::make('13112541'),
                'birthdate'  => '1979-09-20',
                'photo'      => null,
                'role'       => 'user',
                'user_type'  => 'internal',
            ],
        ];

        foreach ($fixedUsers as $user) {
            User::create($user);
        }

        // สร้าง User ปลอม 198 คน พร้อม avatar
        for ($i = 1; $i <= 198; $i++) {
            $sex = $sexes[array_rand($sexes)];
            $prename = $sex === 'ชาย' ? 'นาย' : (rand(0, 1) ? 'นางสาว' : 'นาง');
            $fname = fake('th_TH')->firstName();
            $lname = fake('th_TH')->lastName();
            $grade = rand(5, 12);

            // ใช้ API pravatar สร้างรูปจำลอง
            $photoUrl = 'https://i.pravatar.cc/150?img=' . rand(1, 70);

            User::create([
                'emid'       => str_pad(350200 + $i, 6, '0', STR_PAD_LEFT),
                'prename'    => $prename,
                'fname'      => $fname,
                'lname'      => $lname,
                'sex'        => $sex,
                'position'   => $positions[array_rand($positions)],
                'grade'      => $grade,
                'organize'   => $organizes[array_rand($organizes)],
                'password'   => Hash::make('password123'),
                'birthdate'  => fake()->dateTimeBetween('-60 years', '-25 years')->format('Y-m-d'),
                'photo'      => $photoUrl, // ✨ มีรูป avatar เลย
                'role'       => 'user',
                'user_type'  => 'internal',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
