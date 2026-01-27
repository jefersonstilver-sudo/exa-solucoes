
# Plano: Sistema Avançado de Agendamento de Pagamentos

## Contexto Atual

O módulo "Contas a Pagar" já possui:
- **NovaDespesaModal**: Criação de despesas fixas e variáveis
- **PagarContaModal**: Registro de pagamento (manual ou vinculado ao ASAAS)
- **EditarContaModal**: Edição de valores, categoria, vencimento
- **Periodicidade básica**: semanal, mensal, trimestral, semestral, anual

## O Que Está Faltando

Com base na sua solicitação, as seguintes funcionalidades estão ausentes:

### 1. Agendamento do Primeiro Pagamento
- Definir data específica para o primeiro pagamento
- Escolher se o pagamento será à vista ou parcelado
- Definir número de parcelas (se aplicável)

### 2. Configuração de Recorrência Avançada
- **Semanal**: Já existe, mas sem opção de escolher dias específicos
- **Semestral**: Já existe como periodicidade
- **Personalizado**: Falta opção de definir intervalo customizado (ex: a cada 45 dias)

### 3. Opções Adicionais
- Pausa automática após X pagamentos
- Lembrete antes do vencimento
- Reajuste automático (IPCA, IGP-M, valor fixo)

---

## Solução Proposta

### Fase 1: Atualizar Schema do Banco de Dados

Adicionar novas colunas à tabela `despesas_fixas`:

```sql
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS total_parcelas INTEGER;
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER DEFAULT 0;
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS recorrencia_tipo TEXT; -- 'infinita', 'limitada', 'personalizada'
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS intervalo_dias INTEGER; -- para recorrência personalizada
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS dias_semana TEXT[]; -- para semanal (ex: ['seg', 'qui'])
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS lembrete_dias INTEGER DEFAULT 3;
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS reajuste_tipo TEXT; -- 'nenhum', 'ipca', 'igpm', 'fixo'
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS reajuste_percentual DECIMAL(5,2);
```

### Fase 2: Atualizar NovaDespesaModal

**Seção "Configuração de Recorrência":**

```text
┌─────────────────────────────────────────────────────────────┐
│  🔄 Configuração de Recorrência                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tipo de Recorrência:                                       │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐                  │
│  │ Infinita│ │ Limitada│ │ Personalizada│                  │
│  └─────────┘ └─────────┘ └──────────────┘                  │
│                                                             │
│  Frequência:                                                │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Semanal │ │ Mensal  │ │ Semestral│ │ Anual    │        │
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘        │
│                                                             │
│  [Se Limitada]                                              │
│  Número de Parcelas: [___12___]                            │
│                                                             │
│  [Se Personalizada]                                         │
│  A cada [___45___] dias                                     │
│                                                             │
│  [Se Semanal]                                               │
│  Dias da Semana:                                            │
│  ☑ Seg  ☐ Ter  ☐ Qua  ☑ Qui  ☐ Sex  ☐ Sáb  ☐ Dom         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📅 Primeiro Pagamento                                      │
│                                                             │
│  Data de Início: [____27/01/2026____]                      │
│                                                             │
│  Lembrete: [__3__] dias antes do vencimento                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📈 Reajuste Automático (opcional)                          │
│                                                             │
│  Tipo: ┌──────────┐                                         │
│        │ Nenhum ▼ │  (Nenhum / IPCA / IGP-M / Fixo)        │
│        └──────────┘                                         │
│                                                             │
│  [Se Fixo]                                                  │
│  Percentual anual: [___5___] %                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 3: Atualizar PagarContaModal

**Adicionar opção de agendar pagamento futuro:**

```text
┌─────────────────────────────────────────────────────────────┐
│  💳 Registrar Pagamento                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Ação:                                                      │
│  ┌──────────────────┐ ┌──────────────────┐                 │
│  │ ✓ Pagar Agora    │ │ 📅 Agendar       │                 │
│  └──────────────────┘ └──────────────────┘                 │
│                                                             │
│  [Se Agendar]                                               │
│  Data do Pagamento Agendado: [____30/01/2026____]          │
│  Horário (opcional): [__09:00__]                            │
│                                                             │
│  ☐ Marcar como pago automaticamente na data                │
│  ☐ Apenas lembrar-me na data                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 4: Atualizar ContaDetalhesDrawer

**Exibir informações de recorrência:**

```text
┌─────────────────────────────────────────────────────────────┐
│  📊 Resumo da Recorrência                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tipo: Mensal (Limitada)                                    │
│  Parcelas: 8 de 12 pagas                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 66%                          │
│                                                             │
│  Próximo vencimento: 10/02/2026                             │
│  Valor: R$ 1.500,00                                         │
│                                                             │
│  Reajuste: IPCA (aplicado anualmente)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/...` | Adicionar novas colunas para recorrência avançada |
| `src/components/admin/financeiro/NovaDespesaModal.tsx` | Adicionar seção de configuração de recorrência |
| `src/components/admin/financeiro/contas-pagar/PagarContaModal.tsx` | Adicionar opção de agendar pagamento |
| `src/components/admin/financeiro/contas-pagar/EditarContaModal.tsx` | Permitir edição de configurações de recorrência |
| `src/components/admin/financeiro/contas-pagar/ContaDetalhesDrawer.tsx` | Exibir resumo de recorrência e progresso |
| `src/pages/admin/financeiro/ContasPagarPage.tsx` | Adicionar filtro por tipo de recorrência |

---

## Fluxo de Uso Esperado

### Criar Nova Despesa com Recorrência Limitada:
1. Usuário clica em "Nova Conta"
2. Preenche descrição, valor, categoria
3. Seleciona **Tipo de Recorrência: Limitada**
4. Define **12 parcelas**
5. Escolhe **Frequência: Mensal**
6. Define **Primeiro Pagamento: 10/02/2026**
7. Sistema gera 12 parcelas automaticamente

### Criar Despesa Personalizada:
1. Seleciona **Tipo de Recorrência: Personalizada**
2. Define **A cada 45 dias**
3. Sistema calcula próximas datas automaticamente

### Agendar Pagamento:
1. Usuário clica em uma conta pendente
2. Clica em "Pagar"
3. Seleciona **Agendar**
4. Define data futura (ex: 30/01/2026)
5. Conta fica com status "Agendado" até a data

---

## Considerações Técnicas

### Geração de Parcelas
- Trigger no banco ou Edge Function para gerar parcelas baseado na configuração
- Para recorrência "infinita", gerar apenas 12 meses à frente (rolling window)

### Status de Pagamento
- Novo status: `agendado` (além de `pendente`, `pago`, `atrasado`)
- CRON job para verificar pagamentos agendados e marcar como pagos automaticamente

### Reajustes
- Aplicar reajuste anualmente na data de aniversário da despesa
- Registrar histórico de reajustes para auditoria
