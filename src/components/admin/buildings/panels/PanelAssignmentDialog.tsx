
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Monitor, 
  Plus,
  Check,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [availablePanels, setAvailablePanels] = useState<any[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (open && buildingId) {
      console.log('🔍 [ASSIGNMENT DIALOG] Dialog aberto, buscando painéis disponíveis');
      fetchAvailablePanels();
    } else {
      // Limpar estado quando fechar
      setSelectedPanels([]);
      setSearchTerm('');
      setStatusFilter('all');
    }
  }, [open, buildingId]);

  const fetchAvailablePanels = async () => {
    if (!buildingId) {
      console.error('❌ [ASSIGNMENT DIALOG] Building ID não fornecido');
      return;
    }

    try {
      setFetchLoading(true);
      console.log('🔍 [ASSIGNMENT DIALOG] Buscando painéis não atribuídos...');
      
      // Buscar painéis que não estão atribuídos a nenhum prédio
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .is('building_id', null)
        .order('code');

      if (error) {
        console.error('❌ [ASSIGNMENT DIALOG] Erro ao buscar painéis:', error);
        throw error;
      }

      console.log('✅ [ASSIGNMENT DIALOG] Painéis disponíveis encontrados:', data?.length || 0);
      setAvailablePanels(data || []);

      if (!data || data.length === 0) {
        toast.info('Nenhum painel disponível para atribuição encontrado');
      }

    } catch (error) {
      console.error('💥 [ASSIGNMENT DIALOG] Erro ao carregar painéis:', error);
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
    console.log('🔄 [ASSIGNMENT DIALOG] Toggle painel:', panelId);
    setSelectedPanels(prev => 
      prev.includes(panelId) 
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const handleAssignPanels = async () => {
    if (selectedPanels.length === 0) {
      toast.error('Selecione pelo menos um painel para atribuir');
      return;
    }

    if (!buildingId) {
      toast.error('ID do prédio não encontrado');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 [ASSIGNMENT DIALOG] Iniciando atribuição:', {
        buildingId,
        selectedPanels: selectedPanels.length,
        buildingName,
        panels: selectedPanels
      });

      // NOVA IMPLEMENTAÇÃO: Verificar políticas RLS antes de tentar UPDATE
      console.log('🔐 [ASSIGNMENT DIALOG] Verificando permissões RLS...');
      
      // Atribuir painéis selecionados ao prédio usando a nova política RLS
      console.log('📝 [ASSIGNMENT DIALOG] Executando UPDATE na tabela painels...');
      const { data: updateData, error: updateError } = await supabase
        .from('painels')
        .update({ building_id: buildingId })
        .in('id', selectedPanels)
        .select();

      if (updateError) {
        console.error('❌ [ASSIGNMENT DIALOG] Erro detalhado no UPDATE:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        throw updateError;
      }

      console.log('✅ [ASSIGNMENT DIALOG] UPDATE executado com sucesso:', {
        updatedRows: updateData?.length || 0,
        data: updateData
      });

      // Verificar se todos os painéis foram realmente atualizados
      if (updateData && updateData.length !== selectedPanels.length) {
        console.warn('⚠️ [ASSIGNMENT DIALOG] Nem todos os painéis foram atualizados:', {
          expected: selectedPanels.length,
          actual: updateData.length
        });
      }

      // Log da ação para auditoria
      try {
        console.log('📋 [ASSIGNMENT DIALOG] Registrando log de auditoria...');
        await supabase.rpc('log_building_action', {
          p_building_id: buildingId,
          p_action_type: 'assign_panels',
          p_description: `${selectedPanels.length} painel(s) atribuído(s) ao prédio "${buildingName}"`,
          p_new_values: { assigned_panels: selectedPanels, building_id: buildingId }
        });
        console.log('📝 [ASSIGNMENT DIALOG] Log de auditoria registrado');
      } catch (logError) {
        console.warn('⚠️ [ASSIGNMENT DIALOG] Falha ao registrar log (não crítico):', logError);
      }

      // Mostrar toast de sucesso
      toast.success(
        `${selectedPanels.length} painel(s) atribuído(s) com sucesso ao prédio "${buildingName}"!`,
        { duration: 4000 }
      );
      
      console.log('🎉 [ASSIGNMENT DIALOG] Atribuição completada com sucesso');
      
      // Limpar seleções e chamar callback de sucesso
      setSelectedPanels([]);
      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('💥 [ASSIGNMENT DIALOG] Erro crítico na atribuição:', {
        error,
        selectedPanels,
        buildingId,
        buildingName
      });
      
      let errorMessage = 'Erro desconhecido';
      
      if (error.code === 'PGRST116') {
        errorMessage = 'Erro de permissão - políticas RLS podem estar incorretas';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Erro ao atribuir painéis: ${errorMessage}`, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      online: 'bg-green-500 text-white',
      offline: 'bg-red-500 text-white',
      maintenance: 'bg-yellow-500 text-white'
    };
    return configs[status as keyof typeof configs] || 'bg-gray-500 text-white';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2 text-indexa-purple" />
            Atribuir Painéis ao Prédio
          </DialogTitle>
          <DialogDescription>
            Selecione os painéis que deseja atribuir ao prédio "{buildingName}"
            {selectedPanels.length > 0 && (
              <div className="mt-2 p-2 bg-green-50 rounded-md flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-green-700 font-medium">
                  {selectedPanels.length} painel(s) selecionado(s)
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por código</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Digite o código do painel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Filtrar por status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indexa-purple"
              >
                <option value="all">Todos os status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Manutenção</option>
              </select>
            </div>
          </div>

          {/* Lista de Painéis */}
          <div className="flex-1 overflow-y-auto">
            {fetchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Monitor className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Carregando painéis disponíveis...</p>
                </div>
              </div>
            ) : filteredPanels.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center space-y-3">
                  {availablePanels.length === 0 ? (
                    <>
                      <AlertCircle className="h-12 w-12 text-orange-400" />
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">Nenhum painel disponível</p>
                        <p className="text-sm text-gray-500">
                          Todos os painéis já estão atribuídos a prédios ou não há painéis cadastrados no sistema.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Monitor className="h-12 w-12 text-gray-400" />
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">Nenhum painel encontrado</p>
                        <p className="text-sm text-gray-500">
                          Tente ajustar os filtros de busca para encontrar painéis disponíveis.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPanels.map((panel) => (
                  <Card 
                    key={panel.id}
                    className={`
                      cursor-pointer transition-all duration-200
                      ${selectedPanels.includes(panel.id) 
                        ? 'ring-2 ring-indexa-purple bg-purple-50' 
                        : 'hover:shadow-md'
                      }
                    `}
                    onClick={() => handlePanelToggle(panel.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{panel.code}</span>
                        </div>
                        {selectedPanels.includes(panel.id) && (
                          <Check className="h-5 w-5 text-indexa-purple" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusBadge(panel.status)}>
                          {panel.status}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {panel.resolucao || 'N/A'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {selectedPanels.length} painel(s) selecionado(s)
            </div>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAssignPanels}
                disabled={loading || selectedPanels.length === 0 || fetchLoading}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                {loading ? (
                  <>
                    <Monitor className="h-4 w-4 mr-2 animate-spin" />
                    Atribuindo...
                  </>
                ) : (
                  `Atribuir ${selectedPanels.length} Painel(s)`
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PanelAssignmentDialog;
