

# Plano: Corrigir sistema de lembretes de tarefas (WhatsApp)

## Problemas encontrados

### 1. Sem cron job — função nunca é chamada (CAUSA PRINCIPAL)
A edge function `task-reminder-scheduler` **nunca foi invocada** (0 logs). Não existe nenhum cron job no `pg_cron` para chamá-la periodicamente. Os lembretes existem no banco mas ninguém os processa.

### 2. Colunas erradas no getRecipients
A função busca `recipient_phone` e `recipient_name` na tabela `task_read_receipts`, mas as colunas reais são `contact_phone` e `contact_name`. Mesmo que a função fosse chamada, ela não encontraria nenhum destinatário.

### 3. Match por minuto exato é frágil
A lógica `minutesUntilTask !== reminderMinutes` exige que o cron rode no minuto EXATO. Se o cron roda a cada 5min, pode perder lembretes. Precisa de uma janela de tolerância.

## Correções

### Arquivo: `supabase/functions/task-reminder-scheduler/index.ts`

1. **Corrigir colunas**: Trocar `recipient_phone` → `contact_phone` e `recipient_name` → `contact_name` na função `getRecipients`

2. **Adicionar janela de tolerância**: Mudar de match exato para `minutesUntilTask >= 0 && minutesUntilTask <= reminderMinutes && minutesUntilTask <= reminderMinutes + 5` (janela de 5 minutos)

3. **Atualizar CORS headers** para incluir headers da plataforma Supabase

### SQL: Criar cron job (via insert tool)
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
Roda a cada 2 minutos para não perder lembretes.

### O que NÃO muda
- UI dos lembretes (TaskRemindersPanel)
- Nenhuma outra página ou funcionalidade

