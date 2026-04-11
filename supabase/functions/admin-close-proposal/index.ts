/**
 * Edge Function: admin-close-proposal
 * 
 * Fechamento administrativo de propostas
 * - Cria/atualiza cliente no Supabase e ASAAS
 * - Cria pedido e parcelas
 * - Gera contrato para assinatura
 * - Gera cobrança PIX ou Boleto via ASAAS
 * - Atualiza proposta como convertida
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { 
  createPixCharge, 
  createBoletoCharge,
  getOrCreateCustomer,
  type AsaasCustomer 
} from '../_shared/asaas-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientData {
  primeiro_nome: string;
  sobrenome: string;
  cpf: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  cnpj?: string;
  razao_social?: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}

interface RequestBody {
  proposalId: string;
  clientData: ClientData;
  paymentMethod: 'pix_avista' | 'pix_fidelidade' | 'boleto_fidelidade';
  diaVencimento?: number;
  options: {
    gerarContrato: boolean;
    enviarParaAssinatura: boolean;
    gerarCobranca: boolean;
  };
}

const PIX_DISCOUNT = 0.05; // 5% desconto

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body: RequestBody = await req.json();
    const { proposalId, clientData, paymentMethod, diaVencimento, options } = body;

    console.log('🎯 [ADMIN-CLOSE] Iniciando fechamento:', { proposalId, paymentMethod });

    // 1. Verificar permissões do usuário (via header Authorization)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const allowedRoles = ['super_admin', 'admin', 'admin_marketing'];
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      throw new Error('Permissão negada. Apenas administradores podem fechar propostas.');
    }

    // 2. Buscar proposta
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error('Proposta não encontrada');
    }

    if (proposal.status === 'convertida') {
      throw new Error('Esta proposta já foi convertida em pedido');
    }

    console.log('📋 [ADMIN-CLOSE] Proposta encontrada:', {
      number: proposal.number,
      duration: proposal.duration_months,
      value: proposal.cash_total_value
    });

    // 3. Verificar/Criar cliente no Supabase
    let clientId: string;
    let isNewUser = false;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', clientData.email.toLowerCase())
      .single();

    if (existingUser) {
      clientId = existingUser.id;
      console.log('👤 [ADMIN-CLOSE] Cliente existente:', clientId);
      
      // Atualizar dados do cliente
      await supabase
        .from('users')
        .update({
          nome: `${clientData.primeiro_nome} ${clientData.sobrenome}`,
          cpf: clientData.cpf?.replace(/\D/g, ''),
          telefone: clientData.telefone,
          empresa_documento: clientData.cnpj?.replace(/\D/g, ''),
          empresa_nome: clientData.razao_social,
          endereco_cep: clientData.endereco.cep,
          endereco_logradouro: clientData.endereco.logradouro,
          endereco_numero: clientData.endereco.numero,
          endereco_complemento: clientData.endereco.complemento,
          endereco_bairro: clientData.endereco.bairro,
          endereco_cidade: clientData.endereco.cidade,
          endereco_uf: clientData.endereco.uf,
        })
        .eq('id', clientId);
    } else {
      // Criar novo usuário via auth
      const tempPassword = crypto.randomUUID().substring(0, 12);
      
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: clientData.email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nome: `${clientData.primeiro_nome} ${clientData.sobrenome}`,
        }
      });

      if (createError) {
        console.error('❌ [ADMIN-CLOSE] Erro ao criar usuário:', createError);
        throw new Error('Erro ao criar conta do cliente');
      }

      clientId = authData.user.id;
      isNewUser = true;

      // Criar registro na tabela users
      await supabase.from('users').insert({
        id: clientId,
        email: clientData.email.toLowerCase(),
        nome: `${clientData.primeiro_nome} ${clientData.sobrenome}`,
        cpf: clientData.cpf?.replace(/\D/g, ''),
        telefone: clientData.telefone,
        empresa_documento: clientData.cnpj?.replace(/\D/g, ''),
        empresa_nome: clientData.razao_social,
        endereco_cep: clientData.endereco.cep,
        endereco_logradouro: clientData.endereco.logradouro,
        endereco_numero: clientData.endereco.numero,
        endereco_complemento: clientData.endereco.complemento,
        endereco_bairro: clientData.endereco.bairro,
        endereco_cidade: clientData.endereco.cidade,
        endereco_uf: clientData.endereco.uf,
      });

      // Atribuir role de cliente
      await supabase.from('user_roles').insert({
        user_id: clientId,
        role: 'cliente'
      });

      console.log('✅ [ADMIN-CLOSE] Novo cliente criado:', clientId);
    }

    // 4. Calcular valores
    const totalValue = proposal.cash_total_value;
    const months = proposal.duration_months || 1;
    const monthlyValue = proposal.fidel_monthly_value || (totalValue / months);
    
    let finalValue = totalValue;
    let valorMensal = monthlyValue;
    
    if (paymentMethod === 'pix_avista') {
      finalValue = totalValue * (1 - PIX_DISCOUNT);
    }

    // 5. Criar pedido
    const selectedBuildings = proposal.selected_buildings || [];
    const panelIds = selectedBuildings.map((b: any) => b.id);
    const totalScreens = selectedBuildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        client_id: clientId,
        proposal_id: proposalId,
        status: 'pendente',
        valor_total: paymentMethod === 'pix_avista' ? finalValue : totalValue,
        metodo_pagamento: paymentMethod === 'pix_avista' ? 'pix_asaas' : 
                          paymentMethod === 'pix_fidelidade' ? 'pix_fidelidade' : 'boleto_fidelidade',
        plano_meses: months,
        quantidade_paineis: panelIds.length,
        paineis_selecionados: panelIds,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        is_fidelidade: paymentMethod !== 'pix_avista',
        dia_vencimento: diaVencimento || 10,
        total_parcelas: paymentMethod === 'pix_avista' ? 1 : months,
        contrato_status: options.gerarContrato ? 'pendente' : null,
      })
      .select()
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [ADMIN-CLOSE] Erro ao criar pedido:', pedidoError);
      throw new Error('Erro ao criar pedido');
    }

    console.log('✅ [ADMIN-CLOSE] Pedido criado:', pedido.id);

    // 6. Criar parcelas
    const totalParcelas = paymentMethod === 'pix_avista' ? 1 : months;
    const valorParcela = paymentMethod === 'pix_avista' ? finalValue : valorMensal;
    
    const baseDate = new Date();
    if (paymentMethod !== 'pix_avista') {
      baseDate.setDate(diaVencimento || 10);
      if (new Date().getDate() > (diaVencimento || 10)) {
        baseDate.setMonth(baseDate.getMonth() + 1);
      }
    }

    for (let i = 0; i < totalParcelas; i++) {
      const dueDate = new Date(baseDate);
      if (paymentMethod !== 'pix_avista') {
        dueDate.setMonth(dueDate.getMonth() + i);
      }

      await supabase.from('parcelas').insert({
        pedido_id: pedido.id,
        numero_parcela: i + 1,
        valor: valorParcela,
        data_vencimento: dueDate.toISOString().split('T')[0],
        status: i === 0 ? 'aguardando_pagamento' : 'pendente'
      });
    }

    console.log(`✅ [ADMIN-CLOSE] ${totalParcelas} parcela(s) criada(s)`);

    // 7. Gerar cobrança se solicitado
    let paymentResult: any = null;

    if (options.gerarCobranca) {
      const customerData: AsaasCustomer = {
        name: `${clientData.primeiro_nome} ${clientData.sobrenome}`,
        email: clientData.email,
        cpfCnpj: clientData.cpf?.replace(/\D/g, '') || clientData.cnpj?.replace(/\D/g, ''),
        mobilePhone: clientData.telefone?.replace(/\D/g, ''),
      };

      const description = `Pedido EXA #${pedido.id.substring(0, 8)} - ${months} mês(es)`;

      try {
        if (paymentMethod === 'boleto_fidelidade') {
          // Calcular data de vencimento
          const dueDateObj = new Date(baseDate);
          const dueDateStr = dueDateObj.toISOString().split('T')[0];

          console.log('📄 [ADMIN-CLOSE] Gerando Boleto via ASAAS...');
          
          paymentResult = await createBoletoCharge(
            customerData,
            valorParcela,
            dueDateStr,
            description,
            pedido.id
          );

          // Atualizar pedido com dados do boleto
          await supabase
            .from('pedidos')
            .update({
              status: 'aguardando_pagamento',
              transaction_id: paymentResult.paymentId,
            })
            .eq('id', pedido.id);

          // Atualizar primeira parcela
          await supabase
            .from('parcelas')
            .update({
              asaas_payment_id: paymentResult.paymentId,
              boleto_url: paymentResult.bankSlipUrl,
            })
            .eq('pedido_id', pedido.id)
            .eq('numero_parcela', 1);

          console.log('✅ [ADMIN-CLOSE] Boleto gerado:', paymentResult.paymentId);

        } else {
          // PIX (à vista ou fidelidade)
          console.log('📱 [ADMIN-CLOSE] Gerando PIX via ASAAS...');
          
          paymentResult = await createPixCharge(
            customerData,
            valorParcela,
            description,
            pedido.id
          );

          // Atualizar pedido com dados do PIX
          await supabase
            .from('pedidos')
            .update({
              status: 'aguardando_pagamento',
              transaction_id: paymentResult.paymentId,
            })
            .eq('id', pedido.id);

          // Atualizar primeira parcela
          await supabase
            .from('parcelas')
            .update({
              asaas_payment_id: paymentResult.paymentId,
              pix_qr_code: paymentResult.qrCodeBase64,
              pix_copia_cola: paymentResult.pixCopiaECola,
            })
            .eq('pedido_id', pedido.id)
            .eq('numero_parcela', 1);

          console.log('✅ [ADMIN-CLOSE] PIX gerado:', paymentResult.paymentId);
        }
      } catch (paymentError: any) {
        console.error('❌ [ADMIN-CLOSE] Erro ao gerar cobrança:', paymentError);
        // Não falhar o processo, apenas logar
      }
    }

    // 8. Criar contrato se solicitado
    let contractId: string | null = null;

    if (options.gerarContrato) {
      const { data: contrato, error: contratoError } = await supabase
        .from('contratos_legais')
        .insert({
          proposta_id: proposalId,
          pedido_id: pedido.id,
          client_id: clientId,
          tipo: 'contrato_publicidade',
          status: 'pendente',
          valor_total: paymentMethod === 'pix_avista' ? finalValue : totalValue,
          data_inicio: startDate.toISOString().split('T')[0],
          data_fim: endDate.toISOString().split('T')[0],
          metodo_pagamento: paymentMethod,
          parcelas: totalParcelas,
          valor_parcela: valorParcela,
        })
        .select()
        .single();

      if (contrato) {
        contractId = contrato.id;

        // Criar signatários
        await supabase.from('contrato_signatarios').insert([
          {
            contrato_id: contractId,
            nome: `${clientData.primeiro_nome} ${clientData.sobrenome}`,
            email: clientData.email,
            cpf: clientData.cpf?.replace(/\D/g, ''),
            tipo: 'cliente',
            ordem: 1,
            status: 'pendente'
          },
          {
            contrato_id: contractId,
            nome: 'Jeferson Stilver',
            email: 'jefersonstilver@gmail.com',
            tipo: 'representante',
            ordem: 2,
            status: 'pendente'
          }
        ]);

        console.log('✅ [ADMIN-CLOSE] Contrato criado:', contractId);

        // Enviar para assinatura se solicitado
        if (options.enviarParaAssinatura) {
          try {
            await supabase.functions.invoke('clicksign-create-contract', {
              body: { contratoId: contractId }
            });
            console.log('✅ [ADMIN-CLOSE] Contrato enviado para ClickSign');
          } catch (clickSignError) {
            console.error('⚠️ [ADMIN-CLOSE] Erro ao enviar para ClickSign:', clickSignError);
          }
        }
      }
    }

    // 9. Atualizar proposta como convertida
    await supabase
      .from('proposals')
      .update({
        status: 'convertida',
        converted_order_id: pedido.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    // 10. Registrar log
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'proposta_fechada_admin',
      details: {
        pedido_id: pedido.id,
        contrato_id: contractId,
        payment_method: paymentMethod,
        closed_by: user.id,
        is_new_user: isNewUser,
        has_payment: !!paymentResult,
      }
    });

    // 11. Log do sistema
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'proposal_admin_close',
      descricao: `Proposta ${proposal.number} fechada administrativamente`,
      detalhes: {
        proposal_id: proposalId,
        pedido_id: pedido.id,
        contrato_id: contractId,
        client_id: clientId,
        payment_method: paymentMethod,
        valor: paymentMethod === 'pix_avista' ? finalValue : totalValue,
        closed_by: user.id,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ [ADMIN-CLOSE] Fechamento concluído com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        orderId: pedido.id,
        contractId,
        isNewUser,
        pixQrCode: paymentResult?.qrCodeBase64,
        pixCopiaECola: paymentResult?.pixCopiaECola,
        boletoUrl: paymentResult?.bankSlipUrl,
        invoiceUrl: paymentResult?.invoiceUrl,
        paymentId: paymentResult?.paymentId,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ [ADMIN-CLOSE] Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno ao processar fechamento'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
