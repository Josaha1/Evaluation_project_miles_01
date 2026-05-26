import React, { useEffect, useState } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Lock, Eye, EyeOff, AlertCircle, UserPlus, Save } from "lucide-react";

interface Division {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
    division_id: number;
}
interface Faction {
    id: number;
    name: string;
}
interface Position {
    id: number;
    title: string;
    department_id: number;
}

interface PageProps {
    divisions: Division[];
    departments: Department[];
    factions: Faction[];
    position: Position[];
    user?: any;
    mode: "create" | "edit";
}

interface OptionType {
    value: string;
    label: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const isDarkMode = () => document.documentElement.classList.contains("dark");

export default function AdminUserForm() {
    const { divisions, departments, factions, position, mode, user } =
        usePage<PageProps>().props;
    const [generatedEmid, setGeneratedEmid] = useState("");
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [darkMode, setDarkMode] = useState(isDarkMode());
    const [changePassword, setChangePassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        emid: user?.emid || "",
        prename: user?.prename || "",
        fname: user?.fname || "",
        lname: user?.lname || "",
        sex: user?.sex || "",
        division_id: user?.division_id || "",
        department_id: user?.department_id || "",
        faction_id: user?.faction_id || "",
        position_id: user?.position_id || "",
        grade: user?.grade || "",
        birthdate: user?.birthdate || "",
        password: "",
        role: user?.role || "user",
        user_type: user?.user_type || "internal",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submit = mode === "edit" ? put : post;
        const routeName =
            mode === "edit"
                ? route("admin.users.update", user.emid)
                : route("admin.users.store");

        submit(routeName, {
            onSuccess: () => {
                toast.success(
                    mode === "edit"
                        ? "แก้ไขข้อมูลแล้ว"
                        : "เพิ่มผู้ใช้งานแล้ว"
                );
                reset("password");
                setChangePassword(false);
            },
            onError: () => toast.error("ไม่สามารถบันทึกได้"),
        });
    };

    const handleCreateDepartment = (inputValue: string) => {
        router.post(
            route("admin.departments.quick-store"),
            { name: inputValue, division_id: data.division_id },
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
            route("admin.factions.quick-store"),
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
            route("admin.positions.quick-store"),
            { title: inputValue },
            {
                onSuccess: () => {
                    toast.success("เพิ่มตำแหน่งใหม่แล้ว");
                    router.reload({ only: ["position"] });
                },
                onError: () => toast.error("ไม่สามารถเพิ่มตำแหน่งได้"),
            }
        );
    };

    const toOptions = (items: any[], labelKey: string = "name"): OptionType[] =>
        items.map((d) => ({ value: d.id.toString(), label: d[labelKey] }));

    // Add safety checks for undefined arrays
    const divisionOptions = toOptions(divisions || []);
    const departmentOptions = toOptions(departments || []);
    const factionOptions = toOptions(factions || []);
    const positionOptions = toOptions(position || [], "title");

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

    const selectTheme = (theme: any) => ({
        ...theme,
        borderRadius: 12,
        colors: {
            ...theme.colors,
            primary: "#7c3aed",
            primary25: "#ede9fe",
            neutral0: darkMode ? "#1f2937" : "#fff",
            neutral5: darkMode ? "#374151" : "#f3f4f6",
            neutral10: darkMode ? "#4b5563" : "#e5e7eb",
            neutral20: darkMode ? "#6b7280" : "#e5e7eb",
            neutral30: darkMode ? "#9ca3af" : "#9ca3af",
            neutral80: darkMode ? "#f9fafb" : "#111827",
        },
    });

    const selectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            borderColor: state.isFocused ? "#7c3aed" : darkMode ? "#4b5563" : "#e5e7eb",
            borderWidth: "2px",
            borderRadius: "0.75rem",
            paddingLeft: "0.25rem",
            paddingRight: "0.25rem",
            fontSize: "0.875rem",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(124, 58, 237, 0.2)" : "none",
            "&:hover": {
                borderColor: "#7c3aed",
            },
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            borderRadius: "0.75rem",
            marginTop: 4,
            border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
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
                ? darkMode ? "#374151" : "#f5f3ff"
                : "transparent",
            color: state.isSelected ? "#fff" : darkMode ? "#f9fafb" : "#111827",
            cursor: "pointer",
            borderRadius: "0.5rem",
            margin: "2px 4px",
            width: "calc(100% - 8px)",
        }),
    };

    const [birthDay, setBirthDay] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthYear, setBirthYear] = useState("");

    const dayOptions = Array.from({ length: 31 }, (_, i) => ({
        value: (i + 1).toString().padStart(2, "0"),
        label: (i + 1).toString(),
    }));
    const sexOptions = [
        { value: "ชาย", label: "ชาย" },
        { value: "หญิง", label: "หญิง" },
    ];
    const prenameOptions = [
        { value: "นาย", label: "นาย" },
        { value: "นางสาว", label: "นางสาว" },
        { value: "นาง", label: "นาง" },
    ];
    const roleOptions = [
        { value: "user", label: "User" },
        { value: "admin", label: "Admin" },
    ];
    const userTypeOptions = [
        { value: "internal", label: "ภายใน" },
        { value: "external", label: "ภายนอก" },
    ];
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

    useEffect(() => {
        if (birthDay && birthMonth && birthYear) {
            const isoDate = new Date(
                parseInt(birthYear),
                parseInt(birthMonth) - 1,
                parseInt(birthDay)
            )
                .toISOString()
                .split("T")[0];
            setData("birthdate", isoDate);
        }
    }, [birthDay, birthMonth, birthYear]);
    useEffect(() => {
        if (data.division_id && data.user_type === "external") {
            const paddedDivision = data.division_id.toString().padStart(2, "0");
            const fakeSequence = Math.floor(100 + Math.random() * 900);
            const newEmid = `E${paddedDivision}${fakeSequence}`;
            setGeneratedEmid(newEmid);
            setData("emid", newEmid);
        }
    }, [data.user_type, data.division_id]);

    useEffect(() => {
        if (birthDay && birthMonth && birthYear) {
            const birthdate = `${birthYear}-${birthMonth}-${birthDay}`;
            setData("birthdate", birthdate);
            if (mode === "create") {
                const buddhistYear = (parseInt(birthYear) + 543).toString();
                const password = `${birthDay}${birthMonth}${buddhistYear}`;
                setGeneratedPassword(password);
                setData("password", password);
            }
        }
    }, [birthDay, birthMonth, birthYear]);

    const inputClassName = "rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-700 transition-all";

    return (
        <MainLayout
            title={mode === "edit" ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}
            breadcrumb={
                <Breadcrumb
                    items={[
                        {
                            label: "แดชบอร์ดผู้ดูแลระบบ",
                            href: route("admindashboard"),
                        },
                        {
                            label: "จัดการสมาชิก",
                            href: route("admin.users.index"),
                        },
                        {
                            label:
                                mode === "edit" ? "แก้ไขผู้ใช้" : "เพิ่มสมาชิก",
                            active: true,
                        },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div
                    className="max-w-5xl mx-auto px-2 sm:px-6 py-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8 space-y-8">
                        {/* Title */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-gradient-primary">
                                {mode === "edit"
                                    ? "แก้ไขผู้ใช้งาน"
                                    : "เพิ่มผู้ใช้งาน"}
                            </h1>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">รหัสพนักงาน (EMID)</Label>
                                <Input
                                    value={data.emid}
                                    onChange={(e) =>
                                        setData("emid", e.target.value)
                                    }
                                    readOnly={data.user_type === "external"}
                                    className={cn(
                                        inputClassName,
                                        data.user_type === "external" && "bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                    )}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    *{" "}
                                    {data.user_type === "external"
                                        ? "สร้างอัตโนมัติจากสายงาน"
                                        : "กรอกเลข 6 หลักเองได้"}
                                </p>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">คำนำหน้าชื่อ</Label>
                                <Select
                                    options={prenameOptions}
                                    value={
                                        prenameOptions.find(
                                            (o) => o.value === data.prename
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("prename", opt?.value || "")
                                    }
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ชื่อ</Label>
                                <Input
                                    value={data.fname}
                                    onChange={(e) =>
                                        setData("fname", e.target.value)
                                    }
                                    className={inputClassName}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">นามสกุล</Label>
                                <Input
                                    value={data.lname}
                                    onChange={(e) =>
                                        setData("lname", e.target.value)
                                    }
                                    className={inputClassName}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">เพศ</Label>
                                <CreatableSelect
                                    options={sexOptions}
                                    value={
                                        sexOptions.find(
                                            (o) => o.value === data.sex
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("sex", opt?.value || "")
                                    }
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ตำแหน่งงาน</Label>
                                <CreatableSelect
                                    options={positionOptions}
                                    value={
                                        positionOptions.find(
                                            (o) => o.value === data.position_id
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("position_id", opt?.value || "")
                                    }
                                    onCreateOption={handleCreatePosition}
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ระดับ</Label>
                                <Input
                                    value={data.grade}
                                    onChange={(e) =>
                                        setData("grade", e.target.value)
                                    }
                                    className={inputClassName}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">กอง</Label>
                                <CreatableSelect
                                    options={departmentOptions}
                                    value={
                                        departmentOptions.find(
                                            (o) => o.value === data.department_id
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("department_id", opt?.value || "")
                                    }
                                    onCreateOption={handleCreateDepartment}
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ฝ่าย</Label>
                                <CreatableSelect
                                    options={factionOptions}
                                    value={
                                        factionOptions.find(
                                            (o) => o.value === data.faction_id
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("faction_id", opt?.value || "")
                                    }
                                    onCreateOption={handleCreateFaction}
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">สายปฏิบัติงาน</Label>
                                <CreatableSelect
                                    options={divisionOptions}
                                    value={
                                        divisionOptions.find(
                                            (o) => o.value === data.division_id
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("division_id", opt?.value || "")
                                    }
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>
                            {mode === "create" && (
                                <motion.div variants={itemVariants}>
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">วันเกิด</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            options={dayOptions}
                                            value={dayOptions.find(
                                                (d) => d.value === birthDay
                                            )}
                                            onChange={(opt) =>
                                                setBirthDay(opt?.value || "")
                                            }
                                            isClearable
                                            placeholder="วัน"
                                            theme={selectTheme}
                                            styles={selectStyles}
                                            className="w-1/3"
                                        />
                                        <Select
                                            options={monthOptions}
                                            value={monthOptions.find(
                                                (m) => m.value === birthMonth
                                            )}
                                            onChange={(opt) =>
                                                setBirthMonth(opt?.value || "")
                                            }
                                            isClearable
                                            placeholder="เดือน"
                                            theme={selectTheme}
                                            styles={selectStyles}
                                            className="w-1/3"
                                        />
                                        <Select
                                            options={yearOptions}
                                            value={yearOptions.find(
                                                (y) => y.value === birthYear
                                            )}
                                            onChange={(opt) =>
                                                setBirthYear(opt?.value || "")
                                            }
                                            isClearable
                                            placeholder="ปี"
                                            theme={selectTheme}
                                            styles={selectStyles}
                                            className="w-1/3"
                                        />
                                    </div>
                                </motion.div>
                            )}
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">หน้าที่</Label>
                                <CreatableSelect
                                    options={roleOptions}
                                    value={
                                        roleOptions.find(
                                            (o) => o.value === data.role
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("role", opt?.value || "")
                                    }
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ประเภทบุคคลากร</Label>
                                <CreatableSelect
                                    options={userTypeOptions}
                                    value={
                                        userTypeOptions.find(
                                            (o) => o.value === data.user_type
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setData("user_type", opt?.value || "")
                                    }
                                    isClearable
                                    placeholder="เลือก..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                            </motion.div>
                            {/* Password Section */}
                            {mode === "create" && (
                                <motion.div variants={itemVariants} className="md:col-span-2">
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">รหัสผ่านเริ่มต้น (จากวันเกิด)</Label>
                                    <Input
                                        value={data.password}
                                        readOnly
                                        className={cn(inputClassName, "bg-gray-100 dark:bg-gray-700 cursor-not-allowed")}
                                    />
                                </motion.div>
                            )}

                            {mode === "edit" && (
                                <motion.div variants={itemVariants} className="md:col-span-2">
                                    <div className="glass-card rounded-xl p-5 space-y-4 border border-violet-200/50 dark:border-violet-800/30">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="changePassword"
                                                checked={changePassword}
                                                onChange={(e) => {
                                                    setChangePassword(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setData("password", "");
                                                    }
                                                }}
                                                className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500 border-gray-300"
                                            />
                                            <Label
                                                htmlFor="changePassword"
                                                className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300"
                                            >
                                                <Lock size={16} className="text-violet-500" />
                                                <span>เปลี่ยนรหัสผ่าน</span>
                                            </Label>
                                        </div>

                                        {changePassword && (
                                            <div className="space-y-3">
                                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                                                    รหัสผ่านใหม่
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={data.password}
                                                        onChange={(e) =>
                                                            setData("password", e.target.value)
                                                        }
                                                        className={cn(inputClassName, "pr-12")}
                                                        placeholder="กรอกรหัสผ่านใหม่"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPassword(!showPassword)
                                                        }
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff size={16} />
                                                        ) : (
                                                            <Eye size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
                                                </p>
                                                {errors.password && (
                                                    <p className="text-red-500 text-xs flex items-center space-x-1">
                                                        <AlertCircle size={12} />
                                                        <span>{errors.password}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants} className="md:col-span-2 flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium",
                                        "hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    <Save className="w-4 h-4" />
                                    {mode === "edit"
                                        ? "อัปเดตผู้ใช้"
                                        : "บันทึกผู้ใช้ใหม่"}
                                </button>
                            </motion.div>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </MainLayout>
    );
}
