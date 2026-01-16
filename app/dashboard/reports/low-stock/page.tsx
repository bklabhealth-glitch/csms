"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, AlertCircle, XCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ExportButton } from "@/components/export-button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ITEM_CATEGORIES } from "@/lib/constants";

export default function LowStockReportPage() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);

      const response = await fetch(
        `/api/reports/low-stock?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to generate report");

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายงานได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    const params = new URLSearchParams();
    if (categoryFilter !== "ALL") params.append("category", categoryFilter);
    params.append("export", format);

    const response = await fetch(`/api/reports/low-stock?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to export");

    const data = await response.json();
    throw new Error(data.message || "Export feature coming in Phase 2");
  };

  const getCategoryLabel = (category: string) => {
    const cat = ITEM_CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            วิกฤติ (หมดสต็อก)
          </Badge>
        );
      case "HIGH":
        return (
          <Badge variant="destructive" className="bg-orange-100 text-orange-700 gap-1">
            <AlertTriangle className="h-3 w-3" />
            สูง ({"<"}50%)
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 gap-1">
            <AlertCircle className="h-3 w-3" />
            ปานกลาง ({"<"}100%)
          </Badge>
        );
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">รายงานสินค้าใกล้หมด</h1>
          <p className="text-muted-foreground">
            รายงานสินค้าที่มียอดคงเหลือต่ำกว่าหรือเท่ากับสต็อกขั้นต่ำ
          </p>
        </div>
        {reportData && <ExportButton onExport={handleExport} />}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองรายงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
                {ITEM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Generate Button */}
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <>กำลังสร้างรายงาน...</>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  สร้างรายงาน
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="กำลังสร้างรายงาน..." />
        </div>
      )}

      {/* Report Results */}
      {reportData && !loading && (
        <>
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลรายงาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">สร้างเมื่อ:</span>
                <span className="font-medium">
                  {format(
                    new Date(reportData.generatedAt),
                    "d MMMM yyyy HH:mm น.",
                    { locale: th }
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ผู้สร้าง:</span>
                <span className="font-medium">{reportData.generatedBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">หมวดหมู่:</span>
                <span className="font-medium">{reportData.filters.category}</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  สินค้าใกล้หมดทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.totalLowStockItems}
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-red-600">
                  วิกฤติ (หมดสต็อก)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.summary.criticalCount}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-orange-600">
                  สูง ({"<"}50%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData.summary.highCount}
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-yellow-600">
                  ปานกลาง ({"<"}100%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.summary.mediumCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียด</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.items.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  ไม่มีสินค้าใกล้หมด - สต็อกเพียงพอทั้งหมด
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ระดับ</TableHead>
                        <TableHead>รหัสสินค้า</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead>หมวดหมู่</TableHead>
                        <TableHead className="text-right">
                          สต็อกปัจจุบัน
                        </TableHead>
                        <TableHead className="text-right">
                          สต็อกขั้นต่ำ
                        </TableHead>
                        <TableHead className="text-right">ขาด</TableHead>
                        <TableHead className="text-right">
                          % คงเหลือ
                        </TableHead>
                        <TableHead className="text-right">
                          แนะนำสั่งซื้อ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {getSeverityBadge(item.severity)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.itemCode}
                          </TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>
                            {getCategoryLabel(item.category)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.currentStock} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.minimumStock} {item.unit}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {item.shortage} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.percentageRemaining.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-medium text-blue-600">
                            {item.suggestedOrderQuantity} {item.unit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
