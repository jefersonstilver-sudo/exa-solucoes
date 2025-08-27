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

// Envio adicional em modo POST para n8n, conforme solicitado
const postToggle = async (titulo: string, ativo: boolean): Promise<boolean> => {
  try {
    console.log('🔔 [WEBHOOK][POST] Enviando POST:', { titulo, ativo });
    const response = await fetch(WEBHOOK_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, ativo })
    });
    if (!response.ok) {
      console.warn('⚠️ [WEBHOOK][POST] Falha na requisição:', response.status, response.statusText);
      return false;
    }
    console.log('✅ [WEBHOOK][POST] Sucesso');
    return true;
  } catch (error) {
    console.error('❌ [WEBHOOK][POST] Erro:', error);
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

  // Enviar POSTs adicionais solicitados (não altera a lógica existente de PATCH)
  try {
    const postPromises: Promise<boolean>[] = [];
    if (toActivateTitle) {
      postPromises.push(postToggle(toActivateTitle, true));
    }
    if (toDeactivateTitle && toDeactivateTitle !== toActivateTitle) {
      postPromises.push(postToggle(toDeactivateTitle, false));
    }

    if (postPromises.length > 0) {
      console.log(`📬 [WEBHOOK][POST] Enviando ${postPromises.length} POST(s) adicionais`);
      const postResults = await Promise.allSettled(postPromises);
      const postSuccessCount = postResults.filter(r => r.status === 'fulfilled' && r.value === true).length;
      const postFailureCount = postResults.length - postSuccessCount;
      if (postFailureCount > 0) {
        console.warn(`⚠️ [WEBHOOK][POST] ${postFailureCount}/${postResults.length} POST(s) falharam`);
      } else {
        console.log(`✅ [WEBHOOK][POST] Todos os POST(s) enviados com sucesso`);
      }
    } else {
      console.log('ℹ️ [WEBHOOK][POST] Nenhum POST a enviar');
    }
  } catch (postError) {
    console.error('❌ [WEBHOOK][POST] Erro inesperado ao enviar POST(s):', postError);
  }
};

// Função utilitária exportada para enviar apenas POSTs quando não houver prédios (fallback)
export const postToggleTitles = async ({
  toActivateTitle,
  toDeactivateTitle
}: {
  toActivateTitle?: string;
  toDeactivateTitle?: string;
}): Promise<void> => {
  try {
    const postPromises: Promise<boolean>[] = [];
    if (toActivateTitle) {
      postPromises.push(postToggle(toActivateTitle, true));
    }
    if (toDeactivateTitle && toDeactivateTitle !== toActivateTitle) {
      postPromises.push(postToggle(toDeactivateTitle, false));
    }

    if (postPromises.length === 0) {
      console.log('ℹ️ [WEBHOOK][POST] Fallback sem títulos para enviar');
      return;
    }

    console.log(`📬 [WEBHOOK][POST][FALLBACK] Enviando ${postPromises.length} POST(s) sem prédios`);
    const postResults = await Promise.allSettled(postPromises);
    const postSuccessCount = postResults.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const postFailureCount = postResults.length - postSuccessCount;

    if (postFailureCount > 0) {
      console.warn(`⚠️ [WEBHOOK][POST][FALLBACK] ${postFailureCount}/${postResults.length} POST(s) falharam`);
    } else {
      console.log(`✅ [WEBHOOK][POST][FALLBACK] Todos os POST(s) enviados com sucesso`);
    }
  } catch (error) {
    console.error('❌ [WEBHOOK][POST][FALLBACK] Erro inesperado ao enviar POST(s):', error);
  }
}