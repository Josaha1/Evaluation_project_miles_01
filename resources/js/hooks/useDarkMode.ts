import { useState, useEffect } from "react";

export function useDarkMode() {
    // เริ่มต้นด้วยค่า false แต่จะอัปเดตจาก localStorage ทันที
    const [darkMode, setDarkMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // ฟังก์ชันสำหรับเซ็ต dark mode
    const setDarkModeWithPersistence = (isDark: boolean) => {
        setDarkMode(isDark);

        // อัปเดต HTML class
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }

        // บันทึกใน localStorage
        localStorage.setItem("darkMode", JSON.stringify(isDark));
    };

    // โหลดค่า dark mode จาก localStorage เมื่อ component mount
    useEffect(() => {
        // ตรวจสอบว่าอยู่ในเบราว์เซอร์หรือไม่
        if (typeof window !== "undefined") {
            try {
                // ลองอ่านค่าจาก localStorage
                const savedDarkMode = localStorage.getItem("darkMode");

                let initialDarkMode = false;

                if (savedDarkMode !== null) {
                    // ถ้ามีค่าใน localStorage ให้ใช้ค่านั้น
                    initialDarkMode = JSON.parse(savedDarkMode);
                } else {
                    // ถ้าไม่มีค่าใน localStorage ให้ตรวจสอบจาก system preference
                    initialDarkMode = window.matchMedia(
                        "(prefers-color-scheme: dark)"
                    ).matches;
                    // บันทึกค่าเริ่มต้นลง localStorage
                    localStorage.setItem(
                        "darkMode",
                        JSON.stringify(initialDarkMode)
                    );
                }

                // เซ็ตค่า dark mode
                setDarkMode(initialDarkMode);

                // อัปเดต HTML class
                if (initialDarkMode) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            } catch (error) {
                console.warn("Error loading dark mode preference:", error);
                // ถ้าเกิดข้อผิดพลาด ให้ใช้ system preference
                const systemDarkMode = window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches;
                setDarkMode(systemDarkMode);
                if (systemDarkMode) {
                    document.documentElement.classList.add("dark");
                }
            }

            setIsLoaded(true);
        }
    }, []);

    // ฟังก์ชันสำหรับ toggle dark mode
    const toggleDarkMode = () => {
        setDarkModeWithPersistence(!darkMode);
    };

    // ฟังการเปลี่ยนแปลง system preference
    useEffect(() => {
        if (typeof window !== "undefined") {
            const mediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

            const handleSystemThemeChange = (e: MediaQueryListEvent) => {
                // อัปเดตเฉพาะเมื่อยังไม่มีการเซ็ตค่าใน localStorage
                const savedDarkMode = localStorage.getItem("darkMode");
                if (savedDarkMode === null) {
                    setDarkModeWithPersistence(e.matches);
                }
            };

            // เพิ่ม event listener สำหรับการเปลี่ยนแปลง system theme
            mediaQuery.addEventListener("change", handleSystemThemeChange);

            // cleanup
            return () => {
                mediaQuery.removeEventListener(
                    "change",
                    handleSystemThemeChange
                );
            };
        }
    }, []);

    return {
        darkMode,
        toggleDarkMode,
        setDarkMode: setDarkModeWithPersistence,
        isLoaded, // สำหรับการแสดง loading state ถ้าต้องการ
    };
}
