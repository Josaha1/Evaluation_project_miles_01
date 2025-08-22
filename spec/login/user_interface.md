# User Interface Specification - ระบบประเมิน 360 องศา

## Overview / ภาพรวม

This document describes the user interface components, design patterns, and user experience features of the login system.

เอกสารนี้อธิบายองค์ประกอบของส่วนติดต่อผู้ใช้ รูปแบบการออกแบบ และคุณสมบัติประสบการณ์ผู้ใช้ของระบบล็อกอิน

## Main Login Page / หน้าล็อกอินหลัก

### File Location / ตำแหน่งไฟล์
- **Component**: `resources/js/pages/Auth/Login.tsx`
- **Route**: `/login`
- **Layout**: Guest layout with responsive design

### Page Structure / โครงสร้างหน้า

```typescript
interface LoginProps {
  announcement?: AnnouncementData
}

interface AnnouncementData {
  title: string
  message: string
  deadline: string
  year: string
  show: boolean
}
```

## Layout Design / การออกแบบเลย์เอาต์

### Desktop Layout / เลย์เอาต์เดสก์ท็อป

```
┌─────────────────┬─────────────────────────────────┐
│                 │                                 │
│   Left Sidebar  │         Main Content Area       │
│   (Navigation)  │         (Login Form)            │
│                 │                                 │
│   - Logo        │   ┌─────────────────────────┐   │
│   - Video Help  │   │                         │   │
│   - LINE Help   │   │     Login Form Card     │   │
│   - Announcements│   │                         │   │
│   - System Info │   │   - Employee ID         │   │
│                 │   │   - Password            │   │
│   Status: Online│   │   - Remember Me         │   │
│                 │   │   - Login Button        │   │
│                 │   └─────────────────────────┘   │
└─────────────────┴─────────────────────────────────┘
```

### Mobile Layout / เลย์เอาต์มือถือ

```
┌─────────────────────────────────┐
│           Mobile Header         │
│   ┌─────┐ ระบบประเมิน 360°      │
│   │ 👥  │ Evaluation System     │
│   └─────┘                       │
├─────────────────────────────────┤
│                                 │
│     ┌─────────────────────┐     │
│     │                     │     │
│     │   Login Form Card   │     │
│     │                     │     │
│     │ - Employee ID       │     │
│     │ - Password          │     │
│     │ - Remember Me       │     │
│     │ - Login Button      │     │
│     │                     │     │
│     └─────────────────────┘     │
│                                 │
│  ┌─────────────┬─────────────┐  │
│  │Video Help   │LINE Support │  │
│  └─────────────┴─────────────┘  │
└─────────────────────────────────┘
```

## Component Details / รายละเอียดคอมโพเนนต์

### 1. Left Sidebar (Desktop Only) / แถบด้านซ้าย (เดสก์ท็อปเท่านั้น)

#### Design Features / คุณสมบัติการออกแบบ

```css
/* Gradient background with pattern overlay */
background: linear-gradient(to bottom, #4F46E5, #2563EB, #7C3AED);

/* Background pattern for visual depth */
background-image: 
  radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
  radial-gradient(circle at 50% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%);
```

#### Navigation Cards / การ์ดนำทาง

```typescript
// Each navigation item is a card with hover effects
className="w-full p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-3 hover:scale-105"
```

**Navigation Items:**
1. **Video Tutorial** - แนะนำการใช้งาน (5 นาที)
2. **LINE Support** - ติดต่อสอบถามปัญหา  
3. **Announcements** - คำแนะนำและประกาศ
4. **System Info** - ข้อมูลระบบ

#### Status Indicator / ตัวแสดงสถานะ

```typescript
<div className="flex items-center justify-center gap-2">
  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
  <span className="text-white/70 text-xs">Online</span>
</div>
```

### 2. Login Form Card / การ์ดฟอร์มล็อกอิน

#### Card Design / การออกแบบการ์ด

```css
/* Glass morphism effect */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(16px);
border-radius: 24px;
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
border: 1px solid rgba(255, 255, 255, 0.5);
```

#### Form Header / หัวข้อฟอร์ม

```typescript
<div className="text-center mb-8">
  <img src="/static/icon.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
    เข้าสู่ระบบ
  </h2>
  <p className="text-gray-600 dark:text-gray-400">
    กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบประเมิน
  </p>
</div>
```

