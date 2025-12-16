"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddCategoryDialog } from "@/components/add-category-dialog";
import { useTRPC } from "@/trpc/client";
import CategoriesList from "./categories-list";

export default function CategoriesTab() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const trpc = useTRPC();

  const { data: categories, isLoading: isLoadingCategories } = useQuery(
    trpc.category.getAll.queryOptions(),
  );
  const { data: stats, isLoading: isLoadingStats } = useQuery(
    trpc.category.getStats.queryOptions(),
  );

  // Combine categories with their stats
  const categoriesWithStats =
    categories?.map((category) => ({
      ...category,
      stats: stats?.find((s) => s.categoryId === category.id) ?? {
        totalTransactions: 0,
        totalAmount: 0,
      },
    })) ?? [];

  const isLoading = isLoadingCategories || isLoadingStats;

  return (
    <Card className="mt-4">
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>
            Kelola kategori untuk mengelompokkan transaksi Anda.
          </CardDescription>
        </div>
        <CardAction>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusIcon className="size-4" />
            Tambah Kategori
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <CategoriesList
          categories={categoriesWithStats}
          isLoading={isLoading}
        />
      </CardContent>

      <AddCategoryDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </Card>
  );
}
