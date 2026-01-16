# CSMS - Clinic Stock Management System

ระบบจัดการสต๊อกสำหรับคลินิก พัฒนาด้วย Next.js 14, TypeScript, Prisma และ PostgreSQL

## 🎯 สิ่งที่ทำเสร็จแล้ว (Phase 1 - ส่วนพื้นฐาน)

### ✅ Database & Backend
- [x] Prisma schema สมบูรณ์ 7 ตาราง (User, ItemMaster, Supplier, StockIn, StockOut, StockBalance, AuditLog)
- [x] Database migration พร้อมใช้งาน
- [x] Seed data (2 users, 2 suppliers, 7 items พร้อม stock balance)
- [x] Utility libraries:
  - Code generator (auto-generate ITM-00001, SUP-00001, IN-20260107-0001, OUT-20260107-0001)
  - Balance calculator (คำนวณและอัพเดท stock balance)
  - FEFO lot selector (First Expired, First Out)
  - Validators (Zod schemas)
  - Audit logger
- [x] NextAuth.js authentication system
- [x] API routes สำหรับ Items (GET, POST, PUT, DELETE)

### 📁 โครงสร้างโปรเจ็กต์

```
csms/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth endpoints
│   │   └── items/                       # Items API routes
│   ├── globals.css                      # Global styles
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Home page
├── lib/
│   ├── prisma.ts                        # Prisma client
│   ├── auth.ts                          # NextAuth config
│   ├── utils.ts                         # Utility functions
│   ├── constants.ts                     # Constants & enums (ภาษาไทย)
│   ├── code-generator.ts                # Auto code generation
│   ├── balance-calculator.ts            # Stock balance logic
│   ├── validators.ts                    # Zod schemas
│   └── audit-logger.ts                  # Audit trail
├── prisma/
│   ├── schema.prisma                    # Database schema
│   ├── seed.ts                          # Seed data script
│   └── migrations/                      # Database migrations
├── types/
│   └── next-auth.d.ts                   # NextAuth types
├── components/                          # (รอสร้าง)
├── middleware.ts                        # Route protection
├── .env                                 # Environment variables
└── package.json
```

## 🚀 การติดตั้งและเริ่มใช้งาน

### 1. ติดตั้ง Dependencies
```bash
cd csms
npm install
```

### 2. ตั้งค่า Database

#### Option A: ใช้ Prisma Postgres Local (แนะนำสำหรับ development)
```bash
# เริ่ม Prisma Postgres server (เปิด terminal แยก)
npx prisma dev

# Terminal ใหม่: Generate Prisma Client
npx prisma generate

# สร้าง migration
npx prisma migrate dev --name init

# สร้างข้อมูลทดสอบ
npm run db:seed
```

#### Option B: ใช้ PostgreSQL ปกติ
1. ติดตั้ง PostgreSQL บนเครื่อง
2. สร้าง database `csms`
3. แก้ไข `.env`:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/csms?schema=public"
   ```
4. รัน commands เดียวกับ Option A

### 3. เริ่มต้น Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ http://localhost:3000

### 4. ข้อมูล Login ทดสอบ
- **Admin**: `admin@clinic.com` / `admin123`
- **Officer**: `officer@clinic.com` / `officer123`

## 📊 ข้อมูลทดสอบที่มี

- **Users**: 2 (Admin, Stock Officer)
- **Suppliers**: 2 (เมดิคอล ซัพพลาย, ไบโอเทค แล็บ)
- **Items**: 7 รายการ
  - เข็มฉีดยา (EQUIPMENT) - มี stock 450 ชิ้น, ใกล้หมดอายุ
  - ถุงมือแพทย์ (EQUIPMENT) - มี stock 180 กล่อง, ปกติ
  - กรรไกรตัดแผล (TOOL) - มี stock 5 ชิ้น, ใกล้หมด (< minimum)
  - แอลกอฮอล์ 70% (CHEMICAL) - มี stock 90 ขวด, ปกติ
  - Povidone-Iodine (CHEMICAL) - ยังไม่มี stock
  - ชุดตรวจ COVID-19 (TEST_KIT) - มี stock 150 test, ใกล้หมดอายุ
  - ชุดตรวจน้ำตาล (TEST_KIT) - มี stock 300 test, ปกติ

## 📋 สิ่งที่ต้องทำต่อ (ตามลำดับความสำคัญ)

### ขั้นตอนที่ 1: สร้าง API Routes เพิ่มเติม (รอทำ)

สร้างไฟล์ API routes ตามโครงสร้างนี้:

```
app/api/
├── suppliers/
│   ├── route.ts                         # GET, POST
│   └── [id]/route.ts                    # GET, PUT, DELETE
├── stock-in/
│   ├── route.ts                         # GET, POST
│   ├── [id]/route.ts                    # GET, PUT
│   └── [id]/confirm/route.ts            # POST (confirm transaction)
├── stock-out/
│   ├── route.ts                         # GET, POST
│   ├── [id]/route.ts                    # GET, PUT
│   ├── [id]/approve/route.ts            # POST (approve transaction)
│   └── lots/route.ts                    # GET (get available lots by itemId - FEFO)
├── stock-balance/
│   ├── route.ts                         # GET
│   └── recalculate/route.ts             # POST (manual recalculation)
├── dashboard/
│   ├── stats/route.ts                   # GET (KPIs)
│   └── recent-transactions/route.ts     # GET
└── reports/
    ├── balance/route.ts                 # GET (stock balance report)
    ├── movements/route.ts               # GET (stock movement report)
    └── low-stock/route.ts               # GET (low stock report)
