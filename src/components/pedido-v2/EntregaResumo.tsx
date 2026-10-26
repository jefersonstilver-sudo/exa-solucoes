import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CARD } from './ui';

/**
 * Recebe só os prédios ATIVOS do pedido (inativos/internos não contam para o cliente).
 * "Entregue em X de Y elevadores" — vem do vigia (exa2_telas_saude), que só marca
 * como confirmado quando o próprio NUC do prédio confirma a versão com todos os arquivos.
 */
export const EntregaResumo: React.FC<{ buildingIds: string[] }> = ({ buildingIds }) => {
  const [linhas, setLinhas] = useState<{ building_id?: string; status: string }[] | null>(null);
  const chave = buildingIds.join(',');

  useEffect(() => {
    if (!buildingIds.length) return;
    let vivo = true;
    const ler = async () => {
      const { data, error } = await (supabase as any).from('exa2_telas_saude').select('building_id, status').in('building_id', buildingIds);
      if (vivo && !error) setLinhas(data || []);
    };
    ler();
    const i = setInterval(ler, 60000);
    return () => { vivo = false; clearInterval(i); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (!linhas || !linhas.length) return null;
  // Um estado por prédio ativo (o pior entre as telas dele); prédios fora da lista ativa são ignorados.
  const ativos = new Set(buildingIds);
  const peso: Record<string, number> = { offline: 4, atrasada: 3, aplicando: 3, sem_confirmacao: 2, sincronizada: 1 };
  const porPredio = new Map<string, string>();
  for (const l of linhas as { building_id?: string; status: string }[]) {
    if (!l.building_id || !ativos.has(l.building_id)) continue;
    const ant = porPredio.get(l.building_id);
    if (!ant || (peso[l.status] || 2) > (peso[ant] || 2)) porPredio.set(l.building_id, l.status);
  }
  const est = [...porPredio.values()];
  if (!est.length) return null;
  const total = buildingIds.length;
  const confirmadas = est.filter((s) => s === 'sincronizada').length;
  const aplicando = est.filter((s) => s === 'aplicando' || s === 'atrasada').length;
  const offline = est.filter((s) => s === 'offline').length;
  const semConf = est.filter((s) => s === 'sem_confirmacao').length;

  return (
    <div className={`${CARD} flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-xs text-[#554e50]`}>
      <span className="flex items-center gap-1.5 font-bold text-[#13a24a]"><CheckCircle2 className="h-4 w-4" />Confirmado em {confirmadas} de {total} prédios</span>
      {aplicando > 0 && <span className="flex items-center gap-1.5 text-blue-700"><Clock className="h-3.5 w-3.5" />{aplicando} aplicando a última mudança</span>}
      {offline > 0 && <span className="flex items-center gap-1.5 text-gray-500"><WifiOff className="h-3.5 w-3.5" />{offline} sem internet agora (atualiza quando voltar)</span>}
      {semConf > 0 && <span className="text-gray-400">{semConf} em atualização do sistema de confirmação</span>}
    </div>
  );
};

export default EntregaResumo;
