import React, { useMemo, useState } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { useForm, usePage } from "@inertiajs/react";
import Select from "react-select";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { User } from "@/types";
import { router } from "@inertiajs/react";
interface OptionType {
    value: number;
    label: string;
    grade: number;
    division_id?: number;
    department_id?: number;
    position_title?: string;
    user_type?: string;
}

const allAngleOptions = [
    { value: "top", label: "องศาบน (เจ้านาย)" },
    { value: "bottom", label: "องศาล่าง (ลูกน้อง)" },
    { value: "left", label: "องศาซ้าย (เพื่อนสายงานเดียวกัน)" },
    { value: "right", label: "องศาขวา (สายงานอื่นเกี่ยวข้อง)" },
];

export default function AdminEvaluationAssignmentForm() {
    const { users } = usePage<{ users: User[] }>().props;

    const userOptions: OptionType[] = useMemo(
        () =>
            users.map((u) => ({
                value: u.id,
                label: `${u.fname} ${u.lname} (${
                    u.position?.title ?? "ไม่ระบุตำแหน่ง"
                } / ${u.department?.name ?? "ไม่ระบุหน่วยงาน"} / ${
                    u.division?.name ?? "ไม่ระบุสายงาน"
                })`,
                grade: parseInt(u.grade),
                division_id: u.division_id,
                department_id: u.department_id,
                position_title: u.position?.title || "",
                user_type: u.user_type || "",
            })),
        [users]
    );

    const [selectedEvaluatee, setSelectedEvaluatee] =
        useState<OptionType | null>(null);
    const [availableAngles, setAvailableAngles] = useState<
        { value: string; label: string }[]
    >([]);
    const [selectedAngle, setSelectedAngle] = useState<{
        value: string;
        label: string;
    } | null>(null);
    const [selectedEvaluators, setSelectedEvaluators] = useState<OptionType[]>(
        []
    );

    const { data, setData, post, processing, reset, errors } = useForm({
        evaluator_id: "",
        evaluatee_id: "", // 👈 ควรเป็น string ไม่ใช่ array
        angle: "",
    });

    const handleEvaluateeChange = (selected: OptionType | null) => {
        setSelectedEvaluatee(selected);
        setSelectedAngle(null);
        setSelectedEvaluators([]);
        setData("evaluatee_id", selected ? selected.value : ""); // ✅ แก้ตรงนี้
        setData("evaluator_id", "");
        setData("angle", "");

        if (!selected) {
            setAvailableAngles([]);
            return;
        }

        const grade = selected.grade;
        if (grade >= 9) {
            setAvailableAngles(allAngleOptions);
        } else {
            setAvailableAngles(
                allAngleOptions.filter(
                    (opt) => opt.value === "top" || opt.value === "left"
                )
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !selectedEvaluatee ||
            !selectedAngle ||
            selectedEvaluators.length === 0
        ) {
            toast.error("กรุณาเลือกข้อมูลให้ครบถ้วน");
            return;
        }

        const payload = {
            evaluator_id: selectedEvaluators[0].value,
            angle: selectedAngle.value,
            evaluatee_id: selectedEvaluatee.value, // ✅ ใช้ค่าเดียว
        };

        router.post(route("assignments.store"), payload, {
            onSuccess: () => {
                toast.success("✅ เพิ่มความสัมพันธ์สำเร็จแล้ว");
                reset();
                setSelectedEvaluatee(null);
                setSelectedAngle(null);
                setAvailableAngles([]);
                setSelectedEvaluators([]);
            },
            onError: () => toast.error("🚫 ไม่สามารถเพิ่มความสัมพันธ์ได้"),
        });
    };

    const filteredEvaluatorOptions = useMemo(() => {
        if (!selectedEvaluatee || !selectedAngle) return [];

        const grade = selectedEvaluatee.grade;
        const divisionId = selectedEvaluatee.division_id;
        const departmentId = selectedEvaluatee.department_id;
        if (selectedAngle.value === "top") {
            // กรณีระดับ 5–8 → กรองเฉพาะผอ. 9–10
            if (grade < 9) {
                return userOptions.filter(
                    (u) =>
                        u.grade >= 9 &&
                        u.grade <= 10 &&
                        u.position_title &&
                        (u.position_title.includes("ผู้อำนวยการ") ||
                            u.position_title.includes("ผู้ช่วยผู้อำนวยการ")) &&
                        u.user_type == "internal" // ไม่รวมผู้ดูแลระบบ
                );
            } else if (grade == 9) {
                return userOptions.filter(
                    (u) =>
                        u.grade == 10 &&
                        u.division_id === divisionId &&
                        u.position_title &&
                        u.position_title.includes("ผู้ช่วยผู้ว่าการ") &&
                        u.user_type == "internal" // ไม่รวมผู้ดูแลระบบ
                );
            } else if (grade == 10) {
                return userOptions.filter(
                    (u) =>
                        u.division_id === divisionId &&
                        u.position_title &&
                        (u.position_title.includes("รองผู้ว่าการ") ||
                            u.position_title.includes("ผู้ช่วยผู้ว่าการ")) &&
                        u.user_type == "internal" // ไม่รวมผู้ดูแลระบบ
                );
            } else if (grade == 11) {
                return userOptions.filter(
                    (u) =>
                        u.division_id === divisionId &&
                        u.position_title &&
                        (u.position_title.includes("ผู้ว่าการ") ||
                            u.position_title.includes("รองผู้ว่าการ")) &&
                        u.user_type == "internal" // ไม่รวมผู้ดูแลระบบ
                );
            } else if (grade == 12) {
                return userOptions.filter(
                    (u) =>
                        u.division_id === divisionId &&
                        u.position_title &&
                        u.position_title.includes("ผู้ว่าการ") &&
                        u.user_type == "internal" // ไม่รวมผู้ดูแลระบบ
                );
            } else {
                return userOptions.filter((u) => u.grade > grade);
            }
        }

        if (selectedAngle.value === "left") {
            // กรณีระดับ 5–8
            if (grade < 9) {
                return userOptions.filter(
                    (u) =>
                        u.grade >= 5 &&
                        u.grade <= 8 &&
                        u.division_id === divisionId && 
                        u.user_type == "internal"
                );
            } else if (grade == 9) {
                return userOptions.filter(
                    (u) =>
                        u.grade == 9 &&
                        u.division_id === divisionId && // สายงานเดียวกัน
                        u.user_type == "internal"
                );
            } else if (grade == 10) {
                return userOptions.filter(
                    (u) =>
                        u.grade == 10 &&
                        u.division_id === divisionId && // สายงานเดียวกัน
                        u.user_type == "internal"
                );
            } else if (grade == 11) {
                return userOptions.filter(
                    (u) =>
                        u.division_id === divisionId && // สายงานเดียวกัน
                        u.position_title?.includes("ผู้ช่วยผู้ว่าการ") && // หรือร่วมงาน
                        u.user_type == "internal"
                );
            } else if (grade == 12) {
                return userOptions.filter(
                    (u) =>
                        u.division_id === divisionId && // สายงานเดียวกัน
                        u.position_title?.includes("รองผู้ว่าการ") && // หรือร่วมงาน
                        u.user_type == "internal"
                );
            }
        }

        if (selectedAngle.value === "bottom") {
            if (grade == 9) {
                return userOptions.filter(
                    (u) =>
                        u.department_id === departmentId && // สายงานเดียวกัน
                        u.user_type == "internal"
                );
            } else if (grade == 10) {
                return userOptions.filter(
                    (u) =>
                        u.grade == 8 &&
                        u.department_id === departmentId &&
                        (u.position_title?.includes("เลขานุการ") ||
                            u.position_title?.includes("ผู้อำนวยการกอง")) &&
                        u.user_type === "internal"
                );
            } else if (grade == 11) {
                return userOptions.filter(
                    (u) =>
                        u.division_id === divisionId &&
                        (u.position_title?.includes("เลขานุการ") ||
                            u.position_title?.includes("ผู้อำนวยการฝ่าย") ||
                            u.position_title?.includes("ผู้อำนวยการกอง")) &&
                        u.user_type === "internal"
                );
            } else if (grade == 12) {
                return userOptions.filter(
                    (u) =>
                        u.division_id === divisionId &&
                        (u.position_title?.includes("ผู้ช่วยผู้ว่าการ") ||
                            u.position_title?.includes("เลขานุการ") ||
                            u.position_title?.includes("ผู้อำนวยการฝ่าย")) &&
                        u.user_type === "internal"
                );
            }
        }

        if (selectedAngle.value === "right") {
            return userOptions.filter(
                (u) =>
                    u.user_type === "external"
            );
        }

        return [];
    }, [selectedEvaluatee, selectedAngle, userOptions]);

    return (
        <MainLayout
            title="เพิ่มความสัมพันธ์ผู้ประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        {
                            label: "แดชบอร์ดผู้ดูแลระบบ",
                            href: route("admindashboard"),
                        },
                        {
                            label: "จัดการผู้ประเมิน-ผู้ถูกประเมิน",
                            href: route("assignments.index"),
                        },
                        {
                            label: "เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน",
                            active: true,
                        },
                    ]}
                />
            }
        >
            <div className="max-w-5xl mx-auto px-6 py-10">
                <Card className="p-8 shadow-xl bg-white dark:bg-zinc-900">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
                        ✨ เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Evaluatee */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold dark:text-gray-300">
                                👤 เลือกผู้ถูกประเมิน
                            </label>
                            <Select
                                options={userOptions}
                                value={selectedEvaluatee}
                                onChange={handleEvaluateeChange}
                                placeholder="เลือกผู้ถูกประเมิน"
                                isClearable
                            />
                        </div>

                        {/* Angle */}
                        {availableAngles.length > 0 && (
                            <div>
                                <label className="block mb-2 text-sm font-semibold dark:text-gray-300">
                                    🎯 เลือกองศา
                                </label>
                                <Select
                                    options={availableAngles}
                                    value={selectedAngle}
                                    onChange={(selected) => {
                                        setSelectedAngle(selected);
                                        setData("angle", selected?.value || "");
                                        setSelectedEvaluators([]);
                                    }}
                                    placeholder="เลือกองศา"
                                    isClearable
                                />
                            </div>
                        )}

                        {/* Evaluators */}
                        {selectedAngle && (
                            <div>
                                <label className="block mb-2 text-sm font-semibold dark:text-gray-300">
                                    🧑‍💼 เลือกผู้ประเมิน
                                </label>
                                <Select
                                    options={filteredEvaluatorOptions}
                                    value={selectedEvaluators}
                                    onChange={(selected) =>
                                        setSelectedEvaluators(
                                            selected ? [selected] : []
                                        )
                                    }
                                    placeholder="เลือกผู้ประเมิน"
                                    isClearable
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-6">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="px-6"
                            >
                                ➕ บันทึกความสัมพันธ์
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
}
