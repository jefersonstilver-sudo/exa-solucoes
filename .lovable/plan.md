

# Plano: Prédio não aparece na lista + novo status "Interno"

## Diagnóstico

O prédio "COMERCIAL TABLET" existe no banco (id `111059e1...`, `codigo_predio = '029'`) mas tem `imagem_principal = NULL`.

**Causa raiz**: O `buildingsAdminService.ts` filtra com `.not('imagem_principal', 'is', null)` — ou seja, exige que o prédio tenha foto para aparecer na lista admin. Isso está errado: no admin, todos os prédios devem aparecer independente de ter imagem.

O mesmo filtro existe em `AssignBuildingDialog.tsx`.

## Correções

### C-01: Remover filtro de imagem obrigatória no admin

**Arquivo**: `src/services/buildingsAdminService.ts`
- Remover a linha `.not('imagem_principal', 'is', null)` — prédios sem foto devem aparecer no painel admin
- Manter `.not('codigo_predio', 'is', null)` pois codigo_predio indica que foi cadastrado manualmente

**Arquivo**: `src/modules/monitoramento-ia/components/anydesk/AssignBuildingDialog.tsx`
- Mesmo ajuste: remover filtro de `imagem_principal` obrigatória

### C-02: Novo status "interno"

**Migration SQL**:
- Nenhuma constraint de enum existe na coluna `status` (é text livre, todos atualmente são `'ativo'`)
- Apenas garantir que a lógica da aplicação reconheça o status

**Comportamento do status "interno"**:
- Visível no admin (lista de prédios, agendamentos, manutenções)
- NUNCA aparece na loja pública — alterar a RPC `get_buildings_for_public_store` para excluir `interno` do `WHERE status IN (...)`
- Contabilizado nas stats admin como categoria própria

### C-03: Atualizar RPC pública para excluir "interno"

**Migration SQL**: Recriar `get_buildings_for_public_store` com `WHERE b.status IN ('ativo', 'instalação', 'instalacao')` — o status `interno` já não está incluído, mas vou adicionar um comentário explícito e garantir que nunca entre acidentalmente.

Também atualizar a RPC `get_buildings_for_authenticated_users` para excluir `interno` se ela for usada para exibição pública.

### C-04: Atualizar UI para reconhecer status "interno"

**Arquivos a atualizar**:
- `src/components/admin/buildings/form/BasicInfoForm.tsx` — adicionar opção "Interno" no select de status
- `src/components/admin/buildings/BuildingFilters.tsx` — adicionar filtro "Interno" 
- `src/components/admin/buildings/AdminBuildingsContentSection.tsx` — categorizar "interno" nas stats
- `src/components/admin/buildings/AdminBuildingCard.tsx` ou `BuildingCard` — badge visual para status "interno"
- `src/services/buildingsAdminService.ts` — incluir `interno` nos logs de contagem
- `src/hooks/useAdminBuildingsData.tsx` — contabilizar `interno` nas stats

### C-05: Validar `get_buildings_for_authenticated_users`

Verificar se essa RPC é usada para loja ou apenas para acesso admin. Se for usada em contextos públicos, excluir `interno`.

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/services/buildingsAdminService.ts` | Remover filtro `imagem_principal` obrigatória |
| 2 | `src/modules/monitoramento-ia/components/anydesk/AssignBuildingDialog.tsx` | Remover filtro `imagem_principal` |
| 3 | Migration SQL | Recriar RPC `get_buildings_for_public_store` com exclusão explícita de `interno` |
| 4 | Migration SQL | Recriar RPC `get_buildings_for_authenticated_users` excluindo `interno` |
| 5 | `src/components/admin/buildings/form/BasicInfoForm.tsx` | Opção "Interno" no select |
| 6 | `src/components/admin/buildings/AdminBuildingsContentSection.tsx` | Badge e contagem para "interno" |
| 7 | `src/hooks/useAdminBuildingsData.tsx` | Stats com categoria "interno" |

