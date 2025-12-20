"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarIcon,
  CheckCircle2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  TargetIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

type GoalCardProps = {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onAddAmount: (goal: Goal) => void;
  onRegenerateMilestones: (goal: Goal) => void;
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

const statusConfig = {
  active: {
    label: "Aktif",
    variant: "default" as const,
    icon: TargetIcon,
  },
  completed: {
    label: "Selesai",
    variant: "success" as const,
    icon: CheckCircle2Icon,
  },
  cancelled: {
    label: "Dibatalkan",
    variant: "secondary" as const,
    icon: XCircleIcon,
  },
};

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAddAmount,
  onRegenerateMilestones,
}: GoalCardProps) {
  const router = useRouter();

  const progress = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100,
  );
  const completedMilestones = goal.milestones.filter(
    (m) => m.isCompleted,
  ).length;
  const totalMilestones = goal.milestones.length;
  const status = statusConfig[goal.status];

  // Calculate remaining amount
  const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <Card className={cn("gap-0", goal.status !== "active" && "opacity-75")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={
                  goal.status === "completed"
                    ? "success"
                    : goal.status === "cancelled"
                      ? "secondary"
                      : "default"
                }
              >
                <status.icon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {goal.targetDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(new Date(goal.targetDate), "dd MMM yyyy", {
                    locale: id,
                  })}
                </span>
              )}
            </div>
            <CardTitle className="text-lg truncate">{goal.name}</CardTitle>
            <CardDescription className="mt-1">
              {formatCurrency(goal.currentAmount)} dari{" "}
              {formatCurrency(goal.targetAmount)}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Opsi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {goal.status === "active" && (
                <>
                  <DropdownMenuItem onClick={() => onAddAmount(goal)}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Tambah Tabungan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRegenerateMilestones(goal)}
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Regenerate Milestone
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(goal)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="h-4 w-4 mr-2 text-destructive" />
                Hapus Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(
              "h-2",
              goal.status === "completed" && "[&>div]:bg-green-500",
            )}
          />
          {goal.status === "active" && remainingAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Sisa {formatCurrency(remainingAmount)} lagi
            </p>
          )}
        </div>

        {/* Milestone Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Milestone</span>
          <span className="font-medium">
            {completedMilestones} / {totalMilestones} tercapai
          </span>
        </div>

        {/* View Journey Map Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-3"
          onClick={() => router.push(`/goals/${goal.id}/journey`)}
        >
          Lihat Journey Map
        </Button>

        {/* Quick Action for Active Goals */}
        {goal.status === "active" && (
          <Button className="w-full" onClick={() => onAddAmount(goal)}>
            <PlusCircleIcon className="h-4 w-4" />
            Tambah Tabungan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
