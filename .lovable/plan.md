

# Plano: Usar endpoint `DELETE /admin/delete-propaganda/{client_id}` para deleção individual

## Situação atual

O código atual usa `DELETE /geral/deletar-arquivos/{client_id}/Propagandas` com um array JSON de nomes de arquivo no body. Isso existe em dois lugares:

1. **`delete-video-from-external-api/index.ts`** (linha 69) — deleta vídeo de todos os prédios do pedido
2. **`sync-buildings-external-api/index.ts`** (linha 218) — ação `remove` ao desassociar prédios

## Novo endpoint documentado pelo usuário

```
DELETE /admin/delete-propaganda/{client_id}
Content-Type: multipart/form-data
Body: video_name = "nomedoarquivo.mp4"
```

## Correções

### 1. `supabase/functions/delete-video-from-external-api/index.ts`

Alterar o fetch de cada prédio para usar o novo endpoint:
- URL: `http://15.228.8.3:8000/admin/delete-propaganda/{clientId}`
- Method: `DELETE`
- Body: `FormData` com campo `video_name` contendo o nome do arquivo `.mp4`

### 2. `supabase/functions/sync-buildings-external-api/index.ts`

Na ação `remove` (linha 211+), alterar igualmente para usar o novo endpoint com `FormData` e `video_name`. Aqui será necessário saber qual vídeo ativo deletar — buscar os vídeos do pedido antes de chamar a API.

## Detalhe técnico

```typescript
// Antes:
fetch(`${BASE}/geral/deletar-arquivos/${clientId}/Propagandas`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([fileName])
});

// Depois:
const formData = new FormData();
formData.append('video_name', fileName); // ex: "1774364942651_Kammer.mp4"
fetch(`${BASE}/admin/delete-propaganda/${clientId}`, {
  method: 'DELETE',
  body: formData
});
```

## Arquivos alterados

1. `supabase/functions/delete-video-from-external-api/index.ts` — novo endpoint + FormData
2. `supabase/functions/sync-buildings-external-api/index.ts` — ação `remove` com novo endpoint

