<?php

namespace App\Enums;

enum UserType: string
{
    case Internal = 'internal';
    case External = 'external';

    // สำหรับแสดงชื่อไทย
    public function label(): string
    {
        return match ($this) {
            self::Internal => __('บุคลากรภายใน'),
            self::External => __('บุคลากรภายนอก'),
        };
    }

    // สำหรับ dropdown หรือ UI อื่น ๆ
    public static function labels(): array
    {
        return [
            self::Internal->value => self::Internal->label(),
            self::External->value => self::External->label(),
        ];
    }

    // สำหรับดึงค่าทั้งหมด (array ของค่าจริง)
    public static function values(): array
    {
        return array_map(fn($case) => $case->value, self::cases());
    }

    // แปลงจาก label → enum (เผื่อใช้งาน UI กลับค่าที่เลือกมา)
    public static function fromLabel(string $label): ?self
    {
        foreach (self::cases() as $case) {
            if ($case->label() === $label) {
                return $case;
            }
        }
        return null;
    }
}
