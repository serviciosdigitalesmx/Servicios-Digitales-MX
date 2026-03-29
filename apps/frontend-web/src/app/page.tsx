import { ProductDashboard } from "../components/ui/ProductDashboard";
import { isModuleKey, type ModuleKey } from "../lib/module-registry";

type HomePageProps = {
  searchParams: Promise<{
    modulo?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const selectedModule = params.modulo;
  const initialModule: ModuleKey =
    selectedModule && isModuleKey(selectedModule) ? selectedModule : "operativo";

  return (
    <main className="page-shell">
      <ProductDashboard initialModule={initialModule} />
    </main>
  );
}
