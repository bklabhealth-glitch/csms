import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Package, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const reports = [
    {
      title: "รายงานสต็อกคงเหลือ",
      description: "ดูสต็อกคงเหลือทั้งหมดแบบละเอียด พร้อม Lot และวันหมดอายุ",
      icon: Package,
      href: "/dashboard/reports/balance",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "รายงานการเคลื่อนไหว",
      description: "ดูประวัติการรับเข้าและเบิกออกสินค้า",
      icon: TrendingUp,
      href: "/dashboard/reports/movements",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "รายงานสินค้าใกล้หมด",
      description: "รายการสินค้าที่มีสต็อกต่ำกว่าหรือเท่ากับสต็อกขั้นต่ำ",
      icon: AlertTriangle,
      href: "/dashboard/reports/low-stock",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">รายงาน</h1>
        <p className="text-muted-foreground">
          เลือกรายงานที่ต้องการดูหรือส่งออก
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={report.href}>
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    ดูรายงาน
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>เกี่ยวกับรายงาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • <strong>รายงานสต็อกคงเหลือ:</strong> แสดงสต็อกคงเหลือทั้งหมด แยกตาม Lot number และวันหมดอายุ
          </p>
          <p className="text-sm text-muted-foreground">
            • <strong>รายงานการเคลื่อนไหว:</strong> แสดงประวัติการรับเข้าและเบิกออกตามช่วงเวลาที่กำหนด
          </p>
          <p className="text-sm text-muted-foreground">
            • <strong>รายงานสินค้าใกล้หมด:</strong> แสดงสินค้าที่ต้องสั่งซื้อเพิ่ม พร้อมแนะนำจำนวนที่ควรสั่ง
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            รายงานทุกประเภทสามารถส่งออกเป็นไฟล์ CSV, Excel หรือ PDF ได้
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
