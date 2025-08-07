
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  validateVideoFile, 
  uploadVideoToStorage,
  cleanupPendingUploads
} from '@/services/videoStorageService';
import { validateVideoUploadPermission } from '@/services/videoUploadSecurityService';
import { validateScheduleConflicts, formatConflictMessage, suggestAvailableTimeSlots } from './videoScheduleValidationService';
import type { ScheduleConflict } from './videoScheduleValidationService';

export const uploadVideo = async (
  slotPosition: number,
  file: File,
  userId: string,
  orderId: string,
  onProgress?: (progress: number) => void,
  videoTitle?: string,
  scheduleRules?: any[]
): Promise<boolean> => {
  try {
    console.log(`🚀 Iniciando upload para slot ${slotPosition}:`, file.name);
    console.log('👤 User ID:', userId);
    console.log('📋 Order ID:', orderId);

    // NOVA VALIDAÇÃO DE SEGURANÇA
    onProgress?.(5);
    const securityValidation = await validateVideoUploadPermission(orderId);
    
    if (!securityValidation.canUpload) {
      console.error('🔒 [VideoUpload] Upload bloqueado por segurança:', securityValidation);
      toast.error(`Upload não permitido: ${securityValidation.reason}`);
      return false;
    }

    console.log('✅ [VideoUpload] Validação de segurança aprovada');

    // Validar título se fornecido
    if (videoTitle) {
      if (videoTitle.length < 3 || videoTitle.length > 50) {
        toast.error('Título deve ter entre 3 e 50 caracteres');
        return false;
      }
    }

    // Limpar uploads pendentes
    onProgress?.(10);
    const cleanedCount = await cleanupPendingUploads(userId);
    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} registros órfãos removidos`);
    }

    // Validar vídeo
    onProgress?.(15);
    const validation = await validateVideoFile(file);
    if (!validation.valid) {
      console.error('❌ Validação falhou:', validation.errors);
      toast.error(validation.errors.join(', '));
      return false;
    }

    console.log('✅ Vídeo validado com sucesso:', validation.metadata);
    onProgress?.(25);

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
      tem_audio: false
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

    // Verificar se já existe entrada para este slot
    const { data: existingSlot, error: checkError } = await supabase
      .from('pedido_videos')
      .select('id')
      .eq('pedido_id', orderId)
      .eq('slot_position', slotPosition)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Erro ao verificar slot existente:', checkError);
    }

    let slotResult;
    if (existingSlot) {
      // Atualizar entrada existente
      console.log('🔄 Atualizando slot existente:', existingSlot.id);
      const { error: updateError } = await supabase
        .from('pedido_videos')
        .update({
          video_id: videoRecord.id,
          approval_status: 'pending',
          selected_for_display: false,
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSlot.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar slot:', updateError);
        throw new Error(`Erro ao atualizar slot: ${updateError.message}`);
      }
      slotResult = { error: null };
    } else {
      // Criar nova entrada (o trigger do banco validará automaticamente)
      console.log('➕ Criando nova entrada no slot');
      const { error: insertError } = await supabase
        .from('pedido_videos')
        .insert({
          pedido_id: orderId,
          video_id: videoRecord.id,
          slot_position: slotPosition,
          approval_status: 'pending',
          selected_for_display: false,
          is_active: false
        });

      slotResult = { error: insertError };
    }

    if (slotResult.error) {
      console.error('❌ Erro ao gerenciar slot:', slotResult.error);
      
      // Verificar se é erro de segurança do trigger
      if (slotResult.error.message?.includes('não permitido para pedidos não pagos')) {
        toast.error('Upload não permitido: pedido não foi pago');
        return false;
      }
      
      throw new Error(`Erro ao salvar no slot: ${slotResult.error.message}`);
    }

    // Validar conflitos de agendamento ANTES de salvar
    if (scheduleRules && scheduleRules.length > 0) {
      console.log('🔍 Validando conflitos de horário...');
      
      // Converter formato das regras para a validação
      const convertedRules = scheduleRules
        .filter(rule => rule.isActive && rule.daysOfWeek.length > 0)
        .map(rule => ({
          days_of_week: rule.daysOfWeek,
          start_time: rule.startTime,
          end_time: rule.endTime,
          is_active: rule.isActive
        }));

      const conflicts = await validateScheduleConflicts(orderId, convertedRules);
      
      if (conflicts.length > 0) {
        console.error('❌ Conflitos de horário detectados:', conflicts);
        
        // Preparar dados estruturados para o modal
        const structuredConflicts = conflicts.map(conflict => ({
          conflictingVideoName: conflict.conflictingVideoName,
          day: conflict.conflictingDay,
          conflictingTimeRange: `${conflict.conflictingStartTime}-${conflict.conflictingEndTime}`,
          newVideoTimeRange: `${conflict.newStartTime}-${conflict.newEndTime}`
        }));

        // Gerar sugestões para cada dia com conflito
        const suggestions: { [day: number]: string[] } = {};
        const conflictDays = [...new Set(conflicts.map(c => c.conflictingDay))];
        
        for (const day of conflictDays) {
          const dayConflicts = conflicts.filter(c => c.conflictingDay === day);
          const timeSlots = suggestAvailableTimeSlots(dayConflicts, day);
          if (timeSlots.length > 0) {
            suggestions[day] = timeSlots;
          }
        }

        // Criar erro estruturado para o modal
        const conflictError = new Error('SCHEDULE_CONFLICT');
        (conflictError as any).conflictData = {
          conflicts: structuredConflicts,
          suggestions,
          newVideoName: videoTitle || `Vídeo ${slotPosition}`
        };
        
        throw conflictError;
      }
      
      console.log('✅ Nenhum conflito de horário detectado');
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
    console.log('🎉 Upload completo com sucesso!');
    toast.success(`Vídeo "${finalVideoName}" ${scheduleRules?.length ? 'e agendamento' : ''} enviado com sucesso!`);
    return true;

  } catch (error) {
    console.error('💥 Erro no upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Tratamento específico para erros de segurança
    if (errorMessage.includes('não permitido para pedidos não pagos')) {
      toast.error('Upload bloqueado: apenas pedidos pagos podem enviar vídeos');
    } else {
      toast.error(`Erro ao fazer upload do vídeo: ${errorMessage}`);
    }
    
    return false;
  }
};
