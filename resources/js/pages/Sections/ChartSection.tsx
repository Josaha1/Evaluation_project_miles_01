import React, { lazy, Suspense, useEffect, useState } from "react";
import { Card } from "@/Components/ui/card";
import type Highcharts from "highcharts";

const LazyHighchartsReact = lazy(() =>
    Promise.all([
        import("highcharts"),
        import("highcharts-react-official"),
    ]).then(([hc, hcReact]) => ({
        default: (props: any) => <hcReact.default highcharts={hc.default} {...props} />,
    }))
);
interface Part1Score {
    aspect: string;
    part_id: 1 | 4 | 7;
    year: string;
    average_score: string | number;
}

interface Props {
    data: Part1Score[];
    filters: {
        grade?: number;
    };
}

const partLabelMap: Record<number, string> = {
    7: "📘 แบบประเมินผู้บริหารระดับ 5–8",
    1: "📗 แบบประเมินผู้บริหารระดับ 9–12 (ภายใน)",
    4: "📕 แบบประเมินผู้บริหารระดับ 9–12 (ภายนอก)",
};

const gradeToPartIds = (grade?: number): Array<1 | 4 | 7> => {
    if (!grade) return [1, 4, 7]; // ทุกระดับ
    return grade < 9 ? [7] : [1, 4]; // ถ้าระดับ < 9 → part_id 7 / ≥ 9 → part_id 1,4
};

const ChartSection: React.FC<Props> = ({ data, filters }) => {
    const partIds = gradeToPartIds(filters.grade);
    const [isDark, setIsDark] = useState<boolean>(
        document.documentElement.classList.contains("dark")
    );
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);
    const renderChart = (partId: 1 | 4 | 7) => {
        const groupData = data.filter((d) => d.part_id === partId);
        if (groupData.length === 0) return null;

        const aspects = Array.from(
            new Set(groupData.map((d) => d.aspect))
        ).sort();

        const years = Array.from(
            new Set(groupData.map((d) => `${parseInt(d.year) + 543}`))
        ).sort();

        const isDark = document.documentElement.classList.contains("dark");

        const chartOptions: Highcharts.Options = {
            chart: {
                type: "column",
                backgroundColor: "transparent",
            },
            title: {
                text: `ผลคะแนนเฉลี่ย Part 1 - ${partLabelMap[partId]}`,
                style: { color: isDark ? "#ccc" : "#000" },
            },
            xAxis: {
                categories: years,
                title: {
                    text: "ปีงบประมาณ (พ.ศ.)",
                    style: { color: isDark ? "#ccc" : "#000" },
                },
                labels: {
                    style: { color: isDark ? "#ccc" : "#000" },
                },
                lineColor: isDark ? "#888" : "#000",
            },
            yAxis: {
                min: 0,
                max: 5,
                title: {
                    text: "คะแนนเฉลี่ย",
                    style: { color: isDark ? "#ccc" : "#000" },
                },
                labels: {
                    style: { color: isDark ? "#ccc" : "#000" },
                },
                gridLineColor: isDark ? "#444" : "#ddd",
            },
            legend: {
                layout: "horizontal",
                align: "center",
                verticalAlign: "bottom",
                itemStyle: {
                    color: isDark ? "#ccc" : "#000",
                    fontWeight: "normal",
                },
            },
            tooltip: {
                shared: true,
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                borderColor: isDark ? "#374151" : "#ccc",
                style: { color: isDark ? "#fff" : "#000" },
                valueDecimals: 2,
            },
            plotOptions: {
                column: { pointPadding: 0.2, borderWidth: 0 },
            },
            series: aspects.map((aspect) => ({
                name: aspect,
                type: "column",
                data: years.map((year) => {
                    const found = groupData.find(
                        (d) =>
                            d.aspect === aspect &&
                            `${parseInt(d.year) + 543}` === year
                    );
                    return found
                        ? parseFloat(found.average_score as string)
                        : null;
                }),
            })),
        };

        return (
            <Card
                key={`${partId}-${isDark ? "dark" : "light"}`}
                className="p-6 shadow-lg border border-violet-300 dark:border-violet-500 text-black dark:text-white"
            >
                <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />}>
                    <LazyHighchartsReact
                        className="text-black dark:text-white"
                        options={chartOptions}
                    />
                </Suspense>
            </Card>
        );
    };

    return (
        <div className="space-y-10">{partIds.map((id) => renderChart(id))}</div>
    );
};

export default ChartSection;
