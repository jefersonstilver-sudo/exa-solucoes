import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Notion Database ID para "Próximas tarefas"
const NOTION_DATABASE_ID = "248f9e038d818097a2beeaf278a69d51";

interface NotionTask {
  notion_page_id: string;
  nome: string;
  prioridade: string | null;
  status: string | null;
  responsavel: string | null;
  responsavel_avatar: string | null;
  data: string | null;
  finalizado_por: string | null;
  categoria: string | null;
  descricao: string | null;
  notion_last_edited_time: string | null;
  notion_created_time: string | null;
  notion_url: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create sync log
    const { data: logData, error: logError } = await supabase
      .from("notion_task_sync_logs")
      .insert({ status: "running" })
      .select()
      .single();

    if (logError) {
      console.error("Error creating sync log:", logError);
    } else {
      logId = logData.id;
    }

    const body = await req.json().catch(() => ({}));
    const force = body.force === true;

    console.log(`🔄 Starting Notion Tasks sync... (force: ${force})`);

    // Fetch all pages from Notion database
    let allPages: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const notionResponse = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_cursor: startCursor,
            page_size: 100,
          }),
        }
      );

      if (!notionResponse.ok) {
        const errorText = await notionResponse.text();
        throw new Error(`Notion API error: ${notionResponse.status} - ${errorText}`);
      }

      const data = await notionResponse.json();
      allPages = [...allPages, ...data.results];
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    console.log(`📦 Found ${allPages.length} tasks in Notion`);

    let tasksCreated = 0;
    let tasksUpdated = 0;
    const errors: any[] = [];

    for (const page of allPages) {
      try {
        const props = page.properties;
        
        // Extract task data from Notion properties
        const task: NotionTask = {
          notion_page_id: page.id,
          nome: extractTitle(props.Nome || props.Name || props.name),
          prioridade: extractSelect(props.Prioridade || props.prioridade),
          status: extractStatus(props.Status || props.status),
          responsavel: extractPerson(props.Responsável || props.Responsavel || props.responsavel),
          responsavel_avatar: extractPersonAvatar(props.Responsável || props.Responsavel || props.responsavel),
          data: extractDate(props.DATA || props.Data || props.data),
          finalizado_por: extractPerson(props["Finalizado por"] || props.finalizado_por),
          categoria: extractSelect(props.Categoria || props.categoria),
          descricao: extractRichText(props.Descrição || props.Descricao || props.descricao),
          notion_last_edited_time: page.last_edited_time,
          notion_created_time: page.created_time,
          notion_url: page.url,
        };

        // Skip tasks without a name
        if (!task.nome) {
          console.log(`⚠️ Skipping task without name: ${page.id}`);
          continue;
        }

        // Check if task exists
        const { data: existing } = await supabase
          .from("notion_tasks")
          .select("id, notion_last_edited_time")
          .eq("notion_page_id", task.notion_page_id)
          .single();

        if (existing) {
          // Update if changed or force
          const shouldUpdate = force || 
            existing.notion_last_edited_time !== task.notion_last_edited_time;

          if (shouldUpdate) {
            const { error: updateError } = await supabase
              .from("notion_tasks")
              .update({
                ...task,
                updated_at: new Date().toISOString(),
              })
              .eq("notion_page_id", task.notion_page_id);

            if (updateError) {
              errors.push({ page_id: task.notion_page_id, error: updateError.message });
            } else {
              tasksUpdated++;
            }
          }
        } else {
          // Create new task
          const { error: insertError } = await supabase
            .from("notion_tasks")
            .insert(task);

          if (insertError) {
            errors.push({ page_id: task.notion_page_id, error: insertError.message });
          } else {
            tasksCreated++;
          }
        }
      } catch (pageError: any) {
        errors.push({ page_id: page.id, error: pageError.message });
      }
    }

    const durationMs = Date.now() - startTime;

    // Update sync log
    if (logId) {
      await supabase
        .from("notion_task_sync_logs")
        .update({
          sync_completed_at: new Date().toISOString(),
          status: errors.length > 0 ? "partial" : "success",
          tasks_created: tasksCreated,
          tasks_updated: tasksUpdated,
          errors: errors.length > 0 ? errors : null,
          duration_ms: durationMs,
          details: { total_from_notion: allPages.length },
        })
        .eq("id", logId);
    }

    console.log(`✅ Sync completed: ${tasksCreated} created, ${tasksUpdated} updated, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          created: tasksCreated,
          updated: tasksUpdated,
          total: allPages.length,
          errors: errors.length,
        },
        duration_ms: durationMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Sync error:", error);

    // Update log with error
    if (logId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase
        .from("notion_task_sync_logs")
        .update({
          sync_completed_at: new Date().toISOString(),
          status: "error",
          errors: [{ message: error.message }],
          duration_ms: Date.now() - startTime,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions to extract Notion property values
function extractTitle(prop: any): string {
  if (!prop?.title) return "";
  return prop.title.map((t: any) => t.plain_text).join("") || "";
}

function extractSelect(prop: any): string | null {
  return prop?.select?.name || null;
}

function extractStatus(prop: any): string | null {
  return prop?.status?.name || prop?.select?.name || null;
}

function extractPerson(prop: any): string | null {
  if (!prop?.people || prop.people.length === 0) return null;
  return prop.people[0]?.name || null;
}

function extractPersonAvatar(prop: any): string | null {
  if (!prop?.people || prop.people.length === 0) return null;
  return prop.people[0]?.avatar_url || null;
}

function extractDate(prop: any): string | null {
  return prop?.date?.start || null;
}

function extractRichText(prop: any): string | null {
  if (!prop?.rich_text) return null;
  return prop.rich_text.map((t: any) => t.plain_text).join("") || null;
}
