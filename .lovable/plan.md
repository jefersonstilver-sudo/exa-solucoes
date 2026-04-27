## Diagnóstico

Auditei os três prédios mencionados no banco e na API AnyDesk. Resultado:

### Estado real no sistema

| Prédio | Existe em `buildings`? | Device em `devices`? | Vinculado? | Sync AnyDesk |
|---|---|---|---|---|
| Residencial Vale do Monjolo (`018`) | Sim, status `ativo` | Sim (AnyDesk `1042429852`) | Sim, building_id correto | OK — último parse `27/04 16:13Z` |
| Vila Appia (`007`) | Sim, status `ativo` | Sim (AnyDesk `1184148838`) | Sim, building_id correto | OK — último parse `27/04 16:13Z` |
| Torre Azul (`009`) | Sim, status `ativo` | Sim (AnyDesk `1106649362`) | Sim, building_id correto | OK — último parse `27/04 16:13Z` |

Todos os três:
- estão **online** na tabela `devices`
- estão **vinculados** ao `building_id` correto
- estão no grupo "Predios" (`device_group_id = 2794d433-...`)
- têm `is_active=true` e `is_deleted=false`
- o `sync-anydesk` os retorna a cada execução

### Por que sumiram da tela "Predios (9)"

O grupo "Predios" tem hoje **12 devices ativos** + 3 deletados (Di Cavalcante, Esmeralda 1 e 2). O header "Predios (9)" da imagem reflete um **estado anterior ao sync que aconteceu pouco antes do screenshot** — os 3 já voltaram a aparecer no DB e devem aparecer ao recarregar/forçar sync. **Não há filtro escondendo eles.**

Mas existem dois problemas reais identificados na auditoria que justificam o reforço:

1. **Risco de "ghost" no grupo de prédios**: o mesmo padrão dos antigos Di Cavalcante / Esmeralda. Se um device some da API e volta, o status pode ficar inconsistente até o próximo sync. Precisamos garantir reconciliação contínua.
2. **Inconsistências menores nos 3 prédios** (não bloqueantes mas atrapalham telas):
   - Torre Azul: `nome` começa com espaço ` Torre Azul` (causa ordenação errada e bugs de match)
   - Vila Appia: `nome` termina com espaço `Vila Appia ` (mesmo problema)
   - Vale do Monjolo: usa só `latitude/longitude` (sem `manual_*`) — funciona, mas inconsistente com os demais

## Plano de correção

### 1. Normalizar dados dos 3 prédios (migration)

```sql
UPDATE buildings SET nome = TRIM(nome)
WHERE id IN (
  '0077c002-fdd5-430a-8794-bedd66ff526a', -- Vila Appia
  '6d8d0f86-7ac4-438f-9f3b-dbc8263524ca'  -- Torre Azul
);
```
Resultado: nomes ficam `Vila Appia` e `Torre Azul` sem espaços parasitas, melhorando match em `findBuildingByDeviceName`.

### 2. Reforçar reconciliação contínua no `sync-anydesk`

Garantir que toda execução do sync:
- compara devices do DB com devices retornados pela API AnyDesk
- devices presentes no DB e ausentes da API por **mais de 1 ciclo** entram em estado `offline + metadata.stale=true` (já implementado anteriormente)
- devices que **voltam** a aparecer na API têm `metadata.stale` removido automaticamente e `status` recalculado a partir do `online`/`offline` real da API
- nunca deletar nada — manter para auditoria do administrador

Adicionar log explícito no fim de cada sync:
```
[SYNC] Total API: X | DB ativos: Y | Reconciliados: Z | Stale: W | Voltaram: V
```

### 3. Painel de "Saúde de Sincronia" (admin)

Adicionar pequeno botão/aba em `/admin/monitoramento-ia/paineis` mostrando:
- timestamp do último sync
- devices presentes no DB **mas não na API** (stale) — destacados
- devices presentes na API **mas não no DB** (novos não importados)
- devices com `building_id = null` (órfãos)

Isso dá visibilidade total: o admin vê na hora qualquer prédio "fora de eixo" como Vale do Monjolo / Vila Appia / Torre Azul, sem precisar abrir o banco.

### 4. Forçar um sync agora

Após o deploy, executar `sync-anydesk` com `force: true` para reconciliar imediatamente os três prédios e qualquer outro stale.

## Garantia "nunca mais acontece"

- **Reconciliação a cada sync** (já em produção, será reforçada com o reverso: limpar `stale` quando voltam).
- **Painel de saúde** dá visibilidade imediata.
- **Nada é deletado automaticamente** — apenas o admin remove.
- **Nomes normalizados** evitam falhas de match futuras.

## Não será alterado

- Nenhum fluxo, UI ou comportamento existente fora dos pontos acima.
- Nenhuma regra de RLS, autenticação ou rota.
- Cards e layout do `PaineisExa`/`Paineis` permanecem idênticos — apenas ganham um botão extra "Saúde de Sincronia".

Aprova para implementar?
