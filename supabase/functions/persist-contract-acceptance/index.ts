import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractAcceptanceRequest {
  proposalId: string;
  clientData: {
    nome: string;
    cpf_cnpj?: string;
    email: string;
  };
  fingerprint?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ContractAcceptanceRequest = await req.json();
    const { proposalId, clientData, fingerprint } = body;

    if (!proposalId) {
      return new Response(
        JSON.stringify({ success: false, error: 'proposalId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capturar metadados da requisição
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || req.headers.get('cf-connecting-ip')
      || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const acceptedAt = new Date().toISOString();

    console.log(`📝 Persistindo aceite do contrato - Proposal: ${proposalId}`);
    console.log(`   IP: ${ipAddress}`);
    console.log(`   User-Agent: ${userAgent.substring(0, 50)}...`);

    // 1. Atualizar proposal com dados do aceite
    const { error: proposalError } = await supabase
      .from('proposals')
      .update({
        contract_accepted_at: acceptedAt,
        contract_accepted_ip: ipAddress,
        contract_accepted_user_agent: userAgent,
        contract_terms_version: '1.0'
      })
      .eq('id', proposalId);

    if (proposalError) {
      console.error('❌ Erro ao atualizar proposal:', proposalError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao persistir aceite na proposta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Inserir log de auditoria
    const { error: logError } = await supabase
      .from('contract_acceptance_logs')
      .insert({
        proposal_id: proposalId,
        accepted_at: acceptedAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        fingerprint: fingerprint || null,
        client_name: clientData?.nome || null,
        client_email: clientData?.email || null,
        client_document: clientData?.cpf_cnpj || null
      });

    if (logError) {
      // Log error but don't fail - proposal update is more important
      console.error('⚠️ Erro ao inserir log de aceite:', logError);
    } else {
      console.log('✅ Log de aceite inserido com sucesso');
    }

    console.log('✅ Aceite do contrato persistido com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Aceite do contrato registrado com sucesso',
        acceptedAt,
        proposalId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro ao processar aceite do contrato:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
