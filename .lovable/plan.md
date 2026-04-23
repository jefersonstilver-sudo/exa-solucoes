

# Diagnóstico e correção: PDF não gera + tela de sucesso não aparece

## Investigação a executar (após aprovação, em modo default)

1. **Logs da edge function** `gerar-pdf-aceite-sindico` (últimos 30 min) — capturar status HTTP e stack trace.
2. **Inspeção do auth gate** em `supabase/functions/gerar-pdf-aceite-sindico/index.ts` — confirmar se é incondicional (bug suspeito) ou condicionado a `force_regenerate`.
3. **Inspeção do tratamento de erro** em `src/utils/submitFormulario.ts` — confirmar se erro de PDF é silenciado com `console.warn` (a versão atual já visível no contexto inicial faz exatamente isso: `console.warn('[submitFormulario] PDF generation failed (não bloqueia)')`).
4. **Reprodução manual** via `supabase--curl_edge_functions` invocando a função com o `id` de `EXA-2026-000003` sem `force_regenerate`.
5. **Verificação de rota** `/interessesindico/sucesso` em `routes/index.tsx` (já confirmada no contexto: existe e tem fallback para protocolo nulo `|| '—'`).

## Hipóteses (ranking de probabilidade)

| # | Hipótese | Probabilidade | Evidência preliminar |
|---|---|---|---|
| H1 | Auth gate incondicional rejeita o submit anônimo | **Muito alta** | A última implementação adicionou checagem JWT + `has_role`. O submit do formulário público é anônimo (sem JWT) → 401/403. |
| H2 | Erro do PDF silenciado em `console.warn` | **Confirmada** | `submitFormulario.ts` linha visível: `if (pdfErr) { console.warn(...) }` — submit retorna `success: true` mesmo sem PDF, mas o navigate pra `/sucesso` pode falhar por outro motivo. |
| H3 | Fetch da logo crashando | Média | Fallback existe, mas pode haver throw antes dele. |
| H4 | Rota de sucesso quebrada | Baixa | Rota existe e tem fallback. Mais provável: o submit retorna sucesso mas o `navigate` não está sendo chamado, OU o usuário foi redirecionado para outro lugar. |

## Correções a aplicar (após confirmação)

### Correção 1 — Auth gate condicional (CRÍTICA)
**Arquivo**: `supabase/functions/gerar-pdf-aceite-sindico/index.ts`

Mover a checagem `isAuthorizedAdmin()` para dentro do bloco `if (forceRegenerate)`. Chamadas sem `force_regenerate` (submit do formulário público) passam direto, mantendo a idempotência atual. Apenas regenerações forçadas exigem JWT admin.

```ts
const { sindico_interessado_id, force_regenerate = false } = body;

if (force_regenerate) {
  const ok = await isAuthorizedAdmin(req, supa);
  if (!ok) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 403, headers: corsHeaders });
}
// resto do fluxo (idempotência, geração, upload) inalterado
```

### Correção 2 — Surface de erro no submit + redirecionamento garantido
**Arquivo**: `src/utils/submitFormulario.ts`

Substituir o `console.warn` silencioso por:
- Logar o erro completo no console **e** retornar um campo extra `pdf_error` no resultado.
- O submit continua retornando `success: true` (o registro foi criado), mas com `pdf_error` populado.

**Arquivo**: `src/components/interesse-sindico-form/` (componente que chama `submitFormulario` e faz `navigate`)

Investigar e garantir que:
- Após `success: true`, o `navigate('/interessesindico/sucesso?protocolo=...')` é executado **independentemente** de `pdf_error`.
- Se `pdf_error` existir, exibir um toast informativo na tela de sucesso (não bloquear).

### Correção 3 — Hardening do fetch da logo (defensivo)
**Arquivo**: `supabase/functions/gerar-pdf-aceite-sindico/index.ts`

Garantir que o `try/catch` do `loadLogo()` envolve **todo** o fluxo de embed (incluindo `embedPng`), não só o `fetch`. Fallback: gerar PDF com wordmark "EXA" em Times-Bold sem quebrar.

### Correção 4 — Reemissão dos PDFs órfãos
Após as correções, invocar a edge function via `supabase--curl_edge_functions` para `EXA-2026-000003` (e quaisquer outros registros com `aceite_pdf_url IS NULL` recentes) usando `force_regenerate: true` autenticado, para popular os PDFs faltantes.

## Arquivos tocados (estimativa)

| Arquivo | Tipo |
|---|---|
| `supabase/functions/gerar-pdf-aceite-sindico/index.ts` | Mover auth gate para dentro de `if (force_regenerate)` + reforçar try/catch da logo |
| `src/utils/submitFormulario.ts` | Retornar `pdf_error` em vez de silenciar |
| Componente que invoca submit (a identificar na fase default) | Garantir navigate + toast informativo |

Total: **2-3 arquivos**. Nenhuma migração SQL. Nenhuma mudança em UI/RLS/triggers/landing/sucesso.

## Garantias

- ✅ Não toco em banco, RLS, triggers, schema, abas do dialog admin, sidebar, lista, landing, formulário (apenas no callback de submit) ou tela de sucesso.
- ✅ Idempotência preservada para chamadas normais.
- ✅ Auth gate continua protegendo `force_regenerate` (admin-only).
- ✅ Submit anônimo do formulário público volta a gerar PDF imediatamente.

