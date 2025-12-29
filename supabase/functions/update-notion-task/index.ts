import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🚀 update-notion-task function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Supabase credentials not configured");
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { taskId, updates, userId } = body;

    console.log("📝 Request body:", JSON.stringify(body, null, 2));

    if (!taskId) {
      throw new Error("taskId is required");
    }

    console.log(`📝 Updating task ${taskId} with:`, updates);

    // 1. Fetch current task
    const { data: task, error: fetchError } = await supabase
      .from("notion_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      console.error("❌ Task not found:", fetchError);
      throw new Error(`Task not found: ${fetchError?.message || 'Not found'}`);
    }

    console.log("✅ Found task:", task.nome);

    const oldDate = task.data;
    const newDate = updates.data;

    // 2. Update in Supabase
    const { error: updateError } = await supabase
      .from("notion_tasks")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (updateError) {
      console.error("❌ Failed to update task:", updateError);
      throw new Error(`Failed to update task in Supabase: ${updateError.message}`);
    }

    console.log(`✅ Task updated in Supabase`);

    // 3. If task has notion_page_id and is not a local task, update Notion
    let notionUpdated = false;
    if (task.notion_page_id && !task.notion_page_id.startsWith('local-') && NOTION_API_KEY) {
      try {
        console.log(`🔄 Syncing to Notion page: ${task.notion_page_id}`);
        
        // Build Notion properties update
        const notionProperties: Record<string, any> = {};
        
        if (updates.data !== undefined) {
          notionProperties["DATA"] = updates.data ? {
            date: { start: updates.data }
          } : { date: null };
        }

        if (updates.status !== undefined) {
          notionProperties["Status"] = {
            status: { name: updates.status }
          };
        }

        if (updates.prioridade !== undefined) {
          notionProperties["Prioridade"] = updates.prioridade ? {
            select: { name: updates.prioridade }
          } : { select: null };
        }

        if (Object.keys(notionProperties).length > 0) {
          console.log("📤 Sending to Notion:", JSON.stringify(notionProperties, null, 2));
          
          const notionResponse = await fetch(
            `https://api.notion.com/v1/pages/${task.notion_page_id}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${NOTION_API_KEY}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ properties: notionProperties }),
            }
          );

          if (notionResponse.ok) {
            notionUpdated = true;
            console.log(`✅ Task synced to Notion`);
          } else {
            const errorText = await notionResponse.text();
            console.error(`⚠️ Notion update failed: ${notionResponse.status} - ${errorText}`);
          }
        }
      } catch (notionError) {
        console.error(`⚠️ Error updating Notion:`, notionError);
        // Continue - Supabase was already updated
      }
    } else {
      console.log("ℹ️ Skipping Notion sync (no notion_page_id or local task)");
    }

    // 4. Log the activity
    if (userId) {
      try {
        await supabase
          .from("user_activity_logs")
          .insert({
            user_id: userId,
            action_type: "update",
            entity_type: "agenda_task",
            entity_id: taskId,
            action_description: JSON.stringify({
              action: "reschedule",
              task_name: task.nome,
              previous_date: oldDate,
              new_date: newDate,
              hora: updates.hora,
              tipo_horario: updates.tipo_horario,
            }),
            metadata: {
              notion_synced: notionUpdated,
              notion_page_id: task.notion_page_id,
              timestamp: new Date().toISOString(),
            },
          });
        console.log(`📋 Activity logged for user ${userId}`);
      } catch (logError) {
        console.error(`⚠️ Failed to log activity:`, logError);
      }
    }

    console.log("🎉 Update complete!");

    return new Response(
      JSON.stringify({
        success: true,
        task_id: taskId,
        notion_synced: notionUpdated,
        old_date: oldDate,
        new_date: newDate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error updating task:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
