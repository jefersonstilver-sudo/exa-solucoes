/**
 * Edge Function: get-inter-saldo
 * 
 * Obtém saldo atual da conta corrente no Banco Inter
 * Atualiza tabela contas_bancarias com saldo atual
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getInterSaldo } from "../_shared/inter-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💰 [get-inter-saldo] Fetching Inter account balance...');

    // Obter saldo do Inter
    const saldo = await getInterSaldo();

    console.log('✅ [get-inter-saldo] Balance retrieved:', {
      disponivel: saldo.disponivel,
      bloqueado: saldo.bloqueadoCheque + saldo.bloqueadoJudicialmente + saldo.bloqueadoAdministrativo,
    });

    // Atualizar no banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar ou criar conta bancária Inter
    const { data: existingAccount, error: fetchError } = await supabase
      .from('contas_bancarias')
      .select('id')
      .eq('banco', 'inter')
      .eq('is_principal', true)
      .single();

    const contaCorrente = Deno.env.get('INTER_CONTA_CORRENTE') || '';
    
    const accountData = {
      banco: 'inter',
      nome: 'Conta Corrente Inter Empresas',
      conta: contaCorrente,
      saldo_atual: saldo.disponivel,
      saldo_disponivel: saldo.disponivel,
      saldo_bloqueado: saldo.bloqueadoCheque + saldo.bloqueadoJudicialmente + saldo.bloqueadoAdministrativo,
      limite: saldo.limite,
      saldo_atualizado_em: new Date().toISOString(),
      ativa: true,
      is_principal: true,
      updated_at: new Date().toISOString(),
    };

    if (existingAccount?.id) {
      // Atualizar conta existente
      const { error: updateError } = await supabase
        .from('contas_bancarias')
        .update(accountData)
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('⚠️ [get-inter-saldo] Failed to update account:', updateError);
      } else {
        console.log('✅ [get-inter-saldo] Account balance updated in database');
      }
    } else {
      // Criar nova conta
      const { error: insertError } = await supabase
        .from('contas_bancarias')
        .insert(accountData);

      if (insertError && !insertError.message?.includes('duplicate')) {
        console.error('⚠️ [get-inter-saldo] Failed to create account:', insertError);
      } else {
        console.log('✅ [get-inter-saldo] New Inter account created in database');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        saldo: {
          disponivel: saldo.disponivel,
          bloqueadoCheque: saldo.bloqueadoCheque,
          bloqueadoJudicialmente: saldo.bloqueadoJudicialmente,
          bloqueadoAdministrativo: saldo.bloqueadoAdministrativo,
          totalBloqueado: saldo.bloqueadoCheque + saldo.bloqueadoJudicialmente + saldo.bloqueadoAdministrativo,
          limite: saldo.limite,
        },
        atualizadoEm: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ [get-inter-saldo] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to get Inter balance',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
