import React, { useMemo, useState } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { useForm, usePage } from "@inertiajs/react";
import Select from "react-select";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { router } from "@inertiajs/react";
import {
    Info,
    Users,
    AlertCircle,
    CheckCircle,
    Plus,
    Trash2,
    UserCheck,
} from "lucide-react";

// Define User interface locally
interface User {
    id: number;
    emid: string;
    prename: string;
    fname: string;
    lname: string;
    grade: string | number;
    sex: string;
    division_id?: number | null;
    department_id?: number | null;
    position_id?: number | null;
    user_type?: string;
    position?: {
        title: string;
    };
    department?: {
        name: string;
    };
    division?: {
        name: string;
    };
    position_title?: string; // สำหรับ compatibility
}

interface OptionType {
    value: number;
    label: string;
    grade: number;
    division_id?: number | null;
    department_id?: number | null;
    position_id?: number | null;
    position_title?: string;
    user_type?: string;
    division_name?: string; // เพิ่มชื่อสายงาน
    department_name?: string; // เพิ่มชื่อหน่วยงาน
}

const allAngleOptions = [
    {
        value: "top",
        label: "องศาบน (เจ้านาย)",
        description: "ผู้บังคับบัญชาที่อยู่ในสายการบังคับบัญชาโดยตรง",
        icon: "⬆️",
    },
    {
        value: "bottom",
        label: "องศาล่าง (ลูกน้อง)",
        description: "ผู้ใต้บังคับบัญชาที่อยู่ในสายการบังคับบัญชาโดยตรง",
        icon: "⬇️",
    },
    {
        value: "left",
        label: "องศาซ้าย (เพื่อนสายงานเดียวกัน)",
        description: "เพื่อนร่วมงานในสายงานเดียวกันหรือระดับเดียวกัน",
        icon: "⬅️",
    },
    {
        value: "right",
        label: "องศาขวา (สายงานอื่นเกี่ยวข้อง)",
        description: "ผู้ที่มาจากสายงานอื่นที่เกี่ยวข้องหรือผู้ประเมินภายนอก",
        icon: "➡️",
    },
];

