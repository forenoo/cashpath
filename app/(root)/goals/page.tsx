import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { GoalsContent } from "./_components/goals-content";

export default async function GoalsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // Prefetch goals data
  await queryClient.prefetchQuery(trpc.goal.getAll.queryOptions());

  return (
    <HydrateClient>
      <main className="maxContainer">
        <GoalsContent />
      </main>
    </HydrateClient>
  );
}
