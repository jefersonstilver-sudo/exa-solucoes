

# Plano: Alinhar nome do arquivo no add-to-specific-buildings com o PATCH

## Problema

- `add-to-specific-buildings` envia o arquivo como `"VIDEO 2 KAMMER.mp4"` e usa isso como chave nos metadados
- `global-toggle-ativo` (PATCH) envia `"VIDEO 2 KAMMER"` (sem extensao, extraido da URL)
- A API externa nao consegue correlacionar os dois porque os nomes nao batem

## Correcao

### Arquivo: `supabase/functions/sync-buildings-external-api/index.ts`

Remover a logica que adiciona `.mp4` ao nome do arquivo. Usar `video.nome` diretamente (sem extensao) tanto para:
1. O nome do arquivo no `formData.append('files', fileData, nomeDoVideo)` 
2. A chave no objeto `metadados`

```text
// ANTES (linhas 87-88):
const fileName = video.nome || `video_${pv.video_id}.mp4`
const fileNameClean = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`

// DEPOIS:
const fileName = video.nome || `video_${pv.video_id}`
const fileNameClean = fileName.replace(/\.[^.]+$/, '')  // remove extensao se houver
```

Isso alinha com o `extractTitulo` do `sync-video-status-to-aws` que tambem remove a extensao da URL.

## Arquivo alterado

1. `supabase/functions/sync-buildings-external-api/index.ts` — usar nome sem extensao

