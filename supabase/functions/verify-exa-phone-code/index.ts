import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { telefone, codigo, directorId } = await req.json();

    if (!telefone || !codigo) {
      throw new Error('Telefone e código são obrigatórios');
    }

    console.log('Verifying code for:', telefone);

    // Find the most recent non-expired code for this phone
    const { data: verificationData, error: fetchError } = await supabase
      .from('exa_alerts_verification_codes')
      .select('*')
      .eq('telefone', telefone)
      .eq('codigo', codigo)
      .eq('verificado', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationData) {
      console.error('Invalid or expired code');
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Código inválido ou expirado' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Code is valid, marking as verified');

    // Mark code as verified
    const { error: updateCodeError } = await supabase
      .from('exa_alerts_verification_codes')
      .update({ verificado: true })
      .eq('id', verificationData.id);

    if (updateCodeError) {
      console.error('Error updating verification code:', updateCodeError);
      throw updateCodeError;
    }

    // If directorId is provided, update the director record
    if (directorId) {
      const { error: updateDirectorError } = await supabase
        .from('exa_alerts_directors')
        .update({ 
          telefone_verificado: true,
          verificado_em: new Date().toISOString()
        })
        .eq('id', directorId);

      if (updateDirectorError) {
        console.error('Error updating director:', updateDirectorError);
        // Don't throw here, code is still verified
      } else {
        console.log('Director phone verified successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        verified: true, 
        message: 'Número verificado com sucesso' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in verify-exa-phone-code:', error);
    return new Response(
      JSON.stringify({ 
        verified: false,
        error: error.message || 'Erro ao verificar código' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
