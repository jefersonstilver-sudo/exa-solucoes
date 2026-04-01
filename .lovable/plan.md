

# Plano: Corrigir Sistema de Logs de Reprodução (Root Cause)

## Problema Raiz Identificado

A Edge Function `log-video-playback` **NÃO está registrada** no `supabase/config.toml`. Isso faz com que ela use `verify_jwt = true` por padrão. Como o player (MinimalDisplayPanel) roda em rota pública **sem autenticação**, toda chamada é rejeitada com 401 silenciosamente — por isso há **zero registros** na tabela `video_playback_logs` e zero logs na Edge Function.

## Correções

### 1. Registrar a Edge Function no config.toml

Adicionar a entrada com `verify_jwt = false` (TVs não autenticam):

```toml
[functions.log-video-playback]
verify_jwt = false
```

### 2. Tornar o logger mais resiliente (técnico do stack-overflow advisor)

Problema secundário: se o vídeo for interrompido por troca de fonte, swap, ou visibility change, o `onVideoEnd` nunca é chamado e o tempo se perde.

Correção no `usePlaybackLogger.ts`:
- Enviar **deltas incrementais** a cada 30s do vídeo que está tocando (não esperar o `onEnded`)
- Escutar `visibilitychange` e `pagehide` para flush antes de perder o contexto
- Ao trocar de vídeo (`onVideoStart` chamado novamente), fazer flush do vídeo anterior automaticamente

### 3. Remover FK constraints que bloqueiam inserts (menor prioridade)

A tabela tem FKs em `building_id` e `video_id` que fazem o insert falhar se o ID não existir exatamente na tabela referenciada. Para logs de auditoria, isso é excessivamente restritivo — remover as FKs e manter apenas os UUIDs como texto validado.

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | Adicionar `[functions.log-video-playback]` com `verify_jwt = false` |
| `src/hooks/usePlaybackLogger.ts` | Flush incremental a cada 30s + flush em visibilitychange/pagehide + flush automático ao trocar vídeo |
| Migration SQL | Remover FK constraints de `video_playback_logs` para evitar falhas de insert |

## O que NÃO muda
- MinimalDisplayPanel (já chama `onVideoStart`/`onVideoEnd` corretamente)
- Edge Function `log-video-playback` (código está correto)
- UI do relatório, cards, badges
- Nenhuma outra funcionalidade

