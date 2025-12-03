import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversionResult {
  success: boolean;
  orderId?: string;
  userId?: string;
  isNewUser?: boolean;
  passwordResetLink?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, paymentId, paymentData } = await req.json();

    console.log('🔄 [CONVERT-PROPOSAL] Iniciando conversão:', { proposalId, paymentId });

    if (!proposalId) {
      throw new Error('proposalId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar proposta completa
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposta não encontrada: ${proposalError?.message}`);
    }

    console.log('✅ Proposta encontrada:', proposal.number);

    // Verificar se já foi convertida
    if (proposal.status === 'convertida' && proposal.converted_order_id) {
      console.log('⚠️ Proposta já convertida:', proposal.converted_order_id);
      return new Response(JSON.stringify({
        success: true,
        orderId: proposal.converted_order_id,
        alreadyConverted: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Verificar/Criar usuário
    let userId: string | null = null;
    let isNewUser = false;
    let passwordResetLink: string | null = null;

    const clientEmail = proposal.client_email?.toLowerCase().trim();
    
    if (clientEmail) {
      // Buscar usuário existente
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', clientEmail)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Usuário existente encontrado:', userId);
      } else {
        // Criar novo usuário via Auth
        console.log('🆕 Criando novo usuário:', clientEmail);
        
        const tempPassword = crypto.randomUUID().slice(0, 12);
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: clientEmail,
          password: tempPassword,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            nome: proposal.client_name,
            telefone: proposal.client_phone,
            created_from: 'proposal_conversion'
          }
        });

        if (authError) {
          console.error('❌ Erro ao criar usuário auth:', authError);
          // Tentar buscar se já existe no auth
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const existingAuthUser = authUsers?.users?.find(u => u.email === clientEmail);
          if (existingAuthUser) {
            userId = existingAuthUser.id;
            console.log('✅ Usuário auth existente encontrado:', userId);
          }
        } else if (authData?.user) {
          userId = authData.user.id;
          isNewUser = true;
          console.log('✅ Novo usuário auth criado:', userId);

          // Criar registro na tabela users
          await supabase.from('users').insert({
            id: userId,
            email: clientEmail,
            nome: proposal.client_name || 'Cliente EXA',
            role: 'client',
            telefone: proposal.client_phone,
            status: 'active',
            created_at: new Date().toISOString()
          });

          // Gerar link de recuperação de senha
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: clientEmail,
            options: {
              redirectTo: 'https://examidia.com.br/definir-senha'
            }
          });

          if (linkData?.properties?.action_link) {
            passwordResetLink = linkData.properties.action_link;
            console.log('✅ Link de senha gerado');
          } else {
            console.error('⚠️ Erro ao gerar link:', linkError);
          }
        }
      }
    }

    if (!userId) {
      throw new Error('Não foi possível criar/encontrar usuário');
    }

    // 3. Calcular datas da campanha
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (proposal.duration_months || 1));

    // 4. Preparar lista de painéis
    const selectedBuildings = Array.isArray(proposal.selected_buildings) 
      ? proposal.selected_buildings 
      : [];

    const listaPaineis = selectedBuildings.map((b: any) => ({
      building_id: b.building_id,
      building_name: b.building_name || b.nome,
      quantidade_telas: b.quantidade_telas || 1
    }));

    // 5. Criar pedido
    const { data: newOrder, error: orderError } = await supabase
      .from('pedidos')
      .insert({
        client_id: userId,
        status: 'pago_pendente_video',
        valor_total: proposal.cash_total_value || proposal.fidel_monthly_value,
        plano_meses: proposal.duration_months || 1,
        data_inicio: startDate.toISOString(),
        data_fim: endDate.toISOString(),
        lista_paineis: listaPaineis,
        metodo_pagamento: paymentData?.method || 'pix',
        proposal_id: proposalId,
        log_pagamento: {
          converted_from_proposal: true,
          proposal_number: proposal.number,
          payment_id: paymentId,
          payment_data: paymentData,
          converted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (orderError || !newOrder) {
      throw new Error(`Erro ao criar pedido: ${orderError?.message}`);
    }

    console.log('✅ Pedido criado:', newOrder.id);

    // 6. Atualizar proposta como convertida
    await supabase
      .from('proposals')
      .update({
        status: 'convertida',
        converted_order_id: newOrder.id,
        metadata: {
          ...proposal.metadata,
          converted_at: new Date().toISOString(),
          payment_approved_at: new Date().toISOString()
        }
      })
      .eq('id', proposalId);

    // 7. Registrar log
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'convertida_em_pedido',
      details: {
        order_id: newOrder.id,
        payment_id: paymentId,
        user_id: userId,
        is_new_user: isNewUser,
        timestamp: new Date().toISOString()
      }
    });

    // 8. Log de evento do sistema
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'PROPOSTA_CONVERTIDA_EM_PEDIDO',
      descricao: `Proposta ${proposal.number} convertida em pedido ${newOrder.id}. Novo usuário: ${isNewUser}`
    });

    console.log('🎉 Conversão concluída com sucesso!');

    const result: ConversionResult = {
      success: true,
      orderId: newOrder.id,
      userId,
      isNewUser,
      passwordResetLink: passwordResetLink || undefined
    };

    // 9. Enviar emails
    try {
      // Email de pagamento aprovado
      await supabase.functions.invoke('send-payment-approved-email', {
        body: {
          proposalId,
          orderId: newOrder.id,
          clientEmail: proposal.client_email,
          clientName: proposal.client_name
        }
      });

      // Se novo usuário, enviar email de boas-vindas
      if (isNewUser && passwordResetLink) {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            clientEmail: proposal.client_email,
            clientName: proposal.client_name,
            passwordResetLink,
            orderId: newOrder.id
          }
        });
      }
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar emails:', emailError);
      // Não falhar a conversão por erro de email
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro em convert-proposal-to-order:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
