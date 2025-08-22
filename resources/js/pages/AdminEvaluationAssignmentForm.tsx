import React, { useMemo, useState, useCallback, useEffect } from "react";
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
    Search,
    Filter,
    Zap,
    BookOpen,
    Save,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
} from "lucide-react";

// Enhanced User interface
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
    faction_id?: number | null;
    user_type?: string;
    position?: {
        id?: number;
        title: string;
    };
    department?: {
        name: string;
    };
    division?: {
        name: string;
    };
    faction?: {
        name: string;
    };
    position_title?: string;
    department_name?: string;
    division_name?: string;
    faction_name?: string;
}

interface OptionType {
    value: number;
    label: string;
    shortLabel: string;
    grade: number;
    division_id?: number | null;
    department_id?: number | null;
    position_id?: number | null;
    faction_id?: number | null;
    position_title?: string;
    user_type?: string;
    division_name?: string;
    department_name?: string;
    faction_name?: string;
    searchText?: string;
}

const allAngleOptions = [
    {
        value: "top",
        label: "องศาบน (เจ้านาย)",
        shortLabel: "บน",
        description: "ผู้บังคับบัญชาที่อยู่ในสายการบังคับบัญชาโดยตรง",
        icon: "⬆️",
        color: "blue",
    },
    {
        value: "bottom",
        label: "องศาล่าง (ลูกน้อง)",
        shortLabel: "ล่าง",
        description: "ผู้ใต้บังคับบัญชาที่อยู่ในสายการบังคับบัญชาโดยตรง",
        icon: "⬇️",
        color: "green",
    },
    {
        value: "left",
        label: "องศาซ้าย (เพื่อนร่วมงาน)",
        shortLabel: "ซ้าย",
        description: "เพื่อนร่วมงานในสายงานเดียวกันหรือระดับเดียวกัน",
        icon: "⬅️",
        color: "yellow",
    },
    {
        value: "right",
        label: "องศาขวา (ภายนอก)",
        shortLabel: "ขวา",
        description: "ผู้ที่มาจากสายงานอื่นที่เกี่ยวข้องหรือผู้ประเมินภายนอก",
        icon: "➡️",
        color: "purple",
    },
] as const;

