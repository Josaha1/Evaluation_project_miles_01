import React, { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";

interface ChartData {
    evaluateeCountByGrade: Array<{
        grade: number;
        user_type: string;
        total: number;
        completed: number;
        remaining: number;
    }>;
    part1ScoreYearly: Array<{
        aspect: string;
        part_id: number;
        evaluatee_type: string;
        evaluatee_grade: number;
        year: number;
        average_score: number;
    }>;
    part1AspectSummary: Array<{
        aspect: string;
        average_score: number;
        part_id: number;
        group: string;
    }>;
    weightedSummary: Array<{
        rating: number;
        grade: number;
        user_type: string;
        average: number;
    }>;
}

interface ReportChartsProps {
    data: ChartData;
}

const ReportCharts: React.FC<ReportChartsProps> = ({ data }) => {
    // Completion Rate Chart
    const completionChartOptions = useMemo(() => {
        const chartData = data.evaluateeCountByGrade.map(item => ({
            name: `C${item.grade} (${item.user_type})`,
            y: item.total > 0 ? (item.completed / item.total) * 100 : 0,
            completed: item.completed,
            total: item.total,
        }));

        return {
            chart: {
                type: 'column',
                height: 400,
                backgroundColor: 'transparent',
            },
            title: {
                text: 'อัตราความสำเร็จการประเมินตามระดับ',
                style: { fontSize: '18px', fontWeight: 'bold' },
            },
            xAxis: {
                categories: chartData.map(item => item.name),
                title: { text: 'ระดับและประเภทพนักงาน' },
            },
            yAxis: {
                title: { text: 'อัตราความสำเร็จ (%)' },
                max: 100,
            },
            plotOptions: {
                column: {
                    colorByPoint: true,
                    borderRadius: 4,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.1f}%',
                    },
                },
            },
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
            series: [{
                name: 'อัตราความสำเร็จ',
                data: chartData,
            }],
            tooltip: {
                pointFormat: '<b>{point.y:.1f}%</b><br/>เสร็จสิ้น: {point.completed}/{point.total} คน',
            },
            credits: { enabled: false },
        };
    }, [data.evaluateeCountByGrade]);

    // Score Distribution Chart
    const scoreDistributionOptions = useMemo(() => {
        const distributionData = data.weightedSummary.reduce((acc, item) => {
            const rating = item.rating;
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const pieData = [
            { name: 'ดีเยี่ยม (5)', y: distributionData[5] || 0, color: '#10B981' },
            { name: 'ดีมาก (4)', y: distributionData[4] || 0, color: '#3B82F6' },
            { name: 'ดี (3)', y: distributionData[3] || 0, color: '#F59E0B' },
            { name: 'ควรปรับปรุง (2)', y: distributionData[2] || 0, color: '#F97316' },
            { name: 'ต้องปรับปรุงมาก (1)', y: distributionData[1] || 0, color: '#EF4444' },
        ].filter(item => item.y > 0);

        return {
            chart: {
                type: 'pie',
                height: 400,
                backgroundColor: 'transparent',
            },
            title: {
                text: 'การกระจายผลการประเมิน',
                style: { fontSize: '18px', fontWeight: 'bold' },
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                    },
                    showInLegend: true,
                },
            },
            series: [{
                name: 'จำนวนคน',
                data: pieData,
            }],
            credits: { enabled: false },
        };
    }, [data.weightedSummary]);

    // Aspect Performance Chart
    const aspectPerformanceOptions = useMemo(() => {
        const aspectData = data.part1AspectSummary.reduce((acc, item) => {
            if (!acc[item.aspect]) {
                acc[item.aspect] = [];
            }
            acc[item.aspect].push({
                group: item.group,
                score: item.average_score,
            });
            return acc;
        }, {} as Record<string, Array<{ group: string; score: number }>>);

        const categories = Object.keys(aspectData);
        const groups = ['5-8', '9-12:internal', '9-12:external'];
        
        const series = groups.map(group => ({
            name: group === '5-8' ? 'พนักงานภายใน (C5-C8)' : 
                  group === '9-12:internal' ? 'ผู้บริหารภายใน (C9-C12)' : 'ผู้บริหารภายนอก (C9-C12)',
            data: categories.map(aspect => {
                const aspectGroup = aspectData[aspect]?.find(item => item.group === group);
                return aspectGroup ? aspectGroup.score : 0;
            }),
        }));

        return {
            chart: {
                type: 'bar',
                height: Math.max(400, categories.length * 25),
                backgroundColor: 'transparent',
            },
            title: {
                text: 'ผลการประเมินตามสมรรถนะ',
                style: { fontSize: '18px', fontWeight: 'bold' },
            },
            xAxis: {
                categories: categories,
                title: { text: 'สมรรถนะ' },
            },
            yAxis: {
                title: { text: 'คะแนนเฉลี่ย' },
                max: 5,
                plotLines: [{
                    value: 3,
                    color: '#F59E0B',
                    dashStyle: 'dash',
                    width: 2,
                    label: { text: 'เกณฑ์ผ่าน (3.0)' },
                }],
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f}',
                    },
                },
            },
            colors: ['#3B82F6', '#10B981', '#F59E0B'],
            series: series,
            credits: { enabled: false },
        };
    }, [data.part1AspectSummary]);

    return (
        <div className="space-y-6">
            {/* Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completion Rate Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">อัตราความสำเร็จ</h3>
                    </div>
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={completionChartOptions}
                    />
                </div>

                {/* Score Distribution Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">การกระจายผลการประเมิน</h3>
                    </div>
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={scoreDistributionOptions}
                    />
                </div>
            </div>

            {/* Aspect Performance Chart - Full Width */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">ผลการประเมินตามสมรรถนะ</h3>
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={aspectPerformanceOptions}
                />
            </div>
        </div>
    );
};

export default ReportCharts;