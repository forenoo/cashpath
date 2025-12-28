"use client";

import { Banknote, Edit2, Plus, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ScenarioItem } from "@/lib/validations/simulation";
import { ScenarioItemDialog } from "./scenario-item-dialog";

type ScenarioBuilderProps = {
  items: ScenarioItem[];
  onItemsChange: (items: ScenarioItem[]) => void;
};

// Format currency to Indonesian Rupiah
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ScenarioBuilder({
  items,
  onItemsChange,
}: ScenarioBuilderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScenarioItem | null>(null);
  const [defaultType, setDefaultType] = useState<"income" | "expense">(
    "expense",
  );

  const incomeItems = items.filter((item) => item.type === "income");
  const expenseItems = items.filter((item) => item.type === "expense");

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  const handleAddItem = (type: "income" | "expense") => {
    setDefaultType(type);
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEditItem = (item: ScenarioItem) => {
    setEditingItem(item);
    setDefaultType(item.type);
    setDialogOpen(true);
  };

  const handleSaveItem = (item: ScenarioItem) => {
    if (editingItem) {
      // Update existing item
      onItemsChange(items.map((i) => (i.id === item.id ? item : i)));
    } else {
      // Add new item
      onItemsChange([...items, item]);
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income Section */}
        <Card className="border-emerald-500/30 bg-emerald-500/5 gap-0 md:gap-6">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3">
            <div className="flex items-center gap-4">
              <Banknote className="size-6 text-emerald-600" />
              <div>
                <CardTitle className="text-lg">Pemasukan</CardTitle>
                <p className="text-emerald-600 text-sm font-medium">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddItem("income")}
              className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 w-full md:w-auto"
            >
              <Plus className="size-4" />
              Tambah
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {incomeItems.length === 0 ? (
              <button
                type="button"
                onClick={() => handleAddItem("income")}
                className="w-full rounded-lg border-2 border-dashed border-emerald-500/30 p-4 text-center transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/5"
              >
                <Plus className="mx-auto mb-1 size-5 text-emerald-500/70" />
                <p className="text-muted-foreground text-sm">
                  Tambah pemasukan pertama
                </p>
              </button>
            ) : (
              incomeItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Expense Section */}
        <Card className="border-rose-500/30 bg-rose-500/5 gap-0 md:gap-6">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3">
            <div className="flex items-center gap-4">
              <Receipt className="size-6 text-rose-600" />
              <div>
                <CardTitle className="text-lg">Pengeluaran</CardTitle>
                <p className="text-rose-600 text-sm font-medium">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddItem("expense")}
              className="border-rose-500/50 text-rose-600 hover:bg-rose-500/10 w-full md:w-auto"
            >
              <Plus className="size-4" />
              Tambah
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {expenseItems.length === 0 ? (
              <button
                type="button"
                onClick={() => handleAddItem("expense")}
                className="w-full rounded-lg border-2 border-dashed border-rose-500/30 p-4 text-center transition-colors hover:border-rose-500/50 hover:bg-rose-500/5"
              >
                <Plus className="mx-auto mb-1 size-5 text-rose-500/70" />
                <p className="text-muted-foreground text-sm">
                  Tambah pengeluaran pertama
                </p>
              </button>
            ) : (
              expenseItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ScenarioItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveItem}
        editItem={editingItem}
        defaultType={defaultType}
      />
    </>
  );
}

type ItemRowProps = {
  item: ScenarioItem;
  onEdit: () => void;
  onDelete: () => void;
};

function ItemRow({ item, onEdit, onDelete }: ItemRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-lg border bg-background/80 p-3 transition-all",
        item.type === "income"
          ? "border-emerald-500/20 hover:border-emerald-500/40"
          : "border-rose-500/20 hover:border-rose-500/40",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p
          className={cn(
            "font-semibold tabular-nums",
            item.type === "income" ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {item.type === "income" ? "+" : "-"}
          {formatCurrency(item.amount)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="ghost" onClick={onEdit} className="size-8">
          <Edit2 className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
