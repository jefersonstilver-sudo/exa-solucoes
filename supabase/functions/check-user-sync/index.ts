
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

    // Check if the on_auth_user_created trigger exists
    const { data: triggerExists, error: triggerError } = await supabaseAdmin.rpc(
      'check_trigger_exists',
      { trigger_name: 'on_auth_user_created' }
    )

    if (triggerError) {
      throw new Error(`Error checking trigger: ${triggerError.message}`)
    }

    // If the trigger doesn't exist, create it
    if (!triggerExists) {
      // Create the handle_new_user function if it doesn't exist
      const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $$
      BEGIN
        INSERT INTO public.users (id, email, role)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'client'));
        
        RETURN NEW;
      END;
      $$;
      `

      await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSQL })

      // Create the trigger
      const createTriggerSQL = `
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `

      await supabaseAdmin.rpc('exec_sql', { sql: createTriggerSQL })
    }

    // Now perform manual sync for any users that may have been missed
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Error fetching auth users: ${authError.message}`)
    }

    // Get existing users from public.users
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('id')

    if (publicError) {
      throw new Error(`Error fetching public users: ${publicError.message}`)
    }

    // Create a set of existing user IDs for quick lookup
    const existingUserIds = new Set(publicUsers?.map((u) => u.id) || [])

    // Find users that need to be synced
    const usersToSync = authUsers.users
      .filter((authUser) => !existingUserIds.has(authUser.id))
      .map((authUser) => ({
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'client',
      }))

    if (usersToSync.length > 0) {
      // Insert the missing users
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert(usersToSync)

      if (insertError) {
        throw new Error(`Error syncing users: ${insertError.message}`)
      }
    }

    // Return the results
    return new Response(
      JSON.stringify({
        message: 'User synchronization check complete',
        synced_users: usersToSync.length,
        trigger_existed: triggerExists,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in check-user-sync:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
