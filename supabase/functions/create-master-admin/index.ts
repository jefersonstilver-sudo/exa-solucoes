
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    // Check if master admin already exists using direct SQL query
    // This avoids potential RLS recursion issues
    const { data: existingUser, error: checkError } = await supabaseAdmin.rpc(
      'admin_check_user_exists',
      { user_email: 'jefersonstilver@gmail.com' }
    )

    if (checkError) {
      throw checkError
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({
          message: 'Master admin already exists',
          user: existingUser,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Create the master admin user
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'jefersonstilver@gmail.com',
      password: '573039',
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        name: 'Jeferson Stilver',
      },
    })

    if (createError) {
      throw createError
    }

    // Insert the user role directly using our security definer function to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin.rpc(
      'admin_insert_user',
      {
        user_id: authUser.user.id,
        user_email: 'jefersonstilver@gmail.com',
        user_role: 'super_admin'
      }
    )

    if (userError) {
      throw userError
    }

    return new Response(
      JSON.stringify({
        message: 'Master admin user created successfully',
        user: userData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating master admin:', error)
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