```

**ตัวอย่างการสร้าง**: คัดลอกโครงสร้างจาก `app/api/items/route.ts` และปรับแต่งตามตาราง

### ขั้นตอนที่ 2: สร้าง UI Components (รอทำ)

#### 2.1 ติดตั้ง shadcn/ui components
```bash
npx shadcn-ui@latest add button input label select table card form dialog tabs badge calendar popover command alert separator skeleton dropdown-menu toast
```

#### 2.2 สร้าง Custom Components
สร้างไฟล์ในโฟลเดอร์ `components/`:

```
components/
├── ui/                                  # shadcn/ui components (auto-generated)
├── layout/
│   ├── sidebar.tsx                      # Sidebar navigation
│   ├── header.tsx                       # Header with user info
│   └── breadcrumb.tsx                   # Breadcrumb navigation
├── forms/
│   ├── item-form.tsx                    # Item master form
│   ├── supplier-form.tsx                # Supplier form
│   ├── stock-in-form.tsx                # Stock in form
│   └── stock-out-form.tsx               # Stock out with lot selector
├── dashboard/
│   ├── kpi-card.tsx                     # KPI display card
│   ├── recent-transactions.tsx          # Transaction list
│   └── low-stock-alert.tsx              # Alert widget
├── data-table.tsx                       # Generic table with sorting/pagination
├── lot-selector.tsx                     # FEFO lot selector
├── status-badge.tsx                     # Color-coded status indicator
└── export-button.tsx                    # Export to CSV/Excel/PDF
```

### ขั้นตอนที่ 3: สร้าง Frontend Pages (รอทำ)

สร้างหน้าต่างๆ ในโฟลเดอร์ `app/`:

```
app/
├── login/
│   └── page.tsx                         # Login page
├── (dashboard)/
│   ├── layout.tsx                       # Dashboard layout with sidebar
│   ├── page.tsx                         # Dashboard main page
│   ├── items/
│   │   ├── page.tsx                     # Items list
│   │   ├── new/page.tsx                 # Create item
│   │   └── [id]/edit/page.tsx           # Edit item
│   ├── suppliers/
│   │   ├── page.tsx                     # Suppliers list
│   │   ├── new/page.tsx                 # Create supplier
│   │   └── [id]/edit/page.tsx           # Edit supplier
│   ├── stock-in/
│   │   ├── page.tsx                     # Stock in list
│   │   ├── new/page.tsx                 # Create stock in
│   │   └── [id]/page.tsx                # View stock in details
│   ├── stock-out/
│   │   ├── page.tsx                     # Stock out list
│   │   ├── new/page.tsx                 # Create stock out
│   │   └── [id]/page.tsx                # View stock out details
│   ├── stock-balance/
│   │   └── page.tsx                     # Current inventory view
│   └── reports/
│       ├── balance/page.tsx             # Stock balance report
│       ├── movements/page.tsx           # Movement report
│       └── low-stock/page.tsx           # Low stock report
```

### ขั้นตอนที่ 4: ทดสอบและแก้ไข Bugs

1. ทดสอบ Authentication flow
2. ทดสอบการสร้าง/แก้ไข/ลบ Items และ Suppliers
3. ทดสอบ Stock In → Balance update
4. ทดสอบ Stock Out → Balance update → FEFO logic
5. ทดสอบ Reports และ Export
6. ทดสอบ Audit trail

## 🧪 Commands ที่มีประโยชน์

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npm run db:push                # Push schema changes (without migration)
npm run db:seed                # Run seed script
npm run db:studio              # Open Prisma Studio (database GUI)
npx prisma migrate dev         # Create and apply migration
npx prisma generate            # Generate Prisma Client

# Prisma Dev Server
npx prisma dev                 # Start Prisma Postgres local server
```

