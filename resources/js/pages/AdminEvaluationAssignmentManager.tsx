import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/Layouts/MainLayout";
import FiscalYearSelector from "@/Components/FiscalYearSelector";
import { usePage, router } from "@inertiajs/react";
import {
    Trash2, PlusCircle, Search, Users, AlertTriangle, CheckCircle, User,
    TrendingUp, TrendingDown, Calendar, BarChart3, Target, Gauge, Crown,
    Clock, Brain, Shield, Info, Database, RefreshCw, Filter,
    ChevronLeft, ChevronRight, MoreHorizontal, Plus, X, Star, Zap, Timer,
    FlameKindling, Upload, FileSpreadsheet, Loader2, Grid3x3,
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

const TargetTile = ({ label, value, color, icon: Icon, onClick }: { label: string; value: number; color: string; icon: any; onClick?: () => void }) => {
    const palette: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100",
        red: "bg-red-50 text-red-700 border-red-300 hover:bg-red-100",
        violet: "bg-violet-50 text-violet-700 border-violet-300 hover:bg-violet-100",
        blue: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100",
        orange: "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100",
        amber: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100",
    };
    return (
        <button onClick={onClick} disabled={!onClick}
            className={cn("flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                palette[color] || palette.violet, !onClick && "cursor-default")}>
            <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-[11px] font-medium leading-tight mt-0.5">{label}</div>
            </div>
            <Icon className="w-5 h-5 opacity-60"/>
        </button>
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
    const [dashboardView, setDashboardView] = useState("cards");
    const [currentView, setCurrentView] = useState(view_type);
    const [searchTerm, setSearchTerm] = useState((filters as any).search||"");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterGrade, setFilterGrade] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [cardPage, setCardPage] = useState(1);
    const [cardPerPage, setCardPerPage] = useState(8);

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
            const gm=filterGrade==="all"||(filterGrade==="5-8"&&eg>=5&&eg<=8)||(filterGrade==="9-12"&&eg>=9&&eg<=12)||(filterGrade==="13"&&eg>=13);
            return nm&&sm&&gm;
        });
    },[card_data,searchTerm,filterStatus,filterGrade]);

    const paginatedCardData = useMemo(()=>{const s=(cardPage-1)*cardPerPage,e=s+cardPerPage;return{data:filteredCardData.slice(s,e),currentPage:cardPage,totalPages:Math.ceil(filteredCardData.length/cardPerPage),totalItems:filteredCardData.length,hasNextPage:e<filteredCardData.length,hasPrevPage:cardPage>1};},[filteredCardData,cardPage,cardPerPage]);

    // ----- Evaluatee-centric grouping (used by Card view + Excel view) -----
    const evaluateeGroups = useMemo(() => {
        const grouped: Record<number, any> = {};
        (assignments?.data ?? []).forEach((a: any) => {
            const eid = a.evaluatee?.id;
            if (!eid) return;
            if (!grouped[eid]) {
                grouped[eid] = {
                    evaluatee: a.evaluatee,
                    self: [], top: [], bottom: [], left: [], right: [],
                };
            }
            const angle = a.angle as 'self' | 'top' | 'bottom' | 'left' | 'right';
            if (grouped[eid][angle]) {
                grouped[eid][angle].push({ id: a.id, evaluator: a.evaluator });
            }
        });
        return Object.values(grouped).sort((a: any, b: any) =>
            (a.evaluatee?.emid || '').localeCompare(b.evaluatee?.emid || '')
        );
    }, [assignments?.data]);

    const filteredEvaluateeGroups = useMemo(() => {
        return evaluateeGroups.filter((g: any) => {
            const ev = g.evaluatee || {};
            const fn = ev.fname || '', ln = ev.lname || '';
            const full = `${fn} ${ln}`.trim();
            const eg = ev.grade || 0;
            const nm = searchTerm === '' || fuzzySearch(full, searchTerm) || fuzzySearch(fn, searchTerm) || fuzzySearch(ln, searchTerm) || (ev.emid || '').includes(searchTerm);
            const gm = filterGrade === 'all' || (filterGrade === '5-8' && eg >= 5 && eg <= 8) || (filterGrade === '9-12' && eg >= 9 && eg <= 12) || (filterGrade === '13' && eg >= 13);
            const total = g.self.length + g.top.length + g.bottom.length + g.left.length + g.right.length;
            const sm = filterStatus === 'all' || (filterStatus === 'complete' && total > 0) || (filterStatus === 'incomplete' && total === 0);
            return nm && gm && sm;
        });
    }, [evaluateeGroups, searchTerm, filterGrade, filterStatus]);

    const paginatedEvaluateeCards = useMemo(() => {
        const s = (cardPage - 1) * cardPerPage, e = s + cardPerPage;
        return {
            data: filteredEvaluateeGroups.slice(s, e),
            currentPage: cardPage,
            totalPages: Math.ceil(filteredEvaluateeGroups.length / cardPerPage),
            totalItems: filteredEvaluateeGroups.length,
            hasNextPage: e < filteredEvaluateeGroups.length,
            hasPrevPage: cardPage > 1,
        };
    }, [filteredEvaluateeGroups, cardPage, cardPerPage]);

    const handleDelete=(id:number)=>{if(confirm("คุณต้องการลบรายการนี้หรือไม่?"))router.delete(route("assignments.destroy",{assignment:id}));};

    const getAngleColor=(angle:string)=>{const t=translateAngleToThai(angle);return({บน:"bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200 border-violet-200",ล่าง:"bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 border-fuchsia-200",ซ้าย:"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border-purple-200",ขวา:"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 border-indigo-200"} as Record<string,string>)[t]||"bg-gray-100 text-gray-800";};

    /* ---- CARD VIEW (evaluatee-centric) — 1 card = 1 ผู้ถูกประเมิน ---- */
    const ANGLE_META: Record<string, { label: string; thai: string; color: string; barColor: string; bg: string }> = {
        self:   { label: "ตนเอง",   thai: "self",   color: "text-violet-700",  barColor: "bg-violet-500",  bg: "bg-violet-50 border-violet-200" },
        top:    { label: "องศาบน",  thai: "top",    color: "text-blue-700",    barColor: "bg-blue-500",    bg: "bg-blue-50 border-blue-200" },
        bottom: { label: "องศาล่าง", thai: "bottom", color: "text-emerald-700", barColor: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
        left:   { label: "องศาซ้าย", thai: "left",   color: "text-orange-700",  barColor: "bg-orange-500",  bg: "bg-orange-50 border-orange-200" },
        right:  { label: "องศาขวา", thai: "right",  color: "text-pink-700",    barColor: "bg-pink-500",    bg: "bg-pink-50 border-pink-200" },
    };

    const renderCardView = () => (
        <div className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { l:"ผู้ถูกประเมินทั้งหมด", v: filteredEvaluateeGroups.length, c:"from-violet-500 to-violet-600" },
                        { l:"คู่ประเมินรวม", v: filteredEvaluateeGroups.reduce((s:number,g:any)=>s+g.self.length+g.top.length+g.bottom.length+g.left.length+g.right.length, 0), c:"from-fuchsia-500 to-fuchsia-600" },
                        { l:"องศาเฉลี่ยต่อคน", v: filteredEvaluateeGroups.length === 0 ? 0 : (filteredEvaluateeGroups.reduce((s:number,g:any)=>s+(['self','top','bottom','left','right'] as const).filter(a=>g[a].length>0).length, 0)/filteredEvaluateeGroups.length).toFixed(1), c:"from-purple-500 to-purple-600" },
                        { l:"% ความสำเร็จ", v: `${analytics?.overallCompletionRate||0}%`, c:"from-indigo-500 to-indigo-600" },
                    ].map((it,i)=>(
                        <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${it.c} p-6 text-white shadow-lg`}>
                            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" /></div>
                            <div className="relative z-10"><div className="text-3xl font-bold mb-1">{it.v}</div><p className="text-sm font-medium opacity-90">{it.l}</p></div>
                        </div>
                    ))}
                </div>
                {(searchTerm||filterStatus!=="all"||filterGrade!=="all")&&(
                    <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border-l-4 border-violet-500">
                        <div className="flex items-center text-violet-700 dark:text-violet-300"><Info className="w-5 h-5 mr-2"/><span className="font-medium">ข้อมูลถูกกรองตามเงื่อนไข — แสดง {filteredEvaluateeGroups.length} คน</span></div>
                    </div>
                )}
            </motion.div>

            {paginatedEvaluateeCards.totalPages>1&&(
                <div className="glass-card rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">แสดง {(cardPage-1)*cardPerPage+1} - {Math.min(cardPage*cardPerPage,filteredEvaluateeGroups.length)} จากทั้งหมด {filteredEvaluateeGroups.length}</span>
                            <select value={cardPerPage} onChange={e=>{setCardPerPage(Number(e.target.value));setCardPage(1);}} className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-violet-500 dark:bg-zinc-800 dark:text-white">
                                {[4,8,12,20].map(n=><option key={n} value={n}>{n} รายการ</option>)}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={()=>setCardPage(1)} disabled={!paginatedEvaluateeCards.hasPrevPage} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"><ChevronLeft className="w-4 h-4 mr-1"/>แรก</button>
                            <button onClick={()=>setCardPage(cardPage-1)} disabled={!paginatedEvaluateeCards.hasPrevPage} className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-violet-50 disabled:opacity-50 flex items-center"><ChevronLeft className="w-4 h-4 mr-1"/>ก่อนหน้า</button>
                            <span className="px-4 py-2 text-sm bg-violet-100 text-violet-700 rounded-xl">หน้า {cardPage}/{paginatedEvaluateeCards.totalPages}</span>
                            <button onClick={()=>setCardPage(cardPage+1)} disabled={!paginatedEvaluateeCards.hasNextPage} className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-violet-50 disabled:opacity-50 flex items-center">ถัดไป<ChevronRight className="w-4 h-4 ml-1"/></button>
                            <button onClick={()=>setCardPage(paginatedEvaluateeCards.totalPages)} disabled={!paginatedEvaluateeCards.hasNextPage} className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-violet-50 disabled:opacity-50 flex items-center">สุดท้าย<ChevronRight className="w-4 h-4 ml-1"/></button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedEvaluateeCards.data.map((group: any, index: number) => {
                    const eve = group.evaluatee;
                    const grade = eve?.grade || 0;
                    const angles = ['self', 'top', 'bottom', 'left', 'right'] as const;
                    const total = angles.reduce((s, a) => s + group[a].length, 0);
                    const supportedAngles = grade >= 9 ? ['self','top','bottom','left','right'] : ['self','top','left'];
                    const filledAngles = angles.filter(a => group[a].length > 0).length;
                    const requiredCount = supportedAngles.length;
                    const completionPct = requiredCount > 0 ? Math.round((filledAngles / requiredCount) * 100) : 0;

                    return (
                        <motion.div key={eve.id} variants={itemVariants}
                            className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                            {/* Header — Evaluatee info */}
                            <div className={cn("px-6 py-4 text-white relative overflow-hidden",
                                total > 0 ? "gradient-primary" : "bg-gradient-to-r from-gray-500 to-gray-600")}>
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transform rotate-12 scale-150"/>
                                </div>
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
                                            <User className="w-6 h-6"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold truncate">
                                                    {eve.prename}{eve.fname} {eve.lname}
                                                </h3>
                                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">{eve.emid}</span>
                                            </div>
                                            <div className="text-xs opacity-90 mt-0.5">
                                                {eve.position?.title || eve.position_title || 'ไม่ระบุตำแหน่ง'}
                                            </div>
                                            <div className="text-xs opacity-80">
                                                {eve.department?.name || eve.department_name || 'ไม่ระบุหน่วยงาน'} · เกรด <b>C{grade}</b>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Completion ring */}
                                    <div className="text-center flex-shrink-0 ml-3">
                                        <div className="relative inline-flex items-center justify-center w-16 h-16">
                                            <svg className="w-16 h-16 transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/30"/>
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                    strokeDasharray={`${2*Math.PI*28}`}
                                                    strokeDashoffset={`${2*Math.PI*28*(1 - completionPct/100)}`}
                                                    strokeLinecap="round" className="text-white transition-all duration-700"/>
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-base font-bold">{filledAngles}/{requiredCount}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] mt-1">องศาที่ครบ</div>
                                    </div>
                                </div>
                                {/* Status bar */}
                                <div className="mt-3 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center"><Users className="w-3 h-3 mr-1"/>{total} คนประเมิน</span>
                                        <span className="flex items-center"><Target className="w-3 h-3 mr-1"/>{filledAngles}/{requiredCount} องศา</span>
                                    </div>
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full font-medium">#{(cardPage-1)*cardPerPage+index+1}</span>
                                </div>
                            </div>

                            {/* Body — 5 angle sections */}
                            <div className="p-4 space-y-2">
                                {angles.map(angle => {
                                    const meta = ANGLE_META[angle];
                                    const list = group[angle] as any[];
                                    const isSupported = supportedAngles.includes(angle);
                                    const has = list.length > 0;

                                    return (
                                        <div key={angle} className={cn(
                                            "border rounded-xl transition-all",
                                            has ? meta.bg : "border-gray-200 bg-gray-50/50 dark:bg-gray-800/30",
                                            !isSupported && "opacity-50"
                                        )}>
                                            <div className={cn(
                                                "px-3 py-2 flex items-center justify-between border-b",
                                                has ? "border-current/20" : "border-gray-200"
                                            )}>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("inline-block w-1.5 h-1.5 rounded-full", meta.barColor)}/>
                                                    <span className={cn("text-sm font-bold", has ? meta.color : "text-gray-500")}>
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[10px] uppercase tracking-wide text-gray-400">{meta.thai}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!isSupported && <span className="text-[10px] text-gray-400 italic">ไม่รองรับ g{grade}</span>}
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-bold",
                                                        has ? `${meta.barColor} text-white` : "bg-gray-200 text-gray-500"
                                                    )}>{list.length}</span>
                                                </div>
                                            </div>
                                            {has ? (
                                                <div className="p-2 space-y-1 max-h-32 overflow-y-auto">
                                                    {list.map((item: any) => (
                                                        <div key={item.id} className="group flex items-center justify-between px-2 py-1.5 bg-white dark:bg-zinc-800 rounded-lg hover:shadow-sm">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                                                                    angle === 'self' ? 'bg-violet-500' : meta.barColor)}>
                                                                    {item.evaluator?.fname?.charAt(0) || '?'}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                        {angle === 'self' ? '(ตนเอง)' : `${item.evaluator?.fname || ''} ${item.evaluator?.lname || ''}`}
                                                                    </div>
                                                                    {angle !== 'self' && item.evaluator?.grade && (
                                                                        <div className="text-[10px] text-gray-500">
                                                                            {item.evaluator?.emid} · เกรด C{item.evaluator?.grade}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleDelete(item.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                                                                <Trash2 className="w-3.5 h-3.5"/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-3 text-center text-xs text-gray-400">
                                                    {isSupported ? 'ยังไม่มีผู้ประเมิน' : '— องศานี้ไม่รองรับสำหรับเกรดนี้ —'}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
                {paginatedEvaluateeCards.data.length === 0 && (
                    <div className="lg:col-span-2 text-center py-16 glass-card rounded-2xl">
                        <Users className="w-16 h-16 mx-auto mb-6 text-violet-300"/>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">ไม่พบผู้ถูกประเมิน</h3>
                        <p className="text-gray-600 mb-6">ลองเปลี่ยนคำค้นหา หรือเพิ่มความสัมพันธ์ใหม่</p>
                        <a href={route("assignments.create")} className="inline-flex items-center px-6 py-3 gradient-primary text-white rounded-xl"><PlusCircle className="w-5 h-5 mr-2"/>เพิ่มความสัมพันธ์</a>
                    </div>
                )}
            </div>
        </div>
    );


    const renderExcelView = () => (
        <motion.div variants={itemVariants} className="space-y-4">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 text-sm">
                    <Grid3x3 className="w-5 h-5 text-violet-600"/>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">มุมมอง Excel (1 แถว = 1 ผู้ถูกประเมิน)</span>
                    <span className="text-gray-500">— สอดคล้องกับโครงสร้างไฟล์ Excel import</span>
                </div>
                <div className="flex gap-3 text-xs">
                    <span className="px-2 py-1 rounded bg-violet-100 text-violet-700">self ตนเอง</span>
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">top บน</span>
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">bottom ล่าง</span>
                    <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">left ซ้าย</span>
                    <span className="px-2 py-1 rounded bg-pink-100 text-pink-700">right ขวา</span>
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-violet-50 dark:bg-violet-900/20 sticky top-0 z-10">
                            <tr>
                                <th className="p-2 text-left text-xs font-bold text-violet-700">EMID</th>
                                <th className="p-2 text-left text-xs font-bold text-violet-700">ผู้ถูกประเมิน</th>
                                <th className="p-2 text-center text-xs font-bold text-violet-700">ระดับ</th>
                                <th className="p-2 text-center text-xs font-bold bg-violet-100">ตนเอง</th>
                                <th className="p-2 text-left text-xs font-bold bg-blue-100">องศาบน</th>
                                <th className="p-2 text-left text-xs font-bold bg-emerald-100">องศาล่าง</th>
                                <th className="p-2 text-left text-xs font-bold bg-orange-100">องศาซ้าย</th>
                                <th className="p-2 text-left text-xs font-bold bg-pink-100">องศาขวา</th>
                                <th className="p-2 text-center text-xs font-bold text-violet-700">รวม</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredEvaluateeGroups.map((g: any, idx: number) => {
                                const total = g.self.length + g.top.length + g.bottom.length + g.left.length + g.right.length;
                                return (
                                    <tr key={g.evaluatee.id} className={cn("hover:bg-violet-50/50 align-top", idx % 2 !== 0 && "bg-violet-50/20")}>
                                        <td className="p-2 font-mono text-xs whitespace-nowrap">{g.evaluatee.emid}</td>
                                        <td className="p-2 whitespace-nowrap">
                                            <div className="font-medium text-gray-900 dark:text-white">{g.evaluatee.prename}{g.evaluatee.fname} {g.evaluatee.lname}</div>
                                            <div className="text-xs text-gray-500">{g.evaluatee.position?.title || g.evaluatee.position_title || ''}</div>
                                        </td>
                                        <td className="p-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-800">{g.evaluatee.grade || '-'}</span></td>
                                        <td className="p-2 text-center">{g.self.length > 0 ? <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-violet-200 text-violet-800">✓</span> : <span className="text-gray-300">-</span>}</td>
                                        <td className="p-2 text-xs">
                                            {g.top.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {g.top.map((p: any) => (
                                                        <div key={p.id} className="flex items-center gap-1 group">
                                                            <span className="text-blue-700">• {p.evaluator?.fname} {p.evaluator?.lname}</span>
                                                            <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-2 text-xs">
                                            {g.bottom.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {g.bottom.map((p: any) => (
                                                        <div key={p.id} className="flex items-center gap-1 group">
                                                            <span className="text-emerald-700">• {p.evaluator?.fname} {p.evaluator?.lname}</span>
                                                            <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-2 text-xs">
                                            {g.left.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {g.left.map((p: any) => (
                                                        <div key={p.id} className="flex items-center gap-1 group">
                                                            <span className="text-orange-700">• {p.evaluator?.fname} {p.evaluator?.lname}</span>
                                                            <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-2 text-xs">
                                            {g.right.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {g.right.map((p: any) => (
                                                        <div key={p.id} className="flex items-center gap-1 group">
                                                            <span className="text-pink-700">• {p.evaluator?.fname || 'External'} {p.evaluator?.lname || ''}</span>
                                                            <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-2 text-center font-bold text-violet-700">{total}</td>
                                    </tr>
                                );
                            })}
                            {filteredEvaluateeGroups.length === 0 && (
                                <tr><td colSpan={9} className="p-8 text-center text-gray-500">ไม่พบข้อมูล</td></tr>
                            )}
                        </tbody>
                        {filteredEvaluateeGroups.length > 0 && (
                            <tfoot className="bg-violet-50 sticky bottom-0">
                                <tr className="border-t-2 border-violet-300 font-bold">
                                    <td colSpan={3} className="p-2 text-right text-xs">รวม ({filteredEvaluateeGroups.length} คน):</td>
                                    <td className="p-2 text-center text-violet-700">{filteredEvaluateeGroups.reduce((s: number, g: any) => s + g.self.length, 0)}</td>
                                    <td className="p-2 text-center text-blue-700">{filteredEvaluateeGroups.reduce((s: number, g: any) => s + g.top.length, 0)}</td>
                                    <td className="p-2 text-center text-emerald-700">{filteredEvaluateeGroups.reduce((s: number, g: any) => s + g.bottom.length, 0)}</td>
                                    <td className="p-2 text-center text-orange-700">{filteredEvaluateeGroups.reduce((s: number, g: any) => s + g.left.length, 0)}</td>
                                    <td className="p-2 text-center text-pink-700">{filteredEvaluateeGroups.reduce((s: number, g: any) => s + g.right.length, 0)}</td>
                                    <td className="p-2 text-center text-violet-800">{filteredEvaluateeGroups.reduce((s: number, g: any) => s + g.self.length + g.top.length + g.bottom.length + g.left.length + g.right.length, 0)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </motion.div>
    );

    /* ---- Targets / Suggested Actions (evaluatee-centric) ---- */
    const targets = useMemo(() => {
        const result = {
            no_assignments: [] as any[],
            missing_self: [] as any[],
            missing_top: [] as any[],
            missing_bottom: [] as any[],
            missing_left: [] as any[],
            partial: [] as any[],
            full: [] as any[],
        };
        evaluateeGroups.forEach((g: any) => {
            const grade = g.evaluatee?.grade || 0;
            const supports = grade >= 9 ? ['self','top','bottom','left'] : ['self','top','left']; // right=external flow
            const total = g.self.length + g.top.length + g.bottom.length + g.left.length;
            const filled = supports.filter(a => g[a].length > 0).length;

            if (total === 0) result.no_assignments.push(g);
            if (g.self.length === 0) result.missing_self.push(g);
            if (supports.includes('top') && g.top.length === 0) result.missing_top.push(g);
            if (supports.includes('bottom') && g.bottom.length === 0) result.missing_bottom.push(g);
            if (supports.includes('left') && g.left.length === 0) result.missing_left.push(g);
            if (filled === supports.length && total > 0) result.full.push(g);
            else if (total > 0) result.partial.push(g);
        });
        return result;
    }, [evaluateeGroups]);

    return (
        <MainLayout title="จัดการผู้ถูกประเมิน" breadcrumb={<Breadcrumb items={[{label:"แดชบอร์ดผู้ดูแลระบบ",href:route("admindashboard")},{label:"จัดการผู้ถูกประเมิน",active:true}]}/>}>
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div className="max-w-7xl mx-auto py-10 px-2 sm:px-6 space-y-8" variants={containerVariants} initial="hidden" animate="visible">
                    {/* Header — เรียบง่าย ไม่ยาว */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg"><Users className="w-6 h-6"/></div>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">จัดการผู้ถูกประเมิน</h1>
                                    <p className="text-xs text-gray-500 mt-0.5">ดูข้อมูล 360° แต่ละคน · ใครประเมินใครจากแต่ละองศา</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <FiscalYearSelector value={selectedYear?.value || selected_year || ""} years={fiscal_years}
                                    onChange={(v) => setSelectedYear({value: v, label: `ปีงบประมาณ ${parseInt(v)+543}`})} variant="filter"/>
                                <div className="flex items-center bg-violet-100 rounded-xl p-1">
                                    {[
                                        {id:"cards",icon:Target,label:"การ์ด"},
                                        {id:"excel",icon:Grid3x3,label:"Excel"},
                                    ].map(v=>(
                                        <button key={v.id} onClick={()=>setDashboardView(v.id)}
                                            className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center",
                                                dashboardView===v.id?"bg-white text-violet-600 shadow-sm":"text-gray-600 hover:text-violet-600")}>
                                            <v.icon className="w-4 h-4 mr-1.5"/>{v.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={()=>window.location.reload()} className="p-2 text-gray-500 hover:text-violet-600" title="รีเฟรช"><RefreshCw className="w-5 h-5"/></button>
                                <a href={route("assignments.import")} className="inline-flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-md"><Upload className="w-4 h-4 mr-1.5"/>นำเข้า Excel</a>
                                <a href={route("assignments.create")} className="inline-flex items-center px-3 py-2 gradient-primary text-white text-sm font-medium rounded-xl shadow-md"><Plus className="w-4 h-4 mr-1.5"/>เพิ่ม</a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Targets / Suggested Actions */}
                    {evaluateeGroups.length > 0 && (targets.no_assignments.length + targets.missing_self.length + targets.missing_top.length + targets.missing_bottom.length + targets.missing_left.length) > 0 && (
                        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-5 h-5 text-amber-600"/>
                                <h2 className="font-bold text-gray-800">ข้อมูลที่ต้องดูแล (Targets)</h2>
                                <span className="text-xs text-gray-500">— องศาที่ขาด ตามมาตรฐาน 360°</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                <TargetTile label="ครบ 360°"   value={targets.full.length}            color="emerald" icon={CheckCircle}    onClick={() => { setSearchTerm(''); setFilterStatus('complete'); }}/>
                                <TargetTile label="ไม่มี assignment เลย" value={targets.no_assignments.length} color="red"     icon={AlertTriangle} onClick={() => { setSearchTerm(''); setFilterStatus('incomplete'); }}/>
                                <TargetTile label="ขาด ตนเอง" value={targets.missing_self.length}    color="violet"  icon={User}/>
                                <TargetTile label="ขาด องศาบน"  value={targets.missing_top.length}     color="blue"    icon={TrendingUp}/>
                                <TargetTile label="ขาด องศาล่าง" value={targets.missing_bottom.length}  color="emerald" icon={TrendingDown}/>
                                <TargetTile label="ขาด องศาซ้าย" value={targets.missing_left.length}    color="orange"  icon={Users}/>
                            </div>
                            {targets.no_assignments.length > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer text-sm text-red-700 font-semibold">▶ {targets.no_assignments.length} คนยังไม่มีการจับคู่ประเมิน</summary>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                                        {targets.no_assignments.slice(0, 30).map((g: any) => (
                                            <div key={g.evaluatee.id} className="text-xs bg-red-50 px-2 py-1 rounded">
                                                <span className="font-mono">{g.evaluatee.emid}</span> · {g.evaluatee.fname} {g.evaluatee.lname} (g{g.evaluatee.grade})
                                            </div>
                                        ))}
                                        {targets.no_assignments.length > 30 && <div className="text-xs text-gray-500 col-span-2">... และอีก {targets.no_assignments.length - 30}</div>}
                                    </div>
                                </details>
                            )}
                        </motion.div>
                    )}

                    {/* Filters */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                <input type="text" placeholder="ค้นหาชื่อหรือ EMID ผู้ถูกประเมิน..." value={searchTerm}
                                    onChange={e=>setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"/>
                                {searchTerm && <button onClick={()=>setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                                    className="py-2.5 px-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 text-sm">
                                    <option value="all">ทุกสถานะ</option>
                                    <option value="complete">มี assignment</option>
                                    <option value="incomplete">ยังไม่มี</option>
                                </select>
                                <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)}
                                    className="py-2.5 px-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 text-sm">
                                    <option value="all">ทุกเกรด</option>
                                    <option value="5-8">C5-C8</option>
                                    <option value="9-12">C9-C12</option>
                                    <option value="13">ผู้ว่าการ (C13)</option>
                                </select>
                            </div>
                        </div>
                        {(searchTerm||filterStatus!=="all"||filterGrade!=="all")&&(
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-gray-600">กรอง:</span>
                                {searchTerm && <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">{searchTerm}<button onClick={()=>setSearchTerm("")} className="ml-1 hover:text-violet-600"><X className="w-3 h-3 inline"/></button></span>}
                                {filterStatus!=="all" && <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800">{filterStatus==="complete"?"มี":"ไม่มี"} assignment<button onClick={()=>setFilterStatus("all")} className="ml-1"><X className="w-3 h-3 inline"/></button></span>}
                                {filterGrade!=="all" && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">{filterGrade}<button onClick={()=>setFilterGrade("all")} className="ml-1"><X className="w-3 h-3 inline"/></button></span>}
                                <button onClick={()=>{setSearchTerm("");setFilterStatus("all");setFilterGrade("all");}} className="text-gray-500 hover:text-violet-600 underline">ล้างทั้งหมด</button>
                            </div>
                        )}
                    </motion.div>

                    {/* Main view */}
                    {dashboardView==="cards" && renderCardView()}
                    {dashboardView==="excel" && renderExcelView()}
                </motion.div>
            </div>
        </MainLayout>
    );
}
