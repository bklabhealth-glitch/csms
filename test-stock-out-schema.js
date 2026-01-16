// Test stock-out schema validation
const { z } = require('zod');

const stockOutSchema = z.object({
  itemId: z.string().min(1, "กรุณาเลือกสินค้า"),
  lotNo: z.string().min(1, "กรุณาเลือก Lot"),
  quantityOut: z.number().min(0.01, "จำนวนต้องมากกว่า 0"),
  purpose: z.string().min(1, "กรุณากรอกวัตถุประสงค์"),
  requestDept: z.string().optional(),
  requestBy: z.string().optional(),
  outDate: z.date({
    required_error: "กรุณาเลือกวันที่เบิก",
  }),
  remarkOut: z.string().optional(),
});

// Test data
const testData = {
  itemId: "test-item-id",
  lotNo: "", // Empty lot number
  quantityOut: 5,
  purpose: "ใช้งานภายในคลินิก",
  requestDept: "",
  requestBy: "",
  outDate: new Date(),
  remarkOut: "",
};

console.log("Testing stock-out schema validation...");
console.log("Test data:", testData);

try {
  const validated = stockOutSchema.parse(testData);
  console.log("✅ Validation passed!");
  console.log("Validated data:", validated);
} catch (error) {
  console.log("❌ Validation failed!");
  console.log("Error:", error.errors);
}
