// resources/js/Pages/AdminEvaluationReport/ChartSection.tsx
import React from "react";
import { Card } from "@/Components/ui/card";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

interface ScoreData {
    aspect: string;
    year: string;
    average_score: number | string;
    group: "5-8" | "9-12";
}

interface Props {
    data: ScoreData[];
}

const ChartSection: React.FC<Props> = ({ data }) => {
    const renderChart = (group: "5-8" | "9-12") => {
        const filtered = data.filter((d) => d.group === group);
        const aspects = [...new Set(filtered.map((d) => d.aspect))];
        const years = [
            ...new Set(filtered.map((d) => `${parseInt(d.year) + 543}`)),
        ];

        const chartOptions: Highcharts.Options = {
            chart: {
                type: "column",
                backgroundColor: "transparent",
            },
            title: {
                text: `📊 คะแนนเฉลี่ย Part 1 กลุ่มระดับ ${group}`,
                style: { color: "#fff", fontWeight: "bold", fontSize: "18px" },
            },
            xAxis: {
                categories: years,
                title: { text: "ปีงบประมาณ" },
                labels: { style: { color: "#ccc" } },
            },
            yAxis: {
                min: 0,
                max: 5,
                title: { text: "คะแนน", style: { color: "#ccc" } },
                labels: { style: { color: "#ccc" } },
                gridLineColor: "#444",
            },
            tooltip: {
                shared: true,
                backgroundColor: "#1f2937",
                borderColor: "#374151",
                style: { color: "#fff" },
                valueDecimals: 2,
            },
            legend: {
                layout: "horizontal",
                align: "center",
                verticalAlign: "bottom",
                itemStyle: { color: "#ccc" },
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0,
                },
            },
            series: aspects.map((aspect) => ({
                name: aspect,
                type: "column",
                data: years.map((year) => {
                    const found = filtered.find(
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
            <Card className="p-6 mb-6">
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {renderChart("5-8")}
            {renderChart("9-12")}
        </div>
    );
};

export default ChartSection;
