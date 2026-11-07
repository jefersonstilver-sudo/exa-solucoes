// EXA (06/11/2026) — promoções configuradas em Admin → Produtos (tabela promocoes_exa).
// O site e a loja leem daqui; o R$ 99 por prédio deixou de ser fixo no código.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromocaoExa {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  produto: 'horizontal' | 'vertical_premium';
  unidade: 'predio' | 'rede';
  preco: number;
  plano_meses: number;
  inclui_videos: boolean;
  vagas_total: number | null;
  vagas_usadas: number;
  inicio: string | null;
  fim: string | null;
  ativo: boolean;
  ordem: number;
  updated_at: string;
  onde: 'site' | 'renovacao';      // site: todo mundo vê; renovacao: só a Sofia e a equipe (quem já é cliente)
  cliente_id: string | null;       // cupom: só esta conta
  bonus_predios: number;           // prédios a mais, de cortesia
}

const hojeBR = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).toISOString().slice(0, 10);

/** Está valendo agora? (ativa, dentro das datas e com vaga) */
export const promocaoValendo = (p: PromocaoExa, hoje = hojeBR()) =>
  p.ativo && (!p.inicio || p.inicio <= hoje) && (!p.fim || p.fim >= hoje) && (p.vagas_total == null || p.vagas_usadas < p.vagas_total);
export const vagasRestantes = (p: PromocaoExa) => (p.vagas_total == null ? null : Math.max(0, p.vagas_total - p.vagas_usadas));

/** Todas as promoções (o admin vê as inativas; o site só recebe as ativas pela RLS). */
export const usePromocoesExa = () =>
  useQuery({
    queryKey: ['promocoes-exa'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('promocoes_exa').select('*').order('ordem');
      if (error) throw error;
      return (data || []) as PromocaoExa[];
    },
  });

/** Só as que estão valendo agora E são do site (sem cupom), na ordem do admin. */
export const usePromocoesValendo = () => {
  const q = usePromocoesExa();
  return { ...q, data: (q.data || []).filter((p) => promocaoValendo(p) && (p.onde || 'site') === 'site' && !p.cliente_id) };
};
