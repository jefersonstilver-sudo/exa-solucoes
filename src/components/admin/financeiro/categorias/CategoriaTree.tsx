import React from 'react';
import { CategoriaTreeItem } from './CategoriaTreeItem';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoriaNode } from '@/hooks/useCategoriaHierarchy';

interface CategoriaTreeProps {
  tree: CategoriaNode[];
  expandedIds: Set<string>;
  isLoading?: boolean;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (categoria: CategoriaNode) => void;
  onDelete: (categoria: CategoriaNode) => void;
}

export function CategoriaTree({
  tree,
  expandedIds,
  isLoading,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
}: CategoriaTreeProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="ml-6 space-y-2">
              <Skeleton className="h-10 w-[calc(100%-24px)] rounded-lg" />
              <Skeleton className="h-10 w-[calc(100%-24px)] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma categoria encontrada.</p>
        <p className="text-sm">Clique em "Nova Categoria" para começar.</p>
      </div>
    );
  }

  // Recursive render function that passes expandedIds down
  const renderTree = (nodes: CategoriaNode[], depth: number = 0) => {
    return nodes.map((categoria) => (
      <div key={categoria.id}>
        <CategoriaTreeItem
          categoria={categoria}
          isExpanded={expandedIds.has(categoria.id)}
          onToggleExpand={onToggleExpand}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth}
        />
        {expandedIds.has(categoria.id) && categoria.children.length > 0 && (
          <div className="ml-2 border-l border-border/50">
            {renderTree(categoria.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-1">
      {renderTree(tree)}
    </div>
  );
}
