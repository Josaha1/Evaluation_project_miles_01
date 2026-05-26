import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Activity, AlertTriangle, Database, Cpu, FileText, Users, ClipboardList,
    BarChart3, RefreshCw, Server,
} from "lucide-react";

type TabKey = "app-log" | "activity" | "system" | "submissions";

const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "app-log",     label: "Application Errors", icon: AlertTriangle },
    { key: "activity",    label: "Recent Activity",    icon: Activity },
    { key: "submissions", label: "Submission Stats",   icon: BarChart3 },
    { key: "system",      label: "System Info",        icon: Cpu },
];

export default function AdminLogs() {
    const [tab, setTab] = useState<TabKey>("app-log");
    const [data, setData] = useState<Record<TabKey, any>>({} as any);
    const [loading, setLoading] = useState(false);

    const load = async (k: TabKey, force = false) => {
        if (data[k] && !force) return;
        setLoading(true);
        try {
            const routeMap: Record<TabKey, string> = {
                "app-log":     route("admin.logs.app-log"),
                "activity":    route("admin.logs.recent-activity"),
                "system":      route("admin.logs.system-info"),
                "submissions": route("admin.logs.submission-stats"),
            };
            const res = await fetch(routeMap[k], { headers: { Accept: "application/json" } });
            const j = await res.json();
            setData((prev) => ({ ...prev, [k]: j }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(tab); }, [tab]);

    return (
        <MainLayout
            title="ระบบ Logs"
            breadcrumb={
                <Breadcrumb items={[
                    { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                    { label: "Logs", active: true },
                ]} />
            }
        >
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div className="max-w-7xl mx-auto py-6 space-y-6"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient-primary">ระบบ Logs และข้อมูลระบบ</h1>
                        </div>
                        <button onClick={() => load(tab, true)} disabled={loading}
                            className="inline-flex items-center px-4 py-2 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50">
                            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                            {loading ? "กำลังโหลด..." : "Refresh"}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="glass-card rounded-2xl p-2 flex gap-2 overflow-x-auto">
                        {TABS.map((t) => {
                            const Icon = t.icon;
                            return (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all",
                                        tab === t.key
                                            ? "gradient-primary text-white shadow-md"
                                            : "text-gray-600 hover:bg-violet-50"
                                    )}>
                                    <Icon className="w-4 h-4" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="glass-card rounded-2xl p-6">
                        {tab === "app-log" && <AppLogTab data={data["app-log"]} />}
                        {tab === "activity" && <ActivityTab data={data["activity"]} />}
                        {tab === "submissions" && <SubmissionsTab data={data["submissions"]} />}
                        {tab === "system" && <SystemTab data={data["system"]} />}
                    </div>
                </motion.div>
            </div>
        </MainLayout>
    );
}

function AppLogTab({ data }: { data?: any }) {
    if (!data) return <div className="text-gray-500">Loading...</div>;
    if (!data.entries?.length) return <div className="text-gray-500 text-center py-8">{data.message || "ยังไม่มี log entries"}</div>;

    const levelColors: Record<string, string> = {
        emergency: "bg-red-700 text-white", alert: "bg-red-600 text-white",
        critical: "bg-red-500 text-white",  error: "bg-red-100 text-red-700 border-red-300",
        warning: "bg-amber-100 text-amber-700 border-amber-300",
        notice: "bg-blue-100 text-blue-700 border-blue-300",
        info: "bg-emerald-100 text-emerald-700 border-emerald-300",
        debug: "bg-gray-100 text-gray-600 border-gray-300",
    };

    return (
        <div className="space-y-3">
            <div className="text-sm text-gray-600">
                แสดง <b>{data.count}</b> entries · ขนาดไฟล์ <b>{data.size_kb} KB</b>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {data.entries.map((e: any, i: number) => (
                    <details key={i} className="border rounded-lg bg-white">
                        <summary className="p-3 cursor-pointer flex items-start gap-3 hover:bg-gray-50">
                            <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-bold uppercase border", levelColors[e.level] || "bg-gray-100")}>
                                {e.level}
                            </span>
                            <span className="font-mono text-xs text-gray-500">{e.timestamp}</span>
                            <span className="text-sm text-gray-800 flex-1">{e.message.slice(0, 150)}{e.message.length > 150 && "..."}</span>
                        </summary>
                        {(e.detail || e.message.length > 150) && (
                            <div className="p-3 bg-gray-50 border-t">
                                <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700 max-h-96 overflow-y-auto">
                                    {e.message}{e.detail && "\n" + e.detail}
                                </pre>
                            </div>
                        )}
                    </details>
                ))}
            </div>
        </div>
    );
}

function ActivityTab({ data }: { data?: any }) {
    if (!data) return <div className="text-gray-500">Loading...</div>;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Section title="Users ล่าสุด" icon={Users} items={data.users}
                render={(u: any) => (
                    <>
                        <span className="font-mono text-xs">{u.emid}</span> {u.name} (g{u.grade}) <span className="text-xs text-gray-500">{u.role}/{u.user_type}</span>
                        <div className="text-xs text-gray-400">{u.created_at}</div>
                    </>
                )} />
            <Section title="Assignments ล่าสุด" icon={ClipboardList} items={data.assignments}
                render={(a: any) => (
                    <>
                        <span className={cn("inline-block px-1.5 py-0.5 rounded text-xs font-semibold mr-1",
                            a.angle === 'self' ? 'bg-violet-100 text-violet-700' :
                            a.angle === 'top' ? 'bg-blue-100 text-blue-700' :
                            a.angle === 'bottom' ? 'bg-emerald-100 text-emerald-700' :
                            a.angle === 'left' ? 'bg-orange-100 text-orange-700' :
                            'bg-pink-100 text-pink-700')}>{a.angle}</span>
                        <span className="text-sm">FY{a.fiscal_year}</span>
                        <div className="text-xs text-gray-600">{a.evaluator} → {a.evaluatee}</div>
                        <div className="text-xs text-gray-400">{a.created_at}</div>
                    </>
                )} />
            <Section title="Answers ล่าสุด" icon={Activity} items={data.answers}
                render={(r: any) => (
                    <>
                        <div className="text-sm">{r.evaluator} → {r.evaluatee}</div>
                        <div className="text-xs text-gray-400">{r.created_at}</div>
                    </>
                )} />
        </div>
    );
}

function Section({ title, icon: Icon, items, render }: { title: string; icon: any; items: any[]; render: (x: any) => any }) {
    return (
        <div className="border rounded-xl bg-white">
            <div className="px-3 py-2 bg-violet-50 border-b flex items-center gap-2">
                <Icon className="w-4 h-4 text-violet-600" />
                <h3 className="font-semibold text-violet-800">{title} ({items?.length ?? 0})</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
                {(items ?? []).map((x: any, i: number) => (
                    <div key={i} className="p-3 border-b last:border-0 text-sm">{render(x)}</div>
                ))}
                {(!items?.length) && <div className="p-4 text-center text-gray-400 text-sm">ไม่มีข้อมูล</div>}
            </div>
        </div>
    );
}

function SubmissionsTab({ data }: { data?: any }) {
    if (!data) return <div className="text-gray-500">Loading...</div>;
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg mb-3">Submissions ตามปีงบ</h3>
                <table className="min-w-full text-sm border rounded-xl overflow-hidden">
                    <thead className="bg-violet-50">
                        <tr>
                            <th className="p-2 text-left">ปีงบ (พ.ศ.)</th>
                            <th className="p-2 text-right">Answers</th>
                            <th className="p-2 text-right">Unique Pairs</th>
                            <th className="p-2 text-right">Unique Evaluators</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.by_year ?? []).map((r: any, i: number) => (
                            <tr key={i} className="border-t">
                                <td className="p-2">{Number(r.fiscal_year) + 543} (ค.ศ. {r.fiscal_year})</td>
                                <td className="p-2 text-right font-bold">{Number(r.total).toLocaleString()}</td>
                                <td className="p-2 text-right">{Number(r.unique_pairs).toLocaleString()}</td>
                                <td className="p-2 text-right">{Number(r.unique_evaluators).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div>
                <h3 className="font-bold text-lg mb-3">Submissions ตาม Angle × ปีงบ</h3>
                <table className="min-w-full text-sm border rounded-xl overflow-hidden">
                    <thead className="bg-violet-50">
                        <tr>
                            <th className="p-2 text-left">Angle</th>
                            <th className="p-2 text-left">ปีงบ</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.by_angle ?? []).map((r: any, i: number) => (
                            <tr key={i} className="border-t">
                                <td className="p-2"><span className="px-2 py-0.5 rounded bg-violet-100 text-violet-700 text-xs font-semibold">{r.angle}</span></td>
                                <td className="p-2">{Number(r.fiscal_year) + 543}</td>
                                <td className="p-2 text-right">{Number(r.total).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SystemTab({ data }: { data?: any }) {
    if (!data) return <div className="text-gray-500">Loading...</div>;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InfoBox icon={Server} title="Application">
                <Row label="Environment" value={<span className={cn("px-2 py-0.5 rounded text-xs font-bold",
                    data.app.env === 'production' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{data.app.env}</span>} />
                <Row label="Debug mode" value={data.app.debug ? "ON ⚠" : "OFF"} />
                <Row label="URL" value={<code className="text-xs">{data.app.url}</code>} />
                <Row label="Timezone" value={data.app.timezone} />
            </InfoBox>
            <InfoBox icon={Cpu} title="PHP">
                <Row label="Version" value={data.php.version} />
                <Row label="Memory limit" value={data.php.memory_limit} />
                <Row label="Max execution" value={`${data.php.max_execution}s`} />
                <Row label="Upload max" value={data.php.upload_max} />
            </InfoBox>
            <InfoBox icon={Database} title="Database" className="lg:col-span-2">
                <Row label="Database" value={<code>{data.database.name}</code>} />
                <Row label="Driver" value={data.database.driver} />
                <Row label="Tables" value={`${data.database.tables_count} tables`} />
                <Row label="Records" value={
                    <>users={Number(data.counts.users).toLocaleString()} ·
                    assignments={Number(data.counts.evaluation_assignments).toLocaleString()} ·
                    answers={Number(data.counts.answers).toLocaleString()}</>
                } />
                <div className="mt-3">
                    <h4 className="font-semibold text-sm mb-2">Top tables (by size)</h4>
                    <table className="min-w-full text-xs border rounded">
                        <thead className="bg-gray-50">
                            <tr><th className="p-2 text-left">Table</th><th className="p-2 text-right">Rows</th><th className="p-2 text-right">Size (MB)</th></tr>
                        </thead>
                        <tbody>
                            {data.database.tables.map((t: any, i: number) => (
                                <tr key={i} className="border-t">
                                    <td className="p-2 font-mono">{t.name}</td>
                                    <td className="p-2 text-right">{Number(t.row_count ?? t.rows ?? 0).toLocaleString()}</td>
                                    <td className="p-2 text-right">{t.mb}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </InfoBox>
        </div>
    );
}

function InfoBox({ title, icon: Icon, children, className }: any) {
    return (
        <div className={cn("border rounded-xl bg-white", className)}>
            <div className="px-4 py-3 bg-violet-50 border-b flex items-center gap-2">
                <Icon className="w-4 h-4 text-violet-600" />
                <h3 className="font-semibold text-violet-800">{title}</h3>
            </div>
            <div className="p-4 space-y-2">{children}</div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium text-gray-800">{value}</span>
        </div>
    );
}
