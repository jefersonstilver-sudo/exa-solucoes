
# Plano: Propostas Não-Monetárias (Permuta) com Lista de Equipamentos

## Contexto e Objetivo

O sistema atual de propostas suporta apenas valores monetários (R$ X/mês). A solicitação é criar uma modalidade alternativa onde:

1. O cliente oferece **equipamentos** em troca de mídia (permuta)
2. Cada equipamento tem um **custo estimado** (visível internamente, ocultável na proposta pública)
3. Adicionar **métodos de pagamento alternativos** como "Permuta", "Patrocínio", "Cortesia Estratégica"

---

## Arquitetura da Solução

### Novos Campos na Tabela `proposals`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `modalidade_proposta` | text | 'monetaria' (padrão) ou 'permuta' |
| `itens_permuta` | jsonb | Lista de equipamentos: `[{ nome, quantidade, preco_unitario, preco_total, ocultar_preco }]` |
| `valor_total_permuta` | numeric | Soma total dos itens (para referência interna) |
| `ocultar_valores_publico` | boolean | Se true, esconde todos os preços na proposta pública |
| `descricao_contrapartida` | text | Texto livre descrevendo a contrapartida (ex: "Fornecimento de tablets") |
| `metodo_pagamento_alternativo` | text | 'permuta', 'patrocinio', 'cortesia_estrategica', null (padrão) |

### Estrutura do Item de Permuta (JSON)

```typescript
interface ItemPermuta {
  id: string;           // UUID para identificação
  nome: string;         // Ex: "Tablet Samsung Galaxy Tab A8"
  descricao?: string;   // Detalhes opcionais
  quantidade: number;   // Ex: 50
  preco_unitario: number; // Ex: 899.00
  preco_total: number;  // Calculado: quantidade × preço unitário
  ocultar_preco: boolean; // Se true, esconde este item específico na proposta pública
}
```

---

## Parte 1: Migração do Banco de Dados

```sql
-- Adicionar novos campos à tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS modalidade_proposta text DEFAULT 'monetaria',
ADD COLUMN IF NOT EXISTS itens_permuta jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS valor_total_permuta numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ocultar_valores_publico boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS descricao_contrapartida text,
ADD COLUMN IF NOT EXISTS metodo_pagamento_alternativo text;

-- Constraint para validar modalidade
ALTER TABLE proposals 
ADD CONSTRAINT proposals_modalidade_check 
CHECK (modalidade_proposta IN ('monetaria', 'permuta'));

-- Constraint para métodos alternativos
ALTER TABLE proposals 
ADD CONSTRAINT proposals_metodo_alternativo_check 
CHECK (metodo_pagamento_alternativo IS NULL OR metodo_pagamento_alternativo IN ('permuta', 'patrocinio', 'cortesia_estrategica', 'institucional'));
```

---

## Parte 2: Interface Administrativa (NovaPropostaPage.tsx)

### 2.1 Toggle de Modalidade da Proposta

Adicionar um seletor no topo da seção "Período e Valores":

