import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/Layouts/MainLayout";
import FiscalYearSelector from "@/Components/FiscalYearSelector";
import { usePage, router } from "@inertiajs/react";
import {
    Trash2, PlusCircle, Search, Users, AlertTriangle, CheckCircle, User,
    TrendingUp, TrendingDown, Calendar, BarChart3, Target, Gauge, Crown,
    Clock, Brain, Shield, Info, Database, RefreshCw, Filter,
    ChevronLeft, ChevronRight, MoreHorizontal, Plus, X, Star, Zap, Timer,
    FlameKindling, Upload, FileSpreadsheet, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Select from "react-select";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const translateAngleToThai = (angle: string) => ({ top: "บน", bottom: "ล่าง", left: "ซ้าย", right: "ขวา", self: "ตนเอง" } as Record<string,string>)[angle] || angle;

const formatUserDetails = (user: any) => {
    if (!user) return "ไม่พบข้อมูล";
    return `ตำแหน่ง: ${user.position?.title || user.position_title || "ไม่ระบุ"}, กอง: ${user.department?.name || user.department_name || "ไม่ระบุ"}, ฝ่าย: ${user.faction?.name || user.faction_name || "ไม่ระบุ"}, สายงาน: ${user.division?.name || user.division_name || "ไม่ระบุ"}`;
};
const formatUserName = (user: any) => user ? `${user.fname} ${user.lname}` : "ไม่พบข้อมูล";

/* ---- Reusable UI Components ---- */
const MetricCard = ({ title, value, subtitle, icon: Icon, color, badge }: any) => (
    <div className="glass-card rounded-2xl overflow-hidden relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
        <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}><Icon className="w-6 h-6 text-white" /></div>
                {badge && <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 text-xs font-semibold rounded-full">{badge}</span>}
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{typeof value === "number" ? value.toLocaleString() : value}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
    </div>
);

const ProgressRing = ({ percentage, size = 120, strokeWidth = 8, color = "#7c3aed", label }: any) => {
    const r = (size - strokeWidth) / 2, c = r * 2 * Math.PI;
    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-gray-200 dark:text-gray-700" />
                <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={`${c} ${c}`} strokeDashoffset={c - (percentage/100)*c} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
                {label && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>}
            </div>
        </div>
    );
};

