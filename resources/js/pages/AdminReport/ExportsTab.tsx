import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    FileText, BarChart3, Crown, Users, Shield, Globe,
    Layers, Database, Download, Loader2, UserCheck, ClipboardList,
    SlidersHorizontal, ChevronDown, X, Search, Calendar,
    ArrowDownToLine, Filter, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ================================================================ */
/*  Types                                                           */
/* ================================================================ */

interface ExportsTabProps {
    fiscalYear: string;
    selectedDivision: string;
    selectedGrade: string;
    availableUsers?: { id: number; name: string }[];
    availableDivisions?: { id: number; name: string }[];
    availableDepartments?: { id: number; title: string }[];
    availablePositions?: { id: number; title: string }[];
}

interface ExportItem {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    accent: string;         // tailwind color token (e.g. "violet")
}

/* ================================================================ */
/*  Static data                                                     */
/* ================================================================ */

const EVALUATEE_REPORTS: ExportItem[] = [
    { id: "evaluatee-scores", title: "ตารางคะแนน 360 องศา", description: "คะแนนผู้ถูกประเมินทุกคน แต่ละองศา (ตนเอง/บน/ล่าง/ซ้าย/ขวา) และค่าเฉลี่ย", icon: ClipboardList, accent: "violet" },
    { id: "comprehensive", title: "รายงานรวมทุกระดับ", description: "ผู้ว่าการ + ผู้บริหาร + พนักงาน + องค์กรภายนอก รวมในไฟล์เดียว", icon: Layers, accent: "violet" },
    { id: "governors", title: "ผู้ว่าการ (ระดับ 13)", description: "คะแนนถ่วงน้ำหนัก: self 10% / top 25% / bottom 25% / left 20% / right 20%", icon: Shield, accent: "rose" },
    { id: "executives", title: "ผู้บริหาร (ระดับ 9-12)", description: "คะแนนแต่ละมุม พร้อมรายละเอียดรายข้อ", icon: Crown, accent: "amber" },
    { id: "employees", title: "พนักงาน (ระดับ 4-8)", description: "คะแนนถ่วงน้ำหนัก: self 50% / top 20% / left 30%", icon: Users, accent: "sky" },
    { id: "self-evaluation", title: "ผลการประเมินตนเอง", description: "คะแนนตนเอง เทียบกับคะแนนจากมุมอื่น", icon: UserCheck, accent: "purple" },
    { id: "external-org", title: "องค์กรภายนอก (องศาขวา)", description: "คะแนนจากองค์กรภายนอก แยกตามองค์กร", icon: Globe, accent: "teal" },
];

const ANALYSIS_REPORTS: ExportItem[] = [
    { id: "summary", title: "สรุปภาพรวม", description: "จำนวนผู้ประเมิน อัตราสำเร็จ คะแนนเฉลี่ย แยกระดับ/หน่วยงาน", icon: FileText, accent: "emerald" },
    { id: "comparison", title: "เปรียบเทียบผล", description: "เปรียบเทียบคะแนนระหว่างหน่วยงาน ระดับ และมุมประเมิน", icon: BarChart3, accent: "blue" },
    { id: "detailed-data", title: "ข้อมูลดิบทั้งหมด", description: "ทุกคำถาม ทุกคำตอบ ทุกผู้ประเมิน สำหรับวิเคราะห์เชิงลึก", icon: Database, accent: "slate" },
];

const STATUS_REPORTS: ExportItem[] = [
    { id: "completed-evaluators-internal", title: "ผู้ประเมินสำเร็จแล้ว (ภายใน)", description: "รายชื่อผู้ประเมินภายในที่ส่งแบบประเมินครบทุกข้อแล้ว พร้อมเวลาที่ส่ง", icon: UserCheck, accent: "emerald" },
    { id: "completed-evaluators-external", title: "ผู้ประเมินสำเร็จแล้ว (ภายนอก)", description: "รายชื่อผู้ประเมินภายนอก (แยกตามองค์กร) ที่ส่งแบบประเมินเสร็จแล้ว", icon: UserCheck, accent: "teal" },
    { id: "pending-evaluators", title: "ผู้ประเมินที่ยังไม่เสร็จสิ้น (ภายใน)", description: "รายชื่อผู้ประเมินภายในที่ยังไม่ส่ง พร้อมรายชื่อผู้ที่เค้าต้องประเมิน + กอง/ฝ่าย/สายงาน", icon: ClipboardList, accent: "amber" },
    { id: "pending-evaluators-external", title: "ผู้ประเมินที่ยังไม่เสร็จสิ้น (ภายนอก)", description: "รายชื่อผู้ประเมินภายนอก (แยกตามองค์กร) ที่ยังไม่ได้ส่ง พร้อมข้อมูลผู้ติดต่อขององค์กร", icon: ClipboardList, accent: "rose" },
];

