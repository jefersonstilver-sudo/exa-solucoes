
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemConfiguration {
  id: string;
  modo_emergencia: boolean;
  seed_hash: string;
  created_at: string;
  updated_at: string;
  debug_ai_enabled?: boolean;
  debug_ai_activated_at?: string;
  debug_ai_activated_by?: string;
}

export const useConfigurationsData = () => {
  const [config, setConfig] = useState<SystemConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      console.log('⚙️ Buscando configurações do sistema...');
      
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Erro ao buscar configurações:', error);
        toast.error('Erro ao carregar configurações');
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ Configurações carregadas:', data[0]);
        setConfig(data[0]);
      } else {
        // Criar configuração padrão se não existir
        console.log('📝 Criando configuração padrão...');
        await createDefaultConfiguration();
      }
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar configurações:', error);
      toast.error('Erro crítico ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .insert([{
          modo_emergencia: false,
          seed_hash: 'default_hash_' + Date.now()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar configuração padrão:', error);
        return;
      }

      console.log('✅ Configuração padrão criada:', data);
      setConfig(data);
      toast.success('Configuração padrão criada');
    } catch (error) {
      console.error('💥 Erro ao criar configuração padrão:', error);
    }
  };

  const updateConfiguration = async (updates: Partial<SystemConfiguration>) => {
    if (!config) return false;

    try {
      console.log('💾 Salvando configurações...', updates);
      
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        toast.error('Erro ao salvar configurações');
        return false;
      }

      console.log('✅ Configurações salvas:', data);
      setConfig(data);
      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('💥 Erro crítico ao salvar configurações:', error);
      toast.error('Erro crítico ao salvar configurações');
      return false;
    }
  };

  useEffect(() => {
    fetchConfiguration();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('config-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'configuracoes_sistema' 
        }, 
        (payload) => {
          console.log('⚙️ Mudança nas configurações detectada:', payload);
          fetchConfiguration();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    config, 
    loading, 
    updateConfiguration, 
    refetch: fetchConfiguration 
  };
};
