import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting session cleanup...')

    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        terminated_at: new Date().toISOString(),
        terminated_by: null,
      })
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())
      .select()

    if (error) {
      console.error('Error cleaning up sessions:', error)
      throw error
    }

    const deletedCount = data?.length || 0
    console.log(`Successfully deleted ${deletedCount} expired sessions`)

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        message: `Deleted ${deletedCount} expired sessions`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
