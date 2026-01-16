"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Lot {
  lotNo: string;
  expiryDate: Date;
  quantityBalance: number;
  location: string;
  status: string;
  daysToExpiry: number;
}

interface LotSelectionItem {
  lotNo: string;
  quantityToUse: number;
  availableQuantity: number;
}

interface LotSelectorProps {
  itemId: string;
  itemName: string;
  unit: string;
  totalQuantityNeeded: number;
  onSelectionChange: (selections: LotSelectionItem[]) => void;
  disabled?: boolean;
}

export function LotSelector({
  itemId,
  itemName,
  unit,
  totalQuantityNeeded,
  onSelectionChange,
  disabled = false,
}: LotSelectorProps) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [selections, setSelections] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available lots
  useEffect(() => {
    if (!itemId) {
      setLots([]);
      return;
    }

    const fetchLots = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stock-out/lots?itemId=${itemId}`);
        if (!response.ok) {
          throw new Error("ไม่สามารถดึงข้อมูล Lot ได้");
        }
        const data = await response.json();
        setLots(data.lots || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        setLots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, [itemId]);

  // Calculate total selected quantity
  const totalSelected = Array.from(selections.values()).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const remainingQuantity = totalQuantityNeeded - totalSelected;

  // Handle quantity change for a lot
  const handleQuantityChange = (lotNo: string, value: string) => {
    const quantity = parseFloat(value) || 0;
    const lot = lots.find((l) => l.lotNo === lotNo);

    if (!lot) return;

    // Validate quantity
    if (quantity < 0) return;
    if (quantity > lot.quantityBalance) return;

    const newSelections = new Map(selections);
    if (quantity === 0) {
      newSelections.delete(lotNo);
    } else {
      newSelections.set(lotNo, quantity);
    }

    setSelections(newSelections);

    // Notify parent
    const selectionArray = Array.from(newSelections.entries()).map(
      ([lotNo, quantityToUse]) => ({
        lotNo,
        quantityToUse,
        availableQuantity: lots.find((l) => l.lotNo === lotNo)?.quantityBalance || 0,
      })
    );
    onSelectionChange(selectionArray);
  };

  // Auto-fill using FEFO
  const autoFillFEFO = () => {
    let remaining = totalQuantityNeeded;
    const newSelections = new Map<string, number>();

    for (const lot of lots) {
      if (remaining <= 0) break;

      const qtyToUse = Math.min(remaining, lot.quantityBalance);
      newSelections.set(lot.lotNo, qtyToUse);
      remaining -= qtyToUse;
    }

    setSelections(newSelections);

    // Notify parent
    const selectionArray = Array.from(newSelections.entries()).map(
      ([lotNo, quantityToUse]) => ({
        lotNo,
        quantityToUse,
        availableQuantity: lots.find((l) => l.lotNo === lotNo)?.quantityBalance || 0,
      })
    );
    onSelectionChange(selectionArray);
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "NORMAL":
        return "default";
      case "LOW_STOCK":
        return "secondary";
      case "NEAR_EXPIRY":
        return "destructive";
      case "EXPIRED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NORMAL":
        return "text-green-600";
      case "LOW_STOCK":
        return "text-yellow-600";
      case "NEAR_EXPIRY":
        return "text-orange-600";
      case "EXPIRED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return <div className="text-center py-4">กำลังโหลดข้อมูล Lot...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (lots.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          ไม่มี Lot ที่พร้อมใช้งานสำหรับสินค้านี้
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">{itemName}</Label>
          <p className="text-sm text-muted-foreground">
            ต้องการเบิก: {totalQuantityNeeded} {unit}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={autoFillFEFO}
          disabled={disabled}
        >
          เติมอัตโนมัติ (FEFO)
        </Button>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50">
        <div className="flex-1">
          <div className="text-sm font-medium">เลือกแล้ว: {totalSelected} {unit}</div>
          <div className="text-sm text-muted-foreground">
            คосталось: {remainingQuantity} {unit}
          </div>
        </div>
        {totalSelected === totalQuantityNeeded ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : totalSelected > totalQuantityNeeded ? (
          <AlertCircle className="h-5 w-5 text-red-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        )}
      </div>

      {/* Validation Messages */}
      {totalSelected > totalQuantityNeeded && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            เลือกมากเกินไป! ลดจำนวนลง {totalSelected - totalQuantityNeeded} {unit}
          </AlertDescription>
        </Alert>
      )}

      {totalSelected < totalQuantityNeeded && totalSelected > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ยังขาดอีก {remainingQuantity} {unit}
          </AlertDescription>
        </Alert>
      )}

      {/* Lot Selection Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot No.</TableHead>
              <TableHead>วันหมดอายุ</TableHead>
              <TableHead>คงเหลือ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>ตำแหน่ง</TableHead>
              <TableHead className="w-[150px]">จำนวนที่เบิก</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => {
              const selected = selections.get(lot.lotNo) || 0;
              return (
                <TableRow key={lot.lotNo}>
                  <TableCell className="font-medium">{lot.lotNo}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {format(new Date(lot.expiryDate), "d MMM yyyy", {
                          locale: th,
                        })}
                      </div>
                      <div
                        className={`text-xs ${
                          lot.daysToExpiry < 30
                            ? "text-red-600"
                            : lot.daysToExpiry < 90
                            ? "text-orange-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        ({lot.daysToExpiry} วัน)
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lot.quantityBalance} {unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(lot.status)}>
                      {lot.status === "NORMAL" && "ปกติ"}
                      {lot.status === "LOW_STOCK" && "ใกล้หมด"}
                      {lot.status === "NEAR_EXPIRY" && "ใกล้หมดอายุ"}
                      {lot.status === "EXPIRED" && "หมดอายุ"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{lot.location}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={lot.quantityBalance}
                      step="0.01"
                      value={selected || ""}
                      onChange={(e) =>
                        handleQuantityChange(lot.lotNo, e.target.value)
                      }
                      placeholder="0"
                      disabled={disabled}
                      className={selected > 0 ? "border-primary" : ""}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        💡 Lot ที่แสดงเรียงตาม FEFO (First Expired First Out) - Lot ที่หมดอายุเร็วที่สุดอยู่บนสุด
      </p>
    </div>
  );
}
