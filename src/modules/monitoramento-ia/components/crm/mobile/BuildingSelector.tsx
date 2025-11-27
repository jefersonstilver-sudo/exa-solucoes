import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useConversationBuildings } from '@/hooks/useConversationBuildings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BuildingSelectorProps {
  conversationId: string;
}

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
}

export const BuildingSelector: React.FC<BuildingSelectorProps> = ({ conversationId }) => {
  const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const { buildings, loading, addBuilding, removeBuilding, setPrimaryBuilding } = useConversationBuildings(conversationId);

  useEffect(() => {
    fetchAvailableBuildings();
  }, []);

  const fetchAvailableBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, endereco, bairro')
        .in('status', ['ativo', 'instalação', 'instalacao'])
        .order('nome');

      if (error) throw error;
      setAvailableBuildings(data || []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const handlePrimaryChange = async (buildingId: string) => {
    const existingBuilding = buildings.find(b => b.building_id === buildingId);
    
    if (existingBuilding) {
      await setPrimaryBuilding(buildingId);
    } else {
      await addBuilding(buildingId, true);
    }
  };

  const handleToggleBuilding = async (buildingId: string, checked: boolean) => {
    if (checked) {
      await addBuilding(buildingId, false);
    } else {
      await removeBuilding(buildingId);
    }
  };

  const primaryBuilding = buildings.find(b => b.is_primary);
  const additionalBuildings = buildings.filter(b => !b.is_primary);

  return (
    <div className="space-y-4 border-t border-border pt-4 mt-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Building2 className="h-4 w-4 text-primary" />
        <span>Prédio(s) Administrado(s)</span>
      </div>

      {/* Primary Building Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Prédio Principal</Label>
        <Select
          value={primaryBuilding?.building_id || ''}
          onValueChange={handlePrimaryChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o prédio" />
          </SelectTrigger>
          <SelectContent>
            {availableBuildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{building.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {building.endereco}, {building.bairro}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Primary Building Display */}
      {primaryBuilding && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="font-medium">{primaryBuilding.building?.nome}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {primaryBuilding.building?.endereco}, {primaryBuilding.building?.bairro}
          </div>
        </div>
      )}

      {/* Additional Buildings Section */}
      {!showMultiSelect ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMultiSelect(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Marcar mais prédios
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Prédios Adicionais</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMultiSelect(false)}
              className="h-6 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
            {availableBuildings
              .filter(b => b.id !== primaryBuilding?.building_id)
              .map((building) => {
                const isSelected = additionalBuildings.some(ab => ab.building_id === building.id);
                return (
                  <div key={building.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`building-${building.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleToggleBuilding(building.id, checked as boolean)}
                    />
                    <label
                      htmlFor={`building-${building.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      <div className="font-medium">{building.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {building.bairro}
                      </div>
                    </label>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Additional Buildings Count */}
      {additionalBuildings.length > 0 && (
        <div className="text-xs text-muted-foreground">
          + {additionalBuildings.length} prédio{additionalBuildings.length !== 1 ? 's' : ''} adicional{additionalBuildings.length !== 1 ? 'is' : ''}
        </div>
      )}
    </div>
  );
};
