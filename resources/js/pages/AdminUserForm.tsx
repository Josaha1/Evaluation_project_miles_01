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
import { Card } from "@/Components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

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
                        ? "✅ แก้ไขข้อมูลแล้ว"
                        : "✅ เพิ่มผู้ใช้งานแล้ว"
                );
                reset("password");
                setChangePassword(false);
            },
            onError: () => toast.error("❌ ไม่สามารถบันทึกได้"),
        });
    };

    const handleCreateDepartment = (inputValue: string) => {
        router.post(
            route("admin.departments.quick-store"),
            { name: inputValue, division_id: data.division_id },
            {
                onSuccess: () => {
                    toast.success("✅ เพิ่มหน่วยงานใหม่แล้ว");
                    router.reload({ only: ["departments"] });
                },
                onError: () => toast.error("❌ ไม่สามารถเพิ่มหน่วยงานได้"),
            }
        );
    };
    const handleCreateFaction = (inputValue: string) => {
        router.post(
            route("admin.factions.quick-store"),
            { name: inputValue },
            {
                onSuccess: () => {
                    toast.success("✅ เพิ่มฝ่ายใหม่แล้ว");
                    router.reload({ only: ["factions"] });
                },
                onError: () => toast.error("❌ ไม่สามารถเพิ่มฝ่ายได้"),
            }
        );
    };
    const handleCreatePosition = (inputValue: string) => {
        router.post(
            route("admin.positions.quick-store"),
            { title: inputValue },
            {
                onSuccess: () => {
                    toast.success("✅ เพิ่มตำแหน่งใหม่แล้ว");
                    router.reload({ only: ["position"] });
                },
                onError: () => toast.error("❌ ไม่สามารถเพิ่มตำแหน่งได้"),
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
        colors: {
            ...theme.colors,
            primary: "#6366f1",
            primary25: "#e0e7ff",
            neutral0: "#fff",
            neutral5: "#f3f4f6",
            neutral10: "#e5e7eb",
            neutral20: "#d1d5db",
            neutral30: "#9ca3af",
            neutral80: "#111827",
        },
    });

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: "#fff",
            borderColor: "#d1d5db",
            borderRadius: "0.5rem",
            paddingLeft: "0.25rem",
            paddingRight: "0.25rem",
            fontSize: "0.875rem",
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: "#fff",
            borderRadius: "0.5rem",
            marginTop: 4,
        }),
        input: (base: any) => ({
            ...base,
            color: "#111827",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: "#111827",
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#6366f1"
                : state.isFocused
                ? "#f3f4f6"
                : "#fff",
            color: state.isSelected ? "#fff" : "#111827",
            cursor: "pointer",
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
            <div className="max-w-5xl mx-auto px-6 py-10">
                <Card className="p-8 space-y-8">
                    <h1 className="text-3xl font-bold text-indigo-600">
                        {mode === "edit"
                            ? "✏️ แก้ไขผู้ใช้งาน"
                            : "➕ เพิ่มผู้ใช้งาน"}
                    </h1>

                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <div>
                            <Label>รหัสพนักงาน (EMID)</Label>
                            <Input
                                value={data.emid}
                                onChange={(e) =>
                                    setData("emid", e.target.value)
                                }
                                readOnly={data.user_type === "external"}
                                className={
                                    data.user_type === "external"
                                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                                        : "dark:bg-gray-800 dark:text-white"
                                }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                *{" "}
                                {data.user_type === "external"
                                    ? "สร้างอัตโนมัติจากสายงาน"
                                    : "กรอกเลข 6 หลักเองได้"}
                            </p>
                        </div>
                        <div>
                            <Label>คำนำหน้าชื่อ</Label>
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
                        </div>
                        <div>
                            <Label>ชื่อ</Label>
                            <Input
                                value={data.fname}
                                onChange={(e) =>
                                    setData("fname", e.target.value)
                                }
                                className="dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <Label>นามสกุล</Label>
                            <Input
                                value={data.lname}
                                onChange={(e) =>
                                    setData("lname", e.target.value)
                                }
                                className="dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <Label>เพศ</Label>
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
                        </div>

                        <div>
                            <Label>ตำแหน่งงาน</Label>
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
                        </div>
                        <div>
                            <Label>ระดับ</Label>
                            <Input
                                value={data.grade}
                                onChange={(e) =>
                                    setData("grade", e.target.value)
                                }
                                className="dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <Label>กอง</Label>
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
                        </div>
                        <div>
                            <Label>ฝ่าย</Label>
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
                        </div>
                        <div>
                            <Label>สายปฏิบัติงาน</Label>
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
                        </div>
                        {mode === "create" && (
                            <div>
                                <Label>วันเกิด</Label>
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
                                        styles={selectTheme}
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
                            </div>
                        )}
                        <div>
                            <Label>หน้าที่</Label>
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
                        </div>
                        <div>
                            <Label>ประเภทบุคคลากร</Label>
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
                        </div>
                        {/* Password Section */}
                        {mode === "create" && (
                            <div className="md:col-span-2">
                                <Label>รหัสผ่านเริ่มต้น (จากวันเกิด)</Label>
                                <Input
                                    value={data.password}
                                    readOnly
                                    className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                                />
                            </div>
                        )}
                        
                        {mode === "edit" && (
                            <div className="md:col-span-2">
                                <div className="space-y-4">
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
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <Label
                                            htmlFor="changePassword"
                                            className="flex items-center space-x-2 cursor-pointer"
                                        >
                                            <Lock size={16} className="text-gray-500" />
                                            <span>เปลี่ยนรหัสผ่าน</span>
                                        </Label>
                                    </div>

                                    {changePassword && (
                                        <div className="space-y-3">
                                            <Label htmlFor="password">
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
                                                    className="pr-12 dark:bg-gray-800 dark:text-white"
                                                    placeholder="กรอกรหัสผ่านใหม่"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(!showPassword)
                                                    }
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                💡 รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
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
                            </div>
                        )}

                        <div className="md:col-span-2 flex justify-end pt-4">
                            <Button type="submit" disabled={processing}>
                                💾{" "}
                                {mode === "edit"
                                    ? "อัปเดตผู้ใช้"
                                    : "บันทึกผู้ใช้ใหม่"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
}
