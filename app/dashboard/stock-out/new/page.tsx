"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StockOutForm } from "@/components/forms/stock-out-form";
import { useToast } from "@/hooks/use-toast";

export default function NewStockOutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stock-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stock out");
      }

      toast({
        title: "สำเร็จ",
        description: "บันทึกเบิกสินค้าออกเรียบร้อยแล้ว (สถานะ: แบบร่าง)",
      });

      router.push("/dashboard/stock-out");
      router.refresh();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถบันทึกเบิกสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <div>
          <h1 className="text-3xl font-bold">บันทึกเบิกสินค้าออก</h1>
          <p className="text-muted-foreground">
            เลือกสินค้าและ Lot ที่ต้องการเบิก (FEFO)
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการเบิกสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <StockOutForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="บันทึกข้อมูล (Draft)"
          />
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>💡 <strong>หมายเหตุ:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ระบบจะบันทึกข้อมูลเป็น &quot;แบบร่าง&quot; ก่อน</li>
              <li>ต้องกดอนุมัติเบิกสินค้าในหน้ารายการเพื่อหักยอดคงเหลือ</li>
              <li>ระบบจะแสดง Lot ที่หมดอายุเร็วที่สุดก่อน (FEFO)</li>
              <li>ต้องเลือก Lot ให้ครบตามจำนวนที่ต้องการเบิก</li>
              <li>ระบบจะไม่ให้เบิกมากกว่ายอดคงเหลือของแต่ละ Lot</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
