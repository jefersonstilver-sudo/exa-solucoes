
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
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
  const [panels, setPanels] = useState<any[]>([]);
  const [loadingPanels, setLoadingPanels] = useState(false);

  const {
    formData,
    loading,
    handleFormUpdate,
    handleCharacteristicToggle,
    handleSubmit
  } = useBuildingFormData(building, open);

  // Carregar painéis quando editando um prédio
  useEffect(() => {
    if (building?.id && open) {
      loadPanels();
    } else {
      setPanels([]);
    }
  }, [building?.id, open]);

  const loadPanels = async () => {
    if (!building?.id) return;
    
    setLoadingPanels(true);
    try {
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', building.id);

      if (error) throw error;
      setPanels(data || []);
    } catch (error) {
      console.error('Erro ao carregar painéis:', error);
    } finally {
      setLoadingPanels(false);
    }
  };

  const handleAssignPanel = () => {
    // TODO: Implementar dialog de atribuição de painel
    console.log('Atribuir painel não implementado ainda');
  };

  const handlePanelsChange = (updatedPanels: any[]) => {
    setPanels(updatedPanels);
    // Opcionalmente recarregar a lista
    loadPanels();
  };

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
            panels={panels}
            onFormUpdate={handleFormUpdate}
            onCharacteristicToggle={handleCharacteristicToggle}
            onSuccess={onSuccess}
            onAssignPanel={handleAssignPanel}
            onPanelsChange={handlePanelsChange}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingPanels} className="bg-indexa-purple hover:bg-indexa-purple-dark">
              {loading ? 'Salvando...' : (building ? 'Atualizar Prédio' : 'Criar Prédio')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingFormDialog;
