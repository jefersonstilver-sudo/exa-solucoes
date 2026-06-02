## Integração segura com Evolution API

### Arquitetura (resumo)

```
Browser (admin) ──JWT──> Edge Function `evolution-proxy` ──API Key──> http://54.233.76.73:8080
                              │
                              ├─ valida JWT do Supabase
                              ├─ valida que user tem role super_admin/admin
                              └─ lê EVOLUTION_API_URL + EVOLUTION_API_KEY de Deno.env
```

Nenhuma URL, key ou endpoint da Evolution fica no bundle do frontend. O frontend só conhece o nome da edge function.

### Passos

**1. Secrets (via tool `add_secret`, nunca em `.env`)**
- `EVOLUTION_API_URL` = `http://54.233.76.73:8080`
- `EVOLUTION_API_KEY` = `429683C4C977415CAAFCCE10F7D57E11`

**2. Edge Function `supabase/functions/evolution-proxy/index.ts`**
- CORS headers padrão (OPTIONS handler).
- Lê `Authorization: Bearer <jwt>` do request → `supabase.auth.getUser(jwt)` com client anon. Se inválido → 401.
- Verifica role do usuário via `has_role(user.id, 'super_admin')` OR `'admin'`. Se não → 403.
- Body esperado: `{ path: string, method?: 'GET'|'POST'|'PUT'|'DELETE', body?: any }`.
- Validação com Zod: `path` precisa começar com `/`, sem `..`, sem hosts externos (whitelist de prefixos: `/instance`, `/message`, `/chat`, `/group`, `/webhook`).
- Faz `fetch(EVOLUTION_API_URL + path, { method, headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' }, body })`.
- Repassa status + JSON da Evolution de volta. Loga erros sem vazar a key.
- Rate limit simples em memória por user_id (ex: 30 req / 10s) para mitigar abuso.

**3. Frontend — `CRMEvolutionPage.tsx`**
- Adiciona helper `callEvolution(path, method, body)` que chama:
  ```ts
  supabase.functions.invoke('evolution-proxy', { body: { path, method, body } })
  ```
- Por enquanto: botão "Testar conexão" que chama `/instance/fetchInstances` e mostra status/erro. Nada de listagem real ainda — o CRM completo vem depois conforme o usuário pediu.

**4. Segurança adicional**
- `verify_jwt = true` no `config.toml` para a função (Supabase rejeita chamadas sem JWT antes mesmo de entrar no código).
- Whitelist de paths + método.
- Tamanho máx de body (ex: 100KB).
- Logs sem secrets.
- Nenhum log do payload bruto de mensagens (LGPD).

### O que NÃO vai mudar
- Nenhuma alteração em outras páginas, rotas, sidebar (a entrada CRM Evolution já existe).
- Sem polling, sem realtime, sem webhook ainda — vamos fazer numa próxima etapa quando você definir o servidor de webhook.

### Próximo passo após aprovação
Quando você aprovar, vou: pedir os 2 secrets, criar a edge function e atualizar a página CRM com o botão de teste de conexão.
