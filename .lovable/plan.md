# Plano: Ativar Gerador de Roteiros Sofia

## Status atual da auditoria

Tudo já está no lugar — só falta uma ação real: **deploy da Edge Function**.

| Item | Status |
|---|---|
| `supabase/functions/generate-roteiro/index.ts` | Existe, usa `Deno.serve`, CORS correto, proxy transparente para Anthropic |
| Secret `ANTHROPIC_API_KEY` | Já configurado |
| `src/pages/advertiser/GeradorRoteiros.tsx` | Existe, 423 linhas, tipagem OK (usa `as any` para `roteiros_gerados`) |
| `src/assets/exa-logo.png` | Existe |
| Rota `/anunciante/gerador-roteiros` | Registrada em `App.tsx` (linhas 105 e 535-537) |
| Tabela `roteiros_gerados` | Migration aplicada anteriormente |

## Ações a executar

### 1. Deploy da Edge Function
Fazer deploy de `generate-roteiro` via `supabase--deploy_edge_functions`. O arquivo já segue os padrões corretos (Deno.serve + corsHeaders + tratamento de erro com CORS em todas as respostas).

### 2. Smoke test da Edge Function
Após o deploy, chamar `supabase--curl_edge_functions` com um payload mínimo de teste para confirmar que:
- A função responde (não 404/500 de inicialização)
- A Anthropic responde com 200 + bloco `content[0].text`
- Em caso de erro, validar logs via `supabase--edge_function_logs`

### 3. Validação do componente (somente leitura)
Sem alterações de UI/lógica/workflow (constraint do projeto). Confirmar:
- Imports corretos (lucide-react, exaLogo, useAuth, supabase, sonner)
- Uso de `supabase.functions.invoke('generate-roteiro', { body: { model, max_tokens, system, messages } })` ✓ confere
- Leitura de `data?.content?.[0]?.text` ✓ confere
- Auto-save em `roteiros_gerados` quando detecta `## ROTEIRO` ✓ confere
- Imports não usados (`Film`, `Trash2`, `ChevronDown`, `exaLogo`): apenas warnings de lint, **não removerei** para respeitar a regra "não alterar nada que não seja o problema descrito"

### 4. Reportar resultado
Confirmar URL `/anunciante/gerador-roteiros` ativa, com link direto para os logs da Edge Function caso o usuário queira monitorar.

## Detalhes técnicos

- **Modelo Claude usado pelo frontend:** `claude-3-5-sonnet-20241022` (passado no body, a Edge Function só repassa)
- **Auth:** A Edge Function não exige verificação extra de JWT no código (proxy puro). Se `verify_jwt = true` em `config.toml`, o gateway do Supabase já barra requests não autenticadas
- **Sem migrations novas, sem novos secrets, sem alterações de UI**

## O que NÃO será feito
- Adicionar item no sidebar (`AdvertiserSidebarContent.tsx`) — usuário pediu para postergar até validar a página
- Refatorar imports não usados — fora do escopo, viola a regra de não alterar o que não é problema
- Alterar design, cores, layout ou copy do componente
