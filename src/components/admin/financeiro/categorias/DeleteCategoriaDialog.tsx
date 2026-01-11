import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CategoriaNode } from '@/hooks/useCategoriaHierarchy';

interface DeleteCategoriaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoria: CategoriaNode | null;
  isLoading?: boolean;
}

export function DeleteCategoriaDialog({
  isOpen,
  onClose,
  onConfirm,
  categoria,
  isLoading,
}: DeleteCategoriaDialogProps) {
  if (!categoria) return null;

  const hasChildren = categoria.children.length > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Categoria</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren ? (
              <>
                A categoria <strong>"{categoria.nome}"</strong> possui{' '}
                <strong>{categoria.children.length} subcategoria(s)</strong>.
                <br /><br />
                Ao remover esta categoria, <strong>todas as subcategorias também serão removidas</strong>.
                <br /><br />
                Essa ação não pode ser desfeita. Deseja continuar?
              </>
            ) : (
              <>
                Tem certeza que deseja remover a categoria <strong>"{categoria.nome}"</strong>?
                <br /><br />
                Essa ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Removendo...' : 'Sim, remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
