
# Plano: Sincronização Automática de Saídas ASAAS e Melhorias no Modal de Vinculação

## Diagnóstico do Problema

### Causa Raiz
A função `sync-asaas-outflows` que sincroniza as transações de saída do ASAAS **não está sendo executada automaticamente**. Quando executei a função manualmente, ela sincronizou **9 novas transações**, aumentando de 2 para 11 registros na tabela `asaas_saidas`.

### Situação Atual
- A sincronização só ocorre quando o usuário clica em "Sincronizar ASAAS" na página de Lançamentos
- Não existe um CRON job configurado para executar essa sincronização periodicamente
- Os dados ficam desatualizados até que alguém execute manualmente

## Solução Proposta

### Fase 1: Adicionar Sincronização Automática via CRON

Configurar um CRON job no Supabase para executar a sincronização de saídas ASAAS a cada hora:

```sql
SELECT cron.schedule(
  'sync-asaas-outflows-hourly',
  '0 * * * *',  -- A cada hora
  $$
  SELECT net.http_post(
    url:='https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-asaas-outflows',
    headers:='{"Authorization": "Bearer ANON_KEY", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

### Fase 2: Adicionar Botão de Sincronização na Página Contas a Pagar

Atualmente, o botão de sincronização só existe na página de "Lançamentos". Adicionar um botão similar na página "Contas a Pagar" para que o usuário possa sincronizar diretamente dali:

**Localização**: No header da página, ao lado do botão "Atualizar"

```text
┌─────────────────────────────────────────────────────────────┐
│  Contas a Pagar                                             │
│  Gestão de despesas fixas e variáveis                       │
├─────────────────────────────────────────────────────────────┤
│  [Atualizar] [⟳ Sincronizar ASAAS] [+ Nova Conta]          │
└─────────────────────────────────────────────────────────────┘
```

### Fase 3: Melhorar Feedback no Modal de Pagamento

Adicionar indicador de "última sincronização" e botão de refresh no modal:

**Mudanças no PagarContaModal**:
1. Exibir quantas saídas estão disponíveis
2. Adicionar botão de atualização inline
3. Mostrar timestamp da última sincronização

```text
┌─────────────────────────────────────────────────────────────┐
│  Selecione uma saída não conciliada                         │
│  9 disponíveis • Última sync: há 5 min  [🔄 Atualizar]      │
├─────────────────────────────────────────────────────────────┤
│  ○ Transferência ASAAS - R$ 188,00 - 26/01                 │
│  ○ Transferência ASAAS - R$ 120,00 - 25/01                 │
│  ○ Certificados - R$ 710,00 - 17/01                         │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| SQL (via insert tool) | Criar CRON job para sincronização automática |
| `src/pages/admin/financeiro/ContasPagarPage.tsx` | Adicionar botão "Sincronizar ASAAS" |
| `src/components/admin/financeiro/contas-pagar/PagarContaModal.tsx` | Melhorar UX com contador e refresh inline |

## Resultado Esperado

1. **Sincronização automática** a cada hora mantém os dados atualizados
2. **Botão de sincronização** na página Contas a Pagar para atualizações manuais
3. **Feedback visual** no modal mostrando quantidade e opção de refresh
4. **Experiência melhorada** - usuário vê todos os lançamentos disponíveis para vinculação

## Considerações Técnicas

### Extensões Necessárias
- `pg_cron` - já habilitada
- `pg_net` - já habilitada (usada para HTTP requests)

### Impacto em Performance
- A sincronização processa em lotes de 100 registros
- Delay de 200ms entre chamadas evita rate limiting da API ASAAS
- Upsert por `asaas_id` evita duplicatas
