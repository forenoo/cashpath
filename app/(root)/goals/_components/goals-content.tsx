"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon, TargetIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AddAmountToGoalDialog } from "@/components/add-amount-to-goal-dialog";
import { AddGoalSheet } from "@/components/add-goal-sheet";
import { DeleteGoalDialog } from "@/components/delete-goal-dialog";
import { EditGoalSheet } from "@/components/edit-goal-sheet";
import { RegenerateMilestonesDialog } from "@/components/regenerate-milestones-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/trpc/client";
import { GoalCard } from "./goal-card";

type Milestone = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date | null;
  order: number;
  isCompleted: boolean;
  completedAt: Date | null;
};

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  milestones: Milestone[];
};

export function GoalsContent() {
  const trpc = useTRPC();

  // Dialog states
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addAmountDialogOpen, setAddAmountDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Fetch goals
  const { data: goals, isLoading } = useQuery(trpc.goal.getAll.queryOptions());

  // Filter goals by status
  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];
  const completedGoals = goals?.filter((g) => g.status === "completed") ?? [];
  const cancelledGoals = goals?.filter((g) => g.status === "cancelled") ?? [];

  // Handlers
  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditSheetOpen(true);
  };

  const handleDelete = (goal: Goal) => {
    setSelectedGoal(goal);
    setDeleteDialogOpen(true);
  };

  const handleAddAmount = (goal: Goal) => {
    setSelectedGoal(goal);
    setAddAmountDialogOpen(true);
  };

  const handleRegenerateMilestones = (goal: Goal) => {
    setSelectedGoal(goal);
    setRegenerateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !goals || goals.length === 0;

  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:justify-between md:pt-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Image
            alt="transactions"
            className="shrink-0"
            height={48}
            src="/transactions.svg"
            width={48}
          />
          <div className="space-y-1">
            <h1 className="font-medium text-2xl md:text-3xl">
              Tujuan Menabung
            </h1>
            <p className="text-muted-foreground">
              Atur dan lacak goal tabunganmu untuk mencapai target finansial
              dengan mudah.
            </p>
          </div>
        </div>
        <Button onClick={() => setAddSheetOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          Buat Goal Baru
        </Button>
      </header>

      {isEmpty ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <TargetIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Belum ada tujuan</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Mulai perjalanan finansialmu dengan membuat goal tabungan pertama.
            Sistem akan generate milestone otomatis untukmu!
          </p>
          <Button onClick={() => setAddSheetOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Buat Goal Pertama
          </Button>
        </div>
      ) : (
        // Goals Tabs
        <Tabs defaultValue="active" className="w-full mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              Aktif ({activeGoals.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Selesai ({completedGoals.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Dibatalkan ({cancelledGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Tidak ada goal aktif</p>
                <Button
                  variant="link"
                  onClick={() => setAddSheetOpen(true)}
                  className="mt-2"
                >
                  Buat goal baru
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal as Goal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddAmount={handleAddAmount}
                    onRegenerateMilestones={handleRegenerateMilestones}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            {completedGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Belum ada goal yang selesai</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal as Goal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddAmount={handleAddAmount}
                    onRegenerateMilestones={handleRegenerateMilestones}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-0">
            {cancelledGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Tidak ada goal yang dibatalkan</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cancelledGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal as Goal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddAmount={handleAddAmount}
                    onRegenerateMilestones={handleRegenerateMilestones}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs & Sheets */}
      <AddGoalSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />

      <EditGoalSheet
        goal={
          selectedGoal
            ? {
                id: selectedGoal.id,
                name: selectedGoal.name,
                targetAmount: selectedGoal.targetAmount,
                currentAmount: selectedGoal.currentAmount,
                targetDate: selectedGoal.targetDate,
                status: selectedGoal.status,
              }
            : null
        }
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />

      <DeleteGoalDialog
        goal={
          selectedGoal
            ? {
                id: selectedGoal.id,
                name: selectedGoal.name,
                targetAmount: selectedGoal.targetAmount,
                currentAmount: selectedGoal.currentAmount,
              }
            : null
        }
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      <AddAmountToGoalDialog
        goal={
          selectedGoal
            ? {
                id: selectedGoal.id,
                name: selectedGoal.name,
                targetAmount: selectedGoal.targetAmount,
                currentAmount: selectedGoal.currentAmount,
              }
            : null
        }
        open={addAmountDialogOpen}
        onOpenChange={setAddAmountDialogOpen}
      />

      <RegenerateMilestonesDialog
        goalId={selectedGoal?.id ?? null}
        goalName={selectedGoal?.name ?? ""}
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
      />
    </>
  );
}
