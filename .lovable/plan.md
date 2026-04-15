

# Fix: Estimativa de exibição para vídeos agendados

## Problema encontrado no banco de dados

| Vídeo | is_active | selected_for_display | Agendamento | Resultado atual |
|-------|-----------|---------------------|-------------|-----------------|
| KAMMER 1 | true | true | **Nenhum** no DB | 728.9h (24/7) — ERRADO |
| kammer 2 | false | false | Ter+Sáb | 0s — ERRADO |
| KAMMER 3 | false | true | Dom+Qua | 0s — ERRADO |
| KAMMER 4 | false | false | Qui | 0s — ERRADO |

**Causa raiz:** O código de estimativa exige `is_active=true AND selected_for_display=true` para calcular horas. Vídeos agendados têm `is_active=false` porque só rodam em horários específicos — mas o código os ignora completamente.

**KAMMER 1:** Não tem entrada na tabela `campaign_video_schedules`, então aparece "24/7". Se deveria ter agendamento, precisa ser configurado no painel de gerenciamento.

## Solução

### `src/hooks/useVideoReportData.ts`

1. **Relaxar a condição de estimativa** — Considerar um vídeo como "em exibição estimada" se:
   - `approval_status = 'approved'` E
   - (`is_active=true AND selected_for_display=true`) **OU** (tem regras de agendamento ativas na tabela `campaign_schedule_rules`)

2. **Corrigir o scheduleInfo** — Vídeos com `is_active=false` mas com agendamento devem mostrar o badge do agendamento (ex: "Agendado: Ter, Sáb (dia todo)") em vez de "Não exibindo"

3. **Corrigir a query de playlist por prédio** — A query que busca todos os vídeos ativos no prédio (linhas 310-316) também filtra `is_active=true`, excluindo vídeos agendados do cálculo do ciclo. Precisa incluir vídeos com schedules.

4. **Ajustar a query de vídeos ativos para estimativa** — Buscar vídeos por prédio considerando: `(is_active=true AND selected_for_display=true) OR (tem schedule rules ativas)`

### Lógica atualizada

```text
Para cada vídeo:
  SE approved AND (is_active+selected_for_display OR tem_schedule_ativo):
    → Calcular horas estimadas usando scheduleFactor
    → Se tem schedule: scheduleFactor = minutos_agendados / minutos_semana
    → Se não tem schedule (24/7): scheduleFactor = 1
```

### `formatScheduleInfo` — Atualizar

Receber as schedule rules e verificar se existem, independente de `is_active`. Se tem regras ativas, mostrar o agendamento. Se não tem regras e `is_active=false`, mostrar "Não exibindo".

## Impacto
- Apenas `src/hooks/useVideoReportData.ts` será modificado
- Nenhuma migration
- Nenhuma alteração de UI

