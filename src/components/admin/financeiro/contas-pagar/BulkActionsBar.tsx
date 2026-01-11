import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClear,
  onDelete,
  canDelete = false,
  isDeleting = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar seleção
          </Button>
        </div>

        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="shadow-sm"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {isDeleting ? 'Excluindo...' : 'Excluir selecionados'}
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
