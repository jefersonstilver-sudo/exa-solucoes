import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, requestData, createdBy } = await req.json();

    console.log('[create-proposal-cortesia] Criando cortesia:', { requestId, clientName: requestData?.client_name });

    const { 
      client_name, 
      client_email, 
      client_phone, 
      client_cnpj, 
      buildings, 
      duration_months, 
      total_panels 
    } = requestData;

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o email já tem conta
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', client_email.toLowerCase())
      .single();

    let userId: string;
    let isNewUser = false;
    let passwordResetLink: string | null = null;

    if (existingUser) {
      // Usuário já existe
      userId = existingUser.id;
      console.log('[create-proposal-cortesia] Usuário existente:', userId);
    } else {
      // Criar novo usuário via auth.admin
      isNewUser = true;
      console.log('[create-proposal-cortesia] Criando novo usuário:', client_email);

      // Gerar senha temporária aleatória
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: client_email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: client_name,
          phone: client_phone,
          role: 'client'
        }
      });

      if (authError) {
        console.error('[create-proposal-cortesia] Erro ao criar usuário auth:', authError);
        throw authError;
      }

      userId = authUser.user.id;

      // Inserir na tabela users
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: client_email.toLowerCase(),
          nome: client_name,
          telefone: client_phone,
          cnpj: client_cnpj,
          role: 'client'
        });

      if (userInsertError) {
        console.error('[create-proposal-cortesia] Erro ao inserir na tabela users:', userInsertError);
        // Não falhar por isso, auth já foi criado
      }

      // Gerar link de recuperação de senha para definir senha
      const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: client_email.toLowerCase(),
        options: {
          redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/reset-password`
        }
      });

      if (!resetError && resetData?.properties?.action_link) {
        passwordResetLink = resetData.properties.action_link;
        console.log('[create-proposal-cortesia] Link de recuperação gerado');
      }
    }

    // Calcular datas
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration_months);

    // Preparar lista de painéis
    const panelIds = buildings.map((b: any) => b.building_id);
    const buildingIds = buildings.map((b: any) => b.building_id);

    // Buscar painéis reais dos prédios selecionados
    const { data: panels } = await supabase
      .from('painels')
      .select('id, building_id')
      .in('building_id', buildingIds);

    const listaPaineis = panels?.map(p => ({
      painel_id: p.id,
      building_id: p.building_id,
      building_name: buildings.find((b: any) => b.building_id === p.building_id)?.building_name || 'Prédio'
    })) || buildings.map((b: any) => ({
      painel_id: null,
      building_id: b.building_id,
      building_name: b.building_name
    }));

    // Criar pedido como cortesia
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        client_id: userId,
        status: 'pago_pendente_video',
        valor_total: 0,
        plano_meses: duration_months,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        metodo_pagamento: 'cortesia',
        lista_paineis: listaPaineis,
        lista_predios: buildingIds,
        log_pagamento: {
          type: 'cortesia',
          authorized_by: createdBy,
          cortesia_code_id: requestId,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (pedidoError) {
      console.error('[create-proposal-cortesia] Erro ao criar pedido:', pedidoError);
      throw pedidoError;
    }

    console.log('[create-proposal-cortesia] Pedido criado:', pedido.id);

    // Criar contratos para cada painel
    const contratos = listaPaineis.map((item: any) => ({
      pedido_id: pedido.id,
      painel_id: item.painel_id,
      building_id: item.building_id,
      cliente_id: userId,
      data_inicio: startDate.toISOString().split('T')[0],
      data_fim: endDate.toISOString().split('T')[0],
      status: 'ativo',
      valor_mensal: 0
    }));

    if (contratos.length > 0 && contratos[0].painel_id) {
      const { error: contratosError } = await supabase
        .from('contratos')
        .insert(contratos);

      if (contratosError) {
        console.error('[create-proposal-cortesia] Erro ao criar contratos:', contratosError);
        // Não falhar, pedido já foi criado
      }
    }

    // Log do evento
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'CORTESIA_CREATED',
      descricao: `Cortesia criada para ${client_name} (${client_email}). Pedido: ${pedido.id}. ${duration_months} meses, ${buildings.length} prédios.`
    });

    // Enviar email de boas-vindas
    try {
      await supabase.functions.invoke('send-cortesia-welcome-email', {
        body: {
          pedidoId: pedido.id,
          clientEmail: client_email,
          clientName: client_name,
          buildingsCount: buildings.length,
          panelsCount: total_panels,
          durationMonths: duration_months,
          isNewUser,
          passwordResetLink
        }
      });
      console.log('[create-proposal-cortesia] Email de boas-vindas enviado');
    } catch (emailError) {
      console.error('[create-proposal-cortesia] Erro ao enviar email:', emailError);
      // Não falhar por isso
    }

    return new Response(JSON.stringify({
      success: true,
      pedidoId: pedido.id,
      userId,
      isNewUser,
      message: isNewUser 
        ? 'Cortesia criada! Conta nova criada para o cliente.'
        : 'Cortesia adicionada à conta existente do cliente.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[create-proposal-cortesia] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
