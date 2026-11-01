/**
 * Telas novas (exa_telas: TV Android, mini PC, navegador) para a página Painéis EXA da equipe.
 * Ao vivo = batimento nos últimos 3 min (o player manda a cada 60 s). Inclui as TVs que acabaram de
 * abrir o app e estão mostrando o código (últimos 15 min), para a equipe ver na hora e conectar.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TelaEquipe {
  id: string;
  nome: string | null;
  building_id: string | null;
  device_group_id: string | null;
  layout: string;
  status: string;
  codigo: string | null;
  plataforma: string | null;
  info: any;
  saude: any;
  tocando: any;
  versao_player: string | null;
  ultimo_sinal: string | null;
  offline_desde: string | null;
  conectada_por: string | null;
}

export const AO_VIVO_MS = 3 * 60000;
export const telaAoVivo = (t: Pick<TelaEquipe, 'ultimo_sinal'>) => !!t.ultimo_sinal && Date.now() - new Date(t.ultimo_sinal).getTime() < AO_VIVO_MS;

const db = supabase as any;

export function useTelasEquipe(intervalo = 15000) {
  const [telas, setTelas] = useState<TelaEquipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [semColunaGrupo, setSemColunaGrupo] = useState(false);
  const vivo = useRef(true);

  const carregar = useCallback(async () => {
    const recente = new Date(Date.now() - 15 * 60000).toISOString();
    const campos = 'id, nome, building_id, layout, status, codigo, plataforma, info, saude, tocando, versao_player, ultimo_sinal, offline_desde, conectada_por';
    let r = await db.from('exa_telas').select(`${campos}, device_group_id`).neq('status', 'desativada')
      .or(`status.eq.ativa,ultimo_sinal.gte.${recente}`).order('nome', { ascending: true }).limit(500);
    // migration do grupo ainda não rodou: funciona sem o grupo
    if (r.error && /device_group_id/.test(r.error.message || '')) {
      setSemColunaGrupo(true);
      r = await db.from('exa_telas').select(campos).neq('status', 'desativada')
        .or(`status.eq.ativa,ultimo_sinal.gte.${recente}`).order('nome', { ascending: true }).limit(500);
    }
    if (!vivo.current) return;
    if (!r.error) setTelas((r.data || []).map((t: any) => ({ device_group_id: null, ...t })));
    setCarregando(false);
  }, []);

  useEffect(() => {
    vivo.current = true;
    carregar();
    const t = setInterval(carregar, intervalo);
    return () => { vivo.current = false; clearInterval(t); };
  }, [carregar, intervalo]);

  const atualizar = useCallback(async (id: string, patch: Partial<TelaEquipe>) => {
    const { error } = await db.from('exa_telas').update(patch).eq('id', id);
    if (!error) await carregar();
    return error as { message: string } | null;
  }, [carregar]);

  const comando = useCallback(async (id: string, tipo: 'recarregar' | 'limpar_cache' | 'reiniciar_app') => {
    const { error } = await db.from('exa_telas').update({ comando: tipo, comando_em: new Date().toISOString() }).eq('id', id);
    return error as { message: string } | null;
  }, []);

  return { telas, carregando, semColunaGrupo, recarregar: carregar, atualizar, comando };
}
