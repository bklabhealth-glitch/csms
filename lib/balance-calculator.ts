import { prisma } from "./prisma";
import { BalanceStatus } from "@prisma/client";
import { differenceInDays } from "date-fns";

/**
 * คำนวณและอัพเดท Stock Balance เมื่อมีการรับเข้า (Stock In)
 */
export async function updateBalanceOnStockIn(stockInId: string) {
  const stockIn = await prisma.stockIn.findUnique({
    where: { id: stockInId },
    include: { item: true },
  });

  if (!stockIn || stockIn.status !== "CONFIRMED") {
    throw new Error("Stock In ไม่ถูกต้องหรือยังไม่ได้ยืนยัน");
  }

  // หา balance record ที่มีอยู่แล้วสำหรับ Item + Lot + Location นี้
  const existingBalance = await prisma.stockBalance.findFirst({
    where: {
      itemId: stockIn.itemId,
      lotNo: stockIn.lotNo,
      location: stockIn.storageLocation,
    },
  });

  const newQuantity = existingBalance
    ? existingBalance.quantityBalance + stockIn.quantityIn
    : stockIn.quantityIn;

  const newTotalValue = stockIn.unitPrice ? newQuantity * stockIn.unitPrice : null;

  // คำนวณสถานะ
  const status = calculateBalanceStatus(
    newQuantity,
    stockIn.item.minimumStock,
    stockIn.expiryDate,
    stockIn.item.defaultExpAlert
  );

  const daysToExpiry = differenceInDays(stockIn.expiryDate, new Date());

  if (existingBalance) {
    // อัพเดท balance ที่มีอยู่
    await prisma.stockBalance.update({
      where: { id: existingBalance.id },
      data: {
        quantityBalance: newQuantity,
        unitPrice: stockIn.unitPrice || existingBalance.unitPrice,
        totalValue: newTotalValue,
        lastInDate: stockIn.importDate,
        status,
        daysToExpiry,
      },
    });
  } else {
    // สร้าง balance record ใหม่
    await prisma.stockBalance.create({
      data: {
        itemId: stockIn.itemId,
        itemName: stockIn.item.itemName,
        lotNo: stockIn.lotNo,
        expiryDate: stockIn.expiryDate,
        location: stockIn.storageLocation,
        quantityBalance: newQuantity,
        unitPrice: stockIn.unitPrice,
        totalValue: newTotalValue,
        lastInDate: stockIn.importDate,
        status,
        daysToExpiry,
      },
    });
  }

  return true;
}

/**
 * คำนวณและอัพเดท Stock Balance เมื่อมีการเบิกออก (Stock Out)
 */
export async function updateBalanceOnStockOut(stockOutId: string) {
  const stockOut = await prisma.stockOut.findUnique({
    where: { id: stockOutId },
    include: { item: true },
  });

  if (!stockOut || stockOut.status !== "APPROVED") {
    throw new Error("Stock Out ไม่ถูกต้องหรือยังไม่ได้อนุมัติ");
  }

  // หา balance record
  // Note: ต้องหาจาก item + lot เพราะ stockOut ไม่มี location
  const balances = await prisma.stockBalance.findMany({
    where: {
      itemId: stockOut.itemId,
      lotNo: stockOut.lotNo,
      quantityBalance: { gt: 0 },
    },
  });

  if (balances.length === 0) {
    throw new Error("ไม่พบสต๊อกคงเหลือสำหรับ Lot นี้");
  }

  // ใช้ balance แรกที่พบ (ในกรณีที่มีหลาย location)
  const balance = balances[0];

  if (balance.quantityBalance < stockOut.quantityOut) {
    throw new Error(
      `สต๊อกไม่เพียงพอ (คงเหลือ ${balance.quantityBalance}, ต้องการ ${stockOut.quantityOut})`
    );
  }

  const newQuantity = balance.quantityBalance - stockOut.quantityOut;
  const newTotalValue = balance.unitPrice ? newQuantity * balance.unitPrice : null;

  // คำนวณสถานะใหม่
  const status = calculateBalanceStatus(
    newQuantity,
    stockOut.item.minimumStock,
    balance.expiryDate,
    stockOut.item.defaultExpAlert
  );

  const daysToExpiry = differenceInDays(balance.expiryDate, new Date());

  await prisma.stockBalance.update({
    where: { id: balance.id },
    data: {
      quantityBalance: newQuantity,
      totalValue: newTotalValue,
      lastOutDate: stockOut.outDate,
      status,
      daysToExpiry,
    },
  });

  return true;
}

/**
 * คำนวณสถานะของ Stock Balance
 */
