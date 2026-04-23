

# Plano: Correções de Desktop e Scroll Duplicado em `/interessesindico`

## Diagnóstico do scroll duplicado

A página tem `overflow-x-hidden` no container raiz (`InteresseSindicoLanding.tsx`). Combinado com o wrapper global `<div className="min-h-screen bg-background">` em `App.tsx` (também com altura mínima total), o navegador renderiza barras nos dois níveis em alguns desktops. A correção é remover `overflow-x-hidden` do container e movê-lo para o `<body>` via classe nativa (já há controle global), OU substituir por `max-w-full` simples, deixando o `<html>` controlar o scroll vertical único.

Após inspeção: nenhuma seção tem `overflow-y` ou `h-screen` travada. O `HeroSection` já usa `min-h-screen` (correto). As 5 seções já têm `max-w-Xxl mx-auto` em containers internos, mas **os valores não escalam progressivamente** em desktop wide.

## Mudanças (6 arquivos, somente CSS/classes)

### 1. `src/pages/InteresseSindicoLanding.tsx`
- Remover `overflow-x-hidden` do raiz; manter apenas `min-h-screen w-full bg-[var(--exa-black)] text-white`.

### 2. `src/components/interesse-sindico/HeroSection.tsx`
- `<section>`: adicionar padding responsivo `px-5 md:px-8 lg:px-12`.
- Container interno do conteúdo central: `max-w-2xl lg:max-w-3xl` (já é `max-w-3xl` — ajustar para `max-w-2xl lg:max-w-3xl`).
- `<h1>`: trocar `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` por `text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight` (manter já tem leading/tracking; só ajustar escala).
- `<p>` subtítulo: `text-base md:text-lg lg:text-xl`.
- Logo `<img>`: trocar `h-12 md:h-14` por `h-12 md:h-14 lg:h-16` (usar height — `w-auto` mantém proporção; equivalente ao `w-28/32/40` solicitado).

### 3. `src/components/interesse-sindico/ProblemaSection.tsx`
- `<section>`: padding `px-5 md:px-8 lg:px-12 py-16 md:py-20 lg:py-28` (atualmente `py-20 md:py-28 px-6`).
- Container interno: trocar `max-w-4xl mx-auto` por `max-w-2xl lg:max-w-3xl mx-auto`.
- Wrapper do `LazyVideoPlayer`: trocar `max-w-3xl mx-auto` por `max-w-md md:max-w-lg lg:max-w-2xl mx-auto`.
- Títulos: `text-3xl md:text-4xl lg:text-5xl xl:text-6xl`.

### 4. `src/components/interesse-sindico/DemonstracaoSection.tsx`
- `<section>`: padding `px-5 md:px-8 lg:px-12 py-16 md:py-20 lg:py-28`.
- Container interno: `max-w-2xl lg:max-w-3xl mx-auto` (era `max-w-4xl`).
- Wrapper do vídeo vertical: trocar `max-w-[280px]` por `max-w-[280px] md:max-w-[320px] lg:max-w-[360px]`.
- Títulos: mesma escala progressiva.

### 5. `src/components/interesse-sindico/BeneficiosSection.tsx`
- `<section>`: padding `px-5 md:px-8 lg:px-12 py-16 md:py-20 lg:py-28`.
- Container já é `max-w-5xl mx-auto` — manter ✅.
- Cards `.benefit-card`: padding já é 2rem; reduzir levemente em mobile via classe `p-6 md:p-8` (sobrescrever o `padding: 2rem` do CSS removendo-o e migrando para Tailwind no JSX).
- Títulos: escala progressiva.

### 6. `src/components/interesse-sindico/ComoFuncionaSection.tsx`
- `<section>`: padding `px-5 md:px-8 lg:px-12 py-16 md:py-20 lg:py-28`.
- Container interno: `max-w-3xl mx-auto` (já está) ✅.
- CTA final `<Link>`: garantir `inline-flex` (não `w-full`) — verificar e manter alinhamento centralizado via `flex justify-center` no wrapper (já está) ✅.
- Títulos: escala progressiva.

### 7. `src/components/interesse-sindico/styles.css`
- `.benefit-card`: remover `padding: 2rem;` para deixar o Tailwind controlar via `p-6 md:p-8` no JSX.

## Garantias

- ✅ Sem alteração de conteúdo textual.
- ✅ Sem alteração nos vídeos (preload, aspect, autoplay vídeo 2 mantido).
- ✅ Sem alteração de rota.
- ✅ Sem mexer em `/sou-sindico` ou outras páginas.
- ✅ Sem alterar variáveis CSS `--exa-*`.
- ✅ Sem alterar framer-motion / `Reveal`.
- ✅ Apenas classes Tailwind responsivas + 1 remoção de padding em CSS.

## Teste de breakpoints
Após aplicar, faço screenshot em 390px, 768px, 1280px e 1920px e confirmo: scroll único, conteúdo respirando nas bordas, tipografia controlada, vídeos com tamanho proporcional.

Aguardo aprovação para executar.

