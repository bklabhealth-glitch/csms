import { prisma } from "./prisma";
import { format } from "date-fns";

/**
 * สร้างรหัสสินค้าอัตโนมัติ: ITM-00001, ITM-00002, ...
 */
export async function generateItemCode(): Promise<string> {
  const lastItem = await prisma.itemMaster.findFirst({
    orderBy: { itemCode: "desc" },
    select: { itemCode: true },
  });

  if (!lastItem) {
    return "ITM-00001";
  }

  // Extract number from ITM-00001
  const lastNumber = parseInt(lastItem.itemCode.split("-")[1]);
  const nextNumber = lastNumber + 1;

  return `ITM-${nextNumber.toString().padStart(5, "0")}`;
}

/**
 * สร้างรหัสซัพพลายเออร์อัตโนมัติ: SUP-00001, SUP-00002, ...
 */
export async function generateSupplierCode(): Promise<string> {
  const lastSupplier = await prisma.supplier.findFirst({
    orderBy: { supplierCode: "desc" },
    select: { supplierCode: true },
  });

  if (!lastSupplier) {
    return "SUP-00001";
  }

  const lastNumber = parseInt(lastSupplier.supplierCode.split("-")[1]);
  const nextNumber = lastNumber + 1;

  return `SUP-${nextNumber.toString().padStart(5, "0")}`;
}

/**
 * สร้างเลขที่รับเข้า Stock อัตโนมัติ: IN-20260107-0001
 * Format: IN-YYYYMMDD-XXXX
 */
export async function generateStockInNo(date: Date = new Date()): Promise<string> {
  const dateStr = format(date, "yyyyMMdd");
  const prefix = `IN-${dateStr}`;

  const lastStockIn = await prisma.stockIn.findFirst({
    where: {
      stockInNo: {
        startsWith: prefix,
      },
    },
    orderBy: { stockInNo: "desc" },
    select: { stockInNo: true },
  });

  if (!lastStockIn) {
    return `${prefix}-0001`;
  }

  // Extract sequence number from IN-20260107-0001
  const lastNumber = parseInt(lastStockIn.stockInNo.split("-")[2]);
  const nextNumber = lastNumber + 1;

  return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * สร้างเลขที่เบิกออก Stock อัตโนมัติ: OUT-20260107-0001
 * Format: OUT-YYYYMMDD-XXXX
 */
export async function generateStockOutNo(date: Date = new Date()): Promise<string> {
  const dateStr = format(date, "yyyyMMdd");
  const prefix = `OUT-${dateStr}`;

  const lastStockOut = await prisma.stockOut.findFirst({
    where: {
      stockOutNo: {
        startsWith: prefix,
      },
    },
    orderBy: { stockOutNo: "desc" },
    select: { stockOutNo: true },
  });

  if (!lastStockOut) {
    return `${prefix}-0001`;
  }

  const lastNumber = parseInt(lastStockOut.stockOutNo.split("-")[2]);
  const nextNumber = lastNumber + 1;

  return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
}
