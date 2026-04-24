## Diagnóstico (confirmado via banco)

Investiguei o caso do **Riverside**:
- `device.status = 'offline'`
- `building.status = 'instalacao'` ← está EM INSTALAÇÃO
- `last_online_at` = ~29h atrás (matematicamente correto, mas irrelevante — o painel ainda não está em produção)

Na função `monitor-panels/index.ts` (linha 390) existe um **BLOCK B** que ignora apenas prédios com status `'interno'`. **Não existe bloqueio para `'instalacao'`/`'instalação'`**, por isso o WhatsApp dispara "ALERTA PAINEL OFFLINE" para o Riverside (que sequer foi entregue oficialmente).

## Plano de correção

### 1. `supabase/functions/monitor-panels/index.ts` — Bloqueio de prédios em instalação

Adicionar um novo bloco logo após o BLOCK B (interno), reutilizando a mesma normalização de acentos já validada:

```typescript
// ==================== BLOCK B-1: Building em instalação ====================
const buildingStatus = String(device.buildings?.status || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

if (buildingStatus.includes('instala') && !testMode) {
  console.log(JSON.stringify({
    type: 'BLOQUEIO_ALERTA',
    motivo: 'predio_em_instalacao',
    device: device.name,
    device_id: device.id,
    building_id: device.building_id,
    building_status: device.buildings?.status,
  }));
  continue;
}
```

Cobre as variantes `instalacao`, `instalação`, `Instalação`, `INSTALAÇÃO`, etc.

### 2. Sobre o "Offline há 29h12min"

O cálculo em si (`now - last_online_at`) está correto. O problema raiz é que o painel **nunca deveria ter entrado no fluxo de alertas** enquanto o prédio estava em instalação. Com o bloqueio acima:
- Riverside não dispara mais notificação
- Quando o status do prédio passar para `ativo`, o `last_online_at` já terá sido atualizado pela primeira sincronização real, normalizando o tempo offline exibido

**Não vou alterar a fórmula** de duração (poderia mascarar problemas reais em prédios ativos). O bloqueio na origem resolve o sintoma corretamente.

### 3. Encerrar incidente aberto do Riverside (limpeza única)

Após o deploy, vou rodar um UPDATE pontual para limpar o `metadata.current_incident_id` e `triggered_rules` do device Riverside, evitando que o próximo ciclo dispare um "voltou online" falso quando o status mudar.

## Arquivos editados
- `supabase/functions/monitor-panels/index.ts` (+ deploy da função)

## Não será alterado
- UI da loja, fluxo de cadastro, mapa, lógica de cálculo de tempo offline, notificações para prédios `ativo` ou `interno` (já tratados).

Aprova para implementar?