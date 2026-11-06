// EXA (06/11/2026) — dados do Relatório do pedido (função exa2-relatorio-pedido).
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RelatorioVideo = {
  id: string; nome: string; publicado_em: string; duracao: number; orientacao: string;
  serie: 'cinema' | 'hotel' | 'geral'; situacao: 'no_ar' | 'pausado' | 'substituido'; principal: boolean;
  programacao: string | null; periodo: { de: string; ate: string } | null; exibicoes?: number;
};
export type Relatorio = {
  ok: boolean; pendente?: boolean; aviso?: string; gerado_em: string;
  pedido: { id: string; nome: string; status: string; cliente: string | null; produto: string; inicio: string; fim: string | null; plano_meses: number; dias_no_ar: number; dias_restantes: number | null; progresso: number };
  formato: { produto: string; duracao_s: number; horas_dia: number; ciclo_s: number; exibicoes_dia_tela: number; tela_cheia: boolean; participacao: number; minutos_dia_tela: number };
  totais: { predios: number; telas: number; exibicoes: number; horas_tela: number; media_dia: number; publico: number; videos_publicados: number; videos_no_ar: number };
  meses: { mes: string; exibicoes: number; dias: number }[];
  dias: { dia: string; exibicoes: number }[];
  predios: { id: string; nome: string; bairro: string; telas: number; exibicoes: number; por_dia_tela: number; participacao: number; horas_tela: number; publico: number }[];
  videos: RelatorioVideo[];
  publicacoes: { por_mes: { mes: string; qtd: number }[]; series: Record<string, { videos: number; semanas: number }> };
  metodologia: string;
};
export type PedidoLista = { id: string; nome: string; status: string; produto: string; inicio: string; fim: string | null; predios: number };

async function chamar<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('exa2-relatorio-pedido', { body });
  if (error) throw new Error('Não consegui carregar o relatório agora.');
  if (!data?.ok) throw new Error(data?.erro || 'Não consegui carregar o relatório agora.');
  return data as T;
}

export const useRelatorio = (pedidoId?: string | null) =>
  useQuery({
    queryKey: ['relatorio-pedido', pedidoId],
    enabled: !!pedidoId,
    staleTime: 5 * 60_000,
    queryFn: () => chamar<Relatorio>({ acao: 'relatorio', pedido_id: pedidoId }),
  });

export const usePedidosRelatorio = (clienteId?: string | null) =>
  useQuery({
    queryKey: ['relatorio-lista', clienteId],
    enabled: !!clienteId,
    staleTime: 5 * 60_000,
    queryFn: async () => (await chamar<{ pedidos: PedidoLista[] }>({ acao: 'lista', cliente_id: clienteId })).pedidos,
  });

export const nf = (n: number) => Math.round(n || 0).toLocaleString('pt-BR');
export const dataBR = (d?: string | null) => (d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const mesBR = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;
export const SITUACAO = { no_ar: 'No ar', pausado: 'Pausado', substituido: 'Substituído' } as const;
export const SERIE = { cinema: 'Cinema', hotel: 'Hotel', geral: 'Campanha' } as const;
