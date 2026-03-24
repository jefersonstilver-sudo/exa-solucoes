

# Plano: Usar nome original do arquivo (.mp4) no POST e no PATCH

## Problema

Apos remover a extensao `.mp4` do nome do arquivo no `add-to-specific-buildings`, os edificios pararam de receber o video. A API externa espera o nome do arquivo COM a extensao `.mp4` (ex: `1774364942651_Kammer_Soho_-_Tela_Exa_01_v4.mp4`).

O PATCH (`global-toggle-ativo`) tambem precisa enviar o mesmo nome com `.mp4` para que a API consiga correlacionar.

## Correcao

### 1. `supabase/functions/sync-buildings-external-api/index.ts`

Extrair o nome do arquivo da URL **com** a extensao `.mp4`:

```text
// ANTES (sem extensao):
const cleaned = noQueryHash.replace(/\.[^.]+$/, "").trim();

// DEPOIS (com extensao):
const base = url.split("/").pop().split("?")[0].split("#")[0].trim()
// Resultado: "1774364942651_Kammer_Soho_-_Tela_Exa_01_v4.mp4"
```

Usar esse nome com extensao tanto no `formData.append('files', fileData, fileName)` quanto na chave do `metadados`.

### 2. `supabase/functions/sync-video-status-to-aws/index.ts`

Alterar `extractTitulo` para tambem manter a extensao `.mp4`, garantindo que o array `titulos` enviado ao `global-toggle-ativo` use o mesmo formato:

```text
// ANTES:
const cleaned = noQueryHash.replace(/\.[^.]+$/, "").trim();

// DEPOIS:
const cleaned = noQueryHash.trim();  // mantem .mp4
```

### 3. `src/pages/advertiser/OrderDetails.tsx`

Na logica que monta `titulos` para o PATCH no portal do anunciante, garantir que os titulos tambem incluam `.mp4` (extraidos da URL com extensao).

## Arquivos alterados

1. `supabase/functions/sync-buildings-external-api/index.ts` — manter extensao no nome do arquivo
2. `supabase/functions/sync-video-status-to-aws/index.ts` — `extractTitulo` mantém `.mp4`
3. `src/pages/advertiser/OrderDetails.tsx` — titulos com extensao `.mp4`

