
# Auditoria do travamento

## O que o código atual indica

### 1) O loading pode ficar infinito no envio do formulário
Em `src/components/interesse-sindico-form/StepTermos.tsx`, o botão entra em estado permanente de loading até `submitFormulario(...)` resolver:

```tsx
setEnviando(true);
setOverlayMsg('Registrando interesse...');
const result = await submitFormulario(predio, sindico);
```

E o redirecionamento só acontece depois disso:

```tsx
setTimeout(() => {
  reset();
  navigate(`/interessesindico/sucesso?protocolo=${encodeURIComponent(result.protocolo!)}`);
}, 600);
```

Se `submitFormulario` demorar demais ou travar, a tela fica girando sem sair.

### 2) `submitFormulario` tem duas chamadas externas bloqueantes sem timeout
Em `src/utils/submitFormulario.ts`, o fluxo aguarda em série:

```ts
const evid = await captureEvidencias();
```

e depois:

```ts
const { data: pdfResp, error: pdfErr } = await supabase.functions.invoke(
  'gerar-pdf-aceite-sindico',
  { body: { sindico_interessado_id: recordId } },
);
```

Ou seja: IP + insert + upload de fotos + geração de PDF. Tudo isso antes de liberar a navegação.

### 3) A captura de IP pode pendurar
Em `src/utils/captureEvidencias.ts`:

```ts
const res = await fetch('https://api.ipify.org?format=json', { method: 'GET' });
```

Não existe `AbortController`, timeout nem fallback rápido. Se esse fetch ficar preso, o formulário inteiro não sai do loading.

### 4) A rota de sucesso existe
As rotas estão registradas corretamente:

`src/App.tsx`
```tsx
<Route path="/interessesindico/sucesso" element={
  <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
    {React.createElement(lazy(() => import('./pages/InteresseSindicoSucesso')))}
  </Suspense>
} />
```

`src/routes/index.tsx`
```tsx
<Route path="/interessesindico/sucesso" element={<InteresseSindicoSucesso />} />
```

Então o problema mais provável não é rota quebrada; é o fluxo nunca chegando ao `navigate(...)`.

## Causa raiz mais provável

O travamento está no acoplamento entre:
- captura de evidências externas,
- geração do PDF,
- e a navegação da tela de sucesso.

Hoje o frontend espera o pacote inteiro terminar. Se qualquer etapa externa atrasar, o overlay fica infinito.

## Plano de correção

### 1. Colocar timeout real na captura de evidências
**Arquivo:** `src/utils/captureEvidencias.ts`

Trocar o `fetch` cru por `AbortController` com timeout curto (ex.: 2500–4000ms).  
Se falhar ou expirar, retornar:

```ts
{ ip: 'unknown', user_agent: navigator.userAgent, timestamp: new Date().toISOString() }
```

Sem bloquear o cadastro.

### 2. Tornar a geração do PDF não bloqueante para a navegação
**Arquivo:** `src/utils/submitFormulario.ts`

Manter:
- insert no banco
- upload de fotos

Mas limitar a espera da edge function com timeout curto via `Promise.race`/`AbortController`.  
Se o PDF falhar ou expirar:
- retornar `success: true`
- retornar `pdf_error`
- nunca travar o envio do cadastro

Objetivo: o protocolo nasce e o usuário segue para a tela de sucesso mesmo se o PDF atrasar.

### 3. Garantir saída visual do loading no formulário
**Arquivo:** `src/components/interesse-sindico-form/StepTermos.tsx`

Ajustar o fluxo para:
- navegar para `/interessesindico/sucesso?...` sempre que o cadastro for salvo com sucesso
- exibir toast de aviso se `pdf_error` vier preenchido
- evitar depender de operações lentas para remover o overlay

Também vou adicionar uma proteção de watchdog de UX: se algo ultrapassar o tempo máximo esperado antes do insert concluir, o usuário recebe erro claro e o botão é liberado novamente.

### 4. Preservar a auditoria técnica sem travar a UX
**Arquivos:** `src/utils/captureEvidencias.ts`, `src/utils/submitFormulario.ts`

A auditoria continua:
- timestamp
- user-agent
- IP quando disponível

Mas o IP deixa de ser uma dependência obrigatória para a submissão.

## Estrutura final de arquivos alterados

### Alterados
1. `src/utils/captureEvidencias.ts`
2. `src/utils/submitFormulario.ts`
3. `src/components/interesse-sindico-form/StepTermos.tsx`

### Não alterados
- landing
- sidebar
- admin
- layout global
- rotas
- banco/RLS
- outras telas não relacionadas

## Resultado esperado após a execução

- O formulário deixa de ficar “rodando para sempre”
- O cadastro conclui e sai da tela de envio
- O usuário é levado para a tela de sucesso assim que o registro for salvo
- A auditoria continua existindo, mas com fallback seguro
- Se o PDF atrasar/falhar, isso vira aviso e não bloqueio total

## Garantias

- Nenhuma mudança em UI ou workflow fora do problema descrito
- Não vou alterar páginas/admin/rotas sem necessidade
- O foco será somente no travamento do envio e no bloqueio indevido da navegação
