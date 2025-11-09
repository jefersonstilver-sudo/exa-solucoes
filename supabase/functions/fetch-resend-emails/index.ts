import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html?: string;
  created_at: string;
  last_event?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar emails do Resend
    console.log('Fetching emails from Resend API...');
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log('Resend data received:', resendData);

    // Estrutura da resposta do Resend: { data: [...emails] }
    const emails: ResendEmail[] = resendData.data || [];

    // Sincronizar com nossa tabela local email_logs
    for (const email of emails) {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('email_logs')
        .select('id')
        .eq('resend_id', email.id)
        .single();

      if (!existing) {
        // Inserir novo registro
        const { error: insertError } = await supabase
          .from('email_logs')
          .insert({
            resend_id: email.id,
            recipient_email: email.to[0],
            subject: email.subject,
            template_id: 'unknown', // Tentar identificar pelo subject
            status: email.last_event || 'sent',
            sent_at: email.created_at,
            opened_at: email.last_event === 'opened' || email.last_event === 'clicked' ? new Date().toISOString() : null,
            clicked_at: email.last_event === 'clicked' ? new Date().toISOString() : null,
          });

        if (insertError) {
          console.error('Error inserting email log:', insertError);
        }
      } else {
        // Atualizar status se necessário
        const { error: updateError } = await supabase
          .from('email_logs')
          .update({
            status: email.last_event || 'sent',
            opened_at: email.last_event === 'opened' || email.last_event === 'clicked' ? new Date().toISOString() : null,
            clicked_at: email.last_event === 'clicked' ? new Date().toISOString() : null,
          })
          .eq('resend_id', email.id);

        if (updateError) {
          console.error('Error updating email log:', updateError);
        }
      }
    }

    // Buscar estatísticas atualizadas
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);

    if (logsError) {
      throw logsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        emails: emails,
        logs: logs,
        synced: emails.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in fetch-resend-emails:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
