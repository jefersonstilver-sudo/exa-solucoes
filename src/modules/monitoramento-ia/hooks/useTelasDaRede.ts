import { useMemo } from 'react';
import { useFrotaSaude } from './useFrotaSaude';
import { useDeviceGroups } from '@/hooks/useDeviceGroups';

const ehGrupoPredios = (nome?: string | null) => /^pr[eé]dios$/i.test((nome || '').trim());

/**
 * Telas da rede com a MESMA conta da página Painéis EXA: só o grupo Prédios e "no ar" = tocando
 * (o coletor/imagem manda; AnyDesk caído com a tela tocando continua no ar). O Dashboard antigo contava
 * todas as linhas de devices (até apagadas e de bancada) pelo status do AnyDesk — por isso dava 23 × 24.
 */
export function useTelasDaRede() {
  const frota = useFrotaSaude();
  const { groups } = useDeviceGroups();
  return useMemo(() => {
    const g = groups.find((x: any) => ehGrupoPredios(x.nome));
    const paineis = g ? frota.paineis.filter((p) => p.grupo_id === g.id) : frota.paineis;
    const noAr = paineis.filter((p) => p.estado !== 'sem_sinal' && p.estado !== 'sem_imagem').length;
    return { frota, paineis, noAr, total: paineis.length, fora: paineis.length - noAr, carregando: frota.carregando && !frota.paineis.length };
  }, [frota, groups]);
}
