
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
import { useBuildingFormData } from '@/hooks/useBuildingFormData';
import { useBuildingDelete } from '@/hooks/useBuildingDelete';
import { supabase } from '@/integrations/supabase/client';
import BuildingFormLayout from './form/BuildingFormLayout';
import { Trash2 } from 'lucide-react';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    formData,
    loading,
    handleFormUpdate,
    handleCharacteristicToggle,
    handleSubmit
  } = useBuildingFormData(building, open);

  const { deleteBuilding, loading: deleting } = useBuildingDelete();

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
      console.log('🔄 [BUILDING FORM] Carregando painéis para building:', building.id);
      
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', building.id)
        .order('code');

      if (error) {
        console.error('❌ [BUILDING FORM] Erro ao carregar painéis:', error);
        throw error;
      }
      
      console.log('✅ [BUILDING FORM] Painéis carregados:', data?.length || 0);
      setPanels(data || []);
    } catch (error) {
      console.error('💥 [BUILDING FORM] Erro crítico ao carregar painéis:', error);
    } finally {
      setLoadingPanels(false);
    }
  };

  // CORREÇÃO: Função que realmente recarrega os painéis
  const handlePanelsChange = (updatedPanels?: any[]) => {
    console.log('🔄 [BUILDING FORM] Solicitação de recarga de painéis');
    
    // Se foram passados painéis atualizados, usar eles
    if (updatedPanels) {
      console.log('📝 [BUILDING FORM] Usando painéis atualizados:', updatedPanels.length);
      setPanels(updatedPanels);
    } else {
      // Caso contrário, recarregar do banco
      console.log('🔄 [BUILDING FORM] Recarregando painéis do banco...');
      loadPanels();
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, onSuccess, onOpenChange);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!building?.id) return;
    
    await deleteBuilding(building.id, building.nome || 'Prédio', () => {
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess();
    });
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
            onPanelsChange={handlePanelsChange}
          />

          <DialogFooter className="flex justify-between items-center">
            <div className="flex-1">
              {building && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDeleteClick}
                  disabled={loading || loadingPanels || deleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar Prédio
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || loadingPanels || deleting} 
                className="bg-[#9C1E1E] hover:bg-[#180A0A]"
              >
                {loading ? 'Salvando...' : (building ? 'Atualizar Prédio' : 'Criar Prédio')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar este prédio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O prédio "{building?.nome}" será permanentemente deletado
              do banco de dados e do sistema externo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deletando...' : 'Deletar Prédio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default BuildingFormDialog;
