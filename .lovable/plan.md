

# Plano: Resolver Preview Branco + Aplicar Correções Pendentes

## Diagnóstico

O preview está branco sem erros no console. Os erros visíveis (`ERR_BLOCKED_BY_CLIENT`) são apenas trackers bloqueados (PostHog, Facebook, TikTok, LinkedIn) — não afetam a aplicação.

A causa provável é um estado de build corrompido/travado do Vite. As edições anteriores declararam ter aplicado mudanças mas **nenhuma das 3 correções planejadas está presente no código**:
- Query de prédios: ainda usa `['ativo', 'interno']` (linha 480)
- Grid dinâmico: ainda usa `` grid-cols-${...} `` (linha 932)
- Auto-título: não foi adicionado

## Correções a aplicar

### 1. Forçar rebuild limpo
Adicionar um comentário trivial no `main.tsx` para forçar o Vite a recompilar o entry point.

### 2. `src/pages/admin/proposals/NovaPropostaPage.tsx`

**a) Alinhar query de prédios com loja pública** (linha 480):
```typescript
// ANTES:
.in('status', ['ativo', 'interno'])
// DEPOIS:
.in('status', ['ativo', 'interno', 'instalação', 'instalacao'])
```

**b) Adicionar auto-título com `useEffect`** (após linha 215):
```typescript
// Regex para detectar título automático
const AUTO_TITLE_REGEX = /^(Horizontal|Vertical Premium) \d+ prédios? - \d+ Meses$/i;

useEffect(() => {
  if (isEditMode) return;
  const count = selectedBuildingsData.length;
  if (count === 0) return;
  const tipoLabel = tipoProduto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal';
  const newTitle = `${tipoLabel} ${count} prédios - ${durationMonths} Meses`;
  if (!tituloProposta || AUTO_TITLE_REGEX.test(tituloProposta)) {
    setTituloProposta(newTitle);
  }
}, [selectedBuildingsData.length, durationMonths, tipoProduto, isEditMode]);
```

**c) Adicionar badge de contagem** ao lado do campo título (linha ~2559):
```typescript
Título da Proposta (opcional)
<Badge variant="secondary" className="text-[10px]">
  {selectedBuildingsData.length} prédios selecionados
</Badge>
```

### 3. `src/pages/admin/proposals/PropostasPage.tsx`

**Corrigir grid dinâmico do Tailwind** (linha 932):
```typescript
// ANTES:
<div className={`grid grid-cols-${Math.min(sellersData.length, 3)} gap-2`}>
// DEPOIS:
<div className={`grid gap-2 ${
  sellersData.length === 1 ? 'grid-cols-1' :
  sellersData.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
}`}>
```

## Arquivos a editar
- `src/main.tsx` — trigger rebuild
- `src/pages/admin/proposals/NovaPropostaPage.tsx` — query + auto-título + badge
- `src/pages/admin/proposals/PropostasPage.tsx` — fix grid Tailwind

## Impacto
- Preview volta a funcionar
- Proposta passa a mostrar prédios alinhados com loja pública
- Título se auto-sincroniza com contagem real de prédios
- Grid de vendedores renderiza corretamente

