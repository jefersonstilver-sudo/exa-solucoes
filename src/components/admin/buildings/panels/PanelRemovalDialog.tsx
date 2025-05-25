
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Monitor, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PanelRemovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel: {
    id: string;
    code: string;
    status: string;
    resolucao?: string;
  } | null;
  buildingName: string;
  onSuccess: () => void;
}

const PanelRemovalDialog: React.FC<PanelRemovalDialogProps> = ({
  open,
  onOpenChange,
  panel,
  buildingName,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const handleRemovePanel = async () => {
    console.log('🗑️ [REMOVE DIALOG] Iniciando remoção do painel:', {
      panelId: panel?.id,
      panelCode: panel?.code,
      buildingName
    });
    
    // Validações robustas
    if (!panel?.id) {
      console.error('❌ [REMOVE DIALOG] Painel ou ID inválido:', panel);
      toast.error('Erro: Dados do painel inválidos');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [REMOVE DIALOG] Verificando campanhas ativas para o painel:', panel.id);

      // Verificar campanhas ativas
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('campanhas')
        .select('id')
        .eq('painel_id', panel.id)
        .in('status', ['pendente', 'ativo']);

      if (campaignsError) {
        console.error('❌ [REMOVE DIALOG] Erro ao verificar campanhas:', campaignsError);
        throw campaignsError;
      }

      console.log('📊 [REMOVE DIALOG] Campanhas ativas encontradas:', activeCampaigns?.length || 0);

      if (activeCampaigns && activeCampaigns.length > 0) {
        console.warn('⚠️ [REMOVE DIALOG] Painel tem campanhas ativas');
        toast.error('Este painel não pode ser removido pois está sendo usado em campanhas ativas');
        return;
      }

      console.log('🔄 [REMOVE DIALOG] Removendo atribuição do painel');

      // Remover atribuição (definir building_id como null)
      const { error: updateError } = await supabase
        .from('painels')
        .update({ building_id: null })
        .eq('id', panel.id);

      if (updateError) {
        console.error('❌ [REMOVE DIALOG] Erro ao atualizar painel:', updateError);
        throw updateError;
      }

      console.log('✅ [REMOVE DIALOG] Painel removido com sucesso');

      // Log da ação
      try {
        await supabase.rpc('log_building_action', {
          p_building_id: null,
          p_action_type: 'unassign_panel',
          p_description: `Painel "${panel.code}" removido do prédio "${buildingName}"`,
          p_old_values: { panel_id: panel.id, panel_code: panel.code }
        });
        console.log('📝 [REMOVE DIALOG] Log registrado');
      } catch (logError) {
        console.warn('⚠️ [REMOVE DIALOG] Falha ao registrar log:', logError);
      }

      toast.success(`Painel "${panel.code}" removido com sucesso!`);
      
      // Atualizar dados e fechar dialog
      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      console.error('💥 [REMOVE DIALOG] Erro na remoção:', error);
      toast.error('Erro ao remover painel: ' + (error as any)?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Validações de renderização
  if (!panel?.id) {
    console.warn('⚠️ [REMOVE DIALOG] Dialog renderizado com painel inválido');
    if (open) {
      onOpenChange(false);
    }
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500 text-white';
      case 'offline': return 'bg-red-500 text-white';
      case 'maintenance': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <Trash2 className="h-5 w-5 mr-2" />
            Remover Atribuição do Painel
          </DialogTitle>
          <DialogDescription>
            Esta ação irá desatribuir o painel do prédio. O painel não será excluído, apenas ficará disponível para atribuição a outros prédios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aviso */}
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Atenção!</p>
              <p className="text-yellow-700">
                O painel será desvinculado do prédio "{buildingName}" e ficará disponível para nova atribuição.
              </p>
            </div>
          </div>

          {/* Informações do Painel */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{panel.code}</span>
              </div>
              <Badge className={getStatusColor(panel.status)}>
                {panel.status}
              </Badge>
            </div>
            
            {panel.resolucao && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Resolução:</span> {panel.resolucao}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRemovePanel}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Removendo...' : 'Remover Atribuição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PanelRemovalDialog;
