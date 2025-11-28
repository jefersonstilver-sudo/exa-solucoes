import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RelatorioVARData, RelatorioVARRequest } from '../types/relatorio-var';

export const useRelatorioVAR = () => {
  const [loading, setLoading] = useState(false);
  const [relatorioData, setRelatorioData] = useState<RelatorioVARData | null>(null);

  const gerarRelatorio = async (request: RelatorioVARRequest) => {
    setLoading(true);
    try {
      console.log('[useRelatorioVAR] Gerando relatório...', request);

      // Chamar edge function para gerar relatório
      const { data, error } = await supabase.functions.invoke('relatorio-var-generate', {
        body: {
          periodo_tipo: request.periodo_tipo,
          data_inicio: request.data_inicio,
          data_fim: request.data_fim,
          agent_key: request.agent_key || 'eduardo'
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar relatório');
      }

      setRelatorioData(data.data);
      
      toast.success('Relatório gerado com sucesso!');
      
      return data.data as RelatorioVARData;

    } catch (error: any) {
      console.error('[useRelatorioVAR] Erro:', error);
      toast.error('Erro ao gerar relatório', {
        description: error.message
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const enviarRelatorio = async (
    relatorioData: RelatorioVARData,
    formato: 'whatsapp' | 'email',
    diretoresIds: string[]
  ) => {
    if (diretoresIds.length === 0) {
      toast.error('Selecione pelo menos um diretor');
      return;
    }

    setLoading(true);
    try {
      console.log('[useRelatorioVAR] Enviando relatório...');

      const { data, error } = await supabase.functions.invoke('relatorio-var-send', {
        body: {
          relatorio_data: relatorioData,
          formato,
          diretores_ids: diretoresIds
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar relatório');
      }

      toast.success(`Relatório enviado para ${data.total_sent} diretor(es)!`, {
        description: `Via ${formato === 'whatsapp' ? 'WhatsApp' : 'Email'}`
      });

      return data;

    } catch (error: any) {
      console.error('[useRelatorioVAR] Erro no envio:', error);
      toast.error('Erro ao enviar relatório', {
        description: error.message
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const gerarEEnviarRelatorio = async (request: RelatorioVARRequest) => {
    try {
      // Gerar relatório
      const data = await gerarRelatorio(request);
      
      if (data && request.diretores_ids.length > 0) {
        // Enviar automaticamente
        await enviarRelatorio(
          data,
          request.formato_envio || 'whatsapp',
          request.diretores_ids
        );
      }
      
      return data;
    } catch (error) {
      console.error('[useRelatorioVAR] Erro no fluxo completo:', error);
      throw error;
    }
  };

  return {
    loading,
    relatorioData,
    gerarRelatorio,
    enviarRelatorio,
    gerarEEnviarRelatorio
  };
};
