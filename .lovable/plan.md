## Verificação 2FA do WhatsApp no formulário de Síndico

Adicionar verificação obrigatória do WhatsApp via OTP (código de 6 dígitos enviado por WhatsApp) na etapa 2 do formulário, e registrar essa autenticação no PDF de aceite jurídico — reforçando a validade da assinatura eletrônica conforme **Lei 14.063/2020** (assinatura eletrônica avançada com fator de autenticação adicional).

---

### 1. Etapa 2 do formulário — bloco de verificação obrigatório

**Arquivo:** `src/components/interesse-sindico-form/StepSindico.tsx`

- Após o campo de WhatsApp, adicionar um **bloco de verificação** com 3 estados:
  - **Não enviado:** botão "Verificar WhatsApp" (aparece só quando o WhatsApp digitado é válido em E.164)
  - **Aguardando código:** input OTP de 6 dígitos (reusar `WhatsAppCodeInput`), timer regressivo de 5 min, link de reenvio após 60s
  - **Verificado:** badge verde "✓ WhatsApp verificado em DD/MM/AAAA HH:MM"
- O botão **"Continuar"** só fica habilitado se:
  - Schema da etapa válido **E**
  - WhatsApp marcado como verificado no estado
- Se o usuário **editar o número de WhatsApp** depois de verificado, a verificação é **invalidada automaticamente** (estado volta para "Não enviado") — protege contra troca de número após validação.

**Componente novo:** `src/components/interesse-sindico-form/WhatsAppVerifyBlock.tsx`
- Encapsula UI + chamadas às edge functions `send-user-whatsapp-code` e `verify-user-whatsapp-code` (já existentes, suportam `tipo: 'signup'` + `sessionId` sem precisar de `userId`).
- Gera um `sessionId` único (crypto.randomUUID) salvo no store ao entrar no fluxo.
- Estado salvo no `formStore`: `whatsappVerificado: boolean`, `whatsappVerificadoEm: ISO string`, `whatsappVerificadoNumero: E164`, `verificationSessionId: string`.

### 2. Store + schema

**`src/components/interesse-sindico-form/formStore.ts`**
- Adicionar ao `SindicoState`: `whatsappVerificado`, `whatsappVerificadoEm`, `whatsappVerificadoNumero`, `verificationSessionId`.
- Helper `invalidarVerificacaoSeMudouNumero(novoE164)` chamado no `setSindico` quando `whatsappRaw` muda.

**`src/components/interesse-sindico-form/schema.ts`**
- `stepSindicoSchema`: adicionar `superRefine` exigindo `whatsappVerificado === true` E `whatsappVerificadoNumero === normalizeBRPhoneToE164(whatsappRaw)` — garante que o número verificado é exatamente o que está sendo submetido.

### 3. Reaproveitamento da infra existente (zero código novo no backend de OTP)

Já existem e funcionam:
- ✅ `send-user-whatsapp-code` — aceita `tipo: 'signup'` com `sessionId` (sem `userId`). Rate limit: 3 tentativas / 5 min. Expiração: 5 min. Z-API configurado.
- ✅ `verify-user-whatsapp-code` — valida e marca `verificado=true` na tabela `exa_alerts_verification_codes`.
- ✅ Tabela `exa_alerts_verification_codes` com `session_id`, `telefone`, `codigo`, `verificado`, `expires_at`.

**Nenhuma migration nova de OTP** — só reuso.

### 4. Persistência da verificação no banco

**Migration:** adicionar 3 colunas em `sindicos_interessados`:
- `whatsapp_verificado boolean DEFAULT false`
- `whatsapp_verificado_em timestamptz`
- `whatsapp_verification_session_id text`

**RPC `submit_sindico_interesse`:** atualizar para receber e gravar esses 3 campos. Antes de gravar, a função faz uma checagem extra no servidor:
```sql
-- valida que existe registro verificado para esse session_id + telefone
SELECT EXISTS (
  SELECT 1 FROM exa_alerts_verification_codes
  WHERE session_id = p_session_id
    AND telefone = p_telefone_e164
    AND verificado = true
    AND expires_at > now() - interval '1 hour'
)
```
Se falso → erro `WHATSAPP_NAO_VERIFICADO`. Isso impede burlar a verificação chamando o RPC direto.

