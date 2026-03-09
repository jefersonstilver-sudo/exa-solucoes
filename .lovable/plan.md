

# Melhorias no Módulo de Criação Manual de Pedidos

## Problemas identificados

1. **Busca de propostas** não busca por `client_company_name` (nome da empresa), só por `client_name`
2. **Resultados de proposta** não mostram detalhes (tipo produto, duração, valor) — impossível distinguir propostas
3. **Botão "Ativar Conta"** aparece mesmo quando a conta já está ativada (deveria verificar `email_verified_at`)
4. **Selecionar proposta** não carrega automaticamente os prédios (`selected_buildings`) nem o tipo de produto
5. **Não há logs de auditoria** nas ações de adicionar/remover prédios do pedido

## Mudanças por arquivo

### 1. `src/hooks/useAdminCreateOrder.ts`
- **searchClients**: adicionar busca por `empresa_nome` além de `nome` e `email`; incluir `email_verified_at` no SELECT para saber se conta está ativa
- **searchProposals**: adicionar busca por `client_company_name`; incluir `selected_buildings`, `tipo_produto`, `duration_months`, `fidel_monthly_value`, `cash_total_value`, `number` no SELECT
- Exportar um campo `clientAccountActive: boolean` no formData para controlar visibilidade do botão "Ativar Conta"

### 2. `src/components/admin/orders/create/ClientSearchSection.tsx`
- **selectProposal**: ao selecionar proposta, preencher automaticamente:
  - `tipoProduto` da proposta
  - `listaPredios` extraído de `selected_buildings` (JSON com array de building IDs)
  - `planoMeses` de `duration_months`
  - `valorTotal` de `cash_total_value`
- **Resultados de proposta no dropdown**: mostrar badge com tipo produto, número da proposta, duração e valor — para identificar a proposta correta
- **Busca**: funcionar tanto por nome do cliente quanto por nome da empresa
- **Botão "Ativar Conta"**: só exibir quando `email_verified_at` é `null` (conta não ativada); esconder quando já ativada; mostrar badge verde "Conta Ativa" quando já confirmada
- **Botão "Criar Conta"**: só quando não existe `clientId` (sem conta no sistema)

### 3. `src/components/admin/orders/create/OrderConfigSection.tsx`
- Usar `useActivityLogger` para registrar cada adição/remoção de prédio no `user_activity_logs` com `entity_type: 'pedido'`, incluindo detalhes do prédio e da ação

### 4. `src/hooks/useAdminCreateOrder.ts` (submitOrder)
- Registrar log de criação do pedido via `user_activity_logs` com todos os detalhes

## Lógica de identificação de conta

```text
Busca por nome/email/empresa
        |
  Encontrou na tabela users?
        |
  SIM ──┬── email_verified_at != null → "Conta Ativa" (badge verde, sem botão)
        └── email_verified_at == null → Mostrar botão "Ativar Conta"
  NÃO → Mostrar botão "Criar Conta"
```

## Detalhes da proposta no dropdown

Cada resultado de proposta mostrará:
- Número (ex: EXA-2026-0019)
- Nome do cliente / empresa
- Badge: Horizontal ou Vertical Premium
- Duração (ex: 6 meses)
- Valor (ex: R$ 1.200,00)
- Status com cor

