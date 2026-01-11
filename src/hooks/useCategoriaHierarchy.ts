import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CategoriaNode {
  id: string;
  nome: string;
  tipo: 'fixa' | 'variavel' | 'ambos' | 'investimento';
  cor: string | null;
  icone: string | null;
  parent_id: string | null;
  nivel: number;
  ordem: number;
  ativo: boolean;
  children: CategoriaNode[];
  isFixed?: boolean; // Categorias-mãe fixas que não podem ser deletadas
}

export interface CategoriaFormData {
  nome: string;
  tipo?: 'fixa' | 'variavel' | 'ambos' | 'investimento';
  cor?: string;
  icone?: string;
  parent_id?: string | null;
  ativo?: boolean;
}

// IDs fixos das categorias-mãe (não podem ser deletadas)
const FIXED_CATEGORY_IDS = [
  '00000000-0000-0000-0000-000000000001', // Custos Fixos
  '00000000-0000-0000-0000-000000000002', // Custos Variáveis
  '00000000-0000-0000-0000-000000000003', // Investimentos
];

export function useCategoriaHierarchy() {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(FIXED_CATEGORY_IDS));

  // Fetch todas as categorias
  const { data: categorias, isLoading, error } = useQuery({
    queryKey: ['categorias-hierarchy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_despesas')
        .select('*')
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Construir árvore hierárquica
  const tree = useMemo(() => {
    if (!categorias) return [];

    const buildTree = (parentId: string | null): CategoriaNode[] => {
      return categorias
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          id: cat.id,
          nome: cat.nome,
          tipo: cat.tipo as CategoriaNode['tipo'],
          cor: cat.cor,
          icone: cat.icone,
          parent_id: cat.parent_id,
          nivel: cat.nivel ?? 0,
          ordem: cat.ordem ?? 0,
          ativo: cat.ativo ?? true,
          children: buildTree(cat.id),
          isFixed: FIXED_CATEGORY_IDS.includes(cat.id),
        }))
        .sort((a, b) => a.ordem - b.ordem);
    };

    return buildTree(null);
  }, [categorias]);

  // Obter categoria por ID
  const getCategoriaById = useCallback((id: string): CategoriaNode | null => {
    if (!categorias) return null;
    const cat = categorias.find(c => c.id === id);
    if (!cat) return null;
    
    return {
      id: cat.id,
      nome: cat.nome,
      tipo: cat.tipo as CategoriaNode['tipo'],
      cor: cat.cor,
      icone: cat.icone,
      parent_id: cat.parent_id,
      nivel: cat.nivel ?? 0,
      ordem: cat.ordem ?? 0,
      ativo: cat.ativo ?? true,
      children: [],
      isFixed: FIXED_CATEGORY_IDS.includes(cat.id),
    };
  }, [categorias]);

  // Obter caminho completo de uma categoria
  const getCategoriaPath = useCallback((id: string): string => {
    if (!categorias) return '';
    
    const path: string[] = [];
    let currentId: string | null = id;
    
    while (currentId) {
      const cat = categorias.find(c => c.id === currentId);
      if (!cat) break;
      path.unshift(cat.nome);
      currentId = cat.parent_id;
    }
    
    return path.join(' > ');
  }, [categorias]);

  // Criar categoria
  const createCategoria = useMutation({
    mutationFn: async (data: CategoriaFormData) => {
      // Determinar o tipo baseado no parent
      let tipo = data.tipo;
      if (data.parent_id && !tipo) {
        const parent = categorias?.find(c => c.id === data.parent_id);
        tipo = parent?.tipo as CategoriaFormData['tipo'];
      }

      // Calcular nível
      let nivel = 0;
      if (data.parent_id) {
        const parent = categorias?.find(c => c.id === data.parent_id);
        nivel = (parent?.nivel ?? 0) + 1;
      }

      // Calcular ordem (último da lista)
      const siblings = categorias?.filter(c => c.parent_id === data.parent_id) ?? [];
      const ordem = siblings.length > 0 
        ? Math.max(...siblings.map(s => s.ordem ?? 0)) + 1 
        : 0;

      const { data: result, error } = await supabase
        .from('categorias_despesas')
        .insert({
          nome: data.nome,
          tipo: tipo ?? 'variavel',
          cor: data.cor ?? '#6B7280',
          icone: data.icone ?? 'circle',
          parent_id: data.parent_id ?? null,
          nivel,
          ordem,
          ativo: data.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    },
  });

  // Atualizar categoria
  const updateCategoria = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoriaFormData> }) => {
      const { data: result, error } = await supabase
        .from('categorias_despesas')
        .update({
          ...(data.nome && { nome: data.nome }),
          ...(data.cor && { cor: data.cor }),
          ...(data.icone && { icone: data.icone }),
          ...(data.ativo !== undefined && { ativo: data.ativo }),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar categoria');
    },
  });

  // Deletar categoria
  const deleteCategoria = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se é categoria fixa
      if (FIXED_CATEGORY_IDS.includes(id)) {
        throw new Error('Não é possível deletar categorias-mãe fixas');
      }

      const { error } = await supabase
        .from('categorias_despesas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria removida');
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar categoria:', error);
      toast.error(error.message || 'Erro ao deletar categoria');
    },
  });

  // Reordenar categoria
  const reorderCategoria = useMutation({
    mutationFn: async ({ id, newOrder, newParentId }: { id: string; newOrder: number; newParentId?: string | null }) => {
      const updates: { ordem: number; parent_id?: string | null; nivel?: number } = { ordem: newOrder };
      
      if (newParentId !== undefined) {
        updates.parent_id = newParentId;
        // Recalcular nível
        if (newParentId) {
          const parent = categorias?.find(c => c.id === newParentId);
          updates.nivel = (parent?.nivel ?? 0) + 1;
        } else {
          updates.nivel = 0;
        }
      }

      const { error } = await supabase
        .from('categorias_despesas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-hierarchy'] });
    },
  });

  // Toggle expansão
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expandir todos
  const expandAll = useCallback(() => {
    if (!categorias) return;
    setExpandedIds(new Set(categorias.map(c => c.id)));
  }, [categorias]);

  // Colapsar todos (exceto as categorias-mãe)
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set(FIXED_CATEGORY_IDS));
  }, []);

  // Lista plana para seletores
  const flatList = useMemo(() => {
    if (!categorias) return [];
    
    const result: Array<CategoriaNode & { fullPath: string }> = [];
    
    const traverse = (nodes: CategoriaNode[], path: string[] = []) => {
      for (const node of nodes) {
        const currentPath = [...path, node.nome];
        result.push({
          ...node,
          fullPath: currentPath.join(' > '),
        });
        if (node.children.length > 0) {
          traverse(node.children, currentPath);
        }
      }
    };
    
    traverse(tree);
    return result;
  }, [categorias, tree]);

  // Verificar se categoria é fixa
  const isFixedCategory = useCallback((id: string) => {
    return FIXED_CATEGORY_IDS.includes(id);
  }, []);

  return {
    tree,
    flatList,
    isLoading,
    error,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    reorderCategoria,
    getCategoriaById,
    getCategoriaPath,
    isFixedCategory,
  };
}
