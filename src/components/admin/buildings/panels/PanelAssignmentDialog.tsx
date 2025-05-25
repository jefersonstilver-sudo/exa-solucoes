
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

  // INVESTIGAÇÃO: Validação rigorosa de props
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

  // CORREÇÃO CRÍTICA: useEffect com validação robusta
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

  // INVESTIGAÇÃO: Early return com validação
  if (!open) {
    console.log('🚫 [PANEL ASSIGNMENT] Dialog fechado - não renderizando');
    return null;
  }

  if (!validateProps()) {
    console.error('❌ [PANEL ASSIGNMENT] Props inválidas - renderizando erro');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Erro de Configuração
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
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
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      online: 'bg-green-500 text-white',
      offline: 'bg-red-500 text-white',
      maintenance: 'bg-yellow-500 text-white'
    };
    return configs[status as keyof typeof configs] || 'bg-gray-500 text-white';
  };

  console.log('✅ [PANEL ASSIGNMENT] Renderizando dialog principal');

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
