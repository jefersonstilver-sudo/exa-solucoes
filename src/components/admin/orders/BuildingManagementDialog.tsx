import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { Input } from '@/components/ui/input';
import { Building2, Search, Loader2 } from 'lucide-react';
import { useActiveBuildingNames } from '@/hooks/useActiveBuildingNames';
import { supabase } from '@/integrations/supabase/client';
import { useState as useStateReact, useEffect } from 'react';

interface BuildingOption {
  id: string;
  nome: string;
  bairro: string;
  status: string;
}

interface BuildingManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (buildingIds: string[]) => Promise<void>;
  existingBuildingIds: string[];
  loading?: boolean;
}

export const BuildingManagementDialog: React.FC<BuildingManagementDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  existingBuildingIds,
  loading = false
}) => {
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBuildings();
      setSelectedIds([]);
      setSearch('');
    }
  }, [isOpen]);

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, bairro, status')
        .in('status', ['ativo', 'interno'])
        .order('nome');

      if (error) throw error;
      setBuildings(data || []);
    } catch (err) {
      console.error('Erro ao buscar prédios:', err);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const availableBuildings = buildings.filter(
    b => !existingBuildingIds.includes(b.id)
  );

  const filteredBuildings = availableBuildings.filter(
    b => b.nome.toLowerCase().includes(search.toLowerCase()) ||
         b.bairro.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBuilding = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    await onConfirm(selectedIds);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Adicionar Prédios
          </DialogTitle>
          <DialogDescription>
            Selecione os prédios para vincular a este pedido. Eles serão sincronizados com a API AWS.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar prédio por nome ou bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto border border-border rounded-md max-h-[40vh]">
          {loadingBuildings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {availableBuildings.length === 0
                ? 'Todos os prédios já estão vinculados'
                : 'Nenhum prédio encontrado'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredBuildings.map(building => (
                <label
                  key={building.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <CustomCheckbox
                    checked={selectedIds.includes(building.id)}
                    onChange={() => toggleBuilding(building.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{building.nome}</p>
                    <p className="text-xs text-muted-foreground">{building.bairro}</p>
                  </div>
                  {building.status === 'interno' && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Interno</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedIds.length} prédio(s) selecionado(s)
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.length === 0 || loading}
            className="bg-[#C7141A] hover:bg-[#B40D1A] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Adicionando...
              </>
            ) : (
              `Adicionar ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
