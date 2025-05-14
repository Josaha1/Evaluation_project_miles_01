import React, { useEffect, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Link } from "@inertiajs/react";
import { Dialog } from "@headlessui/react";
const COOKIE_CONSENT_KEY = "cookie_consent";

export default function CookieConsentBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        necessary: true,
        analytics: false,
       
    });
    useEffect(() => {
        if (typeof window !== "undefined") {
            const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
            if (!consent) {
                setShowBanner(true);
            }
        }
    }, []);

    const saveSettings = (newSettings: typeof settings) => {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
        setShowBanner(false);
        setShowSettings(false);
    };

    const handleAcceptAll = () => {
        saveSettings({ necessary: true, analytics: true, marketing: true });
    };

    const handleRejectAll = () => {
        saveSettings({ necessary: true, analytics: false, marketing: false });
    };

    if (!showBanner) return null;

    return (
        <>
            <div className="fixed bottom-4 left-4 right-4 z-50">
                <div className="backdrop-blur-md bg-black/70 text-white rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slide-up border border-white/10">
                    <div className="text-sm md:text-base">
                        เว็บไซต์นี้ใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ อ่าน{" "}
                        <Link
                            href={route("cookie.policy")}
                            className="underline text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            นโยบายคุกกี้
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <Button
                           
                            onClick={() => handleRejectAll()}
                            className="px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10 transition-colors"
                        >
                            ปฏิเสธทั้งหมด
                        </Button>
                        <Button
                         
                            onClick={() => setShowSettings(true)}
                            className="px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10 transition-colors"
                        >
                            ตั้งค่าคุกกี้
                        </Button>
                        <Button
                            onClick={handleAcceptAll}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 hover:brightness-110 transition-all font-semibold shadow-sm"
                        >
                            ยอมรับทั้งหมด
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal สำหรับตั้งค่าคุกกี้ */}
            <Dialog
                open={showSettings}
                onClose={() => setShowSettings(false)}
                className="relative z-50"
            >
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    aria-hidden="true"
                />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white dark:bg-zinc-900 text-black dark:text-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <Dialog.Title className="text-xl font-bold">
                            ตั้งค่าคุกกี้
                        </Dialog.Title>

                        <div className="space-y-3">
                            <SettingToggle
                                label="คุกกี้ที่จำเป็น (เปิดใช้งานเสมอ)"
                                checked={true}
                                disabled
                            />
                            <SettingToggle
                                label="คุกกี้เพื่อการวิเคราะห์"
                                checked={settings.analytics}
                                onChange={(v) =>
                                    setSettings((s) => ({ ...s, analytics: v }))
                                }
                            />
                           
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowSettings(false)}
                            >
                                ยกเลิก
                            </Button>
                            <Button onClick={() => saveSettings(settings)}>
                                บันทึกการตั้งค่า
                            </Button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
}
function SettingToggle({
    label,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    checked: boolean;
    onChange?: (val: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex justify-between items-center">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange?.(e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 accent-green-500"
            />
        </div>
    );
}
