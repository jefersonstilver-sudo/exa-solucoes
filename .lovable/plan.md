

# Plano: Criar pagina `/propostapassouganhou3029`

## Resumo

Criar uma nova pagina React standalone que replica fielmente o conteudo e design do HTML enviado (proposta Linkae x Passou Ganhou - FESPOP 2026). Pagina dark, premium, com 9 secoes completas.

## Arquivos a criar/editar

### 1. Criar `src/pages/public/PropostaPassouGanhou.tsx`

Pagina React completa com todas as 9 secoes do HTML:
- **Nav**: Sticky com glassmorphism, logos "PASSOU GANHOU" + "linkae"
- **Hero**: Full-height com gradientes purple/teal, headline "O Oeste do Paraná não paga mais.", stats (240k, R$18M, R$648k, 90 dias)
- **Secao 01 - Decisao**: Grid comparando Opcao A (R$350k) vs Opcao B Recomendada (R$500k), math box com calculos de MDR, tabela de patrocinio
- **Secao 02 - 2 Frentes**: Grid Pre-FESPOP vs FESPOP Ativacao com listas detalhadas
- **Secao 03 - Timeline**: 5 fases (Decisao+Base, Densidade, Autoridade, FESPOP, Pos-FESPOP) com action tags
- **Secao 04 - Stand**: 3 zone cards (Atracao, Engajamento, Ancoragem) com scripts
- **Secao 05 - Nurturing**: Flow D+0 a D+30 com mensagens e objetivos
- **Secao 06 - KPIs**: Grid 4x2 com metricas (400 downloads, 60% retencao, etc)
- **Secao 07 - Escopo**: Tabela de entregas mensais da Linkae
- **Secao 08 - Investimento**: Bloco central R$35.000/mes com modelo variavel
- **Secao 09 - Proximos Passos**: Tabela de acoes dos primeiros 7 dias
- **Assinatura**: Bloco com Linkae e Passou Ganhou
- **Footer**

Estilizacao via Tailwind usando as cores do HTML:
- Purple: `#5B2D91`, `#7B3DBB`
- Teal: `#3BBFA0`, `#2A9A82`
- Dark: `#080808`, `#111111`, `#161616`, `#222222`

Animacoes de entrada via Intersection Observer (useEffect + useRef).

### 2. Editar `src/App.tsx`

Adicionar rota publica:
```tsx
<Route path="/propostapassouganhou3029" element={
  <Suspense fallback={<GlobalLoadingPage />}>
    {React.createElement(lazy(() => import('./pages/public/PropostaPassouGanhou')))}
  </Suspense>
} />
```

Posicionar ANTES das rotas dinamicas `/:buildingSlug/:buildingCode` para evitar conflito.

## Detalhes tecnicos

- Pagina sem Layout/Header/Footer do EXA (design proprio, standalone)
- Fontes: usar Google Fonts (Syne + DM Sans) via `<Helmet>` ou link no index.html
- Sem SEO indexacao (`noindex, nofollow`)
- Scroll suave via CSS `scroll-behavior: smooth`
- Responsivo: grid collapsa para 1 coluna em mobile (< 768px)

