import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { JourneyMapPageContent } from "./_components/journey-map-page-content";

export default async function JourneyMapPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { goalId } = await params;
  const queryClient = getQueryClient();

  // Prefetch goal data
  await queryClient.prefetchQuery(
    trpc.goal.getById.queryOptions({ id: goalId }),
  );

  return (
    <HydrateClient>
      <main className="maxContainer">
        <JourneyMapPageContent goalId={goalId} />
      </main>
    </HydrateClient>
  );
}
