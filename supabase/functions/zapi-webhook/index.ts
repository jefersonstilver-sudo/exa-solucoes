import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting cache (in-memory)
const processingCache = new Map<string, number>();
const DEBOUNCE_MS = 2000; // 2 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload from Z-API
    const payload = await req.json();
    console.log('[ZAPI-WEBHOOK] Received:', JSON.stringify(payload, null, 2));

    // Z-API envia mensagens no formato:
    // { phone: "5545991415920", text: { message: "texto" }, instanceId: "..." }
    // Também pode enviar: sticker, image, audio, video, document
    const phone = payload.phone || payload.remoteJid?.replace('@s.whatsapp.net', '');
    const instanceId = payload.instanceId;

    // ========== FILTRO: IGNORAR MENSAGENS ENVIADAS PELO PRÓPRIO AGENTE ==========
    const fromMe = payload.fromMe || (payload.isGroupMsg === false && !payload.author);
    
    if (fromMe) {
      console.log('[ZAPI-WEBHOOK] ⏭️ Skipping outbound message (fromMe=true)');
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: 'outbound_message'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair ID único da mensagem para deduplicação
    const messageId = payload.messageId || payload.id || payload.key?.id || `${phone}_${Date.now()}`;
    
    console.log('[ZAPI-WEBHOOK] 🔑 Message ID:', messageId);

    // Detectar tipo de mensagem e extrair conteúdo
    let messageText = '';
    let mediaUrl = null;
    let mediaType = 'text';

    if (payload.text?.message) {
      messageText = payload.text.message;
      mediaType = 'text';
    } else if (payload.image?.imageUrl) {
      messageText = payload.image.caption || '[Imagem]';
      mediaUrl = payload.image.imageUrl;
      mediaType = 'image';
    } else if (payload.audio?.audioUrl) {
      console.log('[ZAPI-WEBHOOK] 🎤 Audio detected');
      messageText = '[Áudio]'; // Temporário, será transcrito depois
      mediaUrl = payload.audio.audioUrl;
      mediaType = 'audio';
    } else if (payload.sticker?.stickerUrl) {
      messageText = '[Figurinha]';
      mediaUrl = payload.sticker.stickerUrl;
      mediaType = 'sticker';
    } else if (payload.video?.videoUrl) {
      messageText = payload.video.caption || '[Vídeo]';
      mediaUrl = payload.video.videoUrl;
      mediaType = 'video';
    } else if (payload.document?.documentUrl) {
      messageText = payload.document.fileName || '[Documento]';
      mediaUrl = payload.document.documentUrl;
      mediaType = 'document';
    } else {
      messageText = payload.body || '';
    }

    if (!phone || !messageText) {
      console.log('[ZAPI-WEBHOOK] Invalid payload, missing phone or message');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[ZAPI-WEBHOOK] 📨 Message type:', mediaType, mediaUrl ? '(has media)' : '(text only)');

    // ========== DETECÇÃO DE COMANDO DE TREINAMENTO ==========
    const normalizedText = messageText.trim().toUpperCase();
    if (normalizedText === '#AJUSTE3029' || normalizedText === '#AJUSTAR3029') {
      console.log('🎓 [STEP 1] Comando detectado:', normalizedText);
      console.log('🔍 [STEP 1] instanceId:', instanceId);
      console.log('🔍 [STEP 1] phone:', phone);
      
      // Buscar agente
      const { data: tempAgent, error: agentError } = await supabase
        .from('agents')
        .select('key, zapi_config')
        .eq('whatsapp_provider', 'zapi')
        .eq('zapi_config->>instance_id', instanceId)
        .single();
      
      if (!tempAgent || agentError) {
        console.log('❌ [STEP 2] Agente NÃO encontrado');
        console.log('❌ instanceId buscado:', instanceId);
        console.log('❌ Erro:', agentError);
        
        // Listar agentes para debug
        const { data: allAgents } = await supabase
          .from('agents')
          .select('key, zapi_config');
        console.log('📋 Agentes disponíveis:', allAgents?.map(a => ({
          key: a.key,
          instance_id: (a.zapi_config as any)?.instance_id
        })));
        
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Agent not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('✅ [STEP 2] Agente encontrado:', tempAgent.key);
      
      const zapiConfig = tempAgent.zapi_config as any;
      const trainingKey = `training_mode_${phone}`;
      
      console.log('🔄 [STEP 3] Buscando estado atual...');
      
      // Alternar modo de treinamento
      const { data: existingMode, error: modeError } = await supabase
        .from('agent_context')
        .select('value')
        .eq('key', trainingKey)
        .single();
      
      const isCurrentlyActive = existingMode?.value?.active || false;
      const newState = !isCurrentlyActive;
      
      console.log(`🔄 [STEP 3] Estado: ${isCurrentlyActive} → ${newState}`);
      
      const { error: upsertError } = await supabase
        .from('agent_context')
        .upsert({
          key: trainingKey,
          value: { active: newState, activated_at: new Date().toISOString() }
        });
      
      if (upsertError) {
        console.log('❌ [STEP 3] Erro ao salvar:', upsertError);
      } else {
        console.log(`✅ [STEP 3] Modo ${newState ? 'ATIVADO' : 'DESATIVADO'}`);
      
      }
      
      // Enviar confirmação
      const confirmMessage = newState 
        ? `✅ *Modo Treinamento Ativado*\n\n🎓 Oi! Agora estou no modo aluna.\n\nVocê pode me fazer perguntas de teste e corrigir minhas respostas. Vou aceitar suas correções com gratidão!\n\n_Para desativar: #AJUSTE3029_`
        : `✅ *Modo Treinamento Desativado*\n\nVoltei ao modo normal de operação. Obrigada pelo treinamento! 😊`;
      
      console.log('📤 [STEP 4] Enviando confirmação:', confirmMessage.substring(0, 50) + '...');
      
      const apiUrl = zapiConfig.api_url || 'https://api.z-api.io';
      const sendUrl = `${apiUrl}/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
      
      console.log('📤 [STEP 4] URL:', sendUrl);
      
      try {
        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiConfig.client_token
          },
          body: JSON.stringify({
            phone: phone,
            message: confirmMessage
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('❌ [STEP 4] Z-API error:', response.status, errorText);
        } else {
          console.log('✅ [STEP 4] Confirmação enviada');
        }
      } catch (error) {
        console.log('❌ [STEP 4] Erro de rede:', error);
      }
      
      // Salvar mensagens no banco
      console.log('💾 [STEP 5] Salvando mensagens...');
      
      let { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_phone', phone)
        .eq('agent_key', tempAgent.key)
        .maybeSingle();
      
      if (!conversation) {
        console.log('💾 [STEP 5] Criando nova conversa...');
        const { data: newConv, error: newConvError } = await supabase
          .from('conversations')
          .insert({
            contact_phone: phone,
            agent_key: tempAgent.key,
            status: 'active'
          })
          .select('id')
          .single();
        
        if (newConvError) {
          console.log('❌ [STEP 5] Erro ao criar conversa:', newConvError);
        } else {
          conversation = newConv;
          console.log('✅ [STEP 5] Conversa criada:', conversation?.id);
        }
      } else {
        console.log('✅ [STEP 5] Conversa encontrada:', conversation.id);
      }
      
      if (conversation) {
        const { error: msgError } = await supabase.from('messages').insert([
          {
            conversation_id: conversation.id,
            body: messageText,
            direction: 'inbound',
            agent_key: tempAgent.key
          },
          {
            conversation_id: conversation.id,
            body: confirmMessage,
            direction: 'outbound',
            agent_key: tempAgent.key,
            read_at: new Date().toISOString()
          }
        ]);
        
        if (msgError) {
          console.log('❌ [STEP 5] Erro ao salvar mensagens:', msgError);
        } else {
          console.log('✅ [STEP 5] Mensagens salvas');
        }
      }
      
      console.log(`🎉 [STEP 6] CONCLUÍDO - Modo ${newState ? 'ATIVADO' : 'DESATIVADO'}`);
      
      // ✅ RETURN IMEDIATO
      return new Response(JSON.stringify({ 
        success: true, 
        training_mode: newState
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Identificar qual agente recebeu a mensagem baseado no instanceId
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('whatsapp_provider', 'zapi')
      .eq('zapi_config->>instance_id', instanceId)
      .single();

    if (agentError || !agent) {
      console.error('[ZAPI-WEBHOOK] Agent not found for instance:', instanceId);
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[ZAPI-WEBHOOK] ✅ Agent found:', agent.key, '- Instance:', instanceId);

    // ========== PROCESSAR IMAGENS COM VISÃO AI SE HABILITADO ==========
    if (mediaType === 'image' && payload.image?.imageUrl && agent.vision_enabled) {
      console.log('[ZAPI-WEBHOOK] 👁️ Vision AI enabled, analyzing image...');
      try {
        const { data: imageAnalysis, error: analysisError } = await supabase.functions.invoke('analyze-image', {
          body: {
            imageUrl: payload.image.imageUrl,
            agentKey: agent.key
          }
        });
        
        if (analysisError) {
          console.error('[ZAPI-WEBHOOK] ❌ Image analysis error:', analysisError);
          messageText = `[Imagem] ${payload.image.caption || ''}`;
        } else if (imageAnalysis?.description) {
          // Enriquecer o texto da mensagem com a descrição da imagem
          const imageDescription = imageAnalysis.description;
          messageText = payload.image.caption 
            ? `[Imagem: ${imageDescription}]\nLegenda: ${payload.image.caption}`
            : `[Imagem: ${imageDescription}]`;
          console.log('[ZAPI-WEBHOOK] ✅ Image analyzed:', messageText.substring(0, 100) + '...');
        }
      } catch (error) {
        console.error('[ZAPI-WEBHOOK] ❌ Image analysis failed:', error);
        messageText = `[Imagem] ${payload.image.caption || ''}`;
      }
    }

    // ========== TRANSCREVER ÁUDIO SE NECESSÁRIO ==========
    if (mediaType === 'audio' && payload.audio?.audioUrl) {
      console.log('[ZAPI-WEBHOOK] 🔍 Checking audio transcription config...');
      const openaiConfig = agent.openai_config as any;
      
      if (openaiConfig?.audio_transcription_enabled) {
        try {
          console.log('[ZAPI-WEBHOOK] 🔄 Transcribing audio...');
          const { data: transcription, error: transcriptionError } = await supabase.functions.invoke('transcribe-audio', {
            body: {
              audioUrl: payload.audio.audioUrl,
              language: openaiConfig.audio_language || 'pt',
              prompt: openaiConfig.audio_prompt || 'Áudio de WhatsApp'
            }
          });
          
          if (transcriptionError) {
            console.error('[ZAPI-WEBHOOK] ❌ Transcription error:', transcriptionError);
            messageText = '[Áudio - erro ao transcrever]';
          } else if (transcription?.text) {
            messageText = transcription.text;
            console.log('[ZAPI-WEBHOOK] ✅ Audio transcribed:', messageText.substring(0, 50) + '...');
          } else {
            messageText = '[Áudio - transcrição indisponível]';
          }
        } catch (error) {
          console.error('[ZAPI-WEBHOOK] ❌ Transcription failed:', error);
          messageText = '[Áudio - erro ao transcrever]';
        }
      } else {
        console.log('[ZAPI-WEBHOOK] ℹ️ Audio transcription disabled for this agent');
      }
    }

    // ========== VERIFICAR SE AGENTE ESTÁ ATIVO ==========
    if (!agent.is_active) {
      console.log('[ZAPI-WEBHOOK] ⚠️ Agent is inactive:', agent.key);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Agent is inactive',
        agent: agent.key
      }), {
        status: 200, // Retorna 200 para evitar retry da Z-API
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // ========== FALLBACK: VERIFICAR CONFIRMAÇÃO PENDENTE ==========
    const { data: pendingConfirmation } = await supabase
      .from('agent_context')
      .select('value')
      .eq('key', `training_confirmation_pending_${phone}`)
      .single();
    
    if (pendingConfirmation?.value?.pending) {
      console.log('[ZAPI-WEBHOOK] 🔔 Confirmação pendente detectada, enviando agora...');
      const state = pendingConfirmation.value.state;
      const activatedAt = new Date(pendingConfirmation.value.activated_at);
      const now = new Date();
      const hoursDiff = Math.floor((now.getTime() - activatedAt.getTime()) / (1000 * 60 * 60));
      
      const fallbackMessage = state 
        ? `⚠️ *Modo Treinamento já estava ativo desde ${hoursDiff}h atrás*\n\nVocê pode corrigir minhas respostas. Para desativar: #AJUSTE3029`
        : '✅ *Modo Treinamento foi desativado*';
      
      try {
        const zapiConfig = agent.zapi_config as any;
        const apiUrl = zapiConfig.api_url || 'https://api.z-api.io';
        const sendUrl = `${apiUrl}/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
        
        await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiConfig.client_token
          },
          body: JSON.stringify({
            phone: phone,
            message: fallbackMessage
          })
        });
        
        console.log('[ZAPI-WEBHOOK] ✅ Confirmação pendente enviada');
        
        // Remover flag do banco
        await supabase
          .from('agent_context')
          .delete()
          .eq('key', `training_confirmation_pending_${phone}`);
      } catch (error) {
        console.error('[ZAPI-WEBHOOK] ❌ Erro ao enviar confirmação pendente:', error);
      }
    }

    // ========== VERIFICAÇÃO DE DEDUPLICAÇÃO ==========
    const { data: existingLog } = await supabase
      .from('zapi_logs')
      .select('id, created_at')
      .eq('zapi_message_id', messageId)
      .maybeSingle();

    if (existingLog) {
      console.log('[ZAPI-WEBHOOK] ⚠️ DUPLICATE DETECTED - Already processed:', {
        messageId,
        existingLogId: existingLog.id,
        existingLogTime: existingLog.created_at
      });
      return new Response(JSON.stringify({ 
        success: true,
        duplicate: true,
        messageId,
        originalProcessedAt: existingLog.created_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== DEDUPLICAÇÃO POR CONTEÚDO ==========
    // Verificação adicional: mesma mensagem + telefone em janela de 10 segundos
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

    const { data: recentSimilarLog } = await supabase
      .from('zapi_logs')
      .select('id, created_at')
      .eq('phone_number', phone)
      .eq('message_text', messageText)
      .eq('direction', 'inbound')
      .gte('created_at', tenSecondsAgo)
      .maybeSingle();

    if (recentSimilarLog) {
      console.log('[ZAPI-WEBHOOK] ⚠️ CONTENT DUPLICATE - Same message recently:', {
        messageText,
        phone,
        recentLogId: recentSimilarLog.id,
        secondsAgo: (Date.now() - new Date(recentSimilarLog.created_at).getTime()) / 1000
      });
      
      return new Response(JSON.stringify({ 
        success: true,
        contentDuplicate: true,
        recentLogId: recentSimilarLog.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== RATE LIMITING POR TELEFONE ==========
    const cacheKey = `${phone}_${agent.key}`;
    const lastProcessed = processingCache.get(cacheKey);
    const now = Date.now();

    if (lastProcessed && (now - lastProcessed) < DEBOUNCE_MS) {
      console.log('[ZAPI-WEBHOOK] 🚫 Rate limit - Too fast:', {
        phone,
        timeSinceLastMs: now - lastProcessed
      });
      
      return new Response(JSON.stringify({ 
        success: true,
        rateLimited: true,
        waitMs: DEBOUNCE_MS - (now - lastProcessed)
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    processingCache.set(cacheKey, now);
    // Limpar cache após 5 segundos
    setTimeout(() => processingCache.delete(cacheKey), 5000);

    // Log inbound message COM messageId para deduplicação
    const { error: logError } = await supabase.from('zapi_logs').insert({
      agent_key: agent.key,
      direction: 'inbound',
      phone_number: phone,
      message_text: messageText,
      media_url: mediaUrl,
      zapi_message_id: messageId,
      status: 'received',
      metadata: { 
        raw_payload: payload,
        media_type: mediaType
      }
    });

    if (logError) {
      console.error('[ZAPI-WEBHOOK] ❌ Error logging message:', logError);
    }

    console.log('[ZAPI-WEBHOOK] ✅ Message logged with ID:', messageId);

    // Responder IMEDIATAMENTE para evitar retry da Z-API
    const immediateResponse = new Response(JSON.stringify({ 
      success: true,
      agent: agent.key,
      messageId,
      processing: 'async'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    // Processar tudo de forma ASSÍNCRONA (não bloqueia resposta)
    (async () => {
      try {
        console.log('[ZAPI-WEBHOOK] 🔄 Starting async processing...');

        // VALIDAÇÃO ESPECIAL PARA IRIS (somente diretores autorizados)
        if (agent.key === 'iris') {
          const { data: director } = await supabase
            .from('iris_authorized_directors')
            .select('*')
            .eq('phone_number', phone)
            .eq('is_active', true)
            .single();

          if (!director) {
            console.log('[ZAPI-WEBHOOK] IRIS: Unauthorized number:', phone);
            
            // Log tentativa de acesso não autorizado
            await supabase.from('agent_logs').insert({
              agent_key: 'iris',
              event_type: 'unauthorized_access_attempt',
              metadata: { phone, message: messageText }
            });

            // Enviar mensagem de rejeição educada
            const rejectMessage = `Olá! Este é um canal exclusivo da Diretoria INDEXA. 

Para suporte comercial, entre em contato com nossa equipe através do +55 45 99141-5920 (Sofia).

Obrigado pela compreensão!`;

            await supabase.functions.invoke('zapi-send-message', {
              body: {
                agentKey: 'iris',
                phone,
                message: rejectMessage
              }
            });

            return;
          }

          console.log('[ZAPI-WEBHOOK] IRIS: Authorized director:', director.director_name);
        }

        // BLOQUEIO PARA EXA ALERT (notification-only)
        if (agent.key === 'exa_alert') {
          console.log('[ZAPI-WEBHOOK] EXA Alert: ignoring inbound (notification-only)');
          return;
        }

        // Criar/Atualizar conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .upsert({
            external_id: phone,
            contact_phone: phone,
            contact_name: payload.senderName || null,
            agent_key: agent.key,
            provider: 'zapi',
            status: 'open',
            last_message_at: new Date().toISOString()
          }, {
            onConflict: 'external_id,agent_key',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (convError) {
          console.error('[ZAPI-WEBHOOK] ❌ Conversation upsert error:', convError);
          throw new Error(`Failed to upsert conversation: ${convError.message}`);
        }

        if (!conversation) {
          console.error('[ZAPI-WEBHOOK] ❌ Conversation returned null without error');
          throw new Error('Conversation returned null');
        }

        console.log('[ZAPI-WEBHOOK] ✅ Conversation created/updated:', conversation.id);

        // Salvar mensagem
        const { data: savedMessage, error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          agent_key: agent.key,
          provider: 'zapi',
          direction: 'inbound',
          from_role: 'user',
          body: messageText,
          raw_payload: payload
        }).select().single();

        if (messageError) {
          console.error('[ZAPI-WEBHOOK] ❌ Error saving message:', messageError);
          throw messageError;
        }

        console.log('[ZAPI-WEBHOOK] ✅ Message saved:', savedMessage.id);

        // Normalizar payload para formato interno do route-message
        const normalizedPayload = {
          message: messageText,
          conversationId: conversation.id,
          metadata: {
            source: 'zapi',
            agentKey: agent.key,
            phone,
            instanceId,
            timestamp: new Date().toISOString()
          }
        };

        // Chamar route-message para processar e responder
        console.log('[ZAPI-WEBHOOK] ✅ Calling route-message...');
        const { data: routeResult, error: routeError } = await supabase.functions.invoke(
          'route-message',
          { body: normalizedPayload }
        );

        if (routeError) {
          console.error('[ZAPI-WEBHOOK] ❌ Route error:', routeError);
          throw routeError;
        }

        console.log('[ZAPI-WEBHOOK] ✅ Route result:', routeResult);

        // Verificar se precisa chamar IA automaticamente
        if (agent.ai_auto_response && routeResult?.routed_to) {
          console.log('[ZAPI-WEBHOOK] 🤖 AI auto-response enabled, calling generate-ai-response...');
          
          try {
            const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-ai-response', {
              body: {
                conversationId: conversation.id,
                message: messageText,
                agentKey: agent.key,
                phoneNumber: phone
              }
            });

            if (aiError) {
              console.error('[ZAPI-WEBHOOK] ❌ AI generation error:', aiError);
            } else {
              console.log('[ZAPI-WEBHOOK] ✅ AI response generated successfully');
            }
          } catch (aiError) {
            console.error('[ZAPI-WEBHOOK] ❌ AI invocation failed:', aiError);
          }
        }

        // Se route-message retornou uma resposta manual (ações), enviá-la
        if (routeResult?.response) {
          await supabase.functions.invoke('zapi-send-message', {
            body: {
              agentKey: agent.key,
              phone,
              message: routeResult.response
            }
          });
        }

        console.log('[ZAPI-WEBHOOK] ✅ Async processing completed');
      } catch (error) {
        console.error('[ZAPI-WEBHOOK] ❌ Async processing error:', error);
        // Log erro mas não falha (resposta já foi enviada)
        await supabase.from('api_logs').insert({
          api_name: 'zapi-webhook',
          endpoint: '/zapi-webhook',
          success: false,
          error_message: error.message,
          request_payload: { messageId, phone, agent: agent?.key }
        });
      }
    })();

    // Retornar resposta imediata
    return immediateResponse;

  } catch (error) {
    console.error('[ZAPI-WEBHOOK] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
