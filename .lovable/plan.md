

# Plano: Corrigir Layout dos Cards e Revisar API AnyDesk

## Problemas Identificados

### 1. Layout Desalinhado dos Cards
Os cards na grade 3 colunas (desktop) ficam com alturas diferentes porque:
- Alguns cards têm mais badges (prédio atribuído, empresa elevador, incidente) que outros
- O card "Sem provedor" (ID 1184148838) tem nome e provedor vazios, causando espaço estranho
- Cards com nome longo (ex: "Vale do Monjolo") vs curtos criam desnivelamento visual
- A seção de badges (`flex-wrap`) expande de forma irregular entre cards

### 2. API AnyDesk - Funcionamento
A API AnyDesk esta funcionando corretamente:
- **15 clientes** retornados pela API
- **12 atualizados** (3 ignorados por serem deletados)
- **11 online, 4 offline** no banco
- Sync automático a cada 2 minutos + polling a cada 15s

### 3. Device sem nome (ID: 1184148838)
Um device tem `comments` vazio na API AnyDesk, resultando em nome vazio e "Sem provedor". O parser faz fallback mas não tem dados para extrair.

---

## Mudanças Propostas

### A. Padronizar Altura dos Cards (`PanelCard.tsx`)
1. Forçar altura mínima fixa para o corpo do card para que todos fiquem alinhados na grid
2. Usar `min-h` no container de badges para garantir espaço consistente
3. Truncar nome do prédio com `line-clamp-1` para nomes longos
4. Adicionar fallback visual quando nome está vazio: mostrar o AnyDesk ID como nome principal

### B. Uniformizar Grid (`Paineis.tsx`)
1. Adicionar `items-stretch` na grid para forçar cards de mesma altura por linha (CSS Grid já faz isso, mas o conteúdo interno precisa se esticar)

### C. Fallback para Device sem Nome (`PanelCard.tsx`)
1. Se `displayName` estiver vazio, usar `device.anydesk_client_id` como nome
2. Se `provider` for "Sem provedor", mostrar com cor neutra (já está implementado)

### D. Nenhuma mudança na API AnyDesk
A sync está funcionando corretamente. O problema do device sem nome é da configuração no AnyDesk (campo `comments` vazio), não do código.

---

## Detalhes Técnicos

### `PanelCard.tsx` - Alterações no layout
```text
Estrutura atual:
┌─────────────────────┐
│  Nome (tamanho var.) │  ← sem limite de altura
│  Provedor            │
│  Torre/Elevador      │
│  [Badges flex-wrap]  │  ← altura variável
│  ID: XXXXXXX         │
├─────────────────────┤
│ ● Status    ⚠️ 5h14m│
└─────────────────────┘

Estrutura corrigida:
┌─────────────────────┐
│  Nome (line-clamp-1) │  ← altura fixa
│  Provedor            │
│  Torre/Elevador      │
│  [Badges min-h-[40px]│  ← altura mínima
│  ID: XXXXXXX         │
├─────────────────────┤
│ ● Status    ⚠️ 5h14m│
└─────────────────────┘
```

**Mudanças específicas:**
- Corpo do card: adicionar `flex flex-col` para distribuir espaço
- Nome: `line-clamp-1` para limitar a 1 linha
- Container de badges: `min-h-[32px] lg:min-h-[40px]` para consistência
- Fallback nome vazio: `const displayName = rawName.split(' - ')[0].trim() || device.anydesk_client_id;`
- Card externo: adicionar `flex flex-col` para o card inteiro se esticar na grid

### Arquivos editados
1. `src/modules/monitoramento-ia/components/PanelCard.tsx` - Layout padronizado
2. `src/modules/monitoramento-ia/pages/Paineis.tsx` - Ajuste mínimo na grid (se necessário)

