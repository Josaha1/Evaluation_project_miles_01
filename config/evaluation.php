<?php

return [
    // deadline ปิดระบบประเมิน (ISO 8601 หรือ Y-m-d H:i:s)
    // null หรือว่าง = ไม่มี deadline (ระบบเปิดตลอด)
    // ถ้า now >= deadline → user (internal) + external ถูก block, admin ผ่าน
    'deadline' => env('EVALUATION_DEADLINE'),
];
