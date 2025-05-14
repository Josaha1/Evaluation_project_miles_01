<?php

namespace Database\Seeders;

use App\Models\Positions;
use App\Models\Departments;
use App\Models\Divisions;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $positions   = Positions::all();
        $departments = Departments::all();
        $divisions   = Divisions::all();

        // สำหรับนับรัน emid ภายนอกราย division
        $externalCountPerDivision = [];

        // ใส่ 2 คนพิเศษก่อน
        $fixedUsers = [
            [
                'emid'      => '350101',
                'prename'   => 'นางสาว',
                'fname'     => 'ปคุณดา',
                'lname'     => 'ชั้นบุญ',
                'sex'       => 'หญิง',
                'birthdate' => '1951-10-02',
                'password'  => Hash::make('13112541'),
                'role'      => 'admin',
                'user_type' => 'internal',
            ],
            [
                'emid'      => '000000',
                'prename'   => 'นาย',
                'fname'     => 'อัฏฐพล',
                'lname'     => 'นิติสุพรทวีทรัพย์',
                'sex'       => 'ชาย',
                'birthdate' => '1979-09-20',
                'password'  => Hash::make('13112541'),
                'role'      => 'user',
                'user_type' => 'internal',
            ],
        ];

        foreach ($fixedUsers as $userData) {
            $position = $positions->random();
            $department = $departments->random();
            $division = $divisions->random();

            User::create([
                ...$userData,
                'position_id'   => $position->id,
                'department_id' => $department->id,
                'division_id'   => $division->id,
                'grade'         => random_int(5, 12),
                'photo'         => 'https://i.pravatar.cc/150?img=' . rand(1, 70),
            ]);
        }

        // Random อีก 198 คน
        for ($i = 1; $i <= 198; $i++) {
            $position   = $positions->random();
            $department = $departments->random();
            $division   = $divisions->random();
            $sex        = fake()->randomElement(['ชาย', 'หญิง']);
            $prename    = $sex === 'ชาย' ? 'นาย' : fake()->randomElement(['นางสาว', 'นาง']);
            $userType   = fake()->randomElement(['internal', 'external']);

            // กำหนด emid
            if ($userType === 'internal') {
                $emid = str_pad($i + 100000, 6, '0', STR_PAD_LEFT);
            } else {
                $externalCountPerDivision[$division->id] = ($externalCountPerDivision[$division->id] ?? 0) + 1;
                $run = $externalCountPerDivision[$division->id];
                $emid = 'E' . str_pad($division->id, 2, '0', STR_PAD_LEFT) . str_pad($run, 3, '0', STR_PAD_LEFT);
            }

            User::create([
                'emid'          => $emid,
                'prename'       => $prename,
                'fname'         => fake()->firstName($sex === 'ชาย' ? 'male' : 'female'),
                'lname'         => fake()->lastName(),
                'sex'           => $sex,
                'position_id'   => $position->id,
                'department_id' => $department->id,
                'division_id'   => $division->id,
                'grade'         => random_int(5, 12),
                'birthdate'     => fake()->date('Y-m-d', '-25 years'),
                'password'      => Hash::make('password123'),
                'photo'         => 'https://i.pravatar.cc/150?img=' . rand(1, 70),
                'role'          => fake()->randomElement(['user', 'admin']),
                'user_type'     => $userType,
            ]);
        }
    }
}
