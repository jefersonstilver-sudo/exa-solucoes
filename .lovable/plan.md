

# Plano: Calendário Google-like no Mobile + Anti-Cache Definitivo para iPhone

## Problema 1: Calendário mensal espremido no iPhone

O `DroppableCalendarDay` usa `min-h-[80px]` no mobile, e cada célula tenta exibir até 2 `TaskCard` compactos com texto, badges e ícones. Em 390px / 7 colunas = **55px por célula**. Resultado: tudo espremido, ilegível.

O Google Calendar no mobile mostra apenas o **número do dia** + **pontos coloridos** indicando eventos, sem texto. Ao tocar no dia, abre a lista de eventos.

### Solução: Modo Google Calendar para mobile

**Arquivo: `src/components/admin/agenda/DroppableCalendarDay.tsx`**

No mobile, redesenhar completamente a célula:
- Altura reduzida: `min-h-[48px]` (compacto mas confortável)
- Mostrar apenas o número do dia
- Abaixo do número, mostrar até 3 **pontos coloridos** (dots) representando tarefas, usando a cor do tipo de evento
- Se houver mais de 3 tarefas, mostrar o número total pequeno
- Tocar na célula = chamar `onTaskClick` para o primeiro task (ou disparar um novo callback para "abrir dia")

**Arquivo: `src/pages/admin/tarefas/components/AgendaMonthView.tsx`**

- No mobile, o grid usa `gap-px` (1px) em vez de `gap-0.5` para maximizar espaço
- Header dos dias da semana mais compacto

**Arquivo: `src/pages/admin/tarefas/components/EmbeddedAgenda.tsx`**

- Quando o usuário toca numa célula do mês no mobile, mudar automaticamente para a visão "Dia" naquela data (comportamento Google Calendar)

### Layout visual esperado (390px):

```text
┌────────────────────────────────┐
│  D   S   T   Q   Q   S   S    │
├──┬──┬──┬──┬──┬──┬──────────────┤
│ 1│ 2│ 3│ 4│ 5│ 6│ 7           │
│  │●●│  │● │  │  │             │
├──┼──┼──┼──┼──┼──┼──┤          │
│ 8│ 9│10│11│12│13│14│          │
│● │  │●●│  │  │  │● │          │
│  │  │●3│  │  │  │  │          │
└──┴──┴──┴──┴──┴──┴──┘          │
```

Cada `●` é um dot colorido. Toque → muda para view "dia".

---

## Problema 2: Cache no iPhone (Safari + PWA standalone)

O iPhone tem o cache mais agressivo de todos os browsers. O `site.webmanifest` com `"display": "standalone"` faz o iOS cachear toda a shell. Os mecanismos atuais (SW cleanup, meta tags no-cache, BUILD_TIMESTAMP) não funcionam porque:

1. **Safari ignora meta http-equiv Cache-Control** — só respeita headers HTTP reais
2. **PWA standalone cacheia o HTML** internamente no iOS e não re-fetcha
3. **Não há Service Worker ativo** (foi removido), então não há mecanismo para invalidar o cache do standalone

### Solução: Cache-busting ativo no index.html

**Arquivo: `src/index.html`** (dentro de `<head>`)

Adicionar um script inline que verifica a versão a cada abertura e força reload se necessário:

```html
<script>
(function() {
  var BUILD = '__BUILD_ID__';
  var KEY = 'exa_build_id';
  var stored = localStorage.getItem(KEY);
  if (stored && stored !== BUILD) {
    localStorage.setItem(KEY, BUILD);
    // Limpar caches do browser
    if ('caches' in window) {
      caches.keys().then(function(names) {
        names.forEach(function(n) { caches.delete(n); });
      });
    }
    // Force hard reload bypassing cache
    window.location.replace(window.location.href.split('?')[0] + '?v=' + BUILD);
    return;
  }
  if (!stored) localStorage.setItem(KEY, BUILD);
})();
</script>
```

Isso garante que:
- Na primeira visita, grava o BUILD_ID
- Nas visitas seguintes, se mudou, limpa caches e recarrega com query param único
- O `__BUILD_ID__` é injetado pelo plugin `html-build-id` do Vite (já existente)

**Arquivo: `src/hooks/useForceCacheClear.ts`**

Adicionar limpeza de caches do navegador (não apenas SW):

```typescript
// Limpar caches de API/fetch do browser
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((n) => caches.delete(n));
  });
}
```

---

## Resumo de Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/agenda/DroppableCalendarDay.tsx` | Redesenhar mobile para dots coloridos (Google Calendar style) |
| `src/pages/admin/tarefas/components/AgendaMonthView.tsx` | Grid mais compacto no mobile, callback para selecionar dia |
| `src/pages/admin/tarefas/components/EmbeddedAgenda.tsx` | Ao tocar dia no mês mobile → mudar para view "dia" naquela data |
| `src/index.html` | Script de cache-bust com BUILD_ID no head |
| `src/hooks/useForceCacheClear.ts` | Adicionar limpeza de browser caches |

5 arquivos, 0 dependências novas, 0 componentes novos.

