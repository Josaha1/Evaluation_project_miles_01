import React, { useState } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import Breadcrumb from "@/Components/ui/breadcrumb";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

interface EvaluatorSummaryItem {
    grade: number;
    user_type: string;
    total: number;
}

interface Part1ScoreYearly {
    aspect: string;
    year: string;
    average_score: string | number;
}

interface AngleScoreItem {
    name: string;
    angle: string;
    score: number;
}

interface WeightedSummaryItem {
    id: number;
    name: string;
    position?: string;
    grade?: string | number;
    division?: string;
    top: number;
    bottom: number;
    left: number;
    right: number;
    average: number;
}

interface Part1AspectSummaryItem {
    aspect: string;
    average_score: string | number;
}

interface PageProps {
    fiscalYear: string;
    availableYears: string[];
    evaluatorSummary: EvaluatorSummaryItem[];
    part1ScoreYearly: Part1ScoreYearly[];
    angleScores: AngleScoreItem[];
    weightedSummary: WeightedSummaryItem[];
    availableDivisions: { id: number; name: string }[];
    availableGrades: number[];
    part1AspectSummary: Part1AspectSummaryItem[];
    availableUsers: { id: number; name: string }[];
    filters: {
        fiscal_year?: string;
        division?: string;
        grade?: string;
        user_id?: string;
    };
}

const gradeLabelMap: Record<number, string> = {
    12: "ผู้บริหารระดับ 12",
    11: "ผู้บริหารระดับ 11",
    10: "ผู้บริหารระดับ 10",
    9: "ผู้บริหารระดับ 9",
    8: "ผู้บริหารระดับ 8",
    7: "ผู้บริหารระดับ 7",
    6: "ผู้บริหารระดับ 6",
    5: "ผู้บริหารระดับ 5",
};

const scoreLabel = (score: number) => {
    if (score > 4.5) return "ดีเยี่ยม";
    if (score >= 4.0) return "ดีมาก";
    if (score >= 3.0) return "ดี";
    if (score >= 2.0) return "ต้องปรับปรุง";
    return "ต้องปรับปรุงอย่างมาก";
};

