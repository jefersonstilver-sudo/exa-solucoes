## Objetivo
Permitir que o ticker de logos de clientes da home (`LogoTicker`) seja incorporado em qualquer site externo via `<iframe>`, sem alterar o ticker existente.

## Hoje
- Componente: `src/components/exa/LogoTicker.tsx`
- Dados: hook `useLogos` (lê `client_logos` no Supabase, já público via RLS)
- Usado em: `src/pages/Exa.tsx` (home), `SouSindico.tsx`, `PropostaPublicaPage.tsx`
- Não existe rota standalone nem HTML estático — é React puro animado por CSS keyframes.

## O que será feito

### 1. Nova página `src/pages/embed/LogosTickerEmbed.tsx`
- Renderiza **apenas** `<LogoTicker contained pauseOnHover={false} />`, sem header, sidebar, layout ou auth.
- Body com `background: transparent`, `margin: 0`, `overflow: hidden`.
- Altura responsiva (80–112px, igual à home).
- Sem PWA/splash/loaders globais.

### 2. Nova rota pública em `src/routes/PublicRoutes.tsx`
```
/embed/logos-ticker  →  LogosTickerEmbed
```
Sem auth guard. Sem redirect PWA.

### 3. Cabeçalhos para liberar iframe em qualquer domínio
Atualizar `public/_headers` adicionando regra específica para `/embed/*`:
```
/embed/*
  X-Frame-Options: ALLOWALL
  Content-Security-Policy: frame-ancestors *
```
(Remove qualquer X-Frame-Options DENY/SAMEORIGIN herdado para essa rota.)

### 4. Snippet de integração entregue ao usuário
```html
<iframe
  src="https://examidia.com.br/embed/logos-ticker"
  style="width:100%;height:112px;border:0;display:block;background:#7D1818"
  loading="lazy"
  title="Clientes EXA Mídia">
</iframe>
```

## Garantias
- **Zero mudança** no `LogoTicker.tsx`, `Exa.tsx`, ou qualquer página atual.
- **Mesmos dados** da home (mesmo hook `useLogos`, mesma tabela).
- **Atualização automática**: quando logos forem adicionadas/removidas no admin, o iframe reflete sem republicar nada no site externo.
- Aceita qualquer domínio (público).
- Sem parâmetros — visual fixo idêntico à home.

## Arquivos
- **Criar:** `src/pages/embed/LogosTickerEmbed.tsx`
- **Editar:** `src/routes/PublicRoutes.tsx` (adicionar 1 rota)
- **Editar:** `public/_headers` (regra `/embed/*`)
