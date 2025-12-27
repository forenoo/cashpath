"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarIcon,
  CheckCircle2Icon,
  CircleIcon,
  FlagIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  RocketIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddAmountToGoalDialog } from "@/components/add-amount-to-goal-dialog";
import { DeleteGoalDialog } from "@/components/delete-goal-dialog";
import { EditGoalSheet } from "@/components/edit-goal-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GoalTransactionHistory } from "./goal-transaction-history";
import { RemoveAmountFromGoalDialog } from "./remove-amount-from-goal-dialog";
import { SavingsProgressChart } from "./savings-progress-chart";

type Milestone = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date | null;
  order: number;
  isCompleted: boolean;
  completedAt: Date | null;
  advice: string | null;
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

type JourneyMapProps = {
  goal: Goal;
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function JourneyMap({ goal }: JourneyMapProps) {
  const router = useRouter();
  const [addAmountOpen, setAddAmountOpen] = useState(false);
  const [removeAmountOpen, setRemoveAmountOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const progress = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100,
  );
  const isCompleted = goal.status === "completed" || progress >= 100;

  // Create journey points: Start -> Milestones -> Goal
  const journeyPoints = [
    {
      type: "start" as const,
      id: "start",
      name: "Mulai",
      targetAmount: 0,
      isCompleted: true,
      isCurrent: goal.currentAmount === 0,
    },
    ...goal.milestones.map((m) => ({
      type: "milestone" as const,
      ...m,
      isCurrent:
        !m.isCompleted &&
        goal.currentAmount < m.targetAmount &&
        (goal.milestones.find(
          (prev) =>
            prev.order === m.order - 1 &&
            goal.currentAmount >= prev.targetAmount,
        ) ||
          m.order === 1),
    })),
    {
      type: "goal" as const,
      id: "goal",
      name: "🎯 Target",
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      isCompleted: isCompleted,
      isCurrent: !isCompleted && goal.milestones.every((m) => m.isCompleted),
    },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Progress Overview Card */}
      <Card className="border shadow-sm">
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge
                variant={
                  goal.status === "completed"
                    ? "success"
                    : goal.status === "cancelled"
                      ? "secondary"
                      : "default"
                }
                className="text-xs"
              >
                {goal.status === "completed"
                  ? "Selesai"
                  : goal.status === "cancelled"
                    ? "Dibatalkan"
                    : "Aktif"}
              </Badge>
              {goal.targetDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(goal.targetDate), "dd MMM yyyy", {
                      locale: id,
                    })}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-2xl font-semibold">{progress.toFixed(1)}%</p>
                {isCompleted && (
                  <span className="text-lg" role="img" aria-label="celebration">
                    🎉
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <Progress
                  value={progress}
                  className={cn("h-1.5", isCompleted && "[&>div]:bg-green-500")}
                />
                <div className="flex items-center mt-4 justify-between">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">
                      Tabungan Saat Ini
                    </span>
                    <span>{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-right text-xs">
                      Target
                    </span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setAddAmountOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          <span className="truncate">Tambah</span>
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setRemoveAmountOpen(true)}
          disabled={goal.currentAmount <= 0}
        >
          <MinusIcon className="h-4 w-4" />
          <span className="truncate">Kurangi</span>
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setEditOpen(true)}
        >
          <PencilIcon className="h-4 w-4" />
          <span className="truncate">Edit</span>
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon className="h-4 w-4" />
          <span className="truncate">Hapus</span>
        </Button>
      </div>

      {/* Dialogs */}
      <AddAmountToGoalDialog
        goal={goal}
        open={addAmountOpen}
        onOpenChange={setAddAmountOpen}
      />
      <RemoveAmountFromGoalDialog
        goal={goal}
        open={removeAmountOpen}
        onOpenChange={setRemoveAmountOpen}
      />
      <EditGoalSheet goal={goal} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteGoalDialog
        goal={goal}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.push("/goals")}
      />

      {/* Savings Progress Chart */}
      <SavingsProgressChart
        goalId={goal.id}
        goalCreatedAt={new Date(goal.createdAt)}
      />

      {/* Transaction History */}
      <GoalTransactionHistory
        goalId={goal.id}
        goalCreatedAt={new Date(goal.createdAt)}
      />

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-8 bottom-0 w-px bg-border">
          <div
            className={cn(
              "absolute top-0 w-full transition-all duration-1000 ease-out",
              isCompleted ? "bg-green-500" : "bg-primary",
            )}
            style={{
              height: `${progress}%`,
            }}
          />
        </div>

        {/* Journey Points */}
        <div className="space-y-3">
          {journeyPoints.map((point) => {
            const pointProgress =
              point.targetAmount === 0
                ? 100
                : Math.min(
                    (goal.currentAmount / point.targetAmount) * 100,
                    100,
                  );

            const isPast = point.isCompleted || pointProgress >= 100;
            const isActive = point.isCurrent;

            return (
              <div key={point.id} className="relative flex items-start gap-3">
                {/* Timeline Marker */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border",
                      isPast
                        ? "bg-green-500 text-white border-green-600"
                        : isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border",
                    )}
                  >
                    {point.type === "start" ? (
                      <RocketIcon className="h-3.5 w-3.5" />
                    ) : point.type === "goal" ? (
                      <FlagIcon className="h-3.5 w-3.5" />
                    ) : point.isCompleted ? (
                      <CheckCircle2Icon className="h-3.5 w-3.5" />
                    ) : (
                      <CircleIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
                {/* Content Card */}
                <Card
                  className={cn(
                    "flex-1 transition-all duration-300 border shadow-sm",
                    isActive && "border-primary/50",
                    isPast &&
                      "border-green-500/20 bg-green-50/50 dark:bg-green-950/5",
                  )}
                >
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between w-full">
                        <h3
                          className={cn(
                            "text-sm font-medium",
                            isPast && "text-green-700 dark:text-green-400",
                            isActive && "text-primary",
                          )}
                        >
                          {point.name}
                        </h3>
                        {isPast && point.type !== "start" && (
                          <Badge
                            variant="success"
                            className="text-xs h-4 px-1.5"
                          >
                            Tercapai
                          </Badge>
                        )}
                        {isActive && (
                          <Badge
                            variant="default"
                            className="text-xs h-4 px-1.5"
                          >
                            Saat Ini
                          </Badge>
                        )}
                      </div>

                      {point.targetAmount > 0 && (
                        <div className="space-y-2">
                          {point.type === "milestone" && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Progress
                                </span>
                                <span className="font-medium text-muted-foreground">
                                  {pointProgress.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={pointProgress}
                                className={cn(
                                  "h-1",
                                  isPast && "[&>div]:bg-green-500",
                                )}
                              />
                            </div>
                          )}
                          {point.type === "milestone" && point.advice && (
                            <div
                              className={cn(
                                "mt-2 p-2.5 rounded-md border",
                                isPast
                                  ? "bg-green-50/50 dark:bg-green-950/10 border-green-200/50 dark:border-green-800/30"
                                  : "bg-muted/50 border-border/50",
                              )}
                            >
                              <p
                                className={cn(
                                  "text-xs leading-relaxed",
                                  isPast
                                    ? "text-green-700/80 dark:text-green-400/80"
                                    : "text-muted-foreground",
                                )}
                              >
                                💡 {point.advice}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1">
                        {point.targetDate && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>
                              {format(
                                new Date(point.targetDate),
                                "dd MMM yyyy",
                                {
                                  locale: id,
                                },
                              )}
                            </span>
                          </div>
                        )}

                        {point.type === "milestone" &&
                          point.isCompleted &&
                          point.completedAt && (
                            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2Icon className="h-3 w-3" />
                              <span>
                                Dicapai{" "}
                                {format(
                                  new Date(point.completedAt),
                                  "dd MMM yyyy",
                                  { locale: id },
                                )}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-600" />
          <span>Tercapai</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary border border-primary" />
          <span>Saat ini</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-background border border-border" />
          <span>Belum tercapai</span>
        </div>
      </div>
    </div>
  );
}
