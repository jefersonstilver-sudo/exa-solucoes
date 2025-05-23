
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Check if master admin exists in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }

    const masterUser = authUsers.users.find(user => user.email === 'jefersonstilver@gmail.com')
    
    if (!masterUser) {
      // Create the master admin user if it doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'jefersonstilver@gmail.com',
        password: '573039',
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          name: 'Jefferson Silver',
        },
      })

      if (createError) {
        throw createError
      }

      // Insert into users table
      const { error: userError } = await supabaseAdmin.rpc(
        'admin_insert_user',
        {
          user_id: newUser.user.id,
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
          action: 'created',
          user: { id: newUser.user.id, email: newUser.user.email }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      // User exists, let's update their password and confirm email
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        masterUser.id,
        {
          password: '573039',
          email_confirm: true,
          user_metadata: {
            role: 'super_admin',
            name: 'Jefferson Silver',
          },
        }
      )

      if (updateError) {
        throw updateError
      }

      // Ensure user exists in users table
      const { data: dbUser, error: dbCheckError } = await supabaseAdmin.rpc(
        'admin_check_user_exists',
        { user_email: 'jefersonstilver@gmail.com' }
      )

      if (dbCheckError) {
        throw dbCheckError
      }

      if (!dbUser) {
        // Insert into users table if not exists
        const { error: userError } = await supabaseAdmin.rpc(
          'admin_insert_user',
          {
            user_id: masterUser.id,
            user_email: 'jefersonstilver@gmail.com',
            user_role: 'super_admin'
          }
        )

        if (userError) {
          throw userError
        }
      }

      return new Response(
        JSON.stringify({
          message: 'Master admin user updated successfully',
          action: 'updated',
          user: { id: updatedUser.user.id, email: updatedUser.user.email },
          confirmed: updatedUser.user.email_confirmed_at ? true : false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
  } catch (error) {
    console.error('Error fixing master admin:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
