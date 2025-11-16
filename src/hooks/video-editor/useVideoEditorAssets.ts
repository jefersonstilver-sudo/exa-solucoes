import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VideoEditorAsset, AssetType } from '@/types/videoEditor';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 20;

/**
 * Hook to manage video editor assets
 */
export const useVideoEditorAssets = (filters?: {
  type?: AssetType;
  projectId?: string;
  search?: string;
}) => {
  const queryClient = useQueryClient();

  // Infinite query for lazy loading
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['video-editor-assets', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('video_editor_assets')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

      // Apply filters
      if (filters?.type) {
        query = query.eq('asset_type', filters.type);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.search) {
        query = query.ilike('file_name', `%${filters.search}%`);
      }

      const { data: assets, error, count } = await query;

      if (error) throw error;

      return {
        assets: (assets || []).map(asset => ({
          ...asset,
          asset_type: asset.asset_type as AssetType,
          metadata: asset.metadata as any
        })) as VideoEditorAsset[],
        nextCursor: count && count > (pageParam + 1) * ITEMS_PER_PAGE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0
  });

  // Flatten paginated results
  const assets = data?.pages.flatMap(page => page.assets) || [];

  // Delete asset
  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      // Get asset to delete file from storage
      const { data: asset, error: fetchError } = await supabase
        .from('video_editor_assets')
        .select('file_url')
        .eq('id', assetId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const filePath = asset.file_url.split('/').slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('video-editor-assets')
        .remove([filePath]);

      if (storageError) console.error('Storage delete error:', storageError);

      // Soft delete from database
      const { error } = await supabase
        .from('video_editor_assets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-editor-assets'] });
      toast.success('Asset excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir asset: ' + error.message);
    }
  });

  return {
    assets,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    deleteAsset: deleteAsset.mutate,
    isDeleting: deleteAsset.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['video-editor-assets'] })
  };
};
