import MainLayout from "@/Layouts/MainLayout";
import { Progress } from "@/components/ui/progress";
const evaluations = [
    {
        id: 1,
        name: "นายสมชาย กล้าหาญ",
        photo: "https://unsplash.com/photos/LNRyGwIJr5c",
        status: "กำลังดำเนินการ",
        position: "ผู้ช่วยผู้ว่าการ",
        grade: 11,
        progress: 50,
    },
    {
        id: 2,
        name: "นางสาวอรทัย แสงจันทร์",
        photo: "/images/orn.jpg",
        status: "ยังไม่เริ่ม",
        position: "ผู้อำนวยการฝ่าย",
        grade: 10,
        progress: 0,
    },
    {
        id: 3,
        name: "นายพีระพงษ์ ใจดี",
        photo: "/images/peera.jpg",
        status: "เสร็จสมบูรณ์",
        position: "ผู้อำนวยการกอง",
        grade: 9,
        progress: 100,
    },
];
export default function Dashboard() {
    return (
        <MainLayout title="Dashboard">
            <div className="max-w-5xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    รายการที่ต้องประเมิน
                </h1>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg shadow">
                        <thead className="bg-gray-100 dark:bg-gray-800 text-center">
                            <tr>
                                <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">ชื่อ</th>
                                <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">ตำแหน่ง</th>
                                <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">ระดับ</th>
                                <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">สถานะ</th>
                                <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">ความคืบหน้า</th>
                                <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 text-center">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {evaluations.map((evalItem) => (
                                <tr key={evalItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img
                                            src={evalItem.photo}
                                            alt={evalItem.name}
                                            className="w-10 h-10 rounded-full object-cover border"
                                        />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {evalItem.name}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {evalItem.position}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {evalItem.grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className={`inline-block px-3 py-1 text-xs font-semibold text-center rounded-full ${evalItem.status === "เสร็จสมบูรณ์"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                : evalItem.status === "กำลังดำเนินการ"
                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                }`}
                                        >
                                            {evalItem.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 w-1/3">
                                        <Progress value={evalItem.progress} className="h-2" />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {evalItem.progress < 100 ? (
                                            <a
                                                href={`/evaluation/${evalItem.id}`}
                                                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1.5 px-4 rounded-full transition"
                                            >
                                                เริ่มประเมิน
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">เสร็จแล้ว</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    )
}