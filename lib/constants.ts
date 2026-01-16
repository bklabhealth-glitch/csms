// Enums และค่าคงที่ที่ใช้ในระบบ

export const ITEM_CATEGORIES = [
  { value: "EQUIPMENT", label: "อุปกรณ์" },
  { value: "TOOL", label: "เครื่องมือ" },
  { value: "CHEMICAL", label: "น้ำยา" },
  { value: "TEST_KIT", label: "ชุดตรวจ" },
] as const;

export const USER_ROLES = [
  { value: "ADMIN", label: "ผู้ดูแลระบบ" },
  { value: "STOCK_OFFICER", label: "เจ้าหน้าที่คลัง" },
] as const;

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ใช้งาน" },
  { value: "INACTIVE", label: "ไม่ใช้งาน" },
] as const;

export const TRANSACTION_STATUS = [
  { value: "DRAFT", label: "แบบร่าง" },
  { value: "CONFIRMED", label: "ยืนยันแล้ว" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
] as const;

export const BALANCE_STATUS = [
  { value: "NORMAL", label: "ปกติ", color: "green" },
  { value: "LOW_STOCK", label: "ใกล้หมด", color: "yellow" },
  { value: "NEAR_EXPIRY", label: "ใกล้หมดอายุ", color: "orange" },
  { value: "EXPIRED", label: "หมดอายุ", color: "red" },
] as const;

// หน่วยนับที่ใช้บ่อย
export const COMMON_UNITS = [
  "ชิ้น",
  "กล่อง",
  "หลอด",
  "ขวด",
  "แผ่น",
  "ชุด",
  "test",
  "vial",
  "ml",
  "L",
] as const;

// Alias for UNITS (for backward compatibility)
export const UNITS = [
  { value: "ชิ้น", label: "ชิ้น" },
  { value: "กล่อง", label: "กล่อง" },
  { value: "หลอด", label: "หลอด" },
  { value: "ขวด", label: "ขวด" },
  { value: "แผ่น", label: "แผ่น" },
  { value: "ชุด", label: "ชุด" },
  { value: "test", label: "test" },
  { value: "vial", label: "vial" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
] as const;

// จำนวนวันก่อนหมดอายุที่แนะนำ
export const DEFAULT_EXPIRY_ALERTS = [
  { value: 30, label: "30 วัน" },
  { value: 60, label: "60 วัน" },
  { value: 90, label: "90 วัน" },
  { value: 180, label: "180 วัน" },
] as const;

// วัตถุประสงค์ในการเบิกที่ใช้บ่อย
export const COMMON_PURPOSES = [
  "เจาะเลือด",
  "Lab",
  "OPD",
  "IPD",
  "Emergency",
  "Surgery",
  "ใช้ทั่วไป",
] as const;

// แผนกต่างๆ
export const DEPARTMENTS = [
  "ห้องตรวจ",
  "ห้องทำแผล",
  "ห้อง Lab",
  "ห้องพักผู้ป่วย",
  "ห้องฉุกเฉิน",
  "ห้องผ่าตัด",
] as const;
