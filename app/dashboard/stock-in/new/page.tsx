"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StockInForm } from "@/components/forms/stock-in-form";
import { useToast } from "@/hooks/use-toast";

export default function NewStockInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stock in");
      }

      const result = await response.json();

      toast({
        title: "สำเร็จ",
        description: "บันทึกรับสินค้าเข้าเรียบร้อยแล้ว (สถานะ: แบบร่าง)",
      });

      router.push("/dashboard/stock-in");
      router.refresh();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถบันทึกรับสินค้าได้",
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
          <h1 className="text-3xl font-bold">บันทึกรับสินค้าเข้า</h1>
          <p className="text-muted-foreground">
            กรอกข้อมูลการรับสินค้าพร้อม Lot Number และวันหมดอายุ
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการรับสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <StockInForm
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
              <li>ต้องกดยืนยันรับสินค้าในหน้ารายการเพื่ออัพเดทยอดคงเหลือ</li>
              <li>Lot Number ต้องไม่ซ้ำกันในระบบ</li>
              <li>วันหมดอายุต้องอยู่ในอนาคต</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
