import React from "react";
import { Card } from "@/Components/ui/card";

interface EvaluatorSummaryItem {
    grade: number;
    user_type: string;
    total: number;
    completed: number;
    remaining: number;
}

interface Props {
    data: EvaluatorSummaryItem[];
    fiscalYear: string;
}

const gradeLabelMap: Record<number, string> = {
    5: "พนักงานระดับ C5",
    6: "พนักงานระดับ C6", 
    7: "พนักงานระดับ C7",
    8: "พนักงานระดับ C8",
    9: "ผู้บริหารระดับ C9",
    10: "ผู้บริหารระดับ C10",
    11: "ผู้บริหารระดับ C11",
    12: "ผู้บริหารระดับ C12",
};

const EvaluatorSummaryTable: React.FC<Props> = ({ data, fiscalYear }) => {
    const sortedData = [...data].sort((a, b) => {
        // เรียงตาม grade ASC ก่อน (C5, C6, C7... C12) แล้วภายใน grade ให้ internal มาก่อน external
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.user_type === "internal" ? -1 : 1;
    });

    const totalAll = data.reduce((sum, item) => sum + (item.total ?? 0), 0);
    const completedAll = data.reduce((sum, item) => sum + (item.completed ?? 0), 0);
    const remainingAll = data.reduce((sum, item) => sum + (item.remaining ?? 0), 0);

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            <Card className="p-8">
                <h2 className="text-xl font-bold mb-6">
                    🧾 1. สรุปจำนวนผู้ถูกประเมิน ปีงบประมาณ {parseInt(fiscalYear) + 543}
                </h2>
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="border px-4 py-2 text-left">กลุ่มผู้ถูกประเมิน</th>
                                <th className="border px-4 py-2 text-center">จำนวนทั้งหมด</th>
                                <th className="border px-4 py-2 text-center">ทำแบบประเมินแล้ว</th>
                                <th className="border px-4 py-2 text-center">ยังไม่ทำ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-4 text-gray-800 dark:text-white font-medium">
                                        {item.user_type === "external"
                                            ? `บุคคลภายนอกระดับ C${item.grade}`
                                            : gradeLabelMap[item.grade] || `พนักงานระดับ C${item.grade}`}
                                    </td>
                                    <td className="border px-4 py-2 text-center">{item.total ?? 0}</td>
                                    <td className="border px-4 py-2 text-center">{item.completed ?? 0}</td>
                                    <td className="border px-4 py-2 text-center">{item.remaining ?? 0}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 dark:bg-gray-900 font-semibold">
                                <td className="border px-4 py-2 text-right">รวม</td>
                                <td className="border px-4 py-2 text-center">{totalAll}</td>
                                <td className="border px-4 py-2 text-center">{completedAll}</td>
                                <td className="border px-4 py-2 text-center">{remainingAll}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default EvaluatorSummaryTable;
