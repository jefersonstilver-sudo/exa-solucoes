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
      messageText = '[Áudio]';
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
