
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Camera, Trash2 } from 'lucide-react';

interface BuildingActionsProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const BuildingActions: React.FC<BuildingActionsProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  return (
    <div className="flex items-center space-x-2 mt-auto">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onView(building)}
        className="flex items-center space-x-1"
      >
        <Eye className="h-3 w-3" />
        <span>Ver</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onEdit(building)}
        className="flex items-center space-x-1"
      >
        <Edit className="h-3 w-3" />
        <span>Editar</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onImageManager(building)}
        className="flex items-center space-x-1"
      >
        <Camera className="h-3 w-3" />
        <span>Fotos</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onDelete(building)}
        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-3 w-3" />
        <span>Excluir</span>
      </Button>
    </div>
  );
};

export default BuildingActions;
