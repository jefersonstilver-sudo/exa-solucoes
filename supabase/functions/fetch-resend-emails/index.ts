import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    // Buscar emails do Resend com retry logic
    console.log('📧 [FETCH-RESEND] Fetching emails from Resend API...');
    
    let resendResponse;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Se receber 429, aguardar antes de tentar novamente
        if (resendResponse.status === 429) {
          retryCount++;
          if (retryCount < maxRetries) {
            const waitTime = 2000 * retryCount; // 2s, 4s, 6s
            console.log(`⏳ [FETCH-RESEND] Rate limited, waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        break;
      } catch (fetchError) {
        retryCount++;
        if (retryCount >= maxRetries) throw fetchError;
        console.log(`⚠️ [FETCH-RESEND] Fetch error, retry ${retryCount}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log('Resend data received:', resendData);

    // Estrutura da resposta do Resend: { data: [...emails] }
    const emails: ResendEmail[] = resendData.data || [];

    // ✅ FIX: Buscar todos IDs existentes de uma vez (batch query)
    const resendIds = emails.map(e => e.id);
    const { data: existingEmails } = await supabase
      .from('email_logs')
      .select('resend_id')
      .in('resend_id', resendIds);
    
    const existingIds = new Set((existingEmails || []).map(e => e.resend_id));
    
    // ✅ FIX: Preparar inserts em batch
    const emailsToInsert = [];
    
    for (const email of emails) {
      if (existingIds.has(email.id)) continue;

      emailsToInsert.push({
        resend_id: email.id,
        recipient_email: email.to[0],
        subject: email.subject,
        template_id: 'unknown',
        status: email.last_event || 'sent',
        sent_at: email.created_at,
        opened_at: email.last_event === 'opened' || email.last_event === 'clicked' ? new Date().toISOString() : null,
        clicked_at: email.last_event === 'clicked' ? new Date().toISOString() : null,
      });
    }
    
    // ✅ FIX: Insert em batch único
    if (emailsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('email_logs')
        .insert(emailsToInsert);

      if (insertError) {
        console.error('Error batch inserting email logs:', insertError);
      } else {
        console.log(`✅ Inserted ${emailsToInsert.length} new emails in batch`);
      }
    }
    
    // Buscar emails recentes para retornar (com LIMIT)
    const { data: recentLogs, error: fetchError } = await supabase
      .from('email_logs')
      .select('id, resend_id, recipient_email, subject, status, sent_at, opened_at, clicked_at')
      .order('sent_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error('Error fetching recent logs:', fetchError);
    }

    // Remover loop de update individual - já não fazemos update em tempo real
    // Os updates de status serão feitos na próxima execução
    
    return new Response(
      JSON.stringify({
        success: true,
        emails: emails,
        recentLogs,
        synced: emailsToInsert.length,
        timestamp: new Date().toISOString(),
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
