import { ProductDashboard } from "../../components/ui/ProductDashboard";
import { isModuleKey, type ModuleKey } from "../../lib/module-registry";
import { AuthGuard } from "../../components/ui/AuthGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type InternalPageProps = {
  searchParams: Promise<{
    modulo?: string;
    shop?: string;
  }>;
};

export default async function InternalPage({ searchParams }: InternalPageProps) {
  const params = await searchParams;
  const selectedModule = params.modulo;
  const initialModule: ModuleKey =
    selectedModule && isModuleKey(selectedModule) ? selectedModule : "operativo";

  return (
    <AuthGuard>
      <main className="page-shell">
        <ProductDashboard initialModule={initialModule} shopSlug={params.shop} />
      </main>
    </AuthGuard>
  );
}
