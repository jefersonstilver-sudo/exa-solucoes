import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * "Entregue em X de Y elevadores" — vem do vigia (exa2_telas_saude), que só marca
 * como confirmado quando o próprio NUC do prédio confirma a versão com todos os arquivos.
 */
export const EntregaResumo: React.FC<{ buildingIds: string[] }> = ({ buildingIds }) => {
  const [linhas, setLinhas] = useState<{ status: string }[] | null>(null);
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
  const total = buildingIds.length;
  const confirmadas = linhas.filter((l) => l.status === 'sincronizada').length;
  const aplicando = linhas.filter((l) => l.status === 'aplicando' || l.status === 'atrasada').length;
  const offline = linhas.filter((l) => l.status === 'offline').length;
  const semConf = linhas.filter((l) => l.status === 'sem_confirmacao').length;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600">
      <span className="flex items-center gap-1.5 font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Confirmado em {confirmadas} de {total} elevadores</span>
      {aplicando > 0 && <span className="flex items-center gap-1.5 text-blue-700"><Clock className="h-3.5 w-3.5" />{aplicando} aplicando a última mudança</span>}
      {offline > 0 && <span className="flex items-center gap-1.5 text-gray-500"><WifiOff className="h-3.5 w-3.5" />{offline} sem internet agora (atualiza quando voltar)</span>}
      {semConf > 0 && <span className="text-gray-400">{semConf} em atualização do sistema de confirmação</span>}
    </div>
  );
};

export default EntregaResumo;
