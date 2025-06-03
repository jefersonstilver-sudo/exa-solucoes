
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { ConfirmationEmail } from "./_templates/confirmation-email.tsx";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || 'your-webhook-secret';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('🔐 EMAIL CONFIRMATION HOOK - Starting...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log('📦 Processing webhook payload...');
    
    // For now, we'll parse the JSON directly since we're setting this up
    const data = JSON.parse(payload);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url }
    } = data;

    console.log('✅ Webhook data parsed:', {
      email: user?.email,
      action_type: email_action_type,
      has_token: !!token
    });

    // Only process email confirmation events
    if (email_action_type !== 'signup') {
      console.log('⚠️ Skipping non-signup event:', email_action_type);
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Generate the confirmation URL
    const confirmationUrl = `${site_url || Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || site_url + '/confirmacao'}`;

    console.log('🔗 Generated confirmation URL');

    // Render the email template
    const html = await renderAsync(
      React.createElement(ConfirmationEmail, {
        userName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente',
        confirmationUrl,
        userEmail: user?.email
      })
    );

    console.log('📧 Email template rendered');

    // Send the email
    const { data: emailData, error } = await resend.emails.send({
      from: 'Indexa <noreply@indexa.app>',
      to: [user.email],
      subject: '🎯 Confirme seu email na Indexa - Bem-vindo(a)!',
      html,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', emailData?.id);

    return new Response(JSON.stringify({ 
      message: 'Email sent successfully',
      email_id: emailData?.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 Error in send-confirmation-email function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
