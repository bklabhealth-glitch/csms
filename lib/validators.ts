import { z } from "zod";

// User Validators
export const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export const userSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  role: z.enum(["ADMIN", "STOCK_OFFICER"]),
});

// Item Master Validators
export const itemSchema = z.object({
  itemName: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  category: z.enum(["EQUIPMENT", "TOOL", "CHEMICAL", "TEST_KIT"]),
  unit: z.string().min(1, "กรุณากรอกหน่วยนับ"),
  minimumStock: z.number().min(0, "จำนวนขั้นต่ำต้องมากกว่าหรือเท่ากับ 0"),
  defaultExpAlert: z.number().min(0, "จำนวนวันเตือนต้องมากกว่าหรือเท่ากับ 0"),
  storageLocation: z.string().optional(),
  responsiblePerson: z.string().optional(),
  remark: z.string().optional(),
});

// Supplier Validators
export const supplierSchema = z.object({
  companyName: z.string().min(1, "กรุณากรอกชื่อบริษัท"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง").optional().or(z.literal("")),
  address: z.string().optional(),
  taxId: z.string().optional(),
  remark: z.string().optional(),
});

// Stock In Validators
export const stockInSchema = z.object({
  itemId: z.string().min(1, "กรุณาเลือกสินค้า"),
  lotNo: z.string().min(1, "กรุณากรอกเลข Lot"),
  expiryDate: z.date({
    required_error: "กรุณาเลือกวันหมดอายุ",
  }).refine((date) => date > new Date(), {
    message: "วันหมดอายุต้องเป็นวันในอนาคต",
  }),
  quantityIn: z.number().min(0.01, "จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().min(0, "ราคาต้องมากกว่าหรือเท่ากับ 0").optional(),
  supplierId: z.string().min(1, "กรุณาเลือกซัพพลายเออร์"),
  invoiceNo: z.string().optional(),
  importDate: z.date({
    required_error: "กรุณาเลือกวันที่นำเข้า",
  }),
  importBy: z.string().optional(),
  storageLocation: z.string().default(""),
  remarkIn: z.string().optional(),
});

// Stock Out Validators
export const stockOutSchema = z.object({
  itemId: z.string().min(1, "กรุณาเลือกสินค้า"),
  lotNo: z.string().optional(), // Changed to optional (will be validated in API)
  quantityOut: z.number().min(0.01, "จำนวนต้องมากกว่า 0"),
  purpose: z.string().min(1, "กรุณากรอกวัตถุประสงค์"),
  requestDept: z.string().optional(),
  requestBy: z.string().optional(),
  outDate: z.date({
    required_error: "กรุณาเลือกวันที่เบิก",
  }),
  remarkOut: z.string().optional(),
});

// Type inference
export type LoginInput = z.infer<typeof loginSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
