# Plano: Página Pública `/catalogo-clientes` — Midia Kit EXA 2025

## Objetivo
Criar uma landing one-page pública (sem login, sem layout admin) que serve como Midia Kit interativo da EXA Mídia — arma de vendas para o time comercial enviar a leads.

## Entregáveis

### 1. Página React
- **Novo arquivo:** `src/pages/CatalogoClientes.tsx`
- Layout próprio fullscreen dark (não usa AdminLayout nem header padrão do site)
- Sem autenticação, sem PWA constraints (permite seleção de texto e scroll vertical livre)

### 2. Rota em `src/App.tsx`
- Adicionar `<Route path="/catalogo-clientes" element={<Suspense fallback={...}><CatalogoClientes /></Suspense>} />` junto às demais rotas públicas (próximo a `/portrasdamarca` ou `/loja`)
- Lazy import para não impactar o bundle inicial

### 3. SEO (react-helmet-async)
- Title: `Midia Kit 2025 | EXA Midia — Sua marca na rotina dele`
- Description conforme briefing
- Canonical `https://examidia.com.br/catalogo-clientes`
- OG image apontando para hero

### 4. Assets
Copiar imagens do HTML de referência (`midia-kit-exa-2025.html`) para `public/midia-kit/`:
- `hero.jpg` (mulher no elevador), `exa-player.jpg`, `logo-secovi.png`, screenshots da plataforma, 8 fotos de elevadores, QR Codes, `logo-exa-branca.png`
- Imagens ausentes → fallback com placeholder (gradiente vermelho/escuro + texto)
- Lazy loading em tudo abaixo do fold

## Estrutura da Página (22 seções)
Conforme briefing detalhado:
1. Navbar fixa (blur ao scroll)
2. Hero full-screen com métrica **40x/semana**
3. A Dor (texto com strikethrough)
4. A Ideia (grid 2 col)
5. Quem Somos (grid invertido + stats inline)
6. O Mecanismo (grid 2x2 cards)
7. Cinco Pilares
8. Métricas com countUp
9. Presença nos prédios (4 fotos 9:16)
10. **Catálogo dinâmico de prédios** (API live — ver técnico)
11. Performance (pills)
12. Vídeo Programável
13. Como Anunciar (4 passos)
14. Plataforma (carousel scroll-snap)
15. Verticais EXA
16. Perfil do Público
17. Para Quem (3 ICPs)
18. Portfolio Visual + CTAs WhatsApp
19. Parcerias (SECOVI)
20. Quote final
21. Contato CTA + QR Codes
22. Footer

## Detalhes Técnicos

### Design Tokens (escopo local da página)
Como o design system global usa HSL/Tailwind semantic tokens e essa página tem identidade visual própria muito específica (dark premium com vermelho EXA #E8000D, Barlow Condensed + DM Sans), aplicar os tokens via **CSS variables inline no escopo da página** (`<style>` injetado ou className container com vars):
- `--r: #E8000D`, `--bg: #07070c`, `--surf: rgba(255,255,255,.025)`, etc.
- Fontes Google via `<link>` no `<Helmet>` da página (Barlow Condensed + DM Sans, display=swap)
- Tailwind utilities + style inline quando necessário para fidelidade ao HTML de referência

### Catálogo Dinâmico (Seção 10)
- Endpoint **já existe**: `supabase.functions.invoke('catalogo-predios')` (ou fetch direto na URL pública). Confirmado: `supabase/functions/catalogo-predios` existe
- Hook `useEffect` + fetch com loading spinner
- Filtrar: `statusGroup IN ('ativo', 'instalacao')`
- Ordenação custom: Riverside → Royal Legacy → Miro → Provence → Viena → demais por `unidades DESC`
- Card: foto (4:3 cover) ou placeholder com iniciais, nome (Barlow uppercase), bairro, tags (unidades, andares, Airbnb destacado em #FF585D, Ativo vermelho)
- 3 stat cards no topo com countUp (Ativos / Unidades / Pessoas)
- **Fallback:** se API falhar → array hardcoded com 23 prédios (extraído do HTML de referência)

### Animações
- **Scroll reveal:** IntersectionObserver custom (fade-up 36px, delays escalonados) — mais leve que framer-motion para uma página tão longa
- **CountUp:** hook custom com `requestAnimationFrame` + easing cubic (já existe `useCounterAnimation` em `src/hooks/`)
- **Navbar:** state `scrolled` via scroll listener (throttle)
- **Grain overlay:** SVG noise inline com `opacity: 0.03`
- **Red glow:** divs decorativas com `radial-gradient` + `blur(160px)`

### Responsivo
- Mobile-first; grids colapsam para 1 col em `< md`
- Navbar mobile esconde links (só logo + CTA WhatsApp)
- Hero metric com `clamp(4rem, 15vw, 12rem)`
- Building grid: `repeat(auto-fill, minmax(240px, 1fr))`

### Performance
- Lazy load de todas as imagens abaixo do fold (`loading="lazy"`)
- Fonts com `display=swap`
- Edge function tem cache de 5min (respeitado)
- Página lazy-loaded no router

### Contatos
- WhatsApp principal: `https://wa.me/5545991415856`
- Jenni (Consultora): `https://wa.me/5545998323225`
- Email: `comercial@examidia.com.br`

## Arquivos Modificados
1. **Criar** `src/pages/CatalogoClientes.tsx` (~800-1000 linhas — página completa)
2. **Editar** `src/App.tsx` — adicionar lazy import + Route
3. **Criar** `public/midia-kit/` com os assets disponíveis (alguns podem precisar ser fornecidos depois — usar placeholders por enquanto)

## Fora de Escopo
- Não modificar nenhuma outra página, layout ou rota
- Não alterar a edge function `catalogo-predios` (já funcional)
- Não adicionar autenticação/RLS (página é 100% pública)
- Imagens não fornecidas usarão placeholders com gradiente — substituição posterior é trivial (drop nos paths esperados)

## Validação Final
- Acessar `/catalogo-clientes` em preview → ver hero, scroll completo, catálogo carregando da API real
- Console sem erros; network mostra request bem-sucedido para `catalogo-predios`
- Build passa sem warnings de TS

Quer que eu implemente?
