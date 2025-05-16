import React, { useState } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import SummaryTable from "./Sections/SummaryTable";
import ChartSection from "./Sections/ChartSection";
import AspectTables from "./Sections/AspectTables";
import WeightedTables from "./Sections/WeightedTables";

export default function AdminEvaluationReport() {
    const { filters, availableYears, availableDivisions, availableGrades } =
        usePage().props as any;

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
                            className="border px-3 py-2 rounded"
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
                            className="border px-3 py-2 rounded"
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
                        <select
                            className="border px-3 py-2 rounded"
                            value={selectedGrade}
                            onChange={(e) =>
                                handleFilterChange("grade", e.target.value)
                            }
                        >
                            <option value="">ทุกระดับ</option>
                            {availableGrades.map((g: number) => (
                                <option key={g} value={g}>
                                    {g >= 9
                                        ? `ผู้บริหารระดับ ${g}`
                                        : `พนักงานระดับ ${g}`}
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
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            onClick={() =>
                                window.open(
                                    route(
                                        "admin.evaluation.report.export.individual",
                                        {
                                            fiscal_year: selectedYear,
                                            division:
                                                selectedDivision || undefined,
                                            grade: "5-8",
                                        }
                                    ),
                                    "_blank"
                                )
                            }
                        >
                            ส่งออก 5–8
                        </button>
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded"
                            onClick={() =>
                                window.open(
                                    route(
                                        "admin.evaluation.report.export.individual",
                                        {
                                            fiscal_year: selectedYear,
                                            division:
                                                selectedDivision || undefined,
                                            grade: "9-12",
                                        }
                                    ),
                                    "_blank"
                                )
                            }
                        >
                            ส่งออก 9–12
                        </button>
                    </div>
                </div>

                {/* Sections */}
                <SummaryTable data={evaluateeCountByGrade} />
                <ChartSection data={part1ScoreYearly} />
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
