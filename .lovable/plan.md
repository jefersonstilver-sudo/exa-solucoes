

# Ajustes Finais Antes da Execução

## 1. Resposta sobre a logo

**Linha exata em `src/components/layout/header/HeaderLogo.tsx` (linha 13):**

```ts
const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=…';
```

**Diagnóstico:** É a logo com cores originais (vermelho/preto sobre transparente) — **não é versão branca pura**. Em fundo preto, o vermelho da logo se mistura com o glow vermelho da página (#EA251D ≈ vermelho da própria logo) e perde legibilidade.

**Solução padrão do projeto** (já usada em `ProviderBenefitChoice.tsx` linha 314, `BenefitPreview.tsx` linha 115, `MobileHeader.tsx` linha 27): aplicar `filter brightness-0 invert` na tag `<img>` para forçar versão 100% branca. Esse é o padrão consolidado do projeto, alinhado com a memory `mem://style/logo-ticker-standard-v4-0-final` ("logos obrigatoriamente em BRANCO via brightness-0 invert").

**Não preciso de URL nova.** Vou reusar `EXA_LOGO_URL` da `HeaderLogo.tsx` + filtro CSS:

```tsx
<img src={EXA_LOGO_URL} alt="EXA Mídia"
     className="h-12 w-auto filter brightness-0 invert
                drop-shadow-[0_0_24px_rgba(234,37,29,0.45)]" />
```

O `drop-shadow` com `--exa-red` recria o "drop shadow vermelho" do hero do HTML.

## 2. Confirmação variáveis CSS

**Sim, confirmo:** vou adotar variáveis CSS da paleta EXA.

No topo de `src/components/interesse-sindico/styles.css`:

```css
.exa-theme {
  --exa-red:   #EA251D;
  --exa-bordo: #5B090D;
  --exa-black: #0A0000;
  --exa-glow:  #FF3A30;
}
```

Container raiz da página:

```tsx
<div className="exa-theme font-inter min-h-screen bg-[var(--exa-black)] text-white">
```

**Em todos os componentes da pasta `interesse-sindico/`** uso exclusivamente `var(--…)`:

| ❌ Não vou usar | ✅ Vou usar |
|---|---|
| `bg-[#EA251D]` | `bg-[var(--exa-red)]` |
| `text-[#0A0000]` | `text-[var(--exa-black)]` |
| `border-[#EA251D]/20` | `border-[var(--exa-red)]/20` |
| `from-[#5B090D]` | `from-[var(--exa-bordo)]` |
| `shadow-[…rgba(234,37,29,0.4)]` | `shadow-[…var(--exa-glow)]/40` (onde Tailwind suportar) ou `rgb(from var(--exa-red) r g b / 0.4)` em CSS puro |

Para `box-shadow` complexo com múltiplas camadas (ex: shine do CTA, glow do play button), defino tudo em classes CSS dentro de `styles.css` usando `var(--exa-red)` / `var(--exa-glow)` — o JSX só aplica `className="play-button"`, sem hex inline.

**Ganho:** próximos prompts (formulário, sucesso, admin) podem reusar a mesma classe `exa-theme` no container e herdar a paleta automaticamente.

## 3. Resto do plano permanece igual

Mantidas todas as decisões do plano anterior aprovado:

- 10 arquivos novos em `src/pages/InteresseSindicoLanding.tsx` + `src/components/interesse-sindico/`
- 1 edição mínima em `src/routes/PublicRoutes.tsx` (rota pública)
- `LazyVideoPlayer.tsx` com `preload="none"` + `playsInline` + aspect nativo
- `framer-motion` para reveal scroll
- Inter 400-900 importada localmente no `styles.css`
- Sem `<Layout>`, sem header global, sem rodapé
- CTA final → `/interessesindico/formulario` (rota próximo prompt)
- Não toco em `/sou-sindico`, `index.css`, `tailwind.config.ts`, fluxo admin

## Diferenças vs plano anterior

| Item | Antes | Agora |
|---|---|---|
| Cores | `bg-[#EA251D]` inline | `bg-[var(--exa-red)]` via `.exa-theme` |
| Logo | URL direta sem filtro | `EXA_LOGO_URL` + `filter brightness-0 invert` + drop-shadow |
| Reaproveitamento | Específico desta página | Variáveis disponíveis para formulário/sucesso/admin |

Aguardo aprovação final para executar.

