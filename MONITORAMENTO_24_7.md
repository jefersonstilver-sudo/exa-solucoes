# 🤖 Monitoramento 24/7 de Painéis - Configuração

## ✅ Sistema Implementado

O sistema de monitoramento automático foi implementado com sucesso! Agora você tem:

### 📦 Componentes Criados

1. **Edge Function: `monitor-panels`**
   - Verifica status de todos os painéis a cada execução
   - Detecta mudanças de status (online → offline e vice-versa)
   - Cria alertas automáticos no banco de dados
   - Registra histórico completo de eventos

2. **Edge Function: `setup-panel-monitoring-cron`**
   - Fornece SQL para configurar cron jobs
   - Acesse via: `https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/setup-panel-monitoring-cron`

3. **Tabela: `panel_alerts`**
   - Armazena todos os alertas de painéis
   - Campos: tipo, severidade, mensagem, metadata, status de resolução

4. **Tabela: `panel_monitoring_config`**
   - Configurações globais do monitoramento
   - Intervalo de verificação, threshold de offline, emails de alerta

5. **Hook: `useDevices` (atualizado)**
   - Força sincronização ao abrir a página
   - Mostra indicador de "sincronizando..."
   - Polling a cada 4 segundos quando página aberta

---

## 🚀 Como Ativar o Monitoramento Automático

### Passo 1: Executar SQL para Criar Cron Jobs

Acesse o **Supabase SQL Editor** e execute o seguinte SQL:

```sql
-- Remover jobs existentes se houver
SELECT cron.unschedule('sync-anydesk-monitor');
SELECT cron.unschedule('monitor-panels-check');

-- Job 1: Sincronizar AnyDesk a cada 1 minuto
SELECT cron.schedule(
  'sync-anydesk-monitor',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-anydesk',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
  ) as request_id;
  $$
);

-- Job 2: Monitorar painéis a cada 1 minuto
SELECT cron.schedule(
  'monitor-panels-check',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/monitor-panels',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
  ) as request_id;
  $$
);
```

### Passo 2: Verificar se os Jobs Estão Rodando

Execute este SQL para ver os jobs ativos:

```sql
SELECT * FROM cron.job ORDER BY jobname;
```

Você deve ver:
- `sync-anydesk-monitor`
- `monitor-panels-check`

### Passo 3: Monitorar os Logs

```sql
-- Ver últimas execuções dos jobs
SELECT * FROM cron.job_run_details 
WHERE jobname IN ('sync-anydesk-monitor', 'monitor-panels-check')
ORDER BY start_time DESC 
LIMIT 20;
```

### Passo 4: Verificar Alertas Criados

```sql
-- Ver alertas recentes
SELECT 
  pa.created_at,
  pa.alert_type,
  pa.severity,
  pa.message,
  d.name as device_name,
  pa.resolved
FROM panel_alerts pa
JOIN devices d ON d.id = pa.device_id
ORDER BY pa.created_at DESC
LIMIT 50;
```

---

## 📊 Como Funciona

### Fluxo de Monitoramento

1. **A cada 1 minuto:**
   - `sync-anydesk` busca status atualizado de todos os painéis no AnyDesk
   - Atualiza tabela `devices` com informações de conexão

2. **Logo em seguida:**
   - `monitor-panels` verifica status de todos os dispositivos
   - Compara status atual vs anterior
   - Detecta mudanças (online → offline ou offline → online)

3. **Quando detecta offline:**
   - Cria alerta com severidade `high`
   - Atualiza status do dispositivo para `offline`
   - Registra metadata completa (tempo offline, último online, etc)
   - TODO: Envia email/notificação

4. **Quando painel volta online:**
   - Resolve alertas anteriores
   - Cria alerta de recuperação (severidade `low`)
   - Atualiza status do dispositivo para `online`

---

## 🎯 Benefícios Implementados

✅ **Monitoramento 24/7** - Funciona mesmo com navegador fechado  
✅ **Detecção automática de quedas** - Identifica offline em até 1 minuto  
✅ **Histórico completo** - Todos os eventos são registrados  
✅ **Sincronização forçada** - Dados frescos ao abrir a página  
✅ **Polling inteligente** - Atualização a cada 4 segundos quando página aberta  
✅ **Sistema de alertas** - Base pronta para emails/notificações  

---

## 🔧 Próximos Passos (Opcionais)

### 1. Adicionar Notificações por Email
- Criar edge function de envio de email
- Integrar com `monitor-panels` para enviar alerta quando painel cair

### 2. Dashboard de Uptime
- Criar página mostrando histórico de uptime por painel
- Gráficos de disponibilidade (99.9%, 99%, etc)

### 3. Integração com WhatsApp/Telegram
- Notificações instantâneas via Z-API quando painel cair
- Comandos para verificar status via bot

### 4. Relatórios Automáticos
- Email semanal com estatísticas de uptime
- Lista de painéis mais problemáticos

---

## 📝 Configurações Avançadas

### Alterar Intervalo de Verificação

```sql
UPDATE panel_monitoring_config
SET check_interval_seconds = 60  -- 60 segundos = 1 minuto
WHERE id = (SELECT id FROM panel_monitoring_config LIMIT 1);
```

### Alterar Threshold de Offline

```sql
UPDATE panel_monitoring_config
SET offline_threshold_seconds = 180  -- 3 minutos (padrão é 5)
WHERE id = (SELECT id FROM panel_monitoring_config LIMIT 1);
```

### Configurar Email de Alertas

```sql
UPDATE panel_monitoring_config
SET alert_email = 'seu-email@exemplo.com'
WHERE id = (SELECT id FROM panel_monitoring_config LIMIT 1);
```

---

## 🐛 Troubleshooting

### Os jobs não estão executando?

1. Verifique se `pg_cron` e `pg_net` estão habilitados:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

2. Verifique permissões do service role key

3. Veja logs de erro:
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Alertas não estão sendo criados?

1. Execute manualmente o monitor-panels:
```bash
curl -X POST https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/monitor-panels \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"
```

2. Verifique os logs da edge function no Supabase Dashboard

---

## 📞 Suporte

Para questões ou problemas, consulte:
- Logs do Supabase: Dashboard > Edge Functions > Logs
- Cron Jobs: Dashboard > Database > Cron Jobs
- Documentação: https://supabase.com/docs/guides/functions/schedule-functions