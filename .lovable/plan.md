

# Correção: Tab branca + OfflineIncidentCard não aparecendo

## Problemas Identificados

### 1. Primeira tab "Informações" fica branca/invisível
A classe `data-[state=active]:!bg-module-accent` **não funciona** porque `bg-module-accent` é uma classe CSS customizada definida em `theme.css`, não uma utility do Tailwind. Prefixos de variante do Tailwind (`data-[state=active]:`) só funcionam com utilities geradas pelo Tailwind. Resultado: a tab ativa fica sem background e sem cor de texto visível.

### 2. OfflineIncidentCard não aparece para painéis já offline
O trigger `trg_device_offline_incident` só cria um registro quando o status **muda** para offline. Dispositivos que já estavam offline antes da migration **não têm registro de incidente**, então `activeIncident` é `null` e o card não renderiza.

## Correções

### Arquivo: `ComputerDetailModal.tsx` — Tabs
Trocar as classes customizadas dos TabsTriggers por classes Tailwind reais que funcionam com `data-[state=active]:`:
```tsx
// DE:
data-[state=active]:!bg-module-accent data-[state=active]:!text-white text-module-primary

// PARA:
data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground
```

### Arquivo: `useDeviceIncidents.ts` — Criar incidente sob demanda
Quando o modal abre para um device offline e não existe nenhum incidente ativo, **criar automaticamente** um registro `pendente` na tabela `device_offline_incidents`. Isso resolve o gap de devices que já estavam offline antes da migration.

### Arquivo: `OfflineIncidentCard.tsx` — Fallback quando `incident` é null
Mesmo sem incidente no banco, se o device está offline, mostrar o card com formulário para registrar causa. Criar o incidente no momento do save se necessário.

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `ComputerDetailModal.tsx` | Fix classes dos TabsTrigger para Tailwind nativo |
| `useDeviceIncidents.ts` | Auto-criar incidente pendente para devices offline sem registro |
| `OfflineIncidentCard.tsx` | Renderizar formulário mesmo quando `incident` é null (device offline) |

