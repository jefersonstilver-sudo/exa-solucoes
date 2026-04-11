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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    console.log('Starting email check...');

    // Get Zoho config
    const { data: config, error: configError } = await supabase
      .from('zoho_email_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (configError || !config) {
      console.log('No active Zoho config found');
      return new Response(
        JSON.stringify({ success: false, message: 'Zoho não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    let accessToken = config.access_token;
    const tokenExpiry = new Date(config.token_expires_at);
    
    if (tokenExpiry <= new Date(Date.now() + 5 * 60 * 1000)) {
      console.log('Token expiring soon, refreshing...');
      
      const refreshResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: Deno.env.get('ZOHO_CLIENT_ID')!,
          client_secret: Deno.env.get('ZOHO_CLIENT_SECRET')!,
          refresh_token: config.refresh_token,
        }),
      });

      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        const newExpiry = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000);
        
        await supabase
          .from('zoho_email_config')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiry.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);
        
        console.log('Token refreshed successfully');
      } else {
        console.error('Failed to refresh token:', refreshData);
        return new Response(
          JSON.stringify({ success: false, message: 'Falha ao renovar token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch emails from Zoho
    const accountId = config.account_id;
    if (!accountId) {
      console.log('No account ID configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Account ID não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unread emails from inbox
    const emailsResponse = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/messages/view?folderId=inbox&limit=20&status=unread`,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    const emailsData = await emailsResponse.json();
    console.log('Emails response:', JSON.stringify(emailsData, null, 2));

    if (!emailsData.data || emailsData.data.length === 0) {
      console.log('No unread emails found');
      
      // Update last checked timestamp
      await supabase
        .from('zoho_email_config')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', config.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum email novo', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const email of emailsData.data) {
      try {
        // Check if already processed
        const { data: existing } = await supabase
          .from('email_processing_log')
          .select('id')
          .eq('message_id', email.messageId)
          .single();

        if (existing) {
          console.log(`Email ${email.messageId} already processed, skipping`);
          continue;
        }

        // Get full email content
        const messageResponse = await fetch(
          `https://mail.zoho.com/api/accounts/${accountId}/folders/inbox/messages/${email.messageId}/content`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
            },
          }
        );

        const messageData = await messageResponse.json();
        console.log('Message content:', JSON.stringify(messageData, null, 2));

        const emailContent = messageData.data?.content || '';
        const subject = email.subject || '';
        const fromAddress = email.fromAddress || '';
        const fromName = email.sender || '';

        // Check for attachments
        let attachmentContent = '';
        if (email.hasAttachment) {
          try {
            const attachmentsResponse = await fetch(
              `https://mail.zoho.com/api/accounts/${accountId}/folders/inbox/messages/${email.messageId}/attachmentinfo`,
              {
                headers: {
                  'Authorization': `Zoho-oauthtoken ${accessToken}`,
                },
              }
            );
            const attachmentsData = await attachmentsResponse.json();
            console.log('Attachments:', JSON.stringify(attachmentsData, null, 2));
            
            // For now, just note that there are attachments
            if (attachmentsData.data && attachmentsData.data.length > 0) {
              attachmentContent = `\n\nAnexos: ${attachmentsData.data.map((a: any) => a.attachmentName).join(', ')}`;
            }
          } catch (e) {
            console.error('Error fetching attachments:', e);
          }
        }

        // Call AI analysis
        const analysisResponse = await supabase.functions.invoke('analyze-curriculum', {
          body: {
            messageId: email.messageId,
            fromEmail: fromAddress,
            fromName: fromName,
            subject: subject,
            content: emailContent + attachmentContent,
            receivedAt: email.receivedTime,
          },
        });

        console.log('Analysis response:', analysisResponse);
        processedCount++;

      } catch (e) {
        console.error(`Error processing email ${email.messageId}:`, e);
        errors.push(`${email.messageId}: ${e.message}`);
      }
    }

    // Update last checked timestamp
    await supabase
      .from('zoho_email_config')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('id', config.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        total: emailsData.data.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-zoho-emails:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
