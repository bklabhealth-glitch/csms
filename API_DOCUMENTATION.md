# CSMS API Documentation

เอกสารสำหรับ API Routes ทั้งหมด

## Authentication

ทุก API ต้อง authenticate ด้วย NextAuth session ยกเว้น `/api/auth/*`

### Login
```
POST /api/auth/callback/credentials
Content-Type: application/json

{
  "email": "admin@clinic.com",
  "password": "admin123"
}
```

---

## Items API

### GET /api/items
ดึงรายการสินค้าทั้งหมด

**Query Parameters:**
- `page` (number) - หน้าที่ต้องการ (default: 1)
- `limit` (number) - จำนวนรายการต่อหน้า (default: 10)
- `search` (string) - ค้นหาตาม itemCode หรือ itemName
- `category` (string) - กรองตามประเภท: EQUIPMENT, TOOL, CHEMICAL, TEST_KIT
- `status` (string) - กรองตามสถานะ: ACTIVE, INACTIVE

**Response:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### POST /api/items
สร้างสินค้าใหม่

**Body:**
```json
{
  "itemName": "เข็มฉีดยา 5 ml",
  "category": "EQUIPMENT",
  "unit": "ชิ้น",
  "minimumStock": 100,
  "defaultExpAlert": 180,
  "storageLocation": "ตู้เก็บอุปกรณ์ A",
  "responsiblePerson": "คุณสมศรี",
  "remark": "หมายเหตุ"
}
```

### GET /api/items/[id]
ดึงข้อมูลสินค้า 1 รายการ

### PUT /api/items/[id]
แก้ไขข้อมูลสินค้า (Body เหมือน POST)

### DELETE /api/items/[id]
ลบสินค้า (Soft delete - เปลี่ยนสถานะเป็น INACTIVE)

---

## Suppliers API

### GET /api/suppliers
ดึงรายการซัพพลายเออร์ทั้งหมด

**Query Parameters:**
- `page`, `limit`, `search`, `status` (เหมือน Items API)

### POST /api/suppliers
สร้างซัพพลายเออร์ใหม่

**Body:**
```json
{
  "companyName": "บริษัท เมดิคอล ซัพพลาย จำกัด",
  "contactPerson": "คุณสมชาย",
  "phone": "02-123-4567",
  "email": "contact@medical-supply.com",
  "address": "123 ถนนพระราม 9 กรุงเทพฯ",
  "taxId": "0123456789012",
  "remark": "หมายเหตุ"
}
```

### GET /api/suppliers/[id]
ดึงข้อมูลซัพพลายเออร์ 1 รายการ

### PUT /api/suppliers/[id]
แก้ไขข้อมูลซัพพลายเออร์

### DELETE /api/suppliers/[id]
ลบซัพพลายเออร์ (Soft delete)

---

## Stock In API

### GET /api/stock-in
ดึงรายการ Stock In ทั้งหมด

**Query Parameters:**
- `page`, `limit` - Pagination
- `itemId` - กรองตามสินค้า
- `supplierId` - กรองตามซัพพลายเออร์
- `status` - กรองตามสถานะ: DRAFT, CONFIRMED, CANCELLED
- `dateFrom`, `dateTo` - กรองตามช่วงวันที่

### POST /api/stock-in
สร้าง Stock In ใหม่ (สถานะ DRAFT)

**Body:**
```json
{
  "itemId": "clxxxxx",
  "lotNo": "LOT2024-001",
  "expiryDate": "2025-12-31T00:00:00Z",
  "quantityIn": 500,
  "unitPrice": 5.0,
  "supplierId": "clxxxxx",
  "invoiceNo": "INV-2024-001",
  "importDate": "2026-01-07T00:00:00Z",
  "importBy": "คุณสมศรี",
  "storageLocation": "ตู้เก็บอุปกรณ์ A",
  "remarkIn": "หมายเหตุ"
}
```

### GET /api/stock-in/[id]
ดึงข้อมูล Stock In 1 รายการ

### PUT /api/stock-in/[id]
แก้ไข Stock In (เฉพาะ DRAFT)

### DELETE /api/stock-in/[id]
ยกเลิก Stock In

### POST /api/stock-in/[id]/confirm
**ยืนยัน Stock In และอัพเดท Stock Balance**

สำคัญมาก! เมื่อยืนยันแล้ว:
- สถานะเปลี่ยนเป็น CONFIRMED
- อัพเดท Stock Balance อัตโนมัติ
- ไม่สามารถแก้ไขได้อีก

