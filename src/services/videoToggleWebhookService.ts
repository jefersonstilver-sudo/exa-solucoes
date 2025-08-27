import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WEBHOOK_URL_TRUE = 'https://stilver.app.n8n.cloud/webhook/ATIVAR/DESATIVAR';
const WEBHOOK_URL_FALSE = 'https://stilver.app.n8n.cloud/webhook/DESATIVANDO_VIDEO_FALSE';
const getWebhookUrl = (ativo: boolean) => (ativo ? WEBHOOK_URL_TRUE : WEBHOOK_URL_FALSE);

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
    const url = `${getWebhookUrl(ativo)}?building_id=${encodeURIComponent(buildingId)}`;
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
    const response = await fetch(getWebhookUrl(ativo), {
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

// Nova função para POST com predio_id específico
const postToggleForBuilding = async (titulo: string, ativo: boolean, predioId: string): Promise<boolean> => {
  try {
    console.log('🏢 [WEBHOOK][POST][BUILDING] Enviando POST para prédio:', { titulo, ativo, predio_id: predioId });
    const response = await fetch(getWebhookUrl(ativo), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, ativo, predio_id: predioId })
    });
    if (!response.ok) {
      console.warn('⚠️ [WEBHOOK][POST][BUILDING] Falha na requisição para prédio', predioId + ':', response.status, response.statusText);
      return false;
    }
    console.log('✅ [WEBHOOK][POST][BUILDING] Sucesso para prédio', predioId);
    return true;
  } catch (error) {
    console.error('❌ [WEBHOOK][POST][BUILDING] Erro para prédio', predioId + ':', error);
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

  const actions: Array<{ predioId: string; titulo: string; ativo: boolean }> = [];

  // Montar ações explícitas: desativar o anterior (se existir) e ativar o novo (se existir)
  for (const predioId of buildingIds) {
    if (toDeactivateTitle) {
      actions.push({ predioId, titulo: toDeactivateTitle, ativo: false });
    }
    if (toActivateTitle) {
      actions.push({ predioId, titulo: toActivateTitle, ativo: true });
    }
  }

  if (actions.length === 0) {
    console.log('ℹ️ [WEBHOOK] Nenhuma ação para executar');
    return;
  }

console.log(`🏢 [WEBHOOK] Preparando envio via Edge Function: ${actions.length} ação(ões)`);

  try {
    const payload = {
      actions: actions.map(({ predioId, titulo, ativo }) => ({
        predio_id: predioId,
        titulo,
        ativo
      }))
    };

    const { data, error } = await supabase.functions.invoke('notify-video-toggle', {
      body: payload
    });

    if (error) throw error;
    console.log('✅ [WEBHOOK][EDGE] Envio concluído:', data);
    return;
  } catch (edgeErr) {
    console.warn('⚠️ [WEBHOOK][EDGE] Falha no envio via Edge. Usando fallback direto...', edgeErr);
  }

  try {
    const postPromises = actions.map(({ predioId, titulo, ativo }) =>
      postToggleForBuilding(titulo, ativo, predioId)
    );

    const results = await Promise.allSettled(postPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failureCount = results.length - successCount;

    if (failureCount > 0) {
      console.warn(`⚠️ [WEBHOOK][POST][BUILDING] ${failureCount}/${results.length} POST(s) falharam`);
      toast.warning(`Alguns webhooks falharam (${failureCount}/${results.length}).`);
    } else {
      console.log(`✅ [WEBHOOK][POST][BUILDING] Todos os POST(s) enviados com sucesso`);
    }
  } catch (error) {
    console.error('❌ [WEBHOOK][POST][BUILDING] Erro inesperado ao enviar POST(s):', error);
    toast.warning('Erro ao notificar sistemas externos.');
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