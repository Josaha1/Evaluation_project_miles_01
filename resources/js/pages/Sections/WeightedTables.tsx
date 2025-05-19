import React, { useState } from "react";
import { Card } from "@/Components/ui/card";

interface WeightedSummaryItem {
    id: number;
    name: string;
    position?: string;
    grade?: number;
    division?: string;
    self?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    average: number;
}

interface Props {
    data: WeightedSummaryItem[];
    title: string;
}

const gradeLabel = (grade?: number) => {
    if (grade === undefined) return "-";
    return grade >= 9 ? `ผู้บริหารระดับ ${grade}` : `พนักงานระดับ ${grade}`;
};

const scoreLabel = (score: number) => {
    if (score > 4.5) return "ดีเยี่ยม";
    if (score >= 4.0) return "ดีมาก";
    if (score >= 3.0) return "ดี";
    if (score >= 2.0) return "ต้องปรับปรุง";
    return "ต้องปรับปรุงมาก";
};

const WeightedTables: React.FC<Props> = ({ data, title }) => {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filtered = data.filter((row) =>
        row.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const isGroup912 = title.includes("9–12");

    const renderPagination = () => (
        <div className="flex justify-center mt-4 gap-1">
            <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-indigo-500 hover:text-white dark:bg-gray-700 dark:text-white"
            >
                «
            </button>
            {Array.from({ length: totalPages })
                .map((_, i) => i + 1)
                .filter(
                    (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                )
                .reduce<(number | "...")[]>((acc, page, i, arr) => {
                    if (
                        i > 0 &&
                        typeof page === "number" &&
                        typeof arr[i - 1] === "number" &&
                        page - (arr[i - 1] as number) > 1
                    ) {
                        acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                }, [])
                .map((page, i) =>
                    page === "..." ? (
                        <span key={i} className="px-3 py-1 text-gray-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(Number(page))}
                            className={`px-3 py-1 rounded text-sm ${
                                currentPage === page
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}
            <button
                onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-indigo-500 hover:text-white dark:bg-gray-700 dark:text-white" 
            >
                »
            </button>
        </div>
    );

    return (
        <Card className="p-6 mt-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <input
                    type="text"
                    placeholder="🔍 ค้นหาชื่อ..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="border px-3 py-2 rounded w-64"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm bg-white dark:bg-gray-800">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                            <th className="px-4 py-2 text-left">ชื่อ</th>
                            <th>ตำแหน่ง</th>
                            <th>ระดับ</th>
                            <th>สายงาน</th>
                            <th>Self</th>
                            <th>Top</th>
                            {isGroup912 && <th>Bottom</th>}
                            <th>Left</th>
                            {isGroup912 && <th>Right</th>}
                            <th>รวม</th>
                            <th>ผลลัพธ์</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((user, i) => (
                            <tr
                                key={i}
                                className="text-center hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <td className="px-4 py-2 text-left font-medium text-gray-800 dark:text-white">
                                    {user.name}
                                </td>
                                <td>{user.position ?? "-"}</td>
                                <td>{gradeLabel(user.grade)}</td>
                                <td>{user.division ?? "-"}</td>
                                <td>{user.self?.toFixed(2) ?? "-"}</td>
                                <td>{user.top?.toFixed(2) ?? "-"}</td>
                                {isGroup912 && (
                                    <td>{user.bottom?.toFixed(2) ?? "-"}</td>
                                )}
                                <td>{user.left?.toFixed(2) ?? "-"}</td>
                                {isGroup912 && (
                                    <td>{user.right?.toFixed(2) ?? "-"}</td>
                                )}
                                <td className="font-bold">
                                    {user.average.toFixed(2)}
                                </td>
                                <td>{scoreLabel(user.average)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && renderPagination()}
            </div>
        </Card>
    );
};

export default WeightedTables;