---

## Stock Out API

### GET /api/stock-out
ดึงรายการ Stock Out ทั้งหมด

**Query Parameters:**
- `page`, `limit` - Pagination
- `itemId` - กรองตามสินค้า
- `requestDept` - กรองตามแผนก
- `status` - กรองตามสถานะ: DRAFT, APPROVED, CANCELLED
- `dateFrom`, `dateTo` - กรองตามช่วงวันที่

### POST /api/stock-out
สร้าง Stock Out ใหม่ (สถานะ DRAFT)

**Body:**
```json
{
  "itemId": "clxxxxx",
  "lotNo": "LOT2024-001",
  "quantityOut": 50,
  "purpose": "ห้องตรวจ",
  "requestDept": "ห้องตรวจ OPD",
  "requestBy": "พยาบาลสมใจ",
  "outDate": "2026-01-07T00:00:00Z",
  "remarkOut": "หมายเหตุ"
}
```

### GET /api/stock-out/[id]
ดึงข้อมูล Stock Out 1 รายการ

### PUT /api/stock-out/[id]
แก้ไข Stock Out (เฉพาะ DRAFT)

### DELETE /api/stock-out/[id]
ยกเลิก Stock Out (เฉพาะ DRAFT)

### POST /api/stock-out/[id]/approve
**อนุมัติ Stock Out และอัพเดท Stock Balance**

สำคัญมาก! เมื่ออนุมัติแล้ว:
- สถานะเปลี่ยนเป็น APPROVED
- หัก Stock Balance อัตโนมัติ
- ไม่สามารถแก้ไขหรือยกเลิกได้อีก

### GET /api/stock-out/lots?itemId=xxx
**ดึงรายการ Lots ที่พร้อมเบิก (FEFO - First Expired, First Out)**

เรียงตามวันหมดอายุใกล้สุดก่อน

**Response:**
```json
{
  "itemId": "clxxxxx",
  "lots": [
    {
      "id": "clxxxxx",
      "lotNo": "LOT2024-001",
      "expiryDate": "2025-12-31T00:00:00Z",
      "location": "ตู้เก็บอุปกรณ์ A",
      "quantityBalance": 450,
      "unitPrice": 5.0,
      "status": "NEAR_EXPIRY",
      "daysToExpiry": 358,
      "item": {
        "itemCode": "ITM-00001",
        "itemName": "เข็มฉีดยา 3 ml",
        "unit": "ชิ้น"
      }
    }
  ],
  "total": 1
}
```

---

## Stock Balance API

### GET /api/stock-balance
ดึงรายการ Stock Balance (คงเหลือ)

**Query Parameters:**
- `page`, `limit` - Pagination (default limit: 50)
- `search` - ค้นหาตาม itemName หรือ lotNo
- `category` - กรองตามประเภท
- `status` - กรองตามสถานะ: NORMAL, LOW_STOCK, NEAR_EXPIRY, EXPIRED
- `location` - กรองตามสถานที่เก็บ

**Response:**
```json
{
  "balances": [...],
  "pagination": {...},
  "summary": {
    "byStatus": [...],
    "totalValue": 123456.78
  }
}
```

### POST /api/stock-balance/recalculate
**คำนวณ Stock Balance ใหม่ทั้งหมด (เฉพาะ ADMIN)**

ใช้เมื่อต้องการคำนวณยอดคงเหลือใหม่จาก Stock In/Out ทั้งหมด

---

## Dashboard API

### GET /api/dashboard/stats
ดึงสถิติสำหรับ Dashboard

**Response:**
```json
{
  "summary": {
    "totalInventoryValue": 123456.78,
    "totalItems": 50,
    "totalSuppliers": 10,
    "lowStockCount": 5,
    "nearExpiryCount": 3,
    "expiredCount": 1,
    "alertsCount": 9
  },
  "recentActivity": {
    "stockInsLast30Days": 25,
    "stockOutsLast30Days": 18
  },
  "topItems": {
    "byValue": [...],
    "byIssue": [...]
  }
}
```

### GET /api/dashboard/recent-transactions
ดึงรายการ transactions ล่าสุด

**Query Parameters:**
- `limit` (number) - จำนวนรายการ (default: 10)

**Response:**
```json
{
  "transactions": [
    {
      "type": "STOCK_IN",
      "id": "clxxxxx",
      "transactionNo": "IN-20260107-0001",
      "item": {...},
      "quantity": 500,
      "lotNo": "LOT2024-001",
      "date": "2026-01-07T00:00:00Z",
      "performedBy": "เจ้าหน้าที่คลัง",
      "status": "CONFIRMED"
    },
    {
      "type": "STOCK_OUT",
      ...
    }
  ],
  "total": 20
}
```

