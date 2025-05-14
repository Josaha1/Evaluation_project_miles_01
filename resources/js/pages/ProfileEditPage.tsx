import MainLayout from "@/Layouts/MainLayout";
import { useForm, usePage, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Select from "react-select";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
interface Division {
    id: number;
    name: string;
}
interface Department {
    id: number;
    name: string;
}
interface Position {
    id: number;
    title: string;
}

interface PageProps {
    auth: any;
    flash: any;
    divisions: Division[];
    departments: Department[];
    positions: Position[];
}
const toOptions = (items: any[], labelKey = "name") =>
    items.map((d) => ({ value: d.id.toString(), label: d[labelKey] }));

const sexOptions = [
    { value: "ชาย", label: "ชาย" },
    { value: "หญิง", label: "หญิง" },
];

const prenameOptions = [
    { value: "นาย", label: "นาย" },
    { value: "นาง", label: "นาง" },
    { value: "นางสาว", label: "นางสาว" },
];


export default function ProfileEditPage() {
    const { auth, flash, divisions, departments, positions } =
        usePage<PageProps>().props;

    const divisionOptions = toOptions(divisions);
    const departmentOptions = toOptions(departments);
    const positionOptions = toOptions(positions, "title");
    const [preview, setPreview] = useState<string | null>(null);
    const { data, setData, post, processing, errors } = useForm({
        prename: auth.user.prename || "",
        fname: auth.user.fname || "",
        lname: auth.user.lname || "",
        sex: auth.user.sex || "",
        division_id: auth.user.division_id || "",
        department_id: auth.user.department_id || "",
        position_id: auth.user.position_id || "",
        grade: auth.user.grade || "",
        photo: auth.user.photo ?? null,
    });

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(
            route("profile.update"),
            {
                _method: "PUT",
                ...data,
            },
            {
                forceFormData: true,
                onSuccess: () => toast.success("✅ บันทึกโปรไฟล์สำเร็จ"),
                onError: () => toast.error("❌ เกิดข้อผิดพลาด"),
            }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("photo", file);
            setPreview(URL.createObjectURL(file)); // ต้องแน่ใจว่า file เป็นภาพจริง
        }
    };
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
    return (
        <MainLayout title="แก้ไขโปรไฟล์">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl mx-auto py-12 px-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg"
            >
                <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                    👤 แก้ไขข้อมูลส่วนตัว
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center">
                        <img
                            src={
                                preview
                                    ? preview
                                    : typeof data.photo === "string" &&
                                      data.photo
                                    ? `/storage/${data.photo}`
                                    : "/images/default.png"
                            }
                            alt="รูปโปรไฟล์"
                            className="w-24 h-24 rounded-full mx-auto border mb-2 object-cover"
                        />

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-full file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>

                    <div>
                        <Label>คำนำหน้า</Label>
                        <Select
                            options={prenameOptions}
                            value={prenameOptions.find(
                                (opt) => opt.value === data.prename
                            )}
                            onChange={(opt) =>
                                setData("prename", opt?.value || "")
                            }
                            isClearable
                            theme={selectTheme}
                            styles={selectStyles}
                        />
                        {errors.prename && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.prename}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label>ชื่อ</Label>
                        <Input
                            value={data.fname}
                            onChange={(e) => setData("fname", e.target.value)}
                            className="dark:bg-gray-800 dark:text-white"
                        />
                        {errors.fname && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.fname}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label>นามสกุล</Label>
                        <Input
                            value={data.lname}
                            onChange={(e) => setData("lname", e.target.value)}
                            className="dark:bg-gray-800 dark:text-white"
                        />
                        {errors.lname && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.lname}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label>เพศ</Label>
                        <Select
                            options={sexOptions}
                            value={sexOptions.find(
                                (opt) => opt.value === data.sex
                            )}
                            onChange={(opt) => setData("sex", opt?.value || "")}
                            isClearable
                            theme={selectTheme}
                            styles={selectStyles}
                        />
                    </div>
                    <div>
                        <Label>สายงาน</Label>
                        <Select
                            options={divisionOptions}
                            value={divisionOptions.find(
                                (opt) =>
                                    opt.value === data.division_id?.toString()
                            )}
                            onChange={(opt) =>
                                setData("division_id", opt?.value || "")
                            }
                            isClearable
                            theme={selectTheme}
                            styles={selectTheme}
                        />
                    </div>

                    <div>
                        <Label>หน่วยงาน</Label>
                        <Select
                            options={departmentOptions}
                            value={departmentOptions.find(
                                (opt) =>
                                    opt.value === data.department_id?.toString()
                            )}
                            onChange={(opt) =>
                                setData("department_id", opt?.value || "")
                            }
                            isClearable
                            theme={selectTheme}
                            styles={selectStyles}
                        />
                    </div>

                    <div>
                        <Label>ตำแหน่ง</Label>
                        <Select
                            options={positionOptions}
                            value={positionOptions.find(
                                (opt) =>
                                    opt.value === data.position_id?.toString()
                            )}
                            onChange={(opt) =>
                                setData("position_id", opt?.value || "")
                            }
                            isClearable
                            theme={selectTheme}
                            styles={selectStyles}
                        />
                    </div>

                    <div>
                        <Label>ระดับ</Label>
                        <Input
                            type="number"
                            value={data.grade}
                            onChange={(e) =>
                                setData("grade", parseInt(e.target.value) || 0)
                            }
                            className="dark:bg-gray-800 dark:text-white"
                        />
                        {errors.grade && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.grade}
                            </p>
                        )}
                    </div>

                    <div className="text-center pt-4">
                        <Button type="submit" disabled={processing}>
                            💾 บันทึกการเปลี่ยนแปลง
                        </Button>
                    </div>
                </form>
            </motion.div>
        </MainLayout>
    );
}
