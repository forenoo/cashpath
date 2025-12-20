"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowUpDown,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly" | null;

export type Transaction = {
  id: string;
  name: string;
  type: "income" | "expense";
  amount: number;
  date: Date;
  isRecurring: boolean;
  frequency: Frequency;
  description: string | null;
  category: {
    id: string;
    name: string;
    type: string;
    icon: string | null;
  };
  wallet: {
    id: string;
    name: string;
    type: string;
  };
};

const frequencyLabels: Record<NonNullable<Frequency>, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// Filter function for type column (multi-select)
const typeFilterFn: FilterFn<Transaction> = (
  row,
  columnId,
  filterValue: string[],
) => {
  if (!filterValue?.length) {
    return true;
  }
  const type = row.getValue(columnId) as string;
  return filterValue.includes(type);
};

// Filter function for frequency column (multi-select)
const frequencyFilterFn: FilterFn<Transaction> = (
  row,
  columnId,
  filterValue: string[],
) => {
  if (!filterValue?.length) {
    return true;
  }
  const frequency = row.getValue(columnId) as string | null;
  if (!frequency) return filterValue.includes("one_time");
  return filterValue.includes(frequency);
};

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Nama
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Kategori
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const category = row.original.category;
      return <span className="text-center">{category.name}</span>;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Tipe
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as "income" | "expense";
      return (
        <Badge variant={type === "income" ? "success" : "destructive"}>
          {type === "income" ? "Pemasukan" : "Pengeluaran"}
        </Badge>
      );
    },
    filterFn: typeFilterFn,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Jumlah
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.original.type;
      const amount = row.getValue("amount") as number;
      return (
        <span
          className={`font-medium ${
            type === "income" ? "text-green-500" : "text-destructive"
          }`}
        >
          {type === "income" ? "+" : "-"}
          {formatCurrency(amount)}
        </span>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Tanggal
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("date") as Date;
      return format(new Date(date), "dd MMM yyyy", { locale: localeId });
    },
  },
  {
    accessorKey: "wallet",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Sumber
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const wallet = row.original.wallet;
      return <span>{wallet.name}</span>;
    },
  },
  {
    accessorKey: "frequency",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Frekuensi
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const frequency = row.getValue("frequency") as Frequency;
      const label = frequency ? frequencyLabels[frequency] : "Sekali";
      return <Badge variant="outline">{label}</Badge>;
    },
    filterFn: frequencyFilterFn,
  },
  {
    id: "actions",
    header: "Aksi",
    cell: () => null, // Will be overridden by createColumns
  },
];

type ColumnActions = {
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onDuplicate: (transaction: Transaction) => void;
};

export function createColumns(
  actions: ColumnActions,
): ColumnDef<Transaction>[] {
  return columns.map((column) => {
    if (column.id === "actions") {
      return {
        ...column,
        cell: ({ row }) => {
          const transaction = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="size-8 p-0" variant="ghost">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => actions.onEdit(transaction)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.onDuplicate(transaction)}
                >
                  <Copy className="mr-2 size-4" />
                  Duplikat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(transaction)}
                >
                  <Trash2 className="mr-2 size-4 text-destructive" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      };
    }
    return column;
  });
}
