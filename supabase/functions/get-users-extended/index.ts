import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserExtendedData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  cpf?: string;
  email_confirmed_at?: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the calling user is a super_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin privileges
    const { data: userData, error: roleError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['super_admin', 'admin', 'admin_financeiro', 'admin_marketing'];
    
    if (roleError || !userData || !allowedRoles.includes(userData.role)) {
      console.error('Access denied:', { roleError, userRole: userData?.role });
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'userIds must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch fetch user data
    const usersData: UserExtendedData[] = [];

    for (const userId of userIds) {
      try {
        const { data: authUser, error: userError } = await supabaseClient.auth.admin.getUserById(userId);

        if (userError || !authUser.user) {
          console.warn(`Failed to fetch user ${userId}:`, userError);
          continue;
        }

        usersData.push({
          id: userId,
          email: authUser.user.email || '',
          name: authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || null,
          phone: authUser.user.user_metadata?.telefone || authUser.user.user_metadata?.phone || null,
          cpf: authUser.user.user_metadata?.cpf || null,
          email_confirmed_at: authUser.user.email_confirmed_at || null,
        });
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ users: usersData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
