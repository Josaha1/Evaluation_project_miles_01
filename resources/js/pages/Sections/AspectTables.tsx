import React from "react";
import { Card } from "@/Components/ui/card";

interface Part1Aspect {
    aspect: string;
    average_score: number | string;
    group: "5-8" | "9-12";
}

interface Props {
    aspects: Part1Aspect[];
}

const AspectTables: React.FC<Props> = ({ aspects }) => {
    const group5to8 = aspects.filter((a) => a.group === "5-8");
    const group9to12 = aspects.filter((a) => a.group === "9-12");

    const renderTable = (groupData: Part1Aspect[], title: string) => (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <div className="overflow-x-auto rounded shadow bg-white dark:bg-gray-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="text-left px-4 py-2">ด้าน</th>
                            <th className="text-right px-4 py-2">คะแนนเฉลี่ย</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupData.map((item, i) => (
                            <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-2 text-gray-800 dark:text-white">
                                    {item.aspect}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                                    {parseFloat(item.average_score as string).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="space-y-8">
            {renderTable(group5to8, "📘 คะแนนเฉลี่ยตามด้าน กลุ่มระดับ 5–8")}
            {renderTable(group9to12, "📗 คะแนนเฉลี่ยตามด้าน กลุ่มระดับ 9–12")}
        </div>
    );
};

export default AspectTables;