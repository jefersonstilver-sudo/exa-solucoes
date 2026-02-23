
# Corrigir Fluxo "Original" - Estado Stale no handleApply

## Problema

Quando o usuario clica "Aplicar Logo" com "Original" selecionado:

1. `handleApply` chama `await uploadOriginal()` que faz setState de `originalUrl`
2. Depois, `setTimeout(handleConfirm, 500)` chama `handleConfirm`
3. Mas `handleConfirm` captura o valor antigo de `originalUrl` (null) porque o setState ainda nao refletiu na closure
4. Resultado: `finalUrl` fica null e mostra "Nenhuma logo disponivel"

Mesmo que o upload tenha sucesso, o state nunca e visivel para o `handleConfirm` naquele ciclo.

## Solucao

Refatorar para que `uploadOriginal` retorne a URL diretamente, e `handleConfirm` aceite um parametro opcional que tem prioridade sobre o state.

### Arquivo: `src/components/admin/proposals/ClientLogoUploadModal.tsx`

**1. `uploadOriginal` retorna a URL:**
- Alem de chamar `setOriginalUrl(url)`, retorna `url` da funcao
- Tipo de retorno muda de `Promise<void>` para `Promise<string | null>`

**2. `handleConfirm` aceita `overrideUrl`:**
- Assinatura: `handleConfirm(overrideUrl?: string)`
- Se `overrideUrl` for passado e selectedVariant for `original` ou `css-optimized`, usa `overrideUrl` em vez de `originalUrl` do state

**3. `handleApply` reescrito:**
- Remove o `setTimeout` fragil
- Faz `const url = await uploadOriginal()` e chama `handleConfirm(url)` diretamente
- Se ja fez upload (`uploadedOriginal === true`), chama `handleConfirm()` normalmente

### Detalhes Tecnicos

```text
ANTES:
handleApply() -> uploadOriginal() [setState] -> setTimeout(handleConfirm, 500) -> originalUrl = null -> ERRO

DEPOIS:
handleApply() -> url = await uploadOriginal() -> handleConfirm(url) -> usa url diretamente -> OK
```

Mudancas apenas no `ClientLogoUploadModal.tsx`, funcoes `uploadOriginal`, `handleConfirm` e `handleApply`. Nenhum outro arquivo alterado. Interface visual permanece identica.
