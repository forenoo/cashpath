"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookmarkPlus,
  FolderOpen,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateProjections,
  type Frequency,
  type ScenarioItem,
} from "@/lib/validations/simulation";
import { useTRPC } from "@/trpc/client";
import { ProjectionChart } from "./projection-chart";
import { ScenarioBuilder } from "./scenario-builder";
import { ScenarioSummary } from "./scenario-summary";

export function SimulationContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // State
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [items, setItems] = useState<ScenarioItem[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(
    null,
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

  // Fetch saved scenarios
  const { data: savedScenarios, isLoading: isLoadingScenarios } = useQuery(
    trpc.simulation.getAll.queryOptions(),
  );

  // Mutations
  const createMutation = useMutation(
    trpc.simulation.create.mutationOptions({
      onSuccess: (data) => {
        setCurrentScenarioId(data.id);
        toast.success("Skenario berhasil disimpan!");
        queryClient.invalidateQueries({
          queryKey: trpc.simulation.getAll.queryKey(),
        });
        setSaveDialogOpen(false);
      },
      onError: () => {
        toast.error("Gagal menyimpan skenario");
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.simulation.update.mutationOptions({
      onSuccess: () => {
        toast.success("Skenario berhasil diperbarui!");
        queryClient.invalidateQueries({
          queryKey: trpc.simulation.getAll.queryKey(),
        });
        setSaveDialogOpen(false);
      },
      onError: () => {
        toast.error("Gagal memperbarui skenario");
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.simulation.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Skenario berhasil dihapus!");
        queryClient.invalidateQueries({
          queryKey: trpc.simulation.getAll.queryKey(),
        });
        if (currentScenarioId === scenarioToDelete) {
          handleReset();
        }
        setDeleteDialogOpen(false);
        setScenarioToDelete(null);
      },
      onError: () => {
        toast.error("Gagal menghapus skenario");
      },
    }),
  );

  // Calculate totals and net
  const { totalIncome, totalExpense, net, projections } = useMemo(() => {
    const income = items
      .filter((i) => i.type === "income")
      .reduce((sum, i) => sum + i.amount, 0);
    const expense = items
      .filter((i) => i.type === "expense")
      .reduce((sum, i) => sum + i.amount, 0);
    const netAmount = income - expense;
    const proj = calculateProjections(netAmount, frequency);

    return {
      totalIncome: income,
      totalExpense: expense,
      net: netAmount,
      projections: proj,
    };
  }, [items, frequency]);

  // Handle frequency change
  const handleFrequencyChange = (value: string) => {
    setFrequency(value as Frequency);
  };

  // Handle save scenario
  const handleSave = () => {
    if (!scenarioName.trim()) {
      toast.error("Nama skenario harus diisi");
      return;
    }

    if (items.length === 0) {
      toast.error("Tambahkan minimal 1 item");
      return;
    }

    const data = {
      name: scenarioName,
      items,
      frequency,
      netMonthly: projections.monthly,
      projection1Year: projections.yearly,
      projection5Years: projections.fiveYearWithInterest,
    };

    if (currentScenarioId) {
      updateMutation.mutate({ ...data, id: currentScenarioId });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle load scenario
  const handleLoadScenario = (id: string) => {
    const scenario = savedScenarios?.find((s) => s.id === id);
    if (scenario) {
      setItems(scenario.items);
      setFrequency(scenario.frequency as Frequency);
      setScenarioName(scenario.name);
      setCurrentScenarioId(scenario.id);
      setLoadDialogOpen(false);
      toast.success(`Skenario "${scenario.name}" dimuat`);
    }
  };

  // Handle delete scenario
  const handleDeleteScenario = (id: string) => {
    setScenarioToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (scenarioToDelete) {
      deleteMutation.mutate({ id: scenarioToDelete });
    }
  };

  // Handle reset
  const handleReset = () => {
    setItems([]);
    setScenarioName("");
    setCurrentScenarioId(null);
  };

  const hasItems = items.length > 0;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:justify-between md:pt-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Image
            alt="time machine"
            className="shrink-0"
            height={48}
            src="/time-machine.svg"
            width={48}
          />
          <div className="space-y-1">
            <h1 className="font-medium text-2xl md:text-3xl">
              Mesin Waktu Keuangan
            </h1>
            <p className="text-muted-foreground">
              Buat skenario keuangan kustommu dan lihat proyeksi jangka panjang.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Frequency Toggle */}
          <Tabs value={frequency} onValueChange={handleFrequencyChange}>
            <TabsList>
              <TabsTrigger value="daily">Harian</TabsTrigger>
              <TabsTrigger value="monthly">Bulanan</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <FolderOpen className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLoadDialogOpen(true)}
                disabled={!savedScenarios?.length}
              >
                <FolderOpen className="size-4" />
                Muat Skenario
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSaveDialogOpen(true)}
                disabled={!hasItems}
              >
                <Save className="size-4" />
                {currentScenarioId ? "Perbarui Skenario" : "Simpan Skenario"}
              </DropdownMenuItem>
              {currentScenarioId && (
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentScenarioId(null);
                    setScenarioName("");
                  }}
                >
                  <BookmarkPlus className="size-4" />
                  Simpan Sebagai Baru
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleReset}
                disabled={!hasItems}
                className="text-destructive focus:text-destructive"
              >
                <RotateCcw className="size-4 text-destructive" />
                Reset Skenario
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Current Scenario Badge */}
      {currentScenarioId && scenarioName && (
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary text-sm">
            📁 {scenarioName}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="mt-8 space-y-8">
        {/* Scenario Builder */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h2 className="font-medium text-lg">Buat Skenario</h2>
          </div>
          <ScenarioBuilder items={items} onItemsChange={setItems} />
        </section>

        {/* Summary */}
        {hasItems && (
          <section>
            <h2 className="mb-4 font-medium text-lg">Ringkasan & Proyeksi</h2>
            <ScenarioSummary
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              net={net}
              frequency={frequency}
              projections={projections}
            />
          </section>
        )}

        {/* Projection Chart */}
        {hasItems && net !== 0 && (
          <section>
            <ProjectionChart
              yearlyAmount={projections.yearly}
              isNegative={net < 0}
            />
          </section>
        )}

        {/* Empty State Guide */}
        {!hasItems && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-8 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-lg">Mulai Buat Skenario</h3>
            <p className="mx-auto mb-4 max-w-md text-muted-foreground">
              Tambahkan pemasukan dan pengeluaran untuk melihat proyeksi
              keuanganmu dalam jangka panjang.
            </p>
            <div className="mx-auto max-w-lg rounded-lg bg-muted/50 p-4 text-left">
              <p className="mb-2 font-medium text-sm">💡 Contoh penggunaan:</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>
                  • Pemasukan: Gaji Rp 10.000.000/bulan, Freelance Rp
                  2.000.000/bulan
                </li>
                <li>
                  • Pengeluaran: Kos Rp 2.500.000, Makan Rp 3.000.000, Transport
                  Rp 500.000
                </li>
                <li>• Lihat berapa tabungan bersihmu dalam 5 tahun!</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentScenarioId ? "Perbarui Skenario" : "Simpan Skenario"}
            </DialogTitle>
            <DialogDescription>
              Simpan skenario ini agar bisa dimuat kembali nanti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Nama Skenario</Label>
              <Input
                id="scenario-name"
                placeholder="cth: Budget Bulanan 2024"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Muat Skenario</DialogTitle>
            <DialogDescription>
              Pilih skenario yang ingin dimuat.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-75 space-y-2 overflow-y-auto py-4">
            {isLoadingScenarios ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : savedScenarios?.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada skenario tersimpan
              </p>
            ) : (
              savedScenarios?.map((scenario) => (
                <div
                  key={scenario.id}
                  className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => handleLoadScenario(scenario.id)}
                  >
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {scenario.items.length} item •{" "}
                      {scenario.frequency === "daily" ? "Harian" : "Bulanan"}
                    </p>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteScenario(scenario.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Skenario?</AlertDialogTitle>
            <AlertDialogDescription>
              Skenario yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
