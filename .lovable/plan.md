

# Plano: Eliminar Cache Stale no Safari e Chrome

## Diagnóstico do Problema

O sistema atual tem **3 camadas de cache-busting**, mas todas falham no mesmo cenário:

1. **Meta tags `Cache-Control`** no HTML → Ignoradas por CDNs e pela maioria dos navegadores modernos para decisões reais de cache HTTP
2. **BUILD_ID no `index.html`** → Só funciona SE o navegador já baixou o HTML novo. Se o HTML está cacheado, o script antigo roda com o BUILD_ID antigo e nunca detecta mudança
3. **`useForceCacheClear`** → Limpa Service Workers e Caches API, mas não resolve o cache HTTP do navegador para o próprio `index.html`

**Causa raiz**: O Safari (especialmente com `apple-mobile-web-app-capable`) e o Chrome cacheam agressivamente o `index.html`. Como o HTML cacheado contém o BUILD_ID antigo, o mecanismo de detecção nunca dispara.

## Solução: Version Check via Edge Function

Criar um endpoint server-side que retorna a versão atual do build. Na montagem do app, comparar com a versão embutida no código. Se divergir, forçar reload limpo.

```text
┌──────────────┐     GET /version      ┌─────────────────────┐
│  App mounts  │ ──────────────────►   │  Edge Function      │
│  (React)     │                       │  returns latest      │
│              │ ◄──────────────────   │  BUILD_TIMESTAMP     │
│  Compare:    │     { version: X }    │  from DB/config      │
│  local != X  │                       └─────────────────────┘
│  → reload()  │
└──────────────┘
```

## Arquivos e Mudanças

### 1. Criar Edge Function `get-app-version`
- Retorna a versão mais recente do build
- Usa uma tabela `app_config` (ou hardcoded no deploy) para armazenar a versão atual
- Headers `Cache-Control: no-store` para nunca cachear a resposta

### 2. Criar migration: tabela `app_config`
- Tabela simples com chave `current_version` e valor (timestamp do build)
- Atualizada automaticamente via hook pós-deploy ou manualmente

### 3. Modificar `src/hooks/useForceCacheClear.ts`
- Na montagem, chamar a Edge Function `get-app-version`
- Comparar o timestamp retornado com `__BUILD_TIMESTAMP__` embutido no JS
- Se diferente: limpar caches + `window.location.reload(true)`
- Incluir proteção contra loop infinito (max 1 reload por sessão via `sessionStorage`)

### 4. Atualizar `index.html` — Cache Bust Script
- Melhorar o script inline para também adicionar `?_t=timestamp` ao forçar reload, evitando que o navegador sirva o HTML do disco
- Substituir `window.location.reload(true)` por `window.location.href = '/?_cb=' + Date.now()` que força bypass de cache HTTP

### 5. React Query — Garantir dados frescos
- O `staleTime: 1min` atual é adequado
- Adicionar `refetchOnMount: 'always'` no default do QueryClient para garantir que dados do banco sejam sempre verificados ao montar componentes

## Proteção Anti-Loop

Para evitar reload infinito caso algo dê errado:
- `sessionStorage.setItem('cache-reload-count', count)`
- Máximo 1 reload por sessão
- Se já recarregou, apenas loga warning no console

## Compatibilidade

- **Safari iOS**: O `window.location.href = url + '?_cb=...'` força o Safari a buscar HTML novo do servidor
- **Chrome**: Content-hashed assets do Vite já funcionam; o problema é só o HTML
- **Safari desktop**: Mesmo tratamento do iOS

## Impacto

- Nenhuma alteração de UI
- Nenhuma funcionalidade existente é modificada
- Apenas adiciona verificação de versão no boot do app

