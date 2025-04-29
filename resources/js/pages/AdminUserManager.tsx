import MainLayout from '@/Layouts/MainLayout';
import { usePage, router } from '@inertiajs/react';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/Components/ui/breadcrumb'
interface User {
    id: number;
    emid: string;
    prename: string;
    fname: string;
    lname: string;
    sex: string;
    position: string;
    grade: string;
    organize: string;
    user_type: string;
    role: string;
    photo?: string;
}
interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}
export default function AdminUserManager() {
    const { users, filters } = usePage<{ users: Paginated<User>, filters: { search: string } }>().props;
    const [search, setSearch] = useState(filters.search || '');
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(route('admin.users.index'), { search }, {
                preserveState: true,
                replace: true
            });
        }, 400); // รอ 400ms หลังจากหยุดพิมพ์

        return () => clearTimeout(timeout);
    }, [search]);
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search }, { preserveState: true, replace: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้?')) {
            router.delete(route('admin.users.destroy', { user: id }))
        }
    }

    const handleExport = () => {
        router.visit(route('admin.users.export'), { method: 'get' });
    }

    return (
        <MainLayout title="จัดการสมาชิก" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    //   { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: 'จัดการสมาชิก', active: true },
                ]}
            />
        }>
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">รายชื่อสมาชิก</h1>
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อหรือ EMID..."
                            className="border rounded px-4 py-2 dark:bg-gray-900 dark:text-white"
                        />
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow"
                        >
                            📤 ส่งออก Excel
                        </button>
                        <a
                            href={route('admin.users.create')}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มสมาชิกใหม่
                        </a>
                    </div>
                </div>

                {users.data.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-20 border rounded bg-white dark:bg-gray-800 shadow">
                        ไม่พบข้อมูลสมาชิก 🙁
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-4 text-left">ชื่อ - สกุล</th>
                                    <th className="p-4">EMID</th>
                                    <th className="p-4">ตำแหน่ง</th>
                                    <th className="p-4">ระดับ</th>
                                    <th className="p-4">สังกัด</th>
                                    <th className="p-4">ประเภท</th>
                                    <th className="p-4">บทบาท</th>
                                    <th className="p-4 text-center">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.data.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="p-4 flex items-center gap-3">
                                            <img
                                                src={user.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fname + '+' + user.lname)}
                                                alt={user.fname}
                                                className="w-10 h-10 rounded-full border object-cover"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-white">
                                                    {user.prename} {user.fname} {user.lname}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.position}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">{user.emid}</td>
                                        <td className="p-4 text-center">{user.position}</td>
                                        <td className="p-4 text-center">{user.grade}</td>
                                        <td className="p-4 text-center">{user.organize}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${user.user_type === 'internal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                                {user.user_type === 'internal' ? 'ภายใน' : 'ภายนอก'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="flex justify-center items-center gap-2">
                                            <a
                                                href={route('admin.users.edit', { user: user.emid })}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                )}
                {users.links.length > 1 && (
                    <div className="flex justify-end mt-6 space-x-1">
                        {users.links.map((link, index) => (
                            <button
                                key={index}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.visit(link.url, {
                                        preserveScroll: true,
                                        preserveState: true,
                                        data: {
                                            page: new URL(link.url).searchParams.get("page"), // ⭐ ส่งหน้าไปทุกครั้ง
                                            // เพิ่ม parameter อื่นได้ตรงนี้ เช่น search: searchTerm
                                        },
                                    })
                                }
                                className={`px-3 py-1 border rounded text-sm ${link.active
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-white'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
