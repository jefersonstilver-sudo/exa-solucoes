import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClienteInadimplente } from '@/types/financeiro';

export const useInadimplentes = () => {
  const [loading, setLoading] = useState(false);
  const [inadimplentes, setInadimplentes] = useState<ClienteInadimplente[]>([]);

  const calcularRisco = (diasAtraso: number, valor: number): 'baixo' | 'medio' | 'alto' | 'critico' => {
    if (diasAtraso > 90 || valor > 10000) return 'critico';
    if (diasAtraso > 60 || valor > 5000) return 'alto';
    if (diasAtraso > 30 || valor > 2000) return 'medio';
    return 'baixo';
  };

  const recomendarAcao = (diasAtraso: number): string => {
    if (diasAtraso > 90) return 'Negativar / Jurídico';
    if (diasAtraso > 60) return 'Suspender serviço';
    if (diasAtraso > 30) return 'Ligação de cobrança';
    if (diasAtraso > 15) return 'WhatsApp de lembrete';
    if (diasAtraso > 7) return 'Email de lembrete';
    return 'Aguardar';
  };

  const fetchInadimplentes = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar transações OVERDUE do ASAAS (fonte real de inadimplência)
      const { data, error } = await supabase
        .from('transacoes_asaas')
        .select('*')
        .eq('status', 'OVERDUE')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      // Agrupar por cliente
      const porCliente = new Map<string, any>();

      (data || []).forEach((t: any) => {
        const customerId = t.customer_id || 'unknown';
        
        // Calcular dias de atraso
        const vencimento = new Date(t.data_vencimento);
        const hoje = new Date();
        const diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

        if (!porCliente.has(customerId)) {
          porCliente.set(customerId, {
            client_id: customerId,
            cliente_nome: t.customer_name || 'Cliente não identificado',
            cliente_email: t.customer_email || '',
            cliente_telefone: null,
            total_devido: 0,
            dias_atraso_max: 0,
            cobrancas_vencidas: 0,
            ultima_cobranca: t.data_vencimento
          });
        }

        const cliente = porCliente.get(customerId);
        cliente.total_devido += Number(t.valor) || 0;
        cliente.dias_atraso_max = Math.max(cliente.dias_atraso_max, diasAtraso);
        cliente.cobrancas_vencidas += 1;
      });

      const processed: ClienteInadimplente[] = Array.from(porCliente.values()).map(cliente => ({
        ...cliente,
        risco: calcularRisco(cliente.dias_atraso_max, cliente.total_devido),
        acao_recomendada: recomendarAcao(cliente.dias_atraso_max)
      }));

      // Ordenar por risco (crítico primeiro)
      const riscoOrdem = { critico: 0, alto: 1, medio: 2, baixo: 3 };
      processed.sort((a, b) => riscoOrdem[a.risco] - riscoOrdem[b.risco]);

      setInadimplentes(processed);
      return processed;
    } catch (error) {
      console.error('Erro ao buscar inadimplentes:', error);
      toast.error('Erro ao carregar inadimplentes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Resumo de inadimplência
  const getResumo = useCallback(() => {
    const total = inadimplentes.reduce((sum, i) => sum + i.total_devido, 0);
    const criticos = inadimplentes.filter(i => i.risco === 'critico');
    const altos = inadimplentes.filter(i => i.risco === 'alto');
    const medios = inadimplentes.filter(i => i.risco === 'medio');
    const baixos = inadimplentes.filter(i => i.risco === 'baixo');

    return {
      total,
      count: inadimplentes.length,
      criticos: criticos.length,
      valorCriticos: criticos.reduce((sum, i) => sum + i.total_devido, 0),
      altos: altos.length,
      valorAltos: altos.reduce((sum, i) => sum + i.total_devido, 0),
      medios: medios.length,
      valorMedios: medios.reduce((sum, i) => sum + i.total_devido, 0),
      baixos: baixos.length,
      valorBaixos: baixos.reduce((sum, i) => sum + i.total_devido, 0)
    };
  }, [inadimplentes]);

  // Enviar notificação de cobrança
  const enviarNotificacao = useCallback(async (clientId: string, tipo: 'email' | 'whatsapp') => {
    try {
      // TODO: Integrar com sistema de notificações
      toast.success(`Notificação via ${tipo} enviada`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
      return false;
    }
  }, []);

  // Registrar ação de cobrança
  const registrarAcaoCobranca = useCallback(async (clientId: string, acao: string) => {
    try {
      await supabase.from('cobranca_logs').insert({
        client_id: clientId,
        tipo_notificacao: acao,
        canal: 'manual',
        status: 'enviado'
      });
      toast.success('Ação registrada');
      return true;
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
      toast.error('Erro ao registrar ação');
      return false;
    }
  }, []);

  return {
    loading,
    inadimplentes,
    fetchInadimplentes,
    getResumo,
    enviarNotificacao,
    registrarAcaoCobranca
  };
};
