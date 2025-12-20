"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, TargetIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { JourneyMap } from "../../../_components/journey-map";

export function JourneyMapPageContent({ goalId }: { goalId: string }) {
  const router = useRouter();
  const trpc = useTRPC();

  const {
    data: goal,
    isLoading,
    error,
  } = useQuery(trpc.goal.getById.queryOptions({ id: goalId }));

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <TargetIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Goal tidak ditemukan</h3>
        <p className="text-muted-foreground mb-4">
          Goal yang Anda cari tidak ditemukan atau tidak memiliki akses.
        </p>
        <Button onClick={() => router.push("/goals")} variant="outline">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Kembali ke Goals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium truncate">{goal.name}</h1>
        </div>
      </div>

      <JourneyMap goal={goal} />
    </div>
  );
}
