import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Search, MapPin, Check, X, Loader2 } from 'lucide-react';

interface StoreBuilding {
  id: string;
  nome: string;
  bairro: string;
  codigo_predio: string;
  imagem_principal: string | null;
  status: string;
}

interface AssignBuildingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  deviceName: string;
  currentBuildingId: string | null;
  onAssigned: () => void;
}

export const AssignBuildingDialog = ({
  isOpen,
  onClose,
  deviceId,
  deviceName,
  currentBuildingId,
  onAssigned,
}: AssignBuildingDialogProps) => {
  const [buildings, setBuildings] = useState<StoreBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(currentBuildingId);

  useEffect(() => {
    if (isOpen) {
      loadStoreBuildings();
      setSelectedBuildingId(currentBuildingId);
    }
  }, [isOpen, currentBuildingId]);

  const loadStoreBuildings = async () => {
    setLoading(true);
    try {
      // Buscar todos os prédios manuais (codigo_predio), incluindo sem foto
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, bairro, codigo_predio, imagem_principal, status')
        .not('codigo_predio', 'is', null)
        .order('nome');

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error('Erro ao carregar prédios:', error);
      toast.error('Erro ao carregar lista de prédios');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      // Atualizar building_id do device
      const { error } = await supabase
        .from('devices')
        .update({ building_id: selectedBuildingId })
        .eq('id', deviceId);

      if (error) throw error;

      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      if (selectedBuildingId && selectedBuilding) {
        toast.success(`Painel atribuído a ${selectedBuilding.nome}`);
      } else {
        toast.success('Atribuição removida com sucesso');
      }

      onAssigned();
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir prédio:', error);
      toast.error('Erro ao atribuir prédio ao painel');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async () => {
    setSelectedBuildingId(null);
  };

  const filteredBuildings = buildings.filter(
    (building) =>
      building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.codigo_predio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Atribuir Painel a Prédio
          </DialogTitle>
          <DialogDescription>
            Selecione um prédio da loja para vincular ao painel <strong>{deviceName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, bairro ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Current assignment info */}
        {currentBuildingId && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Atribuição atual:</span>{' '}
              {buildings.find(b => b.id === currentBuildingId)?.nome || 'Carregando...'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveAssignment}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>
        )}

        {/* Buildings list */}
        <ScrollArea className="h-[300px] border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhum prédio encontrado</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Option to remove assignment */}
              {currentBuildingId && (
                <button
                  onClick={() => setSelectedBuildingId(null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedBuildingId === null
                      ? 'bg-red-100 border-2 border-red-400'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700">Remover Atribuição</p>
                    <p className="text-xs text-red-500">Desvincular painel do prédio atual</p>
                  </div>
                  {selectedBuildingId === null && (
                    <Check className="h-5 w-5 text-red-600" />
                  )}
                </button>
              )}

              {filteredBuildings.map((building) => (
                <button
                  key={building.id}
                  onClick={() => setSelectedBuildingId(building.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedBuildingId === building.id
                      ? 'bg-emerald-100 border-2 border-emerald-400'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {building.imagem_principal ? (
                      <img
                        src={getImageUrl(building.imagem_principal) || ''}
                        alt={building.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{building.nome}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{building.bairro}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        #{building.codigo_predio}
                      </Badge>
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {selectedBuildingId === building.id && (
                    <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={saving || (selectedBuildingId === currentBuildingId)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
