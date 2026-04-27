## Diagnóstico confirmado

3 devices estão "fantasmas online" no sistema porque a API do AnyDesk parou de retorná-los há ~3 meses, mas o `sync-anydesk` só faz UPSERT do que vem na resposta — nunca marca como offline o que sumiu:

| Device | AnyDesk ID | Último sync real | Status atual no DB |
|---|---|---|---|
| Di Cavalcante | 1217746313 | 30/jan/2026 | "online" 🟢 (errado) |
| Esmeralda 1 | 1470796265 | 22/jan/2026 | "online" 🟢 (errado) |
| Esmeralda 2 | 1974596809 | 22/jan/2026 | "online" 🟢 (errado) |

---

## Diretriz do usuário (regra permanente)

1. Devices que **somem da API do AnyDesk** devem ser marcados como **offline desde a data do último sync real** — nunca mais aparecer como online.
2. **Nunca remover automaticamente** do sistema. Só o administrador pode excluir manualmente.
3. Aplica a TODOS os devices, não só esses 3.

---

## Plano de implementação

### 1. Atualizar `supabase/functions/sync-anydesk/index.ts`
Após o loop que processa os clientes retornados pela API, adicionar bloco final:

- Buscar todos os devices ativos (`is_deleted = false`) que **não apareceram** na resposta da API neste ciclo.
- Para cada um:
  - Se `status != 'offline'` → forçar `status = 'offline'`
  - Setar `last_online_at = (valor atual)` se ainda não tiver — **não sobrescrever** se já existe (preserva data real do último online)
  - Setar `metadata.stale = true` e `metadata.stale_detected_at = now()` e `metadata.stale_reason = 'not_returned_by_anydesk_api'`
  - Registrar 1 entrada em `connection_history` com motivo "Removido da API AnyDesk" (apenas na transição, não a cada sync)
- **Nunca** deletar nem marcar `is_deleted`. Só o admin pode.

### 2. Migration única para corrigir os 3 devices afetados agora
UPDATE direto:
- Di Cavalcante / Esmeralda 1 / Esmeralda 2 → `status = 'offline'`, `metadata.stale = true`, `metadata.stale_since = last_online_at`
- Mantém `last_online_at` original (jan/2026) — fica claro que estão offline há 3 meses.

### 3. Indicador visual nos cards de painel
Em `src/modules/monitoramento-ia/components/PanelCard.tsx` (e qualquer card equivalente na página `/super_admin/paineis-exa`):
- Quando `metadata.stale === true`, exibir badge **âmbar/laranja**: "⚠️ Sem resposta da API há X dias"
- Diferencia visualmente de um offline normal (que é só vermelho)
- Mantém o card visível — só admin remove

### 4. Botão de exclusão manual (admin-only)
Verificar se já existe ação de excluir device em `/super_admin/paineis-exa`. Se não existir:
- Adicionar botão "Arquivar device" no card (visível apenas para `super_admin`)
- Confirmação obrigatória
- Marca `is_deleted = true` (não apaga fisicamente — preserva histórico)

---

## Arquivos a alterar

- `supabase/functions/sync-anydesk/index.ts` — detecção de stale ao fim do loop
- Migration SQL — corrigir os 3 devices afetados
- `src/modules/monitoramento-ia/components/PanelCard.tsx` (ou equivalente) — badge âmbar para stale
- Página `/super_admin/paineis-exa` — botão de arquivamento manual (se ainda não houver)

---

## Detalhes técnicos

- A regra "marca offline mas preserva `last_online_at`" garante que o tempo real desde o último contato fica visível na UI ("Offline há 3 meses").
- Stale ≠ Offline normal: stale = "AnyDesk parou de listar este client" (provável reinstalação/troca de hardware). Offline normal = "AnyDesk listou mas com online: false".
- Esses 3 devices continuam **órfãos** (sem `building_id`). Isso é separado e pode ser tratado depois pelo admin via UI manual.

Aprova?