# Criação de Conta Administrativa — Tipos de Conta + WhatsApp Validado

## Diagnóstico

### 1. Por que os tipos de conta "não aparecem" no formulário
O `CreateUserDialog.tsx` busca corretamente da tabela `role_types` (filtrando `is_active=true`, exceto `client` e `painel`). A query no banco retorna **7 tipos válidos** (Super Admin, Admin Geral, Admin Departamental, Admin Financeiro, Admin Marketing, Comercial, Eletricista).

Causa provável de "sumirem":
- Ao abrir o dialog, o `useEffect` define `role` como `admin` por padrão, mas a lista é carregada via fetch assíncrono. Se a renderização do `<SelectValue />` ocorrer antes do `setRoleTypes`, o trigger fica vazio até clicar.
- O `select` está corretamente populado, mas **não há fallback visual** quando `loadingRoles=false` e `roleTypes=[]` (ex.: erro RLS silenciado).
- O role `eletricista_` tem chave com underscore final e display name com espaço — sintoma de que a UI de tipos de conta permite cadastro sujo.

### 2. WhatsApp não existe no fluxo de criação
A tabela `profiles` tem apenas a coluna `phone` (text). **Não existe**: `whatsapp`, `whatsapp_verified`, `whatsapp_verified_at`. O dialog `CreateUserDialog.tsx` também **não pede telefone**. Por isso não há como validar.

### 3. Infraestrutura Z-API já existe e está pronta para reuso
Já temos as edge functions:
- `send-user-whatsapp-code` — envia código OTP via Z-API
- `verify-user-whatsapp-code` — valida código OTP
- `zapi-send-message` — envio genérico

Componente `PhoneVerificationOTP.tsx` em `monitoramento-ia` já implementa o input de 6 dígitos. Padrão Z-API exige prefixo `55` (memória `whatsapp-phone-formatting-standard`).

---

## Plano de Solução

### Etapa 1 — Banco de dados (migration)
Adicionar à tabela `profiles`:
- `whatsapp` (text, nullable) — número formatado E.164 com prefixo 55
- `whatsapp_verified` (boolean, default false)
- `whatsapp_verified_at` (timestamptz, nullable)
- `whatsapp_verification_required` (boolean, default true) — força validação no primeiro login se não validado pelo admin

Índice único parcial em `whatsapp` quando não nulo (evita duplicidade).

### Etapa 2 — `CreateUserDialog.tsx` (Conta Administrativa)
Adicionar dois novos campos abaixo do CPF:

**Campo "WhatsApp" (obrigatório)**
- Input com máscara `(XX) XXXXX-XXXX`
- Validação Zod: 10–11 dígitos (DDD + número)
- Conversão automática para `55XXXXXXXXXXX` antes de salvar (padrão Z-API)

**Bloco "Validação WhatsApp" (opcional na criação)**
Toggle com 2 opções claras:
1. **"Validar agora"** — Botão "Enviar código" → chama `send-user-whatsapp-code` → exibe `PhoneVerificationOTP` reaproveitado → ao validar, salva `whatsapp_verified=true`
2. **"Validar no primeiro login"** (default) — `whatsapp_verified=false` + `whatsapp_verification_required=true`. O usuário verá o gate de validação antes de acessar o sistema.

**Correção do Select de Tipo de Conta**
- Adicionar fallback `<SelectItem disabled>Nenhum tipo cadastrado</SelectItem>` quando `roleTypes.length === 0 && !loadingRoles`
- Garantir que o `value` default só seja setado **depois** da resposta (já está, mas precisa exibir mesmo durante loading via texto "Carregando tipos…" no trigger).
- Adicionar log de erro visível (toast persistente) se a query falhar por RLS.

### Etapa 3 — Edge function `create-admin-account`
Atualizar `validation.ts` e `userCreation.ts`:
- Aceitar `whatsapp`, `whatsapp_verified`, `whatsapp_verification_required` no payload
- Validar WhatsApp como obrigatório (rejeita criação sem)
- Persistir esses campos em `profiles` após criar o `auth.user`
- Se `whatsapp_verified=false`, gerar e enviar automaticamente um código de boas-vindas com link de validação no WhatsApp (reusa `send-user-whatsapp-code`)

### Etapa 4 — Gate de validação no primeiro login
Em `useAuth.tsx` (após autenticar e antes de liberar rotas admin):
- Checar `profile.whatsapp_verified === false && profile.whatsapp_verification_required === true`
- Se sim, redirecionar para nova rota `/sistema/validar-whatsapp` com componente `WhatsAppVerificationGate` (reusa `PhoneVerificationOTP`)
- Bloquear navegação até validar (similar ao padrão `pending_2fa` da memória `two-factor-auth-gate-v2-0-final`)
- Após validar, atualiza `whatsapp_verified=true`, `whatsapp_verified_at=now()` e libera

### Etapa 5 — UI de status na lista de usuários
Em `UserManagementPanel.tsx` / `IndexaTeamSection.tsx`:
- Badge ao lado do email: ✅ verde "WhatsApp validado" ou ⚠️ amarelo "WhatsApp pendente"
- No `UserConsoleDialog`, ação "Reenviar validação" e "Marcar como validado manualmente" (apenas super_admin)

### Etapa 6 — Higienização
- Trim no `display_name` e `key` da tabela `role_types` (corrigir "Eletricista " e `eletricista_`)
- Adicionar trigger BEFORE INSERT/UPDATE em `role_types` aplicando `TRIM()` em `key` e `display_name`

---

## Detalhes técnicos

**Migration SQL (resumo):**
```sql
ALTER TABLE profiles
  ADD COLUMN whatsapp text,
  ADD COLUMN whatsapp_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN whatsapp_verified_at timestamptz,
  ADD COLUMN whatsapp_verification_required boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX profiles_whatsapp_unique_idx
  ON profiles(whatsapp) WHERE whatsapp IS NOT NULL;

UPDATE role_types SET
  key = TRIM(key),
  display_name = TRIM(display_name);
```

**Z-API formatting:** sempre persistir `55` + DDD + número, sem máscara. Exibir mascarado na UI.

**Componentes reaproveitados:**
- `PhoneVerificationOTP.tsx` (input 6 dígitos)
- `send-user-whatsapp-code` / `verify-user-whatsapp-code` (edge functions)
- `Login2FAModal.tsx` como referência de UX do gate

**Sem mudanças** em outros fluxos (clientes, painéis, criação cortesia, etc.) — escopo restrito a contas administrativas, conforme regra de projeto.

---

## Resultado esperado
1. Tipos de conta sempre aparecem corretamente no select (com mensagem clara em caso de falha)
2. Toda nova conta administrativa exige WhatsApp
3. Super admin pode escolher: validar na hora (OTP) ou exigir validação no primeiro login
4. Lista de usuários mostra status de validação com ações rápidas
5. Sistema bloqueia acesso até a validação ser concluída

Aprova o plano para eu implementar?