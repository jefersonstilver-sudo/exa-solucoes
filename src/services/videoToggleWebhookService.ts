import { toast } from 'sonner';

const WEBHOOK_BASE_URL = 'https://stilver.app.n8n.cloud/webhook/ATIVAR/DESATIVAR';

/**
 * Normaliza o título do vídeo removendo extensões
 */
export const normalizeTitle = (fileName: string): string => {
  if (!fileName) return '';
  
  // Remove extensões comuns de vídeo
  return fileName.replace(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i, '');
};

/**
 * Envia uma requisição PATCH para o webhook de toggle
 */
const patchToggle = async (buildingId: string, titulo: string, ativo: boolean): Promise<boolean> => {
  try {
    const url = `${WEBHOOK_BASE_URL}?building_id=${encodeURIComponent(buildingId)}`;
    const body = {
      titulo,
      ativo
    };

    console.log(`🔄 [WEBHOOK] Enviando PATCH para prédio ${buildingId}:`, body);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.warn(`⚠️ [WEBHOOK] Falha na requisição para prédio ${buildingId}:`, response.status, response.statusText);
      return false;
    }

    console.log(`✅ [WEBHOOK] Sucesso para prédio ${buildingId}`);
    return true;
  } catch (error) {
    console.error(`❌ [WEBHOOK] Erro para prédio ${buildingId}:`, error);
    return false;
  }
};

/**
 * Envia webhooks para múltiplos prédios com ações de ativar/desativar
 */
export const toggleForBuildings = async ({
  buildingIds,
  toDeactivateTitle,
  toActivateTitle
}: {
  buildingIds: string[];
  toDeactivateTitle?: string;
  toActivateTitle?: string;
}): Promise<void> => {
  if (!buildingIds || buildingIds.length === 0) {
    console.warn('⚠️ [WEBHOOK] Nenhum prédio encontrado para enviar webhooks');
    return;
  }

  const actions: Array<{ buildingId: string; titulo: string; ativo: boolean }> = [];

  // Preparar ações de desativação
  if (toDeactivateTitle) {
    buildingIds.forEach(buildingId => {
      actions.push({ buildingId, titulo: toDeactivateTitle, ativo: false });
    });
  }

  // Preparar ações de ativação
  if (toActivateTitle) {
    buildingIds.forEach(buildingId => {
      actions.push({ buildingId, titulo: toActivateTitle, ativo: true });
    });
  }

  if (actions.length === 0) {
    console.log('ℹ️ [WEBHOOK] Nenhuma ação para executar');
    return;
  }

  console.log(`🚀 [WEBHOOK] Enviando ${actions.length} webhooks para ${buildingIds.length} prédios`);

  // Executar todas as requisições em paralelo
  const promises = actions.map(action => 
    patchToggle(action.buildingId, action.titulo, action.ativo)
  );

  try {
    const results = await Promise.allSettled(promises);
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    const failureCount = results.length - successCount;

    if (failureCount > 0) {
      console.warn(`⚠️ [WEBHOOK] ${failureCount}/${results.length} webhooks falharam`);
      toast.warning(`Alguns webhooks falharam (${failureCount}/${results.length}). Vídeo selecionado com sucesso.`);
    } else {
      console.log(`✅ [WEBHOOK] Todos os ${results.length} webhooks enviados com sucesso`);
    }
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro inesperado ao enviar webhooks:', error);
    toast.warning('Erro ao notificar sistemas externos. Vídeo selecionado com sucesso.');
  }
};