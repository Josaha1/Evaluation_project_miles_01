import MainLayout from "@/Layouts/MainLayout";
import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";

export default function CookiePolicy() {
    return (
        <MainLayout>
            <Head title="นโยบายการใช้คุกกี้" />
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <Card className="p-6">
                    <h1 className="text-2xl font-bold mb-4">
                        นโยบายการใช้คุกกี้ (Cookie Policy)
                    </h1>

                    <p className="mb-4">
                        เว็บไซต์ของเราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งานของคุณ
                        คุกกี้คือไฟล์ขนาดเล็กที่เก็บไว้ในอุปกรณ์ของคุณ
                        เพื่อช่วยให้เว็บไซต์จดจำข้อมูลเกี่ยวกับการเยี่ยมชมของคุณในครั้งถัดไป
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-2">
                        ประเภทของคุกกี้ที่เราใช้
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>
                                คุกกี้ที่จำเป็น (Strictly Necessary Cookies):
                            </strong>{" "}
                            จำเป็นต่อการทำงานของเว็บไซต์
                        </li>
                        <li>
                            <strong>
                                คุกกี้เพื่อการวิเคราะห์ (Analytics Cookies):
                            </strong>{" "}
                            ใช้เพื่อวิเคราะห์การใช้งานเว็บไซต์และปรับปรุงเนื้อหา
                        </li>
                    
                    </ul>

                    <h2 className="text-xl font-semibold mt-6 mb-2">
                        การจัดการคุกกี้
                    </h2>
                    <p>
                        คุณสามารถจัดการหรือลบคุกกี้ได้ตามต้องการผ่านการตั้งค่าในเบราว์เซอร์ของคุณ
                        หากคุณเลือกที่จะปฏิเสธคุกกี้บางประเภท
                        อาจทำให้การทำงานของเว็บไซต์ไม่สมบูรณ์
                    </p>

                   
                </Card>
            </div>
        </MainLayout>
    );
}
