# Configuração de Domínio no Resend

## 📧 Guia Completo de Verificação

Este documento descreve o processo de verificação do domínio `examidia.com.br` no Resend para envio de emails profissionais.

---

## 🎯 Objetivo

Permitir que o sistema envie emails de:
- **Notificações de Super Admin**: `notificacoes@examidia.com.br`
- **Emails de Boas-Vindas**: `notificacoes@examidia.com.br`

---

## 📋 Pré-requisitos

1. Conta ativa no [Resend](https://resend.com)
2. Acesso ao painel de gerenciamento de DNS do domínio `examidia.com.br`
3. Chave API do Resend configurada no projeto (`RESEND_API_KEY`)

---

## 🚀 Passos para Verificação

### **Passo 1: Adicionar Domínio no Resend**

1. Acesse: https://resend.com/domains
2. Clique no botão **"Add Domain"**
3. Digite: `examidia.com.br`
4. Clique em **"Add"**

---

### **Passo 2: Configurar Registros DNS**

O Resend fornecerá **3 tipos de registros DNS** que você precisa adicionar no seu provedor de DNS:

#### **2.1. Registro SPF (Sender Policy Framework)**

**Tipo**: `TXT`  
**Nome/Host**: `@` ou `examidia.com.br`  
**Valor**: `v=spf1 include:_spf.resend.com ~all`

> **Importante**: Se você já tiver um registro SPF, **não crie um novo**. Apenas adicione `include:_spf.resend.com` ao registro existente.

**Exemplo de registro SPF existente:**
```
v=spf1 include:_spf.google.com include:_spf.resend.com ~all
```

#### **2.2. Registro DKIM (DomainKeys Identified Mail)**

**Tipo**: `TXT`  
**Nome/Host**: `resend._domainkey` (ou valor fornecido pelo Resend)  
**Valor**: `[Valor fornecido pelo Resend - geralmente uma string longa]`

> **Nota**: O valor exato será fornecido no painel do Resend após adicionar o domínio.

#### **2.3. Registro DMARC (Domain-based Message Authentication) - RECOMENDADO**

**Tipo**: `TXT`  
**Nome/Host**: `_dmarc`  
**Valor**: `v=DMARC1; p=none; rua=mailto:dmarc@examidia.com.br`

> **Nota**: Este registro é **opcional mas altamente recomendado** para melhorar a entregabilidade e monitorar possíveis fraudes.

---

### **Passo 3: Aguardar Verificação**

- Após adicionar os registros DNS, volte ao painel do Resend
- Clique em **"Verify DNS Records"**
- A verificação pode levar de **alguns minutos até 48 horas**
- Status: `Pending` → `Verified` ✅

---

### **Passo 4: Atualizar Código do Projeto**

Após o domínio ser **verificado com sucesso**, atualize os seguintes arquivos:

#### **4.1. Arquivo: `supabase/functions/create-admin-account/emailService.ts`**

**Linha 31-36** - Atualizar o campo `from`:

```typescript
// ❌ ANTES (Domínio de teste do Resend)
from: 'EXA Mídia <onboarding@resend.dev>',

// ✅ DEPOIS (Domínio verificado)
from: 'EXA Mídia Notificações <notificacoes@examidia.com.br>',
```

#### **4.2. Arquivo: `supabase/functions/create-admin-account/admin-notification.ts`**

**Linha 87** - Atualizar o campo `from`:

```typescript
// ❌ ANTES (Domínio de teste do Resend)
from: 'EXA Mídia <onboarding@resend.dev>',

// ✅ DEPOIS (Domínio verificado)
from: 'EXA Mídia Notificações <notificacoes@examidia.com.br>',
```

---

## 🔍 Verificar Status da Configuração

### **No Painel do Resend**
1. Acesse: https://resend.com/domains
2. Verifique se o domínio `examidia.com.br` está com status **"Verified"** ✅

### **Testar Envio de Email**
Após verificação, teste criando uma nova conta administrativa:

```bash
# O sistema enviará emails de:
notificacoes@examidia.com.br
```

---

## ⚠️ Problemas Comuns

### **Erro: "You can only send testing emails to your own email address"**

**Causa**: Domínio não verificado.  
**Solução**: Complete os passos 1-3 acima e aguarde a verificação DNS.

---

### **Erro: "DNS records not found"**

**Causa**: Registros DNS não propagados ou configurados incorretamente.  
**Solução**:
1. Verifique se os registros foram adicionados corretamente no DNS
2. Aguarde até 48h para propagação completa
3. Use ferramentas como [MXToolbox](https://mxtoolbox.com) para verificar DNS:
   - Verificar SPF: https://mxtoolbox.com/spf.aspx
   - Verificar DKIM: https://mxtoolbox.com/dkim.aspx

---

### **Emails caindo em spam**

**Possíveis causas**:
- Registro DMARC não configurado
- Reputação do domínio baixa (domínio novo)
- Conteúdo do email com palavras-chave de spam

**Soluções**:
1. Configure o registro DMARC (Passo 2.3)
2. Aqueça o domínio enviando poucos emails inicialmente
3. Revise conteúdo dos templates de email

---

## 📊 Monitoramento

Após configuração completa, monitore:

1. **Taxa de entrega**: Painel do Resend > Analytics
2. **Logs de envio**: Supabase Edge Functions Logs
3. **Relatórios DMARC**: Recebidos em `dmarc@examidia.com.br`

---

## 🔐 Segurança

- ✅ **NUNCA** exponha a chave API do Resend (`RESEND_API_KEY`)
- ✅ Mantenha registros DNS atualizados
- ✅ Monitore relatórios DMARC regularmente
- ✅ Use emails de remetente profissionais (evite `noreply@`)

---

## 🆘 Suporte

- **Documentação Resend**: https://resend.com/docs
- **Suporte Resend**: https://resend.com/support
- **Comunidade Resend**: https://github.com/resendlabs/resend-node

---

## ✅ Checklist Final

- [ ] Domínio adicionado no Resend
- [ ] Registro SPF configurado
- [ ] Registro DKIM configurado
- [ ] Registro DMARC configurado (opcional)
- [ ] Domínio verificado no Resend
- [ ] Arquivos `emailService.ts` e `admin-notification.ts` atualizados
- [ ] Teste de envio de email realizado com sucesso
- [ ] Emails não estão caindo em spam

---

**Última atualização**: 2025-11-08  
**Versão**: 1.0
