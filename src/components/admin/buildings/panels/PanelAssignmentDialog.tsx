
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PanelAssignmentHeader from './assignment/PanelAssignmentHeader';
import PanelAssignmentContent from './assignment/PanelAssignmentContent';
import PanelAssignmentFooter from './assignment/PanelAssignmentFooter';

interface PanelAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  buildingName: string;
  onSuccess: () => void;
}

const PanelAssignmentDialog: React.FC<PanelAssignmentDialogProps> = ({
  open,
  onOpenChange,
  buildingId,
  buildingName,
  onSuccess
}) => {
  console.log('🔍 [PANEL ASSIGNMENT] Renderização:', {
    timestamp: new Date().toISOString(),
    open,
    buildingId: buildingId || 'undefined',
    buildingName: buildingName || 'undefined',
    props_valid: !!(open && buildingId && buildingName)
  });

  const [availablePanels, setAvailablePanels] = useState<any[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const validateProps = () => {
    console.log('🔍 [PANEL ASSIGNMENT] Validando props...');
    
    if (!buildingId) {
      console.error('❌ [PANEL ASSIGNMENT] buildingId é obrigatório mas está:', buildingId);
      return false;
    }

    if (!buildingName) {
      console.error('❌ [PANEL ASSIGNMENT] buildingName é obrigatório mas está:', buildingName);
      return false;
    }

    console.log('✅ [PANEL ASSIGNMENT] Props validadas:', { buildingId, buildingName });
    return true;
  };

  useEffect(() => {
    console.log('🔍 [PANEL ASSIGNMENT] useEffect disparado:', {
      open,
      buildingId,
      buildingName,
      propsValid: validateProps()
    });

    if (!open) {
      console.log('🚫 [PANEL ASSIGNMENT] Dialog fechado - limpando estados');
      setSelectedPanels([]);
      setSearchTerm('');
      setStatusFilter('all');
      setAvailablePanels([]);
      return;
    }

    if (!validateProps()) {
      console.error('❌ [PANEL ASSIGNMENT] Props inválidas - não executando fetch');
      toast.error('Erro: Dados do prédio inválidos para atribuição de painéis');
      return;
    }

    console.log('✅ [PANEL ASSIGNMENT] Executando fetchAvailablePanels...');
    fetchAvailablePanels();
  }, [open, buildingId, buildingName]);

  const fetchAvailablePanels = async () => {
    if (!validateProps()) {
      console.error('❌ [PANEL ASSIGNMENT] Abortando fetch - props inválidas');
      return;
    }

    try {
      setFetchLoading(true);
      console.log('🔍 [PANEL ASSIGNMENT] Iniciando busca de painéis disponíveis...');
      
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .is('building_id', null)
        .order('code');

      if (error) {
        console.error('❌ [PANEL ASSIGNMENT] Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ [PANEL ASSIGNMENT] Painéis carregados:', data?.length || 0);
      setAvailablePanels(data || []);

      if (!data || data.length === 0) {
        toast.info('Nenhum painel disponível para atribuição encontrado');
      }

    } catch (error) {
      console.error('💥 [PANEL ASSIGNMENT] Erro crítico ao carregar painéis:', error);
      toast.error('Erro ao carregar painéis disponíveis');
      setAvailablePanels([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const filteredPanels = availablePanels.filter(panel => {
    const matchesSearch = panel.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || panel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePanelToggle = (panelId: string) => {
    console.log('🔄 [PANEL ASSIGNMENT] Toggle painel:', panelId);
    setSelectedPanels(prev => 
      prev.includes(panelId) 
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const handleAssignPanels = async () => {
    console.log('🔍 [PANEL ASSIGNMENT] INÍCIO handleAssignPanels:', {
      selectedPanels: selectedPanels.length,
      buildingId,
      buildingName
    });

    if (selectedPanels.length === 0) {
      toast.error('Selecione pelo menos um painel para atribuir');
      return;
    }

    if (!validateProps()) {
      console.error('❌ [PANEL ASSIGNMENT] Props inválidas durante atribuição');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 [PANEL ASSIGNMENT] Executando UPDATE na tabela painels...');
      
      const { data: updateData, error: updateError } = await supabase
        .from('painels')
        .update({ building_id: buildingId })
        .in('id', selectedPanels)
        .select();

      if (updateError) {
        console.error('❌ [PANEL ASSIGNMENT] Erro no UPDATE:', updateError);
        throw updateError;
      }

      console.log('✅ [PANEL ASSIGNMENT] UPDATE executado:', updateData?.length || 0);

      toast.success(
        `${selectedPanels.length} painel(s) atribuído(s) com sucesso ao prédio "${buildingName}"!`,
        { duration: 4000 }
      );
      
      console.log('🎉 [PANEL ASSIGNMENT] Atribuição completada - chamando callbacks');
      
      setSelectedPanels([]);
      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('💥 [PANEL ASSIGNMENT] Erro crítico na atribuição:', error);
      toast.error(`Erro ao atribuir painéis: ${error.message || 'Erro desconhecido'}`, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    console.log('🚫 [PANEL ASSIGNMENT] Dialog fechado - não renderizando');
    return null;
  }

  if (!validateProps()) {
    console.error('❌ [PANEL ASSIGNMENT] Props inválidas - renderizando erro');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <PanelAssignmentHeader 
            buildingName="Erro de Configuração"
            selectedPanelsCount={0}
          />
          <div className="py-4">
            <div className="flex items-center text-red-600 mb-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Erro de Configuração</span>
            </div>
            <p className="text-gray-600">
              Não foi possível carregar os dados necessários para atribuição de painéis.
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">
                Building ID: {buildingId || 'não informado'}<br/>
                Building Name: {buildingName || 'não informado'}
              </p>
            </div>
          </div>
          <PanelAssignmentFooter
            selectedPanelsCount={0}
            loading={false}
            fetchLoading={false}
            onCancel={() => onOpenChange(false)}
            onAssign={() => {}}
          />
        </DialogContent>
      </Dialog>
    );
  }

  console.log('✅ [PANEL ASSIGNMENT] Renderizando dialog principal');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <PanelAssignmentHeader 
          buildingName={buildingName}
          selectedPanelsCount={selectedPanels.length}
        />

        <PanelAssignmentContent
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          filteredPanels={filteredPanels}
          selectedPanels={selectedPanels}
          fetchLoading={fetchLoading}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPanelToggle={handlePanelToggle}
        />

        <PanelAssignmentFooter
          selectedPanelsCount={selectedPanels.length}
          loading={loading}
          fetchLoading={fetchLoading}
          onCancel={() => onOpenChange(false)}
          onAssign={handleAssignPanels}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PanelAssignmentDialog;
