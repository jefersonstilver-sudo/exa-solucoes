/** Dados do portal do restaurante (área do cliente) — separado para o menu não carregar a página inteira. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LocalCliente { id: string; nome: string; bairro: string | null; segmento: string | null; pedido_id: string; limite: number }
export interface TelaCliente {
  id: string; nome: string | null; layout: string; config: any; status: string; ultimo_sinal: string | null; offline_desde: string | null;
  tocando: any; erros: string[] | null; plataforma: string | null; info: { tela: string | null }; versao_player: string | null; saude: any;
  building_id: string; pareada_em: string | null; comando: string | null; exibicoes_hoje: number; quedas_7d: number;
}

export async function chamar<T = any>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('exa-tela', { body: corpo });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.erro) msg = j.erro; } catch { /* */ }
    throw new Error(msg);
  }
  if (data && data.ok === false) throw new Error(data.erro || 'Não deu certo');
  return data as T;
}

/** Usado também no menu: só mostra "Minhas telas" para quem tem local com tela própria. */
export function useMinhasTelas(ativo = true) {
  return useQuery({
    queryKey: ['minhas-telas'],
    enabled: ativo,
    queryFn: () => chamar<{ locais: LocalCliente[]; telas: TelaCliente[] }>({ acao: 'cliente_listar' }),
    // quem não tem tela própria não fica consultando
    refetchInterval: (q: any) => (q?.state?.data?.locais?.length ? 30000 : false),
    staleTime: 20000,
    retry: 1,
  });
}

