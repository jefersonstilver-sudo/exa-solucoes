

# Plano: Corrigir exclusão de prédios bloqueada por foreign keys

## Diagnóstico

O erro `"update or delete on table 'buildings' violates foreign key constraint 'devices_building_id_fkey' on table 'devices'"` ocorre porque **5 tabelas** têm foreign keys para `buildings` sem `ON DELETE` definido (default = RESTRICT, que bloqueia a exclusão):

| Tabela | FK | ON DELETE atual |
|--------|-----|----------------|
| `devices` | `building_id` | RESTRICT (bloqueia) |
| `client_behavior_analytics` | `most_viewed_building_id` | RESTRICT (bloqueia) |
| `despesas_fixas` | `building_id` | RESTRICT (bloqueia) |
| `despesas_variaveis` | `building_id` | RESTRICT (bloqueia) |
| `tasks` | `building_id` | RESTRICT (bloqueia) |

As outras 11 FKs já têm `CASCADE` ou `SET NULL` e funcionam corretamente.

## Correção

### Migration SQL

Dropar e recriar as 5 foreign keys com `ON DELETE SET NULL` (desvincula o registro sem apagá-lo):

```sql
ALTER TABLE devices DROP CONSTRAINT devices_building_id_fkey;
ALTER TABLE devices ADD CONSTRAINT devices_building_id_fkey 
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;

-- Repetir para as outras 4 tabelas
```

Usar `SET NULL` (não CASCADE) porque:
- Devices, tasks, despesas devem continuar existindo mesmo sem o prédio
- Apenas o vínculo é removido

### Melhoria no código de exclusão

**Arquivo**: `src/services/buildingsOperationsService.ts`
- Antes de deletar o prédio, desvincular devices explicitamente (set `building_id = null`)
- Adicionar tratamento de erro mais claro para o usuário

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | Migration SQL | Recriar 5 FKs com `ON DELETE SET NULL` |
| 2 | `src/services/buildingsOperationsService.ts` | Desvincular dependências antes de deletar |

