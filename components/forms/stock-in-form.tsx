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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/date-input";

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
  const [itemOpen, setItemOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);

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
        {/* Item Selection with Search */}
        <FormField
          control={form.control}
          name="itemId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>สินค้า *</FormLabel>
              <Popover open={itemOpen} onOpenChange={setItemOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={itemOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? items.find((item) => item.id === field.value)
                          ? `${items.find((item) => item.id === field.value)?.itemCode} - ${items.find((item) => item.id === field.value)?.itemName}`
                          : "เลือกสินค้า"
                        : "เลือกสินค้า"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหาสินค้า..." />
                    <CommandList>
                      <CommandEmpty>
                        {loadingItems ? "กำลังโหลด..." : "ไม่พบสินค้า"}
                      </CommandEmpty>
                      <CommandGroup>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.itemCode} ${item.itemName}`}
                            onSelect={() => {
                              form.setValue("itemId", item.id);
                              setItemOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === item.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {item.itemCode} - {item.itemName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                <FormControl>
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="dd/mm/yyyy"
                    minDate={new Date()}
                  />
                </FormControl>
                <FormDescription>พิมพ์วันที่ เช่น 31/12/2026 หรือกดปุ่มเลือกจากปฏิทิน</FormDescription>
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

        {/* Supplier Selection with Search */}
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>ซัพพลายเออร์ *</FormLabel>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={supplierOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? suppliers.find((s) => s.id === field.value)
                          ? `${suppliers.find((s) => s.id === field.value)?.supplierCode} - ${suppliers.find((s) => s.id === field.value)?.companyName}`
                          : "เลือกซัพพลายเออร์"
                        : "เลือกซัพพลายเออร์"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหาซัพพลายเออร์..." />
                    <CommandList>
                      <CommandEmpty>
                        {loadingSuppliers ? "กำลังโหลด..." : "ไม่พบซัพพลายเออร์"}
                      </CommandEmpty>
                      <CommandGroup>
                        {suppliers.map((supplier) => (
                          <CommandItem
                            key={supplier.id}
                            value={`${supplier.supplierCode} ${supplier.companyName}`}
                            onSelect={() => {
                              form.setValue("supplierId", supplier.id);
                              setSupplierOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === supplier.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {supplier.supplierCode} - {supplier.companyName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                <FormControl>
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="dd/mm/yyyy"
                  />
                </FormControl>
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
