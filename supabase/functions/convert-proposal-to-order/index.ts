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

  const startTime = Date.now();
  console.log('========================================');
  console.log('🔄 [CONVERT-PROPOSAL] INÍCIO DA CONVERSÃO');
  console.log('========================================');

  try {
    const body = await req.json();
    const { proposalId, paymentId, paymentData } = body;

    console.log('📥 Payload recebido:', JSON.stringify({ proposalId, paymentId, paymentData }, null, 2));

    if (!proposalId) {
      console.error('❌ ERRO: proposalId é obrigatório');
      throw new Error('proposalId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('🔗 Conectando ao Supabase:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar proposta completa
    console.log('📋 Buscando proposta:', proposalId);
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError) {
      console.error('❌ ERRO ao buscar proposta:', proposalError);
      throw new Error(`Proposta não encontrada: ${proposalError.message}`);
    }

    if (!proposal) {
      console.error('❌ ERRO: Proposta não encontrada no banco');
      throw new Error('Proposta não encontrada');
    }

    console.log('✅ Proposta encontrada:', {
      number: proposal.number,
      client_name: proposal.client_name,
      client_email: proposal.client_email,
      status: proposal.status,
      converted_order_id: proposal.converted_order_id,
      payment_type: proposal.payment_type
    });

    // Verificar se já foi convertida
    if (proposal.status === 'convertida' && proposal.converted_order_id) {
      console.log('⚠️ Proposta já foi convertida anteriormente:', proposal.converted_order_id);
      return new Response(JSON.stringify({
        success: true,
        orderId: proposal.converted_order_id,
        alreadyConverted: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Verificar/Criar usuário
    console.log('👤 Processando usuário...');
    let userId: string | null = null;
    let isNewUser = false;
    let passwordResetLink: string | null = null;

    const clientEmail = proposal.client_email?.toLowerCase().trim();
    console.log('📧 Email do cliente:', clientEmail);
    
    if (clientEmail) {
      // Buscar usuário existente
      console.log('🔍 Buscando usuário existente...');
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', clientEmail)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.log('⚠️ Erro ao buscar usuário (não crítico):', userError.message);
      }

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
          email_confirm: true,
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
          console.log('📝 Criando registro na tabela users...');
          const { error: insertUserError } = await supabase.from('users').insert({
            id: userId,
            email: clientEmail,
            nome: proposal.client_name || 'Cliente EXA',
            role: 'client',
            telefone: proposal.client_phone,
            status: 'active',
            created_at: new Date().toISOString()
          });

          if (insertUserError) {
            console.error('⚠️ Erro ao inserir usuário na tabela users:', insertUserError);
          } else {
            console.log('✅ Usuário inserido na tabela users');
          }

          // Gerar link de recuperação de senha
          console.log('🔑 Gerando link de senha...');
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
    } else {
      console.error('❌ ERRO: Email do cliente não disponível');
    }

    if (!userId) {
      console.error('❌ ERRO CRÍTICO: Não foi possível criar/encontrar usuário');
      throw new Error('Não foi possível criar/encontrar usuário');
    }

    // 3. Calcular datas da campanha
    console.log('📅 Calculando datas da campanha...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (proposal.duration_months || 1));
    
    console.log('📅 Período:', startDate.toISOString(), 'até', endDate.toISOString());

    // 4. Preparar lista de painéis
    console.log('🏢 Preparando lista de painéis...');
    const selectedBuildings = Array.isArray(proposal.selected_buildings) 
      ? proposal.selected_buildings 
      : [];

    console.log('🏢 Prédios selecionados:', selectedBuildings.length);

    const listaPaineis = selectedBuildings.map((b: any) => ({
      building_id: b.building_id,
      building_name: b.building_name || b.nome,
      quantidade_telas: b.quantidade_telas || 1
    }));

    // 5. Verificar se é pagamento personalizado
    const isCustomPayment = proposal.payment_type === 'custom';
    const customInstallments = Array.isArray(proposal.custom_installments) 
      ? proposal.custom_installments 
      : [];

    console.log('💳 Tipo de pagamento:', isCustomPayment ? 'PERSONALIZADO' : 'PADRÃO');
    if (isCustomPayment) {
      console.log('💳 Parcelas personalizadas:', JSON.stringify(customInstallments, null, 2));
    }

    // 6. Criar pedido
    console.log('📦 Criando pedido no banco...');
    
    // Calcular valor total (custom ou padrão)
    const valorTotal = isCustomPayment
      ? customInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount || 0), 0)
      : (proposal.cash_total_value || proposal.fidel_monthly_value);

    const orderData = {
      client_id: userId,
      client_name: proposal.client_name,
      status: 'pago_pendente_video',
      valor_total: valorTotal,
      plano_meses: proposal.duration_months || 1,
      data_inicio: startDate.toISOString(),
      data_fim: endDate.toISOString(),
      lista_paineis: listaPaineis,
      metodo_pagamento: isCustomPayment ? 'personalizado' : (paymentData?.method || 'pix'),
      proposal_id: proposalId,
      log_pagamento: {
        converted_from_proposal: true,
        proposal_number: proposal.number,
        payment_id: paymentId,
        payment_data: paymentData,
        payment_type: proposal.payment_type,
        custom_installments: isCustomPayment ? customInstallments : null,
        converted_at: new Date().toISOString()
      }
    };

    console.log('📦 Dados do pedido:', JSON.stringify(orderData, null, 2));

    const { data: newOrder, error: orderError } = await supabase
      .from('pedidos')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ ERRO ao criar pedido:', orderError);
      console.error('❌ Código do erro:', orderError.code);
      console.error('❌ Detalhes:', orderError.details);
      console.error('❌ Hint:', orderError.hint);
      throw new Error(`Erro ao criar pedido: ${orderError.message}`);
    }

    if (!newOrder) {
      console.error('❌ ERRO: Pedido não retornado após insert');
      throw new Error('Pedido não foi criado');
    }

    console.log('✅ PEDIDO CRIADO COM SUCESSO:', newOrder.id);

    // 7. SE É PAGAMENTO PERSONALIZADO: Criar registros na tabela parcelas
    if (isCustomPayment && customInstallments.length > 0) {
      console.log('💳 Criando registros de parcelas...');
      
      const parcelasData = customInstallments.map((inst: any, idx: number) => ({
        pedido_id: newOrder.id,
        numero_parcela: idx + 1,
        valor_original: Number(inst.amount),
        valor_final: Number(inst.amount),
        data_vencimento: inst.due_date,
        status: idx === 0 ? 'pago' : 'pendente', // 1ª parcela já paga
        metodo_pagamento: paymentData?.method || 'pix',
        data_pagamento: idx === 0 ? new Date().toISOString() : null,
        payment_id: idx === 0 ? paymentId : null
      }));

      console.log('💳 Parcelas a criar:', JSON.stringify(parcelasData, null, 2));

      const { error: parcelasError } = await supabase
        .from('parcelas')
        .insert(parcelasData);

      if (parcelasError) {
        console.error('⚠️ Erro ao criar parcelas (não crítico):', parcelasError);
        // Log do erro mas não interrompe o fluxo
      } else {
        console.log('✅ Parcelas criadas com sucesso:', customInstallments.length, 'parcelas');
      }
    }

    // 8. Atualizar proposta como convertida
    console.log('📝 Atualizando proposta para status convertida...');
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error('⚠️ Erro ao atualizar proposta:', updateError);
    } else {
      console.log('✅ Proposta atualizada para status convertida');
    }

    // 9. Registrar log
    console.log('📝 Registrando log da conversão...');
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'convertida_em_pedido',
      details: {
        order_id: newOrder.id,
        payment_id: paymentId,
        user_id: userId,
        is_new_user: isNewUser,
        is_custom_payment: isCustomPayment,
        installments_created: isCustomPayment ? customInstallments.length : 0,
        timestamp: new Date().toISOString()
      }
    });

    // 10. Log de evento do sistema
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'PROPOSTA_CONVERTIDA_EM_PEDIDO',
      descricao: `Proposta ${proposal.number} convertida em pedido ${newOrder.id}. Novo usuário: ${isNewUser}. Pagamento personalizado: ${isCustomPayment}`
    });

    const duration = Date.now() - startTime;
    console.log('========================================');
    console.log('🎉 CONVERSÃO CONCLUÍDA COM SUCESSO!');
    console.log('📦 Pedido ID:', newOrder.id);
    console.log('👤 User ID:', userId);
    console.log('🆕 Novo usuário:', isNewUser);
    console.log('💳 Pagamento personalizado:', isCustomPayment);
    if (isCustomPayment) {
      console.log('📝 Parcelas criadas:', customInstallments.length);
    }
    console.log('⏱️ Tempo total:', duration, 'ms');
    console.log('========================================');

    const result: ConversionResult = {
      success: true,
      orderId: newOrder.id,
      userId,
      isNewUser,
      passwordResetLink: passwordResetLink || undefined
    };

    // 11. Enviar emails
    try {
      console.log('📧 Enviando emails...');
      // Email de pagamento aprovado
      await supabase.functions.invoke('send-payment-approved-email', {
        body: {
          proposalId,
          orderId: newOrder.id,
          clientEmail: proposal.client_email,
          clientName: proposal.client_name
        }
      });
      console.log('✅ Email de pagamento aprovado enviado');

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
        console.log('✅ Email de boas-vindas enviado');
      }
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar emails (não crítico):', emailError);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('========================================');
    console.error('❌ ERRO NA CONVERSÃO');
    console.error('❌ Mensagem:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('⏱️ Tempo até falha:', duration, 'ms');
    console.error('========================================');

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});