

# Fix: Cache Persistente no iPhone/Safari

## Problema

O Safari (especialmente no modo PWA/standalone do iPhone) é extremamente agressivo com cache. Ele cacheia o próprio `index.html`, então:
1. O script inline de BUILD_ID nunca vê a versão nova (porque o HTML inteiro é cacheado)
2. O hook React `useForceCacheClear` só roda se o JS carregar — mas o JS também está cacheado
3. `window.location.href = url` com query param **não força** bypass de cache no Safari como faz no Chrome

## Solução

### 1. Verificação de versão no index.html via fetch direto à Edge Function

**Arquivo: `index.html`**

Adicionar um script inline **antes** do carregamento do app que:
- Faz `fetch` direto para a Edge Function `get-app-version` com `cache: 'no-store'`
- Compara a versão do servidor com o `BUILD_ID` local (já injetado pelo Vite)
- Se divergir: limpa caches, limpa localStorage de versão, e usa `location.replace()` com timestamp único
- Guarda flag em `sessionStorage` para evitar loop infinito
- Isso funciona **antes** do React montar, pegando até o caso onde o JS bundle está cacheado

### 2. Forçar no-cache no fetch do hook React (fallback)

**Arquivo: `src/hooks/useForceCacheClear.ts`**

- Adicionar headers `Cache-Control: no-cache` e `Pragma: no-cache` na chamada à Edge Function
- Trocar `window.location.href` por `window.location.replace()` (Safari respeita melhor)

### 3. Meta tag adicional para Safari

**Arquivo: `index.html`**

- Adicionar `<meta name="apple-mobile-web-app-capable" content="yes">` (já existe)
- Adicionar header HTTP equivalente via tag: não funciona em meta, mas o script inline com fetch resolve

## Detalhes Técnicos

**Script inline no index.html** (antes do `<script type="module" src="/src/main.tsx">`):
```javascript
(function() {
  var BUILD_ID = '__BUILD_ID__';
  if (sessionStorage.getItem('v-check-done')) return;
  
  fetch('https://[SUPABASE_URL]/functions/v1/get-app-version', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.version && d.version !== '0' && d.version !== BUILD_ID) {
      sessionStorage.setItem('v-check-done', '1');
      if ('caches' in window) {
        caches.keys().then(function(n) {
          Promise.all(n.map(function(k) { return caches.delete(k); }))
            .then(function() { location.replace('/?_r=' + Date.now()); });
        });
      } else {
        location.replace('/?_r=' + Date.now());
      }
    }
  })
  .catch(function() {});
})();
```

Este script roda **antes** de qualquer JS bundled, então mesmo que o Safari tenha cacheado o bundle antigo, a verificação acontece e força o reload com versão nova.

