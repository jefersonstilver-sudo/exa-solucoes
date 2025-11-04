import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EmailService } from "../unified-email-service/email-service.ts";

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
    console.log('🔒 Password Recovery Email Service - Request received');

    // Parse request body
    const { user, email_data } = await req.json();
    
    console.log('📧 Processing password recovery for:', user?.email);

    // Validate required data
    if (!user?.email) {
      console.error('❌ Missing user email');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email_data?.token_hash) {
      console.error('❌ Missing recovery token');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing recovery token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ Missing RESEND_API_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build recovery URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const baseUrl = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')
      ? 'http://localhost:8080'
      : 'https://examidia.com.br';
    
    const recoveryUrl = `${baseUrl}/auth/confirm?token_hash=${email_data.token_hash}&type=recovery&next=/reset-password`;

    console.log('🔗 Recovery URL generated:', recoveryUrl);

    // Send email
    const emailService = new EmailService(resendApiKey);
    const userName = user.email.split('@')[0]; // Fallback if no name available

    const result = await emailService.sendPasswordRecoveryEmail(
      user.email,
      userName,
      recoveryUrl
    );

    console.log('✅ Password recovery email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password recovery email sent',
        data: result 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error sending password recovery email:', error);
    
    // Return 200 to avoid breaking auth flow, but log the error
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        note: 'Returned 200 to avoid breaking auth flow' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
