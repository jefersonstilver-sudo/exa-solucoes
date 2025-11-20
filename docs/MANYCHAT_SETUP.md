# Configuração do ManyChat - Guia Completo

## 📋 Pré-requisitos

1. Conta no ManyChat ativa
2. Número de telefone configurado no ManyChat
3. Acesso ao painel administrativo do Supabase

## 🔑 Passo 1: Obter API Key do ManyChat

1. Acesse o [ManyChat](https://manychat.com)
2. Faça login na sua conta
3. Vá em **Settings** → **API**
4. Clique em **Generate New API Key**
5. Copie a API Key gerada (você precisará dela no próximo passo)

## 🔐 Passo 2: Configurar Secrets no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Edge Functions** → **Secrets**
4. Adicione as seguintes variáveis:

```
MANYCHAT_API_KEY=<sua-api-key-aqui>
MANYCHAT_SYNC_SECRET=<gere-um-token-secreto-qualquer>
```

**Importante**: O `MANYCHAT_SYNC_SECRET` é usado para validar webhooks. Gere uma string aleatória segura.

## 🔗 Passo 3: Configurar Webhook no ManyChat

### 3.1 Obter URL do Webhook

A URL do webhook será:
```
https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/eduardo
```

### 3.2 Configurar no ManyChat

1. No painel do ManyChat, vá em **Settings** → **Integrations**
2. Selecione **Webhooks**
3. Clique em **Add Webhook**
4. Configure:
   - **Name**: Eduardo Commercial Webhook
   - **URL**: Cole a URL do webhook acima
   - **Events**: Selecione:
     - ✅ Message Received
     - ✅ Conversation Started
     - ✅ User Updated
   - **Secret**: Cole o valor de `MANYCHAT_SYNC_SECRET`
5. Clique em **Save**

## 📱 Passo 4: Configurar Número do Eduardo

O número comercial do Eduardo já está configurado no banco de dados:

```
+5545991415856
```

Este número está associado ao agente "Eduardo" no sistema e receberá todas as mensagens do ManyChat.

## ✅ Passo 5: Testar Conexão

1. No painel de **IA & Monitoramento** → **Agentes**
2. Clique na aba **APIs**
3. Clique em **Testar Todas** ou teste individualmente o "ManyChat Webhook"
4. Você deve ver:
   - Status: **🟢 Online**
   - Informações da página conectada
   - Agentes conectados

## 🔄 Sincronização de Conversas

Para sincronizar conversas do ManyChat:

1. Vá em **IA & Monitoramento** → **Conversas**
2. Clique em **Sincronizar ManyChat**
3. O sistema irá:
   - Buscar todos os subscribers do número do Eduardo
   - Criar/atualizar conversas no banco de dados
   - Analisar automaticamente para identificar leads e síndicos
   - Calcular métricas e estatísticas

## 📊 Análise Automática

O sistema analisa automaticamente cada conversa para:

### 1. Identificar Tipo
- **Lead**: Pessoas interessadas nos serviços
- **Síndico**: Síndicos de condomínios
- **Geral**: Outros tipos de contato

### 2. Classificar Oportunidades
- **Oportunidade**: Conversas com alto potencial de conversão
- Tags do ManyChat são usadas para classificação
- Custom fields são analisados

### 3. Calcular Métricas
- Total de conversas
- Taxa de conversão
- Distribuição por tipo
- Conversas ativas vs inativas

## 🚨 Troubleshooting

### Erro: "ManyChat credentials not configured"
**Solução**: Verifique se `MANYCHAT_API_KEY` foi adicionado corretamente nos secrets do Supabase.

### Erro: "Failed to connect to ManyChat API"
**Soluções**:
1. Verifique se a API Key está válida
2. Confirme que sua conta ManyChat está ativa
3. Verifique se você tem permissões de API habilitadas

### Webhook não recebe mensagens
**Soluções**:
1. Verifique se a URL do webhook está correta
2. Confirme que os eventos corretos foram selecionados
3. Teste o webhook usando a ferramenta de teste do ManyChat
4. Verifique os logs da edge function: `supabase functions logs webhook-manychat`

### Conversas não aparecem no dashboard
**Soluções**:
1. Clique em "Sincronizar ManyChat" manualmente
2. Verifique os logs da edge function: `supabase functions logs manychat-sync-conversations`
3. Confirme que o número do Eduardo está correto no banco de dados

## 📝 Logs e Monitoramento

Todos as requisições à API do ManyChat são registradas na tabela `api_logs`:

```sql
SELECT * FROM api_logs 
WHERE api_name = 'ManyChat API' 
ORDER BY created_at DESC 
LIMIT 10;
```

Você pode visualizar:
- Endpoint chamado
- Status code da resposta
- Tempo de resposta
- Sucesso/Erro
- Payload da requisição
- Dados da resposta

## 🔐 Segurança

- ✅ API Keys são armazenadas como secrets no Supabase
- ✅ Nunca são expostas no frontend
- ✅ Webhooks validam assinatura usando `MANYCHAT_SYNC_SECRET`
- ✅ RLS (Row Level Security) protege dados sensíveis
- ✅ Logs de auditoria de todas as requisições

## 📚 Referências

- [ManyChat API Documentation](https://manychat.github.io/api-docs/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Webhook Best Practices](https://manychat.github.io/api-docs/#webhooks)

---

**Última atualização**: 20/11/2025
**Versão**: 1.0