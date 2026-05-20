import React, { useMemo, useState, useCallback, useEffect } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { useForm, usePage } from "@inertiajs/react";
import Select from "react-select";
import { toast } from "sonner";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
    ArrowLeft,
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
        label: "ผู้บังคับบัญชา (องศาบน)",
        shortLabel: "บน",
        description: "ผู้บังคับบัญชาที่อยู่ในสายการบังคับบัญชาโดยตรง",
        icon: "up",
        color: "violet",
    },
    {
        value: "bottom",
        label: "ผู้ใต้บังคับบัญชา (องศาล่าง)",
        shortLabel: "ล่าง",
        description: "ผู้ใต้บังคับบัญชาที่อยู่ในสายการบังคับบัญชาโดยตรง",
        icon: "down",
        color: "fuchsia",
    },
    {
        value: "left",
        label: "องศาซ้าย (เพื่อนร่วมงาน)",
        shortLabel: "ซ้าย",
        description: "เพื่อนร่วมงานในสายงานเดียวกันหรือระดับเดียวกัน",
        icon: "left",
        color: "purple",
    },
    {
        value: "right",
        label: "องศาขวา (ภายนอก)",
        shortLabel: "ขวา",
        description: "ผู้ที่มาจากสายงานอื่นที่เกี่ยวข้องหรือผู้ประเมินภายนอก",
        icon: "right",
        color: "indigo",
    },
] as const;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Enhanced Select Styles (violet theme)
const selectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({
        ...base,
        maxHeight: 400,
        boxShadow:
            "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        borderRadius: "0.75rem",
    }),
    option: (base: any, state: any) => ({
        ...base,
        fontSize: "0.875rem",
        padding: "12px 16px",
        backgroundColor: state.isSelected
            ? "#7c3aed"
            : state.isFocused
            ? "#f5f3ff"
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
        borderRadius: "0.75rem",
        border: state.isFocused ? "2px solid #7c3aed" : "2px solid #e5e7eb",
        boxShadow: state.isFocused
            ? "0 0 0 3px rgba(124, 58, 237, 0.1)"
            : "none",
        "&:hover": {
            borderColor: "#a78bfa",
        },
    }),
    placeholder: (base: any) => ({
        ...base,
        color: "#9ca3af",
        fontSize: "0.875rem",
    }),
};

