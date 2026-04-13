

# Redesign do DeviceGroupManager + Atribuição de Grupo nos Painéis

## Problemas identificados
1. **DeviceGroupManager** tem visual básico/genérico — precisa de glassmorphism premium EXA
2. **Não é possível atribuir um painel a um grupo** — falta um seletor de grupo no ComputerDetailModal (ao lado do "Prédio Atribuído" e "Empresa de Elevador")
3. **Página não atualiza em tempo real** quando um grupo é criado/editado — o hook já tem Realtime, mas o `device_group_id` nos devices precisa de refresh automático

## Plano

### 1. Redesign do `DeviceGroupManager.tsx` — visual premium glassmorphism
- Fundo do dialog com `backdrop-blur-2xl`, bordas translúcidas (`border-white/20`), sombras profundas
- Seção "Novo Grupo" com card glassmorphism (`bg-white/80 backdrop-blur-xl`)
- Botões de cor maiores (w-8 h-8) com ring de seleção premium e animação de scale
- Lista de grupos com hover suave, ícones refinados, e transições fluidas
- Botão "Criar" em vermelho EXA (`bg-[#9C1E1E]`)
- Animação ao criar/editar grupo (fade-in nos itens)

### 2. Card "Grupo" no `ComputerDetailModal.tsx`
- Adicionar um novo Card (CARD entre Prédio e Empresa de Elevador) com ícone Layers
- Select dropdown listando todos os `device_groups` + opção "Sem grupo"
- Ao selecionar, chama `moveDeviceToGroup(deviceId, groupId)` e atualiza imediatamente
- Visual idêntico aos cards existentes (bg-module-card, border-module)

### 3. Atualização em tempo real na `Paineis.tsx`
- Após `moveDeviceToGroup`, chamar `refresh()` para atualizar a lista
- O hook `useDeviceGroups` já tem Realtime — os grupos já atualizam sozinhos
- Adicionar subscription Realtime na tabela `devices` filtrando mudanças em `device_group_id` para reagrupar automaticamente

### 4. Atualização em tempo real no `MonitorPublicPage.tsx`
- Buscar `device_groups` com polling junto dos devices (já implementado)
- Garantir que mudanças de grupo reflitam sem reload

## Arquivos a modificar
- `src/components/monitor/DeviceGroupManager.tsx` — redesign completo premium
- `src/modules/monitoramento-ia/components/anydesk/ComputerDetailModal.tsx` — adicionar card de seleção de grupo
- `src/modules/monitoramento-ia/pages/Paineis.tsx` — passar `refresh` para o modal e reagir a mudanças de grupo
- `src/pages/public/MonitorPublicPage.tsx` — garantir agrupamento reativo

## Impacto
- Apenas componentes relacionados a grupos de dispositivos
- Nenhuma funcionalidade existente alterada