const InsightCard = ({ insight }: any) => {
    const s: Record<string,string> = { success: "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700", warning: "border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700", danger: "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700", info: "border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-700" };
    const ic: Record<string,string> = { success: "text-green-600 dark:text-green-400", warning: "text-amber-600 dark:text-amber-400", danger: "text-red-600 dark:text-red-400", info: "text-violet-600 dark:text-violet-400" };
    return (
        <div className={`p-4 rounded-xl border-2 ${s[insight.type]}`}>
            <div className="flex items-start space-x-3">
                <div className="text-2xl">{insight.icon}</div>
                <div className="flex-1">
                    <h4 className={`font-medium ${ic[insight.type]} mb-1`}>{insight.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{insight.message}</p>
                </div>
            </div>
        </div>
    );
};

const AngleChart = ({ data }: any) => {
    const angles = ["บน","ล่าง","ซ้าย","ขวา"], colors = ["#7c3aed","#d946ef","#a855f7","#6366f1"];
    return (
        <div className="grid grid-cols-2 gap-4">
            {angles.map((a,i) => { const it = data[a] || { count:0, percentage:0 }; return (
                <div key={a} className="bg-violet-50/50 dark:bg-violet-900/10 rounded-xl p-4 text-center hover:bg-violet-100/50 dark:hover:bg-violet-900/20 transition-all">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">องศา{a}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{it.count.toLocaleString()}</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2"><div className="h-2 rounded-full transition-all duration-700" style={{ width:`${it.percentage}%`, backgroundColor:colors[i] }} /></div>
                </div>
            ); })}
        </div>
    );
};

const TimelineChart = ({ data }: any) => {
    if (!data?.length) return <div className="text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูลกิจกรรม</div>;
    const mx = Math.max(...data.map((d:any) => d.daily_count));
    return (
        <div className="space-y-3">
            {data.slice(-10).map((day:any,i:number) => (
                <div key={i} className="flex items-center justify-between hover:bg-violet-50 dark:hover:bg-violet-900/10 p-2 rounded-lg transition-all">
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">{new Date(day.date).toLocaleDateString("th-TH",{month:"short",day:"numeric"})}</div>
                    <div className="flex items-center space-x-3 flex-1 ml-4">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"><div className="gradient-primary h-2 rounded-full transition-all duration-700" style={{width:`${mx>0?(day.daily_count/mx)*100:0}%`}} /></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex-shrink-0">{day.daily_count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TopPerformerCard = ({ performer, rank, type = "evaluator" }: any) => {
    const rc: Record<number,string> = { 1:"from-violet-400 to-violet-600", 2:"from-gray-300 to-gray-500", 3:"from-fuchsia-400 to-fuchsia-600" };
    return (
        <div className="flex items-center justify-between p-3 glass-card rounded-xl hover:shadow-md transition-all group">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rc[rank]||"from-purple-400 to-purple-600"} flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>{rank}</div>
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">{formatUserName(performer)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">เกรด C{performer.grade}{type==="evaluator"&&performer.unique_evaluatees?` | ประเมิน ${performer.unique_evaluatees} คน`:""}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate" title={formatUserDetails(performer)}>{performer.position?.title||"ไม่ระบุตำแหน่ง"}</div>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
                <div className="text-lg font-bold text-violet-600 dark:text-violet-400">{type==="evaluator"?performer.evaluation_count:performer.times_evaluated}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ครั้ง</div>
            </div>
        </div>
    );
};

/* ---- Main Component ---- */
export default function AdminEvaluationAssignmentManager() {
    const { assignments, card_data, fiscal_years, selected_year, analytics, view_type = 'card', filters = {} } = usePage<any>().props;

    const globalAngleData = useMemo(() => {
        const counts: Record<string,number> = { บน:0, ล่าง:0, ซ้าย:0, ขวา:0 };
        if (card_data?.groups && Array.isArray(card_data.groups)) {
            card_data.groups.forEach((g:any) => { if (g.assignments && typeof g.assignments === 'object') Object.entries(g.assignments).forEach(([a,aa]:[string,any]) => { const t=translateAngleToThai(a); if(counts[t]!==undefined&&Array.isArray(aa)) counts[t]+=aa.length; }); });
        } else if (Array.isArray(assignments?.data)) {
            assignments.data.forEach((a:any) => { if(a?.angle){ const t=translateAngleToThai(a.angle); if(counts[t]!==undefined) counts[t]++; }});
        }
        const total = Object.values(counts).reduce((s,c)=>s+c,0);
        return Object.entries(counts).reduce((acc,[a,c])=>{ acc[a]={count:c,percentage:total>0?Math.round((c/total)*100):0}; return acc; },{} as Record<string,{count:number;percentage:number}>);
    }, [assignments?.data, card_data]);

    const [selectedYear, setSelectedYear] = useState({value:selected_year,label:`ปีงบประมาณ ${parseInt(selected_year)+543}`});
    const [dashboardView, setDashboardView] = useState("overview");
    const [currentView, setCurrentView] = useState(view_type);
    const [searchTerm, setSearchTerm] = useState((filters as any).search||"");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterGrade, setFilterGrade] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [cardPage, setCardPage] = useState(1);
    const [cardPerPage, setCardPerPage] = useState(8);

    // Import Excel state
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importFiscalYear, setImportFiscalYear] = useState(selected_year);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);

    const handleImportExcel = async (dryRun: boolean) => {
        if (!importFile) { toast.error("กรุณาเลือกไฟล์ Excel"); return; }
        setImporting(true);
        setImportResult(null);
        try {
            const formData = new FormData();
            formData.append("file", importFile);
            formData.append("fiscal_year", importFiscalYear);
            formData.append("dry_run", dryRun ? "1" : "0");
            formData.append("_token", document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "");

            const res = await fetch(route("assignments.import-excel"), {
                method: "POST",
                body: formData,
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });
            const json = await res.json();
            setImportResult(json);
            if (json.success && !dryRun && json.created > 0) {
                toast.success(`นำเข้าสำเร็จ ${json.created} รายการ`);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการนำเข้า");
        } finally {
            setImporting(false);
        }
    };

    const nav = (extra:any={}) => { setIsLoading(true); router.visit(route("assignments.index"),{method:"get",data:{fiscal_year:selectedYear.value,view:currentView,search:searchTerm,...extra},preserveState:true,preserveScroll:true,only:["assignments","card_data","analytics"],onFinish:()=>setIsLoading(false)}); };

    const handleSearch = useMemo(()=>{let t:any;return(v:string)=>{clearTimeout(t);t=setTimeout(()=>{setIsLoading(true);router.visit(route("assignments.index"),{method:"get",data:{fiscal_year:selectedYear.value,view:currentView,search:v},preserveState:true,preserveScroll:true,only:["assignments","card_data","analytics"],onFinish:()=>setIsLoading(false)});},500);};},[selectedYear.value,currentView]);

    useEffect(()=>{if(searchTerm!==((filters as any).search||''))handleSearch(searchTerm);},[searchTerm]);
    useEffect(()=>{if(selectedYear.value!==selected_year)nav();},[selectedYear]);

    const globalStats = useMemo(()=>({total:analytics?.totalParticipants||0,complete:analytics?.completedEvaluations||0,incomplete:analytics?.pendingEvaluations||0,completionRateAll:analytics?.overallCompletionRate||0}),[analytics]);

    const fuzzySearch=(text:string,term:string)=>{if(!text||!term)return false;if(text.toLowerCase().replace(/\s+/g,"").includes(term.toLowerCase().replace(/\s+/g,"")))return true;return term.toLowerCase().split(/\s+/).every(w=>text.toLowerCase().includes(w));};

    const filteredCardData = useMemo(()=>{
        if(!card_data?.groups||!Array.isArray(card_data.groups))return[];
        return card_data.groups.filter((g:any)=>{
            const ev=g.evaluator||{},fn=ev.fname||'',ln=ev.lname||'',full=`${fn} ${ln}`.trim();
            const nm=searchTerm===""||fuzzySearch(full,searchTerm)||fuzzySearch(fn,searchTerm)||fuzzySearch(ln,searchTerm)||fuzzySearch(ev.position?.title||"",searchTerm)||fuzzySearch(ev.department?.name||"",searchTerm);
            const te=g.stats?.total_evaluatees||0;
            const sm=filterStatus==="all"||(filterStatus==="complete"&&te>0)||(filterStatus==="incomplete"&&te===0);
            const eg=ev.grade||0;
            const gm=filterGrade==="all"||(filterGrade==="5-8"&&eg>=5&&eg<=8)||(filterGrade==="9-12"&&eg>=9&&eg<=12);
            return nm&&sm&&gm;
        });
    },[card_data,searchTerm,filterStatus,filterGrade]);

    const paginatedCardData = useMemo(()=>{const s=(cardPage-1)*cardPerPage,e=s+cardPerPage;return{data:filteredCardData.slice(s,e),currentPage:cardPage,totalPages:Math.ceil(filteredCardData.length/cardPerPage),totalItems:filteredCardData.length,hasNextPage:e<filteredCardData.length,hasPrevPage:cardPage>1};},[filteredCardData,cardPage,cardPerPage]);

    const handleDelete=(id:number)=>{if(confirm("คุณต้องการลบรายการนี้หรือไม่?"))router.delete(route("assignments.destroy",{assignment:id}));};

    const getAngleColor=(angle:string)=>{const t=translateAngleToThai(angle);return({บน:"bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200 border-violet-200",ล่าง:"bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 border-fuchsia-200",ซ้าย:"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border-purple-200",ขวา:"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 border-indigo-200"} as Record<string,string>)[t]||"bg-gray-100 text-gray-800";};

    /* ---- OVERVIEW ---- */
    const renderOverview = () => (
        <div className="space-y-8">
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard title="ผู้เข้าร่วม" value={analytics?.totalParticipants||0} subtitle="จำนวนผู้ที่เข้าร่วมการประเมิน" icon={Users} color="from-violet-500 to-violet-600" />
                <MetricCard title="เสร็จสิ้น" value={analytics?.completedEvaluations||0} subtitle="ผู้ที่ตอบคำถามครบถ้วนแล้ว" icon={CheckCircle} color="from-fuchsia-500 to-fuchsia-600" />
                <MetricCard title="รอดำเนินการ" value={analytics?.pendingEvaluations||0} subtitle="ผู้ที่ยังไม่เสร็จสิ้น" icon={Clock} color="from-purple-500 to-purple-600" />
                <MetricCard title="อัตราความสำเร็จ" value={`${analytics?.overallCompletionRate||0}%`} subtitle="ความครบถ้วนของการประเมิน" icon={Target} color="from-indigo-500 to-indigo-600" badge={(analytics?.overallCompletionRate||0)>=85?"ดีเยี่ยม":(analytics?.overallCompletionRate||0)>=70?"ดี":undefined} />
            </motion.div>

            {analytics?.insights && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white"><Brain className="w-5 h-5 mr-2 text-violet-600" />ข้อมูลเชิงลึก</h3>
                        <div className="space-y-4">
                            {analytics.insights.insights?.map((ins:any,i:number)=><InsightCard key={i} insight={ins}/>)}
                            {analytics.insights.alerts?.map((a:any,i:number)=><InsightCard key={`a-${i}`} insight={a}/>)}
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white"><Shield className="w-5 h-5 mr-2 text-green-600" />สุขภาพระบบ</h3>
                        <div className="flex flex-col items-center">
                            <ProgressRing percentage={analytics?.performance?.system_health?.health_score||0} label="คะแนนรวม" />
                            <div className="mt-4 w-full space-y-3">
                                {[{l:"ความครบถ้วน",v:`${analytics?.completion?.summary?.completion_rate||0}%`},{l:"การใช้งาน",v:`${analytics?.kpis?.efficiency_metrics?.system_utilization||0}%`},{l:"การเติบโต",v:`${analytics?.kpis?.growth_rates?.relationships||0}%`}].map((s,i)=>(
                                    <div key={i} className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">{s.l}</span><span className="font-medium text-gray-900 dark:text-white">{s.v}</span></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card rounded-2xl p-6"><h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white"><BarChart3 className="w-5 h-5 mr-2 text-violet-600" />การกระจายตามองศา</h3><AngleChart data={globalAngleData} /></div>
                <div className="glass-card rounded-2xl p-6"><h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white"><Clock className="w-5 h-5 mr-2 text-violet-600" />กิจกรรมล่าสุด</h3><TimelineChart data={analytics?.timeline?.daily_activity||[]} /></div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white"><Crown className="w-5 h-5 mr-2 text-violet-600" />ผู้ประเมินยอดเยี่ยม</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analytics?.people?.top_evaluators?.slice(0,12).map((ev:any,i:number)=><TopPerformerCard key={ev.id||i} performer={ev} rank={i+1} type="evaluator"/>)}
                        {(!analytics?.people?.top_evaluators||analytics.people.top_evaluators.length===0)&&<div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400"><BarChart3 className="w-12 h-12 mx-auto mb-2 text-violet-300" /><p className="text-sm">ยังไม่มีข้อมูลการประเมิน</p></div>}
                    </div>
                </div>
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white"><BarChart3 className="w-5 h-5 mr-2 text-violet-600" />สถิติผู้ประเมิน</h3>
                    <div className="space-y-4">
                        {[{l:"ผู้ถูกประเมินเฉลี่ย/ผู้ประเมิน",v:analytics?.kpis?.efficiency_metrics?.avg_evaluatees_per_evaluator||0,c:"text-violet-600 dark:text-violet-400",b:"bg-violet-50 dark:bg-violet-900/20"},{l:"องศาที่ใช้งาน",v:analytics?.kpis?.unique_angles||0,c:"text-fuchsia-600 dark:text-fuchsia-400",b:"bg-fuchsia-50 dark:bg-fuchsia-900/20"},{l:"วันที่มีกิจกรรม",v:analytics?.timeline?.insights?.total_active_days||0,c:"text-purple-600 dark:text-purple-400",b:"bg-purple-50 dark:bg-purple-900/20"},{l:"อัตราการใช้งานระบบ",v:`${analytics?.kpis?.efficiency_metrics?.system_utilization||0}%`,c:"text-indigo-600 dark:text-indigo-400",b:"bg-indigo-50 dark:bg-indigo-900/20"}].map((s,i)=>(
                            <div key={i} className={`p-4 ${s.b} rounded-xl`}><div className={`text-2xl font-bold ${s.c}`}>{s.v}</div><div className="text-sm text-gray-600 dark:text-gray-400">{s.l}</div></div>
                        ))}
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white"><Users className="w-5 h-5 mr-2 text-violet-600" />การวิเคราะห์กิจกรรมผู้ประเมิน</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{l:"ผู้ถูกประเมินต่อผู้ประเมิน",v:analytics?.kpis?.efficiency_metrics?.avg_evaluatees_per_evaluator||0,c:"from-violet-500 to-violet-600"},{l:"ผู้ประเมินที่ทำเสร็จ",v:analytics?.completion?.summary?.complete_count||0,c:"from-fuchsia-500 to-fuchsia-600"},{l:"องศาที่มีการใช้งาน",v:analytics?.kpis?.unique_angles||0,c:"from-purple-500 to-purple-600"},{l:"วันที่มีกิจกรรมประเมิน",v:analytics?.timeline?.insights?.total_active_days||0,c:"from-indigo-500 to-indigo-600"}].map((s,i)=>(
                        <div key={i} className={`bg-gradient-to-br ${s.c} rounded-xl p-4 text-white text-center`}><div className="text-2xl font-bold">{s.v}</div><div className="text-sm opacity-90">{s.l}</div></div>
                    ))}
                </div>
            </motion.div>
        </div>
    );

    /* ---- CARD VIEW ---- */
    const renderCardView = () => (
        <div className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {[{l:"ผู้เข้าร่วม",v:analytics?.totalParticipants||0,c:"from-violet-500 to-violet-600"},{l:"เสร็จสิ้น",v:analytics?.completedEvaluations||0,c:"from-fuchsia-500 to-fuchsia-600"},{l:"รอดำเนินการ",v:analytics?.pendingEvaluations||0,c:"from-purple-500 to-purple-600"},{l:"% ความสำเร็จ",v:`${analytics?.overallCompletionRate||0}%`,c:"from-indigo-500 to-indigo-600"}].map((it,i)=>(
                        <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${it.c} p-6 text-white shadow-lg`}>
                            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" /></div>
                            <div className="relative z-10"><div className="text-3xl font-bold mb-1">{it.v}</div><p className="text-sm font-medium opacity-90">{it.l}</p></div>
                        </div>
                    ))}
                </div>
                {(searchTerm||filterStatus!=="all"||filterGrade!=="all")&&(
                    <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border-l-4 border-violet-500">
                        <div className="flex items-center text-violet-700 dark:text-violet-300"><Info className="w-5 h-5 mr-2"/><span className="font-medium">ข้อมูลที่แสดงถูกกรองตามเงื่อนไข</span></div>
                    </div>
                )}
            </motion.div>

            {paginatedCardData.totalPages>1&&(
                <div className="glass-card rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">แสดง {(cardPage-1)*cardPerPage+1} - {Math.min(cardPage*cardPerPage,filteredCardData.length)} จากทั้งหมด {filteredCardData.length}</span>
                            <select value={cardPerPage} onChange={e=>{setCardPerPage(Number(e.target.value));setCardPage(1);}} className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-violet-500 dark:bg-zinc-800 dark:text-white">
                                {[4,8,12,20].map(n=><option key={n} value={n}>{n} รายการ</option>)}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            {[{l:"แรก",fn:()=>setCardPage(1),d:!paginatedCardData.hasPrevPage,icon:<ChevronLeft className="w-4 h-4 mr-1"/>},{l:"ก่อนหน้า",fn:()=>setCardPage(cardPage-1),d:!paginatedCardData.hasPrevPage,icon:<ChevronLeft className="w-4 h-4 mr-1"/>}].map((b,i)=>(
                                <button key={i} onClick={b.fn} disabled={b.d} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">{b.icon}{b.l}</button>
                            ))}
                            <span className="px-4 py-2 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl">หน้า {cardPage}/{paginatedCardData.totalPages}</span>
                            {[{l:"ถัดไป",fn:()=>setCardPage(cardPage+1),d:!paginatedCardData.hasNextPage,icon:<ChevronRight className="w-4 h-4 ml-1"/>},{l:"สุดท้าย",fn:()=>setCardPage(paginatedCardData.totalPages),d:!paginatedCardData.hasNextPage,icon:<ChevronRight className="w-4 h-4 ml-1"/>}].map((b,i)=>(
                                <button key={i} onClick={b.fn} disabled={b.d} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">{b.l}{b.icon}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedCardData.data.map((group:any,index:number)=>{
                    const te=group.stats.total_evaluatees,ua=group.stats.unique_angles,ic=group.stats.is_complete;
                    return(
                        <motion.div key={`${group.evaluator?.id||index}-${index}`} variants={itemVariants} className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                            <div className={cn("px-6 py-4 text-white relative overflow-hidden",te>0?"gradient-primary":"bg-gradient-to-r from-gray-500 to-gray-600")}>
                                <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transform rotate-12 scale-150"/></div>
                                <div className="relative flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className={cn("p-3 rounded-full shadow-lg backdrop-blur-sm",te>0?"bg-violet-600/30":"bg-gray-600/30")}><User className="w-6 h-6"/></div>
                                        <div><h3 className="text-xl font-bold">{group.evaluator?`${group.evaluator.fname} ${group.evaluator.lname}`:"ไม่พบข้อมูล"}</h3></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="relative inline-flex items-center justify-center w-16 h-16">
                                            <svg className="w-16 h-16 transform -rotate-90"><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/30"/><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-ua/4)}`} strokeLinecap="round" className="text-white transition-all duration-1000 ease-out"/></svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-bold">{te}</span></div>
                                        </div>
                                        <div className="text-xs mt-1">{ua}/4 องศา</div>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center"><Star className="w-4 h-4 mr-2"/><span>เกรด C{group.evaluator?.grade||"-"}</span></div>
                                        <div className="flex items-center"><Users className="w-4 h-4 mr-2"/><span>{te} ผู้ถูกประเมิน</span></div>
                                        <div className="flex items-center"><Target className="w-4 h-4 mr-2"/><span>{ua} องศา</span></div>
                                        <div className="flex items-center"><span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">#{(cardPage-1)*cardPerPage+index+1}</span></div>
                                    </div>
                                    {group.evaluator&&<div className="mt-2 text-xs opacity-90"><div>ตำแหน่ง: {group.evaluator.position?.title||"ไม่ระบุ"}</div><div>หน่วยงาน: {group.evaluator.department?.name||"ไม่ระบุ"}</div></div>}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-6 p-4 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center"><Gauge className="w-4 h-4 mr-2 text-violet-500"/>สรุปสถานะ</h4>
                                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium",ic?"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400":"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400")}>{ic?"ครบถ้วน":"ไม่ครบ"}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="text-center"><div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{group.stats.completed_angles}</div><div className="text-gray-600 dark:text-gray-400">องศาที่มี</div></div>
                                        <div className="text-center"><div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{group.stats.required_angles_count}</div><div className="text-gray-600 dark:text-gray-400">องศาที่ต้องการ</div></div>
                                        <div className="text-center"><div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">{group.stats.total_evaluatees}</div><div className="text-gray-600 dark:text-gray-400">ผู้ถูกประเมินรวม</div></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {group.required_angles.map((angle:string)=>{
                                        const aa=group.assignments?.[angle]||[],has=aa.length>0,at=translateAngleToThai(angle),atFull=translateAngleToThai(angle);
                                        return(
                                            <div key={angle} className={cn("border-2 border-dashed rounded-xl p-4 transition-all",has?"border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-600":"border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/10")}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span title={atFull} className={`px-3 py-1 rounded-full text-sm font-medium border ${getAngleColor(angle)}`}>องศา{at}</span>
                                                    <div className="flex items-center space-x-1"><Users className="w-4 h-4 text-gray-500"/><span className="text-sm font-medium text-gray-600 dark:text-gray-400">{aa.length}</span></div>
                                                </div>
                                                {has?(
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {aa.map((a:any)=>(
                                                            <div key={a.id} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-gray-700 group hover:shadow-sm transition-all">
                                                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{a.evaluatee?.fname?.charAt(0)||"?"}</div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{formatUserName(a.evaluatee)}</div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">เกรด C{a.evaluatee?.grade||"-"}</div>
                                                                    </div>
                                                                </div>
                                                                <button onClick={()=>handleDelete(a.id)} className="text-red-500 hover:text-red-700 p-1 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all"><Trash2 className="w-4 h-4"/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ):(
                                                    <div className="text-gray-500 dark:text-gray-400 text-center py-8"><User className="w-8 h-8 mx-auto mb-2 text-violet-300 dark:text-violet-600"/><div className="text-sm font-medium">ยังไม่มีผู้ถูกประเมิน</div></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-3 text-sm">
                                            <span className="flex items-center text-violet-600 dark:text-violet-400"><Users className="w-4 h-4 mr-1"/>ผู้ถูกประเมิน: {te} คน</span>
                                            <span className="flex items-center text-purple-600 dark:text-purple-400"><Target className="w-4 h-4 mr-1"/>องศา: {ua}/4</span>
                                        </div>
                                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium",te>=4?"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400":te>=2?"bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400":te>=1?"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400":"bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400")}>{te>=4?"ครบเครื่อง":te>=2?"ดีมาก":te>=1?"เริ่มดี":"ยังไม่มีงาน"}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {paginatedCardData.totalPages>1&&(
                <div className="flex justify-center">
                    <div className="flex items-center space-x-2 glass-card rounded-2xl p-4">
                        {Array.from({length:Math.min(7,paginatedCardData.totalPages)},(_,i)=>{
                            let p;if(paginatedCardData.totalPages<=7)p=i+1;else if(cardPage<=4)p=i+1;else if(cardPage>=paginatedCardData.totalPages-3)p=paginatedCardData.totalPages-6+i;else p=cardPage-3+i;
                            return <button key={p} onClick={()=>setCardPage(p)} className={cn("px-3 py-2 text-sm rounded-xl transition-colors",cardPage===p?"gradient-primary text-white shadow-lg":"bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30")}>{p}</button>;
                        })}
                        {paginatedCardData.totalPages>7&&cardPage<paginatedCardData.totalPages-3&&(<><span className="px-2 text-gray-500"><MoreHorizontal className="w-4 h-4"/></span><button onClick={()=>setCardPage(paginatedCardData.totalPages)} className="px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30">{paginatedCardData.totalPages}</button></>)}
                    </div>
                </div>
            )}
        </div>
    );

    /* ---- TABLE VIEW ---- */
    const renderTable = () => (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
            <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                <thead><tr className="bg-violet-50 dark:bg-violet-900/20">
                    {["ผู้ประเมิน","ผู้ถูกประเมิน","เกรด","องศา","ปีงบ","การจัดการ"].map(h=><th key={h} className="px-6 py-4 text-left text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(assignments?.data||[]).map((a:any,i:number)=>(
                        <tr key={a.id} className={cn("hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors",i%2!==0&&"bg-violet-50/20 dark:bg-violet-900/5")}>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-medium flex-shrink-0">{a.evaluator?.fname?.charAt(0)||"?"}</div><div className="ml-3 min-w-0 flex-1"><div className="text-sm font-medium text-gray-900 dark:text-white">{formatUserName(a.evaluator)}</div><div className="text-sm text-gray-500 dark:text-gray-400">เกรด C{a.evaluator?.grade||"-"}</div></div></div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">{a.evaluatee?.fname?.charAt(0)||"?"}</div><div className="ml-3"><div className="text-sm font-medium text-gray-900 dark:text-white">{a.evaluatee?`${a.evaluatee.fname} ${a.evaluatee.lname}`:"ไม่พบข้อมูล"}</div></div></div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200">C{a.evaluatee?.grade||"-"}</span></td>
                            <td className="px-6 py-4 whitespace-nowrap"><span title={translateAngleToThai(a.angle)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAngleColor(a.angle)}`}>องศา{translateAngleToThai(a.angle)||"-"}</span></td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{parseInt(a.fiscal_year)+543}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center"><button onClick={()=>handleDelete(a.id)} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"><Trash2 className="w-4 h-4"/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </motion.div>
    );

    return (
        <MainLayout title="จัดการผู้ประเมิน-ผู้ถูกประเมิน" breadcrumb={<Breadcrumb items={[{label:"แดชบอร์ดผู้ดูแลระบบ",href:route("admindashboard")},{label:"จัดการผู้ประเมิน-ผู้ถูกประเมิน",active:true}]}/>}>
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div className="max-w-7xl mx-auto py-10 px-2 sm:px-6 space-y-8" variants={containerVariants} initial="hidden" animate="visible">
                    {/* Header */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25"><BarChart3 className="w-7 h-7"/></div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-gradient-primary">Analytics Dashboard</h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">ระบบวิเคราะห์และติดตามการประเมินผลแบบ 360 องศา</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <FiscalYearSelector
                                    value={selectedYear?.value || selected_year || ""}
                                    years={fiscal_years}
                                    onChange={(v) => setSelectedYear({value: v, label: `ปีงบประมาณ ${parseInt(v)+543}`})}
                                    variant="filter"
                                />
                                <div className="flex items-center bg-violet-100 dark:bg-violet-900/20 rounded-xl p-1">
                                    {[{id:"overview",icon:BarChart3,label:"ภาพรวม"},{id:"cards",icon:Target,label:"การ์ด"},{id:"table",icon:Database,label:"ตาราง"}].map(v=>(
                                        <button key={v.id} onClick={()=>setDashboardView(v.id)} className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center",dashboardView===v.id?"bg-white dark:bg-zinc-900 text-violet-600 shadow-sm":"text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400")}>
                                            <v.icon className="w-4 h-4 mr-2"/>{v.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={()=>window.location.reload()} className="p-2 text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors" title="รีเฟรช"><RefreshCw className="w-5 h-5"/></button>
                                    <button onClick={()=>setShowImportDialog(true)} className={cn("inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-md")}><Upload className="w-4 h-4 mr-2"/>นำเข้า Excel</button>
                                    <a href={route("assignments.create")} className={cn("inline-flex items-center px-5 py-2.5 gradient-primary text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-violet-500/25")}><Plus className="w-5 h-5 mr-2"/>เพิ่มความสัมพันธ์</a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Search for Card View */}
                    {dashboardView==="cards"&&(
                        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ค้นหาผู้ประเมิน</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                                        <input type="text" placeholder="พิมพ์ชื่อหรือนามสกุลผู้ประเมิน..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"/>
                                        {searchTerm&&<button onClick={()=>setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>}
                                    </div>
                                </div>
                                <div className="lg:w-56">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">สถานะ</label>
                                    <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 dark:bg-gray-800 dark:text-white">
                                        <option value="all">ทั้งหมด</option><option value="complete">ครบถ้วน</option><option value="incomplete">ไม่ครบถ้วน</option>
                                    </select>
                                </div>
                                <div className="lg:w-56">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">เกรด</label>
                                    <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)} className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 dark:bg-gray-800 dark:text-white">
                                        <option value="all">ทุกเกรด</option><option value="5-8">C5-C8</option><option value="9-12">C9-C12</option>
                                    </select>
                                </div>
                            </div>
                            {(searchTerm||filterStatus!=="all"||filterGrade!=="all")&&(
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">กำลังกรอง:</span>
                                    {searchTerm&&<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">{searchTerm}<button onClick={()=>setSearchTerm("")} className="ml-2 hover:text-violet-600"><X className="w-3 h-3"/></button></span>}
                                    {filterStatus!=="all"&&<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300">{filterStatus==="complete"?"ครบถ้วน":"ไม่ครบ"}<button onClick={()=>setFilterStatus("all")} className="ml-2 hover:text-fuchsia-600"><X className="w-3 h-3"/></button></span>}
                                    {filterGrade!=="all"&&<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">{filterGrade}<button onClick={()=>setFilterGrade("all")} className="ml-2 hover:text-purple-600"><X className="w-3 h-3"/></button></span>}
                                    <button onClick={()=>{setSearchTerm("");setFilterStatus("all");setFilterGrade("all");}} className="text-xs text-gray-500 hover:text-violet-600 underline">ล้างทั้งหมด</button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {dashboardView==="overview"&&renderOverview()}
                    {dashboardView==="cards"&&renderCardView()}
                    {dashboardView==="table"&&renderTable()}

                    {dashboardView==="table"&&assignments?.links&&assignments.links.length>3&&(
                        <div className="flex justify-center mt-8"><div className="flex gap-2 flex-wrap">
                            {assignments.links.map((link:any,i:number)=>(
                                <button key={i} disabled={!link.url} onClick={()=>link.url&&router.visit(link.url,{preserveScroll:true,preserveState:true,data:{fiscal_year:selectedYear.value}})} dangerouslySetInnerHTML={{__html:link.label}} className={cn("px-4 py-2 border rounded-xl text-sm font-medium transition-all",link.active?"gradient-primary text-white border-violet-600 shadow-lg":"bg-white text-gray-700 border-gray-300 hover:bg-violet-50 dark:bg-zinc-800 dark:text-white dark:border-gray-600 dark:hover:bg-violet-900/20",!link.url?"opacity-50 cursor-not-allowed":"hover:shadow-md")} />
                            ))}
                        </div></div>
                    )}

                    {dashboardView==="cards"&&filteredCardData.length===0&&(
                        <motion.div variants={itemVariants} className="text-center py-16 glass-card rounded-2xl">
                            {searchTerm||filterStatus!=="all"||filterGrade!=="all"?(
                                <><Search className="w-16 h-16 mx-auto mb-6 text-violet-300 dark:text-violet-600"/><h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ไม่พบผลการค้นหา</h3><p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">{searchTerm&&<span>ไม่พบผู้ประเมินที่ตรงกับ "<strong>{searchTerm}</strong>" </span>}ลองเปลี่ยนคำค้นหาหรือปรับเงื่อนไข</p>
                                <div className="flex justify-center space-x-4">
                                    <button onClick={()=>{setSearchTerm("");setFilterStatus("all");setFilterGrade("all");}} className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"><X className="w-5 h-5 mr-2"/>ล้างการค้นหา</button>
                                    <a href={route("assignments.create")} className={cn("inline-flex items-center px-6 py-3 gradient-primary text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-violet-500/25")}><PlusCircle className="w-5 h-5 mr-2"/>เพิ่มความสัมพันธ์ใหม่</a>
                                </div></>
                            ):(
                                <><Database className="w-16 h-16 mx-auto mb-6 text-violet-300 dark:text-violet-600"/><h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ยังไม่มีข้อมูลผู้ประเมิน</h3><p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">เริ่มต้นสร้างความสัมพันธ์การประเมินเพื่อดูข้อมูลในหน้านี้</p>
                                <a href={route("assignments.create")} className={cn("inline-flex items-center px-6 py-3 gradient-primary text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-violet-500/25")}><PlusCircle className="w-5 h-5 mr-2"/>เพิ่มความสัมพันธ์แรก</a></>
                            )}
                        </motion.div>
                    )}

                    {(dashboardView==="cards"||dashboardView==="table")&&(
                        <motion.div variants={itemVariants} className="gradient-primary rounded-2xl shadow-lg p-6 text-white">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[{icon:FlameKindling,label:"ความสัมพันธ์รวม",value:card_data?.summary?.total_relationships||0},{icon:Users,label:"ผู้ประเมิน",value:card_data?.summary?.total_evaluators||0},{icon:CheckCircle,label:"ผู้ถูกประเมิน",value:card_data?.summary?.total_relationships||0},{icon:Timer,label:"เฉลี่ย/คน",value:card_data?.summary?.avg_evaluatees_per_evaluator||0}].map((s,i)=>(
                                    <div key={i} className="text-center"><div className="flex items-center justify-center mb-2"><s.icon className="w-6 h-6 mr-2"/><span className="text-sm font-medium opacity-90">{s.label}</span></div><div className="text-3xl font-bold">{s.value}</div></div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
            {/* Import Excel Dialog */}
            {showImportDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !importing && setShowImportDialog(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">นำเข้าจาก Excel</h2>
                                <p className="text-xs text-gray-500">อัปโหลดไฟล์ .xlsx ที่มีข้อมูลจับคู่ผู้ประเมิน</p>
                            </div>
                            <button onClick={() => !importing && setShowImportDialog(false)} className="ml-auto p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        {/* File input */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">ไฟล์ Excel (.xlsx)</label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
                                    className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-violet-100 file:text-violet-700 dark:file:bg-violet-900/40 dark:file:text-violet-300"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">รูปแบบ: Sheet2 มีคอลัมน์ A=รหัส, J=ตนเอง, K=องศาบน, L=องศาล่าง, M=องศาซ้าย</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">ปีงบประมาณ (ค.ศ.)</label>
                                <select
                                    value={importFiscalYear}
                                    onChange={(e) => setImportFiscalYear(e.target.value)}
                                    className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700"
                                >
                                    {fiscal_years.map((fy: any) => (
                                        <option key={fy} value={fy}>พ.ศ. {Number(fy) + 543} (ค.ศ. {fy})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Result */}
                            {importResult && (
                                <div className={cn("rounded-xl p-4 text-sm", importResult.success ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700")}>
                                    <p className="font-semibold mb-1">{importResult.message}</p>
                                    {importResult.dry_run && <p className="text-xs text-amber-600 mb-2">** โหมดทดสอบ - ยังไม่ได้บันทึกจริง **</p>}
                                    {importResult.errors?.length > 0 && (
                                        <details className="mt-2">
                                            <summary className="text-xs cursor-pointer text-gray-600 dark:text-gray-400">รายการที่ไม่พบ ({importResult.errors.length})</summary>
                                            <ul className="mt-1 max-h-32 overflow-y-auto text-[11px] text-gray-500 space-y-0.5">
                                                {importResult.errors.map((e: string, i: number) => <li key={i}>• {e}</li>)}
                                            </ul>
                                        </details>
                                    )}
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleImportExcel(true)}
                                    disabled={!importFile || importing}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-40 transition-all"
                                >
                                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    ทดสอบก่อน
                                </button>
                                <button
                                    onClick={() => handleImportExcel(false)}
                                    disabled={!importFile || importing}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-all"
                                >
                                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    นำเข้าจริง
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </MainLayout>
    );
}
