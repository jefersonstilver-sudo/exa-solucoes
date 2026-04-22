

# Reforço dos Bloqueios de Notificação WhatsApp — Prédios Internos

## Diagnóstico

Analisei profundamente o sistema. **A boa notícia:** os 3 bloqueios já existem na edge function `monitor-panels` (linhas 377-396):

| Bloqueio | Status | Linha |
|---|---|---|
| A — Grupo com `silenciar_alertas=true` (NUCS PRONTOS) | ✅ Ativo | 377-384 |
| B — Prédio com `status='interno'` | ✅ Ativo | 386-390 |
| C — Órfão (sem prédio + sem grupo) | ✅ Ativo | 392-396 |
| D — `alerts_enabled=false` individual | ✅ Ativo | 398-405 |

**Nenhuma outra edge function envia WhatsApp de painel offline.** O trigger de banco `handle_device_offline_incident` só cria registros internos, não dispara mensagens.

## Por que o usuário ainda pode estar vendo notificações

Hipóteses possíveis (vou validar todas no reforço):

1. **Prédio classificado errado** — algum painel "interno" pode estar vinculado a um prédio com `status='ativo'` ou `'instalação'` em vez de `'interno'` no banco
2. **Caches antigos** — a edge function pode ter rodado antes do último deploy dos bloqueios
3. **Query JOIN frouxa** — se `building_id` aponta para prédio inexistente, `device.buildings` vem `null` e cai no fluxo normal
4. **Histórico antigo** — alertas que **já foram disparados** antes do bloqueio aparecem no histórico (mas não são reenviados)

## Reforço proposto

### 1. Auditoria do banco (sem alterar nada — só relatório)

Listar quais painéis estão hoje classificados como "internos" pelo nome mas **não** têm `buildings.status='interno'`:

```sql
SELECT d.name, d.building_id, b.endereco, b.status, dg.nome AS grupo
FROM devices d
LEFT JOIN buildings b ON b.id = d.building_id
LEFT JOIN device_groups dg ON dg.id = d.device_group_id
WHERE d.name ILIKE '%entrada%' OR d.name ILIKE '%comercial%' 
   OR d.name ILIKE '%reuni%' OR d.name ILIKE '%interno%'
   OR d.name ILIKE '%escrit%' OR d.name ILIKE '%recep%';
```

Mostro o resultado e pergunto: *"esses painéis estão na classificação correta?"*

### 2. Reforçar bloqueio na edge function — defesa em profundidade

Adicionar **camada extra** que bloqueia também por **nome** quando o painel claramente é interno mas o prédio está mal cadastrado:

```ts
// BLOCK B-2: Safety net — nomes claramente internos
const NOMES_INTERNOS_PROIBIDOS = ['entrada', 'comercial tablet', 'sala reuniao', 
  'sala reunião', 'recepcao', 'recepção', 'escritorio', 'escritório', 'interno'];
const nomeNormalizado = device.name.toLowerCase();
if (NOMES_INTERNOS_PROIBIDOS.some(n => nomeNormalizado.includes(n)) && !testMode) {
  console.log(`🛑 [MONITOR] ${device.name}: nome interno detectado - sem alerta`);
  continue;
}
```

Isso garante que **mesmo se o prédio estiver classificado errado**, o painel interno nunca dispare WhatsApp.

### 3. Logs de auditoria visíveis

Adicionar log estruturado em cada bloqueio para facilitar debug futuro:
```ts
console.log(JSON.stringify({ 
  type: 'BLOQUEIO_ALERTA', 
  device: device.name, 
  motivo: 'predio_interno',
  building_id: device.building_id,
  building_status: device.buildings?.status 
}));
```

### 4. UI — mostrar selo "🔇 Sem notificação" em cada card

No `Paineis.tsx`, exibir um **selo discreto** em cada card de painel que **não dispara alerta**, mostrando o motivo:

- 🔇 **NUCS PRONTOS** (grupo silenciado)
- 🏢 **Interno** (prédio interno)
- 👻 **Órfão** (sem prédio nem grupo)
- ⏸️ **Pausado** (alerts_enabled=false)
- 🛑 **Nome interno** (safety net)

Assim o usuário **vê visualmente** quais painéis nunca dispararão alertas.

### 5. Migration opcional — corrigir prédios mal classificados

Após o resultado da auditoria (item 1), se houver painéis classificados errado, gerar UPDATE para corrigir `buildings.status='interno'`.

## Garantias

- **Não mexo** em: pagamento, propostas, contratos, agendamento, video upload, RLS
- **Não removo** nenhuma notificação legítima — só adiciono camadas de bloqueio para casos problemáticos
- O grupo "Predios" continua **enviando alertas normalmente** (`silenciar_alertas=false` por default)
- Toda notificação bloqueada gera log detalhado para auditoria
- Z-API jamais será chamado para painéis internos, mesmo se houver erro de cadastro no prédio

## Arquivos modificados

```
supabase/functions/monitor-panels/index.ts   — safety net por nome + logs estruturados
src/modules/monitoramento-ia/pages/Paineis.tsx — selo "sem notificação" em cada card
+ relatório SQL de auditoria (sem migration)
+ migration condicional se houver prédios mal classificados
```