export default function AdminEvaluationAssignmentForm() {
    const { users, selectedEvaluator: preSelectedEvaluator, fiscal_years = [], default_fiscal_year } = usePage<{
        users: User[];
        fiscal_years: number[];
        default_fiscal_year: number;
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

    const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(default_fiscal_year || (new Date().getFullYear()));

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

    // Enhanced user options with optimized search
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

    // Filtered evaluator options
    const filteredEvaluatorOptions = useMemo(() => {
        let filtered = userOptions;

        if (searchEvaluator) {
            const searchLower = searchEvaluator.toLowerCase();
            filtered = filtered.filter(
                (option) =>
                    option.searchText?.includes(searchLower) ||
                    option.label.toLowerCase().includes(searchLower)
            );
        }

        if (gradeFilter !== "all") {
            if (gradeFilter === "4-8") {
                filtered = filtered.filter(
                    (option) => option.grade >= 4 && option.grade <= 8
                );
            } else if (gradeFilter === "9-13") {
                filtered = filtered.filter(
                    (option) => option.grade >= 9 && option.grade <= 13
                );
            }
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(
                (option) => option.user_type === typeFilter
            );
        }

        return filtered;
    }, [userOptions, searchEvaluator, gradeFilter, typeFilter]);

    // Filtered evaluatee options
    const filteredEvaluateeOptions = useMemo(() => {
        if (!selectedEvaluator || !selectedAngle) return [];

        let filtered = userOptions.filter(
            (user) => user.value !== selectedEvaluator.value
        );

        if (searchEvaluatee) {
            const searchLower = searchEvaluatee.toLowerCase();
            filtered = filtered.filter(
                (option) =>
                    option.searchText?.includes(searchLower) ||
                    option.label.toLowerCase().includes(searchLower)
            );
        }

        if (selectedAngle.value === "right") {
            filtered = filtered.filter(
                (option) => option.user_type === "external"
            );
        } else if (selectedAngle.value === "left") {
            filtered = filtered.filter(
                (option) => option.user_type === "internal"
            );
        } else {
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

        if (
            selectedEvaluator &&
            selectedEvaluatees.some((e) => e.value === selectedEvaluator.value)
        ) {
            errors.push("ไม่สามารถให้ประเมินตนเองได้");
        }

        setValidationErrors(errors);
        return errors.length === 0;
    }, [selectedEvaluator, selectedAngle, selectedEvaluatees]);

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

            setAvailableAngles([...allAngleOptions]);

            console.log("Evaluator selected:", selected.label);
            toast.success(`เลือกผู้ประเมิน: ${selected.shortLabel}`);
        },
        []
    );

    const handleAngleChange = useCallback(
        async (selected: (typeof allAngleOptions)[0]) => {
            setSelectedAngle(selected);
            setSelectedEvaluatees([]);
            setSearchEvaluatee("");
            setValidationErrors([]);

            if (!selectedEvaluator) return;

            console.log("Angle selected:", selected.label);
            toast.success(`เลือกองศา: ${selected.shortLabel}`);
        },
        [selectedEvaluator]
    );

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

    const isFormValid = useMemo(() => {
        return (
            selectedEvaluator && selectedAngle && selectedEvaluatees.length > 0
        );
    }, [selectedEvaluator, selectedAngle, selectedEvaluatees.length]);

    // Enhanced form submission
    const handleSubmitAll = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!validateForm()) {
                toast.error("กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก");
                return;
            }

            setIsSubmitting(true);

            const assignments = selectedEvaluatees.map((evaluatee) => ({
                evaluatee_id: evaluatee.value,
                angle: selectedAngle!.value,
            }));

            try {
                console.log("Submitting assignments:", {
                    evaluator_id: selectedEvaluator!.value,
                    assignments,
                    total: assignments.length,
                    selectedEvaluatees: selectedEvaluatees.map((e) => ({
                        id: e.value,
                        name: e.label,
                        index: selectedEvaluatees.indexOf(e),
                    })),
                });

                router.post(
                    route("assignments.bulk-store"),
                    {
                        evaluator_id: selectedEvaluator!.value,
                        assignments: assignments,
                        fiscal_year: selectedFiscalYear,
                    },
                    {
                        onSuccess: (page) => {
                            console.log("Bulk store success:", page);

                            if (page.props.details) {
                                console.log(
                                    "Assignment Summary:",
                                    page.props.details
                                );
                                const details = page.props.details;
                                const summaryMsg = `สำเร็จ: ${details.created_count}/${details.total_processed} รายการ`;
                                toast.success(summaryMsg);

                                if (details.duplicate_count > 0) {
                                    toast.warning(
                                        `พบรายการซ้ำ: ${details.duplicate_count} รายการ`
                                    );
                                }

                                if (details.invalid_count > 0) {
                                    toast.error(
                                        `ไม่สำเร็จ: ${details.invalid_count} รายการ`
                                    );
                                }
                            } else if (page.props.flash?.success) {
                                toast.success(page.props.flash.success);
                            } else {
                                toast.success(
                                    `บันทึกสำเร็จ ${assignments.length} รายการ`
                                );
                            }

                            handleResetForm();
                        },
                        onError: (errors) => {
                            console.error("Bulk store errors:", errors);

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
                console.error("Unexpected error:", error);
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

    // Fallback: individual submission
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
                    "Starting individual submission for",
                    assignments.length,
                    "assignments"
                );

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
                                            `Assignment ${successCount} success`
                                        );
                                        resolve();
                                    },
                                    onError: (errors) => {
                                        errorCount++;
                                        console.error(
                                            `Assignment ${errorCount} failed:`,
                                            errors
                                        );

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

                        await new Promise((resolve) =>
                            setTimeout(resolve, 150)
                        );
                    } catch (error) {
                        continue;
                    }
                }

                console.log(
                    `Final results: ${successCount} success, ${errorCount} errors`
                );

                if (successCount > 0) {
                    toast.success(
                        `บันทึกสำเร็จ ${successCount} รายการ${
                            errorCount > 0
                                ? ` (ไม่สำเร็จ ${errorCount} รายการ)`
                                : ""
                        }`
                    );
                }

                if (errorMessages.length > 0) {
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
                    "Unexpected error in individual submission:",
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
        console.log("=== Debug Submit Data ===");
        console.log("Selected Evaluator:", selectedEvaluator);
        console.log("Selected Angle:", selectedAngle);
        console.log("Selected Evaluatees:", selectedEvaluatees);
        console.log(
            "Assignments to submit:",
            selectedEvaluatees.map((evaluatee) => ({
                evaluator_id: selectedEvaluator!.value,
                evaluatee_id: evaluatee.value,
                angle: selectedAngle!.value,
            }))
        );
        console.log("Form valid:", isFormValid);
        console.log("Validation errors:", validationErrors);
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
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div
                    className="max-w-7xl mx-auto px-2 sm:px-6 py-8 space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Enhanced Header */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-gradient-primary">
                                        เพิ่มความสัมพันธ์ผู้ประเมิน
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                                        สร้างความสัมพันธ์การประเมินแบบ 360 องศา
                                    </p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleResetForm}
                                    className="flex items-center px-4 py-2 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl transition-colors"
                                    title="รีเซ็ตฟอร์ม (Ctrl+R)"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    รีเซ็ต
                                </button>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center px-4 py-2 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl transition-colors"
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
                            <div className="flex items-center justify-between text-sm mb-2 text-gray-600 dark:text-gray-400">
                                <span>ความคืบหน้า</span>
                                <span>
                                    {selectedEvaluator ? "1" : "0"} /
                                    {selectedAngle ? "2" : "1"} /
                                    {selectedEvaluatees.length > 0 ? "3" : "2"}
                                </span>
                            </div>
                            <div className="w-full bg-violet-100 dark:bg-violet-900/20 rounded-full h-2">
                                <div
                                    className="gradient-primary rounded-full h-2 transition-all duration-500"
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
                    </motion.div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 border-l-4 border-red-500">
                            <div className="flex items-center mb-2">
                                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                <h4 className="text-red-800 dark:text-red-300 font-medium">
                                    กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:
                                </h4>
                            </div>
                            <ul className="list-disc list-inside text-red-700 dark:text-red-400 space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmitAll} className="space-y-8">
                        {/* Fiscal Year Selector */}
                        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border-l-4 border-amber-500">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-amber-600 dark:text-amber-400 text-lg">📅</span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">ปีงบประมาณ</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">เลือกปีงบประมาณที่ต้องการสร้างคู่ประเมิน</p>
                                </div>
                                <select
                                    value={selectedFiscalYear}
                                    onChange={(e) => setSelectedFiscalYear(Number(e.target.value))}
                                    className="px-4 py-2.5 border-2 border-amber-300 dark:border-amber-600 rounded-xl text-sm font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 focus:ring-2 focus:ring-amber-500"
                                >
                                    {fiscal_years.map((y: number) => (
                                        <option key={y} value={y}>พ.ศ. {Number(y) + 543} ({y})</option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>

                        {/* Step 1: Evaluator Selection */}
                        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8 border-l-4 border-violet-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mr-4">
                                        <span className="text-violet-600 dark:text-violet-400 font-bold">
                                            1
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            เลือกผู้ประเมิน
                                        </h2>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            เลือกบุคคลที่จะทำหน้าที่ประเมิน
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAdvancedFilters(!showAdvancedFilters)
                                    }
                                    className="flex items-center px-4 py-2 text-violet-600 dark:text-violet-400 hover:text-violet-800 border border-violet-200 dark:border-violet-700 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
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
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                            เกรด
                                        </label>
                                        <select
                                            value={gradeFilter}
                                            onChange={(e) =>
                                                setGradeFilter(e.target.value)
                                            }
                                            className="w-full py-2 px-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        >
                                            <option value="all">ทั้งหมด</option>
                                            <option value="4-8">
                                                C4-C8 (2 องศา)
                                            </option>
                                            <option value="9-13">
                                                C9-C13 (4 องศา)
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                            ประเภท
                                        </label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) =>
                                                setTypeFilter(e.target.value)
                                            }
                                            className="w-full py-2 px-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                                placeholder="ค้นหาและเลือกผู้ประเมิน..."
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
                                <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-violet-900 dark:text-violet-100 mb-2">
                                                ข้อมูลผู้ประเมิน
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-violet-700 dark:text-violet-300">
                                                        เกรด:
                                                    </span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                        C{selectedEvaluator.grade}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-violet-700 dark:text-violet-300">
                                                        บทบาท:
                                                    </span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                        ผู้ประเมิน
                                                    </span>
                                                </div>
                                            </div>
                                            {showDetails && (
                                                <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-700">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-violet-600 dark:text-violet-400">
                                                        <div>
                                                            ตำแหน่ง:{" "}
                                                            {selectedEvaluator.position_title}
                                                        </div>
                                                        <div>
                                                            กอง:{" "}
                                                            {selectedEvaluator.department_name}
                                                        </div>
                                                        <div>
                                                            ฝ่าย:{" "}
                                                            {selectedEvaluator.faction_name}
                                                        </div>
                                                        <div>
                                                            สายงาน:{" "}
                                                            {selectedEvaluator.division_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            {selectedEvaluator.grade >= 9 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                                    <CheckCircle className="w-4 h-4 mr-1" /> ประเมิน 4 องศา
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                                    <AlertCircle className="w-4 h-4 mr-1" /> ประเมิน 2 องศา
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Step 2: Angle Selection */}
                        {availableAngles.length > 0 && (
                            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8 border-l-4 border-fuchsia-500">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-full flex items-center justify-center mr-4">
                                        <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">
                                            2
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            เลือกองศาการประเมิน
                                        </h2>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            เลือกมุมมองการประเมินที่เหมาะสม
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {availableAngles.map((angle) => (
                                        <div
                                            key={angle.value}
                                            onClick={() => handleAngleChange(angle)}
                                            className={cn(
                                                "p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105",
                                                selectedAngle?.value === angle.value
                                                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-lg shadow-violet-500/10"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md"
                                            )}
                                        >
                                            <div className="text-center">
                                                <div className={cn(
                                                    "w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center",
                                                    selectedAngle?.value === angle.value
                                                        ? "gradient-primary text-white shadow-md"
                                                        : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                                                )}>
                                                    <UserCheck className="w-6 h-6" />
                                                </div>
                                                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">
                                                    {angle.shortLabel}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    {angle.description}
                                                </p>
                                                {selectedAngle?.value ===
                                                    angle.value && (
                                                    <div className="mt-3">
                                                        <CheckCircle className="w-6 h-6 text-violet-500 mx-auto" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Evaluatee Selection */}
                        {selectedAngle && (
                            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-4">
                                            <span className="text-purple-600 dark:text-purple-400 font-bold">
                                                3
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                เลือกผู้ถูกประเมิน ({selectedAngle.shortLabel})
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                เลือกผู้ที่จะได้รับการประเมินในมุมมองนี้
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={addAllFilteredEvaluatees}
                                            disabled={
                                                filteredEvaluateeOptions.length ===
                                                0
                                            }
                                            className="flex items-center px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                            className="flex items-center px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                            placeholder="ค้นหาผู้ถูกประเมิน..."
                                            value={searchEvaluatee}
                                            onChange={(e) =>
                                                setSearchEvaluatee(e.target.value)
                                            }
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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

                                {/* Angle info messages */}
                                {selectedAngle?.value === "left" &&
                                    filteredEvaluateeOptions.length > 0 && (
                                        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                            <div className="flex items-start">
                                                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                                                <div className="text-amber-700 dark:text-amber-300">
                                                    <div className="font-medium mb-1">
                                                        องศาซ้าย - เลือกเพื่อนร่วมงาน
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
                                        <div className="mb-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                                            <div className="flex items-start">
                                                <Info className="w-5 h-5 text-violet-600 dark:text-violet-400 mr-3 mt-0.5 flex-shrink-0" />
                                                <div className="text-violet-700 dark:text-violet-300">
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
                                    <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {filteredEvaluateeOptions.length}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            ผู้ถูกประเมินที่เหมาะสม
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {selectedEvaluatees.length}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            ผู้ถูกประเมินที่เลือก
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-xl">
                                        <div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                                            {selectedAngle.shortLabel}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            องศาการประเมิน
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                                        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                            {selectedEvaluator
                                                ? `C${selectedEvaluator.grade}`
                                                : "-"}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            เกรดผู้ประเมิน
                                        </div>
                                    </div>
                                </div>

                                {/* Selected Evaluatees List */}
                                {selectedEvaluatees.length > 0 && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                                        <h4 className="font-medium mb-4 flex items-center justify-between text-gray-900 dark:text-white">
                                            <div className="flex items-center">
                                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                                ผู้ถูกประเมินที่เลือก (
                                                {selectedEvaluatees.length} คน)
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                ทั้งหมดจะถูกประมวลผล
                                            </div>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {selectedEvaluatees.map(
                                                (evaluator, index) => (
                                                    <div
                                                        key={evaluator.value}
                                                        className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold shadow-md">
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
                                                            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
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
                                            <Search className="w-12 h-12 mx-auto mb-4 text-violet-300 dark:text-violet-600" />
                                            <h3 className="text-lg font-medium mb-2">
                                                ไม่พบผู้ประเมินที่เหมาะสม
                                            </h3>
                                            <p className="text-sm">
                                                ลองปรับเงื่อนไขการค้นหาหรือเลือกองศาอื่น
                                            </p>
                                        </div>
                                    )}
                            </motion.div>
                        )}

                        {/* Summary and Submit */}
                        {selectedEvaluator &&
                            selectedAngle &&
                            selectedEvaluatees.length > 0 && (
                                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8 border-l-4 border-green-500">
                                    <h3 className="text-2xl font-bold mb-6 flex items-center text-gradient-primary">
                                        <CheckCircle className="w-6 h-6 mr-3 text-green-500" />
                                        สรุปข้อมูลก่อนบันทึก
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-violet-50 dark:bg-violet-900/20 p-6 rounded-xl">
                                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                <Users className="w-4 h-4 mr-2 text-violet-500" />
                                                ผู้ประเมิน
                                            </h4>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {selectedEvaluator.shortLabel}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {selectedEvaluator.position_title}
                                            </div>
                                        </div>

                                        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 p-6 rounded-xl">
                                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                <UserCheck className="w-4 h-4 mr-2 text-fuchsia-500" />
                                                องศาการประเมิน
                                            </h4>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                                {selectedAngle.shortLabel}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {selectedAngle.description}
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
                                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                <Users className="w-4 h-4 mr-2 text-purple-500" />
                                                จำนวนผู้ถูกประเมิน
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
                                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 mb-6">
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                            <Eye className="w-4 h-4 mr-2 text-violet-500" />
                                            ตัวอย่างความสัมพันธ์ที่จะสร้าง
                                        </h4>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {selectedEvaluatees
                                                .slice(0, 3)
                                                .map((evaluator, index) => (
                                                    <div
                                                        key={evaluator.value}
                                                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
                                                    >
                                                        <span className="w-6 h-6 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center text-xs mr-3 text-violet-600 dark:text-violet-400">
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-medium">
                                                            {selectedEvaluator.shortLabel}
                                                        </span>
                                                        <span className="mx-2 text-violet-400">
                                                            →
                                                        </span>
                                                        <span>ประเมิน</span>
                                                        <span className="mx-2 text-violet-400">
                                                            →
                                                        </span>
                                                        <span className="font-medium">
                                                            {evaluator.shortLabel}
                                                        </span>
                                                        <span className="ml-2 text-violet-600 dark:text-violet-400">
                                                            ({selectedAngle.shortLabel})
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
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.visit(
                                                    route("assignments.index")
                                                )
                                            }
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            กลับไปหน้ารายการ
                                        </button>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleResetForm}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
                                                title="รีเซ็ตฟอร์ม (Ctrl+R)"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                รีเซ็ต
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleSubmitIndividual}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
                                                title="บันทึกทีละรายการ (Fallback)"
                                                disabled={
                                                    isSubmitting || !isFormValid
                                                }
                                            >
                                                <Users className="w-4 h-4" />
                                                บันทึกทีละราย
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={
                                                    isSubmitting || !isFormValid
                                                }
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-8 py-2.5 gradient-primary text-white rounded-xl font-medium",
                                                    "hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200",
                                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                                )}
                                                title="บันทึกข้อมูล (Ctrl+S)"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        กำลังบันทึก...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        บันทึกแบบกลุ่ม (
                                                        {selectedEvaluatees.length}{" "}
                                                        รายการ)
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                    </form>

                    {/* Enhanced Help Section */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xl font-bold text-gradient-primary flex items-center">
                                <BookOpen className="w-5 h-5 mr-2 text-violet-500" />
                                คู่มือการใช้งาน
                            </h4>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                            >
                                {showDetails ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                    ขั้นตอนการใช้งาน
                                </h5>
                                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start">
                                        <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                                            1
                                        </span>
                                        เลือกผู้ประเมิน (เลือกคนที่จะทำหน้าที่ประเมินผู้อื่น)
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-800 dark:text-fuchsia-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                                            2
                                        </span>
                                        เลือกองศาการประเมิน (ขึ้นอยู่กับเกรดของผู้ถูกประเมิน)
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                                            3
                                        </span>
                                        เลือกผู้ถูกประเมิน (สามารถเลือกได้หลายคนต่อองศา)
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                                            4
                                        </span>
                                        ตรวจสอบข้อมูลและบันทึก
                                    </li>
                                </ol>
                            </div>

                            <div>
                                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                    คีย์บอร์ดชอร์ทคัต
                                </h5>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li>
                                        {" "}
                                        <kbd className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs">
                                            Ctrl + S
                                        </kbd>{" "}
                                        บันทึกข้อมูล
                                    </li>
                                    <li>
                                        {" "}
                                        <kbd className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs">
                                            Ctrl + R
                                        </kbd>{" "}
                                        รีเซ็ตฟอร์ม
                                    </li>
                                    <li>
                                        {" "}
                                        <kbd className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs">
                                            Ctrl + D
                                        </kbd>{" "}
                                        Debug ข้อมูล
                                    </li>
                                    <li>
                                        ใช้ปุ่ม "เพิ่มทั้งหมด"
                                        เพื่อเลือกผู้ประเมินที่กรองแล้วทั้งหมด
                                    </li>
                                    <li>
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
                                            เกณฑ์การประเมิน
                                        </h5>
                                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <li>
                                                <strong>C5-C8:</strong> ประเมิน 2
                                                องศา (บน, ซ้าย)
                                            </li>
                                            <li>
                                                <strong>C9-C12:</strong> ประเมิน 4
                                                องศา (บน, ล่าง, ซ้าย, ขวา)
                                            </li>
                                            <li>
                                                <strong>ผู้บังคับบัญชา:</strong>{" "}
                                                ผู้ที่มีระดับสูงกว่าในสายบังคับบัญชา
                                            </li>
                                            <li>
                                                <strong>ผู้ใต้บังคับบัญชา:</strong>{" "}
                                                ผู้ที่มีระดับต่ำกว่าในสายบังคับบัญชา
                                            </li>
                                            <li>
                                                <strong>องศาซ้าย:</strong>{" "}
                                                เพื่อนร่วมงานระดับเดียวกัน
                                            </li>
                                            <li>
                                                <strong>องศาขวา:</strong>{" "}
                                                ผู้ประเมินภายนอก
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                            ข้อควรระวัง
                                        </h5>
                                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <li>ไม่สามารถให้ประเมินตนเองได้</li>
                                            <li>
                                                ตรวจสอบความเหมาะสมของผู้ประเมินก่อนเลือก
                                            </li>
                                            <li>
                                                แนะนำให้มีผู้ประเมินหลายคนต่อองศาเพื่อความน่าเชื่อถือ
                                            </li>
                                            <li>
                                                ระบบจะกรองผู้ประเมินที่เหมาะสมโดยอัตโนมัติ
                                            </li>
                                            <li>
                                                ข้อมูลจะถูกบันทึกทันทีหลังจากกดบันทึก
                                            </li>
                                            <li>
                                                หากบันทึกแบบกลุ่มไม่สำเร็จ
                                                สามารถใช้การบันทึกทีละรายการได้
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </MainLayout>
    );
}
