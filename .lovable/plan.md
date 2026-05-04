## Super correção tripla — escopo consolidado

### Parte 1 — Botão "Enviar Vídeo" na listagem de pedidos

Na rota `/anunciante/pedidos`, cada card de pedido com status `pago`/`pago_pendente_video` exibe um botão **Enviar Vídeo** ao lado de **Ver Detalhes**. O upload deve acontecer **somente** dentro da página de detalhes.

**Origem:** `src/hooks/useOrderStatus.ts` (linha ~154) retorna `action: { label: 'Enviar Vídeo', href: '/anunciante/pedido/:id#upload' }`. O `AdvertiserOrderCard.tsx` renderiza esse `statusInfo.action` automaticamente em mobile e desktop.

**Correção:** remover o objeto `action` apenas desse case. Mantém o badge "Aguardando Vídeo" e o texto descritivo. **Ver Detalhes** continua sendo o único caminho. Nada mais é tocado.

---

### Parte 2 — CNPJ "duplicado" na empresa

Eu verifiquei tudo: **não existe duplicação real no banco**. O CNPJ é salvo apenas em `users.empresa_documento`. O que confunde:

- O cadastro inicial (`/cadastro`) coleta apenas nome, email, senha e CPF pessoal — **não pede CNPJ**.
- Existe um arquivo órfão `src/components/auth/registration/CompanyInfoSection.tsx` que coleta CNPJ no cadastro, mas **não está importado em lugar nenhum** (código morto).
- O CNPJ é pedido só em **Editar Perfil → Empresa** (`CompanyBrandSection.tsx`), junto com país, segmento, endereço, logo e termo de responsabilidade.
- Mesmo quando o CNPJ já está salvo, a tela continua mostrando todos os campos editáveis e força clicar em "Salvar" novamente para atualizar o termo.

**Correção (escopo global, sem quebrar UI):**

1. **Deletar o órfão** `src/components/auth/registration/CompanyInfoSection.tsx`.
2. **Tornar `CompanyBrandSection.tsx` inteligente:**
   - Se `empresa_documento` preenchido **e** `empresa_aceite_termo = false` → esconder os campos de CNPJ/país/nome/segmento/endereço (mantém o card resumo institucional já existente, em modo leitura) e exibir alerta destacado: *"Seus dados de empresa já estão cadastrados. Para liberar o upload de vídeos, falta apenas confirmar o Termo de Responsabilidade abaixo."* + checkbox do termo + botão único **"Confirmar Termo"** que faz só o update de `empresa_aceite_termo` e `empresa_aceite_termo_data`.
   - Se `empresa_documento` preenchido **e** `empresa_aceite_termo = true` → comportamento atual (card resumo + edição via "Editar").
   - Se `empresa_documento` vazio → formulário completo atual (primeira vez).
3. **Banco:** nenhuma migration. Colunas já existem.

---

### Parte 3 — Cache agressivo em Safari (Mac) e Comet desktop

Hoje a política anti-cache (Camada 1: script inline em `index.html` que consulta a edge function `get-app-version`; Camada 2: `useForceCacheClear` + `_headers`) cobre bem Safari iPhone, mas tem **brechas reais em desktop**:

1. `sessionStorage.setItem('v-check-done', '1')` é setado **antes** do reload — se o reload falhar ou o usuário ficar com a aba aberta, **nunca mais checa versão na mesma sessão**.
2. Não há **fallback** se `get-app-version` der timeout/erro (Safari corporativo às vezes bloqueia), o usuário fica preso no bundle antigo silenciosamente.
3. Comet (Chromium da Perplexity) e Safari desktop fazem cache agressivo de `/assets/*-[hash].js` quando o `index.html` antigo continua referenciando hashes antigos via service worker antigo ou bfcache.
4. Não há detecção de **bfcache/pageshow** — ao voltar via "back button" no Safari, o bundle antigo é restaurado da memória.
5. Não há heartbeat periódico para detectar nova versão **durante** navegação (usuário deixa aba aberta o dia todo).

**Correção:**

1. **Reescrever o script de version-check em `index.html`:**
   - Trocar `sessionStorage v-check-done` por uma janela mínima (ex.: 60 s) usando `localStorage.last-version-check-ts`. Sempre re-checa após 60s.
   - Adicionar **timeout de 4s** ao `fetch('get-app-version')` via `AbortController` — se falhar, não bloqueia, mas tenta de novo na próxima navegação.
   - Adicionar listener `window.addEventListener('pageshow', e => { if (e.persisted) checkVersion() })` para invalidar bundle restaurado do bfcache do Safari.
   - Adicionar listener `document.addEventListener('visibilitychange', ...)` para re-checar versão quando a aba volta a ficar visível após >5min.

2. **Reforçar `public/_headers`:**
   - Adicionar regra catch-all para HTML servido em qualquer rota SPA (não só `/` e `/index.html`):
     ```
     /*.html
       Cache-Control: no-store, no-cache, must-revalidate, max-age=0
     ```
   - Adicionar `Clear-Site-Data` opcional na rota `/__force-refresh` (rota usada pelo botão emergencial, ver item 4).

3. **Hook global `useVersionWatcher`** carregado no `App.tsx`:
   - Faz polling leve a cada **5 minutos** (respeita o memory rule de 60s mínimo) na edge function `get-app-version`.
   - Se detectar versão nova, mostra toast persistente: *"Nova versão disponível. Atualizando em 5s..."* e força reload com `location.replace('/?_v=' + Date.now())` após limpar `caches` API.

4. **Botão emergencial de hard-refresh** (escondido, só ativado via console ou `?force=1` na URL):
   - Limpa `caches`, `localStorage` (preservando sessão Supabase), `sessionStorage`, faz `location.replace`.
   - Útil para suporte instruir usuário Comet/Safari por WhatsApp.

5. **Atualizar memory** `mem://infrastructure/anti-cache-policy-v3-0` para v4.0 documentando as 5 camadas (inline script, pageshow/bfcache, visibilitychange, polling de 5min, hard-refresh manual) e a cobertura específica para Safari macOS e Comet/Chromium.

---

## Arquivos alterados

```text
src/hooks/useOrderStatus.ts                              (Parte 1: remover action 'Enviar Vídeo')
src/components/settings/CompanyBrandSection.tsx          (Parte 2: lógica condicional + modo "só termo")
src/components/auth/registration/CompanyInfoSection.tsx  (Parte 2: DELETAR — órfão)
index.html                                               (Parte 3: version-check robusto + bfcache + visibilitychange)
public/_headers                                          (Parte 3: catch-all para *.html)
src/hooks/useVersionWatcher.ts                           (Parte 3: NOVO — polling 5min)
src/App.tsx                                              (Parte 3: instanciar useVersionWatcher uma vez)
mem://infrastructure/anti-cache-policy-v3-0              (Parte 3: bump para v4.0)
```

## Garantias

- **Parte 1:** Ver Detalhes intacto. Upload funciona normalmente dentro de `/anunciante/pedido/:id`.
- **Parte 2:** Quem já tem CNPJ + termo aceito não vê diferença. Quem tem CNPJ mas não assinou vê tela limpa só com o termo. Quem nunca preencheu vê o formulário atual.
- **Parte 3:** Safari macOS, Comet desktop, Chrome, Firefox e Safari iPhone passam a re-checar versão em 5 cenários (boot, retorno do bfcache, retorno de visibilidade, polling 5min, manual). Nenhum impacto perceptível em usuários já atualizados — fetch leve com timeout 4s.

Posso executar?