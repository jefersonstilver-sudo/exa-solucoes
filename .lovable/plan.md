

# Análise Profunda Final — Padronização Horizontal vs Vertical

Fiz uma varredura completa antes de executar. Encontrei **mais 8 pontos** que faltavam no plano anterior. Aqui está a versão consolidada e definitiva.

## Números oficiais (PDFs 2026)

| Métrica | Horizontal | Vertical Premium |
|---|---|---|
| Duração | 10s | 15s |
| Resolução | 1440×1080 | 1080×1920 |
| Proporção | 4:3 | 9:16 |
| Marcas/painel | até 15 | apenas 3 |
| Exibições/dia | **502** | **167** |
| Exibições/mês | **15.060** | **5.010** |
| Presença/dia | 83 min | 42 min tela cheia |
| Operação | 23h/dia | 23h/dia |
| Ciclo | 165s (15×10s + 1×15s) | 165s |

## Arquivos a modificar — lista COMPLETA

### Núcleo de dados (fonte de verdade)
1. `src/hooks/useExibicoesConfig.ts` — defaults 23h, 502/15.060
2. `src/hooks/useVideoSpecifications.ts` — defaults por tipo, presença diária, tempo ciclo
3. **Migration** — `produtos_exa` (durações + max_clientes) + `configuracoes_exibicao.horas_operacao_dia=23`

### Proposta pública
4. `src/components/public/proposal/TechnicalSpecsGrid.tsx` — números corretos por tipo
5. `src/components/public/proposal/ProductShowcaseCard.tsx` — diferenciação visual + badges
6. `src/components/public/proposal/ProposalSummaryText.tsx` — números no texto narrativo
7. `src/pages/public/PropostaPublicaPage.tsx` — cálculo `displayPanelsCount * (15060|5010)`

### PDF de proposta
8. `src/components/admin/proposals/ProposalPDFExporter.tsx` — fallbacks por tipo

### Admin
9. `src/pages/admin/proposals/PropostaDetalhesPage.tsx` — texto fixo
10. `src/components/admin/orders/create/ProductSelectSection.tsx` — verificar labels (NOVO)

### Landing pages
11. `src/components/paineis-landing/HeroSection.tsx` — "245 vezes" → "502 exibições"
12. `src/components/paineis-landing/FAQSection.tsx`
13. `src/components/paineis-landing/why-it-works/ResultSummary.tsx` — (NOVO, encontrado na varredura)
14. `src/components/exa/home/PorQueFuncionaSection.tsx`
15. `src/components/exa/home/NumerosSection.tsx` — verificar `useHomeMetrics` (NOVO)
16. `src/components/exa/SmartAdvertisingSection.tsx` — KPIs de "Resultados Comprovados" (NOVO)
17. `src/components/sou-sindico/HeroSection.tsx` — verificar números (NOVO)

### Checkout
18. `src/components/checkout/PlanSelectionContent.tsx` — `panelCount * 245 * 30` → `* 15060`
19. `src/components/order-confirmation/VideoRequirements.tsx` — (NOVO, instruções de vídeo)
20. `src/components/video-management/VideoInstructionsModal.tsx` — (NOVO, instruções)

### SEO / Schema
21. `src/components/seo/productSchemas.ts` — descrições dos 4 planos

## Diferenciação visual final na proposta

**Card Horizontal:**
```
🕐 10s · 📺 1440×1080 · 📐 4:3
👥 até 15 marcas · 📈 502 exib/dia · 🎯 15.060/mês
⏱ 83 min de presença/dia
Badge: "Volume + Frequência"
```

**Card Vertical Premium:**
```
🕐 15s · 📺 1080×1920 · 📐 9:16
👥 apenas 3 marcas · 📈 167 exib/dia · 🎯 5.010/mês
⏱ 42 min tela 100% sua
Badge: "Tela Cheia · Memória Absoluta"
```

## Garantias

- **Não toco** em: pagamento, RLS, contratos, fluxo de etapas, autenticação, video upload, agendamento
- **Não altero** UI fora dos números/labels listados
- Defaults antigos continuam como fallback se banco falhar
- Vertical e Horizontal terão números **claramente diferentes** em todos os pontos
- Componentes 10/13/15/16/17/19/20 só serão tocados se contiverem números desatualizados (verifico antes de editar — se já estiverem corretos via hook, ficam intactos)

## Ordem de execução

1. Migration (banco) → 2. Hooks (fonte) → 3. Proposta pública + PDF → 4. Admin → 5. Landing pages → 6. Checkout → 7. SEO

