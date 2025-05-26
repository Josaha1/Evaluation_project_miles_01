import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { useForm, usePage, router } from "@inertiajs/react";
import { Trash2, PlusCircle, Eye, EyeOff } from "lucide-react";
import Select from "react-select";
import Breadcrumb from "@/Components/ui/breadcrumb";

export default function AdminEvaluationAssignmentManager() {
    const {
        assignments,
        fiscal_years = [],
        selected_year,
    } = usePage().props as any;

    const yearOptions = fiscal_years.map((y: string) => ({
        value: y,
        label: `ปีงบประมาณ ${parseInt(y) + 543}`,
    }));

    const [selectedYear, setSelectedYear] = useState({
        value: selected_year,
        label: `ปีงบประมาณ ${parseInt(selected_year) + 543}`,
    });

    const [showTableView, setShowTableView] = useState(false);

    useEffect(() => {
        router.visit(route("assignments.index"), {
            method: "get",
            data: { fiscal_year: selectedYear.value },
            preserveState: true,
            preserveScroll: true,
        });
    }, [selectedYear]);

    // จัดกลุ่มข้อมูลตามผู้ถูกประเมิน
    const groupedAssignments = useMemo(() => {
        const grouped: { [key: string]: any } = {};
        
        assignments.data.forEach((assignment: any) => {
            const evaluateeKey = assignment.evaluatee 
                ? `${assignment.evaluatee.id}_${assignment.evaluatee.fname}_${assignment.evaluatee.lname}`
                : 'unknown';
            
            if (!grouped[evaluateeKey]) {
                grouped[evaluateeKey] = {
                    evaluatee: assignment.evaluatee,
                    assignments: {
                        บน: null,
                        ล่าง: null,
                        ซ้าย: null,
                        ขวา: null,
                    }
                };
            }
            
            const angle = assignment.angle || 'unknown';
            grouped[evaluateeKey].assignments[angle] = assignment;
        });
        
        return Object.values(grouped);
    }, [assignments.data]);

    const handleDelete = (id: number) => {
        if (confirm("คุณต้องการลบรายการนี้หรือไม่?")) {
            router.delete(route("assignments.destroy", { assignment: id }));
        }
    };

    const getAngleColor = (angle: string) => {
        const colors = {
            'บน': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'ล่าง': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'ซ้าย': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'ขวา': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        };
        return colors[angle as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    const getAngleIcon = (angle: string) => {
        const icons = {
            'บน': '⬆️',
            'ล่าง': '⬇️',
            'ซ้าย': '⬅️',
            'ขวา': '➡️',
        };
        return icons[angle as keyof typeof icons] || '❓';
    };

    const renderOriginalTable = () => (
        <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-zinc-900">
            <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                    <tr>
                        <th className="p-4 text-left">👨‍🏫 ผู้ประเมิน</th>
                        <th className="p-4 text-left">🎯 ผู้ถูกประเมิน</th>
                        <th className="p-4 text-left">🧭 องศา</th>
                        <th className="p-4 text-center">📅 ปีงบ</th>
                        <th className="p-4 text-center">⚙️ การจัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {assignments.data.map((a: any) => (
                        <tr
                            key={a.id}
                            className="hover:bg-gray-50 dark:hover:bg-zinc-800"
                        >
                            <td className="p-4">
                                {a.evaluator
                                    ? `${a.evaluator.fname} ${a.evaluator.lname}`
                                    : "ไม่พบข้อมูล"}
                            </td>
                            <td className="p-4">
                                {a.evaluatee
                                    ? `${a.evaluatee.fname} ${a.evaluatee.lname}`
                                    : "ไม่พบข้อมูล"}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAngleColor(a.angle)}`}>
                                    {getAngleIcon(a.angle)} {a.angle || "-"}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                {parseInt(a.fiscal_year) + 543}
                            </td>
                            <td className="p-4 text-center">
                                <button
                                    onClick={() => handleDelete(a.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderAnalysisTable = () => (
        <div className="space-y-6">
            {groupedAssignments.map((group: any, index: number) => (
                <div key={index} className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
                    {/* Header แสดงชื่อผู้ถูกประเมิน */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    🎯 ผู้ถูกประเมิน: {group.evaluatee 
                                        ? `${group.evaluatee.fname} ${group.evaluatee.lname}`
                                        : "ไม่พบข้อมูล"
                                    }
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1">
                                    ปีงบประมาณ {parseInt(selected_year) + 543}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm opacity-90">จำนวนผู้ประเมิน</div>
                                <div className="text-2xl font-bold">
                                    {Object.values(group.assignments).filter(a => a !== null).length}/4
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid แสดงผู้ประเมินตามองศา */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {['บน', 'ล่าง', 'ซ้าย', 'ขวา'].map((angle) => {
                                const assignment = group.assignments[angle];
                                return (
                                    <div key={angle} className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                                        assignment 
                                            ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600' 
                                            : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
                                    }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAngleColor(angle)}`}>
                                                {getAngleIcon(angle)} องศา{angle}
                                            </span>
                                            {assignment && (
                                                <button
                                                    onClick={() => handleDelete(assignment.id)}
                                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                                    title="ลบความสัมพันธ์"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        
                                        {assignment ? (
                                            <div className="space-y-2">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    👨‍🏫 {assignment.evaluator 
                                                        ? `${assignment.evaluator.fname} ${assignment.evaluator.lname}`
                                                        : "ไม่พบข้อมูล"
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    ID: {assignment.id}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                                                <div className="text-2xl mb-2">👤</div>
                                                <div className="text-sm">ยังไม่มีผู้ประเมิน</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* สรุปสถานะ */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex space-x-4">
                                    <span className="text-green-600 dark:text-green-400">
                                        ✅ มีผู้ประเมิน: {Object.values(group.assignments).filter(a => a !== null).length} องศา
                                    </span>
                                    <span className="text-red-600 dark:text-red-400">
                                        ❌ ขาดผู้ประเมิน: {Object.values(group.assignments).filter(a => a === null).length} องศา
                                    </span>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    Object.values(group.assignments).filter(a => a !== null).length === 4
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                    {Object.values(group.assignments).filter(a => a !== null).length === 4 
                                        ? '🎉 ครบทุกองศา' 
                                        : '⚠️ ยังไม่ครบ'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <MainLayout
            title="จัดการผู้ประเมิน-ผู้ถูกประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        {
                            label: "แดชบอร์ดผู้ดูแลระบบ",
                            href: route("admindashboard"),
                        },
                        {
                            label: "จัดการผู้ประเมิน-ผู้ถูกประเมิน",
                            active: true,
                        },
                    ]}
                />
            }
        >
            <div className="max-w-7xl mx-auto py-10 space-y-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        📋 รายการความสัมพันธ์การประเมิน
                    </h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Select
                            className="w-60"
                            options={yearOptions}
                            value={selectedYear}
                            onChange={(v) => v && setSelectedYear(v)}
                            classNamePrefix="react-select"
                            isSearchable={false}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowTableView(!showTableView)}
                                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                                {showTableView ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                {showTableView ? 'มุมมองวิเคราะห์' : 'มุมมองตาราง'}
                            </button>
                            <a
                                href={route("assignments.create")}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                เพิ่มความสัมพันธ์
                            </a>
                        </div>
                    </div>
                </div>

                {/* สถิติรวม */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {groupedAssignments.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">ผู้ถูกประเมินทั้งหมด</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {assignments.data.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">ความสัมพันธ์ทั้งหมด</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {groupedAssignments.filter(g => Object.values(g.assignments).filter(a => a !== null).length === 4).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">ประเมินครบทุกองศา</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {groupedAssignments.filter(g => Object.values(g.assignments).filter(a => a !== null).length < 4).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">ยังประเมินไม่ครบ</div>
                    </div>
                </div>

                {/* แสดงตารางตามมุมมองที่เลือก */}
                {showTableView ? renderOriginalTable() : renderAnalysisTable()}

                {/* Pagination */}
                {assignments?.links && assignments.links.length > 3 && (
                    <div className="flex justify-center mt-6 gap-2 flex-wrap text-sm">
                        {assignments.links.map((link: any, i: number) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.visit(link.url, {
                                        preserveScroll: true,
                                        preserveState: true,
                                        data: {
                                            fiscal_year: selectedYear.value,
                                        },
                                    })
                                }
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded text-sm transition-colors ${
                                    link.active
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}