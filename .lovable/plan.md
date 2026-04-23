

# Plano: Trigger de Sincronização Legado ↔ Novo

## Diagnóstico

Confirmado via query: a tabela tem **7 colunas legadas NOT NULL** que quebrariam o INSERT do formulário público:

| Legada (NOT NULL) | Nova (origem) |
|---|---|
| `nome_completo` | `sindico_nome` |
| `endereco` | `endereco_logradouro + numero + bairro + cidade/uf` |
| `numero_andares` | `quantidade_andares` |
| `numero_unidades` | `quantidade_unidades_total` |
| `email` | `sindico_email` |
| `celular` | `sindico_whatsapp` |
| `nome_predio` | já vem do formulário ✅ |

Extra: `responsavel_contato` (uuid, nullable) ↔ `responsavel_id` (uuid).

Tipos compatíveis (`responsavel_contato` é uuid — cast direto OK).

## Migration única

**Função `sync_sindico_legado()`** — `SECURITY DEFINER`, `search_path=public`, exatamente como você passou no script (cobre os 7 NOT NULL + responsável).

**Trigger `trg_sync_sindico_legado`** — `BEFORE INSERT OR UPDATE FOR EACH ROW`.

**Ordem dos triggers BEFORE na tabela** (importante):
- `trg_sync_sindico_legado` → preenche legadas a partir das novas
- `trg_validar_sindico` → valida `empresa_elevador` e `status`
- `update_sindicos_interessados_updated_at` → atualiza timestamp

Postgres executa BEFORE triggers em **ordem alfabética**: `trg_sync_…` roda antes de `trg_validar_…` ✅ (sem conflito).

## Teste de validação (em transação rollback — não persiste nada)

Executo dentro de `BEGIN; … ROLLBACK;` para garantir que **nenhum dado de teste fica no banco**:

```sql
BEGIN;
INSERT INTO sindicos_interessados (
  sindico_nome, nome_predio, endereco_logradouro, endereco_numero,
  endereco_bairro, endereco_cidade, endereco_uf, cep,
  quantidade_andares, quantidade_unidades_total, quantidade_elevadores_sociais,
  quantidade_blocos, internet_operadoras, empresa_elevador,
  sindico_cpf, sindico_whatsapp, sindico_email, sindico_mandato_ate,
  aceite_timestamp, aceite_ip, aceite_user_agent
) VALUES (
  'João Teste', 'Edifício Teste', 'Rua Exemplo', '123',
  'Centro', 'Foz do Iguaçu', 'PR', '85851-000',
  12, 48, 2, 1,
  ARRAY['Vivo','Ligga']::text[], 'Atlas',
  '000.000.000-00', '(45) 99999-9999', 'teste@teste.com', '2027-12-31',
  NOW(), '127.0.0.1', 'Mozilla Test'
)
RETURNING id, nome_completo, endereco, numero_andares, numero_unidades, email, celular;
ROLLBACK;
```

Mostro o resultado do RETURNING para você confirmar que o trigger preencheu corretamente as 6 colunas legadas. Como uso `ROLLBACK`, **não preciso do DELETE** — o registro nunca existe de verdade.

## Resultado esperado

```
nome_completo:    João Teste
endereco:         Rua Exemplo, 123 - Centro, Foz do Iguaçu/PR
numero_andares:   12
numero_unidades:  48
email:            teste@teste.com
celular:          (45) 99999-9999
```

## Garantias

- **Não toco** em UI, fluxo de propostas, contratos, monitoramento
- Trigger é **idempotente** — só preenche legada se estiver vazia (não sobrescreve dados antigos)
- `SECURITY DEFINER` + `search_path=public` conforme padrão do projeto
- Compatível com `SindicosTable.tsx` e `SindicoDetailsDialog.tsx` que ainda leem colunas antigas
- Teste em `ROLLBACK` — banco fica 100% limpo, sem registros de teste

## Arquivo

```
supabase/migrations/<novo>.sql — função + trigger + comentário
```

Após aprovar, executo a migration, rodo o teste em transação rollback, e te mostro o resultado do RETURNING para validação. Aguardo sua aprovação para a próxima fase (formulário público) só depois disso.

