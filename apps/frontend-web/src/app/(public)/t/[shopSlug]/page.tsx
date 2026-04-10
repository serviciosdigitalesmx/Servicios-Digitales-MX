export const dynamic = "force-dynamic";
export const revalidate = 0;

import { ShopPremiumBluePage } from "../../../../components/ui/ShopPremiumBluePage";

interface ShopPageProps {
  params: Promise<{ shopSlug: string }>;
}

export default function ShopPremiumPage({ params }: ShopPageProps) {
  return <ShopPremiumBluePage params={params} />;
}
