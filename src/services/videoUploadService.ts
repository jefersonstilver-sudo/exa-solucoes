
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  validateVideoFile, 
  uploadVideoToStorage,
  cleanupPendingUploads
} from '@/services/videoStorageService';
import { validateVideoUploadPermission } from '@/services/videoUploadSecurityService';

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
        // Buscar o ID do pedido_video que acabamos de criar/atualizar
        const { data: pedidoVideoData, error: findError } = await supabase
          .from('pedido_videos')
          .select('id')
          .eq('pedido_id', orderId)
          .eq('slot_position', slotPosition)
          .single();

        if (findError || !pedidoVideoData) {
          console.error('❌ Erro ao buscar pedido_video para salvar regras:', findError);
          throw new Error(`Falha ao localizar registro do vídeo: ${findError?.message || 'Dados não encontrados'}`);
        }

        console.log('📋 Pedido video encontrado:', { pedidoVideoId: pedidoVideoData.id });

        // Criar um schedule de vídeo para campanhas avançadas
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('campaign_video_schedules')
          .insert({
            campaign_id: orderId, // Usar orderId como campaign_id temporariamente
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
          insertedRules: insertedRules
        });

      } catch (scheduleError) {
        console.error('💥 [UPLOAD] ERRO CRÍTICO AO SALVAR AGENDAMENTO:', scheduleError);
        toast.error(`Erro ao salvar agendamento: ${scheduleError instanceof Error ? scheduleError.message : 'Erro desconhecido'}`);
        throw scheduleError; // Re-throw para interromper o processo
      }
    } else {
      console.error('❌ [UPLOAD] NENHUMA REGRA DE AGENDAMENTO FORNECIDA!');
      throw new Error('Regras de agendamento são obrigatórias. Configure pelo menos uma regra de exibição antes de fazer upload.');
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
