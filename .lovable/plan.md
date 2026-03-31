

# Plano: Criar cron job para ativar os lembretes de tarefas

## Problema
A edge function `task-reminder-scheduler` nunca foi invocada — 0 logs, 0 execuções. Não existe cron job no `pg_cron` para chamá-la. Os lembretes (30min, 1dia, 1semana) estão configurados corretamente no banco mas nunca são processados.

## Correção
Executar via SQL (insert tool) a criação do cron job que chama a função a cada 2 minutos:

```sql
SELECT cron.schedule(
  'task-reminder-scheduler-cron',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url:='https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/task-reminder-scheduler',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

Roda a cada 2 minutos — com a janela de tolerância de 5 minutos já implementada no código, nenhum lembrete será perdido.

## Como funciona o fluxo completo
1. Cron chama a function a cada 2 min
2. Function busca tarefas pendentes com `horario_inicio`
3. Busca `task_reminders` ativos com `fired_at = null`
4. Calcula `minutesUntilTask` vs `reminderMinutes` (ex: 30min, 1440min para 1 dia, 10080min para 1 semana)
5. Se está dentro da janela de tolerância → envia WhatsApp via `zapi-send-message`
6. Marca `fired_at` no reminder para não reenviar

## O que NÃO muda
- Nenhum código, nenhuma UI, nenhuma outra funcionalidade

