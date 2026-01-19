"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockInSchema } from "@/lib/validators";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StockInFormValues = z.infer<typeof stockInSchema>;

interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  category: string;
  storageLocation?: string;
}

interface Supplier {
  id: string;
  supplierCode: string;
  companyName: string;
}

interface StockInFormProps {
  initialData?: Partial<StockInFormValues & { itemId: string; supplierId: string }>;
  onSubmit: (data: StockInFormValues & { itemId: string; supplierId: string }) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function StockInForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = "บันทึก",
}: StockInFormProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const form = useForm<StockInFormValues & { itemId: string; supplierId: string }>({
    resolver: zodResolver(
      stockInSchema.extend({
        itemId: z.string().min(1, "กรุณาเลือกสินค้า"),
        supplierId: z.string().min(1, "กรุณาเลือกซัพพลายเออร์"),
      })
    ),
    defaultValues: {
      itemId: initialData?.itemId || "",
      supplierId: initialData?.supplierId || "",
      lotNo: initialData?.lotNo || "",
      expiryDate: initialData?.expiryDate || new Date(),
      quantityIn: initialData?.quantityIn || 0,
      unitPrice: initialData?.unitPrice || 0,
      invoiceNo: initialData?.invoiceNo || "",
      importDate: initialData?.importDate || new Date(),
      storageLocation: initialData?.storageLocation || "",
      remarkIn: initialData?.remarkIn || "",
    },
  });

  // Calculate total value
  const quantityIn = form.watch("quantityIn");
  const unitPrice = form.watch("unitPrice");
  const totalValue = quantityIn * (unitPrice || 0);

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

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await fetch("/api/suppliers?status=ACTIVE&limit=1000");
        if (response.ok) {
          const data = await response.json();
          setSuppliers(data.suppliers || []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Update selected item and auto-fill storageLocation
  useEffect(() => {
    const itemId = form.watch("itemId");
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item || null);

    // Auto-fill storageLocation from item master
    if (item?.storageLocation) {
      form.setValue("storageLocation", item.storageLocation);
    }
  }, [form.watch("itemId"), items, form]);

  const handleSubmit = async (data: StockInFormValues & { itemId: string; supplierId: string }) => {
    await onSubmit(data);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lot No */}
          <FormField
            control={form.control}
            name="lotNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lot No. *</FormLabel>
                <FormControl>
                  <Input placeholder="LOT-XXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expiry Date */}
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>วันหมดอายุ *</FormLabel>
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
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantity In */}
          <FormField
            control={form.control}
            name="quantityIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>จำนวนรับเข้า *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                {selectedItem && (
                  <FormDescription>{selectedItem.unit}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit Price */}
          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ราคาต่อหน่วย *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>บาท</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Total Value (Calculated) */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              มูลค่ารวม
            </label>
            <Input
              value={totalValue.toFixed(2)}
              readOnly
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">บาท (คำนวณอัตโนมัติ)</p>
          </div>
        </div>

        {/* Supplier Selection */}
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ซัพพลายเออร์ *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกซัพพลายเออร์" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingSuppliers ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      กำลังโหลด...
                    </div>
                  ) : (
                    suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplierCode} - {supplier.companyName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Invoice No */}
          <FormField
            control={form.control}
            name="invoiceNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>เลขที่ใบกำกับสินค้า</FormLabel>
                <FormControl>
                  <Input placeholder="INV-XXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Import Date */}
          <FormField
            control={form.control}
            name="importDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>วันที่รับเข้า *</FormLabel>
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

        {/* Storage Location */}
        <FormField
          control={form.control}
          name="storageLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ตำแหน่งจัดเก็บ</FormLabel>
              <FormControl>
                <Input placeholder="เช่น ชั้น A-01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remark */}
        <FormField
          control={form.control}
          name="remarkIn"
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
