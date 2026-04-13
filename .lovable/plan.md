

# Grupos de Dispositivos para Painéis

## O que será feito

Criar um sistema de grupos para organizar os dispositivos (painéis) tanto na página admin quanto na página pública `/monitor`. Cada device poderá pertencer a um grupo (ex: "Internos", "Foz do Iguaçu", "Curitiba"). Os grupos serão colapsáveis e visualmente separados.

## Arquitetura

```text
Nova tabela: device_groups
  - id (uuid, PK)
  - nome (text)
  - cor (text, hex color)
  - ordem (integer)
  - created_at (timestamptz)

Coluna nova em devices:
  - device_group_id (uuid, FK → device_groups.id, nullable)
```

## Arquivos a criar/modificar

### 1. Migration SQL (NOVA)
- Criar tabela `device_groups` com RLS habilitado
- Políticas: authenticated pode CRUD, anon pode SELECT (para /monitor)
- Adicionar coluna `device_group_id` na tabela `devices` com FK
- Política anon SELECT já existe em devices

### 2. `src/hooks/useDeviceGroups.ts` (NOVO)
- Hook CRUD para device_groups (similar ao `useOrderGroups.ts`)
- Funções: fetchGroups, createGroup, updateGroup, deleteGroup, moveDeviceToGroup
- Realtime subscription na tabela device_groups

### 3. `src/components/monitor/DeviceGroupManager.tsx` (NOVO)
- Dialog para criar/editar/excluir grupos (reutiliza padrão do `CreateGroupDialog`)
- Botão "Gerenciar Grupos" no header da página Painéis
- Lista de grupos com cor, nome, e opções de editar/excluir

### 4. `src/modules/monitoramento-ia/pages/Paineis.tsx` (MODIFICAR)
- Adicionar botão "Grupos" no header (ao lado dos botões existentes)
- Agrupar `sortedDevices` por `device_group_id` usando os grupos carregados
- Renderizar cada grupo como seção colapsável com header colorido (similar ao `OrderGroupHeader`)
- Seção "Sem grupo" para devices sem grupo atribuído
- No card de cada device, permitir mover para grupo via menu contextual

### 5. `src/pages/public/MonitorPublicPage.tsx` (MODIFICAR)
- Buscar `device_groups` junto com devices
- Agrupar e renderizar por grupo no MonitorDashboard
- Cada grupo tem header com nome e cor, seção colapsável
- Manter o visual dark premium existente

### 6. `src/modules/monitoramento-ia/utils/devices.ts` (MODIFICAR)
- Adicionar `device_group_id` ao interface `Device`
- Incluir campo no select da `fetchDevices`

## Design Visual

- **Admin (Paineis)**: Grupos como seções colapsáveis com borda lateral colorida (igual pedido_grupos). Botão de configuração abre dialog para CRUD de grupos. Menu no card do device para mover entre grupos.
- **Monitor Público**: Grupos como seções com título em branco/cinza sobre fundo escuro, separador sutil. Mantém visual premium dark.

## Impacto
- Nenhuma alteração em funcionalidades existentes
- Devices sem grupo continuam aparecendo normalmente na seção "Sem grupo"
- Compatível com ambas as páginas (admin + público)

