import { useEffect, FormEventHandler } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import GuestLayout from '@/Layouts/GuestLayout'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import InputError from '@/Components/InputError'

type FormData = {
  emid: string
  password: string
  remember: boolean
}

export default function Login() {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    emid: '',
    password: '',
    remember: false,
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/login')
  }
  const handleRememberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData('remember', e.target.checked)
  }

  return (
    <GuestLayout>
      <Head title='Login'>
        <meta name="description" content="Login page description" />
      </Head>

      <form onSubmit={handleSubmit}>
        

        <div>
          <InputLabel htmlFor='emid' value='รหัสพนักงาน' />
          <TextInput
            id='emid'
            type='text'
            name='emid'
            value={data.emid}
            onChange={e => setData('emid', e.target.value)}
            className="mt-1 p-2 block w-full"
          />
          {errors.emid && <div className="text-red-500 text-sm mt-1">{errors.emid}</div>}
        </div>

        <div className="mt-4">
          <InputLabel htmlFor='password' value='รหัสผ่าน' />
          <TextInput
            id='password'
            type='password'
            name='password'
            value={data.password}
            onChange={e => setData('password', e.target.value)}
            className="mt-1 p-2 block w-full"
          />
          {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
          <InputLabel htmlFor='password' className='text-red-400 mt-2' value='*ใช้วัน/เดือน/ปีเกิด เป็นค่าเริ่มต้นในรูปแบบววดดปปปป (พ.ศ.) เช่น 13052541' />
        </div>

        <div className="flex items-center justify-between mt-4 mb-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="remember"
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">จดจำฉัน</span>
          </label>
        </div>

        {/* Login Button */}
        <div className="flex items-center justify-end mt-2">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 ml-4 hover:cursor-pointer"
          >
            เข้าสู่ระบบ
          </button>

        </div>

      </form>
    </GuestLayout>
  )
}
