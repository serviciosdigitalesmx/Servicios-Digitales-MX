import { BillingConsole } from "../../components/ui/BillingConsole";
import { AuthGuard } from "../../components/ui/AuthGuard";
import { PlanLevel } from "../../lib/subscription";

type BillingPageProps = {
  searchParams: Promise<{
    plan?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;

  return (
    <AuthGuard>
      <main className="page-shell">
        <BillingConsole initialPlanCode={params.plan as PlanLevel} />
      </main>
    </AuthGuard>
  );
}
