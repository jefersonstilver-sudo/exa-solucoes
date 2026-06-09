## Fase 0 — Corrigir CRM Evolution offline

**Problema:** `evolution-proxy` está com `verify_jwt = true` no `supabase/config.toml`. Com o novo sistema de signing keys do Supabase, o runtime rejeita a request antes mesmo de chegar na função, retornando 401 `UNAUTHORIZED_NO_AUTH_HEADER`. A função já valida JWT internamente (linhas 53-73), então basta desligar o verify_jwt do runtime.

### Mudança única

Arquivo: `supabase/config.toml`

```toml
[functions.evolution-proxy]
verify_jwt = false
```

(antes: `verify_jwt = true`)

### Validação pós-deploy

1. Recarregar `/super_admin/crm-evolution` e confirmar que `[CRMEvolution] sync error` some do console.
2. Testar `evolution-proxy` via `supabase--curl_edge_functions` com Authorization do usuário logado — deve retornar 200 (e 401 sem header, comprovando que a validação em código segue ativa).
3. Conferir nos edge function logs que não há mais `UNAUTHORIZED_NO_AUTH_HEADER`.

### Fora de escopo desta fase

- Nenhuma mudança em UI, em outras funções, ou em fluxos Z-API.
- A migração Z-API → Evolution (instância "Notificações EXA", renomear `zapi_logs`, substituir 24 funções, webhook unificado, remoção total) segue como Fase 1+ e será iniciada **depois** de você confirmar que o CRM Evolution voltou a funcionar.

### Próximo passo (após aprovar e validar este fix)

Você precisa ter em mãos para a Fase 1:
1. Número de WhatsApp dedicado para "Notificações EXA".
2. Acesso ao painel Evolution para criar a instância e gerar `INSTANCE_NAME` + `TOKEN` (vão virar `EVOLUTION_NOTIF_INSTANCE` / `EVOLUTION_NOTIF_TOKEN` nos secrets).
