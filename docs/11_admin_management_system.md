# ระบบจัดการโครงสร้างองค์กร (Organizational Structure Management)

> **วันที่สร้าง**: 2026-02-23
> **สถานะ**: Implemented

---

## ภาพรวม

ระบบ CRUD สำหรับจัดการโครงสร้างองค์กร 4 entities:

```
Division (สายงาน)
├── Department (หน่วยงาน)
│   └── Position (ตำแหน่ง)
└── ...

Faction (ฝ่าย) — อิสระจาก Division hierarchy
```

---

## Architecture

### Controllers (4 ไฟล์ใหม่)

| Controller | Model | Entity |
|---|---|---|
| `AdminDivisionController` | `Divisions` | สายงาน |
| `AdminDepartmentController` | `Departments` | หน่วยงาน |
| `AdminPositionController` | `Position` | ตำแหน่ง |
| `AdminFactionController` | `Factions` | ฝ่าย |

ทุก Controller มี 6 methods: `index`, `create`, `store`, `edit`, `update`, `destroy`

### React Pages (8 ไฟล์ใหม่)

| Page | ประเภท | คำอธิบาย |
|---|---|---|
| `AdminDivisionIndex.tsx` | Index | ตารางสายงาน + search + pagination |
| `AdminDivisionForm.tsx` | Form | สร้าง/แก้ไขสายงาน |
| `AdminDepartmentIndex.tsx` | Index | ตารางหน่วยงาน + filter by division |
| `AdminDepartmentForm.tsx` | Form | สร้าง/แก้ไขหน่วยงาน + เลือก division |
| `AdminPositionIndex.tsx` | Index | ตารางตำแหน่ง + filter by department |
| `AdminPositionForm.tsx` | Form | สร้าง/แก้ไขตำแหน่ง + เลือก department (grouped by division) |
| `AdminFactionIndex.tsx` | Index | ตารางฝ่าย + search |
| `AdminFactionForm.tsx` | Form | สร้าง/แก้ไขฝ่าย |

---

## Routes (24 routes ใหม่)

### Division Management (`admin.divisions.*`)

| Method | URL | Name | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/divisions` | `admin.divisions.index` | รายการสายงาน |
| GET | `/admin/divisions/create` | `admin.divisions.create` | ฟอร์มสร้าง |
| POST | `/admin/divisions` | `admin.divisions.store` | บันทึกใหม่ |
| GET | `/admin/divisions/{division}/edit` | `admin.divisions.edit` | ฟอร์มแก้ไข |
| PUT | `/admin/divisions/{division}` | `admin.divisions.update` | บันทึกแก้ไข |
| DELETE | `/admin/divisions/{division}` | `admin.divisions.destroy` | ลบ |

### Department Management (`admin.departments.*`)

| Method | URL | Name | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/departments` | `admin.departments.index` | รายการหน่วยงาน |
| GET | `/admin/departments/create` | `admin.departments.create` | ฟอร์มสร้าง |
| POST | `/admin/departments` | `admin.departments.store` | บันทึกใหม่ |
| GET | `/admin/departments/{department}/edit` | `admin.departments.edit` | ฟอร์มแก้ไข |
| PUT | `/admin/departments/{department}` | `admin.departments.update` | บันทึกแก้ไข |
| DELETE | `/admin/departments/{department}` | `admin.departments.destroy` | ลบ |

### Position Management (`admin.positions.*`)

| Method | URL | Name | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/positions` | `admin.positions.index` | รายการตำแหน่ง |
| GET | `/admin/positions/create` | `admin.positions.create` | ฟอร์มสร้าง |
| POST | `/admin/positions` | `admin.positions.store` | บันทึกใหม่ |
| GET | `/admin/positions/{position}/edit` | `admin.positions.edit` | ฟอร์มแก้ไข |
| PUT | `/admin/positions/{position}` | `admin.positions.update` | บันทึกแก้ไข |
| DELETE | `/admin/positions/{position}` | `admin.positions.destroy` | ลบ |

### Faction Management (`admin.factions.*`)

| Method | URL | Name | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/factions` | `admin.factions.index` | รายการฝ่าย |
| GET | `/admin/factions/create` | `admin.factions.create` | ฟอร์มสร้าง |
| POST | `/admin/factions` | `admin.factions.store` | บันทึกใหม่ |
| GET | `/admin/factions/{faction}/edit` | `admin.factions.edit` | ฟอร์มแก้ไข |
| PUT | `/admin/factions/{faction}` | `admin.factions.update` | บันทึกแก้ไข |
| DELETE | `/admin/factions/{faction}` | `admin.factions.destroy` | ลบ |

### Helper Routes (เปลี่ยนชื่อจากเดิม)

| เดิม | ใหม่ | ใช้ใน |
|---|---|---|
| `admin.departments.store` | `admin.departments.quick-store` | AdminUserForm.tsx (inline create) |
| `admin.factions.store` | `admin.factions.quick-store` | AdminUserForm.tsx (inline create) |
| `admin.positions.store` | `admin.positions.quick-store` | AdminUserForm.tsx (inline create) |

---

## Data Integrity Rules

| Entity | เงื่อนไขการลบ |
|---|---|
| Division | ลบได้เฉพาะเมื่อไม่มี users อ้างอิง |
| Department | ลบได้เฉพาะเมื่อไม่มี users อ้างอิง |
| Position | ลบได้เฉพาะเมื่อไม่มี users อ้างอิง |
| Faction | ลบได้เฉพาะเมื่อไม่มี users อ้างอิง |

---

## Model Relationships

```
Divisions
├── hasMany → Departments (via division_id)
├── hasMany → Users (via division_id)

Departments
├── belongsTo → Divisions
├── hasMany → Positions (via department_id)
├── hasMany → Users (via department_id)

Position
├── belongsTo → Departments
├── hasMany → Users (via position_id)

Factions
├── hasMany → Users (via faction_id)
```

---

## Dashboard Integration

Admin Dashboard (`/dashboardadmin`) มี section "การจัดการโครงสร้างองค์กร" แสดง 4 cards:

| Card | Icon | Route |
|---|---|---|
| จัดการสายงาน (Division) | Building2 | `admin.divisions.index` |
| จัดการหน่วยงาน (Department) | Briefcase | `admin.departments.index` |
| จัดการตำแหน่ง (Position) | UserCog | `admin.positions.index` |
| จัดการฝ่าย (Faction) | Shield | `admin.factions.index` |
