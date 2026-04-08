import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useUpdateShopSettings() {
  const [updating, setUpdating] = useState(false);

  const updateSettings = async (shopId: string, settings: { isMicrositeEnabled: boolean }) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ 
          is_microsite_enabled: settings.isMicrositeEnabled 
        })
        .eq('id', shopId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      return { success: false, error };
    } finally {
      setUpdating(false);
    }
  };

  return { updateSettings, updating };
}
