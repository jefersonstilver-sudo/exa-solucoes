
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setBaseVideo } from '@/services/videoBaseService';
import { 
  validateVideoFile, 
  uploadVideoToStorage,
  cleanupPendingUploads
} from '@/services/videoStorageService';
import { validateVideoUploadPermission } from '@/services/videoUploadSecurityService';
import { validateScheduleConflicts, formatConflictMessage } from './videoScheduleValidationService';
import type { ScheduleConflict } from './videoScheduleValidationService';
import { uploadCache, getCacheKey } from './videoUploadCacheService';
import { UploadSession } from './videoUploadLogsService';

export interface UploadResult {
  success: boolean;
  isMasterApproved?: boolean;
  isBaseActivated?: boolean;
}

export const uploadVideo = async (
  slotPosition: number,
  file: File,
  userId: string,
  orderId: string,
  onProgress?: (progress: number) => void,
  videoTitle?: string,
  scheduleRules?: any[],
  tipoProduto?: string
): Promise<UploadResult> => {
  // Criar sessão de logs estruturados
  const uploadSession = new UploadSession(orderId, userId);
  
  try {
    console.log(`🚀 Iniciando upload para slot ${slotPosition}:`, file.name);

    // VALIDAÇÃO DE SEGURANÇA OTIMIZADA COM CACHE
    onProgress?.(5);
    const securityStart = uploadSession.logPhaseStart('SECURITY', { 
      slotPosition, 
      fileName: file.name, 
      fileSize: file.size 
    });
    
    const securityCacheKey = getCacheKey.security(orderId);
    let securityValidation = uploadCache.get<any>(securityCacheKey);
    
    if (!securityValidation) {
      console.log('🔍 [VideoUpload] Validando permissões (cache miss)...');
      securityValidation = await validateVideoUploadPermission(orderId);
      
      // Cache por 5 minutos se aprovado, 10 segundos se negado (evitar negações persistentes)
      const cacheTtl = securityValidation?.canUpload ? 5 * 60 * 1000 : 10 * 1000;
      uploadCache.set(securityCacheKey, securityValidation, cacheTtl);
    } else {
      console.log('⚡ [VideoUpload] Validação de segurança (cache hit)');
      // Revalida imediatamente se o cache for uma negação para evitar falsos negativos
      if (securityValidation && securityValidation.canUpload === false) {
        console.log('♻️ [VideoUpload] Cache negativo detectado - revalidando permissão...');
        const freshValidation = await validateVideoUploadPermission(orderId);
        const cacheTtl = freshValidation?.canUpload ? 5 * 60 * 1000 : 10 * 1000;
        uploadCache.set(securityCacheKey, freshValidation, cacheTtl);
        securityValidation = freshValidation;
      }
    }
    
    if (!securityValidation?.canUpload) {
      uploadSession.logPhaseFailure('SECURITY', securityStart, securityValidation?.reason || 'Validação negada');
      toast.error(`Upload não permitido: ${securityValidation?.reason || 'Erro de validação'}`);
      return false;
    }

    uploadSession.logPhaseSuccess('SECURITY', securityStart, { cached: !!uploadCache.get(securityCacheKey) });
    console.log('✅ [VideoUpload] Validação de segurança aprovada');

    // Validar título se fornecido
    if (videoTitle) {
      if (videoTitle.length < 3 || videoTitle.length > 50) {
        toast.error('Título deve ter entre 3 e 50 caracteres');
        return false;
      }
    }

    // LIMPEZA OTIMIZADA COM CACHE E DEBOUNCE
    onProgress?.(10);
    const cleanupStart = uploadSession.logPhaseStart('CLEANUP');
    
    const cleanupCacheKey = getCacheKey.cleanup(userId);
    const lastCleanup = uploadCache.get(cleanupCacheKey);
    
    // Só executa limpeza se não foi feita nos últimos 2 minutos
    if (!lastCleanup) {
      console.log('🧹 [VideoUpload] Executando limpeza (cache miss)...');
      const cleanedCount = await cleanupPendingUploads(userId);
      uploadSession.logPhaseSuccess('CLEANUP', cleanupStart, { cleanedCount, cached: false });
      if (cleanedCount > 0) {
        console.log(`🧹 ${cleanedCount} registros órfãos removidos`);
      }
      
      // Cache por 2 minutos para evitar limpezas excessivas
      uploadCache.set(cleanupCacheKey, { cleanedAt: Date.now() }, 2 * 60 * 1000);
    } else {
      uploadSession.logPhaseSuccess('CLEANUP', cleanupStart, { cached: true, skipped: true });
      console.log('⚡ [VideoUpload] Limpeza pulada (executada recentemente)');
    }

    // Validar vídeo com tipo de produto
    onProgress?.(15);
    const videoTipo: 'horizontal' | 'vertical' = (tipoProduto === 'vertical_premium' || tipoProduto === 'vertical') ? 'vertical' : 'horizontal';
    const validationStart = uploadSession.logPhaseStart('VALIDATION', { fileSize: file.size, fileType: file.type, videoTipo });
    
    const validation = await validateVideoFile(file, videoTipo);
    if (!validation.valid) {
      uploadSession.logPhaseFailure('VALIDATION', validationStart, validation.errors.join(', '), { errors: validation.errors });
      console.error('❌ Validação falhou:', validation.errors);
      toast.error(validation.errors.join(', '));
      return false;
    }

    uploadSession.logPhaseSuccess('VALIDATION', validationStart, { metadata: validation.metadata });
    console.log('✅ Vídeo validado com sucesso:', validation.metadata);
    onProgress?.(25);

    // VALIDAÇÃO CRÍTICA: Verificar conflitos de agendamento ANTES de qualquer operação de upload
    if (scheduleRules && scheduleRules.length > 0) {
      console.log('⏰ [UPLOAD] VALIDAÇÃO CRÍTICA: Verificando conflitos ANTES do upload...');
      
      // Converter formato das regras para a validação
      const convertedRules = scheduleRules
        .filter(rule => rule.isActive && rule.daysOfWeek.length > 0)
        .map(rule => ({
          days_of_week: rule.daysOfWeek,
          start_time: rule.startTime,
          end_time: rule.endTime,
          is_active: rule.isActive
        }));

      console.log('🔍 [UPLOAD] Regras convertidas para validação:', convertedRules);

      const conflicts = await validateScheduleConflicts(orderId, convertedRules);
      
      if (conflicts.length > 0) {
        console.error('🚨 [UPLOAD] CONFLITOS DETECTADOS - BLOQUEANDO UPLOAD COMPLETAMENTE:', conflicts);
        
        // Preparar dados estruturados para o modal
        const structuredConflicts = conflicts.map(conflict => ({
          conflictingVideoName: conflict.conflictingVideoName,
          day: conflict.conflictingDay,
          conflictingTimeRange: `${conflict.conflictingStartTime}-${conflict.conflictingEndTime}`,
          newVideoTimeRange: `${conflict.newStartTime}-${conflict.newEndTime}`
        }));

        // Criar erro estruturado para o modal
        const conflictError = new Error('SCHEDULE_CONFLICT');
        (conflictError as any).conflictData = {
          conflicts: structuredConflicts,
          suggestions: {},
          newVideoName: videoTitle || `Vídeo ${slotPosition}`
        };
        
        console.log('❌ [UPLOAD] UPLOAD TOTALMENTE BLOQUEADO - Retornando erro estruturado');
        throw conflictError;
      }
      
      console.log('✅ [UPLOAD] Nenhum conflito detectado - prosseguindo com upload');
    }

    // Upload para storage
    let videoUrl: string;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        console.log(`📤 Tentativa ${retryCount + 1} de upload...`);
        
        videoUrl = await uploadVideoToStorage(file, userId, (progress) => {
          onProgress?.(25 + (progress * 0.6));
        });
        
        console.log('✅ Upload para storage concluído, URL:', videoUrl);
        break;
      } catch (uploadError) {
        retryCount++;
        console.warn(`⚠️ Tentativa ${retryCount} de upload falhou:`, uploadError);
        
        if (retryCount > maxRetries) {
          throw new Error(`Upload falhou após ${maxRetries + 1} tentativas: ${uploadError.message}`);
        }
        
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(`⏱️ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    onProgress?.(90);

    // Usar título fornecido ou nome do arquivo como fallback
    const finalVideoName = videoTitle || file.name;

    // Extrair metadados de corte se existirem (fallback WebM → original MP4)
    const trimStart = (file as any)?._trimStart ?? null;
    const trimEnd = (file as any)?._trimEnd ?? null;
    const wasTrimFallback = (file as any)?._wasFallbackFromWebm ?? false;
    
    if (wasTrimFallback) {
      console.log('📐 [UPLOAD] Vídeo com metadados de corte (fallback WebM→MP4):', { trimStart, trimEnd });
    }

    // Criar registro do vídeo
    const videoData = {
      client_id: userId,
      nome: finalVideoName,
      url: videoUrl,
      origem: 'cliente',
      status: 'ativo',
      duracao: validation.metadata.duration,
      orientacao: validation.metadata.orientation,
      largura: validation.metadata.width,
      altura: validation.metadata.height,
      tamanho_arquivo: validation.metadata.size,
      formato: validation.metadata.format,
      tem_audio: false,
      trim_start_seconds: trimStart,
      trim_end_seconds: trimEnd,
    };

    console.log('💾 Criando registro de vídeo:', videoData);

    const { data: videoRecord, error: videoError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (videoError) {
      console.error('❌ Erro ao criar registro de vídeo:', videoError);
      throw new Error(`Erro ao salvar vídeo no banco: ${videoError.message}`);
    }

    console.log('✅ Registro de vídeo criado com sucesso:', videoRecord);
    onProgress?.(95);

    // Validar slot_position antes de enviar ao banco
    if (slotPosition < 1 || slotPosition > 10) {
      throw new Error(`Posição de slot inválida (${slotPosition}). O máximo permitido é 10 vídeos por pedido.`);
    }

    // PEDIDO MASTER: verificar se vídeo deve ser auto-aprovado
    let approvalStatus: 'pending' | 'approved' = 'pending';
    try {
      const { data: pedidoCheck } = await supabase
        .from('pedidos')
        .select('is_master')
        .eq('id', orderId)
        .single();

      if (pedidoCheck?.is_master) {
        approvalStatus = 'approved';
        console.log('👑 [MASTER] Pedido Master detectado — vídeo auto-aprovado');
      }
    } catch (e) {
      console.warn('⚠️ Erro ao verificar is_master, usando pending:', e);
    }

    // Usar UPSERT para evitar race conditions em uploads simultâneos
    // Isso substitui a entrada existente OU cria uma nova automaticamente
    console.log('💾 Salvando/atualizando slot com UPSERT');
    const { error: slotError } = await supabase
      .from('pedido_videos')
      .upsert({
        pedido_id: orderId,
        video_id: videoRecord.id,
        slot_position: slotPosition,
        approval_status: approvalStatus,
        selected_for_display: false,
        is_active: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'pedido_id,slot_position',
        ignoreDuplicates: false
      });

    if (slotError) {
      console.error('❌ Erro ao gerenciar slot:', slotError);
      
      // Verificar se é erro de segurança do trigger
      if (slotError.message?.includes('não permitido para pedidos não pagos')) {
        toast.error('Upload não permitido: pedido não foi pago');
        return false;
      }
      
      throw new Error(`Erro ao salvar no slot: ${slotError.message}`);
    }

    console.log('✅ Slot salvo/atualizado com sucesso');

    // MASTER: Verificar e forçar status approved + ativar pipeline
    let isMasterApproved = false;
    let isBaseActivated = false;
    
    if (approvalStatus === 'approved') {
      isMasterApproved = true;
      
      try {
        // Buscar o pedido_videos recém-criado
        const { data: newSlot } = await supabase
          .from('pedido_videos')
          .select('id, approval_status')
          .eq('pedido_id', orderId)
          .eq('slot_position', slotPosition)
          .single();

        if (newSlot) {
          // Hardening: se por qualquer razão o upsert salvou como pending, forçar approved
          if (newSlot.approval_status !== 'approved') {
            console.warn('⚠️ [MASTER] Status veio como', newSlot.approval_status, '— forçando approved');
            await supabase
              .from('pedido_videos')
              .update({ approval_status: 'approved', updated_at: new Date().toISOString() })
              .eq('id', newSlot.id);
          }
          
          // Verificar se já existe um vídeo base no pedido
          const { data: existingBase } = await supabase
            .from('pedido_videos')
            .select('id')
            .eq('pedido_id', orderId)
            .eq('is_base_video', true)
            .maybeSingle();

          if (!existingBase) {
            console.log('👑 [MASTER] Nenhum vídeo base encontrado — ativando pipeline completo via setBaseVideo');
            const result = await setBaseVideo(newSlot.id);
            if (result.success) {
              isBaseActivated = true;
              console.log('✅ [MASTER] Pipeline completo ativado com sucesso');
            } else {
              console.warn('⚠️ [MASTER] setBaseVideo retornou falha:', result);
            }
          } else {
            console.log('👑 [MASTER] Vídeo base já existe — mantendo apenas como aprovado');
          }
        }
      } catch (masterError) {
        console.warn('⚠️ [MASTER] Erro ao tentar ativar pipeline automático:', masterError);
      }
    }

    // Salvar regras de agendamento se fornecidas
    if (scheduleRules && scheduleRules.length > 0) {
      console.log('📅 [UPLOAD] INICIANDO SALVAMENTO DE REGRAS:', { 
        rulesCount: scheduleRules.length, 
        rules: scheduleRules,
        orderId,
        slotPosition,
        videoId: videoRecord.id
      });
      
      try {
        // Primeiro, criar uma campanha avançada para o pedido se não existir
        let campaignId = orderId; // Inicialmente, tentar usar o orderId como campaign_id
        
        // Verificar se já existe uma campanha avançada para este pedido
        const { data: existingCampaign, error: campaignCheckError } = await supabase
          .from('campaigns_advanced')
          .select('id')
          .eq('pedido_id', orderId)
          .maybeSingle();

        if (campaignCheckError) {
          console.error('❌ Erro ao verificar campanha existente:', campaignCheckError);
        }

        if (!existingCampaign) {
          // Criar uma campanha avançada para armazenar o agendamento
          const { data: newCampaign, error: createCampaignError } = await supabase
            .from('campaigns_advanced')
            .insert({
              client_id: userId,
              pedido_id: orderId,
              name: `Campanha - ${finalVideoName}`,
              description: `Campanha automática para vídeo: ${finalVideoName}`,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
              status: 'active'
            })
            .select()
            .single();

          if (createCampaignError || !newCampaign) {
            console.error('❌ Erro ao criar campanha avançada:', createCampaignError);
            throw new Error(`Falha ao criar campanha: ${createCampaignError?.message || 'Dados não retornados'}`);
          }

          campaignId = newCampaign.id;
          console.log('✅ Campanha avançada criada:', { campaignId });
        } else {
          campaignId = existingCampaign.id;
          console.log('✅ Usando campanha existente:', { campaignId });
        }

        // Criar um schedule de vídeo
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('campaign_video_schedules')
          .insert({
            campaign_id: campaignId,
            video_id: videoRecord.id,
            slot_position: slotPosition,
            priority: 1
          })
          .select()
          .single();

        if (scheduleError || !scheduleData) {
          console.error('❌ Erro ao criar schedule:', scheduleError);
          throw new Error(`Falha ao criar agendamento: ${scheduleError?.message || 'Dados não retornados'}`);
        }

        console.log('📊 Schedule criado:', { scheduleId: scheduleData.id });

        // Filtrar apenas regras ativas para salvar
        const activeRules = scheduleRules.filter(rule => rule.isActive && rule.daysOfWeek.length > 0);
        
        console.log('🔍 [UPLOAD] REGRAS PROCESSADAS:', {
          totalRules: scheduleRules.length,
          activeRules: activeRules.length,
          rulesData: activeRules
        });
        
        if (activeRules.length === 0) {
          console.error('❌ [UPLOAD] NENHUMA REGRA ATIVA VÁLIDA! Isso deve bloquear o upload.');
          throw new Error('Nenhuma regra de agendamento ativa válida encontrada. Configure pelo menos uma regra ativa com dias e horários selecionados.');
        }

        // Salvar todas as regras de agendamento ativas
        const ruleInserts = activeRules.map(rule => ({
          campaign_video_schedule_id: scheduleData.id,
          days_of_week: rule.daysOfWeek,
          start_time: rule.startTime,
          end_time: rule.endTime,
          is_active: rule.isActive
        }));

        console.log('📝 Inserindo regras:', { rulesCount: ruleInserts.length, rules: ruleInserts });

        const { data: insertedRules, error: rulesError } = await supabase
          .from('campaign_schedule_rules')
          .insert(ruleInserts)
          .select();

        if (rulesError) {
          console.error('❌ Erro ao salvar regras de agendamento:', rulesError);
          throw new Error(`Falha ao salvar regras: ${rulesError.message}`);
        }

        console.log('✅ [UPLOAD] REGRAS SALVAS COM SUCESSO!', { 
          savedRules: insertedRules?.length || 0,
          scheduleId: scheduleData.id,
          campaignId: campaignId,
          insertedRules: insertedRules
        });

      } catch (scheduleError) {
        console.error('💥 [UPLOAD] ERRO CRÍTICO AO SALVAR AGENDAMENTO:', scheduleError);
        toast.error(`Erro ao salvar agendamento: ${scheduleError instanceof Error ? scheduleError.message : 'Erro desconhecido'}`);
        throw scheduleError; // Re-throw para interromper o processo
      }
    } else {
      console.log('⚠️ [UPLOAD] NENHUMA REGRA DE AGENDAMENTO FORNECIDA - Webhook usará regras padrão');
    }

    onProgress?.(100);
    uploadSession.complete();
    console.log('🎉 Upload completo com sucesso!');
    toast.success(`Vídeo "${finalVideoName}" ${scheduleRules?.length ? 'e agendamento' : ''} enviado com sucesso!`);
    // Invalida caches relacionados ao pedido para evitar decisões antigas
    try {
      uploadCache.invalidateOrder(orderId);
      console.log('🧠 [Cache] Cache de segurança invalidado para o pedido:', orderId);
    } catch (e) {
      console.warn('⚠️ [Cache] Falha ao invalidar cache pós-upload:', e);
    }
    return { success: true, isMasterApproved, isBaseActivated };

  } catch (error) {
    console.error('💥 Erro no upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Tratamento específico para conflitos de agendamento
    if (errorMessage === 'SCHEDULE_CONFLICT') {
      console.log('🚫 [UPLOAD] Erro de conflito capturado - re-lançando para modal');
      throw error; // Re-lançar para ser tratado pelo useOrderVideoManagement
    }
    
    // Tratamento específico para erros de segurança
    if (errorMessage.includes('não permitido para pedidos não pagos')) {
      toast.error('Upload bloqueado: apenas pedidos pagos podem enviar vídeos');
    } else {
      toast.error(`Erro ao fazer upload do vídeo: ${errorMessage}`);
    }
    
    return { success: false };
  }
};
