
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBuildingFormData } from '@/hooks/useBuildingFormData';
import BuildingFormLayout from './form/BuildingFormLayout';

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

const BuildingFormDialog: React.FC<BuildingFormDialogProps> = ({
  open,
  onOpenChange,
  building,
  onSuccess
}) => {
  const {
    formData,
    loading,
    handleFormUpdate,
    handleCharacteristicToggle,
    handleSubmit
  } = useBuildingFormData(building, open);

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, onSuccess, onOpenChange);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {building ? 'Editar Prédio' : 'Novo Prédio'}
          </DialogTitle>
          <DialogDescription>
            {building ? 'Edite as informações do prédio' : 'Cadastre um novo prédio'} - Todos os campos são opcionais
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <BuildingFormLayout
            formData={formData}
            building={building}
            onFormUpdate={handleFormUpdate}
            onCharacteristicToggle={handleCharacteristicToggle}
            onSuccess={onSuccess}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indexa-purple hover:bg-indexa-purple-dark">
              {loading ? 'Salvando...' : (building ? 'Atualizar Prédio' : 'Criar Prédio')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingFormDialog;
