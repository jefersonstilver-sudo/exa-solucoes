import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to check and manage video editor access
 */
export const useEditorAccess = () => {
  const queryClient = useQueryClient();

  // Check if current user has access to video editor
  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ['video-editor-access'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('users')
        .select('can_use_video_editor, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return data.can_use_video_editor === true || data.role === 'super_admin';
    }
  });

  // Log access event
  const logAccess = useMutation({
    mutationFn: async ({
      eventType,
      projectId,
      details
    }: {
      eventType: 'access' | 'create' | 'edit' | 'export' | 'delete' | 'share';
      projectId?: string;
      details?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('video_editor_access_logs')
        .insert({
          user_id: user.id,
          event_type: eventType,
          project_id: projectId,
          details: details || {},
          user_agent: navigator.userAgent
        });

      if (error) throw error;
    }
  });

  return {
    hasAccess: hasAccess || false,
    isLoading,
    logAccess: logAccess.mutate
  };
};

/**
 * Hook to manage user access (Super Admin only)
 */
export const useManageEditorAccess = () => {
  const queryClient = useQueryClient();

  // Get all users with their access status
  const { data: users, isLoading } = useQuery({
    queryKey: ['video-editor-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, can_use_video_editor, video_editor_enabled_at, video_editor_enabled_by, role')
        .order('email');

      if (error) throw error;
      return data;
    }
  });

  // Toggle user access
  const toggleAccess = useMutation({
    mutationFn: async ({ userId, enable }: { userId: string; enable: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update({
          can_use_video_editor: enable,
          video_editor_enabled_at: enable ? new Date().toISOString() : null,
          video_editor_enabled_by: enable ? user.id : null
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase.from('video_editor_access_logs').insert({
        user_id: userId,
        event_type: 'access',
        details: { action: enable ? 'enabled' : 'disabled', by_admin: user.id }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-editor-users'] });
      toast.success('Acesso atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar acesso: ' + error.message);
    }
  });

  // Get editor statistics
  const { data: stats } = useQuery({
    queryKey: ['video-editor-stats'],
    queryFn: async () => {
      const [usersCount, projectsCount, exportsToday, activeToday] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('can_use_video_editor', true),
        supabase.from('video_editor_projects').select('id', { count: 'exact', head: true }),
        supabase
          .from('video_editor_access_logs')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'export')
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase
          .from('video_editor_access_logs')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      return {
        users_with_access: usersCount.count || 0,
        total_projects: projectsCount.count || 0,
        exports_today: exportsToday.count || 0,
        active_users_today: activeToday.count || 0
      };
    }
  });

  return {
    users: users || [],
    isLoading,
    toggleAccess: toggleAccess.mutate,
    isTogglingAccess: toggleAccess.isPending,
    stats
  };
};