**Frontend:** `src/utils/submitFormulario.ts` passa `whatsapp_verificado`, `whatsapp_verificado_em`, `verification_session_id` no payload.

### 5. PDF de aceite — linha extra no bloco de evidências

**Arquivo:** `supabase/functions/gerar-pdf-aceite-sindico/index.ts`

Na seção **"Evidências jurídicas"** (já existente, com IP, User-Agent, hash, timestamp), adicionar 1 linha logo abaixo do timestamp:

> **Autenticação 2FA WhatsApp:** ✓ Verificado em DD/MM/AAAA HH:MM:SS (código OTP enviado e validado no nº +55 XX XXXXX-XXXX) — Lei 14.063/2020, Art. 4º, II.

A linha só aparece quando `whatsapp_verificado = true` (compatibilidade com PDFs antigos preserva idempotência).

### 6. Painel administrativo — badge de verificação

**`src/components/admin/sindicos-interessados/types.ts`** — adicionar os 3 campos opcionais.

**`src/components/admin/sindicos-interessados/tabs/TabSindico.tsx`** — ao lado do número de WhatsApp, exibir badge:
- Verde "✓ Verificado em DD/MM/AAAA HH:MM" se `whatsapp_verificado`
- Cinza "Não verificado" caso contrário (apenas para registros antigos)

### 7. E-mail de confirmação — menção sutil

**`supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts`**
Adicionar 1 linha no rodapé das evidências: "WhatsApp autenticado via código (2FA) em DD/MM/AAAA HH:MM."

---

### Detalhes técnicos

**Regras de OTP (já implementadas no backend, só uso):**
- 6 dígitos numéricos
- Expira em 5 minutos
- Reenvio após 60s
- Máximo 3 envios por número/sessão a cada 5 min (rate limit)
- Mensagem WhatsApp: "🎉 Bem-vindo à EXA! Para completar seu cadastro, digite o código: *XXXXXX*. Válido por 5 minutos."

**Fluxo completo do usuário:**
```text
[Etapa 2 — Dados do síndico]
  ↓ Preenche WhatsApp (45) 99999-9999
  ↓ Clica "Verificar WhatsApp"
  ↓ Recebe código via WhatsApp em ~5s
  ↓ Digita 6 dígitos → "Verificar código"
  ↓ Badge verde "✓ Verificado"
  ↓ Botão "Continuar" habilitado
  → Etapa 3
```

**Segurança em camadas:**
1. Cliente — botão Continuar bloqueado até `whatsappVerificado === true` E número bate com o verificado
2. Schema Zod — `superRefine` valida o mesmo
3. Servidor (RPC) — re-checa em `exa_alerts_verification_codes` se há registro `verificado=true` para o `session_id + telefone` enviados, dentro da última hora
4. PDF — só registra "verificado" se `whatsapp_verificado=true` no banco

### Arquivos afetados (resumo)

**Editar:**
- `src/components/interesse-sindico-form/StepSindico.tsx` (UI do bloco)
- `src/components/interesse-sindico-form/formStore.ts` (estado + invalidação)
- `src/components/interesse-sindico-form/schema.ts` (validação)
- `src/utils/submitFormulario.ts` (payload RPC)
- `supabase/functions/gerar-pdf-aceite-sindico/index.ts` (linha de evidência)
- `supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts` (linha)
- `src/components/admin/sindicos-interessados/types.ts` (tipos)
- `src/components/admin/sindicos-interessados/tabs/TabSindico.tsx` (badge)

**Criar:**
- `src/components/interesse-sindico-form/WhatsAppVerifyBlock.tsx` (componente do bloco OTP)

**Migration:**
- 3 colunas em `sindicos_interessados`
- Atualizar RPC `submit_sindico_interesse` (validação 2FA server-side + grava campos)

**Deploy:** `gerar-pdf-aceite-sindico`, `send-sindico-confirmation` (não precisa redeployar `send-user-whatsapp-code` / `verify-user-whatsapp-code` — já estão em produção).

### O que NÃO será alterado

- Layout da landing, dos vídeos, das outras etapas do formulário (1 e 3).
- Edge functions de OTP existentes (`send-user-whatsapp-code`, `verify-user-whatsapp-code`) — só consumo.
- Configuração Z-API.
- PDFs já gerados (idempotência preservada — só novos protocolos terão a linha de 2FA).

Aprova para eu executar?