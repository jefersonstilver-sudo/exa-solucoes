import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const { data: instances, error } = await supabase
  .from("evolution_instances")
  .select("*");

if (error) {
  console.error("Error fetching instances:", error);
} else {
  console.log("Evolution Instances:");
  console.log(JSON.stringify(instances, null, 2));
}

const { data: queue, error: qErr } = await supabase
  .from("task_notification_queue")
  .select("*")
  .neq("status", "resolved")
  .order("created_at", { ascending: false })
  .limit(5);

if (qErr) {
    console.error("Error fetching queue:", qErr);
} else {
    console.log("Active Task Notifications:");
    console.log(JSON.stringify(queue, null, 2));
}
