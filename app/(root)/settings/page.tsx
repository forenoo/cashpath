import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import SettingsContent from "./_components/settings-content";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // Prefetch categories, wallets, and their stats
  await Promise.all([
    queryClient.prefetchQuery(trpc.category.getAll.queryOptions()),
    queryClient.prefetchQuery(trpc.category.getStats.queryOptions()),
    queryClient.prefetchQuery(trpc.wallet.getAll.queryOptions()),
    queryClient.prefetchQuery(trpc.wallet.getStats.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <main className="maxContainer">
        <SettingsContent />
      </main>
    </HydrateClient>
  );
}
