
# Diagnóstico: IA Jurídica Não Entende Contexto de Permuta com SECOVI

## Problemas Identificados

Após análise completa do código, identifiquei **4 problemas graves** que causam o comportamento errático:

---

### 1. SCENARIO_PATTERNS Força Tipo Errado

**Arquivo:** `JuridicoWorkspacePage.tsx` (linhas 26-30)

```typescript
secovi: {
  pattern: /secovi|sindicato|associação/i,
  tipo: 'parceria_pj',  // ❌ ERRADO - deveria manter o tipo que o usuário escolheu (permuta)
  suggestion: 'Detectei parceria institucional tipo SECOVI. Configurar como Cooperação Institucional com troca de logos?',
}
```

**Problema:** Sempre que a palavra "SECOVI" aparece, o sistema FORÇA `tipo: 'parceria_pj'`, ignorando completamente que você escolheu "permuta" no início.

---

### 2. Detecção de Cenário Sobrescreve Escolha do Usuário

**Arquivo:** `JuridicoWorkspacePage.tsx` (linhas 163-188)

```typescript
const handleSendMessage = useCallback(async (content: string) => {
  // Sanitize input
  const sanitizedContent = sanitizeToIndexa2026(content);
  addUserMessage(sanitizedContent);

  // Detect scenario - EXECUTA ANTES DA IA
  const scenario = detectScenario(sanitizedContent);
  if (scenario) {
    updateData({ tipo_contrato: scenario.tipo }); // ❌ SOBRESCREVE O TIPO!
    // ...
  }
});
```

**Problema:** A cada mensagem, o sistema busca padrões e SOBRESCREVE `tipo_contrato` para `parceria_pj`, resetando sua escolha de "permuta".

---

### 3. Sugestão Repetitiva e Loop Infinito

O padrão SECOVI retorna a mesma sugestão SEMPRE:

```typescript
suggestion: 'Detectei parceria institucional tipo SECOVI. Configurar como Cooperação Institucional com troca de logos?'
```

Mesmo após você responder "Sim" ou "Não", a próxima mensagem com "SECOVI" (como os dados do CNPJ) dispara o MESMO padrão novamente, criando um loop.

---

### 4. Comodato Pattern Muito Agressivo

```typescript
comodato: {
  pattern: /pietro\s*angelo|síndico|comodato|elevador/i,
  // ...
}
```

**Problema:** Se você menciona "síndico" (que existe nos dados do SECOVI: "SINDICATO DA HABITAÇÃO"), pode estar sendo capturado incorretamente, gerando template de comodato.

---

## Fluxo Quebrado Demonstrado

```text
1. Usuário: "Vou criar um contrato de permuta"
   → Sistema: tipo_contrato = 'permuta' ✅

2. Usuário: "SECOVI - institucional"
   → SCENARIO_PATTERNS detecta "secovi"
   → tipo_contrato SOBRESCRITO para 'parceria_pj' ❌
   → Mensagem: "Configurar como Cooperação Institucional?"

3. Usuário: "Sim, pode incluir"
   → Sistema NÃO altera tipo de volta para permuta

4. Usuário: Fornece CNPJ/Razão Social com "SINDICATO DA HABITAÇÃO"
   → SCENARIO_PATTERNS detecta "sindicato" novamente!
   → Loop de sugestão reinicia
```

---

## Solução Proposta

### Etapa 1: Não Sobrescrever Tipo Já Definido

Modificar a lógica de detecção de cenário para **respeitar a escolha inicial do usuário**:

```typescript
// NOVO: Só aplica tipo se NÃO tiver sido definido antes
if (scenario && !data.tipo_contrato) {
  updateData({ tipo_contrato: scenario.tipo });
}
```

### Etapa 2: Remover Detecção Agressiva de Padrões

Criar uma flag `scenarioConfirmed` que, após confirmação, desabilita novas detecções:

```typescript
const [scenarioConfirmed, setScenarioConfirmed] = useState(false);

if (scenario && !scenarioConfirmed && !data.parceiro_documento) {
  // Só sugere se não confirmou e não tem CNPJ ainda
}
```

### Etapa 3: Criar Categoria Correta para Permuta Institucional

Adicionar novo tipo de cenário que NÃO sobrescreve:

```typescript
secovi_permuta: {
  pattern: /secovi|sindicato\s*(da|de)?\s*habitação/i,
  // NÃO define tipo - mantém o escolhido pelo usuário
  suggestion: 'Parceria institucional com SECOVI. Incluir cláusula de exclusividade de marca?',
  requiresConfirmation: true,
}
```

### Etapa 4: Corrigir o Edge Function para Permuta

O prompt da Edge Function tem exemplo de SECOVI como PERMUTA (linha 2 do few-shot), mas o frontend força para `parceria_pj`. Alinhar ambos:

```typescript
// Adicionar ao SCENARIO_PATTERNS
secovi: {
  pattern: /secovi/i,
  tipo: 'permuta', // ✅ Alinhado com few-shot examples
  suggestion: 'Parceria institucional tipo SECOVI. Configurar permuta de serviços?',
}
```

### Etapa 5: Adicionar Lock de Contexto

Quando usuário escolhe tipo inicial, criar lock que impede sobrescrita:

```typescript
const [tipoLocked, setTipoLocked] = useState(false);

// Quando escolhe "permuta":
handleActionClick = (value) => {
  if (value === 'permuta') {
    updateData({ tipo_contrato: 'permuta' });
    setTipoLocked(true); // ⚡ LOCK!
  }
}

// Na detecção de cenário:
if (scenario && !tipoLocked) {
  // Só sobrescreve se não estiver travado
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/contracts/JuridicoWorkspacePage.tsx` | Corrigir SCENARIO_PATTERNS e lógica de detecção |
| `supabase/functions/juridico-brain/index.ts` | Garantir que tipo já definido NÃO seja resetado |

---

## Resultado Esperado

```text
1. Usuário: "Vou criar um contrato de permuta"
   → tipo_contrato = 'permuta' (TRAVADO)

2. Usuário: "SECOVI - institucional"  
   → Detecta SECOVI, MAS mantém tipo 'permuta'
   → Mensagem: "Incluir cláusula de exclusividade de marca?"

3. Usuário: "Sim"
   → scenarioConfirmed = true (não pergunta mais)

4. Usuário: Fornece CNPJ/dados
   → REGEX-first atualiza dados
   → tipo_contrato continua 'permuta' ✅
   → Preview mostra "CONTRATO DE PERMUTA" ✅
```

---

## Sumário Técnico

| Problema | Causa | Solução |
|----------|-------|---------|
| IA repete mesma pergunta | SCENARIO_PATTERNS dispara a cada match | Flag `scenarioConfirmed` |
| Tipo muda de permuta para parceria_pj | `updateData({ tipo_contrato: scenario.tipo })` | Respeitar tipo já definido |
| Contrato gerado parece de síndico | Pattern `/síndico/` muito amplo | Refinar regex para excluir "Sindicato da Habitação" |
| IA não entende contexto | Frontend intercepta ANTES da IA processar | Permitir IA processar quando tipo já definido |
