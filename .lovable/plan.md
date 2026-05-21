# Ativar proposta estática em /proposta-jorbel/

## Diagnóstico

Os arquivos já estão em `public/proposta-jorbel/` e são servidos corretamente quando acessados pelo caminho completo:

- `GET /proposta-jorbel/index.html` → 200 (arquivo estático correto)
- `GET /proposta-jorbel/style.css` → 200
- `GET /proposta-jorbel/script.js` → 200
- `GET /proposta-jorbel/` (com barra final, sem `index.html`) → 200, **mas devolve o `index.html` do React** (SPA fallback)

Ou seja: o problema **não** é o React Router interceptando — é que o request de "diretório" (`/proposta-jorbel/`) não casa com nenhum arquivo, então tanto o Vite dev quanto o hosting do Lovable caem no SPA fallback (`index.html` do app). Por consequência, o navegador carrega o HTML errado, e os pedidos relativos a `style.css`/`script.js` partem da raiz do React e dão 404.

A solução é garantir que `/proposta-jorbel/` (e `/proposta-jorbel` sem barra) resolva para `/proposta-jorbel/index.html` em todos os ambientes.

## Mudanças

### 1. `vite.config.ts` — middleware no dev server

Adicionar um pequeno plugin que, antes do SPA fallback, reescreve requests de diretório para o `index.html` estático:

- Se `req.url` for `/proposta-jorbel` ou `/proposta-jorbel/` → seta `req.url = '/proposta-jorbel/index.html'` e segue para o middleware de assets do Vite.
- Não afeta nenhuma outra rota.

Isso resolve o preview no Lovable (que roda o dev server).

### 2. `src/routes/index.tsx` — rota de fallback p/ produção

No hosting de produção (e em qualquer caso onde o SPA fallback rode antes do rewrite), adicionar uma rota React que faça redirect hard para o arquivo estático:

```tsx
<Route
  path="/proposta-jorbel"
  element={<Navigate replace to="/proposta-jorbel/index.html" />}
/>
<Route
  path="/proposta-jorbel/"
  element={<Navigate replace to="/proposta-jorbel/index.html" />}
/>
```

Como `Navigate` do React Router só muda a URL no client, e queremos sair do React e bater no arquivo estático de fato, na verdade usaremos um componente minúsculo que faz `window.location.replace('/proposta-jorbel/index.html')` no `useEffect` (mais um `<noscript>` com `<meta http-equiv="refresh">` por garantia). Isso garante que o navegador faça um novo GET, agora para o caminho do arquivo, que retorna 200 com o HTML estático correto.

Nenhuma outra rota, layout, UI ou comportamento existente é alterado.

### 3. (Sem mudanças em) `public/_headers`

A entrada `/proposta-jorbel/*` já existe com CSP aberto para CDNs externos (GSAP/Lenis/Google Fonts), então cobre os assets da proposta automaticamente assim que a URL final aponta para o arquivo estático.

## Validação

Após a implementação, no preview:

1. `GET /proposta-jorbel` → redireciona para `/proposta-jorbel/index.html`
2. `GET /proposta-jorbel/` → idem
3. `GET /proposta-jorbel/index.html` → HTML estático da proposta (já funciona)
4. `style.css` e `script.js` carregam 200 e a proposta renderiza com fontes/animações.

Vou abrir `/proposta-jorbel/` no preview para confirmar visualmente.
