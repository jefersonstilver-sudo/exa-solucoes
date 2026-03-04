

# Plano Anti-Cache Definitivo: Sempre Atualizado, Zero Cache Antigo

## Problema Diagnosticado

O projeto usa `vite-plugin-pwa` com Workbox, que gera um Service Worker que:
1. **Pre-cache todo o app shell** (HTML, JS, CSS) e serve do cache mesmo quando o servidor tem versao nova
2. O `navigateFallback: '/index.html'` serve o HTML antigo do cache do SW enquanto o SW nao atualiza
3. O `runtimeCaching` para `.html|.js|.css` com `NetworkFirst` ainda cacheia por 60s
4. O preview Lovable nao precisa de PWA/offline -- o SW so atrapalha

O site publico (`exa-solucoes.lovable.app`) funciona porque foi publicado com um build limpo. O preview mostra versao antiga porque o SW pre-cached esta servindo arquivos antigos.

## Solucao: Remover PWA Service Worker do build

Como voce escolheu "Sempre atualizado" e "Preview sem cache", a solucao e desativar completamente o Service Worker gerado pelo Workbox e limpar SWs existentes nos clientes.

---

### 1. Desativar `vite-plugin-pwa` no `vite.config.ts`

Remover completamente o plugin `VitePWA()` da lista de plugins. Isso elimina:
- Geracao do `sw.js` no build
- Pre-caching automatico
- Runtime caching do Workbox
- O `navigateFallback` que serve HTML antigo

O `site.webmanifest` continua funcionando para o "Add to Home Screen" (icone na home do celular), mas sem Service Worker intermediando requests.

### 2. Remover dependencias de PWA do `package.json`

Remover `vite-plugin-pwa` e `workbox-window` das dependencias.

### 3. Adicionar script de limpeza de SW no `index.html`

Adicionar um script inline no `<head>` do `index.html` que desregistra qualquer Service Worker existente nos navegadores dos usuarios. Isso garante que clientes que ja instalaram o SW antigo nao continuem recebendo cache velho:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(r) { r.unregister(); });
  });
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(n) { caches.delete(n); });
    });
  }
}
```

### 4. Simplificar `src/config/version.ts`

Remover `clearAllCaches` (limpeza de SW) ja que nao havera mais SW. Manter apenas a logica de versao para uso futuro (VersionIndicator).

### 5. Simplificar `src/hooks/useForceCacheClear.ts`

Reduzir a apenas log da versao, sem tentar limpar SW/caches.

### 6. Simplificar `src/hooks/useVersionCheck.tsx`

Remover logica de `registration.update()` do SW.

### 7. Manter headers anti-cache no `index.html`

Os `<meta http-equiv="Cache-Control" content="no-cache">` ja estao no `index.html` raiz -- manter.

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `vite.config.ts` | Remover import e uso do `VitePWA` |
| `index.html` | Adicionar script de limpeza de SW existentes |
| `src/index.html` | Adicionar script de limpeza de SW + headers anti-cache |
| `src/config/version.ts` | Simplificar - remover limpeza de SW |
| `src/hooks/useForceCacheClear.ts` | Simplificar - apenas log de versao |
| `src/hooks/useVersionCheck.tsx` | Remover logica de SW update |
| `package.json` | Remover `vite-plugin-pwa` e `workbox-window` |

## O que NAO muda

- Nenhuma pagina, componente, rota ou funcionalidade
- O manifest PWA continua (icone na home do celular funciona)
- O build continua com hash nos filenames (cache-busting natural do Vite)
- Nenhum modulo de tarefas, contatos, agenda ou admin e tocado

## Resultado Esperado

- Preview sempre mostra a versao mais recente
- Site publicado sempre mostra a versao mais recente
- Nenhum Service Worker intercepta requests
- Cache do navegador e controlado pelos headers HTTP normais
- Hash nos filenames garante que JS/CSS novos sao sempre buscados

