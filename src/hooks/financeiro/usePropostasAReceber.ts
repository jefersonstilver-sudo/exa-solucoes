import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PropostasAReceber {
  valorTotal: number;
  countAceitas: number;
  countPendentes: number;
  porFormaPagamento: {
    pix_boleto: { valor: number; count: number };
    parcelado: { valor: number; count: number };
  };
  loading: boolean;
}

export const usePropostasAReceber = (): PropostasAReceber => {
  const [data, setData] = useState<PropostasAReceber>({
    valorTotal: 0,
    countAceitas: 0,
    countPendentes: 0,
    porFormaPagamento: {
      pix_boleto: { valor: 0, count: 0 },
      parcelado: { valor: 0, count: 0 }
    },
    loading: true
  });

  useEffect(() => {
    const fetchPropostas = async () => {
      try {
        // Buscar propostas aceitas (aguardando pagamento)
        const { data: aceitas, error: errorAceitas } = await supabase
          .from('proposals')
          .select('id, cash_total_value, payment_type')
          .eq('status', 'aceita');

        if (errorAceitas) {
          console.error('Erro ao buscar propostas aceitas:', errorAceitas);
          return;
        }

        // Buscar contagem de propostas pendentes de aceitação
        const { count: countPendentes, error: errorPendentes } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .in('status', ['enviada', 'visualizada', 'pendente', 'atualizada']);

        if (errorPendentes) {
          console.error('Erro ao buscar propostas pendentes:', errorPendentes);
        }

        // Calcular métricas
        const valorTotal = (aceitas || []).reduce((sum, p) => sum + (p.cash_total_value || 0), 0);
        const countAceitas = (aceitas || []).length;

        // Agrupar por forma de pagamento
        const porFormaPagamento = {
          pix_boleto: { valor: 0, count: 0 },
          parcelado: { valor: 0, count: 0 }
        };

        (aceitas || []).forEach(p => {
          const valor = p.cash_total_value || 0;
          const tipo = p.payment_type?.toLowerCase() || '';
          
          // PIX, Boleto ou à vista
          if (tipo.includes('pix') || tipo.includes('boleto') || tipo.includes('vista') || tipo === 'cash') {
            porFormaPagamento.pix_boleto.valor += valor;
            porFormaPagamento.pix_boleto.count += 1;
          } 
          // Parcelado ou cartão
          else if (tipo.includes('parcel') || tipo.includes('cartao') || tipo.includes('card') || tipo.includes('installment')) {
            porFormaPagamento.parcelado.valor += valor;
            porFormaPagamento.parcelado.count += 1;
          }
          // Outros - considera como PIX/Boleto por padrão
          else {
            porFormaPagamento.pix_boleto.valor += valor;
            porFormaPagamento.pix_boleto.count += 1;
          }
        });

        setData({
          valorTotal,
          countAceitas,
          countPendentes: countPendentes || 0,
          porFormaPagamento,
          loading: false
        });

      } catch (error) {
        console.error('Erro ao buscar dados de propostas:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPropostas();

    // Realtime subscription para atualizar quando propostas mudarem
    const channel = supabase
      .channel('propostas-a-receber')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'proposals' }, 
        () => {
          fetchPropostas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
};
