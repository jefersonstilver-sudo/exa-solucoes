

# Plano: Adicionar 'interno' ao CHECK constraint do banco

## Problema
A tabela `buildings` tem um CHECK constraint `buildings_status_check` que lista os status válidos. O valor `'interno'` não está incluído, por isso o banco rejeita a atualização.

## Correção

### Migration SQL
Dropar e recriar o constraint incluindo `'interno'`:

```sql
ALTER TABLE public.buildings DROP CONSTRAINT buildings_status_check;
ALTER TABLE public.buildings ADD CONSTRAINT buildings_status_check 
  CHECK (status = ANY (ARRAY[
    'ativo', 'inativo', 'manutencao', 'instalacao', 'lead', 
    'subir_nuc', 'instalacao_internet', 'troca_painel', 
    'primeira_reuniao', 'visita_tecnica', 'interno'
  ]));
```

## Arquivos
| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | Migration SQL | Recriar `buildings_status_check` com 'interno' |

