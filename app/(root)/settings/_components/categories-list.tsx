"use client";

import { useState } from "react";
import {
  FolderIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditCategoryDialog } from "@/components/edit-category-dialog";
import { DeleteCategoryDialog } from "@/components/delete-category-dialog";

type CategoryWithStats = {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  icon: string | null;
  userId: string;
  createdAt: Date;
  stats: {
    totalTransactions: number;
    totalAmount: number;
  };
};

type CategoriesListProps = {
  categories: CategoryWithStats[];
  isLoading: boolean;
};

const categoryTypeLabels = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  both: "Keduanya",
};

const categoryTypeVariants = {
  income: "default" as const,
  expense: "destructive" as const,
  both: "secondary" as const,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CategoriesList({
  categories,
  isLoading,
}: CategoriesListProps) {
  const [editCategory, setEditCategory] = useState<CategoryWithStats | null>(
    null,
  );
  const [deleteCategory, setDeleteCategory] =
    useState<CategoryWithStats | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <FolderIcon className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium text-lg">Belum ada kategori</h3>
        <p className="text-muted-foreground text-sm">
          Tambahkan kategori pertama Anda untuk mengelompokkan transaksi.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead className="text-right">Jumlah Transaksi</TableHead>
            <TableHead className="text-right">Total Nominal</TableHead>
            <TableHead className="w-[120px] text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <FolderIcon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={categoryTypeVariants[category.type]}>
                  {categoryTypeLabels[category.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {category.stats.totalTransactions}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(category.stats.totalAmount)}
              </TableCell>
              <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Buka menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditCategory(category)}>
                      <PencilIcon className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteCategory(category)}
                    >
                      <Trash2Icon className="mr-2 text-destructive size-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditCategoryDialog
        open={!!editCategory}
        onOpenChange={(open) => !open && setEditCategory(null)}
        category={editCategory}
      />

      <DeleteCategoryDialog
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        category={deleteCategory}
      />
    </>
  );
}
