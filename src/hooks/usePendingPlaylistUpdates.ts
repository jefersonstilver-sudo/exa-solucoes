import { useState, useCallback, useMemo } from 'react';

/**
 * 🎯 Hook para gerenciar atualizações pendentes de playlist
 * 
 * REGRA CRÍTICA: Atualizações só são aplicadas no FINAL do ciclo completo da playlist
 * - Realtime, schedule e polling salvam mudanças aqui
 * - Player só aplica quando terminar TODOS os vídeos da playlist atual
 * - Garante reprodução ininterrupta e transições suaves
 */

interface PendingPlaylistUpdatesOptions<T> {
  /**
   * Função para gerar hash único da playlist
   * Usado para comparar se realmente há mudança
   */
  getPlaylistHash: (videos: T[]) => string;
}

export function usePendingPlaylistUpdates<T extends { video_id?: string; id?: string }>(
  options: PendingPlaylistUpdatesOptions<T>
) {
  const [pendingVideos, setPendingVideos] = useState<T[] | null>(null);
  const [currentPlaylistHash, setCurrentPlaylistHash] = useState<string>('');

  const hasPendingUpdates = useMemo(() => {
    return pendingVideos !== null && pendingVideos.length > 0;
  }, [pendingVideos]);

  /**
   * 📦 Salva nova playlist como pendente (NÃO aplica ainda)
   * Só salva se for diferente da atual
   */
  const setPendingUpdate = useCallback((videos: T[]) => {
    if (!videos || videos.length === 0) {
      console.log('⚠️ [PENDING] Tentativa de salvar playlist vazia - ignorando');
      return;
    }

    const newHash = options.getPlaylistHash(videos);
    
    if (newHash === currentPlaylistHash) {
      console.log('ℹ️ [PENDING] Playlist idêntica à atual - ignorando update');
      return;
    }

    console.group('📦 [PENDING UPDATE] Nova playlist aguardando fim do ciclo');
    console.log('🎬 Vídeos pendentes:', videos.length);
    console.log('🔑 Hash novo:', newHash);
    console.log('🔑 Hash atual:', currentPlaylistHash);
    console.groupEnd();

    setPendingVideos(videos);
  }, [options, currentPlaylistHash]);

  /**
   * ✅ Aplica updates pendentes e retorna nova playlist
   * Deve ser chamado APENAS no fim do ciclo (nextIndex === 0)
   */
  const applyPendingUpdates = useCallback((): T[] | null => {
    if (!hasPendingUpdates) {
      return null;
    }

    console.group('🔄 [PENDING] Aplicando nova playlist após ciclo completo');
    console.log('📊 Vídeos:', pendingVideos!.length);
    console.groupEnd();

    const newPlaylist = pendingVideos;
    const newHash = options.getPlaylistHash(newPlaylist!);
    
    // Atualizar hash atual e limpar pending
    setCurrentPlaylistHash(newHash);
    setPendingVideos(null);

    return newPlaylist;
  }, [hasPendingUpdates, pendingVideos, options]);

  /**
   * 🗑️ Descarta updates pendentes sem aplicar
   */
  const clearPendingUpdates = useCallback(() => {
    if (hasPendingUpdates) {
      console.log('🗑️ [PENDING] Descartando updates pendentes');
      setPendingVideos(null);
    }
  }, [hasPendingUpdates]);

  /**
   * 🔄 Atualiza hash da playlist atual (para comparação futura)
   */
  const updateCurrentHash = useCallback((videos: T[]) => {
    const hash = options.getPlaylistHash(videos);
    setCurrentPlaylistHash(hash);
  }, [options]);

  return {
    hasPendingUpdates,
    setPendingUpdate,
    applyPendingUpdates,
    clearPendingUpdates,
    updateCurrentHash,
    pendingVideosCount: pendingVideos?.length || 0
  };
}
