/**
 * CRON JOB: Sincronização automática do AnyDesk a cada 4 segundos
 * 
 * Para configurar no Supabase:
 * 1. Via pg_cron (recomendado):
 *    SELECT cron.schedule(
 *      'anydesk-sync',
 *      '*/4 * * * * *',  // A cada 4 segundos
 *      $$ SELECT net.http_post(
 *        url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-anydesk',
 *        headers := jsonb_build_object(
 *          'Content-Type', 'application/json',
 *          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
 *        )
 *      ) $$
 *    );
 * 
 * 2. Via hook de tempo (alternativa):
 *    - Criar edge function separada que roda a cada X segundos
 *    - Usar Supabase Realtime + Database Triggers
 * 
 * 3. Via cliente (menos eficiente):
 *    - useEffect com setInterval no frontend
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function syncAnyDeskAutomatically() {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-anydesk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[CRON] Erro ao sincronizar AnyDesk:', await response.text());
      return;
    }

    const result = await response.json();
    console.log('[CRON] Sincronização automática concluída:', result.summary);
  } catch (error) {
    console.error('[CRON] Erro crítico na sincronização:', error);
  }
}