### 3. Input Fields / ช่องกรอกข้อมูล

#### Employee ID Field / ช่องรหัสพนักงาน

```typescript
<TextInput
  id='emid'
  type='text'
  name='emid'
  value={data.emid}
  onChange={e => setData('emid', e.target.value)}
  className="block w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 text-lg"
  placeholder="กรอกรหัสพนักงาน"
/>
```

#### Visual Validation Indicators / ตัวแสดงการตรวจสอบ

```typescript
{data.emid && (
  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
)}
```

#### Password Field with Hint / ช่องรหัสผ่านพร้อมคำแนะนำ

```typescript
<div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-3">
    <HelpCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
    <span>
      <span className="font-medium">รหัสผ่านเริ่มต้น:</span> 01012568
    </span>
  </p>
</div>
```

### 4. Remember Me Checkbox / ช่องจดจำการเข้าสู่ระบบ

```typescript
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
```

### 5. Login Button / ปุ่มเข้าสู่ระบบ

#### Dynamic Button States / สถานะปุ่มแบบเปลี่ยนแปลงได้

```typescript
<button
  type="submit"
  disabled={!hasSeenAnnouncement || processing}
  className={`relative w-full py-5 px-6 rounded-2xl font-bold text-lg text-white transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden ${
    hasSeenAnnouncement && !processing
      ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:via-blue-700 hover:to-purple-700 hover:shadow-2xl hover:shadow-indigo-500/25 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
      : 'bg-gray-400 cursor-not-allowed opacity-60'
  }`}
>
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
```

## Modal Components / คอมโพเนนต์โมดัล

### 1. Announcement Modal / โมดัลประกาศ

#### Features / คุณสมบัติ

- **Auto-display on page load** / แสดงอัตโนมัติเมื่อโหลดหน้า
- **Required reading before login** / ต้องอ่านก่อนล็อกอิน  
- **Auto-close after 15 seconds** / ปิดอัตโนมัติหลัง 15 วินาที
- **Manual close option** / ตัวเลือกปิดด้วยตนเอง

```typescript
<AnnouncementModal
  isOpen={showAnnouncement}
  onClose={handleAnnouncementClose}
  autoCloseDelay={15000}
  announcement={announcement}
/>
```

### 2. Video Tutorial Modal / โมดัลวีดีโอแนะนำ

#### Google Drive Integration / การเชื่อมต่อ Google Drive

```typescript
const GOOGLE_DRIVE_VIDEO_ID = "1KPDe0NBVz7UsYn2nuHw1IfZlWLiMSqWf";
const VIDEO_TITLE = "วีดีโอแนะนำการใช้งานระบบประเมิน 360 องศา";

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
```

#### Alternative Access Options / ตัวเลือกการเข้าถึงทางเลือก

- **Open in Google Drive** / เปิดใน Google Drive
- **Download option** / ตัวเลือกดาวน์โหลด
- **Fallback instructions** / คำแนะนำสำรอง

### 3. LINE Support Modal / โมดัลช่วยเหลือ LINE

#### QR Code Display / การแสดง QR Code

```typescript
<div className="w-48 h-48 mx-auto mb-4 bg-white rounded-lg border-4 border-green-200 flex items-center justify-center">
  <img src="/assets/img/qrcodeline.jpg" alt="LINE QR Code" />
</div>
```

#### Contact Instructions / คำแนะนำการติดต่อ

1. **เปิดแอป LINE บนมือถือ** / Open LINE app on mobile
2. **สแกน QR Code ด้านบน** / Scan QR code above  
3. **เพิ่มเพื่อนและส่งข้อความ** / Add friend and send message
4. **Alternative URL**: `https://line.me/ti/g/h-kyfpQGQE`

#### Support Hours / เวลาให้บริการ

- **Working Hours**: 8:30-16:30
- **Days**: จันทร์-ศุกร์ (Monday-Friday)

## Error Display / การแสดงข้อผิดพลาด

### Field-Level Errors / ข้อผิดพลาดระดับฟิลด์

```typescript
{errors.emid && (
  <div className="text-red-500 text-sm mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
    <AlertCircle className="w-4 h-4" />
    {errors.emid}
  </div>
)}
```

### Form-Level Notifications / การแจ้งเตือนระดับฟอร์ม

#### Announcement Requirement Notice / การแจ้งเตือนข้อกำหนดประกาศ

