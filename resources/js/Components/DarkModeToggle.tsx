import { Moon, Sun } from "lucide-react";

interface DarkModeToggleProps {
    darkMode: boolean;
    onToggle: () => void;
    className?: string;
}

export function DarkModeToggle({
    darkMode,
    onToggle,
    className = "",
}: DarkModeToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={`
                p-2 rounded-lg transition-all duration-200
                bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
                text-gray-800 dark:text-gray-200
                ${className}
            `}
            aria-label={
                darkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"
            }
        >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}
