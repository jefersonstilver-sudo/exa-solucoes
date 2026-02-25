
# Auditoria Profunda Completa - Revisao Final

## Resumo da Varredura

| Categoria | Quantidade |
|-----------|-----------|
| Erros Criticos (ERROR) | 4 |
| Avisos de Seguranca (WARN) | 23 |
| Problemas de Performance | 8 |
| Vazamento de Informacoes | 5 |
| Total de findings do scan | 132 |

---

## NOVOS PROBLEMAS ENCONTRADOS (nao estavam no plano anterior)

### NOVO 1: XSS via dangerouslySetInnerHTML sem sanitizacao
**Severidade: ALTA**
**Arquivos afetados:**
- `src/pages/admin/comunicacoes/EmailInbox.tsx` (linha 152) - Renderiza HTML de emails diretamente sem sanitizar. Um email malicioso pode executar JavaScript no navegador do admin.
- `src/components/admin/contracts/FullscreenContractEditor.tsx` (linha 296) - Renderiza conteudo de contratos sem sanitizar.
- `src/components/legal-flow/ContractInterviewer.tsx` (linhas 294, 374)
- `src/components/public/ContractFullPreview.tsx` (linha 499)

**Correcao:** Instalar `dompurify` e sanitizar todo HTML antes de renderizar:
```typescript
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
```

### NOVO 2: Pagina com CPF no nome do arquivo exposta publicamente
**Severidade: ALTA**
- `src/pages/57303905503127900.tsx` - O nome do arquivo parece ser um CPF/documento. Esta pagina e uma rota publica acessivel e contem um "Emergency Protocol" com seed phrase. Deveria estar protegida por autenticacao e o nome do arquivo nao deveria conter dados pessoais.

### NOVO 3: Security Definer Views (2 ERRORS)
**Severidade: ALTA**
O scan do Supabase detectou 2 views com `SECURITY DEFINER` que executam com as permissoes do criador da view, nao do usuario que consulta. Isso pode permitir acesso nao autorizado a dados.

**Correcao:** Alterar as views para usar `SECURITY INVOKER` ou adicionar RLS adequado nas tabelas subjacentes.

### NOVO 4: Chamadas RPC duplicadas no login
**Severidade: MEDIA (Performance)**
Os logs mostram que `get_user_highest_role` e chamada **4 vezes** simultaneamente no login (visivel nos network requests). Cada chamada e identica. Isso indica que multiplos componentes chamam o mesmo RPC sem compartilhar cache.

**Correcao:** Garantir que o `queryKey` seja consistente para que o React Query deduplicar as chamadas automaticamente.

### NOVO 5: Tabelas com RLS habilitado mas sem policies (RLS Enabled No Policy)
**Severidade: MEDIA**
O scan detectou tabelas com RLS ativado mas sem nenhuma policy criada. Isso significa que NINGUEM consegue acessar essas tabelas (nem mesmo admins), o que pode causar erros silenciosos.

---

## CONFIRMACAO DOS PROBLEMAS JA IDENTIFICADOS

### Performance - Polling Agressivo (CONFIRMADO - NAO CORRIGIDO AINDA)

| Hook | Intervalo Atual | Correcao |
|------|----------------|----------|
| `useSecurityMetrics` (4 queries) | 5s cada = 48 req/min | 60s |
| `useObservabilityData` (alerts) | 15s | 60s |
| `PanelDeviceTab` | 10s | 30s |
| `57303905503127900.tsx` | 10s | 30s |

### Console.logs - 7.316 ocorrencias em 262 arquivos (CONFIRMADO)
Dados sensiveis logados: emails, user IDs, roles, tokens de sessao.

### localStorage com dados sensiveis - 40 arquivos (CONFIRMADO)
Pagamentos, order IDs, preference IDs armazenados sem criptografia.

### RLS Policy Always True - 15+ policies (CONFIRMADO)
Policies com `WITH CHECK (true)` que permitem INSERT/UPDATE/DELETE sem restricao.

### Function Search Path Mutable - 55+ funcoes (CONFIRMADO)
Funcoes sem `SET search_path` vulneraveis a schema poisoning.

### Dependencias Vulneraveis (CONFIRMADO)
- `next` 15.3.2 - DoS via Server Components
- `react-router-dom` 6.26.2 - XSS via Open Redirects

### Leaked Password Protection Disabled (CONFIRMADO)
Precisa ser habilitado no dashboard do Supabase.

### Extension in Public (CONFIRMADO)
Extensoes instaladas no schema public em vez de `extensions`.

### Materialized View in API (CONFIRMADO)
Views materializadas acessiveis pela API publica.

---

## PLANO DE EXECUCAO ATUALIZADO (Prioridade)

### Fase 1 - Performance (Impacto Imediato no Site Lento)
1. Reduzir polling em `useSecurityMetrics.tsx` (5s -> 60s)
2. Reduzir polling em `useObservabilityData.ts` (15s -> 60s)
3. Reduzir polling em `PanelDeviceTab.tsx` (10s -> 30s)
4. Reduzir polling em `57303905503127900.tsx` (10s -> 30s)
5. Criar utilitario `devLog.ts` e substituir logs criticos que vazam PII

### Fase 2 - XSS e Seguranca Critica
6. Sanitizar `dangerouslySetInnerHTML` em EmailInbox, ContractEditor, ContractInterviewer, ContractFullPreview com DOMPurify
7. Migrar localStorage de pagamento para sessionStorage em NextButton, PaymentGateway, usePaymentProcessor, usePaymentDeduplication

### Fase 3 - Dependencias
8. Atualizar `next`, `react-router-dom` no package.json

### Fase 4 - Database (via SQL migrations)
9. Corrigir Security Definer Views
10. Consolidar RLS policies em log_eventos_sistema
11. Revisar tabelas com RLS sem policies
12. Corrigir policies com `WITH CHECK (true)` mais criticas

### Arquivos a Modificar (Fase 1 e 2)
- `src/hooks/useSecurityMetrics.tsx` - refetchInterval
- `src/hooks/useObservabilityData.ts` - refetchInterval
- `src/components/admin/panels/details/PanelDeviceTab.tsx` - refetchInterval
- `src/pages/57303905503127900.tsx` - refetchInterval
- `src/utils/devLog.ts` (NOVO) - helper de log condicional
- `src/hooks/useSuperAdminProtection.tsx` - remover logs de email/role
- `src/hooks/useUserSession.tsx` - remover logs de email/role
- `src/components/checkout/navigation/NextButton.tsx` - sessionStorage
- `src/components/checkout/payment/PaymentGateway.tsx` - sessionStorage
- `src/hooks/payment/usePaymentProcessor.consolidated.tsx` - sessionStorage
- `src/hooks/payment/usePaymentDeduplication.tsx` - sessionStorage
- `src/pages/admin/comunicacoes/EmailInbox.tsx` - sanitizar HTML
- `src/components/admin/contracts/FullscreenContractEditor.tsx` - sanitizar HTML
- `src/components/legal-flow/ContractInterviewer.tsx` - sanitizar HTML
- `src/components/public/ContractFullPreview.tsx` - sanitizar HTML
- `package.json` - atualizar dependencias

### O que NAO sera alterado
Nenhuma interface, workflow, rota ou funcionalidade existente. Apenas:
- Intervalos de polling (valores numericos)
- Destino de storage (localStorage -> sessionStorage)
- Adicao de sanitizacao HTML (wrapper sobre conteudo existente)
- Remocao/condicionamento de console.logs
