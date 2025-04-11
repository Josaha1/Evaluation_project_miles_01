import MainLayout from '@/Layouts/MainLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useEffect } from 'react';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { toast } from 'sonner';

export default function AdminPartEdit() {
  const { evaluation, part, flash } = usePage().props as any;

  const { data, setData, put, processing, errors } = useForm({
    title: part?.title ?? '',
    description: part?.description ?? '',
    order: part?.order ?? 1,
    
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('parts.update', { evaluation: evaluation.id, part: part.id }), {
      onSuccess: () => toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว ✅'),
      onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก ❌'),
    });
  };

  useEffect(() => {
    if (flash.success) toast.success(flash.success);
    if (flash.error) toast.error(flash.error);
  }, [flash]);

  return (
    <MainLayout title="แก้ไขส่วนของแบบประเมิน" breadcrumb={
      <Breadcrumb
        items={[
          { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
          { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
          { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
          { label: 'แก้ไขส่วน', active: true },
        ]}
      />
    }>
      <div className="max-w-xl mx-auto py-10">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อส่วน</label>
            <input
              type="text"
              className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
              value={data.title}
              onChange={e => setData('title', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">คำอธิบาย (ถ้ามี)</label>
            <textarea
              className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
              value={data.description}
              onChange={e => setData('description', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ลำดับ</label>
            <input
              type="number"
              className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
              value={data.order}
              onChange={e => setData('order', parseInt(e.target.value))}
              required
            />
          </div>

          

          <div className="text-right">
            <button type="submit" disabled={processing} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
