"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockOutSchema } from "@/lib/validators";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LotSelector } from "@/components/lot-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { COMMON_PURPOSES as PURPOSES, DEPARTMENTS } from "@/lib/constants";

type StockOutFormValues = z.infer<typeof stockOutSchema>;

interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  category: string;
}

interface LotSelectionItem {
  lotNo: string;
  quantityToUse: number;
  availableQuantity: number;
}

interface StockOutFormProps {
  initialData?: Partial<StockOutFormValues & { itemId: string }>;
  onSubmit: (
    data: StockOutFormValues & { itemId: string; lotSelections: LotSelectionItem[] }
  ) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function StockOutForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = "บันทึก",
}: StockOutFormProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [lotSelections, setLotSelections] = useState<LotSelectionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const form = useForm<StockOutFormValues>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      itemId: initialData?.itemId || "",
      lotNo: "", // Will be set in handleSubmit
      quantityOut: initialData?.quantityOut || 0,
      purpose: initialData?.purpose || "ใช้งานภายในคลินิก",
      requestDept: initialData?.requestDept || "",
      requestBy: initialData?.requestBy || "",
      outDate: initialData?.outDate || new Date(),
      remarkOut: initialData?.remarkOut || "",
    },
  });

  const quantityOut = form.watch("quantityOut");
  const itemId = form.watch("itemId");

  // Calculate total selected from lots
  const totalSelectedFromLots = lotSelections.reduce(
    (sum, lot) => sum + lot.quantityToUse,
    0
  );

  const isLotSelectionValid = quantityOut > 0 && totalSelectedFromLots === quantityOut;

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const response = await fetch("/api/items?status=ACTIVE&limit=1000");
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, []);

  // Update selected item
  useEffect(() => {
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item || null);
    // Reset lot selections when item changes
    setLotSelections([]);
  }, [itemId, items]);

  const handleSubmit = async (
    data: StockOutFormValues
  ) => {
    console.log("=== Form Submit Debug ===");
    console.log("quantityOut:", quantityOut);
    console.log("lotSelections:", lotSelections);
    console.log("totalSelectedFromLots:", totalSelectedFromLots);
    console.log("isLotSelectionValid:", isLotSelectionValid);
    console.log("data:", data);

    // Use the first selected lot (simplified for Phase 1)
    const lotNo = lotSelections.length > 0 ? lotSelections[0].lotNo : "";
    console.log("lotNo to send:", lotNo);

    // Update data with lotNo before submitting
    const submitData = { ...data, lotNo };
    console.log("✅ Submitting:", submitData);

    await onSubmit({ ...submitData, lotSelections });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Item Selection */}
        <FormField
          control={form.control}
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>สินค้า *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสินค้า" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingItems ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      กำลังโหลด...
                    </div>
                  ) : (
                    items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.itemCode} - {item.itemName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedItem && (
                <FormDescription>
                  หน่วย: {selectedItem.unit} | หมวดหมู่: {selectedItem.category}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantity Out */}
        <FormField
          control={form.control}
          name="quantityOut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>จำนวนที่ต้องการเบิก *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  {...field}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              {selectedItem && (
                <FormDescription>{selectedItem.unit}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Lot Selection */}
        {selectedItem && quantityOut > 0 && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <LotSelector
              itemId={itemId}
              itemName={selectedItem.itemName}
              unit={selectedItem.unit}
              totalQuantityNeeded={quantityOut}
              onSelectionChange={setLotSelections}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Validation Alert */}
        {quantityOut > 0 && !isLotSelectionValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              กรุณาเลือก Lot ให้ครบ {quantityOut} {selectedItem?.unit || "หน่วย"}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purpose */}
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>วัตถุประสงค์ *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกวัตถุประสงค์" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PURPOSES.map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Request Department */}
          <FormField
            control={form.control}
            name="requestDept"
            render={({ field }) => (
              <FormItem>
                <FormLabel>แผนกที่ขอเบิก</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Request By */}
          <FormField
            control={form.control}
            name="requestBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ผู้ขอเบิก</FormLabel>
                <FormControl>
                  <Input placeholder="ชื่อผู้ขอเบิก" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Out Date */}
          <FormField
            control={form.control}
            name="outDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>วันที่เบิก *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "d MMMM yyyy", { locale: th })
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={th}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Remark */}
        <FormField
          control={form.control}
          name="remarkOut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>หมายเหตุ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="ข้อมูลเพิ่มเติม..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
