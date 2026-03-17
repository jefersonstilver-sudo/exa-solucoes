import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building2, Search, X } from 'lucide-react';

interface BuildingOption {
  id: string;
  nome: string;
  bairro: string;
  status: string;
}

interface BuildingSelectorProps {
  selectedBuildingId: string | null;
  onSelectBuilding: (id: string | null) => void;
}

const BuildingSelector = ({ selectedBuildingId, onSelectBuilding }: BuildingSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['all-buildings-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, bairro, status')
        .order('nome');
      if (error) throw error;
      return (data || []) as BuildingOption[];
    },
  });

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  const filtered = searchTerm.length >= 1
    ? buildings.filter(b =>
        b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bairro.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : buildings;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Building2 className="h-3.5 w-3.5 text-primary" />
        Prédio / Local
      </Label>

      {selectedBuilding ? (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedBuilding.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{selectedBuilding.bairro}</p>
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
            selectedBuilding.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
          }`}>
            {selectedBuilding.status === 'ativo' ? 'Online' : 'Offline'}
          </span>
          <button
            type="button"
            onClick={() => onSelectBuilding(null)}
            className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar prédio por nome ou bairro..."
              className="h-11 pl-9"
            />
          </div>
          {showDropdown && (
            <div className="absolute z-[var(--z-floating)] w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">Nenhum prédio encontrado</p>
              ) : (
                filtered.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectBuilding(b.id);
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.bairro}</p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      b.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      {b.status === 'ativo' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuildingSelector;
