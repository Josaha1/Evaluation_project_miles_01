import React from "react";
import { Card } from "@/Components/ui/card";

interface Part1Aspect {
    aspect: string;
    average_score: number | string;
    group: "5-8" | "9-12:internal" | "9-12:external";
}

interface Props {
    aspects: Part1Aspect[];
}

const groupLabelMap: Record<Part1Aspect["group"], string> = {
    "5-8": "📘 คะแนนเฉลี่ยตามด้าน (กลุ่มระดับ 5–8)",
    "9-12:internal": "📗 คะแนนเฉลี่ยตามด้าน (ผู้บริหารระดับ 9–12 ภายใน)",
    "9-12:external": "📕 คะแนนเฉลี่ยตามด้าน (ผู้บริหารระดับ 9–12 ภายนอก)",
};
const validPartAspectCount: Record<Part1Aspect["group"], number> = {
    "5-8": 4,
    "9-12:internal": 6,
    "9-12:external": 6,
};

const AspectTables: React.FC<Props> = ({ aspects }) => {
    const grouped = aspects.reduce<Record<string, Part1Aspect[]>>(
        (acc, item) => {
            if (!acc[item.group]) acc[item.group] = [];
            acc[item.group].push(item);
            return acc;
        },
        {}
    );

    const renderTable = (
        groupData: Part1Aspect[],
        title: string,
        groupKey: Part1Aspect["group"]
    ) => {
        const limit = validPartAspectCount[groupKey] ?? groupData.length;
        const filteredData = groupData
            .sort((a, b) => a.aspect.localeCompare(b.aspect))
            .slice(0, limit); // 💥 ตัดจำนวนที่ควรแสดง

        return (
            <Card className="p-6 space-y-4" key={title}>
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="overflow-x-auto rounded shadow bg-white dark:bg-gray-800">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                            <tr>
                                <th className="text-left px-4 py-2">ด้าน</th>
                                <th className="text-right px-4 py-2">
                                    คะแนนเฉลี่ย
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, i) => (
                                <tr
                                    key={i}
                                    className="border-t border-gray-200 dark:border-gray-700"
                                >
                                    <td className="px-4 py-2 text-gray-800 dark:text-white">
                                        {item.aspect}
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
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
        );
    };

    return (
        <div className="space-y-8">
            {(Object.keys(grouped) as Part1Aspect["group"][]).map((groupKey) =>
                renderTable(
                    grouped[groupKey],
                    groupLabelMap[groupKey],
                    groupKey
                )
            )}
        </div>
    );
};

export default AspectTables;
