import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";

interface Organization {
    id: number;
    name: string;
}

interface Evaluation {
    id: number;
    title: string;
    user_type: string;
    grade_min: number;
    grade_max: number;
}

interface Evaluatee {
    id: number;
    fname: string;
    lname: string;
    grade: number;
    emid: string;
}

interface PageProps {
    organizations: Organization[];
    evaluations: Evaluation[];
    evaluatees: Evaluatee[];
}

export default function AdminAccessCodeGenerate() {
    const { organizations, evaluations, evaluatees } = usePage<PageProps>().props;

    const currentFiscalYear = new Date().getMonth() >= 9
        ? new Date().getFullYear() + 1 + 543
        : new Date().getFullYear() + 543;

    const { data, setData, post, processing, errors } = useForm({
        organization_id: "",
        evaluation_id: "",
        evaluatee_ids: [] as number[],
        fiscal_year: String(currentFiscalYear),
        expires_at: "",
    });

    const [searchEvaluatee, setSearchEvaluatee] = useState("");

    const filteredEvaluatees = evaluatees.filter((e) => {
        const name = `${e.fname} ${e.lname} ${e.emid}`.toLowerCase();
        return name.includes(searchEvaluatee.toLowerCase());
    });

    const toggleEvaluatee = (id: number) => {
        setData(
            "evaluatee_ids",
            data.evaluatee_ids.includes(id)
                ? data.evaluatee_ids.filter((i) => i !== id)
                : [...data.evaluatee_ids, id]
        );
    };

    const selectAllFiltered = () => {
        const allIds = filteredEvaluatees.map((e) => e.id);
        const newIds = [...new Set([...data.evaluatee_ids, ...allIds])];
        setData("evaluatee_ids", newIds);
    };

    const clearSelection = () => {
        setData("evaluatee_ids", []);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.access-codes.generate"), {
            onSuccess: () => toast.success("สร้าง Access Code เรียบร้อยแล้ว"),
            onError: () => toast.error("ไม่สามารถสร้าง Access Code ได้"),
        });
    };

    return (
        <MainLayout
            title="สร้าง Access Code"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการ Access Codes", href: route("admin.access-codes.index") },
                        { label: "สร้าง Code ใหม่", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-4xl mx-auto px-6 py-10">
                <Card className="p-8 space-y-6">
                    <h1 className="text-2xl font-bold text-indigo-600">
                        สร้าง Access Code สำหรับผู้ประเมินภายนอก
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Organization */}
                            <div>
                                <Label>องค์กรภายนอก *</Label>
                                <select
                                    value={data.organization_id}
                                    onChange={(e) => setData("organization_id", e.target.value)}
                                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                >
                                    <option value="">-- เลือกองค์กร --</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                                {errors.organization_id && <p className="text-red-500 text-sm mt-1">{errors.organization_id}</p>}
                            </div>

                            {/* Evaluation */}
                            <div>
                                <Label>แบบประเมิน *</Label>
                                <select
                                    value={data.evaluation_id}
                                    onChange={(e) => setData("evaluation_id", e.target.value)}
                                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                >
                                    <option value="">-- เลือกแบบประเมิน --</option>
                                    {evaluations.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.title} (Grade {ev.grade_min}-{ev.grade_max})
                                        </option>
                                    ))}
                                </select>
                                {errors.evaluation_id && <p className="text-red-500 text-sm mt-1">{errors.evaluation_id}</p>}
                            </div>

                            {/* Fiscal Year */}
                            <div>
                                <Label>ปีงบประมาณ *</Label>
                                <Input
                                    type="number"
                                    value={data.fiscal_year}
                                    onChange={(e) => setData("fiscal_year", e.target.value)}
                                    className="dark:bg-gray-800 dark:text-white"
                                />
                                {errors.fiscal_year && <p className="text-red-500 text-sm mt-1">{errors.fiscal_year}</p>}
                            </div>

                            {/* Expiry */}
                            <div>
                                <Label>วันหมดอายุ (ไม่บังคับ)</Label>
                                <Input
                                    type="date"
                                    value={data.expires_at}
                                    onChange={(e) => setData("expires_at", e.target.value)}
                                    className="dark:bg-gray-800 dark:text-white"
                                />
                                {errors.expires_at && <p className="text-red-500 text-sm mt-1">{errors.expires_at}</p>}
                            </div>
                        </div>

                        {/* Evaluatee Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>เลือกผู้ถูกประเมิน * (เลือกแล้ว {data.evaluatee_ids.length} คน)</Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllFiltered}
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        เลือกทั้งหมด
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        ล้างการเลือก
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={searchEvaluatee}
                                onChange={(e) => setSearchEvaluatee(e.target.value)}
                                placeholder="ค้นหาผู้ถูกประเมิน..."
                                className="w-full border rounded px-3 py-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            />
                            {errors.evaluatee_ids && <p className="text-red-500 text-sm mb-2">{errors.evaluatee_ids}</p>}

                            <div className="border rounded dark:border-gray-600 max-h-64 overflow-y-auto">
                                {filteredEvaluatees.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        ไม่พบผู้ถูกประเมินที่มีการมอบหมายองศาขวา
                                    </div>
                                ) : (
                                    filteredEvaluatees.map((evaluatee) => (
                                        <label
                                            key={evaluatee.id}
                                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0 ${
                                                data.evaluatee_ids.includes(evaluatee.id)
                                                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                                                    : ""
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.evaluatee_ids.includes(evaluatee.id)}
                                                onChange={() => toggleEvaluatee(evaluatee.id)}
                                                className="w-4 h-4 rounded text-indigo-600"
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-gray-800 dark:text-white">
                                                    {evaluatee.fname} {evaluatee.lname}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({evaluatee.emid}) Grade {evaluatee.grade}
                                                </span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <a
                                href={route("admin.access-codes.index")}
                                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                ยกเลิก
                            </a>
                            <Button type="submit" disabled={processing}>
                                {processing ? "กำลังสร้าง..." : `สร้าง Access Code (${data.evaluatee_ids.length} รายการ)`}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
}
