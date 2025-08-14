import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BasicPanel {
  id: string;
  building_id?: string;
  code: string;
  status: string;
  resolucao?: string;
  polegada?: string;
  orientacao?: string;
  sistema_operacional?: string;
  modelo?: string;
  marca?: string;
  localizacao?: string;
  created_at: string;
  ultima_sync?: string;
}

interface PanelCredentials {
  id: string;
  codigo_anydesk?: string;
  senha_anydesk?: string;
  ip_interno?: string;
  mac_address?: string;
  versao_firmware?: string;
  observacoes?: string;
}

export const useSecurePanels = () => {
  const [panels, setPanels] = useState<BasicPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  const fetchBasicPanels = async () => {
    try {
      setLoading(true);
      
      // Get user role first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      setUserRole(userData.role);

      // Use secure function to get basic panel data
      const { data, error } = await supabase.rpc('get_panels_basic');
      
      if (error) throw error;
      
      setPanels(data || []);
    } catch (error: any) {
      console.error('Error fetching panels:', error);
      toast.error('Erro ao carregar painéis');
    } finally {
      setLoading(false);
    }
  };

  const getPanelCredentials = async (panelId: string): Promise<PanelCredentials | null> => {
    try {
      const { data, error } = await supabase.rpc('get_panel_credentials', {
        p_panel_id: panelId
      });

      if (error) {
        if (error.message.includes('Access denied')) {
          toast.error('Acesso negado: Apenas super administradores podem ver credenciais');
          return null;
        }
        throw error;
      }

      return data?.[0] || null;
    } catch (error: any) {
      console.error('Error fetching panel credentials:', error);
      toast.error('Erro ao carregar credenciais do painel');
      return null;
    }
  };

  const updatePanel = async (panelId: string, updates: Record<string, any>) => {
    try {
      const { data, error } = await supabase.rpc('update_panel_secure', {
        p_panel_id: panelId,
        p_updates: updates
      });

      if (error) {
        if (error.message.includes('Access denied')) {
          toast.error('Acesso negado: Permissões insuficientes');
          return false;
        }
        throw error;
      }

      toast.success('Painel atualizado com sucesso');
      await fetchBasicPanels(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error updating panel:', error);
      toast.error('Erro ao atualizar painel');
      return false;
    }
  };

  const canAccessCredentials = () => {
    return userRole === 'super_admin';
  };

  useEffect(() => {
    fetchBasicPanels();
  }, []);

  return {
    panels,
    loading,
    userRole,
    canAccessCredentials,
    fetchBasicPanels,
    getPanelCredentials,
    updatePanel,
    refetch: fetchBasicPanels
  };
};