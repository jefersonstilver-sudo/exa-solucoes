

# Fix: Chrome Cache Persistindo Versão Antiga

## Problema

Os meta tags `http-equiv="Cache-Control"` no HTML são **ignorados pela maioria dos browsers modernos** -- eles só respeitam headers HTTP reais enviados pelo servidor. Como o Lovable preview serve `index.html` com cache padrão do CDN, o Chrome pode servir uma versão antiga do HTML mesmo após um novo deploy, e todos os assets referenciados nele ficam desatualizados.

## Solução

Adicionar um script inline no `index.html` que detecta quando a versão mudou e força um hard reload:

### Arquivo: `index.html`
- Adicionar script inline (antes do `<script type="module" src="/src/main.tsx">`) que:
  1. Armazena um `BUILD_ID` gerado pelo Vite (`__BUILD_TIMESTAMP__` injetado via `define`)
  2. Na primeira carga, compara com `localStorage['html-build-id']`
  3. Se diferente, limpa todos os caches do browser (`caches.delete`), atualiza o localStorage, e faz `location.reload(true)` para forçar busca no servidor
  4. Isso garante que mesmo se o CDN servir `index.html` cacheado por alguns segundos, na próxima visita o usuário sempre pega a versão fresca

### Arquivo: `vite.config.ts`
- Sem mudanças (já injeta `__BUILD_TIMESTAMP__`)

### Arquivo: `src/hooks/useForceCacheClear.ts`
- Adicionar limpeza ativa: ao montar, verificar se `navigator.serviceWorker` tem registros e limpar, e também limpar `sessionStorage` de flags antigos

Impacto: Garante que nenhum visitante veja versão antiga após deploy, sem depender de headers HTTP do servidor.

