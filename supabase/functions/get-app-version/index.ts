import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, cache-control, pragma",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const VERSION_QUERY_TIMEOUT_MS = 3500;

const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const timeoutSignal = AbortSignal.timeout(VERSION_QUERY_TIMEOUT_MS);
  return fetch(input, { ...init, signal: timeoutSignal });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { fetch: fetchWithTimeout },
    });

    // Check if request is a POST to update the version
    if (req.method === "POST") {
      const body = await req.json();
      const newVersion = body?.version;

      if (!newVersion) {
        return jsonResponse({ error: "Missing version in body" }, 400);
      }

      const { error } = await supabase
        .from("app_config")
        .upsert(
          { key: "current_build_timestamp", value: String(newVersion), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      return jsonResponse({ success: true, version: String(newVersion) });
    }

    // GET: return current version
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "current_build_timestamp")
      .single();

    if (error) {
      // Version checks must fail open. A transient PostgREST/origin outage must
      // never turn the pre-React cache check into an application boot failure.
      console.warn("get-app-version read unavailable:", error);
      return jsonResponse({ version: null, status: "temporarily_unavailable" });
    }

    return jsonResponse({ version: data?.value || "0" });
  } catch (err: any) {
    console.error("get-app-version error:", err);
    if (req.method === "GET") {
      return jsonResponse({ version: null, status: "temporarily_unavailable" });
    }

    const message = err instanceof Error ? err.message : "Version update failed";
    return jsonResponse({ error: message }, 503);
  }
});
