<?php
namespace App\Enums;

enum SectionTargetGroup: string {
    case Internal_9_12 = 'internal_9_12';
    case External_9_12 = 'external_9_12';
    case Internal_5_8  = 'internal_5_8';

    public function label(): string
    {
        return match ($this) {
            self::Internal_9_12 => 'บุคลากรภายในระดับ 9–12',
            self::External_9_12 => 'บุคลากรภายนอกระดับ 9–12',
            self::Internal_5_8 => 'บุคลากรภายในระดับ 5–8',
        };
    }
}