---

## Reports API

### GET /api/reports/balance
**รายงาน Stock Balance (คงเหลือ)**

**Query Parameters:**
- `category` - กรองตามประเภท
- `location` - กรองตามสถานที่
- `status` - กรองตามสถานะ
- `export` - รูปแบบการ export: csv, xlsx, pdf (TODO: Phase 2)

**Response:**
```json
{
  "generatedAt": "2026-01-07T08:00:00Z",
  "generatedBy": "ผู้ดูแลระบบ",
  "filters": {...},
  "summary": {
    "totalItems": 50,
    "totalValue": 123456.78,
    "totalQuantity": 5000
  },
  "breakdown": {
    "byCategory": {...},
    "byStatus": {...}
  },
  "items": [...]
}
```

### GET /api/reports/movements
**รายงานการเคลื่อนไหวสินค้า (Stock In/Out)**

**Query Parameters:**
- `dateFrom`, `dateTo` - ช่วงวันที่ (default: last 30 days)
- `itemId` - กรองตามสินค้า
- `type` - ประเภท: IN, OUT, หรือ ALL
- `export` - รูปแบบการ export (TODO: Phase 2)

**Response:**
```json
{
  "generatedAt": "2026-01-07T08:00:00Z",
  "generatedBy": "ผู้ดูแลระบบ",
  "filters": {...},
  "summary": {
    "totalTransactions": 100,
    "totalStockIn": 5000,
    "totalStockOut": 1500,
    "totalValueIn": 123456.78,
    "netMovement": 3500
  },
  "movements": [...]
}
```

### GET /api/reports/low-stock
**รายงานสินค้าใกล้หมด**

**Query Parameters:**
- `category` - กรองตามประเภท
- `export` - รูปแบบการ export (TODO: Phase 2)

**Response:**
```json
{
  "generatedAt": "2026-01-07T08:00:00Z",
  "generatedBy": "ผู้ดูแลระบบ",
  "filters": {...},
  "summary": {
    "totalLowStockItems": 5,
    "criticalCount": 1,
    "highCount": 2,
    "mediumCount": 2,
    "totalValueAtRisk": 12345.67
  },
  "items": [
    {
      "itemCode": "ITM-00003",
      "itemName": "กรรไกรตัดแผล",
      "category": "TOOL",
      "unit": "ชิ้น",
      "currentStock": 5,
      "minimumStock": 10,
      "shortage": 5,
      "percentageRemaining": 50,
      "totalValue": 0,
      "lotsCount": 1,
      "responsiblePerson": "คุณสมชาย",
      "storageLocation": "ตู้เก็บเครื่องมือ B",
      "suggestedOrderQuantity": 8,
      "severity": "MEDIUM"
    }
  ]
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Internal Server Error

---

## Error Response Format

```json
{
  "error": "ข้อความแสดงข้อผิดพลาด",
  "details": {} // optional: validation errors
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"admin123"}'
```

### Get Items
```bash
curl http://localhost:3000/api/items \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Create Stock In
```bash
curl -X POST http://localhost:3000/api/stock-in \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "itemId": "clxxxxx",
    "lotNo": "LOT2024-999",
    "expiryDate": "2025-12-31T00:00:00Z",
    "quantityIn": 100,
    "unitPrice": 10,
    "importDate": "2026-01-07T00:00:00Z",
    "importBy": "Test User",
    "storageLocation": "Test Location"
  }'
```

---

## Important Notes

1. **Authentication**: ทุก API ต้อง authenticate ด้วย NextAuth session
2. **Audit Trail**: ทุกการสร้าง/แก้ไข/ลบจะถูกบันทึกใน AuditLog อัตโนมัติ
3. **Auto-Generated Codes**: รหัสต่างๆ สร้างอัตโนมัติ ไม่ต้องส่งมา
4. **Stock Balance**: อัพเดทอัตโนมัติเมื่อ confirm Stock In หรือ approve Stock Out
5. **FEFO**: ระบบจัดเรียง lots ตามวันหมดอายุใกล้สุดก่อนโดยอัตโนมัติ
6. **Soft Delete**: การลบเป็น soft delete (เปลี่ยนสถานะเป็น INACTIVE/CANCELLED)
7. **Export**: ฟีเจอร์ export จะพัฒนาใน Phase 2
