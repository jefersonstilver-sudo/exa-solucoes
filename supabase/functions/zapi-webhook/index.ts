import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkDuplicate } from "../_shared/deduplicate.ts";

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
    console.log('[ZAPI-WEBHOOK] 📥 Received:', JSON.stringify(payload, null, 2));
    
    // 🧹 LIMPEZA DE LOCKS ANTIGOS (>10 minutos)
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: oldLocks } = await supabase
        .from('agent_context')
        .select('key, updated_at')
        .like('key', 'ai_processing_%')
        .lt('updated_at', tenMinutesAgo);
      
      if (oldLocks && oldLocks.length > 0) {
        console.log(`🧹 [CLEANUP] Removendo ${oldLocks.length} locks antigos`);
        for (const lock of oldLocks) {
          await supabase.from('agent_context').delete().eq('key', lock.key);
        }
      }
    } catch (cleanupError) {
      console.error('❌ [CLEANUP] Erro ao limpar locks:', cleanupError);
    }
    
    // 🔍 LOG ESPECIAL PARA EDUARDO - Detectar suas mensagens
    if (payload.instanceId === '3EA943191043E27F5BEB7EDE6B443D3D') {
      console.log('🔵 [EDUARDO] Mensagem recebida na instância do Eduardo:', {
        phone: payload.phone,
        messageId: payload.messageId || payload.id,
        hasText: !!payload.text?.message,
        hasImage: !!payload.image,
        hasAudio: !!payload.audio,
        timestamp: new Date().toISOString()
      });
    }

    // Detectar se é grupo ANTES de processar
    const isGroup = payload.isGroup === true || 
                    payload.phone?.endsWith('-group') ||
                    payload.phone?.includes('@g.us') || 
                    payload.remoteJid?.includes('@g.us') ||
                    payload.chatId?.includes('@g.us');
    
    console.log('[ZAPI-WEBHOOK] 🔍 Group detection:', {
      isGroup,
      payloadIsGroup: payload.isGroup,
      phone: payload.phone,
      phoneEndsWithGroup: payload.phone?.endsWith('-group'),
      remoteJid: payload.remoteJid,
      chatId: payload.chatId,
      chatName: payload.chatName,
      senderName: payload.senderName,
      participantPhone: payload.participantPhone
    });

    // Z-API envia mensagens no formato:
    // { phone: "5545991415920", text: { message: "texto" }, instanceId: "..." }
    // Para grupos: phone termina em @g.us, isGroup: true
    const phone = payload.phone || payload.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const instanceId = payload.instanceId;

    // ========== CAPTURAR MENSAGENS ENVIADAS PELO PRÓPRIO AGENTE (fromMe=true) ==========
    // IMPORTANTE: Só considerar fromMe quando explicitamente true no payload
    // NÃO usar heurística que pode classificar buttonReply incorretamente
    const fromMe = payload.fromMe === true;
    
    // Se tem buttonReply, NUNCA é fromMe (é resposta do usuário)
    const hasButtonReply = !!(payload.buttonReply || payload.buttonsResponseMessage);
    
    if (fromMe && !hasButtonReply) {
      console.log('[ZAPI-WEBHOOK] 📤 Processing outbound message (fromMe=true)');
      
      // ✅ Extrair messageId no início do bloco
      const outboundMessageId = payload.messageId || payload.id || payload.key?.id || `outbound_${phone}_${Date.now()}`;
      
      // Identificar agente pela instanceId
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

      // Extrair texto da mensagem
      let messageText = '';
      if (payload.text?.message) {
        messageText = payload.text.message;
      } else if (payload.body) {
        messageText = payload.body;
      }

      if (!messageText) {
        console.log('[ZAPI-WEBHOOK] Outbound message has no text, skipping');
        return new Response(JSON.stringify({ 
          success: true, 
          skipped: true,
          reason: 'no_text'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Buscar conversa existente
      const externalId = `${phone}_${agent.key}`;
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('external_id', externalId)
        .maybeSingle();

      if (conv) {
        console.log('[ZAPI-WEBHOOK] 💾 Saving outbound message to conversation:', conv.id);

        // Salvar mensagem outbound
        const { error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conv.id,
            agent_key: agent.key,
            provider: 'zapi',
            direction: 'outbound',
            from_role: 'agent',
            body: messageText,
            is_automated: false,
            raw_payload: { 
              zapi_message_id: outboundMessageId,
              sent_via: 'whatsapp_direct',
              fromMe: true,
              timestamp: new Date().toISOString()
            }
          });

        if (insertError) {
          console.error('[ZAPI-WEBHOOK] Error inserting outbound message:', insertError);
        } else {
          console.log('[ZAPI-WEBHOOK] ✅ Outbound message saved');
        }

        // Atualizar conversa: não está mais aguardando resposta
        await supabase
          .from('conversations')
          .update({ 
            awaiting_response: false,
            last_message_at: new Date().toISOString()
          })
          .eq('id', conv.id);

        // Log no zapi_logs
        await supabase.from('zapi_logs').insert({
          agent_key: agent.key,
          direction: 'outbound',
          phone_number: phone,
          message_text: messageText,
          status: 'sent',
          zapi_message_id: outboundMessageId,
          metadata: {
            sent_via: 'whatsapp_direct',
            fromMe: true
          }
        });

        console.log('[ZAPI-WEBHOOK] ✅ Outbound message fully processed');
      } else {
        console.log('[ZAPI-WEBHOOK] ⚠️ No existing conversation found for outbound message');
      }

      return new Response(JSON.stringify({ 
        success: true, 
        direction: 'outbound',
        agent: agent.key,
        messageId: outboundMessageId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== PROCESSAR RESPOSTA DE BOTÕES (ESCALAÇÕES) ==========
    const buttonReply = payload.buttonReply || payload.buttonsResponseMessage;
    
    if (buttonReply) {
      const buttonId = buttonReply.buttonId || buttonReply.selectedButtonId || buttonReply.id;
      console.log('[ZAPI-WEBHOOK] 🔘 Button reply detected:', {
        buttonId,
        phone,
        payload: buttonReply
      });
      
      // Verificar se é um botão de escalação
      // Formato: escalacao_respondida_UUID ou escalacao_depois_UUID
      if (buttonId?.startsWith('escalacao_')) {
        const parts = buttonId.split('_');
        // escalacao_respondida_UUID ou escalacao_depois_UUID
        const action = parts[1]; // 'respondida' ou 'depois'
        const escalacaoId = parts.slice(2).join('_'); // UUID (pode ter underscores)
        
        console.log('[ZAPI-WEBHOOK] 📍 Escalation button action:', {
          action,
          escalacaoId,
          phone
        });
        
        if (escalacaoId) {
          let newStatus = 'pendente';
          let responseType = null;
          let confirmMsg = '';
          
          // Buscar vendedor que clicou pelo telefone
          const { data: sellerData } = await supabase
            .from('escalacao_vendedores')
            .select('id, nome, telefone')
            .eq('telefone', phone)
            .single();
          
          const sellerName = sellerData?.nome || 'Vendedor';
          
          if (action === 'respondida') {
            newStatus = 'concluido';
            responseType = 'button';
            confirmMsg = '✅ *Escalação marcada como atendida!*\n\nO lead foi removido da lista de pendentes. Bom trabalho! 💪';
          } else if (action === 'depois') {
            newStatus = 'pendente';
            responseType = 'button';
            confirmMsg = '⏰ *Escalação permanece pendente.*\n\nVocê pode ver todos os leads pendentes no dashboard.';
          }
          
          // Atualizar escalação no banco com nome de quem respondeu
          const { error: updateError } = await supabase
            .from('escalacoes_comerciais')
            .update({ 
              status: newStatus,
              viewed_at: new Date().toISOString(),
              responded_at: action === 'respondida' ? new Date().toISOString() : null,
              response_type: responseType,
              attended_at: action === 'respondida' ? new Date().toISOString() : undefined,
              responded_by_name: action === 'respondida' ? sellerName : null
            })
            .eq('id', escalacaoId);
          
          if (updateError) {
            console.error('[ZAPI-WEBHOOK] ❌ Error updating escalation:', updateError);
          } else {
            console.log('[ZAPI-WEBHOOK] ✅ Escalation updated:', {
              escalacaoId,
              newStatus,
              responseType,
              respondedBy: sellerName
            });
            
            // Buscar config Z-API
            const { data: agent } = await supabase
              .from('agents')
              .select('zapi_config')
              .eq('key', 'sofia')
              .single();
            
            const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
            const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
            
            if (zapiConfig?.instance_id && zapiConfig?.token && zapiClientToken) {
              const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
              
              // Enviar confirmação para o vendedor que clicou
              try {
                await fetch(zapiUrl, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Client-Token': zapiClientToken
                  },
                  body: JSON.stringify({
                    phone: phone,
                    message: confirmMsg
                  })
                });
                console.log('[ZAPI-WEBHOOK] ✅ Confirmation sent to seller');
              } catch (confirmError) {
                console.error('[ZAPI-WEBHOOK] ⚠️ Error sending confirmation:', confirmError);
              }
              
              // SE FOI "JÁ RESPONDI" - Notificar OUTROS vendedores que este assumiu
              if (action === 'respondida') {
                console.log('[ZAPI-WEBHOOK] 📢 Notifying other sellers that', sellerName, 'took the lead');
                
                // Buscar TODOS vendedores ativos que recebem escalações
                const { data: allSellers } = await supabase
                  .from('escalacao_vendedores')
                  .select('id, nome, telefone')
                  .eq('ativo', true)
                  .eq('recebe_escalacoes', true);
                
                if (allSellers && allSellers.length > 1) {
                  // Buscar dados do lead para mensagem
                  const { data: escData } = await supabase
                    .from('escalacoes_comerciais')
                    .select('lead_name, phone_number')
                    .eq('id', escalacaoId)
                    .single();
                  
                  const leadInfo = escData?.lead_name || escData?.phone_number || 'lead';
                  
                  // Notificar cada vendedor EXCETO quem clicou
                  for (const seller of allSellers) {
                    if (seller.telefone === phone) continue; // Pular quem clicou
                    
                    try {
                      const otherMsg = `ℹ️ *Escalação assumida!*\n\n👤 *${sellerName}* já assumiu o atendimento do lead *${leadInfo}*.\n\n✅ Você não precisa mais responder esta escalação.`;
                      
                      await fetch(zapiUrl, {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Client-Token': zapiClientToken
                        },
                        body: JSON.stringify({
                          phone: seller.telefone,
                          message: otherMsg
                        })
                      });
                      
                      console.log('[ZAPI-WEBHOOK] ✅ Notified', seller.nome, 'that', sellerName, 'took the lead');
                    } catch (notifyError) {
                      console.error('[ZAPI-WEBHOOK] ⚠️ Error notifying', seller.nome, ':', notifyError);
                    }
                  }
                }
              }
            }
          }
          
          // Log da ação
          await supabase.from('agent_logs').insert({
            agent_key: 'sofia',
            event_type: 'escalation_button_response',
            metadata: {
              escalacao_id: escalacaoId,
              action,
              response_type: responseType,
              seller_phone: phone,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          processed: 'escalation_button_response',
          action
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // ========== PROCESSAR BOTÕES DE PROPOSTA EXPIRADA ==========
      // Formato: proposal_mute_UUID_action
      if (buttonId?.startsWith('proposal_mute_')) {
        const parts = buttonId.split('_');
        // proposal_mute_UUID_action
        const proposalId = parts[2]; // UUID
        const action = parts[3]; // 'ja_enviei' ou 'descartado'
        
        console.log('[ZAPI-WEBHOOK] 📋 Proposal mute button action:', {
          action,
          proposalId,
          phone
        });
        
        if (proposalId) {
          let muteReason = '';
          let confirmMsg = '';
          
          if (action === 'ja_enviei') {
            muteReason = 'ja_enviei';
            confirmMsg = '✅ *Lembretes interrompidos!*\n\nVocê marcou que já enviou uma nova proposta. Os lembretes desta proposta foram silenciados.';
          } else if (action === 'descartado') {
            muteReason = 'descartado';
            confirmMsg = '❌ *Cliente descartado.*\n\nOs lembretes desta proposta foram silenciados permanentemente.';
          }
          
          // Atualizar configurações de notificação
          const { error: updateError } = await supabase
            .from('proposal_notification_settings')
            .upsert({
              proposal_id: proposalId,
              expire_reminders_muted: true,
              expire_reminders_muted_at: new Date().toISOString(),
              expire_reminders_muted_by: phone,
              mute_reason: muteReason,
            }, {
              onConflict: 'proposal_id'
            });
          
          if (updateError) {
            console.error('[ZAPI-WEBHOOK] ❌ Error muting proposal reminders:', updateError);
          } else {
            console.log('[ZAPI-WEBHOOK] ✅ Proposal reminders muted:', {
              proposalId,
              muteReason
            });
            
            // Buscar config Z-API do exa_alert
            const { data: alertAgent } = await supabase
              .from('agents')
              .select('zapi_config')
              .eq('key', 'exa_alert')
              .single();
            
            if (alertAgent?.zapi_config) {
              const zapiConfig = alertAgent.zapi_config as { instance_id?: string; token?: string };
              const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
              
              if (zapiConfig?.instance_id && zapiConfig?.token && zapiClientToken) {
                const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
                
                try {
                  await fetch(zapiUrl, {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Client-Token': zapiClientToken
                    },
                    body: JSON.stringify({
                      phone: phone,
                      message: confirmMsg
                    })
                  });
                  console.log('[ZAPI-WEBHOOK] ✅ Proposal mute confirmation sent');
                } catch (confirmError) {
                  console.error('[ZAPI-WEBHOOK] ⚠️ Error sending proposal mute confirmation:', confirmError);
                }
              }
            }
          }
          
          // Log da ação
          await supabase.from('proposal_logs').insert({
            proposal_id: proposalId,
            action: 'reminder_muted',
            details: {
              mute_reason: muteReason,
              muted_by_phone: phone,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          processed: 'proposal_mute_button_response',
          action
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // ========== PROCESSAR BOTÕES DE CONFIRMAÇÃO DE TAREFA ==========
      if (buttonId?.startsWith('task_ack:')) {
        const parts = buttonId.split(':');
        const taskId = parts[1];
        const contactPhone = parts[2] || phone;
        
        console.log('[ZAPI-WEBHOOK] 📋 Task acknowledgment button:', {
          taskId,
          contactPhone,
          phone
        });
        
        if (taskId) {
          // Update receipt status to 'read'
          const { error: updateError } = await supabase
            .from('task_read_receipts')
            .update({ 
              read_at: new Date().toISOString(), 
              status: 'read' 
            })
            .eq('task_id', taskId)
            .eq('contact_phone', contactPhone);
          
          if (updateError) {
            console.error('[ZAPI-WEBHOOK] ❌ Error updating task receipt:', updateError);
          } else {
            console.log('[ZAPI-WEBHOOK] ✅ Task receipt updated to read');
          }
          
          // Send confirmation reply
          const { data: agent } = await supabase
            .from('agents')
            .select('zapi_config')
            .eq('key', 'exa_alert')
            .single();
          
          const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
          const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
          
          if (zapiConfig?.instance_id && zapiConfig?.token && zapiClientToken) {
            const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
            
            try {
              await fetch(zapiUrl, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Client-Token': zapiClientToken
                },
                body: JSON.stringify({
                  phone: phone,
                  message: '✅ *Recebimento confirmado!*\n\nObrigado pela confirmação. 👍'
                })
              });
              console.log('[ZAPI-WEBHOOK] ✅ Task ack confirmation sent');
            } catch (confirmError) {
              console.error('[ZAPI-WEBHOOK] ⚠️ Error sending task ack confirmation:', confirmError);
            }
          }
          
          // Log
          await supabase.from('agent_logs').insert({
            agent_key: 'exa_alert',
            event_type: 'task_ack_received',
            metadata: {
              task_id: taskId,
              contact_phone: contactPhone,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          processed: 'task_ack_button_response'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // ========== PROCESSAR BOTÕES DE ALERTA DE PAINEL OFFLINE ==========
      // Se não é escalação, pode ser botão de confirmação de alerta de painel
      if (!buttonId?.startsWith('escalacao_') && !buttonId?.startsWith('proposal_mute_')) {
        console.log('[ZAPI-WEBHOOK] 🔔 Panel alert button detected:', {
          buttonId,
          phone,
          message: buttonReply.message
        });
        
        const senderNameBtn = payload.senderName || payload.chatName || payload.pushName || 'Desconhecido';
        
        // Parse buttonId para extrair deviceId (formato: "buttonId:deviceId")
        let actualButtonId = buttonId;
        let deviceIdFromButton: string | null = null;
        
        if (buttonId?.includes(':')) {
          const parts = buttonId.split(':');
          actualButtonId = parts[0];
          deviceIdFromButton = parts[1] || null;
          console.log('[ZAPI-WEBHOOK] 📋 Parsed button:', { actualButtonId, deviceIdFromButton });
        }
        
        // ID do botão "Interromper Notificações"
        const PAUSE_BUTTON_ID = 'd0d4abec-bf0a-44e1-9cde-7a38020b541a';
        const isPauseButton = actualButtonId === PAUSE_BUTTON_ID || 
                              buttonReply.message?.toLowerCase()?.includes('interromper');
        
        // Buscar alertas recentes para vincular a confirmação
        const { data: recentAlerts } = await supabase
          .from('panel_offline_alerts_history')
          .select('*, devices(id, name, metadata)')
          .order('sent_at', { ascending: false })
          .limit(20);
        
        let matchedAlert = null;
        let deviceInfo = null;
        
        // Tentar encontrar device pelo deviceId do botão primeiro
        if (deviceIdFromButton) {
          const { data: deviceFromId } = await supabase
            .from('devices')
            .select('id, name, metadata')
            .eq('id', deviceIdFromButton)
            .single();
          
          if (deviceFromId) {
            deviceInfo = deviceFromId;
            console.log('[ZAPI-WEBHOOK] ✅ Device found from button ID:', deviceInfo.name);
            
            // Encontrar alert correspondente
            if (recentAlerts) {
              matchedAlert = recentAlerts.find(a => a.painel_id === deviceIdFromButton || a.device_id === deviceIdFromButton);
            }
          }
        }
        
        // Fallback: buscar por telefone do destinatário
        if (!deviceInfo && recentAlerts) {
          const phoneClean = phone?.replace(/\D/g, '');
          for (const alert of recentAlerts) {
            const recipients = alert.recipients || [];
            for (const recipient of recipients) {
              const recipientClean = recipient.phone?.replace(/\D/g, '');
              if (recipientClean && phoneClean && 
                  (recipientClean.includes(phoneClean.slice(-8)) || phoneClean.includes(recipientClean.slice(-8)))) {
                matchedAlert = alert;
                deviceInfo = alert.devices;
                break;
              }
            }
            if (matchedAlert) break;
          }
        }
        
        console.log('[ZAPI-WEBHOOK] 🔍 Matched alert:', matchedAlert ? matchedAlert.id : 'none');
        console.log('[ZAPI-WEBHOOK] 🔍 Device info:', deviceInfo ? { id: deviceInfo.id, name: deviceInfo.name } : 'none');
        
        // Determinar device_id final
        const finalDeviceId = deviceIdFromButton || deviceInfo?.id || matchedAlert?.painel_id || matchedAlert?.device_id || null;
        const finalDeviceName = deviceInfo?.name || matchedAlert?.device_name || 'Painel desconhecido';
        
        // ========== SE FOR BOTÃO "INTERROMPER NOTIFICAÇÕES" - PAUSAR ALERTAS ==========
        let pauseApplied = false;
        if (isPauseButton && finalDeviceId) {
          console.log('[ZAPI-WEBHOOK] 🛑 PAUSE button clicked! Pausing notifications for device:', finalDeviceId);
          
          // Buscar metadata atual do device
          const { data: currentDevice } = await supabase
            .from('devices')
            .select('metadata')
            .eq('id', finalDeviceId)
            .single();
          
          const currentMetadata = (currentDevice?.metadata || {}) as Record<string, any>;
          
          // Atualizar metadata com pause indefinido (até voltar online)
          const updatedMetadata = {
            ...currentMetadata,
            notifications_paused_until: 'indefinite',
            paused_by: phone,
            paused_at: new Date().toISOString(),
            paused_by_name: senderNameBtn
          };
          
          const { error: pauseError } = await supabase
            .from('devices')
            .update({ metadata: updatedMetadata })
            .eq('id', finalDeviceId);
          
          if (pauseError) {
            console.error('[ZAPI-WEBHOOK] ❌ Error pausing device notifications:', pauseError);
          } else {
            pauseApplied = true;
            console.log('[ZAPI-WEBHOOK] ✅ Device notifications PAUSED until online:', finalDeviceId);
          }
          
          // Log na história de alertas
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: finalDeviceId,
            device_name: finalDeviceName,
            tipo: 'paused',
            mensagem: `Notificações pausadas por ${senderNameBtn}`,
            tempo_offline_minutos: 0,
            destinatarios_notificados: [phone]
          });
        }
        
        // Inserir confirmação
        const { data: confirmation, error: confirmError } = await supabase
          .from('panel_offline_alert_confirmations')
          .insert({
            alert_history_id: matchedAlert?.id || null,
            device_id: finalDeviceId,
            device_name: finalDeviceName,
            recipient_phone: phone,
            recipient_name: senderNameBtn,
            button_id: actualButtonId,
            button_label: buttonReply.message || 'Confirmação',
            reference_message_id: buttonReply.referenceMessageId || payload.referenceMessageId,
            raw_webhook: payload
          })
          .select()
          .single();
        
        if (confirmError) {
          console.error('[ZAPI-WEBHOOK] ❌ Error inserting panel confirmation:', confirmError);
        } else {
          console.log('[ZAPI-WEBHOOK] ✅ Panel alert confirmation recorded:', confirmation.id);
        }
        
        // Enviar mensagem de acknowledgment via EXA Alerts
        const { data: alertAgent } = await supabase
          .from('agents')
          .select('zapi_config')
          .eq('key', 'exa_alert')
          .single();
        
        if (alertAgent?.zapi_config) {
          const zapiConfig = alertAgent.zapi_config as { instance_id: string; token: string };
          const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
          
          // Mensagem diferente se foi pause
          let ackMsg: string;
          if (isPauseButton && pauseApplied) {
            ackMsg = `🛑 *Notificações INTERROMPIDAS!*\n\n` +
              `📍 ${finalDeviceName}\n` +
              `👤 Pausado por: ${senderNameBtn}\n` +
              `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n` +
              `✅ Você não receberá mais alertas deste painel enquanto ele estiver offline.\n` +
              `🔔 Os alertas voltarão automaticamente quando o painel ficar online novamente.`;
          } else {
            ackMsg = `✅ *Confirmação registrada!*\n\n` +
              `👤 ${senderNameBtn}\n` +
              `📍 ${finalDeviceName}\n` +
              `🔘 ${buttonReply.message || 'Confirmação'}\n` +
              `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
          }
          
          try {
            await fetch(
              `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`,
              {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Client-Token': zapiClientToken || ''
                },
                body: JSON.stringify({ phone, message: ackMsg })
              }
            );
            console.log('[ZAPI-WEBHOOK] ✅ Panel alert ack sent to:', phone);
          } catch (ackErr) {
            console.error('[ZAPI-WEBHOOK] ⚠️ Error sending panel ack:', ackErr);
          }
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          processed: 'panel_alert_button_response',
          confirmation_id: confirmation?.id,
          pause_applied: pauseApplied,
          device_id: finalDeviceId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // ========== PROCESSAR RESPOSTAS DE TEXTO COMO FALLBACK (EXPANDIDO) ==========
    const textLower = (payload.text?.message || payload.body || '').toLowerCase().trim();
    const senderName = payload.senderName || '';
    
    // 🚫 IGNORAR mensagens do próprio sistema (Sofia, EXA, etc.)
    const isSelfMessage = 
      senderName.toLowerCase().includes('sofia') ||
      senderName.toLowerCase().includes('exa') ||
      payload.fromMe === true ||
      textLower.includes('escalação assumida') ||
      textLower.includes('você não precisa mais responder');
    
    if (isSelfMessage) {
      console.log('[ZAPI-WEBHOOK] ⏭️ Ignoring self-message/system notification:', { senderName, textLower: textLower.slice(0, 50) });
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: 'self_message_or_system_notification'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== TASK FOLLOW-UP RESPONSE ROUTING ==========
    // Check if this phone has an active task notification queue entry
    const messageText = payload.text?.message || payload.body || '';
    if (messageText.trim() && phone) {
      try {
        const { data: taskFollowUpResult } = await supabase.functions.invoke('task-follow-up-response', {
          body: { phone, message: messageText.trim() }
        });

        if (taskFollowUpResult?.handled) {
          console.log('[ZAPI-WEBHOOK] ✅ Task follow-up handled:', taskFollowUpResult);
          return new Response(JSON.stringify({ 
            success: true, 
            processed: 'task_followup_response',
            result: taskFollowUpResult
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (taskErr) {
        console.log('[ZAPI-WEBHOOK] ℹ️ Task follow-up check skipped:', taskErr.message);
      }
    }
    
    // PALAVRAS ACEITAS para "já respondi" (REMOVIDO 'assumido', 'assumi' que causam loop)
    const acceptedOk = ['ok', 'atendi', 'já respondi', 'respondi o lead', 'fechado', 'feito', 'pronto'];
    // PALAVRAS ACEITAS para "vou responder depois"
    const acceptedDepois = ['depois', 'mais tarde', 'vou ver', 'ainda não', 'aguarde', 'espera', 'já já'];
    
    const isOkResponse = acceptedOk.some(kw => textLower.includes(kw));
    const isDepoisResponse = acceptedDepois.some(kw => textLower.includes(kw));
    
    if (isOkResponse || isDepoisResponse) {
      console.log('[ZAPI-WEBHOOK] 📝 Text fallback for escalation detected:', { textLower, isOkResponse, isDepoisResponse, phone });
      
      // 🔍 VERIFICAR se o telefone é de um vendedor cadastrado ANTES de processar
      const phoneVariants = [phone, `55${phone}`, phone.replace(/^55/, '')];
      const { data: sellerData } = await supabase
        .from('escalacao_vendedores')
        .select('id, nome, telefone')
        .or(phoneVariants.map(p => `telefone.eq.${p}`).join(','))
        .eq('ativo', true)
        .eq('recebe_escalacoes', true)
        .maybeSingle();
      
      // Se NÃO é um vendedor cadastrado, não processar como resposta de escalação
      if (!sellerData) {
        console.log('[ZAPI-WEBHOOK] ⏭️ Phone is NOT a registered seller, skipping escalation response:', phone);
        // Continuar para processamento normal da mensagem (não retornar aqui)
      } else {
        // 🔒 LOCK TEMPORAL - Verificar se já processamos recentemente
        const lockKey = `escalation_response_lock_${phone}_${Date.now().toString().slice(0, -4)}`; // Lock por ~10 segundos
        const { data: existingLock } = await supabase
          .from('agent_context')
          .select('key')
          .eq('key', lockKey)
          .maybeSingle();
        
        if (existingLock) {
          console.log('[ZAPI-WEBHOOK] ⏭️ Recently processed response from this seller, skipping');
          return new Response(JSON.stringify({ 
            success: true, 
            skipped: true,
            reason: 'duplicate_response_within_window'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Criar lock
        await supabase.from('agent_context').upsert({ key: lockKey, value: { phone, timestamp: Date.now() } });
        
        const sellerName = sellerData.nome;
        console.log('[ZAPI-WEBHOOK] 📍 Seller identified:', { phone, sellerName, sellerId: sellerData.id });
        
        // Buscar escalação pendente mais recente
        const { data: escalacaoPendente, error: escError } = await supabase
          .from('escalacoes_comerciais')
          .select('id, lead_name, phone_number')
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (escalacaoPendente && !escError) {
          const action = isOkResponse ? 'respondida' : 'depois';
          const newStatus = action === 'respondida' ? 'concluido' : 'pendente';
          const responseType = 'text';
          
          const { error: updateError } = await supabase
            .from('escalacoes_comerciais')
            .update({ 
              status: newStatus,
              viewed_at: new Date().toISOString(),
              responded_at: action === 'respondida' ? new Date().toISOString() : null,
              response_type: responseType,
              attended_at: action === 'respondida' ? new Date().toISOString() : undefined,
              responded_by_name: action === 'respondida' ? sellerName : null
            })
            .eq('id', escalacaoPendente.id);
          
          if (!updateError) {
            console.log('[ZAPI-WEBHOOK] ✅ Escalation updated via text fallback:', {
              id: escalacaoPendente.id,
              leadName: escalacaoPendente.lead_name,
              action,
              respondedBy: sellerName
            });
            
            // Buscar config Z-API para enviar confirmações
            const { data: agent } = await supabase
              .from('agents')
              .select('zapi_config')
              .eq('key', 'sofia')
              .single();
            
            const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
            const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
            
            if (zapiConfig?.instance_id && zapiConfig?.token && zapiClientToken) {
              const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
              
              // Enviar confirmação para quem respondeu
              const confirmMsg = action === 'respondida'
                ? `✅ *Escalação de ${escalacaoPendente.lead_name || 'lead'} marcada como atendida!*\n\nBom trabalho! 💪`
                : `⏰ *Escalação de ${escalacaoPendente.lead_name || 'lead'} permanece pendente.*\n\nVocê pode ver no dashboard.`;
              
              try {
                await fetch(zapiUrl, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Client-Token': zapiClientToken
                  },
                  body: JSON.stringify({
                    phone: phone,
                    message: confirmMsg
                  })
                });
                console.log('[ZAPI-WEBHOOK] ✅ Confirmation sent to', sellerName);
              } catch (e) {
                console.error('[ZAPI-WEBHOOK] ⚠️ Error sending confirmation:', e);
              }
              
              // SE FOI "OK" (JÁ RESPONDI) - Notificar OUTROS vendedores
              if (action === 'respondida') {
                console.log('[ZAPI-WEBHOOK] 📢 (TEXT) Notifying other sellers that', sellerName, 'took the lead');
                
                const { data: allSellers } = await supabase
                  .from('escalacao_vendedores')
                  .select('id, nome, telefone')
                  .eq('ativo', true)
                  .eq('recebe_escalacoes', true);
                
                if (allSellers && allSellers.length > 1) {
                  const leadInfo = escalacaoPendente.lead_name || escalacaoPendente.phone_number || 'lead';
                  
                  for (const seller of allSellers) {
                    // Pular quem respondeu (comparar variantes)
                    const sellerPhoneClean = seller.telefone.replace(/\D/g, '');
                    const phoneClean = phone.replace(/\D/g, '');
                    if (sellerPhoneClean === phoneClean || 
                        sellerPhoneClean === `55${phoneClean}` || 
                        `55${sellerPhoneClean}` === phoneClean ||
                        sellerPhoneClean.endsWith(phoneClean) ||
                        phoneClean.endsWith(sellerPhoneClean)) continue;
                    
                    try {
                      const otherMsg = `ℹ️ *${sellerName}* assumiu o lead *${leadInfo}*.\n\n✅ Não precisa mais responder.`;
                      
                      await fetch(zapiUrl, {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Client-Token': zapiClientToken
                        },
                        body: JSON.stringify({
                          phone: seller.telefone,
                          message: otherMsg
                        })
                      });
                      
                      console.log('[ZAPI-WEBHOOK] ✅ (TEXT) Notified', seller.nome);
                    } catch (notifyError) {
                      console.error('[ZAPI-WEBHOOK] ⚠️ (TEXT) Error notifying', seller.nome, ':', notifyError);
                    }
                  }
                }
              }
            }
          } else {
            console.error('[ZAPI-WEBHOOK] ❌ Error updating escalation:', updateError);
          }
          
          return new Response(JSON.stringify({ 
            success: true,
            processed: 'escalation_text_fallback',
            action,
            respondedBy: sellerName
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // ========== PROCESSAR EVENTOS DE STATUS ==========
    const eventType = payload.type;

    // Status de mensagem: delivered, read
    if (eventType === 'MessageStatusCallback') {
      console.log('[ZAPI-WEBHOOK] 📊 Message status update:', payload.status);
      
      const messageId = payload.messageId || payload.id;
      const status = payload.status; // 'sent', 'delivered', 'read'
      
      if (messageId && status) {
        // Atualizar status na tabela messages
        const { error: updateError } = await supabase
          .from('messages')
          .update({ 
            metadata: supabase.raw(`
              COALESCE(metadata, '{}'::jsonb) || 
              jsonb_build_object('delivery_status', '${status}'::text, 'status_updated_at', NOW()::text)
            `)
          })
          .eq('raw_payload->>messageId', messageId);

        if (updateError) {
          console.error('[ZAPI-WEBHOOK] Failed to update message status:', updateError);
        } else {
          console.log('[ZAPI-WEBHOOK] ✅ Message status updated:', messageId, status);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: 'status_update'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Status de conexão
    if (eventType === 'DisconnectedCallback') {
      console.log('[ZAPI-WEBHOOK] 🔴 WhatsApp disconnected!');
      
      // Criar alerta de desconexão
      const { data: agent } = await supabase
        .from('agents')
        .select('key, display_name')
        .eq('whatsapp_provider', 'zapi')
        .eq('zapi_config->>instance_id', instanceId)
        .single();

      if (agent) {
        await supabase.from('agent_logs').insert({
          agent_key: agent.key,
          event_type: 'whatsapp_disconnected',
          metadata: { 
            instance_id: instanceId,
            timestamp: new Date().toISOString()
          }
        });

        // Enviar alerta via EXA Alert
        await supabase.functions.invoke('notify-exa-alert', {
          body: {
            severity: 'critical',
            title: `🔴 WhatsApp Desconectado - ${agent.display_name}`,
            message: `O WhatsApp do agente ${agent.display_name} foi desconectado. Verifique a conexão imediatamente.`,
            metadata: { agent_key: agent.key, instance_id: instanceId }
          }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: 'disconnect_alert'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (eventType === 'ConnectedCallback') {
      console.log('[ZAPI-WEBHOOK] 🟢 WhatsApp connected');
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 'connected'
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
    
    // 🔍 LOG ESPECIAL PARA SOFIA - Rastrear todas as mensagens
    if (agent.key === 'sofia') {
      console.log('🟣 [SOFIA] Mensagem recebida:', {
        phone,
        messageId,
        messageText: messageText.substring(0, 100),
        mediaType,
        instanceId: payload.instanceId,
        timestamp: new Date().toISOString(),
        isGroup,
        fromMe
      });
    }
    
    // 🔍 LOG ADICIONAL PARA EDUARDO
    if (agent.key === 'eduardo') {
      console.log('🔵 [EDUARDO] Agente encontrado! Processando mensagem:', {
        phone,
        messageText: messageText.substring(0, 50),
        mediaType,
        timestamp: new Date().toISOString()
      });
    }

    // ========== RATE LIMITING POR TELEFONE (PRIMEIRA LINHA DE DEFESA) ==========
    const cacheKey = `${phone}_${agent.key}_${messageText.substring(0, 50)}`;
    const lastProcessed = processingCache.get(cacheKey);
    const now = Date.now();

    if (lastProcessed && (now - lastProcessed) < DEBOUNCE_MS) {
      console.log('[ZAPI-WEBHOOK] 🚫 Rate limit - Too fast (PRE-CHECK):', {
        phone,
        timeSinceLastMs: now - lastProcessed
      });
      
      return new Response(JSON.stringify({ 
        success: true,
        rateLimited: true,
        stage: 'pre_check',
        waitMs: DEBOUNCE_MS - (now - lastProcessed)
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Marcar como processando IMEDIATAMENTE
    processingCache.set(cacheKey, now);
    setTimeout(() => processingCache.delete(cacheKey), 5000);

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

    // ========== VERIFICAÇÃO DE DEDUPLICAÇÃO (SEGUNDA LINHA DE DEFESA) ==========
    const dupeCheck = await checkDuplicate(supabase, messageId, phone, messageText);
    
    if (dupeCheck.isDuplicate) {
      console.log('[ZAPI-WEBHOOK] ⚠️ DUPLICATE DETECTED:', dupeCheck);
      return new Response(JSON.stringify({ 
        success: true,
        duplicate: true,
        reason: dupeCheck.reason,
        existingId: dupeCheck.existingId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log inbound message COM messageId para deduplicação (INSERT com tratamento de duplicata)
    if (messageId) {
      const { error: logError } = await supabase
        .from('zapi_logs')
        .insert({
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
        })
        .select()
        .maybeSingle();

      // Se erro 23505 (duplicate), ignorar silenciosamente
      if (logError && logError.code !== '23505') {
        console.error('[ZAPI-WEBHOOK] ❌ Error logging message:', logError);
      }
    } else {
      console.warn('[ZAPI-WEBHOOK] ⚠️ No messageId, skipping log');
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

        // Criar/Atualizar conversation (OTIMIZADO: evita onConflict complexo)
        let conversation;
        
        // Buscar existente primeiro (external_id inclui agent_key para unicidade)
        const externalId = `${phone}_${agent.key}`;
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle();

        if (existing) {
          // UPDATE - atualizar contact_name e is_group se for grupo
          const updateData: any = { 
            last_message_at: new Date().toISOString(),
            status: 'open',
            // ✅ Marcar como aguardando resposta quando receber mensagem inbound
            awaiting_response: true,
            // 🏢 Salvar nome do prédio/grupo no metadata
            metadata: {
              building_name: payload.chatName || null,
              last_sender_name: payload.senderName || null
            }
          };
          
          // Se for grupo, forçar atualização do nome e flag
          if (isGroup) {
            updateData.is_group = true;
            updateData.contact_name = payload.chatName || 'Grupo sem nome';
            console.log('[ZAPI-WEBHOOK] 🔄 Updating group conversation:', {
              id: existing.id,
              newName: updateData.contact_name,
              buildingName: payload.chatName
            });
          }
          
          console.log('[ZAPI-WEBHOOK] 📬 Marking conversation as awaiting response (inbound message)');
          
          const { data: updated, error: updateError } = await supabase
            .from('conversations')
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();
          
          if (updateError) throw new Error(`Failed to update conversation: ${updateError.message}`);
          conversation = updated;
        } else {
          // INSERT - usar detecção de grupo já feita no início
          console.log('[ZAPI-WEBHOOK] 📝 Creating conversation:', {
            isGroup,
            chatName: payload.chatName,
            senderName: payload.senderName,
            phone,
            participantPhone: payload.participantPhone
          });
          
          const { data: inserted, error: insertError } = await supabase
            .from('conversations')
            .insert({
              external_id: externalId,
              contact_phone: phone,
              contact_name: isGroup 
                ? (payload.chatName || 'Grupo sem nome')
                : (payload.senderName || null),
              is_group: isGroup,
              agent_key: agent.key,
              provider: 'zapi',
              status: 'open',
              last_message_at: new Date().toISOString(),
              awaiting_response: true, // Nova conversa sempre aguarda resposta
              // 🏢 Salvar nome do prédio/grupo no metadata
              metadata: {
                building_name: payload.chatName || null,
                last_sender_name: payload.senderName || null
              }
            })
            .select()
            .single();
          
          if (insertError) throw new Error(`Failed to insert conversation: ${insertError.message}`);
          conversation = inserted;
          
          // 🆕 FASE 3: CRIAR CONTATO AUTOMATICAMENTE PARA NOVA CONVERSA
          if (!isGroup && conversation) {
            const phoneNormalized = phone.replace(/\D/g, '');
            console.log('[ZAPI-WEBHOOK] 🔍 Checking if contact exists for phone:', phoneNormalized);
            
            // Verificar se contato já existe
            const { data: existingContact } = await supabase
              .from('contacts')
              .select('id')
              .eq('telefone', phoneNormalized)
              .maybeSingle();
            
            if (!existingContact) {
              // Determinar origem baseado no agente
              let origem = 'conversa_whatsapp_sofia';
              if (agent.key === 'eduardo') origem = 'conversa_whatsapp_vendedor';
              else if (agent.key === 'exa_alert') origem = 'conversa_whatsapp_exa_alert';
              
              console.log('[ZAPI-WEBHOOK] 📝 Creating new contact for conversation:', conversation.id);
              
              const { data: newContact, error: contactError } = await supabase
                .from('contacts')
                .insert({
                  nome: payload.senderName || 'Contato WhatsApp',
                  telefone: phoneNormalized,
                  categoria: 'lead', // Default para lead
                  origem,
                  status: 'ativo',
                  bloqueado: false,
                  conversation_id: conversation.id,
                  agent_sources: [agent.key],
                  last_interaction_at: new Date().toISOString(),
                  metadata: {
                    auto_created: true,
                    source_agent: agent.key,
                    created_from_conversation: conversation.id,
                    first_message_at: new Date().toISOString()
                  }
                })
                .select()
                .single();
              
              if (contactError) {
                console.error('[ZAPI-WEBHOOK] ⚠️ Error creating contact (non-blocking):', contactError);
              } else if (newContact) {
                console.log('[ZAPI-WEBHOOK] ✅ New contact created:', newContact.id);
                
                // Linkar conversation ao contato
                await supabase
                  .from('conversations')
                  .update({ contact_id: newContact.id })
                  .eq('id', conversation.id);
              }
            } else {
              console.log('[ZAPI-WEBHOOK] ℹ️ Contact already exists:', existingContact.id);
              
              // Linkar conversation ao contato existente e atualizar last_interaction
              await supabase
                .from('contacts')
                .update({ 
                  last_interaction_at: new Date().toISOString(),
                  agent_sources: supabase.rpc ? undefined : [agent.key] // Append agent if possible
                })
                .eq('id', existingContact.id);
              
              await supabase
                .from('conversations')
                .update({ contact_id: existingContact.id })
                .eq('id', conversation.id);
            }
          }
        }

        if (!conversation) {
          throw new Error('Conversation returned null');
        }

        console.log('[ZAPI-WEBHOOK] ✅ Conversation created/updated:', conversation.id);

        // Salvar mensagem (incluir sender_name e participant_phone para grupos)
        const messageMetadata: any = {};
        if (isGroup) {
          messageMetadata.sender_name = payload.senderName || 'Participante';
          messageMetadata.chat_name = payload.chatName || 'Grupo';
          messageMetadata.participant_phone = payload.participantPhone;
          console.log('[ZAPI-WEBHOOK] 👥 Group message from:', payload.senderName, 'phone:', payload.participantPhone);
        }
        
        const { data: savedMessage, error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          agent_key: agent.key,
          provider: 'zapi',
          direction: 'inbound',
          from_role: 'user',
          body: messageText,
          raw_payload: isGroup 
            ? { ...payload, group_metadata: messageMetadata } 
            : payload
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

        // 🤖 FASE 4: Verificar se Sofia está pausada antes de chamar IA
        let sofiaPaused = false;
        if (agent.key === 'sofia') {
          console.log('🟣 [SOFIA] Verificando se está pausada...');
          const { data: conv } = await supabase
            .from('conversations')
            .select('sofia_paused')
            .eq('id', conversation.id)
            .single();
          
          sofiaPaused = conv?.sofia_paused === true;
          console.log('🟣 [SOFIA] Pausada?', sofiaPaused);
          
          if (sofiaPaused) {
            console.log('[ZAPI-WEBHOOK] 🛑 Sofia pausada - Eduardo assumiu. Não responder.');
            return; // Não chamar Sofia
          }
        }

        // Verificar se precisa chamar IA automaticamente
        if (agent.ai_auto_response && routeResult?.routed_to) {
          console.log('[ZAPI-WEBHOOK] 🤖 AI auto-response enabled, calling generate-ai-response...');
          
          // 🟣 LOG SOFIA: Confirmação de que vai processar IA
          if (agent.key === 'sofia') {
            console.log('🟣 [SOFIA] Iniciando processamento IA para:', {
              conversationId: conversation.id,
              messageId,
              phone
            });
          }
          
          // ====== MESSAGE BATCHING: Consolidar mensagens antes de processar ======
          const bufferKey = `msg_buffer_${conversation.id}`;
          const BATCH_WINDOW_MS = 4000; // 4 segundos de espera
          const LOCK_WINDOW_MS = 5000; // 5 segundos de lock
          
          // Buscar buffer existente
          const { data: existingBuffer } = await supabase
            .from('agent_context')
            .select('value, updated_at')
            .eq('key', bufferKey)
            .maybeSingle();
          
          // Adicionar mensagem ao buffer
          const currentMessages = existingBuffer?.value?.messages || [];
          currentMessages.push({
            text: messageText,
            timestamp: Date.now(),
            messageId
          });
          
          await supabase
            .from('agent_context')
            .upsert({
              key: bufferKey,
              value: {
                messages: currentMessages,
                last_update: Date.now()
              }
            }, { onConflict: 'key' });
          
          console.log(`[ZAPI-WEBHOOK] 📦 Message buffered (${currentMessages.length} messages in buffer)`);
          
          // Aguardar janela de batching
          await new Promise(resolve => setTimeout(resolve, BATCH_WINDOW_MS));
          
          // Verificar se há novas mensagens após a janela
          const { data: finalBuffer } = await supabase
            .from('agent_context')
            .select('value')
            .eq('key', bufferKey)
            .maybeSingle();
          
          const timeSinceLastUpdate = Date.now() - (finalBuffer?.value?.last_update || 0);
          
          if (timeSinceLastUpdate < BATCH_WINDOW_MS - 500) {
            console.log('[ZAPI-WEBHOOK] ⏳ Nova mensagem chegou, aguardando...');
            return; // Outra mensagem chegou, deixar ela processar
          }
          
          // Consolidar todas as mensagens do buffer
          const allMessages = finalBuffer?.value?.messages || [{ text: messageText }];
          const consolidatedMessage = allMessages.map(m => m.text).join(' ');
          
          console.log(`[ZAPI-WEBHOOK] 📨 Consolidando ${allMessages.length} mensagens em uma: "${consolidatedMessage.substring(0, 100)}..."`);
          
          // Limpar buffer após consolidação
          await supabase.from('agent_context').delete().eq('key', bufferKey);
          
          // ====== LOCK POR CONVERSAÇÃO (não por messageId) ======
          const aiLockKey = `ai_processing_${conversation.id}`;
          
          // Verificar se existe lock e se ele está expirado
          const { data: existingLock } = await supabase
            .from('agent_context')
            .select('value, updated_at')
            .eq('key', aiLockKey)
            .maybeSingle();
          
          if (existingLock) {
            const lockAge = Date.now() - new Date(existingLock.updated_at).getTime();
            if (lockAge > LOCK_WINDOW_MS) {
              console.log('[ZAPI-WEBHOOK] 🧹 Expired lock detected, removing...');
              await supabase.from('agent_context').delete().eq('key', aiLockKey);
            } else {
              console.log(`[ZAPI-WEBHOOK] ⚠️ Conversation still processing (lock age: ${lockAge}ms), skipping`);
              return; // NÃO processar
            }
          }
          
          // Tentar criar novo lock
          const { error: aiLockError } = await supabase
            .from('agent_context')
            .insert({ 
              key: aiLockKey, 
              value: { 
                acquired_at: new Date().toISOString(),
                message_count: allMessages.length
              } 
            });

          if (aiLockError) {
            console.log('[ZAPI-WEBHOOK] ⚠️ Failed to acquire lock, another process may have started, skipping');
            return; // NÃO processar
          } else {

            try {
              const { data: aiResult, error: aiError } = await supabase.functions.invoke('ia-console', {
                body: {
                  agentKey: agent.key,
                  message: consolidatedMessage, // Usar mensagem consolidada
                  context: {
                    conversationId: conversation.id,
                    phoneNumber: phone,
                    messageId: messageId,
                    batchedMessages: allMessages.length
                  }
                }
              });

              if (aiError) {
                console.error('[ZAPI-WEBHOOK] ❌ AI generation error:', aiError);
                // 🟣 LOG SOFIA: Erro na IA
                if (agent.key === 'sofia') {
                  console.log('🟣 [SOFIA] ❌ ERRO ao gerar resposta IA:', aiError);
                }
              } else if (aiResult?.response) {
                console.log('[ZAPI-WEBHOOK] ✅ AI response generated, sending to WhatsApp...');
                
                // 🟣 LOG SOFIA: Resposta IA gerada com sucesso
                if (agent.key === 'sofia') {
                  console.log('🟣 [SOFIA] ✅ Resposta IA gerada:', aiResult.response.substring(0, 100));
                }
                
                // ENVIAR RESPOSTA DA IA PARA O WHATSAPP
                await supabase.functions.invoke('zapi-send-message', {
                  body: {
                    agentKey: agent.key,
                    phone,
                    message: aiResult.response
                  }
                });
                
                console.log('[ZAPI-WEBHOOK] ✅ AI response sent to WhatsApp');
              }
            } catch (aiError) {
              console.error('[ZAPI-WEBHOOK] ❌ AI invocation failed:', aiError);
            } finally {
              // Limpar lock imediatamente após processamento
              await supabase.from('agent_context').delete().eq('key', aiLockKey);
            }
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
