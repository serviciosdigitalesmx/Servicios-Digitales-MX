import { useState, useEffect } from 'react';

export function useShopBranding(slug: string) {
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      try {
        // Apuntamos a tu API de Render que ya está Healthy
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/shops/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setShopData(data);
        }
      } catch (error) {
        console.error("Error al cargar datos del taller:", error);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchShop();
  }, [slug]);

  return { shopData, loading };
}
