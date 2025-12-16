import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import TransactionsContent from "./_components/transactions-content";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // Prefetch data on the server
  await Promise.all([
    queryClient.prefetchQuery(
      trpc.transaction.getAll.queryOptions({ page: 1, limit: 10 }),
    ),
    queryClient.prefetchQuery(trpc.category.getAll.queryOptions()),
    queryClient.prefetchQuery(trpc.wallet.getAll.queryOptions()),
    queryClient.prefetchQuery(trpc.transaction.getStats.queryOptions({})),
  ]);

  return (
    <HydrateClient>
      <main className="maxContainer">
        <TransactionsContent />
      </main>
    </HydrateClient>
  );
}