// Enhanced Select Styles
const selectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({
        ...base,
        maxHeight: 400,
        boxShadow:
            "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    }),
    option: (base: any, state: any) => ({
        ...base,
        fontSize: "0.875rem",
        padding: "12px 16px",
        backgroundColor: state.isSelected
            ? "#3b82f6"
            : state.isFocused
            ? "#eff6ff"
            : "white",
        color: state.isSelected ? "white" : "#374151",
        cursor: "pointer",
        borderBottom: "1px solid #f3f4f6",
        "&:last-child": {
            borderBottom: "none",
        },
    }),
    control: (base: any, state: any) => ({
        ...base,
        minHeight: "48px",
        border: state.isFocused ? "2px solid #3b82f6" : "1px solid #d1d5db",
        boxShadow: state.isFocused
            ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
            : "none",
        "&:hover": {
            borderColor: "#9ca3af",
        },
    }),
    placeholder: (base: any) => ({
        ...base,
        color: "#9ca3af",
        fontSize: "0.875rem",
    }),
};

export default function AdminEvaluationAssignmentForm() {
    const { users, selectedEvaluator: preSelectedEvaluator } = usePage<{
        users: User[];
        selectedEvaluator?: {
            id: number;
            fname: string;
            lname: string;
            grade: number;
            position?: { title: string };
            department?: { name: string };
            division?: { name: string };
            faction?: { name: string };
        };
    }>().props;

    // Enhanced States - New workflow: Evaluator -> Angle -> Evaluatees
    const [selectedEvaluator, setSelectedEvaluator] =
        useState<OptionType | null>(null);
    const [availableAngles, setAvailableAngles] = useState<
        typeof allAngleOptions
    >([]);
    const [selectedAngle, setSelectedAngle] = useState<
        (typeof allAngleOptions)[0] | null
    >(null);
    const [selectedEvaluatees, setSelectedEvaluatees] = useState<OptionType[]>(
        []
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchEvaluator, setSearchEvaluator] = useState("");
    const [searchEvaluatee, setSearchEvaluatee] = useState("");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [gradeFilter, setGradeFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [showDetails, setShowDetails] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Enhanced user options with optimized search - ใช้ useMemo และ dependencies ที่ stable
    const userOptions: OptionType[] = useMemo(() => {
        return users.map((u) => {
            const positionText =
                u.position?.title ?? u.position_title ?? "ไม่ระบุตำแหน่ง";
            const departmentText =
                u.department?.name ?? u.department_name ?? "ไม่ระบุหน่วยงาน";
            const factionText =
                u.faction?.name ?? u.faction_name ?? "ไม่ระบุฝ่าย";
            const divisionText =
                u.division?.name ?? u.division_name ?? "ไม่ระบุสายงาน";

            const fullName = `${u.prename}${u.fname} ${u.lname}`;
            const detailLabel = `ตำแหน่ง: ${positionText}, กอง: ${departmentText}, ฝ่าย: ${factionText}, สายงาน: ${divisionText}`;
            const shortLabel = `${fullName} (C${u.grade})`;

            return {
                value: u.id,
                label: `${fullName} (${detailLabel})`,
                shortLabel: shortLabel,
                grade: parseInt(u.grade.toString()),
                division_id: u.division_id,
                department_id: u.department_id,
                position_id: u.position_id,
                faction_id: u.faction_id,
                position_title: positionText,
                user_type: u.user_type || "",
                division_name: divisionText,
                department_name: departmentText,
                faction_name: factionText,
                searchText:
                    `${fullName} ${positionText} ${departmentText} ${factionText} ${divisionText} ${u.emid}`.toLowerCase(),
            };
        });
    }, [users]);

    // Auto-select evaluatee if pre-selected from card click
    useEffect(() => {
        if (preSelectedEvaluator && userOptions.length > 0) {
            const preSelectedOption = userOptions.find(
                (option) => option.value === preSelectedEvaluator.id
            );
            if (preSelectedOption) {
                setSelectedEvaluator(preSelectedOption);
                toast.success(
                    `เลือก ${preSelectedEvaluator.fname} ${preSelectedEvaluator.lname} อัตโนมัติ`
                );
            }
        }
    }, [preSelectedEvaluator, userOptions]);

    // Filtered evaluator options - Step 1: Select evaluator first
    const filteredEvaluatorOptions = useMemo(() => {
        let filtered = userOptions;

        // Search filter
        if (searchEvaluator) {
            const searchLower = searchEvaluator.toLowerCase();
            filtered = filtered.filter(
                (option) =>
                    option.searchText?.includes(searchLower) ||
                    option.label.toLowerCase().includes(searchLower)
            );
        }

        // Grade filter
        if (gradeFilter !== "all") {
            if (gradeFilter === "5-8") {
                filtered = filtered.filter(
                    (option) => option.grade >= 5 && option.grade <= 8
                );
            } else if (gradeFilter === "9-12") {
                filtered = filtered.filter(
                    (option) => option.grade >= 9 && option.grade <= 12
                );
            }
        }

        // Type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter(
                (option) => option.user_type === typeFilter
            );
        }

        return filtered;
    }, [userOptions, searchEvaluator, gradeFilter, typeFilter]);

    // Filtered evaluatee options - Step 3: Based on selected evaluator and angle
    const filteredEvaluateeOptions = useMemo(() => {
        if (!selectedEvaluator || !selectedAngle) return [];

        let filtered = userOptions.filter(
            (user) => user.value !== selectedEvaluator.value
        );

        // Search filter
        if (searchEvaluatee) {
            const searchLower = searchEvaluatee.toLowerCase();
            filtered = filtered.filter(
                (option) =>
                    option.searchText?.includes(searchLower) ||
                    option.label.toLowerCase().includes(searchLower)
            );
        }

        // Apply business rules based on angle
        if (selectedAngle.value === "right") {
            // External users only
            filtered = filtered.filter(
                (option) => option.user_type === "external"
            );
        } else if (selectedAngle.value === "left") {
            // Internal users only
            filtered = filtered.filter(
                (option) => option.user_type === "internal"
            );
        } else {
            // Top/bottom: internal users only
            filtered = filtered.filter(
                (option) => option.user_type === "internal"
            );
        }

        return filtered;
    }, [userOptions, selectedEvaluator, selectedAngle, searchEvaluatee]);

    // Form handling
    const { data, setData, post, processing, reset, errors } = useForm({
        assignments: [] as Array<{
            evaluator_id: number;
            evaluatee_id: number;
            angle: string;
        }>,
    });

    // Form reset function - ต้อง define ก่อน handleSubmitAll
    const handleResetForm = useCallback(() => {
        setSelectedEvaluator(null);
        setSelectedAngle(null);
        setSelectedEvaluatees([]);
        setAvailableAngles([]);
        setSelectedEvaluatees([]);
        setSearchEvaluatee("");
        setSearchEvaluator("");
        setValidationErrors([]);
        toast.info("รีเซ็ตฟอร์มแล้ว");
    }, []);

    // Validation function - Updated for new workflow
    const validateForm = useCallback(() => {
        const errors: string[] = [];

        if (!selectedEvaluator) {
            errors.push("กรุณาเลือกผู้ประเมิน");
        }

        if (!selectedAngle) {
            errors.push("กรุณาเลือกองศาการประเมิน");
        }

        if (selectedEvaluatees.length === 0) {
            errors.push("กรุณาเลือกผู้ถูกประเมินอย่างน้อย 1 คน");
        }

        // Check for self-evaluation
        if (
            selectedEvaluator &&
            selectedEvaluatees.some((e) => e.value === selectedEvaluator.value)
        ) {
            errors.push("ไม่สามารถให้ประเมินตนเองได้");
        }

        setValidationErrors(errors);
        return errors.length === 0;
    }, [selectedEvaluator, selectedAngle, selectedEvaluatees]);

    // Enhanced evaluator change handler - New workflow starts with evaluator
    const handleEvaluatorChange = useCallback(
        async (selected: OptionType | null) => {
            setSelectedEvaluator(selected);
            setSelectedAngle(null);
            setSelectedEvaluatees([]);
            setValidationErrors([]);

            if (!selected) {
                setAvailableAngles([]);
                return;
            }

            // For evaluator selection, all angles are available initially
            // The angle selection will determine which evaluatees can be selected
            setAvailableAngles([...allAngleOptions]);

            console.log("👤 Evaluator selected:", selected.label);
            toast.success(`เลือกผู้ประเมิน: ${selected.shortLabel}`);
        },
        []
    );

    // Enhanced angle change handler - Updated for new workflow
    const handleAngleChange = useCallback(
        async (selected: (typeof allAngleOptions)[0]) => {
            setSelectedAngle(selected);
            setSelectedEvaluatees([]);
            setSearchEvaluatee("");
            setValidationErrors([]);

            if (!selectedEvaluator) return;

            console.log("🎯 Angle selected:", selected.label);
            toast.success(`เลือกองศา: ${selected.shortLabel}`);
        },
        [selectedEvaluator]
    );

    // Enhanced evaluatee management - Updated for new workflow
    const addEvaluatee = useCallback((evaluatee: OptionType) => {
        setSelectedEvaluatees((prev) => {
            if (!prev.find((e) => e.value === evaluatee.value)) {
                toast.success(`เพิ่ม ${evaluatee.shortLabel} แล้ว`);
                return [...prev, evaluatee];
            }
            return prev;
        });
    }, []);

    const removeEvaluatee = useCallback((evaluateeId: number) => {
        setSelectedEvaluatees((prev) =>
            prev.filter((e) => e.value !== evaluateeId)
        );
        toast.info("ลบผู้ถูกประเมินแล้ว");
    }, []);

    // Bulk operations for evaluatees
    const addAllFilteredEvaluatees = useCallback(() => {
        const newEvaluatees = filteredEvaluateeOptions.filter(
            (option) =>
                !selectedEvaluatees.find(
                    (selected) => selected.value === option.value
                )
        );

        if (newEvaluatees.length > 0) {
            setSelectedEvaluatees((prev) => [...prev, ...newEvaluatees]);
            toast.success(`เพิ่มผู้ถูกประเมิน ${newEvaluatees.length} คนแล้ว`);
        }
    }, [filteredEvaluateeOptions, selectedEvaluatees]);

    const clearAllEvaluatees = useCallback(() => {
        setSelectedEvaluatees([]);
        toast.info("ล้างรายการผู้ถูกประเมินแล้ว");
    }, []);

    // Form validation - Updated for new workflow
    const isFormValid = useMemo(() => {
        return (
            selectedEvaluator && selectedAngle && selectedEvaluatees.length > 0
        );
    }, [selectedEvaluator, selectedAngle, selectedEvaluatees.length]);

    // Enhanced form submission - ใช้ bulkStore
    const handleSubmitAll = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!validateForm()) {
                toast.error("กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก");
                return;
            }

            setIsSubmitting(true);

            // สร้าง assignments array - Updated for new workflow
            const assignments = selectedEvaluatees.map((evaluatee) => ({
                evaluatee_id: evaluatee.value,
                angle: selectedAngle!.value,
            }));

            try {
                // Debug log
                console.log("🚀 Submitting assignments:", {
                    evaluator_id: selectedEvaluator!.value,
                    assignments,
                    total: assignments.length,
                    selectedEvaluatees: selectedEvaluatees.map((e) => ({
                        id: e.value,
                        name: e.label,
                        index: selectedEvaluatees.indexOf(e),
                    })),
                });

                // ใช้ bulkStore แทนการบันทึกทีละรายการ - Updated for new workflow
                router.post(
                    route("assignments.bulk-store"),
                    {
                        evaluator_id: selectedEvaluator!.value,
                        assignments: assignments,
                    },
                    {
                        onSuccess: (page) => {
                            console.log("✅ Bulk store success:", page);

                            // แสดงข้อมูล detailed summary
                            if (page.props.details) {
                                console.log(
                                    "📊 Assignment Summary:",
                                    page.props.details
                                );
                                const details = page.props.details;
                                const summaryMsg = `✅ สำเร็จ: ${details.created_count}/${details.total_processed} รายการ`;
                                toast.success(summaryMsg);

                                if (details.duplicate_count > 0) {
                                    toast.warning(
                                        `⚠️ พบรายการซ้ำ: ${details.duplicate_count} รายการ`
                                    );
                                }

                                if (details.invalid_count > 0) {
                                    toast.error(
                                        `❌ ไม่สำเร็จ: ${details.invalid_count} รายการ`
                                    );
                                }
                            } else if (page.props.flash?.success) {
                                toast.success(page.props.flash.success);
                            } else {
                                toast.success(
                                    `✅ บันทึกสำเร็จ ${assignments.length} รายการ`
                                );
                            }

                            handleResetForm();
                        },
                        onError: (errors) => {
                            console.error("❌ Bulk store errors:", errors);

                            // จัดการ error ที่เฉพาะเจาะจง
                            if (errors && typeof errors === "object") {
                                const errorMessages: string[] = [];

                                Object.keys(errors).forEach((field) => {
                                    if (Array.isArray(errors[field])) {
                                        errorMessages.push(...errors[field]);
                                    } else if (
                                        typeof errors[field] === "string"
                                    ) {
                                        errorMessages.push(errors[field]);
                                    }
                                });

                                if (errorMessages.length > 0) {
                                    // แสดงแค่ error แรก ๆ เพื่อไม่ให้ spam
                                    errorMessages
                                        .slice(0, 3)
                                        .forEach((message) => {
                                            toast.error(message);
                                        });

                                    if (errorMessages.length > 3) {
                                        toast.error(
                                            `และอีก ${
                                                errorMessages.length - 3
                                            } ข้อผิดพลาด`
                                        );
                                    }

                                    setValidationErrors(errorMessages);
                                } else {
                                    toast.error(
                                        "เกิดข้อผิดพลาดในการบันทึก กรุณาตรวจสอบข้อมูล"
                                    );
                                }
                            } else {
                                toast.error(
                                    "เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง"
                                );
                            }
                        },
                        onFinish: () => {
                            setIsSubmitting(false);
                        },
                        preserveState: true,
                        preserveScroll: true,
                    }
                );
            } catch (error) {
                console.error("💥 Unexpected error:", error);
                toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
                setIsSubmitting(false);
            }
        },
        [
            selectedEvaluator,
            selectedAngle,
            selectedEvaluatees,
            validateForm,
            handleResetForm,
        ]
    );

    // Fallback: การบันทึกทีละรายการ (ถ้า bulk ไม่ทำงาน)
    const handleSubmitIndividual = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!validateForm()) {
                toast.error("กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก");
                return;
            }

            setIsSubmitting(true);

            const assignments = selectedEvaluatees.map((evaluatee) => ({
                evaluator_id: selectedEvaluator!.value,
                evaluatee_id: evaluatee.value,
                angle: selectedAngle!.value,
            }));

            try {
                let successCount = 0;
                let errorCount = 0;
                const errorMessages: string[] = [];

                console.log(
                    "🔄 Starting individual submission for",
                    assignments.length,
                    "assignments"
                );

                // บันทึกทีละรายการพร้อมจัดการ error ที่ละเอียด
                for (const assignment of assignments) {
                    try {
                        await new Promise<void>((resolve, reject) => {
                            router.post(
                                route("assignments.store"),
                                assignment,
                                {
                                    onSuccess: () => {
                                        successCount++;
                                        console.log(
                                            `✅ Assignment ${successCount} success`
                                        );
                                        resolve();
                                    },
                                    onError: (errors) => {
                                        errorCount++;
                                        console.error(
                                            `❌ Assignment ${errorCount} failed:`,
                                            errors
                                        );

                                        // จัดการ error messages
                                        if (
                                            errors &&
                                            typeof errors === "object"
                                        ) {
                                            Object.keys(errors).forEach(
                                                (field) => {
                                                    if (
                                                        Array.isArray(
                                                            errors[field]
                                                        )
                                                    ) {
                                                        errorMessages.push(
                                                            ...errors[field]
                                                        );
                                                    } else if (
                                                        typeof errors[field] ===
                                                        "string"
                                                    ) {
                                                        errorMessages.push(
                                                            errors[field]
                                                        );
                                                    }
                                                }
                                            );
                                        }

                                        reject(errors);
                                    },
                                    preserveState: true,
                                    preserveScroll: true,
                                }
                            );
                        });

                        // หน่วงเวลาเล็กน้อยเพื่อป้องกัน race condition
                        await new Promise((resolve) =>
                            setTimeout(resolve, 150)
                        );
                    } catch (error) {
                        // continue กับรายการถัดไป
                        continue;
                    }
                }

                // แสดงผลลัพธ์
                console.log(
                    `📊 Final results: ${successCount} success, ${errorCount} errors`
                );

                if (successCount > 0) {
                    toast.success(
                        `✅ บันทึกสำเร็จ ${successCount} รายการ${
                            errorCount > 0
                                ? ` (ไม่สำเร็จ ${errorCount} รายการ)`
                                : ""
                        }`
                    );
                }

                if (errorMessages.length > 0) {
                    // แสดง error แค่ข้อความแรกเพื่อไม่ให้ spam
                    const uniqueErrors = [...new Set(errorMessages)];
                    uniqueErrors.slice(0, 3).forEach((message) => {
                        toast.error(message);
                    });

                    if (uniqueErrors.length > 3) {
                        toast.error(
                            `และอีก ${uniqueErrors.length - 3} ข้อผิดพลาด`
                        );
                    }

                    setValidationErrors(uniqueErrors);
                }

                if (successCount === assignments.length) {
                    handleResetForm();
                }
            } catch (error) {
                console.error(
                    "💥 Unexpected error in individual submission:",
                    error
                );
                toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            selectedEvaluator,
            selectedAngle,
            selectedEvaluatees,
            validateForm,
            handleResetForm,
        ]
    );

    // Debug function
    const debugSubmitData = useCallback(() => {
        console.log("=== 🔍 Debug Submit Data ===");
        console.log("👤 Selected Evaluator:", selectedEvaluator);
        console.log("🎯 Selected Angle:", selectedAngle);
        console.log("👥 Selected Evaluatees:", selectedEvaluatees);
        console.log(
            "📝 Assignments to submit:",
            selectedEvaluatees.map((evaluatee) => ({
                evaluator_id: selectedEvaluator!.value,
                evaluatee_id: evaluatee.value,
                angle: selectedAngle!.value,
            }))
        );
        console.log("✅ Form valid:", isFormValid);
        console.log("⚠️ Validation errors:", validationErrors);
        console.log("=====================================");
    }, [
        selectedEvaluator,
        selectedAngle,
        selectedEvaluatees,
        isFormValid,
        validationErrors,
    ]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "s":
                        e.preventDefault();
                        if (!isSubmitting && isFormValid) {
                            handleSubmitAll(e as any);
                        }
                        break;
                    case "r":
                        e.preventDefault();
                        handleResetForm();
                        break;
                    case "d":
                        e.preventDefault();
                        debugSubmitData();
                        break;
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        handleSubmitAll,
        handleResetForm,
        debugSubmitData,
        isSubmitting,
        isFormValid,
    ]);

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Enhanced Header */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center">
                                <Zap className="w-8 h-8 mr-3" />✨
                                เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน
                            </h1>
                            <p className="text-blue-100 text-lg">
                                สร้างความสัมพันธ์การประเมินแบบ 360 องศา
                                ด้วยระบบที่ทันสมัยและใช้งานง่าย
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleResetForm}
                                className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                title="รีเซ็ตฟอร์ม (Ctrl+R)"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                รีเซ็ต
                            </button>
                            <button
                                onClick={debugSubmitData}
                                className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                title="Debug ข้อมูล (Ctrl+D)"
                            >
                                <Info className="w-4 h-4 mr-2" />
                                Debug
                            </button>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            >
                                {showDetails ? (
                                    <EyeOff className="w-4 h-4 mr-2" />
                                ) : (
                                    <Eye className="w-4 h-4 mr-2" />
                                )}
                                {showDetails ? "ซ่อน" : "แสดง"}รายละเอียด
                            </button>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span>ความคืบหน้า</span>
                            <span>
                                {selectedEvaluator ? "1" : "0"} /
                                {selectedAngle ? "2" : "1"} /
                                {selectedEvaluatees.length > 0 ? "3" : "2"}
                            </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                                className="bg-white rounded-full h-2 transition-all duration-500"
                                style={{
                                    width: `${
                                        (selectedEvaluator ? 33 : 0) +
                                        (selectedAngle ? 33 : 0) +
                                        (selectedEvaluatees.length > 0 ? 34 : 0)
                                    }%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            <h4 className="text-red-800 font-medium">
                                กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:
                            </h4>
                        </div>
                        <ul className="list-disc list-inside text-red-700 space-y-1">
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmitAll} className="space-y-8">
                    {/* Rest of the form components remain the same as before */}
                    {/* Step 1: Evaluatee Selection */}
                    <Card className="p-8 shadow-xl bg-white dark:bg-zinc-900 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                                        1
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        👤 เลือกผู้ประเมิน
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        เลือกบุคคลที่จะทำหน้าที่ประเมิน
                                    </p>
                                </div>
                            </div>

                            {/* Advanced Filters Toggle */}
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAdvancedFilters(!showAdvancedFilters)
                                }
                                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                ตัวกรอง
                                {showAdvancedFilters ? (
                                    <ChevronUp className="w-4 h-4 ml-2" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                )}
                            </button>
                        </div>

                        {/* Advanced Filters */}
                        {showAdvancedFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        ค้นหา
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="ชื่อ, ตำแหน่ง, รหัส..."
                                            value={searchEvaluatee}
                                            onChange={(e) =>
                                                setSearchEvaluatee(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        เกรด
                                    </label>
                                    <select
                                        value={gradeFilter}
                                        onChange={(e) =>
                                            setGradeFilter(e.target.value)
                                        }
                                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        <option value="5-8">
                                            C5-C8 (2 องศา)
                                        </option>
                                        <option value="9-12">
                                            C9-C12 (4 องศา)
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        ประเภท
                                    </label>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) =>
                                            setTypeFilter(e.target.value)
                                        }
                                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        <option value="internal">ภายใน</option>
                                        <option value="external">ภายนอก</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <Select
                            options={filteredEvaluatorOptions}
                            value={selectedEvaluator}
                            onChange={handleEvaluatorChange}
                            placeholder="🔍 ค้นหาและเลือกผู้ประเมิน..."
                            isClearable
                            isSearchable
                            className="react-select-container"
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            noOptionsMessage={() =>
                                "ไม่พบข้อมูลที่ตรงกับการค้นหา"
                            }
                            loadingMessage={() => "กำลังโหลด..."}
                        />

                        {selectedEvaluator && (
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                            👤 ข้อมูลผู้ประเมิน
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-blue-700 dark:text-blue-300">
                                                    เกรด:
                                                </span>
                                                <span className="ml-2 font-medium">
                                                    C{selectedEvaluator.grade}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-blue-700 dark:text-blue-300">
                                                    บทบาท:
                                                </span>
                                                <span className="ml-2 font-medium">
                                                    ผู้ประเมิน
                                                </span>
                                            </div>
                                        </div>
                                        {showDetails && (
                                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-600 dark:text-blue-400">
                                                    <div>
                                                        🏢 ตำแหน่ง:{" "}
                                                        {
                                                            selectedEvaluator.position_title
                                                        }
                                                    </div>
                                                    <div>
                                                        🏛️ กอง:{" "}
                                                        {
                                                            selectedEvaluator.department_name
                                                        }
                                                    </div>
                                                    <div>
                                                        🏢 ฝ่าย:{" "}
                                                        {
                                                            selectedEvaluator.faction_name
                                                        }
                                                    </div>
                                                    <div>
                                                        🎯 สายงาน:{" "}
                                                        {
                                                            selectedEvaluator.division_name
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        {selectedEvaluator.grade >= 9 ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                                ✅ ประเมิน 4 องศา
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                                                ⚠️ ประเมิน 2 องศา
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Step 2: Angle Selection */}
                    {availableAngles.length > 0 && (
                        <Card className="p-8 shadow-xl bg-white dark:bg-zinc-900 border-l-4 border-green-500">
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                                    <span className="text-green-600 dark:text-green-400 font-bold">
                                        2
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        🎯 เลือกองศาการประเมิน
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        เลือกมุมมองการประเมินที่เหมาะสม
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {availableAngles.map((angle) => (
                                    <div
                                        key={angle.value}
                                        onClick={() => handleAngleChange(angle)}
                                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                                            selectedAngle?.value === angle.value
                                                ? `border-${angle.color}-500 bg-${angle.color}-50 dark:bg-${angle.color}-900/20 shadow-lg`
                                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700 hover:shadow-md"
                                        }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-4xl mb-3">
                                                {angle.icon}
                                            </div>
                                            <h3 className="font-bold mb-2">
                                                {angle.shortLabel}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                {angle.description}
                                            </p>
                                            {selectedAngle?.value ===
                                                angle.value && (
                                                <div className="mt-3">
                                                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Step 3: Evaluator Selection */}
                    {selectedAngle && (
                        <Card className="p-8 shadow-xl bg-white dark:bg-zinc-900 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                                            3
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            👥 เลือกผู้ถูกประเมิน (
                                            {selectedAngle.icon}{" "}
                                            {selectedAngle.shortLabel})
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            เลือกผู้ที่จะได้รับการประเมินในมุมมองนี้
                                        </p>
                                    </div>
                                </div>

                                {/* Bulk Actions */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={addAllFilteredEvaluatees}
                                        disabled={
                                            filteredEvaluateeOptions.length ===
                                            0
                                        }
                                        className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        เพิ่มทั้งหมด
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllEvaluatees}
                                        disabled={
                                            selectedEvaluatees.length === 0
                                        }
                                        className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        ล้างทั้งหมด
                                    </button>
                                </div>
                            </div>

                            {/* Evaluatee Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="🔍 ค้นหาผู้ถูกประเมิน..."
                                        value={searchEvaluatee}
                                        onChange={(e) =>
                                            setSearchEvaluatee(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <Select
                                options={filteredEvaluateeOptions}
                                onChange={(selected) =>
                                    selected && addEvaluatee(selected)
                                }
                                placeholder={`เลือกผู้ถูกประเมินสำหรับ${selectedAngle.label}...`}
                                isClearable
                                value={null}
                                isSearchable
                                className="react-select-container mb-6"
                                classNamePrefix="react-select"
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                                noOptionsMessage={() =>
                                    "ไม่พบผู้ถูกประเมินที่เหมาะสม"
                                }
                                loadingMessage={() => "กำลังโหลด..."}
                            />

                            {/* Special message for angle types */}
                            {selectedAngle?.value === "left" &&
                                filteredEvaluateeOptions.length > 0 && (
                                    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <div className="flex items-start">
                                            <div className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5">
                                                ⚡
                                            </div>
                                            <div className="text-yellow-700 dark:text-yellow-300">
                                                <div className="font-medium mb-1">
                                                    องศาซ้าย -
                                                    เลือกเพื่อนร่วมงาน
                                                </div>
                                                <div className="text-sm">
                                                    เลือกผู้ที่จะได้รับการประเมินจากเพื่อนร่วมงานในองค์กร
                                                    (ผู้ใช้ภายใน)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {selectedAngle?.value === "right" &&
                                filteredEvaluateeOptions.length > 0 && (
                                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-start">
                                            <div className="text-blue-600 dark:text-blue-400 mr-3 mt-0.5">
                                                🌐
                                            </div>
                                            <div className="text-blue-700 dark:text-blue-300">
                                                <div className="font-medium mb-1">
                                                    องศาขวา - เลือกบุคคลภายนอก
                                                </div>
                                                <div className="text-sm">
                                                    เลือกผู้ที่จะได้รับการประเมินจากบุคคลภายนอกองค์กร
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {filteredEvaluateeOptions.length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        ผู้ถูกประเมินที่เหมาะสม
                                        {filteredEvaluateeOptions.length >
                                            0 && (
                                            <span className="ml-1 text-green-600 dark:text-green-400">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {selectedEvaluatees.length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        ผู้ถูกประเมินที่เลือก
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {selectedAngle.shortLabel}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        องศาการประเมิน
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {selectedEvaluator
                                            ? `C${selectedEvaluator.grade}`
                                            : "-"}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        เกรดผู้ประเมิน
                                    </div>
                                </div>
                            </div>

                            {/* Selected Evaluators List */}
                            {selectedEvaluatees.length > 0 && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                                    <h4 className="font-medium mb-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                            ผู้ถูกประเมินที่เลือก (
                                            {selectedEvaluatees.length} คน)
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ทั้งหมดจะถูกประมวลผล
                                        </div>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedEvaluatees.map(
                                            (evaluator, index) => (
                                                <div
                                                    key={evaluator.value}
                                                    className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-gray-900 dark:text-white truncate">
                                                                {
                                                                    evaluator.shortLabel
                                                                }
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {evaluator.user_type ===
                                                                "external"
                                                                    ? "ภายนอก"
                                                                    : "ภายใน"}
                                                            </div>
                                                            {showDetails && (
                                                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                                                    {
                                                                        evaluator.position_title
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeEvaluatee(
                                                                evaluator.value
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
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

                            {filteredEvaluatorOptions.length === 0 &&
                                selectedEvaluatees.length === 0 && (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <div className="text-6xl mb-4">🔍</div>
                                        <h3 className="text-lg font-medium mb-2">
                                            ไม่พบผู้ประเมินที่เหมาะสม
                                        </h3>
                                        <p className="text-sm">
                                            ลองปรับเงื่อนไขการค้นหาหรือเลือกองศาอื่น
                                        </p>
                                    </div>
                                )}
                        </Card>
                    )}

                    {/* Summary and Submit */}
                    {selectedEvaluator &&
                        selectedAngle &&
                        selectedEvaluatees.length > 0 && (
                            <Card className="p-8 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-l-4 border-indigo-500">
                                <h3 className="text-2xl font-bold mb-6 flex items-center text-indigo-900 dark:text-indigo-100">
                                    <CheckCircle className="w-6 h-6 mr-3 text-green-500" />
                                    📝 สรุปข้อมูลก่อนบันทึก
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm">
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            👤 ผู้ประเมิน
                                        </h4>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {selectedEvaluator.shortLabel}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {selectedEvaluator.position_title}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm">
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            🎯 องศาการประเมิน
                                        </h4>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                            {selectedAngle.icon}{" "}
                                            {selectedAngle.shortLabel}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {selectedAngle.description}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm">
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            👥 จำนวนผู้ประเมิน
                                        </h4>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {selectedEvaluatees.length} คน
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            พร้อมสำหรับการประเมิน
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Preview */}
                                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm mb-6">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        🔍 ตัวอย่างความสัมพันธ์ที่จะสร้าง
                                    </h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {selectedEvaluatees
                                            .slice(0, 3)
                                            .map((evaluator, index) => (
                                                <div
                                                    key={evaluator.value}
                                                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
                                                >
                                                    <span className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs mr-3">
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-medium">
                                                        {
                                                            selectedEvaluator.shortLabel
                                                        }
                                                    </span>
                                                    <span className="mx-2">
                                                        →
                                                    </span>
                                                    <span>ประเมิน</span>
                                                    <span className="mx-2">
                                                        →
                                                    </span>
                                                    <span className="font-medium">
                                                        {evaluator.shortLabel}
                                                    </span>
                                                    <span className="ml-2 text-purple-600 dark:text-purple-400">
                                                        (
                                                        {
                                                            selectedAngle.shortLabel
                                                        }
                                                        )
                                                    </span>
                                                </div>
                                            ))}
                                        {selectedEvaluatees.length > 3 && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                ... และอีก{" "}
                                                {selectedEvaluatees.length - 3}{" "}
                                                รายการ
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.visit(
                                                route("assignments.index")
                                            )
                                        }
                                        className="px-6 py-3"
                                    >
                                        ← กลับไปหน้ารายการ
                                    </Button>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleResetForm}
                                            className="px-6 py-3"
                                            title="รีเซ็ตฟอร์ม (Ctrl+R)"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            รีเซ็ต
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleSubmitIndividual}
                                            className="px-6 py-3"
                                            title="บันทึกทีละรายการ (Fallback)"
                                            disabled={
                                                isSubmitting || !isFormValid
                                            }
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            บันทึกทีละราย
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={
                                                isSubmitting || !isFormValid
                                            }
                                            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                            title="บันทึกข้อมูล (Ctrl+S)"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    กำลังบันทึก...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    บันทึกแบบกลุ่ม (
                                                    {selectedEvaluatees.length}{" "}
                                                    รายการ)
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}
                </form>

                {/* Enhanced Help Section */}
                <Card className="p-8 shadow-xl bg-white dark:bg-zinc-900">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" />
                            💡 คู่มือการใช้งาน
                        </h4>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            {showDetails ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                📋 ขั้นตอนการใช้งาน
                            </h5>
                            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                        1
                                    </span>
                                    เลือกผู้ประเมิน
                                    (เลือกคนที่จะทำหน้าที่ประเมินผู้อื่น)
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                        2
                                    </span>
                                    เลือกองศาการประเมิน
                                    (ขึ้นอยู่กับเกรดของผู้ถูกประเมิน)
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                        3
                                    </span>
                                    เลือกผู้ประเมิน
                                    (สามารถเลือกได้หลายคนต่อองศา)
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                        4
                                    </span>
                                    ตรวจสอบข้อมูลและบันทึก
                                </li>
                            </ol>
                        </div>

                        <div>
                            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                ⚡ คีย์บอร์ดชอร์ทคัต
                            </h5>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>
                                    •{" "}
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                                        Ctrl + S
                                    </kbd>{" "}
                                    บันทึกข้อมูล
                                </li>
                                <li>
                                    •{" "}
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                                        Ctrl + R
                                    </kbd>{" "}
                                    รีเซ็ตฟอร์ม
                                </li>
                                <li>
                                    •{" "}
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                                        Ctrl + D
                                    </kbd>{" "}
                                    Debug ข้อมูล
                                </li>
                                <li>
                                    • ใช้ปุ่ม "เพิ่มทั้งหมด"
                                    เพื่อเลือกผู้ประเมินที่กรองแล้วทั้งหมด
                                </li>
                                <li>
                                    •
                                    ใช้ตัวกรองขั้นสูงเพื่อค้นหาผู้ใช้ที่ต้องการได้รวดเร็ว
                                </li>
                            </ul>
                        </div>
                    </div>

                    {showDetails && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                        🎯 เกณฑ์การประเมิน
                                    </h5>
                                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <li>
                                            • <strong>C5-C8:</strong> ประเมิน 2
                                            องศา (บน, ซ้าย)
                                        </li>
                                        <li>
                                            • <strong>C9-C12:</strong> ประเมิน 4
                                            องศา (บน, ล่าง, ซ้าย, ขวา)
                                        </li>
                                        <li>
                                            • <strong>องศาบน:</strong>{" "}
                                            ผู้บังคับบัญชาที่เกรดสูงกว่า
                                        </li>
                                        <li>
                                            • <strong>องศาล่าง:</strong>{" "}
                                            ผู้ใต้บังคับบัญชาที่เกรดต่ำกว่า
                                        </li>
                                        <li>
                                            • <strong>องศาซ้าย:</strong>{" "}
                                            เพื่อนร่วมงานระดับเดียวกัน
                                        </li>
                                        <li>
                                            • <strong>องศาขวา:</strong>{" "}
                                            ผู้ประเมินภายนอก
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                        ⚠️ ข้อควรระวัง
                                    </h5>
                                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <li>• ไม่สามารถให้ประเมินตนเองได้</li>
                                        <li>
                                            •
                                            ตรวจสอบความเหมาะสมของผู้ประเมินก่อนเลือก
                                        </li>
                                        <li>
                                            •
                                            แนะนำให้มีผู้ประเมินหลายคนต่อองศาเพื่อความน่าเชื่อถือ
                                        </li>
                                        <li>
                                            •
                                            ระบบจะกรองผู้ประเมินที่เหมาะสมโดยอัตโนมัติ
                                        </li>
                                        <li>
                                            •
                                            ข้อมูลจะถูกบันทึกทันทีหลังจากกดบันทึก
                                        </li>
                                        <li>
                                            • หากบันทึกแบบกลุ่มไม่สำเร็จ
                                            สามารถใช้การบันทึกทีละรายการได้
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </MainLayout>
    );
}
