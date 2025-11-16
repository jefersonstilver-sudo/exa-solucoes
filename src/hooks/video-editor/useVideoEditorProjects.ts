import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VideoEditorProject, ProjectData } from '@/types/videoEditor';
import { toast } from 'sonner';

/**
 * Hook to manage video editor projects
 */
export const useVideoEditorProjects = () => {
  const queryClient = useQueryClient();

  // Get all projects for current user
  const { data: projects, isLoading } = useQuery({
    queryKey: ['video-editor-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('video_editor_projects')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(project => ({
        ...project,
        project_data: project.project_data as any as ProjectData
      })) as VideoEditorProject[];
    }
  });

  // Get single project by ID
  const getProject = (projectId: string) => {
    return useQuery({
      queryKey: ['video-editor-project', projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('video_editor_projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        return {
          ...data,
          project_data: data.project_data as any as ProjectData
        } as VideoEditorProject;
      },
      enabled: !!projectId
    });
  };

  // Create new project
  const createProject = useMutation({
    mutationFn: async (project: Partial<VideoEditorProject>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('video_editor_projects')
        .insert({
          user_id: user.id,
          title: project.title || 'Novo Projeto',
          description: project.description,
          project_data: (project.project_data || {
            timeline: [],
            canvas: {
              width: 1920,
              height: 1080,
              background_color: '#000000',
              aspect_ratio: '16:9'
            }
          }) as any,
          export_format: project.export_format || 'mp4',
          export_quality: project.export_quality || 'high',
          export_resolution: project.export_resolution || '1080p'
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        project_data: data.project_data as any as ProjectData
      } as VideoEditorProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-editor-projects'] });
      toast.success('Projeto criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar projeto: ' + error.message);
    }
  });

  // Update project
  const updateProject = useMutation({
    mutationFn: async ({
      projectId,
      updates
    }: {
      projectId: string;
      updates: Partial<VideoEditorProject>;
    }) => {
      const updateData = { ...updates } as any;
      if (updates.project_data) {
        updateData.project_data = updates.project_data as any;
      }
      
      const { error } = await supabase
        .from('video_editor_projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['video-editor-projects'] });
      queryClient.invalidateQueries({ queryKey: ['video-editor-project', variables.projectId] });
    }
  });

  // Delete project (soft delete)
  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('video_editor_projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-editor-projects'] });
      toast.success('Projeto excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir projeto: ' + error.message);
    }
  });

  // Duplicate project
  const duplicateProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: original, error: fetchError } = await supabase
        .from('video_editor_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('video_editor_projects')
        .insert({
          user_id: user.id,
          title: `${original.title} (Cópia)`,
          description: original.description,
          project_data: original.project_data,
          export_format: original.export_format,
          export_quality: original.export_quality,
          export_resolution: original.export_resolution,
          parent_version_id: projectId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-editor-projects'] });
      toast.success('Projeto duplicado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao duplicar projeto: ' + error.message);
    }
  });

  return {
    projects: projects || [],
    isLoading,
    getProject,
    createProject: createProject.mutate,
    isCreating: createProject.isPending,
    updateProject: updateProject.mutate,
    isUpdating: updateProject.isPending,
    deleteProject: deleteProject.mutate,
    isDeleting: deleteProject.isPending,
    duplicateProject: duplicateProject.mutate,
    isDuplicating: duplicateProject.isPending
  };
};