const ANGLE_OPTIONS = [
    { value: "", label: "ทุกมุม" },
    { value: "self", label: "ตนเอง" },
    { value: "top", label: "ผู้บังคับบัญชา" },
    { value: "bottom", label: "ผู้ใต้บังคับบัญชา" },
    { value: "left", label: "เพื่อนร่วมงาน" },
    { value: "right", label: "องค์กรภายนอก" },
];

const GRADE_OPTIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const ACCENT = (token: string) => {
    const m: Record<string, { iconBg: string; iconText: string; ring: string; badge: string }> = {
        violet:  { iconBg: "bg-violet-100 dark:bg-violet-900/40",  iconText: "text-violet-600 dark:text-violet-400",  ring: "hover:ring-violet-300 dark:hover:ring-violet-700",  badge: "bg-violet-500" },
        rose:    { iconBg: "bg-rose-100 dark:bg-rose-900/40",      iconText: "text-rose-600 dark:text-rose-400",      ring: "hover:ring-rose-300 dark:hover:ring-rose-700",      badge: "bg-rose-500" },
        amber:   { iconBg: "bg-amber-100 dark:bg-amber-900/40",    iconText: "text-amber-600 dark:text-amber-400",    ring: "hover:ring-amber-300 dark:hover:ring-amber-700",    badge: "bg-amber-500" },
        sky:     { iconBg: "bg-sky-100 dark:bg-sky-900/40",        iconText: "text-sky-600 dark:text-sky-400",        ring: "hover:ring-sky-300 dark:hover:ring-sky-700",        badge: "bg-sky-500" },
        purple:  { iconBg: "bg-purple-100 dark:bg-purple-900/40",  iconText: "text-purple-600 dark:text-purple-400",  ring: "hover:ring-purple-300 dark:hover:ring-purple-700",  badge: "bg-purple-500" },
        teal:    { iconBg: "bg-teal-100 dark:bg-teal-900/40",      iconText: "text-teal-600 dark:text-teal-400",      ring: "hover:ring-teal-300 dark:hover:ring-teal-700",      badge: "bg-teal-500" },
        emerald: { iconBg: "bg-emerald-100 dark:bg-emerald-900/40",iconText: "text-emerald-600 dark:text-emerald-400",ring: "hover:ring-emerald-300 dark:hover:ring-emerald-700",badge: "bg-emerald-500" },
        blue:    { iconBg: "bg-blue-100 dark:bg-blue-900/40",      iconText: "text-blue-600 dark:text-blue-400",      ring: "hover:ring-blue-300 dark:hover:ring-blue-700",      badge: "bg-blue-500" },
        slate:   { iconBg: "bg-gray-100 dark:bg-gray-800",         iconText: "text-gray-600 dark:text-gray-400",      ring: "hover:ring-gray-300 dark:hover:ring-gray-600",      badge: "bg-gray-500" },
    };
    return m[token] ?? m.slate;
};

/* ================================================================ */
/*  Tiny sub-components                                             */
/* ================================================================ */

const SelectField: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    icon?: React.ElementType;
}> = ({ label, value, onChange, options, icon: Icon }) => (
    <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                "w-full text-sm rounded-xl border px-3 py-2 transition-all duration-150",
                "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80",
                "focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400",
                value ? "text-gray-900 dark:text-white font-medium" : "text-gray-400 dark:text-gray-500",
            )}
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </div>
);

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50"
    >
        {label}
        <button onClick={onRemove} className="hover:bg-violet-200 dark:hover:bg-violet-800 rounded-full p-0.5 transition-colors">
            <X className="w-2.5 h-2.5" />
        </button>
    </motion.span>
);

/* ================================================================ */
/*  Main component                                                  */
/* ================================================================ */

