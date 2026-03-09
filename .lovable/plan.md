

# Criar Pedido Manual — Plano Reestruturado

## O que muda vs. plano anterior

O plano anterior tinha 4 etapas separadas e muita complexidade desnecessaria. Este plano usa **uma unica pagina com formulario em secoes colapsaveis** (accordion), mais direto, sem wizard multi-step.

## Fluxo simplificado

```text
Botao "Adicionar Pedido" (header)
        |
        v
  Dialog grande (Sheet lateral ou Dialog fullscreen)
        |
  ┌─────────────────────────────────────────────┐
  │  SECAO 1: Cliente                           │
  │  - Busca: CRM (users) / Proposta / Manual   │
  │  - Auto-preenche dados ao selecionar        │
  │  - Campos: nome, email, telefone, CPF/CNPJ  │
  │  - Botao "Criar/Ativar Conta" inline        │
  ├─────────────────────────────────────────────┤
  │  SECAO 2: Produto                           │
  │  - Select com produtos de produtos_exa      │
  │  - Mostra specs (resolucao, duracao, slots) │
  │  - Tipo: Horizontal / Vertical Premium      │
  ├─────────────────────────────────────────────┤
  │  SECAO 3: Configuracao do Pedido            │
  │  - Predios/paineis (multi-select)           │
  │  - Plano (meses), valor total               │
  │  - Data inicio/fim                          │
  │  - Metodo pagamento, status inicial         │
  │  - Upload de logo do cliente                │
  ├─────────────────────────────────────────────┤
  │  RESUMO + BOTAO CONFIRMAR                   │
  └─────────────────────────────────────────────┘
```

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/admin/orders/create/AdminCreateOrderDialog.tsx` | **Criar** — Dialog principal com as 3 secoes |
| `src/components/admin/orders/create/ClientSearchSection.tsx` | **Criar** — Busca em users + proposals com autocomplete |
| `src/components/admin/orders/create/ProductSelectSection.tsx` | **Criar** — Select de produto com specs |
| `src/components/admin/orders/create/OrderConfigSection.tsx` | **Criar** — Predios, plano, datas, logo, pagamento |
| `src/components/admin/orders/create/OrderSummary.tsx` | **Criar** — Resumo antes de confirmar |
| `src/hooks/useAdminCreateOrder.ts` | **Criar** — Logica de INSERT em pedidos + criacao de slots em pedido_videos + ativacao de conta |
| `src/components/admin/orders/OrdersCompactHeader.tsx` | **Modificar** — Adicionar item "Adicionar Pedido" no DropdownMenu |
| `src/pages/admin/OrdersPage.tsx` | **Modificar** — Adicionar botao mobile + estado do dialog |

## Logica de criacao (useAdminCreateOrder)

1. **Busca cliente**: query em `users` (ilike nome/email) e `proposals` (ilike client_name)
2. **Criar/ativar conta**: chama edge function `create-client-account` (novo) ou `admin-update-user` (existente, com `confirm_email: true`)
3. **Upload logo**: salva no bucket `arquivos/PAGINA PRINCIPAL LOGOS/`, atualiza `users.avatar_url`
4. **INSERT pedido**: na tabela `pedidos` com campos:
   - `client_id`, `client_name`, `email`
   - `tipo_produto` = codigo do produto selecionado (`horizontal` ou `vertical_premium`)
   - `lista_predios`, `lista_paineis`
   - `plano_meses`, `valor_total`, `data_inicio`, `data_fim`
   - `metodo_pagamento`, `status` (admin define: pendente/pago)
   - `created_by_admin` = auth.uid()
   - `proposal_id` se veio de proposta
5. **Criar slots**: INSERT em `pedido_videos` com N slots vazios baseado em `max_videos_por_pedido` do produto (com `video_id` placeholder vazio — precisa de um video placeholder ou `sem_slots_video = true`)

## Sem migrations necessarias

Todos os campos ja existem: `tipo_produto`, `created_by_admin`, `proposal_id`, `sem_slots_video` na tabela `pedidos`.

