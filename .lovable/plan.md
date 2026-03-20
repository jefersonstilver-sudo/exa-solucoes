

# Diagnóstico: Upload falhando com status 400 na VideosSitePage

## Problema identificado

O código em `VideosSitePage.tsx` (linha 100-136) usa `createSignedUploadUrl` + `XMLHttpRequest` PUT manual. O PUT retorna **400 Bad Request**.

A policy de INSERT no bucket `videos` está OK (`bucket_id = 'videos'`), o bucket existe e é público. O problema está na **requisição PUT ao signed URL** — falta o header `x-upsert: true` caso o arquivo já exista, ou o Supabase espera headers adicionais que o XHR não está enviando.

## Solução

Simplificar o upload substituindo o fluxo `createSignedUploadUrl` + XHR por `supabase.storage.from('videos').upload()` direto. Para manter o tracking de progresso, usar `tus` ou `onUploadProgress` — mas como o Supabase JS v2 não expõe progresso nativo no `upload()`, a alternativa mais simples e confiável é:

1. Usar `supabase.storage.from(bucket).upload(fileName, file, { upsert: true })` — funciona sem problemas de signed URL
2. Remover o XHR manual e o `createSignedUploadUrl`
3. Simular progresso com estimativa baseada em tamanho do arquivo (ou simplesmente mostrar spinner sem percentual)

**Alternativa com progresso real**: Manter o XHR mas adicionar o header `Authorization: Bearer {session.access_token}` e usar a URL direta do storage API em vez do signed URL.

## Alteração

**Arquivo**: `src/pages/admin/VideosSitePage.tsx` (função `handleFileUpload`, linhas 67-157)

Substituir o bloco de `createSignedUploadUrl` + XHR por:

```typescript
const { error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(fileName, file, { upsert: true });

if (uploadError) throw uploadError;
```

Remover `setProgress` granular (ou manter como indeterminate). O resto do código (obter publicUrl, chamar onSuccess) permanece igual.

## Arquivos alterados
- `src/pages/admin/VideosSitePage.tsx` — simplificar upload

