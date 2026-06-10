import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const { data, error } = await supabase
  .from("evolution_logs")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(10);

if (error) {
  console.error("Error fetching logs:", error);
} else {
  console.log("Recent Evolution Logs:");
  console.log(JSON.stringify(data, null, 2));
}

const { data: agentLogs, error: agentErr } = await supabase
  .from("agent_logs")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(10);

if (agentErr) {
    console.error("Error fetching agent logs:", agentErr);
} else {
    console.log("Recent Agent Logs:");
    console.log(JSON.stringify(agentLogs, null, 2));
}
