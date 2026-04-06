import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Verify admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (!roleData) {
      // Fallback: check users table
      const { data: userData } = await adminClient
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!userData || !["admin", "super_admin"].includes(userData.role)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse body
    const { pedido_id, is_master } = await req.json();

    if (!pedido_id || typeof is_master !== "boolean") {
      return new Response(
        JSON.stringify({ error: "pedido_id (string) e is_master (boolean) são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update pedido
    const { data: updatedOrder, error: updateError } = await adminClient
      .from("pedidos")
      .update({ is_master })
      .eq("id", pedido_id)
      .select("id, is_master")
      .single();

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log activity
    await adminClient.from("user_activity_logs").insert({
      user_id: userId,
      action_type: is_master ? "activate_master" : "deactivate_master",
      entity_type: "pedido",
      entity_id: pedido_id,
      action_description: is_master
        ? "Pedido marcado como MASTER (auto-aprovação de vídeos)"
        : "Pedido removido do modo MASTER",
      metadata: {
        is_master,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`✅ Pedido ${pedido_id} is_master=${is_master} por user ${userId}`);

    return new Response(JSON.stringify({ success: true, data: updatedOrder }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro no toggle-pedido-master:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
