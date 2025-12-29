import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdditionalConfiguration {
  id: string;
  
  // Informações do Site
  site_nome: string;
  site_descricao: string;
  site_slogan: string;
  site_logo_url?: string;
  site_favicon_url?: string;
  
  // SEO
  seo_keywords: string;
  seo_description: string;
  
  // Contato e Suporte
  contato_email: string;
  contato_telefone: string;
  contato_whatsapp: string;
  suporte_email: string;
  suporte_horario: string;
  
  // Endereço
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_cep?: string;
  
  // Redes Sociais
  social_facebook?: string;
  social_instagram?: string;
  social_linkedin?: string;
  social_twitter?: string;
  social_youtube?: string;
  
  // Configurações de Email (Resend)
  email_remetente_nome: string;
  email_remetente_email: string;
  email_footer_texto: string;
  
  // Notificações
  notificacoes_email_ativas: boolean;
  notificacoes_admin_email?: string;
  notificacoes_pedidos_novos: boolean;
  notificacoes_pagamentos: boolean;
  notificacoes_clientes_novos: boolean;
  
  // Segurança
  seguranca_max_tentativas_login: number;
  seguranca_tempo_bloqueio_minutos: number;
  seguranca_sessao_timeout_minutos: number;
  seguranca_ip_whitelist?: string[];
  
  // Manutenção e Backup
  manutencao_mensagem: string;
  backup_automatico_ativo: boolean;
  backup_frequencia: string;
  backup_retencao_dias: number;
  
  // Termos e Políticas
  termos_uso_url?: string;
  politica_privacidade_url?: string;
  politica_cookies_url?: string;
  
  // Limites e Cotas
  limite_videos_por_cliente: number;
  limite_tamanho_video_mb: number;
  limite_pedidos_simultaneos: number;
  
  // Integração Externa
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  facebook_pixel_id?: string;
  
  // Outros
  modo_demonstracao: boolean;
  mostrar_precos: boolean;
  permitir_registro_publico: boolean;
  
  // Sofia
  sofia_2fa_gerente_master: boolean;
  sofia_ativa: boolean;
  
  // Login 2FA para Master
  login_2fa_master_ativo?: boolean;
  login_2fa_telefone_master?: string;
  
  created_at: string;
  updated_at: string;
}

export const useAdditionalConfigurations = () => {
  const [config, setConfig] = useState<AdditionalConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      console.log('⚙️ Buscando configurações adicionais...');
      
      const { data, error } = await supabase
        .from('configuracoes_adicionais')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar configurações adicionais:', error);
        toast.error('Erro ao carregar configurações adicionais');
        return;
      }

      console.log('✅ Configurações adicionais carregadas:', data);
      setConfig(data);
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar configurações adicionais:', error);
      toast.error('Erro crítico ao carregar configurações adicionais');
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (updates: Partial<AdditionalConfiguration>) => {
    if (!config) return false;

    try {
      console.log('💾 Salvando configurações adicionais...', updates);
      
      const { data, error } = await supabase
        .from('configuracoes_adicionais')
        .update(updates)
        .eq('id', config.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar configurações adicionais:', error);
        toast.error('Erro ao salvar configurações');
        return false;
      }

      console.log('✅ Configurações adicionais salvas:', data);
      setConfig(data);
      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('💥 Erro crítico ao salvar configurações adicionais:', error);
      toast.error('Erro crítico ao salvar configurações');
      return false;
    }
  };

  useEffect(() => {
    fetchConfiguration();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('additional-config-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'configuracoes_adicionais' 
        }, 
        (payload) => {
          console.log('⚙️ Mudança nas configurações adicionais detectada:', payload);
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
