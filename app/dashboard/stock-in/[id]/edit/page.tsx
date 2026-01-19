"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StockInForm } from "@/components/forms/stock-in-form";
import { useToast } from "@/hooks/use-toast";

export default function EditStockInPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [stockIn, setStockIn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stockInId = params.id as string;

  // Fetch stock in data
  useEffect(() => {
    const fetchStockIn = async () => {
      try {
        const response = await fetch(`/api/stock-in/${stockInId}`);
        if (!response.ok) throw new Error("Failed to fetch stock in");

        const data = await response.json();

        // Check if can edit (only DRAFT status)
        if (data.status !== "DRAFT") {
          toast({
            title: "ไม่สามารถแก้ไขได้",
            description: "สามารถแก้ไขได้เฉพาะรายการที่ยังเป็นแบบร่างเท่านั้น",
            variant: "destructive",
          });
          router.push(`/dashboard/stock-in/${stockInId}`);
          return;
        }

        setStockIn(data);
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลรับสินค้าได้",
          variant: "destructive",
        });
        router.push("/dashboard/stock-in");
      } finally {
        setLoading(false);
      }
    };

    fetchStockIn();
  }, [stockInId, router, toast]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/stock-in/${stockInId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update stock in");
      }

      toast({
        title: "สำเร็จ",
        description: "แก้ไขข้อมูลรับสินค้าเรียบร้อยแล้ว",
      });

      router.push(`/dashboard/stock-in/${stockInId}`);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถแก้ไขข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (!stockIn) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <div>
          <h1 className="text-3xl font-bold">แก้ไขข้อมูลรับสินค้าเข้า</h1>
          <p className="text-muted-foreground">{stockIn.stockInNo}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลรับสินค้าเข้า</CardTitle>
        </CardHeader>
        <CardContent>
          <StockInForm
            initialData={{
              itemId: stockIn.itemId,
              supplierId: stockIn.supplierId,
              lotNo: stockIn.lotNo,
              expiryDate: new Date(stockIn.expiryDate),
              quantityIn: stockIn.quantityIn,
              unitPrice: stockIn.unitPrice || 0,
              invoiceNo: stockIn.invoiceNo || "",
              importDate: new Date(stockIn.importDate),
              storageLocation: stockIn.storageLocation || "",
              remarkIn: stockIn.remarkIn || "",
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="บันทึกการแก้ไข"
          />
        </CardContent>
      </Card>
    </div>
  );
}
