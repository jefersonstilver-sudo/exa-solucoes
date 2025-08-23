import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  loading?: boolean;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onBulkDelete,
  onClearSelection,
  loading = false
}) => {
  const { isSuperAdmin } = useAuth();

  if (selectedCount === 0 || !isSuperAdmin) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="bg-blue-600">
            {selectedCount} pedido{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
          </Badge>
          <span className="text-sm text-blue-700">
            Ações disponíveis para Super Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar Seleção
          </Button>

          <Button
            onClick={onBulkDelete}
            disabled={loading}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir Selecionados
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;