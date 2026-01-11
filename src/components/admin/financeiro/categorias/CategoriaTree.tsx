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

  return (
    <div className="space-y-1">
      {tree.map((categoria) => (
        <CategoriaTreeItem
          key={categoria.id}
          categoria={categoria}
          isExpanded={expandedIds.has(categoria.id)}
          onToggleExpand={onToggleExpand}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
