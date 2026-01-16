"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { useSession } from "next-auth/react";

interface Balance {
  itemCode: string;
  itemName: string;
  category: string;
  lotNo: string;
  expiryDate: Date;
  daysToExpiry: number;
  location: string;
  quantityBalance: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  status: string;
  lastInDate: Date | null;
  lastOutDate: Date | null;
}

interface Summary {
  totalItems: number;
  totalValue: number;
  totalQuantity: number;
}

export default function StockBalancePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Fetch balances
  const fetchBalances = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/stock-balance?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch balances");

      const data = await response.json();
      setBalances(data.balances || []);
      setSummary(data.summary || null);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลยอดคงเหลือได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [searchTerm, categoryFilter, statusFilter]);

  const handleRecalculate = async () => {
    if (!confirm("ต้องการคำนวณยอดคงเหลือใหม่ทั้งระบบใช่หรือไม่?")) return;

    setRecalculating(true);
    try {
      const response = await fetch("/api/stock-balance/recalculate", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to recalculate");
      }

      toast({
        title: "สำเร็จ",
        description: "คำนวณยอดคงเหลือใหม่เรียบร้อยแล้ว",
      });

      fetchBalances();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถคำนวณได้",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = ITEM_CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ยอดคงเหลือคลัง (Stock Balance)</h1>
          <p className="text-muted-foreground">
            ตรวจสอบยอดคงเหลือแยกตาม Lot Number
          </p>
        </div>
        {session?.user?.role === "ADMIN" && (
          <Button
            onClick={handleRecalculate}
            disabled={recalculating}
            variant="outline"
          >
            {recalculating ? (
              <>กำลังคำนวณ...</>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                คำนวณยอดใหม่
              </>
            )}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                จำนวน Lot ทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalItems || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                มูลค่ารวมทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ฿{(summary?.totalValue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                จำนวนรวม (หน่วยต่างกัน)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(summary?.totalQuantity || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหารหัส, ชื่อสินค้า, Lot No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                <SelectItem value="NORMAL">ปกติ</SelectItem>
                <SelectItem value="LOW_STOCK">ใกล้หมด</SelectItem>
                <SelectItem value="NEAR_EXPIRY">ใกล้หมดอายุ</SelectItem>
                <SelectItem value="EXPIRED">หมดอายุ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Balance Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="กำลังโหลดข้อมูล..." />
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบข้อมูลยอดคงเหลือ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>Lot No.</TableHead>
                    <TableHead>วันหมดอายุ</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead className="text-right">คงเหลือ</TableHead>
                    <TableHead className="text-right">มูลค่า</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {balance.itemCode}
                      </TableCell>
                      <TableCell>{balance.itemName}</TableCell>
                      <TableCell>{getCategoryLabel(balance.category)}</TableCell>
                      <TableCell>{balance.lotNo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">
                            {format(new Date(balance.expiryDate), "d MMM yyyy", {
                              locale: th,
                            })}
                          </div>
                          <div
                            className={`text-xs ${
                              balance.daysToExpiry < 30
                                ? "text-red-600"
                                : balance.daysToExpiry < 90
                                ? "text-orange-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            ({balance.daysToExpiry} วัน)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{balance.location}</TableCell>
                      <TableCell className="text-right font-medium">
                        {balance.quantityBalance} {balance.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        ฿{balance.totalValue?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={balance.status as "NORMAL" | "LOW_STOCK" | "NEAR_EXPIRY" | "EXPIRED"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
