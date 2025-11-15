# Sistema de Emails - Documentação

## Visão Geral

O sistema de emails da plataforma utiliza a integração entre Supabase Auth e Resend.com através da edge function `unified-email-service`.

## Arquitetura

### Componentes Principais

1. **Supabase Auth** - Sistema de autenticação
2. **unified-email-service** (Edge Function) - Serviço centralizado de envio de emails
3. **Resend.com** - Provedor de envio de emails
4. **Auth Hook** - Webhook que conecta Supabase Auth à edge function

## Como Funciona

### Fluxo de Signup

```
1. Usuário preenche formulário de cadastro
   ↓
2. Frontend chama supabase.auth.signUp()
   ↓
3. Supabase Auth cria o usuário
   ↓
4. Supabase Auth dispara webhook "Send Email Hook"
   ↓
5. unified-email-service recebe o webhook
   ↓
6. Edge function busca nome do usuário
   ↓
7. Edge function envia email via Resend
   ↓
8. Usuário recebe email de confirmação
```

## Configuração

### ⚠️ IMPORTANTE: Diferença entre Desenvolvimento e Produção

#### Desenvolvimento Local

No ambiente de desenvolvimento, o webhook é configurado automaticamente pelo arquivo `supabase/config.toml`:

```toml
[auth.hook.send_email]
enabled = true
uri = "http://host.docker.internal:54321/functions/v1/unified-email-service"
```

#### Produção (Supabase Cloud)

**O arquivo `config.toml` NÃO é aplicado automaticamente em produção!**

É necessário configurar manualmente no dashboard:

1. Acessar: [Auth Hooks - Supabase Dashboard](https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/auth/hooks)

2. Localizar **"Send Email Hook"**

3. **Habilitar** o hook

4. Configurar:
   - **HTTP Endpoint**: `https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/unified-email-service`
   - **Secrets**: deixar em branco (não necessário)

5. **Salvar** as alterações

### Secrets Necessários

A edge function precisa das seguintes secrets configuradas:

- `RESEND_API_KEY` - API key do Resend.com

## Recuperação de Nome do Usuário

A edge function usa uma estratégia de múltiplas fontes para recuperar o nome do usuário:

1. **user_metadata.name** - Dados do metadata do usuário
2. **raw_user_meta_data.name** - Dados raw do metadata
3. **Tabela users (banco de dados)** - Busca com delay de 500ms
4. **Fallback** - Email prefix ou 'Cliente'

## Debugging

### Como Verificar se o Webhook está Funcionando

1. **Verificar Configuração do Hook**
   - Acessar: [Auth Hooks](https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/auth/hooks)
   - Confirmar que "Send Email Hook" está **Enabled**
   - Verificar se o endpoint está correto

2. **Verificar Logs da Edge Function**
   - Acessar: [Logs do unified-email-service](https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/functions/unified-email-service/logs)
   - Procurar por linhas iniciadas com:
     - `🚀 [UNIFIED-EMAIL] Edge Function INVOKED` - Confirma que a função foi chamada
     - `✅ [WEBHOOK] Tipo: SIGNUP DETECTADO!` - Confirma que é um webhook de signup
     - `✅ [WEBHOOK] EMAIL ENVIADO COM SUCESSO!` - Confirma envio bem-sucedido

3. **Verificar Logs de Autenticação**
   - Acessar: [Auth Logs](https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/auth/logs)
   - Verificar eventos de signup

### Problemas Comuns

#### Email não é enviado no signup automático

**Sintoma**: Email só é enviado quando clica em "Reenviar email" manualmente.

**Causa**: Webhook "Send Email Hook" não está configurado no dashboard de produção.

**Solução**: Configurar o webhook manualmente no dashboard (ver seção "Configuração > Produção").

#### Nome do usuário aparece como email ou "Cliente"

**Causa**: Nome não está sendo salvo corretamente no signup ou não está sendo recuperado.

**Solução**:
1. Verificar se o campo `name` está sendo enviado no `data` do signup
2. Verificar se o trigger `on_auth_user_created` está funcionando
3. Verificar logs para ver qual fonte de nome está sendo usada

#### Email demora muito para chegar

**Causa**: Possível delay no provedor Resend ou configuração de domínio.

**Solução**:
1. Verificar status do Resend.com
2. Verificar se o domínio está validado no Resend
3. Verificar logs do Resend para ver status de entrega

## Manutenção

### Adicionar Novo Tipo de Email

1. Adicionar novo tipo no enum `EmailType`
2. Criar nova classe de template (ex: `WelcomeEmailTemplate`)
3. Adicionar método no `EmailService`
4. Atualizar a edge function para lidar com novo tipo

### Monitoramento

Recomendações de métricas para monitorar:

- Taxa de emails enviados com sucesso
- Taxa de falhas no envio
- Tempo de processamento da edge function
- Taxa de webhooks recebidos vs emails enviados

## Links Úteis

- [Auth Hooks - Dashboard](https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/auth/hooks)
- [Edge Function Logs](https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/functions/unified-email-service/logs)
- [Resend Dashboard](https://resend.com/emails)
- [Resend API Keys](https://resend.com/api-keys)
- [Resend Domain Verification](https://resend.com/domains)

## Troubleshooting Checklist

Ao investigar problemas de email, verificar nesta ordem:

- [ ] Webhook "Send Email Hook" está habilitado no dashboard?
- [ ] Endpoint do webhook está correto?
- [ ] `RESEND_API_KEY` está configurada?
- [ ] Domínio está validado no Resend?
- [ ] Logs da edge function mostram que foi invocada?
- [ ] Logs mostram "SIGNUP DETECTADO"?
- [ ] Logs mostram "EMAIL ENVIADO COM SUCESSO"?
- [ ] Verificar spam/lixo eletrônico do usuário
