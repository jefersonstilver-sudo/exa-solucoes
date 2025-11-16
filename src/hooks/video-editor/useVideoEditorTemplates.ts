import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VideoEditorTemplate {
  id: string;
  title: string;
  description: string | null;
  category: 'social_media' | 'youtube' | 'tiktok' | 'business' | 'educational' | 'promotional';
  thumbnail_url: string | null;
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:3';
  duration: number;
  project_data: any;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface UseTemplatesFilters {
  category?: string;
}

export const useVideoEditorTemplates = (filters?: UseTemplatesFilters) => {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['video-editor-templates', filters],
    queryFn: async () => {
      let query = supabase
        .from('video_editor_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return ((data || []) as any[]).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        thumbnail_url: t.thumbnail_url,
        aspect_ratio: t.aspect_ratio,
        duration: t.duration,
        project_data: t.project_data,
        is_active: t.is_active,
        usage_count: t.usage_count || 0,
        created_at: t.created_at,
        updated_at: t.updated_at,
        created_by: t.created_by
      }));
    },
  });

  return {
    templates,
    isLoading,
  };
};
