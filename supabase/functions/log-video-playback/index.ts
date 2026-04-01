import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PlaybackLog {
  video_id: string;
  building_id: string;
  pedido_id?: string;
  duration_seconds: number;
  started_at: string;
}

function validateLog(log: unknown): log is PlaybackLog {
  if (!log || typeof log !== "object") return false;
  const l = log as Record<string, unknown>;
  if (typeof l.video_id !== "string" || !UUID_REGEX.test(l.video_id)) return false;
  if (typeof l.building_id !== "string" || !UUID_REGEX.test(l.building_id)) return false;
  if (l.pedido_id !== undefined && l.pedido_id !== null && (typeof l.pedido_id !== "string" || !UUID_REGEX.test(l.pedido_id))) return false;
  if (typeof l.duration_seconds !== "number" || l.duration_seconds < 0 || l.duration_seconds > 86400) return false;
  if (typeof l.started_at !== "string") return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const logs: unknown[] = body?.logs;

    if (!Array.isArray(logs) || logs.length === 0) {
      return new Response(JSON.stringify({ error: "logs array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (logs.length > 100) {
      return new Response(JSON.stringify({ error: "max 100 logs per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validLogs: PlaybackLog[] = [];
    for (const log of logs) {
      if (validateLog(log)) {
        validLogs.push(log);
      }
    }

    if (validLogs.length === 0) {
      return new Response(JSON.stringify({ error: "no valid logs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const rows = validLogs.map((l) => ({
      video_id: l.video_id,
      building_id: l.building_id,
      pedido_id: l.pedido_id || null,
      duration_seconds: l.duration_seconds,
      started_at: l.started_at,
    }));

    const { error } = await supabaseAdmin
      .from("video_playback_logs")
      .insert(rows);

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "insert failed", detail: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, inserted: validLogs.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
