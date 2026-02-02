
# Plano: Corrigir Permuta + Venda Futura e Melhorar Auditoria

## Problema Identificado

Quando uma proposta combina **Permuta + Venda Futura**, os valores exibidos na página pública estão incorretos:

| Local | Valor Atual (Errado) | Valor Correto |
|-------|---------------------|---------------|
| Seção de Permuta - Telas | `realTotalPanels` (telas instaladas) | `displayPanelsCount` (telas contratadas) |
| Seção de Permuta - Exibições | `proposal.total_impressions_month` | `displayImpressions` (projetadas) |

**Exemplo:**
- Cliente contrata 50 prédios via Venda Futura
- Atualmente só existem 17 prédios instalados
- Sistema está mostrando 17 telas na permuta
- Deveria mostrar ~68 telas (50 prédios x 1.35)

---

## Correções Técnicas

### Arquivo 1: `src/pages/public/PropostaPublicaPage.tsx`

#### Linha 2142 - Telas na seção de permuta
**De:**
```typescript
<span>{realTotalPanels} telas</span>
```
**Para:**
```typescript
<span>{isVendaFutura ? displayPanelsCount : realTotalPanels} telas</span>
```

#### Linha 2147 - Exibições na seção de permuta
**De:**
```typescript
<span>{((proposal.total_impressions_month || 0)).toLocaleString()} exib./mês</span>
```
**Para:**
```typescript
<span>{displayImpressions.toLocaleString()} exib./mês</span>
```

---

### Arquivo 2: `src/pages/admin/proposals/NovaPropostaPage.tsx`

#### Melhorar texto copiado para Venda Futura + Permuta

Na função `handleCopyProposalText`, quando é permuta + venda futura, incluir os números corretos:

**Adicionar ao início da seção de PERMUTA (após linha 1244):**
```typescript
// Se é venda futura + permuta, mostrar números projetados
if (vendaFutura && prediosContratados > 0) {
  const telasProjetadas = telasContratadas !== null ? telasContratadas : Math.ceil(prediosContratados * 1.35);
  const exibicoesProjetadas = telasProjetadas * 11610;
  text += `
📊 MÉTRICAS DE VENDA FUTURA (Projetado)
• Prédios Contratados: ${prediosContratados}
• Telas Projetadas: ${telasProjetadas}
• Exibições Projetadas/mês: ${formatNumber(exibicoesProjetadas)}
`;
}
```

---

## Resultado Esperado

### Na Página Pública (Permuta + Venda Futura)
- **Antes:** "17 telas" (instaladas)
- **Depois:** "68 telas" (contratadas na venda futura)

### No Texto Copiado (Auditoria)
```text
💱 PERMUTA
────────────────────────────────────────────────────
• Modalidade: Permuta (não-monetária)

📊 MÉTRICAS DE VENDA FUTURA (Projetado)
• Prédios Contratados: 50
• Telas Projetadas: 68
• Exibições Projetadas/mês: 788.880

💰 VALOR DE REFERÊNCIA (Quanto Custaria em Dinheiro)
• Valor Mensal: R$ 1.500,00
• Total (12 meses): R$ 18.000,00

📦 CONTRAPARTIDA (Equipamentos/Serviços)
• Ocultar valores no público: Não
• Descrição: Tablets Android 24"

Itens de Permuta:
1. Tablet Android 24" Touchscreen (Qtd: 90) - R$ 1.500,00 cada = R$ 135.000,00

Valor Total Permuta: R$ 135.000,00
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/public/PropostaPublicaPage.tsx` | Usar `displayPanelsCount` e `displayImpressions` na seção de permuta quando é Venda Futura |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Incluir métricas de Venda Futura no texto copiado da permuta |

---

## Checklist

- [ ] Corrigir linha 2142 para usar `displayPanelsCount` quando `isVendaFutura`
- [ ] Corrigir linha 2147 para usar `displayImpressions`
- [ ] Adicionar seção de métricas de Venda Futura no texto copiado
- [ ] Testar: criar proposta Permuta + Venda Futura
- [ ] Verificar: página pública mostra números projetados
- [ ] Verificar: botão Copiar inclui métricas corretas
