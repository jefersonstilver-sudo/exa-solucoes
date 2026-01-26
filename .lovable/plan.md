
# Diagnóstico: Sistema de Rastreamento de Visualizações Não Está Funcionando

## Problemas Identificados

Após análise completa dos logs, banco de dados e código, identifiquei **3 problemas principais**:

### 1. Edge Function Não Foi Redeployed
- Os logs mostram `Session: undefined, Referrer: undefined`
- O código atualizado captura IP e faz geolocalização, mas os dados não estão chegando ao banco
- **TODAS as visualizações recentes** (até 22:27 de hoje) têm `ip_address`, `city`, `country`, `session_id`, `referrer_url` como NULL
- A Edge Function precisa ser redeployed para aplicar as alterações

### 2. Logs de "enter" Ausentes
- Não há logs de action "enter" (onde os dados de IP e geo são capturados)
- Apenas logs de "heartbeat" aparecem
- Isso sugere que o INSERT inicial está falhando silenciosamente

### 3. Visualizações Históricas Sem Dados
- As 4 visualizações da proposta `da6bdf5a-c3fc-434d-901d-3405560e1f1a` foram criadas em 23/01/2026 (antes da atualização)
- Esses registros nunca terão os novos campos preenchidos

---

## Plano de Correção

### Etapa 1: Redeploy da Edge Function
Forçar o deploy da Edge Function `track-proposal-view` para garantir que a versão mais recente com captura de IP/Geo está ativa.

### Etapa 2: Adicionar Logs de Debug na Edge Function
Adicionar mais logs para rastrear:
- Se a requisição está chegando corretamente
- Se a geolocalização está sendo chamada
- Se o INSERT está funcionando ou falhando

### Etapa 3: Testar com Nova Visualização
Após o deploy, acessar a proposta pública e verificar:
- Logs da Edge Function
- Dados salvos no banco

### Etapa 4: Melhorar Tratamento de Erros
- Garantir que erros de geolocalização não bloqueiem o INSERT
- Adicionar fallback se a API de geo falhar

---

## Correções Técnicas a Implementar

### Edge Function (`track-proposal-view/index.ts`)

```typescript
// 1. Adicionar mais logs no início
console.log(`📨 [TRACK-VIEW] Full request body:`, JSON.stringify({ proposalId, action, sessionId, referrer, deviceType }));

// 2. Mover geolocalização para try/catch separado
let geoData = null;
try {
  geoData = await getGeoLocation(ipAddress);
  console.log('📍 Geolocalização obtida:', JSON.stringify(geoData));
} catch (geoError) {
  console.warn('⚠️ Falha na geolocalização, continuando sem:', geoError);
}

// 3. Logar o objeto de insert antes de inserir
console.log('💾 [INSERT] Dados a inserir:', JSON.stringify({
  proposal_id: proposalId,
  ip_address: ipAddress,
  city: geoData?.city || null,
  session_id: sessionId || null,
  referrer_url: referrer || null,
}));

// 4. Logar resultado do insert
if (insertError) {
  console.error('❌ ERRO NO INSERT:', JSON.stringify(insertError));
} else {
  console.log('✅ INSERT realizado com sucesso');
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/track-proposal-view/index.ts` | Adicionar logs extras e melhorar tratamento de erros |

---

## Resultado Esperado

Após a implementação:
1. **Novas visualizações** terão IP, cidade, país, ISP, session_id e referrer preenchidos
2. **Logs detalhados** aparecerão na Edge Function mostrando cada etapa
3. **Alertas de fraude** funcionarão corretamente (IPs internos, sessões longas)
4. **Visualizações antigas** continuarão como "Localização desconhecida" (dados históricos)

---

## Observação Sobre Dados Históricos

As 4 visualizações existentes foram criadas **antes** da atualização do sistema de rastreamento. Esses registros não podem ser enriquecidos retroativamente pois não temos os IPs originais.

Somente **novas visualizações** a partir do deploy terão os dados completos.
