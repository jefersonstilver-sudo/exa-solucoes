

# Plano: Implementar endpoint /admin/add-to-specific-buildings na Edge Function

## Contexto

A Edge Function `sync-buildings-external-api` (action: `add`) atualmente usa o endpoint `/geral/upload-arquivo/{prefix}/Propagandas` com JSON. O novo endpoint correto e `/admin/add-to-specific-buildings` com `multipart/form-data`, enviando os arquivos de video, `client_ids` (primeiros 4 chars dos UUIDs dos predios), e `metadados` com a estrutura especificada.

## Alteracao

### Arquivo: `supabase/functions/sync-buildings-external-api/index.ts`

Reescrever o bloco `action === 'add'` (linhas 31-117):

1. Buscar videos aprovados do pedido (mesmo query atual)
2. Buscar dados do pedido (`data_inicio`, `data_fim`, `tipo_produto`)
3. Para cada video:
   - Baixar o arquivo do Supabase Storage (como faz `upload-video-to-external-api`)
   - Validar que nao esta vazio
4. Montar `client_ids`: array JSON com primeiros 4 chars de cada building UUID (sem hifens)
5. Montar `metadados`: objeto JSON com chave = nome do arquivo, contendo:
   - `titulo`: nome da campanha/video
   - `data_ini` / `data_fim`: datas do pedido formatadas
   - `ativo`: baseado em `selected_for_display`
   - `isPlus`: true se `vertical_premium`
   - `programacao`: seg-sex 00:00 a 23:59 (padrao, ou customizada se houver campanha)
6. Construir `FormData`:
   - `files`: cada arquivo de video como Blob
   - `client_ids`: JSON string do array de IDs
   - `metadados`: JSON string do objeto
7. POST unico para `http://15.228.8.3:8000/admin/add-to-specific-buildings`
8. Tratar resposta e retornar resultado

### Detalhes tecnicos

```text
POST /admin/add-to-specific-buildings
Content-Type: multipart/form-data

fields:
  files[]     = video1.mp4, video2.mp4 (binarios)
  client_ids  = '["1001","1002"]'  (4 primeiros chars dos UUIDs)
  metadados   = '{"video1.mp4": { titulo, data_ini, data_fim, ativo, isPlus, programacao }}'
```

A programacao padrao sera seg-sex 00:00-23:59 conforme especificado. Se houver campanha avancada, usara as regras do banco.

### Hook `useOrderBuildingsManagement.ts`

Sem alteracao necessaria - ele ja chama `sync-buildings-external-api` com action `add`.

## Arquivos alterados

1. `supabase/functions/sync-buildings-external-api/index.ts` - reescrever bloco `add` para usar novo endpoint

