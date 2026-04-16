

# Corrigir Exibição de Datas, Status de Dados e Adicionar Banner Beta

## Problemas Identificados

1. **"Período analisado: 16 dias"** — deveria mostrar as datas reais do período filtrado (ex: "17/03/2026 → 16/04/2026"), não só a contagem de dias
2. **"aguardando dados"** — o relatório de um dia só fica pronto 24h depois. Se há dias anteriores a hoje no período, deveria mostrar os dados disponíveis até ontem, não "aguardando dados". Precisa de um aviso explicando isso.
3. **Falta banner Beta** — aviso no topo da página informando que está em fase de testes

## Solução

### Arquivo 1: `src/hooks/useVideoReportData.ts`
- Adicionar `filteredStartDate` e `filteredEndDate` (strings ISO) ao interface `CampaignReport`
- Passar essas datas no objeto do campaign report (linhas 567-589)
- O `diasAtivos` continua como está, mas agora o card terá as datas para exibir

### Arquivo 2: `src/components/advertiser/CampaignReportCard.tsx`
- Substituir "Período analisado: X dias" por "Período: dd/mm/yyyy → dd/mm/yyyy (X dias)"
- Quando `isRealData === false`, em vez de badge "Estimativa", mostrar badge "Dados disponíveis até ontem" com tooltip explicando que relatórios ficam prontos 24h depois
- Remover o status "aguardando dados" genérico — se não há logs, mostrar "0" com nota explicativa

### Arquivo 3: `src/pages/advertiser/MyVideos.tsx`
- Adicionar banner Beta no topo da página com ícone de alerta:
  - Texto: "🧪 Esta página está em fase de testes (Beta). Os dados exibidos podem sofrer ajustes."
  - Estilo: bg-amber-50, border-amber-200, text-amber-800
- Passar `dateRange` para `CampaignReportCard` para exibição das datas do período

### Arquivo 4: `src/components/advertiser/VideoListItem.tsx`
- Quando `horasExibidas === 0` e `isDisplaying`, trocar "aguardando dados" por "Relatório disponível em 24h" — mais claro e informativo

## Detalhes Técnicos

### Interface CampaignReport (adição)
```text
+ filteredStartDate: string;  // ISO date string do início do período filtrado
+ filteredEndDate: string;    // ISO date string do fim do período filtrado
```

### Exibição no CampaignReportCard
```text
Antes:  "Período analisado: 16 dias"
Depois: "Período: 17/03/2026 → 16/04/2026 (16 dias)"
```

### Banner Beta
```text
┌──────────────────────────────────────────────────┐
│ 🧪 Página em fase de testes (Beta)              │
│ Os dados exibidos podem sofrer ajustes.          │
└──────────────────────────────────────────────────┘
```

## Impacto
- 4 arquivos modificados
- Nenhuma migration
- Sem mudança em funcionalidades existentes fora do relatório

