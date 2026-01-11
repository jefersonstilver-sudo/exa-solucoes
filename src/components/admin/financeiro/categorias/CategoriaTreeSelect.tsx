import React, { useState, useMemo, useCallback } from 'react';
import { Check, ChevronDown, ChevronRight, Plus, Search, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCategoriaHierarchy, type CategoriaNode, type FluxoType } from '@/hooks/useCategoriaHierarchy';
import { CategoriaFormModal } from './CategoriaFormModal';

interface CategoriaTreeSelectProps {
  value?: string;
  onChange: (categoriaId: string) => void;
  fluxo: FluxoType;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  className?: string;
}

export function CategoriaTreeSelect({
  value,
  onChange,
  fluxo,
  placeholder = 'Selecione uma categoria...',
  disabled = false,
  allowCreate = true,
  className,
}: CategoriaTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);

  const { 
    getTreeByFluxo, 
    getCategoriaById, 
    getCategoriaPath,
    createCategoria,
    isLoading 
  } = useCategoriaHierarchy();

  // Obter árvore filtrada por fluxo
  const tree = useMemo(() => getTreeByFluxo(fluxo), [getTreeByFluxo, fluxo]);

  // Filtrar por busca
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    
    const searchLower = search.toLowerCase().trim();
    
    const filterNodes = (nodes: CategoriaNode[]): CategoriaNode[] => {
      return nodes
        .map(node => {
          const matchesSearch = node.nome.toLowerCase().includes(searchLower);
          const filteredChildren = filterNodes(node.children);
          
          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((node): node is CategoriaNode => node !== null);
    };
    
    return filterNodes(tree);
  }, [tree, search]);

  // Expandir ao buscar
  React.useEffect(() => {
    if (search.trim()) {
      // Expandir todas as categorias quando buscando
      const allIds = new Set<string>();
      const collectIds = (nodes: CategoriaNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          collectIds(node.children);
        });
      };
      collectIds(tree);
      setExpandedIds(allIds);
    }
  }, [search, tree]);

  // Categoria selecionada
  const selectedCategoria = useMemo(() => {
    if (!value) return null;
    return getCategoriaById(value);
  }, [value, getCategoriaById]);

  // Display value
  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    return getCategoriaPath(value);
  }, [value, getCategoriaPath, placeholder]);

  // Toggle expansão
  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Selecionar categoria
  const handleSelect = useCallback((id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  // Criar subcategoria
  const handleCreateSubcategory = useCallback((parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateParentId(parentId);
    setShowCreateModal(true);
  }, []);

  // Renderizar item da árvore
  const renderTreeItem = (node: CategoriaNode, depth: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = value === node.id;
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
            isSelected 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted"
          )}
          style={{ paddingLeft }}
          onClick={() => handleSelect(node.id)}
        >
          {/* Expandir/Colapsar */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className={cn(
                "p-0.5 rounded hover:bg-background/50 transition-colors",
                isSelected && "hover:bg-primary-foreground/20"
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Ícone de pasta */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 flex-shrink-0" style={{ color: node.cor || undefined }} />
            ) : (
              <Folder className="h-4 w-4 flex-shrink-0" style={{ color: node.cor || undefined }} />
            )
          ) : (
            <div 
              className="h-3 w-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: node.cor || '#6B7280' }} 
            />
          )}

          {/* Nome */}
          <span className={cn(
            "flex-1 text-sm truncate",
            node.isFixed && depth === 0 && "font-semibold"
          )}>
            {node.nome}
          </span>

          {/* Check se selecionado */}
          {isSelected && (
            <Check className="h-4 w-4 flex-shrink-0" />
          )}

          {/* Botão criar subcategoria */}
          {allowCreate && (
            <button
              onClick={(e) => handleCreateSubcategory(node.id, e)}
              className={cn(
                "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                isSelected 
                  ? "hover:bg-primary-foreground/20" 
                  : "hover:bg-muted-foreground/10"
              )}
              title="Adicionar subcategoria"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filhos */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[350px] p-0 bg-popover border shadow-lg z-50" 
          align="start"
          sideOffset={4}
        >
          {/* Busca */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* Árvore */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando categorias...
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível'}
              </div>
            ) : (
              filteredTree.map(node => renderTreeItem(node))
            )}
          </div>

          {/* Criar nova categoria raiz */}
          {allowCreate && !search && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  setCreateParentId(null);
                  setShowCreateModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar nova categoria
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Modal de criação */}
      <CategoriaFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        parentId={createParentId}
        defaultFluxo={fluxo}
        onSuccess={(newCategoria) => {
          if (newCategoria?.id) {
            onChange(newCategoria.id);
            setOpen(false);
          }
          setShowCreateModal(false);
        }}
      />
    </>
  );
}
