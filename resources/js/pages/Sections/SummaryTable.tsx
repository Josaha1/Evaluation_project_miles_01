// resources/js/Pages/AdminEvaluationReport/SummaryTable.tsx
import React from "react";
import { Card } from "@/Components/ui/card";

interface GradeSummary {
    grade: number;
    count: number;
    total: number;
}

interface Props {
    data: GradeSummary[];
}

const gradeLabel = (grade: number) =>
    grade >= 9 ? `ผู้บริหารระดับ ${grade}` : `พนักงานระดับ ${grade}`;

const SummaryTable: React.FC<Props> = ({ data }) => {
    const totalEvaluated = data.reduce((sum, row) => sum + row.count, 0);
    const totalAll = data.reduce((sum, row) => sum + row.total, 0);

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">👥 สรุปจำนวนผู้ถูกประเมิน</h2>
            <div className="overflow-x-auto rounded shadow bg-white dark:bg-gray-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                        <tr>
                            <th className="text-left px-4 py-2">ระดับ</th>
                            <th className="text-center px-4 py-2">จำนวนที่ถูกประเมิน</th>
                            <th className="text-center px-4 py-2">จำนวนทั้งหมด</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr
                                key={idx}
                                className="border-t border-gray-200 dark:border-gray-700 text-center"
                            >
                                <td className="text-left px-4 py-2 text-gray-800 dark:text-white">
                                    {gradeLabel(row.grade)}
                                </td>
                                <td className="px-4 py-2">{row.count}</td>
                                <td className="px-4 py-2">{row.total}</td>
                            </tr>
                        ))}
                        <tr className="font-semibold text-center border-t border-gray-300 dark:border-gray-700">
                            <td className="text-right px-4 py-2">รวม</td>
                            <td className="px-4 py-2">{totalEvaluated}</td>
                            <td className="px-4 py-2">{totalAll}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default SummaryTable;
