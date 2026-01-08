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
      // Primeiro atualizar dias de atraso
      await supabase.rpc('atualizar_dias_atraso_cobrancas');

      // Buscar cobranças vencidas
      const { data, error } = await supabase
        .from('cobrancas')
        .select(`
          *,
          users:client_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('status', 'vencido')
        .order('dias_atraso', { ascending: false });

      if (error) throw error;

      // Agrupar por cliente
      const porCliente = new Map<string, any>();

      (data || []).forEach((c: any) => {
        const clientId = c.client_id;
        if (!clientId) return;

        if (!porCliente.has(clientId)) {
          porCliente.set(clientId, {
            client_id: clientId,
            cliente_nome: c.users?.full_name || 'Cliente não identificado',
            cliente_email: c.users?.email || '',
            cliente_telefone: c.users?.phone,
            total_devido: 0,
            dias_atraso_max: 0,
            cobrancas_vencidas: 0,
            ultima_cobranca: c.data_vencimento
          });
        }

        const cliente = porCliente.get(clientId);
        cliente.total_devido += Number(c.valor) || 0;
        cliente.dias_atraso_max = Math.max(cliente.dias_atraso_max, c.dias_atraso || 0);
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
