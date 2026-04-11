"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "../../../components/ui/AuthGuard";
import { ProductDashboard } from "../../../components/ui/ProductDashboard";
import { isModuleKey } from "../../../lib/module-registry";

function HubContent() {
  const searchParams = useSearchParams();
  const requestedModule = searchParams.get("modulo") || "operativo";
  const initialModule = isModuleKey(requestedModule) ? requestedModule : "operativo";

  return (
    <AuthGuard>
      <ProductDashboard initialModule={initialModule} />
    </AuthGuard>
  );
}

export default function HubPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Cargando panel real...</div>}>
      <HubContent />
    </Suspense>
  );
}
