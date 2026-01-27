
# Plano: Gestao de Segmentos de Negocio na Pagina de Propostas

## Objetivo

Adicionar uma area de configuracao de segmentos no header da pagina de Propostas Comerciais, permitindo visualizar, editar, ativar/desativar segmentos diretamente. A funcionalidade de criar novos segmentos inline no seletor de propostas sera mantida.

---

## Situacao Atual

### Dados no Banco
- **142 segmentos** cadastrados em **26 categorias**
- Campos: `id`, `value`, `label`, `category`, `is_active`, `sort_order`, `created_by`, `created_at`
- Todos os segmentos estao ativos (`is_active = true`)

### Componentes Existentes
- `BusinessSegmentSelector` - Seletor com busca e criacao inline (ja funciona)
- `useBusinessSegments` - Hook com `createSegment` mas SEM `updateSegment` ou `deleteSegment`

### O que Falta
- Interface de gestao/administracao de segmentos
- Funcoes de editar e ativar/desativar no hook
- Acesso rapido a partir da pagina de Propostas

---

## Solucao Proposta

### Layout Visual

No header da pagina de Propostas, adicionar um botao "Configurar Segmentos" que abre um modal de gestao:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Propostas Comerciais                               [Segmentos] [+ Nova]   │
│  Crie e gerencie propostas                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

         ↓ Clique em "Segmentos" abre modal ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                     ⚙️  Gestao de Segmentos                               X │
├─────────────────────────────────────────────────────────────────────────────┤
│  [🔍 Buscar segmento...]           [Categoria ▼]        [+ Novo Segmento]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TURISMO (8)                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Atracoes Turisticas      [turismo]              [✏️] [🔄]        │   │
│  │ ✓ Guias Turisticos         [turismo]              [✏️] [🔄]        │   │
│  │ ✓ Agencias de Turismo      [turismo]              [✏️] [🔄]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  TECNOLOGIA (10)                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Lojas de Eletronicos     [tecnologia]           [✏️] [🔄]        │   │
│  │ ✓ Shopping Eletronicos PY  [tecnologia]           [✏️] [🔄]        │   │
│  │ ○ Celulares (inativo)      [tecnologia]           [✏️] [🔄]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Legenda:
✓ = Segmento ativo
○ = Segmento inativo
✏️ = Editar nome/categoria
🔄 = Ativar/Desativar
```

---

## Alteracoes Tecnicas

### 1. Expandir Hook useBusinessSegments

Adicionar funcoes de update e toggle:

```typescript
// useBusinessSegments.ts - Novas funcoes

// Buscar TODOS os segmentos (incluindo inativos) para gestao
const { data: allSegments } = useQuery({
  queryKey: ['business-segments-all'],
  queryFn: async () => {
    const { data } = await supabase
      .from('business_segments')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    return data;
  }
});

// Atualizar segmento (nome, categoria)
const updateSegmentMutation = useMutation({
  mutationFn: async ({ id, label, category }: { id: string; label: string; category?: string }) => {
    const { data, error } = await supabase
      .from('business_segments')
      .update({ label, category })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
});

// Toggle ativo/inativo
const toggleSegmentMutation = useMutation({
  mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
    const { error } = await supabase
      .from('business_segments')
      .update({ is_active })
      .eq('id', id);
    if (error) throw error;
  }
});
```

### 2. Criar Componente SegmentManagerModal

Novo componente para gestao completa:

```typescript
// src/components/admin/proposals/SegmentManagerModal.tsx

interface SegmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Features:
// - Lista todos os segmentos agrupados por categoria
// - Busca por nome
// - Filtro por categoria
// - Editar nome inline
// - Toggle ativo/inativo com Switch
// - Criar novo segmento
// - Contagem por categoria
```

### 3. Atualizar PropostasPage.tsx

Adicionar botao no header:

```typescript
// Linha ~717 - Header desktop
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-xl font-bold">Propostas Comerciais</h1>
    <p className="text-sm text-muted-foreground">Crie e gerencie propostas</p>
  </div>
  
  <div className="flex items-center gap-2">
    {/* NOVO: Botao de Segmentos */}
    <Button 
      variant="outline"
      onClick={() => setSegmentModalOpen(true)}
      className="border-slate-300"
    >
      <Settings className="h-4 w-4 mr-2" />
      Segmentos
    </Button>
    
    <Button onClick={() => navigate(buildPath('propostas/nova'))} className="bg-[#9C1E1E]">
      <Plus className="h-4 w-4 mr-2" />
      Nova Proposta
    </Button>
  </div>
</div>

{/* Modal de Gestao */}
<SegmentManagerModal 
  isOpen={segmentModalOpen} 
  onClose={() => setSegmentModalOpen(false)} 
/>
```

---

## Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/useBusinessSegments.ts` | **MODIFICAR** | Adicionar `allSegments`, `updateSegment`, `toggleSegment` |
| `src/components/admin/proposals/SegmentManagerModal.tsx` | **CRIAR** | Modal de gestao completa |
| `src/pages/admin/proposals/PropostasPage.tsx` | **MODIFICAR** | Adicionar botao e importar modal |

---

## Funcionalidades do Modal

1. **Listagem Agrupada**
   - Segmentos agrupados por categoria (accordion ou secoes)
   - Contagem de segmentos por categoria
   - Indicador visual de ativo/inativo

2. **Busca e Filtro**
   - Campo de busca por nome
   - Dropdown para filtrar por categoria
   - Opcao de mostrar apenas ativos/inativos

3. **Edicao Inline**
   - Clicar no icone de edicao abre input inline
   - Salvar com Enter ou botao
   - Cancelar com Esc

4. **Toggle de Status**
   - Switch para ativar/desativar
   - Confirmacao antes de desativar
   - Toast de sucesso/erro

5. **Criar Novo**
   - Botao "+ Novo Segmento" abre mini-form
   - Campos: Nome, Categoria (dropdown)
   - Validacao de duplicados

---

## Fluxo de Criacao na Proposta (Ja Existente)

O `BusinessSegmentSelector` com `allowCreate={true}` continuara funcionando:

1. Usuario digita nome que nao existe
2. Aparece opcao "Criar [nome]"
3. Clica e abre dialog de confirmacao
4. Segmento e criado e selecionado automaticamente
5. Fica disponivel em todo o sistema

---

## Resultado Esperado

Apos implementacao:

1. Botao "Segmentos" visivel no header da pagina de Propostas
2. Modal com lista completa de 142+ segmentos organizados por categoria
3. Capacidade de editar nome e categoria de qualquer segmento
4. Toggle para ativar/desativar segmentos (inativos nao aparecem no seletor)
5. Criar novos segmentos diretamente do modal
6. Funcionalidade inline na proposta mantida (criar quando nao encontra)
