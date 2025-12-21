import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { SimulationContent } from "./_components/simulation-content";

export default async function TimeMachinePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // Prefetch saved scenarios
  await queryClient.prefetchQuery(trpc.simulation.getAll.queryOptions());

  return (
    <HydrateClient>
      <main className="maxContainer">
        <SimulationContent />
      </main>
    </HydrateClient>
  );
}
