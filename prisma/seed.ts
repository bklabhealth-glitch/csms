import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 เริ่มสร้างข้อมูลทดสอบ...");

  // ลบข้อมูลเก่าทั้งหมด (ระวัง: ใช้เฉพาะ development เท่านั้น!)
  console.log("🗑️  ลบข้อมูลเก่า...");
  await prisma.auditLog.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.stockOut.deleteMany();
  await prisma.stockIn.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.itemMaster.deleteMany();
  await prisma.user.deleteMany();

  // สร้าง Users
  console.log("👤 สร้าง Users...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const hashedPasswordOfficer = await bcrypt.hash("officer123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@clinic.com",
      password: hashedPassword,
      name: "ผู้ดูแลระบบ",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const officer = await prisma.user.create({
    data: {
      email: "officer@clinic.com",
      password: hashedPasswordOfficer,
      name: "เจ้าหน้าที่คลัง",
      role: "STOCK_OFFICER",
      status: "ACTIVE",
    },
  });

  console.log(`✅ สร้าง Users สำเร็จ (Admin: ${admin.email}, Officer: ${officer.email})`);

  // สร้าง Suppliers
  console.log("🏢 สร้าง Suppliers...");
  const supplier1 = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-00001",
      companyName: "บริษัท เมดิคอล ซัพพลาย จำกัด",
      contactPerson: "คุณสมชาย",
      phone: "02-123-4567",
      email: "contact@medical-supply.com",
      address: "123 ถนนพระราม 9 กรุงเทพฯ",
      taxId: "0123456789012",
      status: "ACTIVE",
      createdBy: admin.id,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-00002",
      companyName: "บริษัท ไบโอเทค แล็บ จำกัด",
      contactPerson: "คุณสมหญิง",
      phone: "02-234-5678",
      email: "info@biotech-lab.com",
      address: "456 ถนนสุขุมวิท กรุงเทพฯ",
      taxId: "0987654321098",
      status: "ACTIVE",
      createdBy: admin.id,
    },
  });

  console.log(`✅ สร้าง ${2} Suppliers สำเร็จ`);

  // สร้าง Items
  console.log("📦 สร้าง Items...");
  const items = await Promise.all([
    // อุปกรณ์
    prisma.itemMaster.create({
      data: {
        itemCode: "ITM-00001",
        itemName: "เข็มฉีดยา 3 ml",
        category: "EQUIPMENT",
        unit: "ชิ้น",
        minimumStock: 100,
        defaultExpAlert: 180,
        storageLocation: "ตู้เก็บอุปกรณ์ A",
        responsiblePerson: "คุณสมศรี",
        status: "ACTIVE",
        createdBy: admin.id,
      },
    }),
    prisma.itemMaster.create({
      data: {
        itemCode: "ITM-00002",
        itemName: "ถุงมือแพทย์ (ไซส์ M)",
        category: "EQUIPMENT",
        unit: "กล่อง",
        minimumStock: 50,
        defaultExpAlert: 365,
        storageLocation: "ตู้เก็บอุปกรณ์ A",
        responsiblePerson: "คุณสมศรี",
        status: "ACTIVE",
        createdBy: admin.id,
      },
    }),

    // เครื่องมือ
    prisma.itemMaster.create({
      data: {
        itemCode: "ITM-00003",
        itemName: "กรรไกรตัดแผล",
        category: "TOOL",
        unit: "ชิ้น",
        minimumStock: 10,
        defaultExpAlert: 0, // ไม่มีวันหมดอายุ
        storageLocation: "ตู้เก็บเครื่องมือ B",
        responsiblePerson: "คุณสมชาย",
        status: "ACTIVE",
        createdBy: admin.id,
      },
    }),

    // น้ำยา
    prisma.itemMaster.create({
      data: {
        itemCode: "ITM-00004",
        itemName: "แอลกอฮอล์ 70%",
        category: "CHEMICAL",
        unit: "ขวด",
        minimumStock: 30,
        defaultExpAlert: 90,
        storageLocation: "ตู้เก็บน้ำยา C",
        responsiblePerson: "คุณสมหญิง",
        status: "ACTIVE",
        createdBy: admin.id,
      },
    }),
    prisma.itemMaster.create({
      data: {
        itemCode: "ITM-00005",
        itemName: "Povidone-Iodine 10%",
        category: "CHEMICAL",
        unit: "ขวด",
        minimumStock: 20,
        defaultExpAlert: 180,
        storageLocation: "ตู้เก็บน้ำยา C",
        responsiblePerson: "คุณสมหญิง",
        status: "ACTIVE",
        createdBy: admin.id,
      },
    }),

    // ชุดตรวจ
    prisma.itemMaster.create({
      data: {
        itemCode: "ITM-00006",
        itemName: "ชุดตรวจ COVID-19 Antigen",
        category: "TEST_KIT",
        unit: "test",
        minimumStock: 50,
        defaultExpAlert: 90,
        storageLocation: "ตู้เย็น D",
        responsiblePerson: "คุณสมศักดิ์",
        status: "ACTIVE",
        createdBy: admin.id,
      },
    }),
    prisma.itemMaster.create({
      data: {
        itemCode: "ITM-00007",
        itemName: "ชุดตรวจน้ำตาลในเลือด",
        category: "TEST_KIT",
        unit: "test",
        minimumStock: 100,
        defaultExpAlert: 60,
        storageLocation: "ตู้เย็น D",
        responsiblePerson: "คุณสมศักดิ์",
        status: "ACTIVE",
        createdBy: admin.id,
      },
    }),
  ]);

  console.log(`✅ สร้าง ${items.length} Items สำเร็จ`);

  // สร้าง Stock In (รับเข้าสินค้า)
  console.log("📥 สร้าง Stock In transactions...");
  const stockIns = await Promise.all([
    // เข็มฉีดยา
    prisma.stockIn.create({
      data: {
        stockInNo: "IN-20260101-0001",
        itemId: items[0].id,
        lotNo: "LOT2024-001",
        expiryDate: new Date("2025-12-31"),
        quantityIn: 500,
        unitPrice: 5.0,
        totalValue: 2500,
        supplierId: supplier1.id,
        invoiceNo: "INV-2024-001",
        importDate: new Date("2026-01-01"),
        importBy: "คุณสมศรี",
        storageLocation: "ตู้เก็บอุปกรณ์ A",
        status: "CONFIRMED",
        createdBy: officer.id,
      },
    }),

    // ถุงมือแพทย์
    prisma.stockIn.create({
      data: {
        stockInNo: "IN-20260102-0001",
        itemId: items[1].id,
        lotNo: "LOT2024-002",
        expiryDate: new Date("2026-06-30"),
        quantityIn: 200,
        unitPrice: 150.0,
        totalValue: 30000,
        supplierId: supplier1.id,
        invoiceNo: "INV-2024-002",
        importDate: new Date("2026-01-02"),
        importBy: "คุณสมศรี",
        storageLocation: "ตู้เก็บอุปกรณ์ A",
        status: "CONFIRMED",
        createdBy: officer.id,
      },
    }),

    // แอลกอฮอล์
    prisma.stockIn.create({
      data: {
        stockInNo: "IN-20260103-0001",
        itemId: items[3].id,
        lotNo: "LOT2024-003",
        expiryDate: new Date("2026-12-31"),
        quantityIn: 100,
        unitPrice: 80.0,
        totalValue: 8000,
        supplierId: supplier2.id,
        invoiceNo: "INV-2024-003",
        importDate: new Date("2026-01-03"),
        importBy: "คุณสมหญิง",
        storageLocation: "ตู้เก็บน้ำยา C",
        status: "CONFIRMED",
        createdBy: officer.id,
      },
    }),

    // ชุดตรวจ COVID
    prisma.stockIn.create({
      data: {
        stockInNo: "IN-20260104-0001",
        itemId: items[5].id,
        lotNo: "LOT2025-001",
        expiryDate: new Date("2026-03-31"), // ใกล้หมดอายุ (< 90 วัน)
        quantityIn: 150,
        unitPrice: 250.0,
        totalValue: 37500,
        supplierId: supplier2.id,
        invoiceNo: "INV-2024-004",
        importDate: new Date("2026-01-04"),
        importBy: "คุณสมศักดิ์",
        storageLocation: "ตู้เย็น D",
        status: "CONFIRMED",
        createdBy: officer.id,
      },
    }),

    // ชุดตรวจน้ำตาล
    prisma.stockIn.create({
      data: {
        stockInNo: "IN-20260105-0001",
        itemId: items[6].id,
        lotNo: "LOT2025-002",
        expiryDate: new Date("2026-04-30"),
        quantityIn: 300,
        unitPrice: 30.0,
        totalValue: 9000,
        supplierId: supplier2.id,
        invoiceNo: "INV-2024-005",
        importDate: new Date("2026-01-05"),
        importBy: "คุณสมศักดิ์",
        storageLocation: "ตู้เย็น D",
        status: "CONFIRMED",
        createdBy: officer.id,
      },
    }),
  ]);

  console.log(`✅ สร้าง ${stockIns.length} Stock In transactions สำเร็จ`);

  // สร้าง Stock Out (เบิกสินค้า)
  console.log("📤 สร้าง Stock Out transactions...");
  const stockOuts = await Promise.all([
    // เบิกเข็มฉีดยา
    prisma.stockOut.create({
      data: {
        stockOutNo: "OUT-20260106-0001",
        itemId: items[0].id,
        lotNo: "LOT2024-001",
        quantityOut: 50,
        purpose: "ห้องตรวจ",
        requestDept: "ห้องตรวจ OPD",
        requestBy: "พยาบาลสมใจ",
        outDate: new Date("2026-01-06"),
        status: "APPROVED",
        createdBy: officer.id,
      },
    }),

    // เบิกถุงมือ
    prisma.stockOut.create({
      data: {
        stockOutNo: "OUT-20260106-0002",
        itemId: items[1].id,
        lotNo: "LOT2024-002",
        quantityOut: 20,
        purpose: "ห้องทำแผล",
        requestDept: "ห้องทำแผล",
        requestBy: "พยาบาลสมหมาย",
        outDate: new Date("2026-01-06"),
        status: "APPROVED",
        createdBy: officer.id,
      },
    }),

    // เบิกแอลกอฮอล์
    prisma.stockOut.create({
      data: {
        stockOutNo: "OUT-20260107-0001",
        itemId: items[3].id,
        lotNo: "LOT2024-003",
        quantityOut: 10,
        purpose: "ห้อง Lab",
        requestDept: "ห้อง Lab",
        requestBy: "นักเทคนิคการแพทย์สมศักดิ์",
        outDate: new Date("2026-01-07"),
        status: "APPROVED",
        createdBy: officer.id,
      },
    }),
  ]);

  console.log(`✅ สร้าง ${stockOuts.length} Stock Out transactions สำเร็จ`);

  // สร้าง Stock Balance
  console.log("📊 สร้าง Stock Balance...");
  const stockBalances = await Promise.all([
    // เข็มฉีดยา: 500 - 50 = 450
    prisma.stockBalance.create({
      data: {
        itemId: items[0].id,
        itemName: items[0].itemName,
        lotNo: "LOT2024-001",
        expiryDate: new Date("2025-12-31"),
        location: "ตู้เก็บอุปกรณ์ A",
        quantityBalance: 450,
        unitPrice: 5.0,
        totalValue: 2250,
        status: "NEAR_EXPIRY", // หมดอายุน้อยกว่า 180 วัน
        lastInDate: new Date("2026-01-01"),
        lastOutDate: new Date("2026-01-06"),
        daysToExpiry: Math.floor(
          (new Date("2025-12-31").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    }),

    // ถุงมือ: 200 - 20 = 180
    prisma.stockBalance.create({
      data: {
        itemId: items[1].id,
        itemName: items[1].itemName,
        lotNo: "LOT2024-002",
        expiryDate: new Date("2026-06-30"),
        location: "ตู้เก็บอุปกรณ์ A",
        quantityBalance: 180,
        unitPrice: 150.0,
        totalValue: 27000,
        status: "NORMAL",
        lastInDate: new Date("2026-01-02"),
        lastOutDate: new Date("2026-01-06"),
        daysToExpiry: Math.floor(
          (new Date("2026-06-30").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    }),

    // กรรไกร: ไม่มีการเบิก
    prisma.stockBalance.create({
      data: {
        itemId: items[2].id,
        itemName: items[2].itemName,
        lotNo: "NO-LOT",
        expiryDate: new Date("2099-12-31"), // ไม่มีวันหมดอายุ
        location: "ตู้เก็บเครื่องมือ B",
        quantityBalance: 5,
        unitPrice: 0,
        totalValue: 0,
        status: "LOW_STOCK", // ต่ำกว่า minimum (10)
        lastInDate: null,
        lastOutDate: null,
        daysToExpiry: null,
      },
    }),

    // แอลกอฮอล์: 100 - 10 = 90
    prisma.stockBalance.create({
      data: {
        itemId: items[3].id,
        itemName: items[3].itemName,
        lotNo: "LOT2024-003",
        expiryDate: new Date("2026-12-31"),
        location: "ตู้เก็บน้ำยา C",
        quantityBalance: 90,
        unitPrice: 80.0,
        totalValue: 7200,
        status: "NORMAL",
        lastInDate: new Date("2026-01-03"),
        lastOutDate: new Date("2026-01-07"),
        daysToExpiry: Math.floor(
          (new Date("2026-12-31").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    }),

    // ชุดตรวจ COVID: 150 (ไม่มีการเบิก)
    prisma.stockBalance.create({
      data: {
        itemId: items[5].id,
        itemName: items[5].itemName,
        lotNo: "LOT2025-001",
        expiryDate: new Date("2026-03-31"),
        location: "ตู้เย็น D",
        quantityBalance: 150,
        unitPrice: 250.0,
        totalValue: 37500,
        status: "NEAR_EXPIRY", // ใกล้หมดอายุ < 90 วัน
        lastInDate: new Date("2026-01-04"),
        lastOutDate: null,
        daysToExpiry: Math.floor(
          (new Date("2026-03-31").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    }),

    // ชุดตรวจน้ำตาล: 300 (ไม่มีการเบิก)
    prisma.stockBalance.create({
      data: {
        itemId: items[6].id,
        itemName: items[6].itemName,
        lotNo: "LOT2025-002",
        expiryDate: new Date("2026-04-30"),
        location: "ตู้เย็น D",
        quantityBalance: 300,
        unitPrice: 30.0,
        totalValue: 9000,
        status: "NORMAL",
        lastInDate: new Date("2026-01-05"),
        lastOutDate: null,
        daysToExpiry: Math.floor(
          (new Date("2026-04-30").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    }),
  ]);

  console.log(`✅ สร้าง ${stockBalances.length} Stock Balance records สำเร็จ`);

  console.log("\n✨ เสร็จสิ้นการสร้างข้อมูลทดสอบ!\n");
  console.log("📝 ข้อมูล Login:");
  console.log("   👤 Admin: admin@clinic.com / admin123");
  console.log("   👤 Officer: officer@clinic.com / officer123");
  console.log("\n📊 สรุปข้อมูล:");
  console.log(`   - Users: 2`);
  console.log(`   - Suppliers: 2`);
  console.log(`   - Items: ${items.length}`);
  console.log(`   - Stock In: ${stockIns.length}`);
  console.log(`   - Stock Out: ${stockOuts.length}`);
  console.log(`   - Stock Balance: ${stockBalances.length}`);
  console.log("\n💡 สถานะสินค้า:");
  console.log(`   - ปกติ: 3 รายการ`);
  console.log(`   - ใกล้หมดอายุ: 2 รายการ (เข็มฉีดยา, ชุดตรวจ COVID)`);
  console.log(`   - ใกล้หมด: 1 รายการ (กรรไกรตัดแผล)`);
}

main()
  .catch((e) => {
    console.error("❌ เกิดข้อผิดพลาด:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
