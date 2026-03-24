

# Plano: Corrigir CORS da Edge Function de Exclusao

## Causa raiz

A edge function `delete-video-from-external-api` tem **CORS incompleto**:

```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
```

O SDK do Supabase envia headers extras (`x-supabase-client-platform`, `x-supabase-client-platform-version`, etc.). Como esses headers nao estao no `Access-Control-Allow-Headers`, o **preflight CORS falha** e o browser **nunca envia o POST**. A edge function nunca executa (zero logs).

O helper `videoDeleteHelper.ts` captura o erro silenciosamente (linhas 57-59) e continua deletando do banco. Por isso o toast mostra "sucesso" mas a API externa nunca recebe a chamada.

## Correcao

### Unico arquivo: `supabase/functions/delete-video-from-external-api/index.ts`

Atualizar os CORS headers para:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

Isso e tudo. Uma linha alterada. O resto do fluxo (helper, hook, edge function) ja esta correto.

## Por que isso resolve

1. Browser faz preflight OPTIONS -> edge function responde com CORS completo -> browser permite o POST
2. POST