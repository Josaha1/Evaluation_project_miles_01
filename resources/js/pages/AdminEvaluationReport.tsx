import React, { useState } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import IndividualDetailedReport from "@/Components/IndividualDetailedReport";
import FiscalYearSelector from "@/Components/FiscalYearSelector";
import { motion } from "framer-motion";
import {
    BarChart3, FileText, Download, Search, X, ClipboardList,
} from "lucide-react";

import type { PageProps, TabId } from "./AdminReport/types";
import { useReportFilters } from "./AdminReport/useReportFilters";
import ReportsTab from "./AdminReport/ReportsTab";
import ExportsTab from "./AdminReport/ExportsTab";
import AssignmentsTab from "./AdminReport/AssignmentsTab";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "assignments", label: "การจับคู่", icon: ClipboardList },
    { id: "reports", label: "ผู้ถูกประเมิน", icon: FileText },
    { id: "exports", label: "ส่งออก", icon: Download },
];

const AdminEvaluationReport: React.FC = () => {
    const { props } = usePage<PageProps>();
    const {
        filters = {},
        availableYears = [],
        availableDivisions = [],
        availableGrades = [],
        fiscalYear = new Date().getFullYear().toString(),
        dashboardStats = {
            totalParticipants: 0, completedEvaluations: 0, pendingEvaluations: 0,
            overallCompletionRate: 0, averageScore: 0, totalQuestions: 0,
            totalAnswers: 0, uniqueEvaluators: 0, uniqueEvaluatees: 0,
            evaluationTypes: 0, lastUpdated: new Date().toISOString(),
        },
        evaluationMetrics = { byGrade: [], byDivision: [], byAngle: [], trends: [] },
        detailedResults = [],
        externalOrgMetrics = [],
    } = props;

    const [activeTab, setActiveTab] = useState<TabId>("assignments");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const { filters: reportFilters, setters, filteredResults, activeFilterCount } =
        useReportFilters(detailedResults);

    return (
        <MainLayout
            title="รายงานการประเมิน 360 องศา"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "รายงานการประเมิน", active: true },
                    ]}
                />
            }
        >
            <div className="min-h-screen gradient-primary-soft">
                {/* ─── Gradient Header ─── */}
                <div className="shadow-xl relative gradient-primary text-white">
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    <div className="relative px-6 py-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative" style={{ zIndex: 10 }}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-lg">
                                    <BarChart3 className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold">
                                        รายงานการประเมิน 360 องศา
                                    </h1>
                                    <p className="text-violet-200 mt-1">
                                        ปีงบประมาณ พ.ศ. {Number(fiscalYear) + 543} | ข้อมูล {dashboardStats.totalAnswers.toLocaleString()} คำตอบ
                                    </p>
                                </div>
                            </div>

                            <FiscalYearSelector
                                value={fiscalYear}
                                years={availableYears}
                                onChange={(year) =>
                                    router.get(
                                        route("admin.evaluation-report.index"),
                                        { fiscal_year: year },
                                        { preserveState: true, preserveScroll: true }
                                    )
                                }
                                variant="header"
                            />
                        </div>

                        {/* Tab Navigation */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? "bg-white text-violet-700 shadow-lg"
                                                : "bg-white/15 text-white/80 hover:bg-white/25 hover:text-white"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ─── Filter Bar (visible on reports tab) ─── */}
                {activeTab === "reports" && (
                    <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="px-6 py-3">
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อผู้ถูกประเมิน..."
                                        value={reportFilters.search}
                                        onChange={(e) => setters.setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none"
                                    />
                                </div>
                                <select
                                    value={reportFilters.division}
                                    onChange={(e) => setters.setDivision(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                >
                                    <option value="">ทุกหน่วยงาน</option>
                                    {availableDivisions.map((d) => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={reportFilters.grade}
                                    onChange={(e) => setters.setGrade(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                >
                                    <option value="">ทุกระดับ</option>
                                    {availableGrades.map((g) => (
                                        <option key={g} value={g.toString()}>
                                            ระดับ {g}
                                        </option>
                                    ))}
                                </select>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={setters.clearAll}
                                        className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        ล้างตัวกรอง ({activeFilterCount})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Tab Content ─── */}
                <div className="px-6 py-6 max-w-7xl mx-auto">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "reports" && (
                            <ReportsTab
                                filteredResults={filteredResults}
                                externalOrgMetrics={externalOrgMetrics}
                                onViewIndividual={(id) => setSelectedUserId(id)}
                            />
                        )}
                        {activeTab === "assignments" && (
                            <AssignmentsTab
                                fiscalYear={fiscalYear}
                                availableDivisions={props.availableDivisions}
                            />
                        )}
                        {activeTab === "exports" && (
                            <ExportsTab
                                fiscalYear={fiscalYear}
                                selectedDivision={reportFilters.division}
                                selectedGrade={reportFilters.grade}
                                availableUsers={props.availableUsers}
                                availableDivisions={props.availableDivisions}
                                availableDepartments={props.availableDepartments}
                                availablePositions={props.availablePositions}
                            />
                        )}
                    </motion.div>
                </div>

                {/* ─── Individual Report Modal ─── */}
                {selectedUserId && (
                    <IndividualDetailedReport
                        userId={selectedUserId}
                        fiscalYear={parseInt(fiscalYear)}
                        isOpen={!!selectedUserId}
                        onClose={() => setSelectedUserId(null)}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default AdminEvaluationReport;
