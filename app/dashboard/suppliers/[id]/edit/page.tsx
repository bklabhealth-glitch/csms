"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SupplierForm } from "@/components/forms/supplier-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useToast } from "@/hooks/use-toast";

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierId = params.id as string;

  // Fetch supplier data
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await fetch(`/api/suppliers/${supplierId}`);
        if (!response.ok) throw new Error("Failed to fetch supplier");

        const data = await response.json();
        setSupplier(data);
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลซัพพลายเออร์ได้",
          variant: "destructive",
        });
        router.push("/dashboard/suppliers");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update supplier");
      }

      toast({
        title: "สำเร็จ",
        description: "แก้ไขข้อมูลซัพพลายเออร์เรียบร้อยแล้ว",
      });

      router.push("/dashboard/suppliers");
      router.refresh();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถแก้ไขข้อมูลได้",
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

  if (!supplier) {
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
          <h1 className="text-3xl font-bold">แก้ไขซัพพลายเออร์</h1>
          <p className="text-muted-foreground">
            {supplier.supplierCode} - {supplier.companyName}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลซัพพลายเออร์</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm
            initialData={supplier}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="บันทึกการแก้ไข"
          />
        </CardContent>
      </Card>
    </div>
  );
}
