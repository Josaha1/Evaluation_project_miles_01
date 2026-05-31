import React, { lazy, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, BarChart3, Users } from 'lucide-react';
import { getGradeLabel, getAngleLabel } from './types';

const LazyHighchartsReact = lazy(() =>
    Promise.all([import('highcharts'), import('highcharts-react-official')]).then(
        ([hc, hcReact]) => ({
            default: (props: any) => (
                <hcReact.default highcharts={hc.default} {...props} />
            ),
        })
    )
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnalyticsTabProps {
    evaluationMetrics: {
        byGrade: Array<{
            grade: number;
            total: number;
            completed: number;
            averageScore: number;
            completionRate: number;
        }>;
        byDivision: Array<{
            division: string;
            divisionId: number;
            total: number;
            completed: number;
            averageScore: number;
            completionRate: number;
        }>;
        byAngle: Array<{
            angle: string;
            total: number;
            completed: number;
            averageScore: number;
        }>;
        trends: Array<{
            date: string;
            completions: number;
            averageScore: number;
        }>;
    };
    externalOrgMetrics: Array<{
        org_id: number;
        org_name: string;
        total_responses: number;
        avg_score: number;
        evaluatee_count: number;
        evaluator_count?: number;
    }>;
}

// ---------------------------------------------------------------------------
// Shared chart defaults
// ---------------------------------------------------------------------------

const baseChartOptions: Partial<Highcharts.Options> = {
    credits: { enabled: false },
    chart: {
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
    },
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
    }),
};

// ---------------------------------------------------------------------------
// Chart loading fallback
// ---------------------------------------------------------------------------

