import React, { useState } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import EvaluatorSummaryTable from "./Sections/EvaluatorSummaryTable";
import ChartSection from "./Sections/ChartSection";
import AspectTables from "./Sections/AspectTables";
import WeightedTables from "./Sections/WeightedTables";
interface PageProps {
    filters: {
        fiscal_year?: string;
        division?: string;
        grade?: string;
    };
    availableYears: string[];
    availableDivisions: { id: number; name: string }[];
    availableGrades: number[];
    fiscalYear: string;
    evaluatorSummary: {
        grade: number;
        user_type: string;
        total: number;
    }[];
    evaluateeCountByGrade: any[];
    part1ScoreYearly: any[];
    part1AspectSummary: {
        aspect: string;
        average_score: number | string;
        group: "5-8" | "9-12";
    }[];
    weightedSummary: {
        id: number;
        name: string;
        position?: string;
        grade?: number;
        division?: string;
        self?: number;
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        average: number;
    }[];
}

export default function AdminEvaluationReport() {
    const {
        filters,
        availableYears,
        availableDivisions,
        availableGrades,
        evaluateeCountByGrade,
        part1ScoreYearly,
        part1AspectSummary,
        weightedSummary,
        evaluatorSummary, // ✅ เพิ่มบรรทัดนี้ให้ครบ
        fiscalYear, // ✅ ด้วยเพื่อให้แสดงปีงบประมาณ
    } = usePage<PageProps>().props;
    const group5to8 = weightedSummary.filter((u) => u.grade && u.grade < 9);
    const group9to12 = weightedSummary.filter((u) => u.grade && u.grade >= 9);
    const [selectedYear, setSelectedYear] = useState(filters.fiscal_year || "");
    const [selectedDivision, setSelectedDivision] = useState(
        filters.division || ""
    );
    const [selectedGrade, setSelectedGrade] = useState(filters.grade || "");

    const handleFilterChange = (key: string, value: string) => {
        const updated = {
            fiscal_year: selectedYear,
            division: selectedDivision,
            grade: selectedGrade,
            [key]: value,
        };
        if (key === "fiscal_year") setSelectedYear(value);
        if (key === "division") setSelectedDivision(value);
        if (key === "grade") setSelectedGrade(value);
        router.visit(route("admin.evaluation.report"), {
            data: updated,
            preserveState: true,
        });
    };

    return (
        <MainLayout
            title="รายงานผลการประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ด", href: route("admindashboard") },
                        { label: "รายงานผลการประเมิน", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* 🧭 Filter Bar */}
                <div className="flex flex-wrap gap-4 justify-between">
                    <div className="flex gap-2 flex-wrap">
                        <select
                            className="border rounded dark:bg-gray-800 dark:text-white"
                            value={selectedYear}
                            onChange={(e) =>
                                handleFilterChange(
                                    "fiscal_year",
                                    e.target.value
                                )
                            }
                        >
                            {availableYears.map((y: string) => (
                                <option key={y} value={y}>
                                    ปีงบ {parseInt(y) + 543}
                                </option>
                            ))}
                        </select>
                        <select
                            className="border px-3 py-2 rounded dark:bg-gray-800 dark:text-white"
                            value={selectedDivision}
                            onChange={(e) =>
                                handleFilterChange("division", e.target.value)
                            }
                        >
                            <option value="">ทุกสายงาน</option>
                            {availableDivisions.map((d: any) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="bg-purple-600 text-white px-4 py-2 rounded"
                            onClick={() =>
                                window.open(
                                    route(
                                        "admin.evaluation.report.export.individual",
                                        {
                                            fiscal_year: selectedYear,
                                            division:
                                                selectedDivision || undefined,
                                            grade: selectedGrade || undefined,
                                        }
                                    ),
                                    "_blank"
                                )
                            }
                        >
                            ส่งออกทั้งหมด
                        </button>
                    </div>
                </div>

                {/* Sections */}
                <EvaluatorSummaryTable
                    data={evaluateeCountByGrade} // ✅ ส่ง evaluateeCountByGrade
                    fiscalYear={fiscalYear}
                />

                <ChartSection data={part1ScoreYearly} filters={filters} />
                <AspectTables aspects={part1AspectSummary} />
                <WeightedTables
                    title="📋 ตารางผลประเมินระดับ 5–8"
                    data={group5to8}
                />
                <WeightedTables
                    title="📋 ตารางผลประเมินระดับ 9–12"
                    data={group9to12}
                />
            </div>
        </MainLayout>
    );
}
