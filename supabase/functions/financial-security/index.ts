import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 10 financial operations per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 10,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minutes block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [FINANCIAL-SECURITY] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'monitor_security':
        result = await monitorFinancialSecurity(supabaseClient);
        break;
      
      case 'get_secure_order':
        result = await getSecureOrderData(supabaseClient, params.orderId);
        break;
      
      case 'encrypt_field':
        result = await encryptSensitiveField(params.value);
        break;
      
      case 'decrypt_field':
        result = await decryptSensitiveField(params.encryptedValue, params.userRole);
        break;
      
      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Financial security function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Monitor financial security status and detect suspicious patterns
 */
async function monitorFinancialSecurity(supabase: any) {
  console.log('🛡️ Running financial security monitoring...');
  
  // Get security status using the database function
  const { data: securityStatus, error: securityError } = await supabase
    .rpc('detect_suspicious_financial_access');

  if (securityError) {
    console.error('Security monitoring error:', securityError);
    throw new Error('Failed to monitor security status');
  }

  // Get recent high-risk access attempts
  const { data: highRiskAccess, error: accessError } = await supabase
    .from('financial_data_audit_logs')
    .select(`
      *,
      users:user_id (
        email,
        role
      )
    `)
    .eq('risk_level', 'high')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (accessError) {
    console.error('High-risk access query error:', accessError);
  }

  // Log critical security status
  if (securityStatus?.security_status === 'CRITICAL') {
    console.error('🚨 CRITICAL SECURITY ALERT:', securityStatus);
    
    // Log critical security event
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'CRITICAL_FINANCIAL_SECURITY_ALERT',
        descricao: `Critical security status detected: ${JSON.stringify(securityStatus)}`
      });
  }

  return {
    securityStatus,
    highRiskAccess: highRiskAccess || [],
    monitoring: {
      timestamp: new Date().toISOString(),
      checks_performed: ['suspicious_users', 'high_risk_access', 'access_patterns'],
      status: securityStatus?.security_status || 'UNKNOWN'
    }
  };
}

/**
 * Securely retrieve order data with audit logging
 */
async function getSecureOrderData(supabase: any, orderId: string) {
  if (!orderId) {
    throw new Error('Order ID is required');
  }

  console.log(`🔒 Secure order data access requested for: ${orderId}`);

  // Use the secure database function
  const { data, error } = await supabase
    .rpc('get_secure_pedido_data', {
      p_pedido_id: orderId
    });

  if (error) {
    console.error('Secure order access error:', error);
    throw new Error(error.message || 'Failed to access order data');
  }

  console.log(`✅ Secure order data access completed for: ${orderId}`);
  
  return data?.[0] || null;
}

/**
 * Encrypt sensitive financial field (placeholder implementation)
 */
async function encryptSensitiveField(value: string) {
  if (!value) {
    throw new Error('Value is required for encryption');
  }

  // In production, this would use proper encryption
  // For now, we'll use a simple encoding approach
  const encoder = new TextEncoder();
  const data = encoder.encode(value + '_ENCRYPTED_' + Date.now());
  
  // Convert to base64 for storage
  const base64 = btoa(String.fromCharCode(...data));
  
  console.log(`🔐 Field encrypted (length: ${value.length} -> ${base64.length})`);
  
  return {
    encrypted: base64,
    algorithm: 'mock_encryption_v1',
    timestamp: new Date().toISOString()
  };
}

/**
 * Decrypt sensitive financial field (admin only)
 */
async function decryptSensitiveField(encryptedValue: string, userRole?: string) {
  if (!encryptedValue) {
    throw new Error('Encrypted value is required');
  }

  // Check permissions
  if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
    console.warn(`🚫 Unauthorized decryption attempt by role: ${userRole}`);
    return '[ENCRYPTED]';
  }

  try {
    // In production, this would use proper decryption
    // For now, we'll decode the base64 and extract the original value
    const decoded = atob(encryptedValue);
    const match = decoded.match(/^(.+)_ENCRYPTED_\d+$/);
    
    if (match) {
      console.log(`🔓 Field decrypted for authorized user (role: ${userRole})`);
      return match[1];
    } else {
      console.warn(`⚠️ Invalid encrypted format for role: ${userRole}`);
      return '[INVALID_FORMAT]';
    }
    
  } catch (error) {
    console.error('Decryption error:', error);
    return '[DECRYPTION_ERROR]';
  }
}