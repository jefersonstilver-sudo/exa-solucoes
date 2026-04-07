import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if request is a POST to update the version
    if (req.method === "POST") {
      const body = await req.json();
      const newVersion = body?.version;

      if (!newVersion) {
        return new Response(
          JSON.stringify({ error: "Missing version in body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("app_config")
        .upsert(
          { key: "current_build_timestamp", value: String(newVersion), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, version: String(newVersion) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET: return current version
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "current_build_timestamp")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ version: data?.value || "0" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-app-version error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
