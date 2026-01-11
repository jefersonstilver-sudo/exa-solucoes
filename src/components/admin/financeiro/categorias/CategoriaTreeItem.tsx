import React from 'react';
import { ChevronRight, ChevronDown, GripVertical, Plus, Pencil, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CategoriaNode } from '@/hooks/useCategoriaHierarchy';

interface CategoriaTreeItemProps {
  categoria: CategoriaNode;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (categoria: CategoriaNode) => void;
  onDelete: (categoria: CategoriaNode) => void;
  depth?: number;
}

export function CategoriaTreeItem({
  categoria,
  isExpanded,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  depth = 0,
}: CategoriaTreeItemProps) {
  const hasChildren = categoria.children.length > 0;
  const paddingLeft = depth * 24;

  // Ícone dinâmico baseado no icone salvo
  const IconComponent = Circle; // Usar sempre Circle como fallback

  return (
    <div className="group">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors",
          "hover:bg-muted/50",
          depth === 0 && "bg-muted/30 font-medium"
        )}
        style={{ paddingLeft: `${paddingLeft + 12}px` }}
      >
        {/* Grip para drag-and-drop */}
        <GripVertical 
          className="h-4 w-4 text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" 
        />

        {/* Botão de expandir/colapsar */}
        <button
          onClick={() => onToggleExpand(categoria.id)}
          className={cn(
            "p-0.5 rounded hover:bg-muted transition-colors",
            !hasChildren && "invisible"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Indicador de cor */}
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: categoria.cor || '#6B7280' }}
        />

        {/* Nome da categoria */}
        <span className={cn(
          "flex-1 text-sm truncate",
          !categoria.ativo && "text-muted-foreground line-through"
        )}>
          {categoria.nome}
        </span>

        {/* Badge de quantidade de filhos */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {categoria.children.length}
          </span>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Adicionar subcategoria */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(categoria.id);
            }}
            title="Adicionar subcategoria"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          {/* Editar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(categoria);
            }}
            title="Editar categoria"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {/* Deletar (não mostrar para categorias fixas) */}
          {!categoria.isFixed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(categoria);
              }}
              title="Remover categoria"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filhos recursivos */}
      {isExpanded && hasChildren && (
        <div className="ml-2 border-l border-border/50">
          {categoria.children.map((child) => (
            <CategoriaTreeItem
              key={child.id}
              categoria={child}
              isExpanded={false} // Controle de expansão pelo parent
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
