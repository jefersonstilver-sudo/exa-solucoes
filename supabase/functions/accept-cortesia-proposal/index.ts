import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId } = await req.json();

    console.log('[accept-cortesia-proposal] Aceitando cortesia:', proposalId);

    if (!proposalId) {
      return new Response(JSON.stringify({ error: 'proposalId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar proposta
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError || !proposal) {
      console.error('[accept-cortesia-proposal] Proposta não encontrada:', fetchError);
      return new Response(JSON.stringify({ error: 'Proposta não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se é cortesia
    const metadata = proposal.metadata as any;
    if (metadata?.type !== 'cortesia') {
      return new Response(JSON.stringify({ error: 'Esta proposta não é uma cortesia' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se já foi aceita
    if (proposal.status === 'aceita') {
      return new Response(JSON.stringify({ error: 'Esta cortesia já foi aceita' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const buildings = Array.isArray(proposal.selected_buildings) ? proposal.selected_buildings : [];
    const clientEmail = proposal.client_email;
    const clientName = proposal.client_name;

    // 1. Verificar/criar usuário
    let userId: string;
    let isNewUser = false;
    let passwordResetLink: string | null = null;

    // Verificar se já existe usuário com esse email
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', clientEmail)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log('[accept-cortesia-proposal] Usuário existente:', userId);
    } else {
      // Criar novo usuário no Auth
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: clientEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nome: clientName,
          origem: 'cortesia'
        }
      });

      if (authError) {
        console.error('[accept-cortesia-proposal] Erro ao criar usuário auth:', authError);
        throw new Error('Erro ao criar conta: ' + authError.message);
      }

      userId = authData.user.id;
      isNewUser = true;

      // Criar registro na tabela users
      await supabase.from('users').insert({
        id: userId,
        email: clientEmail,
        nome: clientName,
        telefone: proposal.client_phone,
        role: 'cliente',
        ativo: true
      });

      // Gerar link de redefinição de senha
      const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: clientEmail,
        options: {
          redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/definir-senha`
        }
      });

      if (!resetError && resetData?.properties?.action_link) {
        passwordResetLink = resetData.properties.action_link;
      }

      console.log('[accept-cortesia-proposal] Novo usuário criado:', userId);
    }

    // 2. Criar pedido
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + proposal.duration_months);

    // Gerar lista de painéis
    const listaPaineis = buildings.map((b: any) => ({
      building_id: b.building_id,
      painel_id: b.building_id, // Usar building_id como painel_id temporário
      building_name: b.building_name
    }));

    const buildingIds = buildings.map((b: any) => b.building_id);

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        client_id: userId,
        status: 'pago_pendente_video',
        valor_total: 0,
        plano_id: proposal.duration_months,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        metodo_pagamento: 'cortesia',
        lista_paineis: listaPaineis,
        lista_predios: buildingIds,
        log_pagamento: {
          type: 'cortesia',
          proposal_id: proposalId,
          proposal_number: proposal.number,
          accepted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (pedidoError) {
      console.error('[accept-cortesia-proposal] Erro ao criar pedido:', pedidoError);
      throw pedidoError;
    }

    console.log('[accept-cortesia-proposal] Pedido criado:', pedido.id);

    // 3. Criar contratos para cada painel
    for (const building of buildings) {
      // Buscar painel real do prédio
      const { data: paineis } = await supabase
        .from('painels')
        .select('id')
        .eq('building_id', building.building_id)
        .limit(1);

      const painelId = paineis?.[0]?.id || building.building_id;

      await supabase.from('contratos').insert({
        pedido_id: pedido.id,
        client_id: userId,
        painel_id: painelId,
        predio_id: building.building_id,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        valor: 0,
        status: 'ativo'
      });
    }

    console.log('[accept-cortesia-proposal] Contratos criados');

    // 4. Atualizar proposta para aceita
    await supabase
      .from('proposals')
      .update({
        status: 'aceita',
        responded_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    // 5. Log da aceitação
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'aceita',
      details: {
        pedido_id: pedido.id,
        user_id: userId,
        is_new_user: isNewUser
      }
    });

    // 6. Marcar código como usado (se existir)
    if (metadata?.cortesia_code_id) {
      await supabase
        .from('cortesia_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', metadata.cortesia_code_id);
    }

    // 7. Enviar email de boas-vindas
    try {
      await supabase.functions.invoke('send-cortesia-welcome-email', {
        body: {
          clientEmail,
          clientName,
          pedidoId: pedido.id,
          buildings,
          durationMonths: proposal.duration_months,
          totalPanels: proposal.total_panels,
          passwordResetLink,
          isNewUser
        }
      });
      console.log('[accept-cortesia-proposal] Email de boas-vindas enviado');
    } catch (emailErr) {
      console.error('[accept-cortesia-proposal] Erro ao enviar email:', emailErr);
    }

    // 8. Log do evento
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'CORTESIA_ACCEPTED',
      descricao: `Cortesia ${proposal.number} aceita por ${clientName}. Pedido ${pedido.id} criado.`
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Cortesia aceita com sucesso!',
      pedidoId: pedido.id,
      isNewUser,
      passwordResetLink: isNewUser ? passwordResetLink : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[accept-cortesia-proposal] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
