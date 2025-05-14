import React from "react";
import { Link } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import { Button } from "@/Components/ui/button";

export default function Unauthorized() {
    return (
        <MainLayout title="ไม่อนุญาตให้เข้าถึง">
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
                <div className="text-6xl font-bold text-red-500 mb-4">
                    🚫 403
                </div>
                <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-2">
                    คุณไม่มีสิทธิ์เข้าถึงหน้านี้
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    กรุณาติดต่อผู้ดูแลระบบ หากคิดว่าคุณควรมีสิทธิ์เข้าถึง
                </p>
                <Button onClick={() => window.history.back()}>
                    ⬅️ ย้อนกลับหน้าก่อน
                </Button>
            </div>
        </MainLayout>
    );
}
