import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FiscalYearSelectorProps {
    value: string | number;
    years: (string | number)[];
    onChange: (year: string) => void;
    variant?: 'header' | 'filter';
    showAllOption?: boolean;
}

export default function FiscalYearSelector({
    value,
    years,
    onChange,
    variant = 'header',
    showAllOption = false,
}: FiscalYearSelectorProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 200 });

    const updatePosition = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 280; // max-h-64 = 256px + padding
            // If not enough space below, open upward
            const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
            setDropdownPos({
                top: openUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
                left: Math.max(8, rect.right - 220),
                width: Math.max(200, rect.width),
            });
        }
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open) updatePosition();
    }, [open, updatePosition]);

    const displayLabel = value
        ? `พ.ศ. ${Number(value) + 543}`
        : 'ทุกปีงบประมาณ';

    const isHeader = variant === 'header';

    return (
        <div className="relative">
            <button
                ref={btnRef}
                onClick={() => setOpen(!open)}
                className={cn(
                    'flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all duration-200 group',
                    isHeader
                        ? 'bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20'
                        : 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30 border border-violet-200 dark:border-violet-700 shadow-sm hover:shadow-md',
                    open && (isHeader ? 'bg-white/25 ring-2 ring-white/30' : 'ring-2 ring-violet-400 shadow-md')
                )}
            >
                <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                    isHeader
                        ? 'bg-white/20 group-hover:bg-white/30'
                        : 'bg-violet-100 dark:bg-violet-800/50 group-hover:bg-violet-200 dark:group-hover:bg-violet-700/50'
                )}>
                    <Calendar className={cn(
                        'w-3.5 h-3.5',
                        isHeader ? 'text-white' : 'text-violet-600 dark:text-violet-300'
                    )} />
                </div>
                <div className="flex flex-col items-start">
                    <span className={cn(
                        'text-[10px] font-medium leading-none',
                        isHeader ? 'text-white/60' : 'text-violet-500 dark:text-violet-400'
                    )}>
                        ปีงบประมาณ
                    </span>
                    <span className={cn(
                        'text-sm font-bold leading-tight',
                        isHeader ? 'text-white' : 'text-violet-700 dark:text-violet-200'
                    )}>
                        {displayLabel}
                    </span>
                </div>
                <ChevronDown className={cn(
                    'w-4 h-4 transition-transform duration-200 ml-1',
                    open && 'rotate-180',
                    isHeader ? 'text-white/60' : 'text-violet-400'
                )} />
            </button>

            {open && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={ref}
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed min-w-[200px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl shadow-violet-500/20 border border-violet-100 dark:border-violet-800 overflow-hidden"
                        style={{ zIndex: 99999, top: dropdownPos.top, left: dropdownPos.left }}
                    >
                        <div className="p-1.5 max-h-64 overflow-y-auto">
                            {showAllOption && (
                                <button
                                    onClick={() => { onChange(''); setOpen(false); }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                                        !value
                                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    )}
                                >
                                    <div className={cn(
                                        'w-5 h-5 rounded-md flex items-center justify-center border',
                                        !value
                                            ? 'bg-violet-500 border-violet-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                    )}>
                                        {!value && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span>ทุกปีงบประมาณ</span>
                                </button>
                            )}
                            {years.map((year) => {
                                const isSelected = String(value) === String(year);
                                return (
                                    <button
                                        key={year}
                                        onClick={() => { onChange(String(year)); setOpen(false); }}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                                            isSelected
                                                ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-5 h-5 rounded-md flex items-center justify-center border transition-colors',
                                            isSelected
                                                ? 'bg-violet-500 border-violet-500'
                                                : 'border-gray-300 dark:border-gray-600'
                                        )}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span>พ.ศ. {Number(year) + 543}</span>
                                            <span className={cn(
                                                'text-xs',
                                                isSelected ? 'text-violet-400' : 'text-gray-400'
                                            )}>
                                                ({year})
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
