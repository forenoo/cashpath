import { endOfDay, startOfDay, subDays } from "date-fns";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import DashboardContent from "./_components/dashboard-content";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // Default date range: last 30 days
  const defaultDateRange = {
    startDate: startOfDay(subDays(new Date(), 29)),
    endDate: endOfDay(new Date()),
  };

  // Prefetch all dashboard data
  await Promise.all([
    queryClient.prefetchQuery(trpc.category.getAll.queryOptions()),
    queryClient.prefetchQuery(trpc.wallet.getAll.queryOptions()),
    queryClient.prefetchQuery(
      trpc.transaction.getStats.queryOptions(defaultDateRange),
    ),
    queryClient.prefetchQuery(
      trpc.transaction.getRecent.queryOptions({ limit: 5 }),
    ),
    queryClient.prefetchQuery(
      trpc.transaction.getMonthlyStats.queryOptions({ months: 6 }),
    ),
  ]);

  return (
    <HydrateClient>
      <main className="maxContainer">
        <DashboardContent userName={session.user?.name || ""} />
      </main>
    </HydrateClient>
  );
}