## 🔑 Key Features Implemented

### 1. Auto Code Generation
- รหัสสินค้า: `ITM-00001`, `ITM-00002`, ...
- รหัสซัพพลายเออร์: `SUP-00001`, `SUP-00002`, ...
- เลขที่ Stock In: `IN-20260107-0001` (รูปแบบ IN-YYYYMMDD-XXXX)
- เลขที่ Stock Out: `OUT-20260107-0001`

### 2. Stock Balance Calculation
- อัพเดทอัตโนมัติเมื่อมีการ Stock In (confirmed)
- อัพเดทอัตโนมัติเมื่อมีการ Stock Out (approved)
- คำนวณสถานะ: NORMAL, LOW_STOCK, NEAR_EXPIRY, EXPIRED
- Function `recalculateAllBalances()` สำหรับคำนวณใหม่ทั้งหมด

### 3. FEFO Lot Selection
- Function `getAvailableLots(itemId)` จัดเรียง lots ตามวันหมดอายุใกล้สุดก่อน
- ป้องกันการเบิกสินค้าที่หมดอายุ
- แสดงจำนวนวันคงเหลือก่อนหมดอายุ

### 4. Audit Trail
- บันทึกทุกการสร้าง/แก้ไข/ลบ
- เก็บ old value และ new value (JSON)
- บันทึกผู้ทำรายการและเวลา
- Function `getAuditLogs(tableName, recordId)` ดึงประวัติ

### 5. Role-Based Access Control
- ADMIN: Full access
- STOCK_OFFICER: Record stock in/out, view reports
- Middleware ป้องกันเข้าหน้าโดยไม่ login

## 📝 API Routes ที่พร้อมใช้งาน

### Items API
- `GET /api/items` - ดึงรายการสินค้า (รองรับ pagination, search, filter)
- `POST /api/items` - สร้างสินค้าใหม่
- `GET /api/items/[id]` - ดึงข้อมูลสินค้า 1 รายการ
- `PUT /api/items/[id]` - แก้ไขข้อมูลสินค้า
- `DELETE /api/items/[id]` - ลบสินค้า (soft delete)

**ตัวอย่างการใช้งาน**:
```javascript
// GET /api/items?page=1&limit=10&search=เข็ม&category=EQUIPMENT
// POST /api/items
{
  "itemName": "เข็มฉีดยา 5 ml",
  "category": "EQUIPMENT",
  "unit": "ชิ้น",
  "minimumStock": 100,
  "defaultExpAlert": 180,
  "storageLocation": "ตู้เก็บอุปกรณ์ A"
}
```

## 🎨 UI/UX Guidelines

### Color Scheme (Stock Status)
- 🟢 **Green (NORMAL)**: สต๊อกปกติ
- 🟡 **Yellow (LOW_STOCK)**: ใกล้หมด (≤ minimum stock)
- 🟠 **Orange (NEAR_EXPIRY)**: ใกล้หมดอายุ (≤ default exp alert)
- 🔴 **Red (EXPIRED)**: หมดอายุแล้ว

### Navigation Structure
```
Dashboard (/)
├── Items (สินค้า)
├── Suppliers (ซัพพลายเออร์)
├── Stock In (รับเข้า)
├── Stock Out (เบิกออก)
├── Stock Balance (คงเหลือ)
└── Reports (รายงาน)
    ├── Stock Balance Report
    ├── Movement Report
    └── Low Stock Report
```

## 🐛 Known Issues & TODOs

- [ ] ยังไม่มี UI pages (รอสร้าง)
- [ ] API routes บางส่วนยังไม่ได้สร้าง (Suppliers, Stock In/Out, Dashboard, Reports)
- [ ] ยังไม่มี Export to Excel/PDF functionality
- [ ] ยังไม่มี Email notifications สำหรับ alerts
- [ ] ยังไม่มี Barcode/QR scanning (future enhancement)

## 📚 เอกสารเพิ่มเติม

- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Zod Docs](https://zod.dev/)

## 📄 License

MIT

---

**หมายเหตุ**: โปรเจ็กต์นี้อยู่ระหว่างการพัฒนา (Phase 1 - MVP) มีการทำเสร็จประมาณ 40% ของ feature ทั้งหมดตาม PRD
