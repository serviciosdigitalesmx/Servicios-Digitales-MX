import { ShopMicrosite } from "../../../../components/ui/ShopMicrosite";

export default async function ShopPremiumPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const resolvedParams = await params;
  return <ShopMicrosite shopSlug={resolvedParams.shopSlug} />;
}
