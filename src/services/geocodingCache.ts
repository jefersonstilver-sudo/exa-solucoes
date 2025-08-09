import { supabase } from '@/integrations/supabase/client';

export async function getPersistentGeocode(params: { address: string; buildingId?: string }): Promise<{ coords?: { lat: number; lng: number }; precise?: boolean } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('geocode_v1', {
      body: { address: params.address, building_id: params.buildingId },
    });
    if (error) return null;
    if (data?.lat != null && data?.lng != null) {
      return {
        coords: { lat: Number(data.lat), lng: Number(data.lng) },
        precise: String(data.precision || '').toLowerCase() === 'rooftop',
      };
    }
    return null;
  } catch (e) {
    console.warn('getPersistentGeocode error', e);
    return null;
  }
}
