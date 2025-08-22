import { useEffect, FormEventHandler, useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import InputError from '@/Components/InputError'
import AnnouncementModal from '@/Components/AnnouncementModal'
import { 
  MessageCircle, 
  Play, 
  QrCode, 
  HelpCircle, 
  Video,
  Phone,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

type FormData = {
  emid: string
  password: string
  remember: boolean
}

interface AnnouncementData {
  title: string
  message: string
  deadline: string
  year: string
  show: boolean
}

interface LoginProps {
  announcement?: AnnouncementData
}

export default function Login({ announcement }: LoginProps) {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    emid: '',
    password: '',
    remember: false,
  })

  // State for announcement modal
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [hasSeenAnnouncement, setHasSeenAnnouncement] = useState(false)
  
  // State for modals
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  
  // Google Drive Video Configuration
  const GOOGLE_DRIVE_VIDEO_ID = "1KPDe0NBVz7UsYn2nuHw1IfZlWLiMSqWf" // File ID จาก Google Drive URL
  const VIDEO_TITLE = "วีดีโอแนะนำการใช้งานระบบประเมิน 360 องศา"

  // Show announcement popup every time if enabled
  useEffect(() => {
    if (!announcement?.show) {
      setHasSeenAnnouncement(true)
      return
    }

    // Always show announcement popup when page loads
    setShowAnnouncement(true)
  }, [announcement])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Don't allow login if announcement hasn't been seen
    if (!hasSeenAnnouncement) {
      setShowAnnouncement(true)
      return
    }
    
    post('/login')
  }

  const handleRememberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData('remember', e.target.checked)
  }

  const handleAnnouncementClose = () => {
    setShowAnnouncement(false)
    setHasSeenAnnouncement(true)
    
    // Note: No longer storing in localStorage to show popup every time
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Head title='เข้าสู่ระบบ - ระบบประเมิน 360 องศา'>
        <meta name="description" content="เข้าสู่ระบบประเมินพนักงาน 360 องศา - ระบบประเมินประสิทธิภาพและพัฒนาบุคลากร" />
      </Head>

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={showAnnouncement}
        onClose={handleAnnouncementClose}
        autoCloseDelay={15000} // 15 seconds
        announcement={announcement}
      />

      {/* Main Layout */}
      <div className="flex min-h-screen">
        
        {/* Left Sidebar - Always Expanded */}
        <div className="hidden lg:flex lg:w-64 xl:w-72 bg-gradient-to-b from-indigo-600 via-blue-600 to-purple-700 relative overflow-hidden">
        
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 50% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)`
            }}></div>
          </div>

          {/* Ribbon Edge Effect */}
          <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-white/20 via-white/10 to-white/5"></div>
          
          {/* Sidebar Content */}
          <div className="relative z-10 flex flex-col items-center py-8 w-full">
            
            {/* Logo */}
            <div className="mb-8 w-full px-4">
              <div className="w-full p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 flex items-center gap-3">
                <Users className="w-6 h-6 text-white flex-shrink-0" />
                <div className="flex flex-col">
                  <h3 className="text-white font-bold text-sm leading-tight">
                    ระบบประเมิน 360°
                  </h3>
                  <p className="text-white/80 text-xs">
                    Evaluation System
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex flex-col gap-4 flex-1 w-full px-4">
              
              {/* Video Tutorial Icon */}
              <div className="relative group">
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="w-full p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-3 hover:scale-105"
                >
                  <Video className="w-5 h-5 text-white flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium text-sm">
                      วีดีโอแนะนำ
                    </span>
                    <span className="text-white/70 text-xs">
                      วิธีใช้งานระบบ (5 นาที)
                    </span>
                  </div>
                </button>
              </div>

              {/* LINE Support Icon */}
              <div className="relative group">
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="w-full p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-3 hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium text-sm">
                      LINE Support
                    </span>
                    <span className="text-white/70 text-xs">
                      ติดต่อสอบถามปัญหา
                    </span>
                  </div>
                </button>
              </div>

              {/* Help Center Icon */}
              <div className="relative group">
                <button
                  onClick={() => setShowAnnouncement(true)}
                  className="w-full p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-3 hover:scale-105"
                >
                  <HelpCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium text-sm">
                      อ่านประกาศ
                    </span>
                    <span className="text-white/70 text-xs">
                      คำแนะนำและประกาศ
                    </span>
                  </div>
                </button>
              </div>

              {/* System Info Icon */}
              <div className="relative group">
                <button
                  className="w-full p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-3 hover:scale-105"
                >
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium text-sm">
                      ข้อมูลระบบ
                    </span>
                    <span className="text-white/70 text-xs">
                      ระบบประเมิน 360 องศา
                    </span>
                  </div>
                </button>
              </div>

            </div>

            {/* Bottom Status */}
            <div className="mt-8 w-full px-4">
              <div className="w-full p-3 bg-white/10 rounded-xl border border-white/20">
                <div className="text-center">
                  <p className="text-white/80 text-xs font-medium mb-1">
                    พร้อมใช้งานแล้ว
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/70 text-xs">Online</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Main Content Area - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="w-full max-w-lg">
            
            {/* Mobile Logo & Title */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ระบบประเมิน 360 องศา
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                เข้าสู่ระบบเพื่อเริ่มการประเมิน
              </p>
            </div>

            

            {/* Login Form Card */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-10">
              
              {/* Form Header */}
              <div className="text-center mb-8">
                <img src="/static/icon.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  เข้าสู่ระบบ
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบประเมิน
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Employee ID Field */}
                <div className="space-y-2">
                  <InputLabel htmlFor='emid' value='รหัสพนักงาน' className="text-gray-700 dark:text-gray-300 font-semibold text-sm" />
                  <div className="relative">
                    <TextInput
                      id='emid'
                      type='text'
                      name='emid'
                      value={data.emid}
                      onChange={e => setData('emid', e.target.value)}
                      className="block w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 text-lg"
                      placeholder="กรอกรหัสพนักงาน"
                    />
                    {data.emid && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.emid && <div className="text-red-500 text-sm mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4" />
                    {errors.emid}
                  </div>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <InputLabel htmlFor='password' value='รหัสผ่าน' className="text-gray-700 dark:text-gray-300 font-semibold text-sm" />
                  <div className="relative">
                    <TextInput
                      id='password'
                      type='password'
                      name='password'
                      value={data.password}
                      onChange={e => setData('password', e.target.value)}
                      className="block w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 text-lg"
                      placeholder="กรอกรหัสผ่าน"
                    />
                    {data.password && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.password && <div className="text-red-500 text-sm mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </div>}
                  
                  {/* Password Hint */}
                  <div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        <span className="font-medium">รหัสผ่านเริ่มต้น:</span> 01012568
                      </span>
                    </p>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={handleRememberChange}
                        className="w-5 h-5 rounded-lg border-2 border-gray-300 text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700/50 dark:border-gray-600 dark:focus:ring-offset-gray-800 transition-all duration-200"
                      />
                      {data.remember && (
                        <CheckCircle className="absolute -top-0.5 -right-0.5 w-3 h-3 text-green-500 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                      จดจำการเข้าสู่ระบบ
                    </span>
                  </label>
                </div>

                {/* Announcement Notice */}
                {!hasSeenAnnouncement && (
                  <div className="relative p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl shadow-lg overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-800/10 dark:to-orange-800/10"></div>
                    
                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                          <AlertCircle className="w-5 h-5 text-white animate-pulse" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-amber-800 dark:text-amber-200 mb-2">
                          📢 ประกาศสำคัญ!
                        </h4>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">
                          กรุณาอ่านประกาศการประเมิน 360 องศา
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          จำเป็นต้องอ่านและทำความเข้าใจประกาศก่อนเข้าสู่ระบบ
                        </p>
                        
                        {/* Action button */}
                        <button
                          onClick={() => setShowAnnouncement(true)}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                        >
                          <HelpCircle className="w-4 h-4" />
                          อ่านประกาศ
                        </button>
                      </div>
                    </div>
                    
                    {/* Animated border */}
                    <div className="absolute inset-0 border-2 border-amber-300 dark:border-amber-600 rounded-2xl animate-pulse"></div>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={!hasSeenAnnouncement || processing}
                  className={`relative w-full py-5 px-6 rounded-2xl font-bold text-lg text-white transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden ${
                    hasSeenAnnouncement && !processing
                      ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:via-blue-700 hover:to-purple-700 hover:shadow-2xl hover:shadow-indigo-500/25 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {/* Button background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {processing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span>เข้าสู่ระบบ</span>
                    </>
                  )}
                </button>

                {/* Re-read Announcement */}
                {hasSeenAnnouncement && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowAnnouncement(true)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline transition-colors flex items-center gap-1 mx-auto"
                    >
                      <HelpCircle className="w-4 h-4" />
                      อ่านประกาศอีกครั้ง
                    </button>
                  </div>
                )}

              </form>

              {/* Mobile Help Buttons */}
              <div className="lg:hidden mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                  >
                    <Video className="w-4 h-4" />
                    วีดีโอแนะนำ
                  </button>
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    ติดต่อ LINE
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Video Tutorial Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Video className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    วีดีโอแนะนำการใช้งานระบบประเมิน 360 องศา
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    เรียนรู้การใช้งานเบื้องต้นใน 5 นาที
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg aspect-video overflow-hidden">
                {/* Google Drive Video Embed */}
                <iframe
                  src={`https://drive.google.com/file/d/${GOOGLE_DRIVE_VIDEO_ID}/preview?usp=sharing`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="rounded-lg"
                  title={VIDEO_TITLE}
                ></iframe>
              </div>
              
              {/* Alternative options */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button 
                  onClick={() => {
                    // เปิด Google Drive โดยตรง
                    window.open(`https://drive.google.com/file/d/${GOOGLE_DRIVE_VIDEO_ID}/view?usp=sharing`, '_blank')
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.01 2C6.5 2 2.01 6.5 2.01 12s4.49 10 9.99 10c5.51 0 10-4.5 10-10s-4.49-10-9.99-10zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                  เปิดใน Google Drive
                </button>
                
                <button 
                  onClick={() => {
                    // ดาวน์โหลดวีดีโอ (หมายเหตุ: อาจไม่ทำงานหากไฟล์ใหญ่เกินไป)
                    window.open(`https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_VIDEO_ID}`, '_blank')
                  }}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ดาวน์โหลด
                </button>
              </div>

              {/* Instructions for Google Drive video */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 เคล็ดลับการดูวีดีโอ
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• หากวีดีโอไม่แสดงผล ให้คลิก "เปิดใน Google Drive"</li>
                  <li>• สามารถดาวน์โหลดเพื่อดูออฟไลน์ได้</li>
                  <li>• แนะนำให้ดูในโหมดเต็มจอสำหรับความชัดเจน</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LINE Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    ติดต่อสอบถามผ่าน LINE
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    สแกน QR Code ด้านล่าง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 text-center">
              {/* QR Code Area */}
              <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-lg border-4 border-green-200 flex items-center justify-center">
                <div className="text-center">
                  <img src="/assets/img/qrcodeline.jpg" alt="" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  วิธีการติดต่อ
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">1</div>
                    <span>เปิดแอป LINE บนมือถือ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">2</div>
                    <span>สแกน QR Code ด้านบน</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">3</div>
                    <span>เพิ่มเพื่อนและส่งข้อความ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">หรือ</div>
                    <span className='text-blue-400'><a href='https://line.me/ti/g/h-kyfpQGQE'>https://line.me/ti/g/h-kyfpQGQE</a></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>เวลาทำการ: 8:30-16:30</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>จ.-ศ.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