const ExportsTab: React.FC<ExportsTabProps> = ({
    fiscalYear,
    selectedDivision,
    selectedGrade,
    availableUsers = [],
    availableDivisions = [],
    availableDepartments = [],
    availablePositions = [],
}) => {
    /* ---------- state ---------- */
    const [exporting, setExporting] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [userSearch, setUserSearch] = useState("");

    const [filterUser, setFilterUser] = useState("");
    const [filterDivision, setFilterDivision] = useState(selectedDivision || "");
    const [filterGrade, setFilterGrade] = useState(selectedGrade || "");
    const [filterAngle, setFilterAngle] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("");
    const [filterPosition, setFilterPosition] = useState("");

    /* ---------- derived ---------- */
    const buddhistYear = Number(fiscalYear) + 543;

    const filteredUsers = useMemo(
        () => availableUsers.filter((u) => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase())).slice(0, 50),
        [availableUsers, userSearch],
    );

    const activeChips = useMemo(() => {
        const chips: { key: string; label: string; clear: () => void }[] = [];
        if (filterUser) {
            const user = availableUsers.find((u) => String(u.id) === filterUser);
            chips.push({ key: "user", label: user?.name ?? `ID ${filterUser}`, clear: () => { setFilterUser(""); setUserSearch(""); } });
        }
        if (filterDivision) {
            const div = availableDivisions.find((d) => String(d.id) === filterDivision);
            chips.push({ key: "div", label: div?.name ?? filterDivision, clear: () => setFilterDivision("") });
        }
        if (filterGrade) chips.push({ key: "grade", label: `ระดับ ${filterGrade}`, clear: () => setFilterGrade("") });
        if (filterAngle) {
            const a = ANGLE_OPTIONS.find((o) => o.value === filterAngle);
            chips.push({ key: "angle", label: a?.label ?? filterAngle, clear: () => setFilterAngle("") });
        }
        if (filterDepartment) {
            const dept = availableDepartments.find((d) => String(d.id) === filterDepartment);
            chips.push({ key: "dept", label: dept?.title ?? filterDepartment, clear: () => setFilterDepartment("") });
        }
        if (filterPosition) {
            const pos = availablePositions.find((p) => String(p.id) === filterPosition);
            chips.push({ key: "pos", label: pos?.title ?? filterPosition, clear: () => setFilterPosition("") });
        }
        return chips;
    }, [filterUser, filterDivision, filterGrade, filterAngle, filterDepartment, filterPosition, availableUsers, availableDivisions, availableDepartments, availablePositions]);

    const clearAll = () => {
        setFilterUser(""); setFilterDivision(""); setFilterGrade("");
        setFilterAngle(""); setFilterDepartment(""); setFilterPosition("");
        setUserSearch("");
    };

    /* ---------- export handler ---------- */
    const handleExport = async (type: string) => {
        setExporting(type);
        try {
            const formData = new FormData();
            formData.append("fiscal_year", fiscalYear);
            if (filterDivision) formData.append("division_id", filterDivision);
            if (filterGrade) formData.append("grade", filterGrade);
            if (filterUser) formData.append("user_id", filterUser);
            if (filterAngle) formData.append("angle", filterAngle);
            if (filterDepartment) formData.append("department_id", filterDepartment);
            if (filterPosition) formData.append("position_id", filterPosition);
            formData.append("_token", document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "");

            const response = await fetch(`/admin/reports/evaluation/export/${type}`, {
                method: "POST",
                body: formData,
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    const data = await response.json();
                    toast.error(data.error || "ไม่สามารถส่งออกรายงานได้");
                    return;
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `รายงาน_${type}_พศ${buddhistYear}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success("ดาวน์โหลดรายงานสำเร็จ");
            } else {
                toast.error("ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setExporting(null);
        }
    };

    /* ---------- render card ---------- */
    const renderExportCard = (item: ExportItem, index: number) => {
        const a = ACCENT(item.accent);
        const Icon = item.icon;
        const isActive = exporting === item.id;

        return (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "group relative glass-card rounded-2xl overflow-hidden",
                    "ring-1 ring-gray-200/80 dark:ring-gray-700/60",
                    a.ring,
                    "transition-all duration-200 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20",
                )}
            >
                {/* Accent top bar */}
                <div className={cn("h-1 w-full", a.badge, "opacity-60 group-hover:opacity-100 transition-opacity")} />

                <div className="p-5">
                    <div className="flex items-start gap-3.5 mb-4">
                        <div className={cn("p-2.5 rounded-xl flex-shrink-0", a.iconBg)}>
                            <Icon className={cn("h-5 w-5", a.iconText)} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[13px] leading-snug">
                                {item.title}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                                {item.description}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleExport(item.id)}
                        disabled={exporting !== null}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                            isActive
                                ? cn(a.iconBg, a.iconText, "cursor-wait")
                                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]",
                        )}
                    >
                        {isActive ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />กำลังสร้าง...</>
                        ) : (
                            <><ArrowDownToLine className="h-4 w-4" />ดาวน์โหลด .xlsx</>
                        )}
                    </button>
                </div>
            </motion.div>
        );
    };

    /* ================================================================ */
    /*  JSX                                                             */
    /* ================================================================ */

    return (
        <div className="space-y-6">
            {/* ─── Header + Year Badge ─── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/20">
                        <Download className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">ส่งออกรายงาน</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ดาวน์โหลดผลประเมิน 360 องศา เป็นไฟล์ Excel</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50">
                        <Calendar className="w-3.5 h-3.5" />
                        พ.ศ. {buddhistYear}
                    </span>
                </div>
            </motion.div>

            {/* ─── Filters Panel ─── */}
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card rounded-2xl overflow-hidden ring-1 ring-gray-200/60 dark:ring-gray-700/40"
            >
                {/* Collapse toggle */}
                <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">ตัวกรองข้อมูล</span>
                        {activeChips.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white">
                                {activeChips.length}
                            </span>
                        )}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", filtersOpen && "rotate-180")} />
                </button>

                {/* Active filter chips (always visible when filters exist) */}
                <AnimatePresence>
                    {activeChips.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-5 pb-3 flex flex-wrap items-center gap-1.5"
                        >
                            <Filter className="w-3 h-3 text-gray-400 mr-1" />
                            <AnimatePresence mode="popLayout">
                                {activeChips.map((chip) => (
                                    <FilterChip key={chip.key} label={chip.label} onRemove={chip.clear} />
                                ))}
                            </AnimatePresence>
                            <button
                                onClick={clearAll}
                                className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 ml-1 transition-colors"
                            >
                                ล้างทั้งหมด
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Expandable filter controls */}
                <AnimatePresence>
                    {filtersOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                    {/* User search + select */}
                                    <div className="space-y-1">
                                        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            <Search className="w-3 h-3" />ผู้ถูกประเมิน
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="พิมพ์ค้นหาชื่อ..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 pl-3 pr-8 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                                            />
                                            {userSearch && (
                                                <button onClick={() => setUserSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <select
                                            value={filterUser}
                                            onChange={(e) => setFilterUser(e.target.value)}
                                            className={cn(
                                                "w-full text-sm rounded-xl border px-3 py-2 transition-all",
                                                "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80",
                                                "focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400",
                                                filterUser ? "text-gray-900 dark:text-white font-medium" : "text-gray-400",
                                            )}
                                        >
                                            <option value="">ทุกคน</option>
                                            {filteredUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>

                                    <SelectField label="สายงาน" value={filterDivision} onChange={setFilterDivision}
                                        options={[{ value: "", label: "ทุกสายงาน" }, ...availableDivisions.map((d) => ({ value: String(d.id), label: d.name }))]}
                                    />

                                    <SelectField label="ระดับ" value={filterGrade} onChange={setFilterGrade}
                                        options={[{ value: "", label: "ทุกระดับ" }, ...GRADE_OPTIONS.map((g) => ({ value: String(g), label: `ระดับ ${g}` }))]}
                                    />

                                    <SelectField label="มุมประเมิน" value={filterAngle} onChange={setFilterAngle} options={ANGLE_OPTIONS} />

                                    <SelectField label="ฝ่าย" value={filterDepartment} onChange={setFilterDepartment}
                                        options={[{ value: "", label: "ทุกฝ่าย" }, ...availableDepartments.map((d) => ({ value: String(d.id), label: d.title }))]}
                                    />

                                    <SelectField label="ตำแหน่ง" value={filterPosition} onChange={setFilterPosition}
                                        options={[{ value: "", label: "ทุกตำแหน่ง" }, ...availablePositions.map((p) => ({ value: String(p.id), label: p.title }))]}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ─── Section 1: Evaluatee Reports ─── */}
            <section>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-3">
                    <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">รายงานผลผู้ถูกประเมิน</h2>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">({EVALUATEE_REPORTS.length} รายงาน)</span>
                    </div>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {EVALUATEE_REPORTS.map((item, i) => renderExportCard(item, i))}
                </div>
            </section>

            {/* ─── Section 2: Analysis Reports ─── */}
            <section>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-3">
                    <div className="flex items-center gap-2.5">
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">วิเคราะห์และสรุปผล</h2>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">({ANALYSIS_REPORTS.length} รายงาน)</span>
                    </div>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {ANALYSIS_REPORTS.map((item, i) => renderExportCard(item, i + EVALUATEE_REPORTS.length))}
                </div>
            </section>

            {/* ─── Section 3: Status Reports — รายงานสถานะค้างประเมิน ─── */}
            <section>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-3">
                    <div className="flex items-center gap-2.5">
                        <ClipboardList className="w-4 h-4 text-amber-500" />
                        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">รายงานสถานะค้างประเมิน</h2>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">({STATUS_REPORTS.length} รายงาน)</span>
                    </div>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {STATUS_REPORTS.map((item, i) => renderExportCard(item, i + EVALUATEE_REPORTS.length + ANALYSIS_REPORTS.length))}
                </div>
            </section>
        </div>
    );
};

export default ExportsTab;
