import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import DashboardContent from "./_components/dashboard-content";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // Prefetch categories and wallets for the add transaction sheet
  await Promise.all([
    queryClient.prefetchQuery(trpc.category.getAll.queryOptions()),
    queryClient.prefetchQuery(trpc.wallet.getAll.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <main className="maxContainer">
        <DashboardContent userName={session.user?.name || ""} />
      </main>
    </HydrateClient>
  );
}
