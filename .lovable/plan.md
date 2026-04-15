

# Relatório de Exibição Estimada — Calcular Tempo Baseado no Status do Sistema

## Problema Atual
A tabela `video_playback_logs` está vazia porque os players externos (AWS) não reportam dados de volta. O relatório mostra 0s/0 exibições para todos os vídeos.

## Solução
Calcular **tempo estimado de exibição** baseado no estado do sistema:

```text
Para cada vídeo V em cada prédio B:
  1. tempo_ativo = agora - approved_at (ou data_inicio do pedido, o que for mais recente)
  2. total_videos_no_predio = todos os vídeos ativos/aprovados/em exibição no prédio B (de TODOS os pedidos)
  3. duracao_ciclo = soma da duração de todos os vídeos no prédio B
  4. share_do_video = duracao_V / duracao_ciclo
  5. horas_estimadas = tempo_ativo_horas × share_do_video × num_telas_predio
  6. exibicoes_estimadas = (tempo_ativo_segundos / duracao_ciclo) × num_telas_predio
```

Exemplo: Vídeo de 10s, 5 vídeos no prédio (ciclo = 50s), ativo há 24h, 1 tela:
- Share = 10/50 = 20%
- Horas = 24h × 0.2 = 4.8h
- Exibições = (86400s / 50s) × 1 = 1728

## Arquivo a Modificar

### `src/hooks/useVideoReportData.ts`

Substituir o bloco que hoje retorna 0 quando não há logs reais (linhas 294-311 e 386-401) por cálculo estimado:

1. **Buscar todos os vídeos ativos por prédio** — Para cada prédio do pedido, consultar quantos vídeos ativos/aprovados/em exibição existem (de todos os pedidos que incluem aquele prédio), com suas durações
2. **Calcular share de tempo** — `duracao_video / soma_duracoes_todos_videos_predio`
3. **Calcular horas estimadas** — Para cada prédio: `horas_desde_aprovacao × share × quantidade_telas`
4. **Calcular exibições estimadas** — Para cada prédio: `(segundos_ativos / duracao_ciclo_total) × quantidade_telas`
5. **Somar por vídeo** — Acumular horas e exibições de todos os prédios onde o vídeo roda
6. **Badge "Estimativa"** — Manter o badge amarelo "Estimativa" (já existe no código) quando usando dados estimados
7. **Respeitar agendamentos** — Se o vídeo tem regras de schedule, usar `calculateScheduledMinutesPerWeek` para ajustar o tempo proporcionalmente (não roda 24/7 se tem horários definidos)

### Lógica de Timeline (gráfico)
Atualizar o cálculo do `videoTimeline` para usar as horas estimadas acumuladas por dia, em vez de distribuir uniformemente um valor 0.

## Impacto
- Apenas `src/hooks/useVideoReportData.ts` será modificado
- Nenhuma migration necessária
- Nenhuma alteração de UI (os componentes de exibição já existem e mostram horas/exibições)
- Badge "Estimativa" já está implementado no `CampaignReportCard`