```typescript
{!hasSeenAnnouncement && (
  <div className="relative p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl shadow-lg overflow-hidden">
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
        <AlertCircle className="w-5 h-5 text-white animate-pulse" />
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
      </div>
    </div>
  </div>
)}
```

## Responsive Design / การออกแบบตอบสนอง

### Breakpoints / จุดหยุดการตอบสนอง

| Screen Size | Layout Changes |
|-------------|---------------|
| `< 1024px` | Hide left sidebar, show mobile layout |
| `>= 1024px` | Show left sidebar, desktop layout |
| `< 768px` | Stack form elements, larger touch targets |

### Mobile Optimizations / การปรับปรุงสำหรับมือถือ

1. **Touch-friendly button sizes** / ขนาดปุ่มที่เหมาะกับการสัมผัส
2. **Larger input fields** / ช่องกรอกข้อมูลขนาดใหญ่
3. **Mobile help buttons at bottom** / ปุ่มช่วยเหลือสำหรับมือถือด้านล่าง
4. **Simplified navigation** / การนำทางที่เรียบง่าย

## Accessibility Features / คุณสมบัติการเข้าถึง

### Keyboard Navigation / การนำทางด้วยแป้นพิมพ์

- **Tab order optimization** / การเรียงลำดับ Tab ที่เหมาะสม
- **Enter key submission** / การส่งด้วยปุ่ม Enter
- **Escape key modal closing** / การปิดโมดัลด้วยปุ่ม Escape

### Screen Reader Support / การสนับสนุนโปรแกรมอ่านหน้าจอ

```typescript
<InputLabel htmlFor='emid' value='รหัสพนักงาน' />
<TextInput
  id='emid'
  aria-describedby='emid-error'
  aria-invalid={errors.emid ? 'true' : 'false'}
/>
```

### Color Contrast / ความคมชัดของสี

- **WCAG AA compliance** / การปฏิบัติตาม WCAG AA
- **High contrast mode support** / การสนับสนุนโหมดความคมชัดสูง
- **Dark theme compatibility** / ความเข้ากันได้กับธีมมืด

## Animation & Transitions / แอนิเมชันและการเปลี่ยนผ่าน

### Micro-interactions / การโต้ตอบขนาดเล็ก

```css
/* Hover effects on navigation cards */
transition: all 300ms ease;
transform: scale(1.05);

/* Button press feedback */
active:scale-[0.98];

/* Loading spinner */
animate-spin;

/* Status indicator pulse */
animate-pulse;
```

### Form Validation Feedback / ข้อเสนอแนะการตรวจสอบฟอร์ม

- **Real-time validation indicators** / ตัวแสดงการตรวจสอบแบบเรียลไทม์
- **Smooth error message transitions** / การเปลี่ยนผ่านข้อความแสดงข้อผิดพลาดที่นุ่มนวล
- **Success state animations** / แอนิเมชันสถานะสำเร็จ

## Theme Support / การสนับสนุนธีม

### Dark Mode / โหมดมืด

```css
/* Automatic dark mode support */
dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
dark:bg-gray-800/80
dark:text-white
dark:border-gray-700/50
```

### Color Palette / พาเลตสี

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `bg-gradient-to-br from-blue-50 via-white to-indigo-50` | `dark:from-gray-900 dark:via-gray-800 dark:to-gray-900` |
| Card | `bg-white/80` | `dark:bg-gray-800/80` |
| Text | `text-gray-900` | `dark:text-white` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Button | `bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600` | Same with dark mode adjustments |

## Performance Considerations / ข้อพิจารณาด้านประสิทธิภาพ

### Image Optimization / การปรับปรุงรูปภาพ

- **WebP format support** / การสนับสนุนรูปแบบ WebP
- **Lazy loading for modal content** / การโหลดช้าสำหรับเนื้อหาโมดัล
- **Optimized icon usage** / การใช้งานไอคอนที่ปรับปรุงแล้ว

### Code Splitting / การแยกโค้ด

- **Modal components lazy loaded** / คอมโพเนนต์โมดัลโหลดช้า
- **Inertia.js page-level splitting** / การแยกระดับหน้าของ Inertia.js

### Bundle Size Optimization / การปรับปรุงขนาด Bundle

- **Tree shaking for unused components** / การกำจัดคอมโพเนนต์ที่ไม่ใช้
- **Lucide React icon optimization** / การปรับปรุงไอคอน Lucide React