import { useEffect, useState } from 'react';
import { fetchBuildingsForStore, type BuildingStore } from '@/services/buildingStoreService';

let cache: BuildingStore[] | null = null;
let pendente: Promise<BuildingStore[]> | null = null;

/** Prédios ativos da rede (mesma fonte da loja), com cache em memória entre páginas do site. */
export function usePrediosPublicos() {
  const [predios, setPredios] = useState<BuildingStore[]>(cache || []);
  const [carregando, setCarregando] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    pendente = pendente || fetchBuildingsForStore();
    let vivo = true;
    pendente.then((lista) => {
      cache = lista;
      if (vivo) { setPredios(lista); setCarregando(false); }
    }).catch(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, []);

  const ativos = predios.filter((p) => !p.status || /ativo|active|instalado/i.test(p.status));
  const lista = ativos.length ? ativos : predios;
  return {
    predios: lista,
    carregando,
    totalPredios: lista.length,
    totalTelas: lista.reduce((s, p) => s + (p.quantidade_telas || 1), 0),
    totalPublico: lista.reduce((s, p) => s + (p.publico_estimado || 0), 0),
  };
}
