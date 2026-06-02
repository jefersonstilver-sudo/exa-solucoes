// Evolution API secure proxy.
// - Requires authenticated Supabase JWT
// - Requires role super_admin or admin
// - Whitelists allowed path prefixes and methods
// - Never exposes EVOLUTION_API_URL/KEY to client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);
const ALLOWED_PREFIXES = [
  "/instance",
  "/message",
  "/chat",
  "/group",
  "/webhook",
  "/settings",
  "/profile",
];
const MAX_BODY_BYTES = 100_000;

// In-memory rate limit per user (best-effort; resets on cold start)
const rate = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 30;

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return json(500, { error: "Evolution API not configured" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Unauthorized" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth
      .getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json(401, { error: "Invalid token" });
    }
    const userId = claimsData.claims.sub as string;

    // Role check: super_admin or admin
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roles, error: rolesError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesError) {
      return json(500, { error: "Role lookup failed" });
    }
    const roleSet = new Set((roles ?? []).map((r: any) => r.role));
    if (!roleSet.has("super_admin") && !roleSet.has("admin")) {
      return json(403, { error: "Forbidden" });
    }

    // Rate limit
    const now = Date.now();
    const slot = rate.get(userId);
    if (!slot || slot.reset < now) {
      rate.set(userId, { count: 1, reset: now + RATE_WINDOW_MS });
    } else {
      slot.count++;
      if (slot.count > RATE_MAX) {
        return json(429, { error: "Rate limit exceeded" });
      }
    }

    // Parse body
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json(413, { error: "Payload too large" });
    }
    let parsed: any;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const path = String(parsed.path ?? "");
    const method = String(parsed.method ?? "GET").toUpperCase();
    const body = parsed.body;

    if (!path.startsWith("/") || path.includes("..") || path.includes("://")) {
      return json(400, { error: "Invalid path" });
    }
    if (!ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
      return json(400, { error: "Path not allowed" });
    }
    if (!ALLOWED_METHODS.has(method)) {
      return json(400, { error: "Method not allowed" });
    }

    const targetUrl = EVOLUTION_API_URL.replace(/\/+$/, "") + path;
    const init: RequestInit = {
      method,
      headers: {
        apikey: EVOLUTION_API_KEY,
        "Content-Type": "application/json",
      },
    };
    if (body !== undefined && method !== "GET") {
      init.body = JSON.stringify(body);
    }

    const upstream = await fetch(targetUrl, init);
    const text = await upstream.text();
    let payload: unknown = text;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      /* keep raw text */
    }

    return new Response(
      JSON.stringify({ status: upstream.status, data: payload }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[evolution-proxy] error", (err as Error).message);
    return json(500, { error: "Internal error" });
  }
});
