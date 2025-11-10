import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelResult {
  success: boolean;
  cancelled_count: number;
  cancelled_orders: string[];
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Auto-cancel orders function initiated');

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔍 Searching for orders pending for more than 48 hours...');

    // Calculate the cutoff time (48 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 48);
    const cutoffIso = cutoffTime.toISOString();

    console.log(`📅 Cutoff time: ${cutoffIso}`);

    // Find orders that are pending and older than 48 hours
    const { data: pendingOrders, error: fetchError } = await supabase
      .from('pedidos')
      .select('id, created_at, client_id, valor_total')
      .eq('status', 'pendente')
      .lt('created_at', cutoffIso);

    if (fetchError) {
      console.error('❌ Error fetching pending orders:', fetchError);
      throw fetchError;
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('✅ No orders to cancel');
      return new Response(
        JSON.stringify({
          success: true,
          cancelled_count: 0,
          cancelled_orders: [],
          errors: [],
          message: 'No orders pending for more than 48 hours'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`📦 Found ${pendingOrders.length} orders to cancel`);

    const result: CancelResult = {
      success: true,
      cancelled_count: 0,
      cancelled_orders: [],
      errors: []
    };

    // Cancel each order
    for (const order of pendingOrders) {
      try {
        console.log(`🚫 Cancelling order ${order.id.substring(0, 8)}...`);

        const { error: updateError } = await supabase
          .from('pedidos')
          .update({
            status: 'cancelado_automaticamente',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`❌ Error cancelling order ${order.id}:`, updateError);
          result.errors.push(`Order ${order.id}: ${updateError.message}`);
          result.success = false;
        } else {
          console.log(`✅ Order ${order.id.substring(0, 8)} cancelled successfully`);
          result.cancelled_count++;
          result.cancelled_orders.push(order.id);

          // Log the cancellation in audit trail (if table exists)
          try {
            await supabase.from('audit_logs').insert({
              action: 'auto_cancel_order',
              table_name: 'pedidos',
              record_id: order.id,
              old_data: { status: 'pendente' },
              new_data: { status: 'cancelado_automaticamente' },
              user_id: order.client_id,
              metadata: {
                reason: 'Pedido não pago em 48 horas',
                cancelled_at: new Date().toISOString(),
                created_at: order.created_at,
                valor_total: order.valor_total
              }
            });
          } catch (auditError) {
            console.warn('⚠️ Could not log to audit_logs (table may not exist):', auditError);
          }
        }
      } catch (orderError) {
        console.error(`❌ Unexpected error processing order ${order.id}:`, orderError);
        result.errors.push(`Order ${order.id}: ${String(orderError)}`);
        result.success = false;
      }
    }

    console.log(`✨ Auto-cancel completed: ${result.cancelled_count}/${pendingOrders.length} orders cancelled`);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 207, // 207 = Multi-Status (partial success)
      }
    );

  } catch (error) {
    console.error('💥 Critical error in auto-cancel function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        cancelled_count: 0,
        cancelled_orders: [],
        errors: [String(error)],
        message: 'Critical error during auto-cancellation'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