export default function AdminEvaluationReport() {
    const {
        fiscalYear,
        availableYears = [],
        evaluatorSummary,
        part1ScoreYearly = [],
        weightedSummary = [],
        availableDivisions = [],
        availableGrades = [],
        part1AspectSummary = [],
        filters = {},
    } = usePage<PageProps>().props;

    const [selectedYear, setSelectedYear] = useState(
        filters.fiscal_year || fiscalYear
    );
    const [selectedDivision, setSelectedDivision] = useState(
        filters.division || ""
    );
    const [selectedGrade, setSelectedGrade] = useState(filters.grade || "");
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [searchWeightedName, setSearchWeightedName] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const filteredWeightedSummary = weightedSummary.filter((row) =>
        row.name.toLowerCase().includes(searchWeightedName.toLowerCase())
    );
    const paginatedSummary = filteredWeightedSummary.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(filteredWeightedSummary.length / itemsPerPage);
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = {
            fiscal_year: selectedYear,
            division: selectedDivision,
            grade: selectedGrade,
            [key]: value,
        };

        if (key === "fiscal_year") setSelectedYear(value);
        if (key === "division") setSelectedDivision(value);
        if (key === "grade") setSelectedGrade(value);

        router.visit(route("admin.evaluation.report"), {
            data: newFilters,
            preserveState: true,
        });
    };

    const exportButtons = (
        <div className="flex gap-2">
            <button
                onClick={() =>
                    window.open(
                        route("admin.evaluation.report.export.individual", {
                            fiscal_year: selectedYear,
                            division: selectedDivision || undefined,
                            grade: selectedGrade || undefined,
                        }),
                        "_blank"
                    )
                }
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
                🧾 ส่งออกรายบุคคลตามด้าน
            </button>
        </div>
    );

    const totalEvaluators = evaluatorSummary.reduce(
        (sum, item) => sum + item.total,
        0
    );

    const aspects = Array.from(new Set(part1ScoreYearly.map((d) => d.aspect)));
    const years = Array.from(new Set(part1ScoreYearly.map((d) => d.year)));

    const aspectSeries = aspects.map((aspect) => ({
        name: aspect,
        type: "column" as const,
        data: years.map((year) => {
            const found = part1ScoreYearly.find(
                (d) => d.year === year && d.aspect === aspect
            );
            return found ? parseFloat(found.average_score as string) : null;
        }),
    }));

    const barChartOptions: Highcharts.Options = {
        chart: {
            type: "column",
            backgroundColor: "transparent", // ✅ รองรับ dark mode background
        },
        title: {
            text: "📊 เปรียบเทียบผลประเมินพาร์ตที่ 1 แยกตามด้านและปีงบประมาณ",
            style: {
                color: "#fff", // ✅ ขาวใน dark mode
                fontWeight: "bold",
                fontSize: "18px",
            },
        },
        xAxis: {
            categories: years.map((year) => `${parseInt(year) + 543}`),
            title: { text: "ปีงบประมาณ (พ.ศ.)" },
            labels: { style: { color: "#ccc" } }, // ✅ สีอ่อนใน dark
            lineColor: "#666",
        },
        yAxis: {
            min: 0,
            max: 5,
            title: {
                text: "คะแนนเฉลี่ย",
                style: { color: "#ccc" },
            },
            labels: { style: { color: "#ccc" } },
            gridLineColor: "#444",
        },
        legend: {
            layout: "horizontal",
            align: "center",
            verticalAlign: "bottom",
            itemStyle: {
                color: "#ccc",
                fontWeight: "normal",
            },
        },
        tooltip: {
            shared: true,
            backgroundColor: "#1f2937", // dark: bg-gray-800
            borderColor: "#374151", // dark: bg-gray-700
            style: {
                color: "#fff",
            },
            valueDecimals: 2,
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
            },
        },
        series: aspectSeries,
    };

    return (
        <MainLayout
            title="รายงานผลการประเมินภาพรวม"
            breadcrumb={
                <Breadcrumb
                    items={[
                        {
                            label: "แดชบอร์ดผู้ดูแลระบบ",
                            href: route("admindashboard"),
                        },
                        { label: "รายงานผลการประเมินภาพรวม", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                <div className="flex flex-wrap gap-2 justify-end">
                    <select
                        className="border bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedYear}
                        onChange={(e) =>
                            handleFilterChange("fiscal_year", e.target.value)
                        }
                    >
                        {availableYears.map((year) => (
                            <option
                                key={year}
                                value={year}
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                ปีงบ {parseInt(year) + 543}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedDivision}
                        onChange={(e) =>
                            handleFilterChange("division", e.target.value)
                        }
                    >
                        <option value="">ทุกสายงาน</option>
                        {availableDivisions.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="border bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedGrade}
                        onChange={(e) =>
                            handleFilterChange("grade", e.target.value)
                        }
                    >
                        <option value="">ทุกระดับ</option>
                        {[...availableGrades]
                            .map(Number)
                            .sort((a, b) => b - a)
                            .map((g) => (
                                <option key={g} value={g}>
                                    {gradeLabelMap[g] || `ระดับ ${g}`}
                                </option>
                            ))}
                    </select>

                    {/* 📥 Export Button */}
                    {exportButtons}
                </div>
                <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                    <Card className="p-8">
                        <h2 className="text-xl font-bold mb-6">
                            🧾 1. สรุปจำนวนผู้ประเมิน ปีงบประมาณ{" "}
                            {parseInt(fiscalYear) + 543}
                        </h2>
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <tr>
                                        <th className="border px-4 py-2 text-left">
                                            กลุ่มผู้ประเมิน
                                        </th>
                                        <th className="border px-4 py-2 text-center">
                                            จำนวน
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {[...evaluatorSummary]
                                        .sort((a, b) => b.grade - a.grade) // 🔁 เรียงระดับจากมากไปน้อย
                                        .map((item, idx) => (
                                            <tr
                                                key={idx}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="p-4 text-gray-800 dark:text-white font-medium">
                                                    {item.user_type ===
                                                    "external"
                                                        ? `บุคคลภายนอกระดับ ${item.grade}`
                                                        : gradeLabelMap[
                                                              item.grade
                                                          ] ||
                                                          `พนักงานระดับ ${item.grade}`}
                                                </td>
                                                <td className="border px-4 py-2 text-center">
                                                    {item.total}
                                                </td>
                                            </tr>
                                        ))}
                                    <tr>
                                        <td className="border px-4 py-2 text-right">
                                            รวม
                                        </td>
                                        <td className="border px-4 py-2 text-center">
                                            {totalEvaluators}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                    <Card className="p-8">
                        <h2 className="text-xl font-bold mb-6">
                            📊 2. เปรียบเทียบผลประเมินพาร์ต 1 ตามปีงบประมาณ
                        </h2>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={barChartOptions}
                        />
                    </Card>
                </div>
                <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                    <Card className="p-8">
                        <h2 className="text-xl font-bold mb-6">
                            📋 3. สรุปคะแนนเฉลี่ยรายด้านในส่วนที่ 1
                        </h2>
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <tr>
                                        <th className="p-4 text-left">
                                            ประเด็นการประเมิน
                                        </th>
                                        <th className="p-4 text-center">
                                            คะแนนเฉลี่ย
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {[
                                        ...part1AspectSummary,
                                        {
                                            aspect: "ค่าเฉลี่ยโดยรวม",
                                            average_score: (
                                                part1AspectSummary.reduce(
                                                    (sum, item) =>
                                                        sum +
                                                        parseFloat(
                                                            item.average_score
                                                        ),
                                                    0
                                                ) / part1AspectSummary.length
                                            ).toFixed(2),
                                        },
                                    ].map((item, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <td className="p-4 text-gray-800 dark:text-white font-medium">
                                                {item.aspect}
                                            </td>
                                            <td className="p-4 text-center">
                                                {parseFloat(
                                                    item.average_score as string
                                                ).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                    <Card className="p-8">
                        <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">
                                ⚖️ 4. ตารางสรุปผลน้ำหนักคะแนนรวมแต่ละคน
                            </h2>
                            <input
                                type="text"
                                className="border px-3 py-2 rounded w-64"
                                placeholder="🔍 ค้นหาชื่อ..."
                                value={searchWeightedName}
                                onChange={(e) => {
                                    setSearchWeightedName(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <tr>
                                        <th className="p-4 text-left">ชื่อ</th>
                                        <th className="p-4 text-center">
                                            ระดับ
                                        </th>
                                        <th className="p-4 text-center">
                                            สายงาน
                                        </th>
                                        <th className="p-4 text-center">บน</th>
                                        <th className="p-4 text-center">
                                            ล่าง
                                        </th>
                                        <th className="p-4 text-center">
                                            ซ้าย
                                        </th>
                                        <th className="p-4 text-center">ขวา</th>
                                        <th className="p-4 text-center">
                                            คะแนนรวม
                                        </th>
                                        <th className="p-4 text-center">
                                            ระดับคะแนน
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedSummary.map((user, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <td className="p-4 text-gray-800 dark:text-white font-medium">
                                                {user.name}
                                            </td>
                                            <td className="p-4 text-center">
                                                {gradeLabelMap[
                                                    Number(user.grade)
                                                ] || `ระดับ ${user.grade}`}
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.division ?? "-"}
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.top?.toFixed(2) ?? "-"}
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.bottom?.toFixed(2) ?? "-"}
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.left?.toFixed(2) ?? "-"}
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.right?.toFixed(2) ?? "-"}
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.average?.toFixed(2) ??
                                                    "-"}
                                            </td>
                                            <td className="p-4 text-center">
                                                {scoreLabel(user.average)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6 flex-wrap gap-1">
                                <button
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(p - 1, 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        currentPage === 1
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-white"
                                    }`}
                                >
                                    « Previous
                                </button>

                                {Array.from({ length: totalPages })
                                    .map((_, i) => i + 1)
                                    .filter((page) => {
                                        return (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 2 &&
                                                page <= currentPage + 2)
                                        );
                                    })
                                    .reduce(
                                        (
                                            acc: (number | "...")[],
                                            page,
                                            i,
                                            arr
                                        ) => {
                                            if (
                                                i > 0 &&
                                                (page as number) -
                                                    (arr[i - 1] as number) >
                                                    1
                                            ) {
                                                acc.push("...");
                                            }
                                            acc.push(page);
                                            return acc;
                                        },
                                        []
                                    )
                                    .map((page, idx) =>
                                        page === "..." ? (
                                            <span
                                                key={`ellipsis-${idx}`}
                                                className="px-3 py-1 text-sm text-gray-400"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    setCurrentPage(
                                                        page as number
                                                    )
                                                }
                                                className={`px-3 py-1 rounded text-sm font-medium ${
                                                    currentPage === page
                                                        ? "bg-indigo-600 text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-white"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}

                                <button
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(p + 1, totalPages)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        currentPage === totalPages
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-white"
                                    }`}
                                >
                                    Next »
                                </button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
