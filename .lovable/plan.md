

# Plano: Redesign Completo da Seção de Permuta + Reorganização da Página

## Resumo do Pedido

1. **Cards lado a lado** - "Valor do Pacote" e "Acordo de Permuta" no mesmo estilo do ExclusivityChoiceCard
2. **Texto explicativo automático** - Adicionar uma explicação abaixo da seção para o cliente entender claramente
3. **Reorganizar ordem dos elementos**:
   - Texto da proposta (ProposalSummaryText)
   - "Conheça a EXA Mídia" (mover para cima)
   - Período da Campanha
   - Locais Contratados (mover para cima)
   - Imagem âncora (ProductShowcaseCard)
   - Nova seção de escolha Permuta (lado a lado)
4. **Estilo minimalista corporativo** - Cores slate/vermelho (#9C1E1E) igual ao ExclusivityChoiceCard

---

## Design Visual Proposto

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔄 Modalidade de Pagamento                                                 │
│     Escolha como deseja formalizar esta parceria                            │
├───────────────────────────────────┬─────────────────────────────────────────┤
│  💵 VALOR MONETÁRIO               │  🤝 ACORDO DE PERMUTA  ✓ ESCOLHIDO      │
│  ────────────────────             │  ────────────────────                   │
│  Fidelidade                       │  Período                                │
│  R$ 10.234,00/mês                 │  18 meses                               │
│                                   │                                         │
│  À Vista (18x)                    │  Contrapartida                          │
│  R$ 184.212,00                    │  90x Tablet Android 24"                 │
│                                   │                                         │
│  Concorrentes podem               │  💰 Economia equivalente:               │
│  anunciar nos mesmos prédios      │  R$ 184.212,00 em mídia                 │
└───────────────────────────────────┴─────────────────────────────────────────┘
│  💡 TEXTO EXPLICATIVO AUTOMÁTICO                                            │
│  Esta proposta é um acordo de permuta/troca. Em vez de pagamento monetário, │
│  você fornece equipamentos ou serviços para a EXA Mídia. O valor de         │
│  referência mostra quanto você economizaria se fosse pagar em dinheiro.     │
│  Ambas as opções oferecem exatamente a mesma cobertura de mídia.            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Nova Ordem da Página (para propostas de Permuta)

| # | Seção | Status |
|---|-------|--------|
| 1 | Banner Cortesia | Mantém |
| 2 | Banner Status | Mantém |
| 3 | Aviso Validade | Mantém |
| 4 | Banner Múltiplas Marcas | Mantém |
| 5 | Resumo Rápido (grid métricas) | Mantém |
| 6 | **ProposalSummaryText** | Mantém |
| 7 | **"Conheça a EXA Mídia"** | **MOVER PARA CÁ** |
| 8 | Período da Campanha | Mantém |
| 9 | **Locais Contratados** | **MOVER PARA CÁ** |
| 10 | **ProductShowcaseCard (mockup)** | Mantém após Locais |
| 11 | Infográfico EXA | Mantém |
| 12 | **Cards Permuta (lado a lado)** | **NOVO DESIGN** |
| 13 | Botões de Ação | Mantém |
| 14 | Baixar PDF | Mantém |
| 15 | Contato Comercial | Mantém |

---

## Implementação Técnica

### Arquivo: `src/pages/public/PropostaPublicaPage.tsx`

#### Alteração 1: Substituir seção de permuta (linhas 2107-2257)

Novo componente inline seguindo o padrão do ExclusivityChoiceCard:

- Header: `bg-gradient-to-br from-[#9C1E1E] to-[#7D1818]` com ícone RefreshCw branco
- Container: `bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200`
- Card Monetário (esquerda): borda slate, cores slate
- Card Permuta (direita): `border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white` + badge "ESCOLHIDO"
- Texto explicativo no footer: `bg-slate-50 rounded-lg border border-slate-100`

#### Alteração 2: Mover "Conheça a EXA Mídia"

Mover bloco das linhas 2719-2772 para logo após ProposalSummaryText (linha ~1945).

#### Alteração 3: Mover "Locais Contratados"

Mover bloco das linhas 2400-2478 para antes do ProductShowcaseCard.

---

## Texto Explicativo Automático

O texto será dinâmico baseado nos dados da proposta:

```text
💡 Esta proposta é um acordo de permuta (troca). Em vez de pagamento em 
dinheiro, você fornece [descrição_contrapartida] para a EXA Mídia.

O "Valor Monetário" ao lado mostra quanto esta campanha custaria normalmente - 
você economiza [valor_referencia x meses] ao optar pela permuta.

Ambas as modalidades oferecem exatamente a mesma cobertura: [X] telas em 
[Y] prédios com [Z] exibições mensais durante [N] meses.
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/public/PropostaPublicaPage.tsx` | Redesign completo da seção de permuta + reorganização da ordem + texto explicativo |

---

## Checklist

- [ ] Criar novo design de permuta com grid 2 colunas igual ExclusivityChoiceCard
- [ ] Aplicar cores slate/vermelho corporativo (#9C1E1E)
- [ ] Adicionar badge "ESCOLHIDO" no card de permuta (pré-selecionado)
- [ ] Adicionar texto explicativo automático no footer da seção
- [ ] Mover "Conheça a EXA Mídia" para após ProposalSummaryText
- [ ] Mover "Locais Contratados" para antes do ProductShowcaseCard
- [ ] Testar em mobile (grid vira 1 coluna)
- [ ] Verificar se todos os dados de permuta (itens, valores) aparecem corretamente