function ChartFallback() {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreBarColor(score: number): string {
    if (score >= 4) return '#22c55e';
    if (score >= 3) return '#3b82f6';
    return '#ef4444';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnalyticsTab({
    evaluationMetrics,
    externalOrgMetrics,
}: AnalyticsTabProps) {
    // -----------------------------------------------------------------------
    // Chart 1: คะแนนเฉลี่ยผู้ถูกประเมินตามหน่วยงาน (horizontal bar)
    // -----------------------------------------------------------------------

    const divisionChartOptions: Highcharts.Options = useMemo(
        () => ({
            ...baseChartOptions,
            chart: {
                ...baseChartOptions.chart,
                type: 'bar',
            },
            title: {
                text: 'คะแนนเฉลี่ยผู้ถูกประเมินตามหน่วยงาน',
                style: { fontSize: '16px', fontWeight: '600' },
            },
            xAxis: {
                categories: evaluationMetrics.byDivision.map((d) => d.division),
                title: { text: null },
                labels: {
                    style: { fontSize: '12px' },
                },
            },
            yAxis: {
                min: 0,
                max: 5,
                title: { text: 'คะแนนเฉลี่ย' },
            },
            tooltip: {
                pointFormat:
                    '<b>{point.y:.2f}</b> คะแนน<br/>จำนวนผู้ถูกประเมิน: <b>{point.count}</b>',
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f} ({point.count} คน)',
                        style: { fontSize: '11px', fontWeight: '500' },
                    },
                    colorByPoint: true,
                },
            },
            legend: { enabled: false },
            series: [
                {
                    type: 'bar' as const,
                    name: 'คะแนนเฉลี่ย',
                    data: evaluationMetrics.byDivision.map((d) => ({
                        y: d.averageScore,
                        color: scoreBarColor(d.averageScore),
                        count: d.total,
                    } as any)),
                },
            ],
        }),
        [evaluationMetrics.byDivision]
    );

    // -----------------------------------------------------------------------
    // Chart 2: คะแนนเฉลี่ยตามกลุ่มระดับ (column + line dual axis)
    // -----------------------------------------------------------------------

    const gradeGroupData = useMemo(() => {
        const groups = [
            { key: 'governor', label: 'ผู้ว่าการ', color: '#f43f5e', scores: [] as number[], totals: [] as number[], completeds: [] as number[] },
            { key: 'executive', label: 'ผู้บริหาร', color: '#f59e0b', scores: [] as number[], totals: [] as number[], completeds: [] as number[] },
            { key: 'staff', label: 'พนักงาน', color: '#06b6d4', scores: [] as number[], totals: [] as number[], completeds: [] as number[] },
        ];

        evaluationMetrics.byGrade.forEach((g) => {
            if (g.grade >= 13) {
                groups[0].scores.push(g.averageScore);
                groups[0].totals.push(g.total);
                groups[0].completeds.push(g.completed);
            } else if (g.grade >= 9 && g.grade <= 12) {
                groups[1].scores.push(g.averageScore);
                groups[1].totals.push(g.total);
                groups[1].completeds.push(g.completed);
            } else if (g.grade >= 4 && g.grade <= 8) {
                groups[2].scores.push(g.averageScore);
                groups[2].totals.push(g.total);
                groups[2].completeds.push(g.completed);
            }
        });

        return groups.map((g) => {
            const avgScore =
                g.scores.length > 0
                    ? g.scores.reduce((a, b) => a + b, 0) / g.scores.length
                    : 0;
            const totalSum = g.totals.reduce((a, b) => a + b, 0);
            const completedSum = g.completeds.reduce((a, b) => a + b, 0);
            const completionRate = totalSum > 0 ? (completedSum / totalSum) * 100 : 0;
            return {
                label: g.label,
                color: g.color,
                avgScore,
                completionRate,
            };
        });
    }, [evaluationMetrics.byGrade]);

    const gradeChartOptions: Highcharts.Options = useMemo(
        () => ({
            ...baseChartOptions,
            chart: {
                ...baseChartOptions.chart,
            },
            title: {
                text: 'คะแนนเฉลี่ยตามกลุ่มระดับ',
                style: { fontSize: '16px', fontWeight: '600' },
            },
            xAxis: {
                categories: gradeGroupData.map((g) => g.label),
                title: { text: null },
            },
            yAxis: [
                {
                    min: 0,
                    max: 5,
                    title: { text: 'คะแนนเฉลี่ย' },
                },
                {
                    min: 0,
                    max: 100,
                    title: { text: 'อัตราสำเร็จ (%)' },
                    opposite: true,
                    labels: { format: '{value}%' },
                },
            ],
            tooltip: { shared: true },
            legend: { enabled: true },
            plotOptions: {
                column: {
                    dataLabels: { enabled: true, format: '{y:.2f}' },
                    borderRadius: 4,
                },
                line: {
                    dataLabels: { enabled: true, format: '{y:.1f}%' },
                },
            },
            series: [
                {
                    type: 'column' as const,
                    name: 'คะแนนเฉลี่ย',
                    yAxis: 0,
                    data: gradeGroupData.map((g) => ({
                        y: g.avgScore,
                        color: g.color,
                    })),
                    colorByPoint: true,
                } as any,
                {
                    type: 'line' as const,
                    name: 'อัตราสำเร็จ',
                    yAxis: 1,
                    color: '#8b5cf6',
                    data: gradeGroupData.map((g) => g.completionRate),
                    marker: { enabled: true, radius: 5 },
                    lineWidth: 2,
                },
            ],
        }),
        [gradeGroupData]
    );

    // -----------------------------------------------------------------------
    // Chart 3: แนวโน้มการประเมินรายเดือน (dual-axis: column + line)
    // -----------------------------------------------------------------------

    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const trendsData = evaluationMetrics.trends.filter((t) => t.completions > 0 || t.averageScore > 0);
    const hasData = trendsData.length > 0;

    const trendsChartOptions: Highcharts.Options = useMemo(
        () => ({
            ...baseChartOptions,
            chart: {
                ...baseChartOptions.chart,
                height: 380,
            },
            title: { text: undefined },
            xAxis: {
                categories: evaluationMetrics.trends.map((t) => {
                    const d = new Date(t.date);
                    return thaiMonths[d.getMonth()] + ' ' + (d.getFullYear() + 543).toString().slice(-2);
                }),
                labels: { style: { fontSize: '11px' } },
                crosshair: true,
            },
            yAxis: [
                {
                    min: 0,
                    title: { text: 'จำนวน (ครั้ง)', style: { color: '#8b5cf6', fontSize: '12px' } },
                    labels: { style: { color: '#8b5cf6' } },
                    gridLineColor: '#f3f4f6',
                },
                {
                    min: 0,
                    max: 5,
                    title: { text: 'คะแนนเฉลี่ย', style: { color: '#10b981', fontSize: '12px' } },
                    labels: { style: { color: '#10b981' } },
                    opposite: true,
                    gridLineWidth: 0,
                    plotLines: [{
                        value: 3,
                        color: '#fbbf24',
                        dashStyle: 'Dash' as any,
                        width: 1,
                        label: { text: 'เกณฑ์ขั้นต่ำ', style: { color: '#fbbf24', fontSize: '10px' } },
                    }],
                },
            ],
            tooltip: {
                shared: true,
                useHTML: true,
                headerFormat: '<span style="font-size:13px;font-weight:bold">{point.key}</span><br/>',
                pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
            },
            legend: {
                enabled: true,
                align: 'center' as any,
                verticalAlign: 'bottom' as any,
                itemStyle: { fontSize: '12px' },
            },
            plotOptions: {
                column: {
                    borderRadius: 6,
                    groupPadding: 0.1,
                },
                line: {
                    lineWidth: 3,
                },
            },
            series: [
                {
                    type: 'column' as const,
                    name: 'จำนวนการประเมินที่เสร็จ',
                    yAxis: 0,
                    color: '#8b5cf6',
                    data: evaluationMetrics.trends.map((t) => t.completions),
                },
                {
                    type: 'spline' as const,
                    name: 'คะแนนเฉลี่ย',
                    yAxis: 1,
                    color: '#10b981',
                    data: evaluationMetrics.trends.map((t) => t.averageScore > 0 ? t.averageScore : null),
                    marker: { enabled: true, radius: 5, symbol: 'circle' },
                    connectNulls: false,
                },
            ],
        }),
        [evaluationMetrics.trends]
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="space-y-6">
            {/* Chart 1: คะแนนเฉลี่ยผู้ถูกประเมินตามหน่วยงาน */}
            <motion.div
                className="glass-card rounded-2xl p-6"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                custom={0}
            >
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        คะแนนเฉลี่ยผู้ถูกประเมินแยกตามหน่วยงาน
                    </h3>
                </div>
                <Suspense fallback={<ChartFallback />}>
                    <LazyHighchartsReact options={divisionChartOptions} />
                </Suspense>
            </motion.div>

            {/* Chart 2: คะแนนเฉลี่ยตามกลุ่มระดับ */}
            <motion.div
                className="glass-card rounded-2xl p-6"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                custom={1}
            >
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        เปรียบเทียบคะแนนและอัตราสำเร็จตามกลุ่มระดับ
                    </h3>
                </div>
                <Suspense fallback={<ChartFallback />}>
                    <LazyHighchartsReact options={gradeChartOptions} />
                </Suspense>
            </motion.div>

            {/* Chart 3: แนวโน้มการประเมินรายเดือน */}
            <motion.div
                className="glass-card rounded-2xl p-6"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                custom={2}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-violet-500" />
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            แนวโน้มจำนวนการประเมินและคะแนนเฉลี่ยรายเดือน
                        </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-500" /> จำนวน</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> คะแนนเฉลี่ย</span>
                    </div>
                </div>

                {hasData ? (
                    <Suspense fallback={<ChartFallback />}>
                        <LazyHighchartsReact options={trendsChartOptions} />
                    </Suspense>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">ยังไม่มีข้อมูลแนวโน้มรายเดือน</p>
                        <p className="text-xs mt-1">ข้อมูลจะแสดงเมื่อมีการประเมินในช่วง 12 เดือนที่ผ่านมา</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
