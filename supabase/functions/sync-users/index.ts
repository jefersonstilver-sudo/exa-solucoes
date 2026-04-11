
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get all users from auth schema
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }

    // Get existing user IDs from public users table using our security definer function
    // This bypasses RLS policies
    const { data: existingUserIds, error: idsError } = await supabaseAdmin.rpc(
      'admin_get_all_user_ids'
    )
    
    if (idsError) {
      throw idsError
    }
    
    // Convert to a Set for easy lookup
    const existingIds = new Set(existingUserIds || [])
    
    // Find users to create (in auth.users but not in public.users)
    const usersToCreate = authUsers.users.filter(user => !existingIds.has(user.id))
    
    if (usersToCreate.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All users are already synchronized',
          syncedCount: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    // Use our security definer function to insert users safely
    let syncedCount = 0
    for (const user of usersToCreate) {
      const role = user.user_metadata?.role || 'client'
      
      const { error: insertError } = await supabaseAdmin.rpc(
        'admin_insert_user',
        {
          user_id: user.id,
          user_email: user.email || '',
          user_role: role
        }
      )
      
      if (!insertError) {
        syncedCount++
      } else {
        console.error('Error inserting user:', user.id, insertError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synchronized ${syncedCount} users`,
        syncedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error syncing users:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        syncedCount: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
