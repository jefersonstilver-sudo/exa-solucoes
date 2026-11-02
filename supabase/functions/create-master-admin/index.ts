import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DESATIVADA (02/11/2026): criava conta master com senha fixa no código. O código antigo foi removido
// (inclusive a senha). Contas de equipe são criadas por create-admin-account, só por super_admin.
serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ error: 'desativada' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
