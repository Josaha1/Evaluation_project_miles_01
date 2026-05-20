import React, { useState, useEffect, useMemo } from "react";
import {
    X, User as UserIcon, Award, Loader2, AlertCircle,
    BarChart3, Users, Target, ChevronDown, ChevronUp, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    userId: number;
    fiscalYear: number;
    isOpen: boolean;
    onClose: () => void;
}

interface Data {
    user: { id: number; name: string; position: string; division: string; grade: number; user_type: string };
    scores: { self: number; top: number; bottom: number; left: number; right: number; average: number };
    completion_data: { total_angles: number; completed_angles: number; completion_rate: number };
    evaluators: { name: string; angle: string; division: string; score: number; completed: boolean }[];
    aspect_scores: { aspect: string; score: number; max_score: number; percentage: number }[];
    comparison_data: { grade_average: number; division_average: number; overall_average: number };
}

const ANGLE_META: Record<string, { label: string; color: string; bg: string; border: string; bar: string }> = {
    self:   { label: "ตนเอง",   color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  bar: "bg-violet-500" },
    top:    { label: "องศาบน",  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    bar: "bg-blue-500" },
    bottom: { label: "องศาล่าง", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
    left:   { label: "องศาซ้าย", color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",  bar: "bg-orange-500" },
    right:  { label: "องศาขวา", color: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200",    bar: "bg-pink-500" },
};

const IndividualDetailedReport: React.FC<Props> = ({ userId, fiscalYear, isOpen, onClose }) => {
    const [data, setData] = useState<Data | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAllEvaluators, setShowAllEvaluators] = useState(false);

    useEffect(() => {
        if (!isOpen || !userId) return;
        setLoading(true);
        setError(null);
        const url = route("admin.evaluation-report.user-details", { userId }) + (fiscalYear ? `?fiscal_year=${fiscalYear}` : "");
        fetch(url, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const j = await r.json();
                if (!j.user || !j.scores) throw new Error("ข้อมูลไม่ครบถ้วน");
                setData(j);
            })
            .catch((e) => setError(e.message || "โหลดข้อมูลไม่สำเร็จ"))
            .finally(() => setLoading(false));
    }, [isOpen, userId, fiscalYear]);

    const evaluatorsByAngle = useMemo(() => {
        const groups: Record<string, Data["evaluators"]> = { self: [], top: [], bottom: [], left: [], right: [] };
        (data?.evaluators ?? []).forEach((ev) => {
            if (groups[ev.angle]) groups[ev.angle].push(ev);
        });
        return groups;
    }, [data]);

    if (!isOpen) return null;

    const buddhistYear = fiscalYear + 543;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
                        <p className="text-gray-600 dark:text-gray-400">กำลังโหลดรายงาน...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">โหลดข้อมูลไม่สำเร็จ</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                        <button onClick={onClose} className="mt-2 px-4 py-2 rounded-lg bg-violet-600 text-white">ปิด</button>
                    </div>
                )}

                {/* Content */}
                {data && !loading && !error && (
                    <>
                        {/* Header */}
                        <div className="gradient-primary text-white px-6 py-5 flex items-start justify-between flex-shrink-0">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="w-7 h-7"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl font-bold truncate">{data.user.name}</h2>
                                    <p className="text-sm opacity-90 truncate">
                                        {data.user.position} · {data.user.division} · ระดับ C{data.user.grade}
                                    </p>
                                    <p className="text-xs opacity-75 mt-0.5">รายงานการประเมิน 360° · ปีงบ พ.ศ. {buddhistYear}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 flex-shrink-0">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Body — scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-800/30">
                            {/* Average score hero */}
                            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border-2 border-violet-200 p-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                                            <Award className="w-7 h-7"/>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">คะแนนเฉลี่ย (ถ่วงน้ำหนัก)</div>
                                            <div className="text-4xl font-bold text-gradient-primary">{data.scores.average.toFixed(2)}</div>
                                            <div className="text-xs text-gray-500 mt-1">เต็ม 5.00 · {data.completion_data.completed_angles}/5 องศาที่มีคะแนน</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">ค่าเฉลี่ยระดับ:</span>
                                            <span className="font-bold text-violet-700">{data.comparison_data.grade_average.toFixed(2)}</span>
                                            <DiffBadge me={data.scores.average} other={data.comparison_data.grade_average}/>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">ค่าเฉลี่ยสายงาน:</span>
                                            <span className="font-bold text-violet-700">{data.comparison_data.division_average.toFixed(2)}</span>
                                            <DiffBadge me={data.scores.average} other={data.comparison_data.division_average}/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5 angle scores */}
                            <Section title="คะแนนแต่ละองศา" icon={Target}>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {(["self", "top", "bottom", "left", "right"] as const).map((angle) => {
                                        const meta = ANGLE_META[angle];
                                        const score = data.scores[angle];
                                        const has = score > 0;
                                        return (
                                            <div key={angle} className={cn("rounded-xl p-4 border-2", has ? meta.bg + " " + meta.border : "bg-gray-50 border-gray-200")}>
                                                <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", has ? meta.color : "text-gray-400")}>{meta.label}</div>
                                                <div className={cn("text-3xl font-bold", has ? meta.color : "text-gray-300")}>
                                                    {has ? score.toFixed(2) : "—"}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1">{has ? `เต็ม 5.00` : "ยังไม่มีข้อมูล"}</div>
                                                {has && (
                                                    <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                                        <div className={cn("h-full transition-all", meta.bar)} style={{ width: `${(score / 5) * 100}%` }}/>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Section>

                            {/* Aspect breakdown */}
                            {data.aspect_scores.length > 0 && (
                                <Section title={`คะแนนรายด้าน (${data.aspect_scores.length} ด้าน)`} icon={BarChart3}>
                                    <div className="space-y-2">
                                        {data.aspect_scores.map((a, i) => (
                                            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">{a.aspect}</span>
                                                    <span className="text-sm font-bold text-violet-700">{a.score.toFixed(2)}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all",
                                                            a.percentage >= 80 ? "bg-emerald-500" :
                                                            a.percentage >= 60 ? "bg-amber-500" : "bg-rose-500")}
                                                        style={{ width: `${a.percentage}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1">{a.percentage}% ของคะแนนเต็ม</div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Evaluators by angle */}
                            <Section title={`ผู้ประเมิน (${data.evaluators.length} คน)`} icon={Users}>
                                {data.evaluators.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">ยังไม่มีผู้ประเมิน</div>
                                ) : (
                                    <div className="space-y-3">
                                        {(["self", "top", "bottom", "left", "right"] as const).map((angle) => {
                                            const list = evaluatorsByAngle[angle] || [];
                                            if (list.length === 0) return null;
                                            const meta = ANGLE_META[angle];
                                            const visible = showAllEvaluators ? list : list.slice(0, 5);
                                            return (
                                                <div key={angle} className={cn("rounded-xl border", meta.border, meta.bg)}>
                                                    <div className={cn("px-3 py-2 border-b font-semibold text-sm flex items-center justify-between", meta.color, meta.border)}>
                                                        <span>{meta.label}</span>
                                                        <span className="text-xs">{list.length} คน</span>
                                                    </div>
                                                    <div className="divide-y divide-white/40 dark:divide-gray-700">
                                                        {visible.map((ev, i) => (
                                                            <div key={i} className="px-3 py-2 flex items-center justify-between bg-white/60">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold", meta.bar)}>
                                                                        {ev.name?.charAt(0) || "?"}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="text-sm font-medium truncate">{ev.name}</div>
                                                                        <div className="text-[10px] text-gray-500 truncate">{ev.division}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    {ev.completed ? (
                                                                        <span className="text-xs font-bold text-emerald-700">{ev.score.toFixed(2)}</span>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400 italic">รอประเมิน</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {list.length > 5 && !showAllEvaluators && (
                                                            <button onClick={() => setShowAllEvaluators(true)} className="w-full px-3 py-2 text-xs text-violet-600 hover:bg-white/80 flex items-center justify-center gap-1">
                                                                <ChevronDown className="w-3 h-3"/>ดูเพิ่ม {list.length - 5} คน
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {showAllEvaluators && (
                                            <button onClick={() => setShowAllEvaluators(false)} className="w-full text-xs text-gray-500 hover:text-violet-600 flex items-center justify-center gap-1 py-2">
                                                <ChevronUp className="w-3 h-3"/>ย่อ
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Section>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between flex-shrink-0">
                            <div className="text-xs text-gray-500">
                                อัตราการประเมิน: <span className="font-semibold text-gray-700">{data.completion_data.completion_rate}%</span>
                            </div>
                            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium">
                                ปิด
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
            <Icon className="w-4 h-4 text-violet-600"/>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const DiffBadge: React.FC<{ me: number; other: number }> = ({ me, other }) => {
    if (other === 0) return null;
    const diff = me - other;
    const cls = diff > 0 ? "text-emerald-700 bg-emerald-100" : diff < 0 ? "text-rose-700 bg-rose-100" : "text-gray-600 bg-gray-100";
    const sign = diff > 0 ? "+" : "";
    return (
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", cls)}>
            {sign}{diff.toFixed(2)}
        </span>
    );
};

export default IndividualDetailedReport;
