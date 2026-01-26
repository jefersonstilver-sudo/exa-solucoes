
# Plano: Sistema de Rastreamento Avançado de Visualizações

## Objetivo
Adicionar captura de **IP**, **geolocalização** e **fingerprint** às visualizações de propostas para identificar fraudes e acessos internos.

---

## Arquitetura da Solução

### 1. Atualizar Schema da Tabela `proposal_views`

Novos campos a adicionar:
```sql
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS isp TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS fingerprint TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS referrer_url TEXT;
```

---

### 2. Atualizar Edge Function `track-proposal-view`

**Captura de IP real do usuário:**
```typescript
const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
  || req.headers.get('x-real-ip') 
  || req.headers.get('cf-connecting-ip')
  || 'unknown';
```

**Geolocalização via API (ipapi.co):**
```typescript
const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
const geoData = await geoResponse.json();
// Retorna: city, region, country_name, latitude, longitude, timezone, org
```

**Persistir na inserção:**
```typescript
const { error: insertError } = await supabase
  .from('proposal_views')
  .insert({
    proposal_id: proposalId,
    device_type: deviceType || 'unknown',
    user_agent: userAgent || null,
    ip_address: ipAddress,
    city: geoData?.city,
    region: geoData?.region,
    country: geoData?.country_name,
    country_code: geoData?.country_code,
    latitude: geoData?.latitude,
    longitude: geoData?.longitude,
    timezone: geoData?.timezone,
    isp: geoData?.org,
    fingerprint: fingerprint || null,
    session_id: sessionId || null,
    referrer_url: referrer || null,
    time_spent_seconds: 0,
  });
```

---

### 3. Atualizar Frontend `PropostaPublicaPage.tsx`

Enviar dados adicionais na chamada de tracking:
```typescript
// Gerar session ID único
const sessionId = sessionStorage.getItem('pv_session') || crypto.randomUUID();
sessionStorage.setItem('pv_session', sessionId);

// Referrer
const referrer = document.referrer || 'direct';

// Enviar na requisição
supabase.functions.invoke('track-proposal-view', {
  body: {
    proposalId: id,
    action: 'enter',
    deviceType,
    userAgent: navigator.userAgent,
    sessionId,
    referrer,
    // fingerprint pode ser adicionado com biblioteca como FingerprintJS
  }
});
```

---

### 4. Atualizar UI de Detalhes da Proposta

Adicionar seção expandida com informações de rastreamento:

**Card "Análise de Visualizações":**
- 🌍 **Países de Origem**: Lista com bandeiras
- 📍 **Cidades**: Mapa ou lista das localizações
- 🖥️ **IPs Únicos**: Contagem e lista
- 🕐 **Sessões Únicas**: Baseado em session_id
- ⚠️ **Alertas de Fraude**:
  - IPs internos da empresa (definir whitelist)
  - Múltiplos acessos do mesmo IP em curto período
  - Tempo de sessão anormalmente alto

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/...` | Novo schema com campos de geolocalização |
| `supabase/functions/track-proposal-view/index.ts` | Captura de IP e geolocalização |
| `src/pages/public/PropostaPublicaPage.tsx` | Enviar sessionId e referrer |
| `src/pages/admin/proposals/PropostaDetalhesPage.tsx` | Nova seção de análise de visualizações |

---

## Informações que Você Terá Após Implementação

| Dado | Exemplo |
|------|---------|
| IP | `177.52.xxx.xxx` |
| País | `Brasil` 🇧🇷 |
| Cidade | `São Paulo, SP` |
| ISP/Org | `Vivo Fibra` |
| Timezone | `America/Sao_Paulo` |
| Dispositivo | `Desktop - Chrome 143` |
| Tempo Ativo | `18min 32s` |
| Sessão | `abc123-...` (agrupamento) |
| Origem | `wa.me` (veio do WhatsApp) |

---

## Detecção de Fraude

**Alertas automáticos para:**
1. ⚠️ IP da empresa (whitelist configurável)
2. ⚠️ Mesmo IP com múltiplas visualizações em < 1h
3. ⚠️ Tempo de sessão > 1 hora (possivelmente página aberta sem interação)
4. ⚠️ User-Agent de bot ou automatizado

---

## Resultado Visual Esperado

Na página de detalhes da proposta, você verá algo como:

```
┌─────────────────────────────────────────────────┐
│  📊 Análise de Visualizações (12 acessos)      │
├─────────────────────────────────────────────────┤
│  🌍 Países: Brasil (10), Portugal (2)          │
│  📍 Cidades: São Paulo (6), Rio (3), Lisboa (2)│
│  🖥️ IPs Únicos: 4                              │
│  ⏱️ Tempo Total: 2h 14min                       │
├─────────────────────────────────────────────────┤
│  ⚠️ ALERTAS                                     │
│  • 3 acessos do IP 192.168.xxx (interno?)      │
│  • Sessão #abc ficou 8h aberta                 │
└─────────────────────────────────────────────────┘
```

---

## Considerações de Privacidade (LGPD)

- IPs são dados pessoais - armazenar com justificativa legítima (segurança/fraude)
- Considerar anonimização após 90 dias
- Informar no rodapé da proposta que acessos são monitorados