export function calculateBalanceStatus(
  currentQuantity: number,
  minimumStock: number,
  expiryDate: Date,
  expAlertDays: number
): BalanceStatus {
  const now = new Date();
  const daysToExpiry = differenceInDays(expiryDate, now);

  // เช็คหมดอายุก่อน (priority สูงสุด)
  if (daysToExpiry <= 0) {
    return "EXPIRED";
  }

  // เช็คใกล้หมดอายุ
  if (daysToExpiry <= expAlertDays) {
    return "NEAR_EXPIRY";
  }

  // เช็คใกล้หมด (ต้องรวมทุก lot ของ item เดียวกัน แต่สำหรับ function นี้เช็คเฉพาะ lot)
  if (currentQuantity <= minimumStock) {
    return "LOW_STOCK";
  }

  return "NORMAL";
}

/**
 * ดึงรายการ lots ที่สามารถเบิกได้ สำหรับ item ที่ระบุ (FEFO - First Expired, First Out)
 */
export async function getAvailableLots(itemId: string) {
  const balances = await prisma.stockBalance.findMany({
    where: {
      itemId,
      quantityBalance: { gt: 0 },
      expiryDate: { gt: new Date() }, // ยังไม่หมดอายุ
    },
    include: {
      item: true,
    },
    orderBy: [
      { expiryDate: "asc" }, // FEFO: หมดอายุเร็วสุดก่อน
      { lastInDate: "asc" }, // ถ้าวันหมดอายุเท่ากัน ให้เอาที่เข้าก่อน
    ],
  });

  return balances.map((balance) => ({
    id: balance.id,
    lotNo: balance.lotNo,
    expiryDate: balance.expiryDate,
    location: balance.location,
    quantityBalance: balance.quantityBalance,
    unitPrice: balance.unitPrice,
    status: balance.status,
    daysToExpiry: differenceInDays(balance.expiryDate, new Date()),
    item: {
      itemCode: balance.item.itemCode,
      itemName: balance.item.itemName,
      unit: balance.item.unit,
    },
  }));
}

/**
 * คำนวณ Stock Balance ใหม่ทั้งหมด (ใช้เมื่อต้องการ recalculate)
 */
export async function recalculateAllBalances() {
  // ลบ balance ทั้งหมด
  await prisma.stockBalance.deleteMany();

  // ดึง stock in ทั้งหมดที่ confirmed
  const stockIns = await prisma.stockIn.findMany({
    where: { status: "CONFIRMED" },
    include: { item: true },
    orderBy: { importDate: "asc" },
  });

  // สร้าง map เพื่อเก็บ balance ชั่วคราว
  const balanceMap = new Map<string, any>();

  // คำนวณจาก Stock In
  for (const stockIn of stockIns) {
    const key = `${stockIn.itemId}-${stockIn.lotNo}-${stockIn.storageLocation}`;

    if (!balanceMap.has(key)) {
      balanceMap.set(key, {
        itemId: stockIn.itemId,
        itemName: stockIn.item.itemName,
        lotNo: stockIn.lotNo,
        expiryDate: stockIn.expiryDate,
        location: stockIn.storageLocation,
        quantityBalance: 0,
        unitPrice: stockIn.unitPrice,
        lastInDate: stockIn.importDate,
        lastOutDate: null,
        minimumStock: stockIn.item.minimumStock,
        defaultExpAlert: stockIn.item.defaultExpAlert,
      });
    }

    const balance = balanceMap.get(key);
    balance.quantityBalance += stockIn.quantityIn;
    balance.lastInDate = stockIn.importDate;
  }

  // หัก Stock Out
  const stockOuts = await prisma.stockOut.findMany({
    where: { status: "APPROVED" },
    orderBy: { outDate: "asc" },
  });

  for (const stockOut of stockOuts) {
    // หา key ที่ตรง (ต้อง loop หาเพราะ stockOut ไม่มี location)
    for (const [key, balance] of balanceMap.entries()) {
      if (balance.itemId === stockOut.itemId && balance.lotNo === stockOut.lotNo) {
        balance.quantityBalance -= stockOut.quantityOut;
        balance.lastOutDate = stockOut.outDate;
        break;
      }
    }
  }

  // บันทึกลงฐานข้อมูล
  for (const balance of balanceMap.values()) {
    if (balance.quantityBalance < 0) {
      console.warn(`⚠️ Balance ติดลบ: ${balance.itemName} (${balance.lotNo})`);
    }

    const status = calculateBalanceStatus(
      balance.quantityBalance,
      balance.minimumStock,
      balance.expiryDate,
      balance.defaultExpAlert
    );

    const daysToExpiry = differenceInDays(balance.expiryDate, new Date());

    await prisma.stockBalance.create({
      data: {
        itemId: balance.itemId,
        itemName: balance.itemName,
        lotNo: balance.lotNo,
        expiryDate: balance.expiryDate,
        location: balance.location,
        quantityBalance: balance.quantityBalance,
        unitPrice: balance.unitPrice,
        totalValue: balance.unitPrice ? balance.quantityBalance * balance.unitPrice : null,
        lastInDate: balance.lastInDate,
        lastOutDate: balance.lastOutDate,
        status,
        daysToExpiry,
      },
    });
  }

  return balanceMap.size;
}
