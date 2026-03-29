import { BillingConsole } from "../../components/ui/BillingConsole";

type BillingPageProps = {
  searchParams: Promise<{
    plan?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <BillingConsole initialPlanCode={params.plan} />
    </main>
  );
}
