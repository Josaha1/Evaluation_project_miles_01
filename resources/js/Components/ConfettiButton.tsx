import React, { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface ConfettiButtonProps {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    disabled?: boolean;
}

/**
 * A button that fires a confetti burst when clicked.
 * Designed for evaluation-completion moments.
 */
export function ConfettiButton({
    children,
    onClick,
    className,
    disabled = false,
}: ConfettiButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const fireConfetti = useCallback(() => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        // Primary burst from the button
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { x, y },
            colors: [
                "#7C3AED", // violet
                "#6D28D9", // purple
                "#10B981", // emerald
                "#F97316", // orange
                "#FBBF24", // amber
                "#3B82F6", // blue
            ],
            startVelocity: 30,
            gravity: 0.8,
            ticks: 120,
            scalar: 1.1,
            shapes: ["circle", "square"],
        });

        // Delayed side bursts for a fuller celebration
        setTimeout(() => {
            confetti({
                particleCount: 40,
                angle: 60,
                spread: 55,
                origin: { x: x - 0.1, y },
                colors: ["#7C3AED", "#10B981", "#F97316"],
                startVelocity: 25,
                gravity: 1,
                ticks: 100,
            });
            confetti({
                particleCount: 40,
                angle: 120,
                spread: 55,
                origin: { x: x + 0.1, y },
                colors: ["#6D28D9", "#FBBF24", "#3B82F6"],
                startVelocity: 25,
                gravity: 1,
                ticks: 100,
            });
        }, 150);
    }, []);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (disabled) return;
            fireConfetti();
            onClick?.(e);
        },
        [disabled, fireConfetti, onClick]
    );

    return (
        <motion.button
            ref={buttonRef}
            type="button"
            disabled={disabled}
            onClick={handleClick}
            whileHover={disabled ? {} : { scale: 1.04, y: -1 }}
            whileTap={disabled ? {} : { scale: 0.96 }}
            className={cn(
                "relative overflow-hidden",
                "inline-flex items-center justify-center gap-2",
                "px-8 py-3.5 rounded-xl",
                "font-bold text-base text-white",
                "gradient-primary shadow-lg shadow-violet-500/25",
                "transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                disabled &&
                    "opacity-50 cursor-not-allowed saturate-50 shadow-none",
                !disabled && "hover:shadow-xl hover:shadow-violet-500/30",
                className
            )}
        >
            {/* Shimmer overlay */}
            {!disabled && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    initial={{ x: "-150%" }}
                    animate={{ x: "150%" }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut",
                    }}
                />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </motion.button>
    );
}
