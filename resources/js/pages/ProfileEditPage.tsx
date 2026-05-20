import MainLayout from "@/Layouts/MainLayout";
import { useForm, usePage, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import Breadcrumb from "@/Components/ui/breadcrumb";
import {
    Upload,
    User,
    Lock,
    Eye,
    EyeOff,
    Camera,
    X,
    Check,
    AlertCircle,
    Save,
} from "lucide-react";

interface Division {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface Faction {
    id: number;
    name: string;
}

interface Position {
    id: number;
    title: string;
}

interface User {
    id: number;
    emid: string;
    prename?: string;
    fname: string;
    lname: string;
    sex?: string;
    division_id?: string;
    department_id?: string;
    faction_id?: string;
    position_id?: string;
    grade?: number;
    birthdate?: string;
    photo?: string;
    role: string;
    user_type: string;
}

interface PageProps {
    auth: { user: User };
    flash: { success?: string; error?: string };
    divisions: Division[];
    departments: Department[];
    factions: Faction[];
    positions: Position[];
    user: User;
}

interface OptionType {
    value: string;
    label: string;
}

const toOptions = (items: any[], labelKey = "name"): OptionType[] =>
    items.map((d) => ({ value: d.id.toString(), label: d[labelKey] }));

const isDarkMode = () => document.documentElement.classList.contains("dark");

export default function ProfileEditPage() {
    const { auth, flash, divisions, departments, factions, positions, user } =
        usePage<PageProps>().props;

    // Options
    const divisionOptions = toOptions(divisions || []);
    const departmentOptions = toOptions(departments || []);
    const factionOptions = toOptions(factions || []);
    const positionOptions = toOptions(positions || [], "title");

    const sexOptions = [
        { value: "ชาย", label: "ชาย" },
        { value: "หญิง", label: "หญิง" },
    ];

    const prenameOptions = [
        { value: "นาย", label: "นาย" },
        { value: "นาง", label: "นาง" },
        { value: "นางสาว", label: "นางสาว" },
    ];

    // State
    const [preview, setPreview] = useState<string | null>(null);
    const [birthDay, setBirthDay] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthYear, setBirthYear] = useState("");
    const [passwordMode, setPasswordMode] = useState<'none' | 'custom' | 'birthdate' | 'default'>('none');
    const [showPassword, setShowPassword] = useState(false);
    const [customPassword, setCustomPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [darkMode, setDarkMode] = useState(isDarkMode());

    const { data, setData, post, processing, errors, reset } = useForm({
        prename: user.prename || "",
        fname: user.fname || "",
        lname: user.lname || "",
        sex: user.sex || "",
        division_id: user.division_id || "",
        department_id: user.department_id || "",
        faction_id: user.faction_id || "",
        position_id: user.position_id || "",
        grade: user.grade || "",
        birthdate: user.birthdate || "",
        password: "",
        password_confirmation: "",
        photo: null as File | null,
        _method: "PUT" as const,
    });

    // Date options
    const dayOptions = Array.from({ length: 31 }, (_, i) => ({
        value: (i + 1).toString().padStart(2, "0"),
        label: (i + 1).toString(),
    }));

    const monthOptions = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
    ].map((m, i) => ({
        value: (i + 1).toString().padStart(2, "0"),
        label: m,
    }));

    const yearOptions = Array.from({ length: 100 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return {
            value: year.toString(),
            label: `${year + 543} (พ.ศ.)`,
        };
    });

    // Initialize birthdate fields from existing data
    useEffect(() => {
        if (user.birthdate) {
            const date = new Date(user.birthdate);
            setBirthDay(date.getDate().toString().padStart(2, "0"));
            setBirthMonth((date.getMonth() + 1).toString().padStart(2, "0"));
            setBirthYear(date.getFullYear().toString());
        }
    }, [user.birthdate]);

    // Update birthdate when day/month/year changes
    useEffect(() => {
        if (birthDay && birthMonth && birthYear) {
            const isoDate = new Date(
                parseInt(birthYear),
                parseInt(birthMonth) - 1,
                parseInt(birthDay) + 1
            )
                .toISOString()
                .split("T")[0];
            setData("birthdate", isoDate);
        }
    }, [birthDay, birthMonth, birthYear]);

    // Update password based on selected mode
    useEffect(() => {
        switch (passwordMode) {
            case 'none':
                setData("password", "");
                setData("password_confirmation", "");
                break;
            case 'custom':
                setData("password", customPassword);
                setData("password_confirmation", confirmPassword);
                break;
            case 'birthdate':
                if (birthDay && birthMonth && birthYear) {
                    const buddhistYear = (parseInt(birthYear) + 543).toString();
                    const password = `${birthDay}${birthMonth}${buddhistYear}`;
                    setData("password", password);
                    setData("password_confirmation", password);
                }
                break;
            case 'default':
                const defaultPassword = `${user.emid}@2024`;
                setData("password", defaultPassword);
                setData("password_confirmation", defaultPassword);
                break;
        }
    }, [passwordMode, customPassword, confirmPassword, birthDay, birthMonth, birthYear, user.emid]);

    // Dark mode observer
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setDarkMode(isDarkMode());
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
        return () => observer.disconnect();
    }, []);

    // Flash messages
    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    // Select theme and styles -- violet brand
    const selectTheme = (theme: any) => ({
        ...theme,
        colors: {
            ...theme.colors,
            primary: "#7c3aed",
            primary25: "#ede9fe",
            neutral0: darkMode ? "#374151" : "#fff",
            neutral5: darkMode ? "#4b5563" : "#f3f4f6",
            neutral10: darkMode ? "#6b7280" : "#e5e7eb",
            neutral20: darkMode ? "#9ca3af" : "#d1d5db",
            neutral30: darkMode ? "#d1d5db" : "#9ca3af",
            neutral80: darkMode ? "#f9fafb" : "#111827",
        },
    });

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#374151" : "#fff",
            borderColor: darkMode ? "#6b7280" : "#d1d5db",
            borderWidth: "2px",
            borderRadius: "0.75rem",
            paddingLeft: "0.5rem",
            paddingRight: "0.5rem",
            fontSize: "0.875rem",
            minHeight: "2.75rem",
            "&:hover": {
                borderColor: "#7c3aed",
            },
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#374151" : "#fff",
            borderRadius: "0.75rem",
            marginTop: 4,
            boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }),
        input: (base: any) => ({
            ...base,
            color: darkMode ? "#f9fafb" : "#111827",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: darkMode ? "#f9fafb" : "#111827",
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#7c3aed"
                : state.isFocused
                ? darkMode
                    ? "#4b5563"
                    : "#f5f3ff"
                : darkMode
                ? "#374151"
                : "#fff",
            color: state.isSelected ? "#fff" : darkMode ? "#f9fafb" : "#111827",
            cursor: "pointer",
            padding: "0.75rem 1rem",
        }),
    };

    // Event handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation for custom password mode
        if (passwordMode === 'custom') {
            if (!customPassword) {
                toast.error("กรุณาใส่รหัสผ่าน");
                return;
            }
            if (customPassword !== confirmPassword) {
                toast.error("รหัสผ่านไม่ตรงกัน");
                return;
            }
            if (customPassword.length < 6) {
                toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
                return;
            }
        }

        console.log("Form data before submit:", data);

        post(route("profile.update"), {
            forceFormData: true,
            preserveState: true,
            onSuccess: () => {
                toast.success("บันทึกโปรไฟล์สำเร็จ");
                clearPhotoSelection();
                setPasswordMode('none');
                setCustomPassword('');
                setConfirmPassword('');
                reset('password', 'password_confirmation');
                router.reload();
            },
            onError: (errors) => {
                console.log("Validation errors:", errors);
                if (errors.error) {
                    toast.error(errors.error);
                } else {
                    toast.error("เกิดข้อผิดพลาด กรุณาตรวจสอบข้อมูล");
                }
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
                return;
            }
            if (!file.type.match(/^image\/(jpeg|png|jpg|gif|webp)$/)) {
                toast.error(
                    "ไฟล์ต้องเป็นรูปภาพประเภท jpeg, png, jpg, gif, webp"
                );
                return;
            }
            setData("photo", file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const clearPhotoSelection = () => {
        setData("photo", null);
        setPreview(null);
        const fileInput = document.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleCreateDepartment = (inputValue: string) => {
        router.post(
            route("profile.departments.store"),
            { name: inputValue },
            {
                onSuccess: () => {
                    toast.success("เพิ่มหน่วยงานใหม่แล้ว");
                    router.reload({ only: ["departments"] });
                },
                onError: () => toast.error("ไม่สามารถเพิ่มหน่วยงานได้"),
            }
        );
    };

    const handleCreateFaction = (inputValue: string) => {
        router.post(
            route("profile.factions.store"),
            { name: inputValue },
            {
                onSuccess: () => {
                    toast.success("เพิ่มฝ่ายใหม่แล้ว");
                    router.reload({ only: ["factions"] });
                },
                onError: () => toast.error("ไม่สามารถเพิ่มฝ่ายได้"),
            }
        );
    };

    const handleCreatePosition = (inputValue: string) => {
        router.post(
            route("profile.positions.store"),
            { title: inputValue },
            {
                onSuccess: () => {
                    toast.success("เพิ่มตำแหน่งใหม่แล้ว");
                    router.reload({ only: ["positions"] });
                },
                onError: () => toast.error("ไม่สามารถเพิ่มตำแหน่งได้"),
            }
        );
    };

    return (
        <MainLayout title="แก้ไขโปรไฟล์">
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="glass-card rounded-2xl p-8">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center space-x-3 mb-4">
                                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                                        <User className="text-white" size={22} />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gradient-primary">
                                        แก้ไขข้อมูลส่วนตัว
                                    </h1>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    อัปเดตข้อมูลโปรไฟล์ของคุณ
                                </p>
                            </div>

                            {/* Global Error */}
                            {errors.error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                >
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="text-red-500" size={20} />
                                        <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                                            {errors.error}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Photo Upload Section */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-center"
                                >
                                    <div className="relative inline-block">
                                        <div className="relative">
                                            <img
                                                src={
                                                    preview ||
                                                    (user.photo
                                                        ? `/storage/${user.photo}`
                                                        : "/images/default.png")
                                                }
                                                alt="รูปโปรไฟล์"
                                                className="w-32 h-32 rounded-full mx-auto border-4 border-violet-200 dark:border-violet-800 shadow-lg object-cover"
                                            />
                                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
                                                <Camera className="text-white" size={24} />
                                            </div>
                                        </div>

                                        <label className="absolute bottom-0 right-0 gradient-primary hover:opacity-90 text-white rounded-full p-2 cursor-pointer shadow-lg transition-opacity">
                                            <Upload size={16} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {preview && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            type="button"
                                            onClick={clearPhotoSelection}
                                            className="mt-3 inline-flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                        >
                                            <X size={16} />
                                            <span>ยกเลิกรูปที่เลือก</span>
                                        </motion.button>
                                    )}

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        รองรับไฟล์ JPG, PNG, GIF, WEBP ขนาดไม่เกิน 2MB
                                    </p>

                                    {errors.photo && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center justify-center space-x-1">
                                            <AlertCircle size={12} />
                                            <span>{errors.photo}</span>
                                        </p>
                                    )}
                                </motion.div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* คำนำหน้า */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                        <Label htmlFor="prename">คำนำหน้าชื่อ</Label>
                                        <Select
                                            options={prenameOptions}
                                            value={prenameOptions.find((opt) => opt.value === data.prename) || null}
                                            onChange={(opt) => setData("prename", opt?.value || "")}
                                            isClearable
                                            placeholder="เลือกคำนำหน้า..."
                                            theme={selectTheme}
                                            styles={selectStyles}
                                        />
                                        {errors.prename && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.prename}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* ชื่อ */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                        <Label htmlFor="fname">
                                            ชื่อ <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="fname"
                                            required
                                            value={data.fname}
                                            onChange={(e) => setData("fname", e.target.value)}
                                            className="h-11 rounded-xl border-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="กรอกชื่อ"
                                        />
                                        {errors.fname && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.fname}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* นามสกุล */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                        <Label htmlFor="lname">
                                            นามสกุล <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="lname"
                                            required
                                            value={data.lname}
                                            onChange={(e) => setData("lname", e.target.value)}
                                            className="h-11 rounded-xl border-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="กรอกนามสกุล"
                                        />
                                        {errors.lname && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.lname}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* เพศ */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                                        <Label htmlFor="sex">เพศ</Label>
                                        <Select
                                            options={sexOptions}
                                            value={sexOptions.find((opt) => opt.value === data.sex) || null}
                                            onChange={(opt) => setData("sex", opt?.value || "")}
                                            isClearable
                                            placeholder="เลือกเพศ..."
                                            theme={selectTheme}
                                            styles={selectStyles}
                                        />
                                        {errors.sex && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.sex}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* สายงาน */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                        <Label htmlFor="division_id">สายงาน</Label>
                                        <Select
                                            options={divisionOptions}
                                            value={divisionOptions.find((opt) => opt.value === data.division_id?.toString()) || null}
                                            onChange={(opt) => setData("division_id", opt?.value || "")}
                                            isClearable
                                            placeholder="เลือกสายงาน..."
                                            theme={selectTheme}
                                            styles={selectStyles}
                                        />
                                        {errors.division_id && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.division_id}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* หน่วยงาน */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                                        <Label htmlFor="department_id">หน่วยงาน</Label>
                                        <CreatableSelect
                                            options={departmentOptions}
                                            value={departmentOptions.find((opt) => opt.value === data.department_id?.toString()) || null}
                                            onChange={(opt) => setData("department_id", opt?.value || "")}
                                            onCreateOption={handleCreateDepartment}
                                            isClearable
                                            placeholder="เลือกหรือสร้างหน่วยงาน..."
                                            formatCreateLabel={(inputValue) => `สร้าง "${inputValue}"`}
                                            theme={selectTheme}
                                            styles={selectStyles}
                                        />
                                        {errors.department_id && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.department_id}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* ฝ่าย */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                        <Label htmlFor="faction_id">ฝ่าย</Label>
                                        <CreatableSelect
                                            options={factionOptions}
                                            value={factionOptions.find((opt) => opt.value === data.faction_id?.toString()) || null}
                                            onChange={(opt) => setData("faction_id", opt?.value || "")}
                                            onCreateOption={handleCreateFaction}
                                            isClearable
                                            placeholder="เลือกหรือสร้างฝ่าย..."
                                            formatCreateLabel={(inputValue) => `สร้าง "${inputValue}"`}
                                            theme={selectTheme}
                                            styles={selectStyles}
                                        />
                                        {errors.faction_id && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.faction_id}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* ตำแหน่ง */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                                        <Label htmlFor="position_id">ตำแหน่ง</Label>
                                        <CreatableSelect
                                            options={positionOptions}
                                            value={positionOptions.find((opt) => opt.value === data.position_id?.toString()) || null}
                                            onChange={(opt) => setData("position_id", opt?.value || "")}
                                            onCreateOption={handleCreatePosition}
                                            isClearable
                                            placeholder="เลือกหรือสร้างตำแหน่ง..."
                                            formatCreateLabel={(inputValue) => `สร้าง "${inputValue}"`}
                                            theme={selectTheme}
                                            styles={selectStyles}
                                        />
                                        {errors.position_id && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.position_id}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* ระดับ */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                                        <Label htmlFor="grade">ระดับ</Label>
                                        <Input
                                            id="grade"
                                            type="number"
                                            value={data.grade || ""}
                                            onChange={(e) =>
                                                setData("grade", e.target.value ? parseInt(e.target.value) : "")
                                            }
                                            className="h-11 rounded-xl border-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="ระบุระดับ (1-20)"
                                            min="1"
                                            max="20"
                                        />
                                        {errors.grade && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.grade}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* วันเกิด */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.65 }}
                                        className="md:col-span-2"
                                    >
                                        <Label>วันเกิด</Label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Select
                                                options={dayOptions}
                                                value={dayOptions.find((d) => d.value === birthDay) || null}
                                                onChange={(opt) => setBirthDay(opt?.value || "")}
                                                isClearable
                                                placeholder="วัน"
                                                theme={selectTheme}
                                                styles={selectStyles}
                                            />
                                            <Select
                                                options={monthOptions}
                                                value={monthOptions.find((m) => m.value === birthMonth) || null}
                                                onChange={(opt) => setBirthMonth(opt?.value || "")}
                                                isClearable
                                                placeholder="เดือน"
                                                theme={selectTheme}
                                                styles={selectStyles}
                                            />
                                            <Select
                                                options={yearOptions}
                                                value={yearOptions.find((y) => y.value === birthYear) || null}
                                                onChange={(opt) => setBirthYear(opt?.value || "")}
                                                isClearable
                                                placeholder="ปี"
                                                theme={selectTheme}
                                                styles={selectStyles}
                                            />
                                        </div>
                                        {errors.birthdate && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                                                <AlertCircle size={12} />
                                                <span>{errors.birthdate}</span>
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* รหัสผ่าน */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                        className="md:col-span-2"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <Lock size={16} className="text-violet-500 dark:text-violet-400" />
                                                <Label className="text-base font-semibold">การจัดการรหัสผ่าน</Label>
                                            </div>

                                            {/* Password Mode Selection */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {/* ไม่เปลี่ยนรหัสผ่าน */}
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        passwordMode === 'none'
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                                    onClick={() => setPasswordMode('none')}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="radio"
                                                            name="passwordMode"
                                                            checked={passwordMode === 'none'}
                                                            onChange={() => setPasswordMode('none')}
                                                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                ไม่เปลี่ยนรหัสผ่าน
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                คงรหัสผ่านเดิม
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* รหัสผ่านกำหนดเอง */}
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        passwordMode === 'custom'
                                                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                                    onClick={() => setPasswordMode('custom')}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="radio"
                                                            name="passwordMode"
                                                            checked={passwordMode === 'custom'}
                                                            onChange={() => setPasswordMode('custom')}
                                                            className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                กำหนดเอง
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                ใส่รหัสผ่านที่ต้องการ
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* รหัสผ่านจากวันเกิด */}
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        passwordMode === 'birthdate'
                                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                                    onClick={() => setPasswordMode('birthdate')}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="radio"
                                                            name="passwordMode"
                                                            checked={passwordMode === 'birthdate'}
                                                            onChange={() => setPasswordMode('birthdate')}
                                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                จากวันเกิด
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                สร้างจากวันเดือนปีเกิด
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* รหัสผ่านเริ่มต้น */}
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        passwordMode === 'default'
                                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                                    onClick={() => setPasswordMode('default')}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="radio"
                                                            name="passwordMode"
                                                            checked={passwordMode === 'default'}
                                                            onChange={() => setPasswordMode('default')}
                                                            className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                รหัสเริ่มต้น
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                01012569
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Custom Password Fields */}
                                            {passwordMode === 'custom' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-4 mt-4 p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl"
                                                >
                                                    <div className="space-y-3">
                                                        <Label htmlFor="customPassword">รหัสผ่านใหม่</Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="customPassword"
                                                                type={showPassword ? 'text' : 'password'}
                                                                value={customPassword}
                                                                onChange={(e) => setCustomPassword(e.target.value)}
                                                                className="h-11 pr-12 rounded-xl border-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-white"
                                                                placeholder="กรอกรหัสผ่านใหม่"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                            >
                                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="confirmPassword"
                                                                type={showConfirmPassword ? 'text' : 'password'}
                                                                value={confirmPassword}
                                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                                className={`h-11 pr-12 rounded-xl border-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white ${
                                                                    customPassword && confirmPassword && customPassword !== confirmPassword
                                                                        ? 'border-red-500 focus:border-red-500'
                                                                        : customPassword && confirmPassword && customPassword === confirmPassword
                                                                        ? 'border-emerald-500 focus:border-emerald-500'
                                                                        : ''
                                                                }`}
                                                                placeholder="ยืนยันรหัสผ่านใหม่"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                            >
                                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                        </div>
                                                        {customPassword && confirmPassword && customPassword !== confirmPassword && (
                                                            <p className="text-red-500 text-xs flex items-center space-x-1">
                                                                <AlertCircle size={12} />
                                                                <span>รหัสผ่านไม่ตรงกัน</span>
                                                            </p>
                                                        )}
                                                        {customPassword && confirmPassword && customPassword === confirmPassword && (
                                                            <p className="text-emerald-500 text-xs flex items-center space-x-1">
                                                                <Check size={12} />
                                                                <span>รหัสผ่านตรงกัน</span>
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="bg-violet-100 dark:bg-violet-900/20 p-3 rounded-xl">
                                                        <p className="text-xs text-violet-800 dark:text-violet-200">
                                                            <strong>คำแนะนำ:</strong> รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร
                                                            และควรประกอบด้วยตัวอักษรและตัวเลข
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Birthdate Password Preview */}
                                            {passwordMode === 'birthdate' && birthDay && birthMonth && birthYear && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl"
                                                >
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Check className="text-purple-600" size={16} />
                                                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                                            รหัสผ่านที่สร้างจากวันเกิด:
                                                        </span>
                                                    </div>
                                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-200 dark:border-purple-700">
                                                        <code className="text-lg font-mono text-purple-700 dark:text-purple-300">
                                                            {birthDay}{birthMonth}{parseInt(birthYear) + 543}
                                                        </code>
                                                    </div>
                                                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-2">
                                                        วันที่ {birthDay}/{birthMonth}/{parseInt(birthYear) + 543} (พ.ศ.)
                                                    </p>
                                                </motion.div>
                                            )}

                                            {/* Default Password Preview */}
                                            {passwordMode === 'default' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl"
                                                >
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Check className="text-amber-600" size={16} />
                                                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                                            รหัสผ่านเริ่มต้น:
                                                        </span>
                                                    </div>
                                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-amber-200 dark:border-amber-700">
                                                        <code className="text-lg font-mono text-amber-700 dark:text-amber-300">
                                                            01012569
                                                        </code>
                                                    </div>
                                                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">
                                                        01012569
                                                    </p>
                                                </motion.div>
                                            )}

                                            {/* Error Messages */}
                                            {errors.password && (
                                                <p className="text-red-500 text-sm flex items-center space-x-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                                                    <AlertCircle size={16} />
                                                    <span>{errors.password}</span>
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Submit Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-center pt-6"
                                >
                                    <Button
                                        type="submit"
                                        disabled={processing || (passwordMode === 'custom' && (!customPassword || customPassword !== confirmPassword))}
                                        className="px-8 py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {processing ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    }}
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                                />
                                                กำลังบันทึก...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} className="mr-2" />
                                                บันทึกการเปลี่ยนแปลง
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}
