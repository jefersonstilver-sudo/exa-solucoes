

# Adicionar Grupo "NUCS PRONTOS" + Silenciar Alertas WhatsApp por Grupo

## Cenário atual (verificado no banco)

- Tabela `device_groups` já existe e hoje tem **2 grupos**: `Predios` (azul) e `Interno` (cinza)
- **29 dispositivos** no total — **12 estão sem grupo** e **10 sem prédio** (órfãos)
- Existe `device_alert_configs.alerts_enabled` que silencia alertas **por dispositivo individual**, mas **não existe** silenciamento **por grupo nem por status do prédio (interno)**
- A edge function `monitor-panels` (linha 372) só checa `alerts_enabled` de cada device — não olha grupo nem `buildings.status='interno'`
- Painéis órfãos (sem prédio) hoje **disparam alertas WhatsApp normalmente**, gerando ruído
- Painéis de prédios `interno` (ENTRADA, COMERCIAL TABLET, SALA REUNIÃO) também disparam alertas

## Solução proposta

### 1. Banco — adicionar coluna `silenciar_alertas` em `device_groups`

```sql
ALTER TABLE device_groups 
ADD COLUMN silenciar_alertas boolean NOT NULL DEFAULT false;
```

Permite marcar QUALQUER grupo como "não notifica" — flexível para o futuro.

### 2. Banco — criar grupo "NUCS PRONTOS" (silenciado)

Insert único:
```
nome='NUCS PRONTOS', cor='#F59E0B' (âmbar), ordem=2, silenciar_alertas=true
```

### 3. Edge Function `monitor-panels` — 3 novas regras de bloqueio

No loop de devices (linha ~370), antes de processar alerta, adicionar checks na ordem:

**Bloqueio A — grupo silenciado:**
```ts
if (device.device_group_id) {
  const grupo = deviceGroupsMap.get(device.device_group_id);
  if (grupo?.silenciar_alertas) {
    console.log(`🔇 [MONITOR] ${device.name}: grupo "${grupo.nome}" silenciado`);
    continue;
  }
}
```

**Bloqueio B — prédio interno:**
```ts
if (device.buildings?.status === 'interno') {
  console.log(`🏢 [MONITOR] ${device.name}: prédio interno - sem alerta`);
  continue;
}
```

**Bloqueio C — sem prédio E sem grupo (órfão real):** opcional, suprime ruído de painéis nunca atribuídos.
```ts
if (!device.building_id && !device.device_group_id) {
  console.log(`👻 [MONITOR] ${device.name}: órfão sem grupo - sem alerta`);
  continue;
}
```

Para isso, adicionar no SELECT da query de devices (linha 206): incluir `device_group_id` e `buildings.status`. Carregar `device_groups` uma vez no início.

### 4. UI — Página `Paineis.tsx` (Monitoramento IA)

Já existe agrupamento visual por `device_group_id` (linha 170). Vou:

- Adicionar **botão "Mover para NUCS PRONTOS"** no menu de cada card de painel órfão (sem prédio)
- No header de cada grupo, mostrar **ícone 🔇 + label "Alertas silenciados"** quando `silenciar_alertas=true`
- No `DeviceGroupManager.tsx` (modal de gestão), adicionar **toggle "Silenciar alertas WhatsApp"** ao criar/editar grupo

### 5. UI — `useDeviceGroups.ts`

Atualizar `interface DeviceGroup` para incluir `silenciar_alertas: boolean` e expor isso em `createGroup`/`updateGroup`.

### 6. Bulk action — atribuir os 10 órfãos automaticamente (opcional, perguntar)

Migration extra opcional:
```sql
UPDATE devices 
SET device_group_id = '<id-nucs-prontos>'
WHERE building_id IS NULL AND device_group_id IS NULL;
```

## Resumo do efeito final

| Situação do painel | Hoje notifica? | Depois notifica? |
|---|---|---|
| Prédio normal (ativo) | ✅ Sim | ✅ Sim |
| Prédio interno | ✅ Sim (ruído) | ❌ Não |
| Grupo "NUCS PRONTOS" | ✅ Sim (ruído) | ❌ Não |
| Órfão sem grupo | ✅ Sim (ruído) | ❌ Não (opcional) |
| Silenciado individual (`alerts_enabled=false`) | ❌ Não | ❌ Não |

## Arquivos modificados

```
supabase/migrations/<novo>.sql          — coluna silenciar_alertas + insert grupo NUCS PRONTOS
supabase/functions/monitor-panels/index.ts — 3 bloqueios + select expandido
src/hooks/useDeviceGroups.ts            — campo silenciar_alertas
src/components/monitor/DeviceGroupManager.tsx — toggle "silenciar alertas"
src/modules/monitoramento-ia/pages/Paineis.tsx — header com ícone 🔇 + ação rápida
```

## Garantias

- **Não toco** em: fluxo de pagamento, propostas, contratos, agendamento, RLS de outras tabelas, UI fora dos componentes listados
- Painéis silenciados **continuam visíveis** nos dashboards (interno e `/monitor` público) — só não geram WhatsApp
- A flag é por **grupo**, então amanhã você pode criar outro grupo ("Manutenção", "Reserva") com a mesma regra sem código novo
- O grupo "NUCS PRONTOS" pode ser renomeado/recolorido livremente pelo painel admin

## Pergunta antes de executar

Quer que eu **mova automaticamente** os 10 painéis órfãos (sem prédio + sem grupo) para o grupo "NUCS PRONTOS" na própria migration, ou prefere fazer manualmente via interface depois?

