# Corrigir erro da Edge Function `generate-roteiro`

## O que está acontecendo

O usuário enviou "blackbill" e a IA respondeu com erro `Edge Function returned a non-2xx status code`. Diagnóstico até aqui:

- **Secret `ANTHROPIC_API_KEY`** existe ✓
- **Função deployada** ✓ (logs mostram `booted`)
- **`verify_jwt = true`** ✓ (usuário está logado, então o auth passa)
- **Logs de erro:** vazios — a função não está logando nada quando a Anthropic retorna erro, então não conseguimos ver a causa real às cegas

A causa mais provável: o frontend envia `model: 'claude-3-5-sonnet-20241022'` (linha 140 de `GeradorRoteiros.tsx`). Esse modelo existe na Anthropic, mas se a chave configurada for de uma conta sem acesso a esse modelo, ou tiver expirado / sem créditos, a Anthropic retorna 4xx e o frontend só vê "non-2xx status".

## Plano de correção

### 1. Adicionar logs detalhados na Edge Function
Adicionar `console.log` antes/depois da chamada à Anthropic e logar o status + corpo de erro quando a resposta não for OK. Isso permite ver no painel de logs exatamente o que a Anthropic devolveu (modelo inválido, sem crédito, chave inválida, etc.).

### 2. Re-deploy + testar
Após o deploy, pedir ao usuário para tentar novamente em `/anunciante/gerador-roteiros`. Ler os logs imediatamente para identificar a mensagem real da Anthropic.

### 3. Aplicar a correção conforme o erro real
- Se for **modelo inválido** → atualizar para um modelo Claude válido vigente (ex: `claude-3-5-sonnet-latest` ou `claude-sonnet-4-5`)
- Se for **chave inválida / 401** → pedir ao usuário para atualizar `ANTHROPIC_API_KEY`
- Se for **sem crédito / 402** → orientar a recarregar a conta Anthropic
- Se for **rate limit / 429** → adicionar mensagem amigável no frontend

### 4. NÃO alterar
- UI, layout, copy ou workflow do componente `GeradorRoteiros.tsx`
- Outras edge functions
- Migrations / tipos

## Arquivos afetados
- `supabase/functions/generate-roteiro/index.ts` — apenas adicionar logs
- (Possivelmente) ajuste do nome do modelo no frontend se o erro for "model not found"

Posso prosseguir?
