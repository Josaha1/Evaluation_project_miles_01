import MainLayout from '@/Layouts/MainLayout'
import { usePage, router } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { Pencil, Layers, AlignLeft } from 'lucide-react'
import { toast } from 'sonner';
import { useEffect } from 'react';
export default function AdminEvaluationEdit() {
  const { evaluation, stats, flash } = usePage().props as any
  useEffect(() => {
    if (flash.success) toast.success(flash.success);
    if (flash.error) toast.error(flash.error);
  }, [flash]);
  return (
    <MainLayout
      title={`แก้ไขแบบประเมิน: ${evaluation.title}`}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
            { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
            { label: `แก้ไข: ${evaluation.title}`, active: true },
          ]}
        />
      }
    >
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">ข้อมูลแบบประเมิน</h2>
          <p><strong>ชื่อ:</strong> {evaluation.title}</p>
          <p><strong>คำอธิบาย:</strong> {evaluation.description || '-'}</p>
          <p><strong>ประเภท:</strong> {evaluation.user_type === 'internal' ? 'บุคลากรภายใน' : 'บุคลากรภายนอก'} ({evaluation.grade_min} - {evaluation.grade_max})</p>
          <ul className="text-gray-700 dark:text-gray-300 space-y-1">
            <li>📦 จำนวนส่วน (Part): <strong>{stats.parts}</strong></li>
            <li>📁 จำนวนด้าน (Aspect): <strong>{stats.aspects}</strong></li>
            <li>🧩 จำนวนด้านย่อย (SubAspect): <strong>{stats.subaspects}</strong></li>
            <li>📝 จำนวนคำถาม: <strong>{stats.questions}</strong></li>
            <li>🔘 จำนวนตัวเลือก: <strong>{stats.options}</strong></li>
          </ul>
        </div>
      
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href={route('parts.index', { evaluation: evaluation.id })}
            className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 p-4 rounded shadow hover:bg-blue-100 transition"
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5" />
              <h3 className="font-bold">จัดการส่วน (Part)</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">เพิ่ม แก้ไข หรือลำดับส่วนของแบบประเมิน</p>
          </a>



        </div>
      </div>
    </MainLayout>
  )
}
