# Auditoria do Logo Ticker da Home (`/`)

## O que verifiquei

1. **Renderização atual no preview** — capturei screenshot da home e o ticker está rodando: 6 logos visíveis (M ARK-SE, KAMUI, DuQuintal, SECOVI-PR, Portal da Cidade, Grupo Kammer, Shopping China…), todas em **branco**, em barra de altura `h-20 md:h-24 lg:h-28` sobre `bg-[#7D1818]`, animação infinita ativa.
2. **Banco de dados** — 14 logos `is_active = true`, todas `color_variant = 'white'`, com `scale_factor` variando de 1.0 a 3.5 (o que explica tamanhos diferentes entre logos — é proposital, configurável no admin).
3. **Console logs** — `✅ Logos fetched successfully: 14` (Edge Function `logos` respondendo OK).
4. **Memória do projeto** confirma o padrão: *"WHITE logos only on #7D1818, no scrollbars, 10-400% scale"*. O código atual cumpre.
5. **Histórico (git)** dos arquivos `LogoTicker.tsx` e `TickerLogoItem.tsx` — última alteração relevante foi no commit `45f1327b0` que separou `scale_factor` em `height/maxWidth` inline (em vez de transform), e o `brightness-0 invert` está presente desde o commit `0492b0631`.

## Diagnóstico — o que provavelmente você está vendo

Comparando seu screenshot (logos pequenas, algumas coloridas: Shopping China vermelho, Del Fuego laranja, SPLENDIDA cremoso) com o preview atual (todas brancas, tamanho correto):

- **O código está correto.** O filtro `brightness-0 invert` é aplicado em `TickerLogoItem.tsx:113` e funciona — o preview confirma.
- Seu screenshot parece ser de uma versão **em cache** (Safari/PWA) ou da **URL publicada antiga** (`exa-solucoes.lovable.app` / `examidia.com.br`) que ainda não recebeu o build atual.
- **Sintoma secundário real**: a Edge Function `logos` demora ~8 segundos para responder em cold start. Durante esse tempo aparece "Carregando logos…" sobre fundo `bg-white/5` (cinza translúcido) que destoa do `#7D1818` final — gerando a sensação de "ticker quebrado".

## O que proponho ajustar (apenas restauração visual, sem mexer em lógica)

### 1. Skeleton de loading consistente
- Trocar o fundo do skeleton de `bg-white/5` por `bg-[#7D1818]` (mesmo do ticker final), e remover o `container mx-auto px-4 lg:px-8` que limita largura — para o skeleton ocupar `w-screen` igual ao ticker real. Sem mais "flash" cinza.
- Texto "Carregando logos…" em `text-white/40` mantém discrição.

### 2. Forçar invalidação de cache no asset
- Confirmar que o build incrementa o hash do bundle (Vite faz por padrão). Não há mudança de código — apenas validação. Se o usuário ainda ver versão antiga, é cache do navegador/PWA.

### 3. Validar configuração do ticker no DB
- Listar as 14 logos ativas e seus `scale_factor`:
  ```
  Secovi logo                2.0
  Portal da cidae            2.7
  Grupo Kammer Logo branca   1.1
  shopping china             2.5
  splendida                  1.0
  Del Fuego restaurante      1.9
  pao supremo branco         1.4
  wizard                     1.3
  lolita                     3.1
  du quintal                 1.6
  kamui sem fundo            2.5
  ChatGPT Image (10/02 10h)  2.1
  ChatGPT Image (10/02 14h)  3.5
  logo (1)                   1.0
  ```
- **Nenhuma logo precisa de mudança**: estão todas `color_variant = 'white'` e ativas. O usuário pode ajustar `scale_factor` individual em `/admin/logos` se alguma estiver pequena demais (ex: `splendida` e `logo (1)` em 1.0 podem subir para 1.5–2.0).

### 4. Não mexer em (preservar como está)
- `bg-[#7D1818]` do `<section>` interno
- `brightness-0 invert` em todas as `<img>` do ticker
- `w-screen left-1/2 -translate-x-1/2` para full-bleed
- Animação `@keyframes logoTicker` infinita
- Posicionamento em `Exa.tsx` com `-mt-2 md:-mt-20 lg:-mt-28`

## Detalhe técnico

Arquivo a editar: **`src/components/exa/LogoTicker.tsx`** (apenas o bloco de skeleton, linhas 134–144). Nenhuma outra alteração.

```diff
- <section id="home-logo-ticker" aria-label="Marcas parceiras" className="relative container mx-auto px-4 lg:px-8">
-   <div className="ticker h-24 md:h-20 sm:h-16 relative overflow-hidden rounded-2xl bg-white/5 animate-pulse">
+ <section id="home-logo-ticker" aria-label="Marcas parceiras" className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-[#7D1818]">
+   <div className="ticker w-full h-20 md:h-24 lg:h-28 relative overflow-hidden bg-[#7D1818] animate-pulse">
      <div className="flex items-center justify-center h-full">
-       <div className="text-white/60 text-sm">Carregando logos...</div>
+       <div className="text-white/40 text-sm">Carregando logos...</div>
      </div>
    </div>
  </section>
```

## Pergunta antes de implementar

Você confirma que a versão que você quer restaurar é exatamente esta (logos brancas em `#7D1818`, alturas escaladas pelo `scale_factor` do admin, animação infinita)? Ou existia uma configuração anterior diferente (ex: altura fixa, sem `scale_factor` por logo) que você quer recuperar?