```
┌─────────────────────────────────────────────────────────────┐
│  💰 Tipo de Proposta                                        │
│                                                             │
│   [ 💵 Monetária ]  [ 🔄 Permuta/Equipamentos ]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Seção de Equipamentos (quando Permuta selecionada)

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Equipamentos Ofertados                                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tablet Samsung Galaxy Tab A8                        │  │
│  │  Qtd: 50  ×  R$ 899,00  =  R$ 44.950,00  [👁️] [🗑️]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Suporte de Parede Articulado                        │  │
│  │  Qtd: 50  ×  R$ 120,00  =  R$ 6.000,00   [👁️] [🗑️]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│           [ + Adicionar Equipamento ]                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  VALOR TOTAL ESTIMADO:                    R$ 50.950,00      │
│                                                             │
│  [ ] Ocultar valores na proposta pública                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Descrição da Contrapartida

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Descrição da Contrapartida                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Fornecimento de 50 tablets Samsung Galaxy Tab A8     │  │
│  │ com suportes de parede para instalação nas           │  │
│  │ portarias dos prédios, substituindo equipamentos     │  │
│  │ obsoletos.                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 3: Proposta Pública (PropostaPublicaPage.tsx)

### 3.1 Exibição Condicional

Quando `modalidade_proposta === 'permuta'`:

- **Remover**: Seção de pagamento PIX/Boleto/Cartão
- **Mostrar**: Seção de "Contrapartida Acordada"
- **Esconder valores** se `ocultar_valores_publico === true`

### 3.2 Layout da Proposta Pública (Permuta)

```
┌─────────────────────────────────────────────────────────────┐
│                  🤝 PROPOSTA DE PARCERIA                    │
│                                                             │
│              Torre Azul, Edifício Central...                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📦 CONTRAPARTIDA ACORDADA                                  │
│                                                             │
│  • Tablet Samsung Galaxy Tab A8 (50 unidades)              │
│  • Suporte de Parede Articulado (50 unidades)              │
│                                                             │
│  "Fornecimento de equipamentos para modernização           │
│   das portarias dos prédios parceiros."                     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📅 PERÍODO: 12 meses                                       │
│  📺 TELAS: 17 telas em 12 prédios                          │
│                                                             │
│         [ ✅ Aceitar Parceria ]  [ ❌ Recusar ]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 4: Fluxo de Aceitação (Permuta)

Quando o cliente aceita uma proposta de permuta:

1. **Status**: Atualiza para `aceita`
2. **Contrato**: Gera contrato com cláusulas de permuta
3. **Sem pagamento**: Pula toda a etapa de pagamento
4. **Notificação**: Envia alerta para vendedor sobre aceitação

---

## Arquivos a Modificar

| Arquivo | Modificações |
|---------|--------------|
| `NovaPropostaPage.tsx` | Adicionar toggle de modalidade, seção de equipamentos, checkbox de ocultar valores |
| `PropostaPublicaPage.tsx` | Lógica condicional para exibir permuta, esconder pagamentos |
| `ProposalMobileCard.tsx` | Badge indicando "Permuta" em propostas não-monetárias |
| `PropostasPage.tsx` | Filtro por modalidade, exibição diferenciada |
| `PropostaDetalhesPage.tsx` | Mostrar lista de equipamentos e valores internos |

---

## Estados do React (NovaPropostaPage.tsx)

```typescript
// Novos estados para permuta
const [modalidadeProposta, setModalidadeProposta] = useState<'monetaria' | 'permuta'>('monetaria');
const [itensPermuta, setItensPermuta] = useState<ItemPermuta[]>([]);
const [ocultarValoresPublico, setOcultarValoresPublico] = useState(false);
const [descricaoContrapartida, setDescricaoContrapartida] = useState('');
const [metodoPagamentoAlternativo, setMetodoPagamentoAlternativo] = useState<string | null>(null);

// Cálculo do valor total
const valorTotalPermuta = useMemo(() => {
  return itensPermuta.reduce((sum, item) => sum + item.preco_total, 0);
}, [itensPermuta]);
```

---

## Diferenças Visuais na Listagem

### Proposta Monetária (atual)
```
EXA-2026-1234  |  Cliente ABC  |  R$ 4.798,00/mês  |  12M  |  pendente
```

### Proposta Permuta (nova)
```
EXA-2026-1235  |  Cliente XYZ  |  🔄 Permuta (R$ 50.950 interno)  |  12M  |  pendente
```

O valor interno só aparece para admins, nunca na proposta pública (se ocultado).

---

## Benefícios da Solução

1. **Flexibilidade**: Suporta tanto vendas monetárias quanto permutas
2. **Transparência interna**: Valores de custo visíveis apenas para o time
3. **Privacidade externa**: Cliente vê apenas a lista de itens (sem preços)
4. **Rastreabilidade**: Histórico completo de equipamentos acordados
5. **Integração com contratos**: Cláusulas específicas para permuta

---

## Estimativa de Implementação

- **Migração DB**: ~10 minutos
- **NovaPropostaPage.tsx**: ~150 linhas de código
- **PropostaPublicaPage.tsx**: ~80 linhas de código
- **Componentes auxiliares**: ~50 linhas
- **Listagem/Detalhes**: ~40 linhas
