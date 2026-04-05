import { useState, useEffect, useCallback } from 'react';
import { fetchPublic, ApiResponse } from '../lib/apiClient';

export interface Order {
  folio: string;
  status: string;
  deviceType: string;
  deviceModel: string;
  reportedIssue: string;
  promisedDate: string;
  progressPhotos: string[];
}

export function useOrderTracking(folio: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (folioString: string) => {
    if (!folioString.trim()) return;

    setLoading(true);
    setError(null);

    const result = await fetchPublic<Order>(`/api/portal/orders/${folioString.trim().toUpperCase()}`);

    if (result.success && result.data) {
      setOrder(result.data);
      setError(null);
    } else {
      setOrder(null);
      setError(result.error?.message || 'No se pudo encontrar la orden.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (folio) {
      fetchOrder(folio);
    } else {
      setOrder(null);
      setLoading(false);
      setError(null);
    }
  }, [folio, fetchOrder]);

  return { order, loading, error, refresh: () => folio && fetchOrder(folio) };
}
