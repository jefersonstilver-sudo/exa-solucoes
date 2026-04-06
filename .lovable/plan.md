

# Plano: Limpar registros órfãos de agendamento e prevenir futuros

## Problema

O pedido `20b6e44d-e593-4c73-a74b-099d7e68e152` tem 3 registros órfãos na tabela `campaign_video_schedules` referenciando vídeos antigos ("Video 2", "video 3", "Video 4") que já foram removidos do `pedido_videos`. Esses registros geram falsos conflitos ao tentar agendar os vídeos atuais (KAMMER 1-4).

**Dados encontrados no banco:**

| Tabela | Vídeos |
|--------|--------|
| `pedido_videos` (atual) | KAMMER 1, kammer 2, KAMMER 3, KAMMER 4 |
| `campaign_video_schedules` (órfão) | Video 2, video 3, Video 4 |

A validação de conflitos (`videoScheduleValidationService.ts`) cruza os dados de `campaign_video_schedules` e encontra esses registros antigos como se fossem ativos.

## Solução (2 partes)

### Parte 1: Limpeza imediata via migration

Executar SQL para deletar os registros órfãos:
- Deletar `campaign_schedule_rules` cujo `campaign_video_schedule_id` pertence a schedules de vídeos que não existem mais em `pedido_videos` deste pedido.
- Deletar `campaign_video_schedules` órfãos.
- Deletar `campaigns_advanced` que ficarem sem schedules.

### Parte 2: Prevenção — Limpar schedules ao remover vídeo

Modificar o fluxo de remoção de vídeo (`removeVideo` em `useVideoManagement` ou serviço correspondente) para também deletar registros relacionados nas tabelas `campaign_video_schedules` e `campaign_schedule_rules` quando um vídeo é removido do pedido.

Alternativamente, adicionar uma validação no `videoScheduleValidationService.ts` para filtrar conflitos apenas de vídeos que ainda existem em `pedido_videos`.

## Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | **Criar** — limpar registros órfãos existentes |
| `src/services/videoScheduleValidationService.ts` | **Editar** — filtrar conflitos apenas para vídeos presentes em `pedido_videos` |

## Detalhes técnicos

Na função `validateScheduleConflicts` (linha ~270-310), ao buscar regras existentes via `campaign_schedule_rules`, adicionar um filtro para garantir que o `video_id` do `campaign_video_schedules` esteja presente na lista de `pedido_videos` aprovados do pedido. Isso evita falsos conflitos de vídeos que já foram removidos.

