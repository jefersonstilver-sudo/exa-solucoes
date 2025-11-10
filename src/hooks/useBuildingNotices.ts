import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BuildingNotice {
  id: string;
  title: string;
  content: string;
  icon: string;
  background_color: string;
  text_color: string;
  display_order: number;
}

const fetchBuildingNotices = async (buildingId: string): Promise<BuildingNotice[]> => {
  if (!buildingId) return [];
  
  const { data, error } = await supabase
    .from('building_notices' as any)
    .select('id, title, content, icon, background_color, text_color, display_order')
    .eq('building_id', buildingId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar avisos:', error);
    return [];
  }
  
  return (data as any[])?.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    icon: item.icon,
    background_color: item.background_color,
    text_color: item.text_color,
    display_order: item.display_order
  })) || [];
};

export const useBuildingNotices = (buildingId: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['buildingNotices', buildingId],
    queryFn: () => fetchBuildingNotices(buildingId),
    enabled: !!buildingId,
    staleTime: 300000, // 5 minutos
    refetchInterval: 300000, // Refetch a cada 5 minutos
  });

  return {
    notices: data || [],
    loading: isLoading,
    error: error?.message || null,
    refresh: refetch
  };
};
