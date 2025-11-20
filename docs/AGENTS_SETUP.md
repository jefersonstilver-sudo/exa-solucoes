# Sistema de Agentes EXA - Configuração

## Visão Geral

Sistema unificado de agentes inteligentes com roteamento automático, integração ManyChat/WhatsApp e base de conhecimento.

## Pré-requisitos

### Variáveis de Ambiente Necessárias

Configure no Supabase Dashboard → Settings → Edge Functions → Secrets:

#### ManyChat
- `MANYCHAT_API_KEY` - Chave de API do ManyChat
- `MANYCHAT_SYNC_SECRET` - Secret para validação de webhook

#### WhatsApp
- `WHATSAPP_API_KEY` - Chave da API WhatsApp Business
- `WHATSAPP_PHONE_NUMBER_ID` - ID do número de telefone
- `WHATSAPP_API_URL` - URL base (ex: https://graph.facebook.com/v18.0)

#### OpenAI
- `OPENAI_API_KEY` - Chave da API OpenAI (para Console IA)

## Estrutura de Dados

### Tabelas Criadas
- `agents` - Configuração dos 4 agentes
- `agent_logs` - Logs de roteamento e ações
- `knowledge_base` - Documentos indexados

### Agentes Configurados

1. **Sofia** (AI - Vendas/Leads)
   - Qualifica leads com score [0-100]
   - Notifica Eduardo se score >= 75
   - Palavras-chave: quero, comprar, preço, cotação, interessado

2. **IRIS** (AI - Diretoria/BI)
   - Fornece relatórios executivos
   - Responde consultas de gestão
   - Palavras-chave: relatório, clientes, prédio, venda

3. **EXA Alert** (Notification - Alertas)
   - Classifica severidade de incidentes
   - Notifica diretores em casos críticos
   - Palavras-chave: painel, offline, queda, screen

4. **Eduardo** (Human - Comercial)
   - WhatsApp: +5545991415856
   - Recebe notificações de leads quentes (score >= 75)

## Como Adicionar Secrets

1. Acessar Supabase Dashboard
2. Settings → Edge Functions → Secrets
3. Adicionar cada variável com seu valor
4. Redeploy edge functions:
   ```bash
   supabase functions deploy route-message
   supabase functions deploy webhook-manychat
   supabase functions deploy ia-console
   ```

## Testes

### Testar Roteamento
```bash
curl -X POST https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/route-message \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Quero comprar painel", "conversationId": "test-123"}'
```

### Verificar Logs
```sql
SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT 100;
SELECT key, display_name, type, is_active FROM agents;
```

## Placeholders

Se variáveis não configuradas:
- UI exibe avisos amarelos com instruções
- Notificações ficam "pending" no DB
- Logs registram "PLACEHOLDER" nos console.log
- Nenhuma chamada externa real é feita

## Rollback

Em caso de problemas:
```sql
UPDATE agents SET is_active = false;
```
