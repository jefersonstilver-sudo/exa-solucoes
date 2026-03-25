

# Plano: Agrupamento de Pedidos

## Resumo
Criar um sistema de grupos nomeados para pedidos, disponivel tanto na area do anunciante quanto no admin. Cada pedido pertence a no maximo um grupo. A interface permite drag & drop e menu no card para mover pedidos entre grupos.

## 1. Nova tabela: `pedido_grupos`

```sql
CREATE TABLE public.pedido_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cor text DEFAULT '#6B7280',
  ordem int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pedido_grupos ENABLE ROW LEVEL SECURITY;

-- Anunciante ve seus proprios grupos
CREATE POLICY "Users can manage own groups"
  ON public.pedido_grupos FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin ve todos
CREATE POLICY "Admins can view all groups"
  ON public.pedido_grupos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

## 2. Nova coluna em `pedidos`

```sql
ALTER TABLE public.pedidos ADD COLUMN grupo_id uuid REFERENCES public.pedido_grupos(id) ON DELETE SET NULL;
```

Quando um grupo e excluido, os pedidos voltam para "Sem grupo" (NULL).

## 3. Hook `useOrderGroups`

- `src/hooks/useOrderGroups.ts`
- CRUD de grupos (criar, renomear, excluir, reordenar)
- Mover pedido para grupo (`UPDATE pedidos SET grupo_id = ?`)
- Listener realtime na tabela `pedido_grupos`

## 4. UI - Area do Anunciante (`AdvertiserOrders.tsx`)

- Adicionar toggle "Agrupar" no header de filtros
- Quando ativo, renderizar pedidos organizados por grupo com headers colapsaveis
- Seção "Sem grupo" para pedidos sem grupo_id
- Botao "+" para criar novo grupo (dialog simples com nome e cor)
- Drag & drop entre grupos usando `@dnd-kit/core` (ou implementação simples com HTML5 drag)

## 5. UI - Menu no Card (`AdvertiserOrderCard.tsx`)

- Adicionar item "Mover para grupo" no menu de acoes do card
- Submenu com lista de grupos existentes + opcao "Novo grupo"
- Ao selecionar, atualiza `grupo_id` do pedido

## 6. UI - Area Admin (`OrdersTabsRefactored.tsx`)

- Mesmo toggle de agrupamento
- Admin ve grupos de todos os clientes, agrupados por cliente > grupo

## 7. Componentes novos

- `src/components/orders/OrderGroupHeader.tsx` — header colapsavel com nome do grupo, cor, contagem, botoes editar/excluir
- `src/components/orders/MoveToGroupMenu.tsx` — dropdown/submenu reutilizavel para mover pedido
- `src/components/orders/CreateGroupDialog.tsx` — dialog para criar/editar grupo (nome + cor)

## Arquivos alterados

1. Migration SQL — nova tabela + coluna
2. `src/hooks/useOrderGroups.ts` (novo)
3. `src/pages/advertiser/AdvertiserOrders.tsx` — toggle + renderização agrupada
4. `src/components/advertiser/orders/AdvertiserOrderCard.tsx` — menu "Mover para grupo"
5. `src/components/orders/OrderGroupHeader.tsx` (novo)
6. `src/components/orders/MoveToGroupMenu.tsx` (novo)
7. `src/components/orders/CreateGroupDialog.tsx` (novo)
8. `src/components/admin/orders/OrdersTabsRefactored.tsx` — suporte a agrupamento no admin

