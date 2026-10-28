import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EstadoPainel = 'sem_sinal' | 'sem_imagem' | 'internet_ruim' | 'quente' | 'instavel' | 'sem_diagnostico' | 'tocando';

export interface FrotaPainel {
  id: string;
  nome: string;
  condominio: string | null;
  endereco: string | null;
  operadora: string | null;
  grupo_id: string | null;
  building_id: string | null;
  anydesk: string | null;
  status_anydesk: string;
  visto_anydesk_em: string | null;
  estado: EstadoPainel;
  causa: string;
  porque_cai: string | null;
  causa_registrada: string | null;
  quedas_7d: number;
  quedas_24h: number;
  fora_7d: string;
  fora_7d_min: number;
  coletor: { visto_em: string; vivo: boolean; versao: string | null } | null;
  temp_c: number | null;
  perda_internet_pct: number | null;
  perda_roteador_pct: number | null;
  lat_ms: number | null;
  download_mbps: number | null;
  conexao: string | null;
  vigia: { estado: string | null; eventos_24h: Record<string, number>; reboots_7d: number | null; cabo: any } | null;
  ultimo_boot: { tipo: string | null; ligou_em: string | null } | null;
  player: { versao: string | null; conteudo_ok: boolean | null; faltando: number | null; visto_em: string; pendencia: string | null } | null;
}

const REFRESH_MS = 60000;

/** Estado da frota (função exa2-saude-frota), atualizado a cada 60 s. O resumo da IA é pedido só quando solicitado. */
export function useFrotaSaude() {
  const [paineis, setPaineis] = useState<FrotaPainel[]>([]);
  const [geradoEm, setGeradoEm] = useState<Date | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tecnico, setTecnico] = useState<string | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const vivo = useRef(true);

  const carregar = useCallback(async (ia = false) => {
    if (ia) setAnalisando(true);
    try {
      const { data, error } = await supabase.functions.invoke('exa2-saude-frota', { body: { ia } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'falha');
      if (!vivo.current) return;
      setPaineis(data.paineis || []);
      setGeradoEm(new Date(data.gerado_em));
      if (ia) setTecnico(data.tecnico || 'Não consegui gerar a análise agora.');
      setErro(null);
    } catch (e: any) {
      if (vivo.current) setErro(e?.message || 'erro');
    } finally {
      if (vivo.current) { setCarregando(false); if (ia) setAnalisando(false); }
    }
  }, []);

  useEffect(() => {
    vivo.current = true;
    carregar(false);
    const t = setInterval(() => carregar(false), REFRESH_MS);
    return () => { vivo.current = false; clearInterval(t); };
  }, [carregar]);

  return { paineis, geradoEm, carregando, erro, tecnico, analisando, recarregar: () => carregar(false), analisar: () => carregar(true) };
}