export default function AdminEvaluationAssignmentForm() {
    const { users } = usePage<{ users: User[] }>().props;

    const userOptions: OptionType[] = useMemo(
        () =>
            users.map((u) => ({
                value: u.id,
                label: `${u.prename}${u.fname} ${u.lname} (${
                    u.position?.title ?? u.position_title ?? "ไม่ระบุตำแหน่ง"
                } / ${u.department?.name ?? "ไม่ระบุหน่วยงาน"} / ${
                    u.division?.name ?? "ไม่ระบุสายงาน"
                })`,
                grade: parseInt(u.grade.toString()),
                division_id: u.division_id,
                department_id: u.department_id,
                position_id: u.position_id,
                position_title:
                    u.position?.title ?? u.position_title ?? "ไม่ระบุตำแหน่ง",
                user_type: u.user_type || "",
                division_name: u.division?.name ?? "ไม่ระบุสายงาน",
                department_name: u.department?.name ?? "ไม่ระบุหน่วยงาน",
            })),
        [users]
    );

    const [selectedEvaluatee, setSelectedEvaluatee] =
        useState<OptionType | null>(null);
    const [availableAngles, setAvailableAngles] = useState<
        {
            value: string;
            label: string;
            description: string;
            icon: string;
        }[]
    >([]);
    const [selectedAngle, setSelectedAngle] = useState<{
        value: string;
        label: string;
        description: string;
        icon: string;
    } | null>(null);
    const [selectedEvaluators, setSelectedEvaluators] = useState<OptionType[]>(
        []
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        assignments: [] as Array<{
            evaluator_id: number;
            evaluatee_id: number;
            angle: string;
        }>,
    });

    const handleEvaluateeChange = (selected: OptionType | null) => {
        setSelectedEvaluatee(selected);
        setSelectedAngle(null);
        setSelectedEvaluators([]);

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

    const handleAngleChange = (selected: any) => {
        setSelectedAngle(selected);
        setSelectedEvaluators([]);
    };

    const addEvaluator = (evaluator: OptionType) => {
        if (!selectedEvaluators.find((e) => e.value === evaluator.value)) {
            setSelectedEvaluators([...selectedEvaluators, evaluator]);
        }
    };

    const removeEvaluator = (evaluatorId: number) => {
        setSelectedEvaluators(
            selectedEvaluators.filter((e) => e.value !== evaluatorId)
        );
    };

    const handleSubmitAll = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !selectedEvaluatee ||
            !selectedAngle ||
            selectedEvaluators.length === 0
        ) {
            toast.error("กรุณาเลือกข้อมูลให้ครบถ้วน");
            return;
        }

        setIsSubmitting(true);

        const assignments = selectedEvaluators.map((evaluator) => ({
            evaluator_id: evaluator.value,
            evaluatee_id: selectedEvaluatee.value,
            angle: selectedAngle.value,
        }));

        try {
            // ส่งทีละรายการเพื่อให้ server validate ได้ดี
            for (const assignment of assignments) {
                await new Promise((resolve, reject) => {
                    router.post(route("assignments.store"), assignment, {
                        onSuccess: () => resolve(true),
                        onError: (errors) => reject(errors),
                    });
                });
            }

            toast.success(
                `✅ เพิ่มความสัมพันธ์สำเร็จ ${assignments.length} รายการ`
            );

            // Reset form
            setSelectedEvaluatee(null);
            setSelectedAngle(null);
            setAvailableAngles([]);
            setSelectedEvaluators([]);
        } catch (error) {
            toast.error("🚫 ไม่สามารถเพิ่มความสัมพันธ์ได้ กรุณาลองใหม่");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEvaluatorOptions = useMemo(() => {
        if (!selectedEvaluatee || !selectedAngle) return [];

        const grade = selectedEvaluatee.grade;
        const divisionId = selectedEvaluatee.division_id;
        const departmentId = selectedEvaluatee.department_id;

        let filtered: OptionType[] = [];

        if (selectedAngle.value === "top") {
            // องศาบน: ผู้บังคับบัญชา
            if (grade < 9) {
                // C5-C8 ประเมินโดยผู้อำนวยการขึ้นไป (C9-C12)
                filtered = userOptions.filter(
                    (u) =>
                        u.grade >= 9 &&
                        u.position_title &&
                        (u.position_title.includes("ผู้อำนวยการ") ||
                            u.position_title.includes("ผู้ว่าการ") ||
                            u.position_title.includes("รอง") ||
                            u.position_title.includes("ผู้ช่วย")) &&
                        u.user_type === "internal"
                );
            } else {
                // C9+ ประเมินโดยผู้ที่เกรดสูงกว่า
                filtered = userOptions.filter(
                    (u) => u.grade > grade && u.user_type === "internal"
                );

                // ถ้ามี division เดียวกัน ให้ prioritize
                if (divisionId) {
                    const sameDivision = filtered.filter(
                        (u) => u.division_id === divisionId
                    );
                    if (sameDivision.length > 0) {
                        filtered = sameDivision;
                    }
                }
            }
        } else if (selectedAngle.value === "left") {
            // องศาซ้าย: เพื่อนร่วมงาน
            if (grade < 9) {
                // C5-C8 ประเมินโดยเพื่อนในระดับเดียวกัน
                filtered = userOptions.filter(
                    (u) =>
                        u.grade >= 5 &&
                        u.grade <= 8 &&
                        u.user_type === "internal" &&
                        u.value !== selectedEvaluatee.value // ไม่เลือกตัวเอง
                );
            } else {
                // C9+ ประเมินโดยเพื่อนในระดับเดียวกัน
                filtered = userOptions.filter(
                    (u) =>
                        u.grade === grade &&
                        u.user_type === "internal" &&
                        u.value !== selectedEvaluatee.value
                );
            }

            // ถ้ามี division เดียวกัน ให้ prioritize
            if (divisionId) {
                const sameDivision = filtered.filter(
                    (u) => u.division_id === divisionId
                );
                if (sameDivision.length > 0) {
                    filtered = sameDivision;
                }
            }
        } else if (selectedAngle.value === "bottom") {
            // องศาล่าง: ผู้ใต้บังคับบัญชา (เฉพาะ C9+)
            if (grade >= 9) {
                filtered = userOptions.filter(
                    (u) => u.grade < grade && u.user_type === "internal"
                );

                // กรองตามสายงาน/หน่วยงานเดียวกัน
                if (divisionId) {
                    const sameDivision = filtered.filter(
                        (u) => u.division_id === divisionId
                    );
                    if (sameDivision.length > 0) {
                        filtered = sameDivision;
                    }
                } else if (departmentId) {
                    const sameDepartment = filtered.filter(
                        (u) => u.department_id === departmentId
                    );
                    if (sameDepartment.length > 0) {
                        filtered = sameDepartment;
                    }
                }
            }
        } else if (selectedAngle.value === "right") {
            // องศาขวา: ผู้ประเมินภายนอก
            filtered = userOptions.filter((u) => u.user_type === "external");
        }

        // กรองออกคนที่เลือกแล้ว
        return filtered.filter(
            (option) =>
                !selectedEvaluators.find(
                    (selected) => selected.value === option.value
                )
        );
    }, [selectedEvaluatee, selectedAngle, userOptions, selectedEvaluators]);

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
            <div className="max-w-6xl mx-auto px-6 py-10">
                <Card className="p-8 shadow-xl bg-white dark:bg-zinc-900">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            ✨ เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            สามารถเลือกผู้ประเมินได้หลายคนต่อองศา
                            เพื่อความครบถ้วนในการประเมิน
                        </p>
                    </div>

                    <form onSubmit={handleSubmitAll} className="space-y-8">
                        {/* Evaluatee Selection */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                            <label className="block mb-3 text-sm font-semibold dark:text-gray-300 flex items-center">
                                <UserCheck className="w-4 h-4 mr-2" />
                                👤 เลือกผู้ถูกประเมิน
                            </label>
                            <Select
                                options={userOptions}
                                value={selectedEvaluatee}
                                onChange={handleEvaluateeChange}
                                placeholder="เลือกผู้ถูกประเมิน..."
                                isClearable
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                            {selectedEvaluatee && (
                                <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded border">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        📊 เกรด:{" "}
                                        <span className="font-medium">
                                            C{selectedEvaluatee.grade}
                                        </span>
                                        {selectedEvaluatee.grade >= 9 ? (
                                            <span className="ml-2 text-green-600">
                                                ✅ ประเมิน 4 องศา (บน, ล่าง,
                                                ซ้าย, ขวา)
                                            </span>
                                        ) : (
                                            <span className="ml-2 text-yellow-600">
                                                ⚠️ ประเมิน 2 องศา (บน, ซ้าย)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Angle Selection */}
                        {availableAngles.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                                <label className="block mb-3 text-sm font-semibold dark:text-gray-300 flex items-center">
                                    <Info className="w-4 h-4 mr-2" />
                                    🎯 เลือกองศาการประเมิน
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableAngles.map((angle) => (
                                        <div
                                            key={angle.value}
                                            onClick={() =>
                                                handleAngleChange(angle)
                                            }
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedAngle?.value ===
                                                angle.value
                                                    ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                                                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium flex items-center">
                                                    <span className="text-xl mr-2">
                                                        {angle.icon}
                                                    </span>
                                                    {angle.label}
                                                </span>
                                                {selectedAngle?.value ===
                                                    angle.value && (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {angle.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Evaluator Selection */}
                        {selectedAngle && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                                <label className="block mb-3 text-sm font-semibold dark:text-gray-300 flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    🧑‍💼 เลือกผู้ประเมิน ({
                                        selectedAngle.icon
                                    }{" "}
                                    {selectedAngle.label})
                                </label>

                                <Select
                                    options={filteredEvaluatorOptions}
                                    onChange={(selected) =>
                                        selected && addEvaluator(selected)
                                    }
                                    placeholder={`เลือกผู้ประเมินสำหรับ${selectedAngle.label}...`}
                                    isClearable
                                    value={null}
                                    className="react-select-container mb-4"
                                    classNamePrefix="react-select"
                                />

                                {/* Selected Evaluators List */}
                                {selectedEvaluators.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium mb-3 flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                            ผู้ประเมินที่เลือก (
                                            {selectedEvaluators.length} คน)
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedEvaluators.map(
                                                (evaluator, index) => (
                                                    <div
                                                        key={evaluator.value}
                                                        className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded border"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                                    {
                                                                        evaluator.label.split(
                                                                            " ("
                                                                        )[0]
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    เกรด: C
                                                                    {
                                                                        evaluator.grade
                                                                    }{" "}
                                                                    •{" "}
                                                                    {evaluator.user_type ===
                                                                    "external"
                                                                        ? "ภายนอก"
                                                                        : "ภายใน"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeEvaluator(
                                                                    evaluator.value
                                                                )
                                                            }
                                                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                                                            title="ลบออกจากรายการ"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Available Evaluators Count */}
                                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        💡 ผู้ประเมินที่เหมาะสม:{" "}
                                        {filteredEvaluatorOptions.length} คน
                                        {filteredEvaluatorOptions.length ===
                                            0 &&
                                            selectedEvaluators.length === 0 && (
                                                <span className="text-red-600 dark:text-red-400 ml-2">
                                                    ⚠️ ไม่พบผู้ประเมินที่เหมาะสม
                                                </span>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Section */}
                        {selectedEvaluatee &&
                            selectedAngle &&
                            selectedEvaluators.length > 0 && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                                        📝 สรุปข้อมูลก่อนบันทึก
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                ผู้ถูกประเมิน:
                                            </span>
                                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                                                {
                                                    selectedEvaluatee.label.split(
                                                        " ("
                                                    )[0]
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                องศาการประเมิน:
                                            </span>
                                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                                                {selectedAngle.icon}{" "}
                                                {selectedAngle.label}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                จำนวนผู้ประเมิน:
                                            </span>
                                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                                                👥 {selectedEvaluators.length}{" "}
                                                คน
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Action Buttons */}
                        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.visit(route("assignments.index"))
                                }
                                className="px-6"
                            >
                                ← กลับไปหน้ารายการ
                            </Button>

                            <Button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    selectedEvaluators.length === 0
                                }
                                className="px-8"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        บันทึกความสัมพันธ์ (
                                        {selectedEvaluators.length} รายการ)
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Help Section */}
                    <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            💡 คำแนะนำการใช้งาน
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>
                                • ผู้ถูกประเมินเกรด C9-C12 จะถูกประเมินจาก 4
                                องศา (บน, ล่าง, ซ้าย, ขวา)
                            </li>
                            <li>
                                • ผู้ถูกประเมินเกรด C5-C8 จะถูกประเมินจาก 2 องศา
                                (บน, ซ้าย)
                            </li>
                            <li>
                                •
                                สามารถเลือกผู้ประเมินได้หลายคนต่อองศาเพื่อความน่าเชื่อถือ
                            </li>
                            <li>
                                •
                                ระบบจะกรองผู้ประเมินที่เหมาะสมตามเกรดและตำแหน่งโดยอัตโนมัติ
                            </li>
                        </ul>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
}
