
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface BuildingFiltersProps {
  filters: {
    status: string;
    bairro: string;
    padrao_publico: string;
  };
  onFiltersChange: (filters: any) => void;
  buildings: any[];
}

const BuildingFilters: React.FC<BuildingFiltersProps> = ({
  filters,
  onFiltersChange,
  buildings
}) => {
  const uniqueBairros = [...new Set(buildings.map(b => b.bairro))].filter(Boolean);
  
  const clearFilters = () => {
    onFiltersChange({
      status: '',
      bairro: '',
      padrao_publico: ''
    });
  };

  const hasActiveFilters = filters.status || filters.bairro || filters.padrao_publico;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-indexa-purple" />
            Filtros Avançados
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bairro</label>
            <Select
              value={filters.bairro}
              onValueChange={(value) => onFiltersChange({ ...filters, bairro: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os bairros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os bairros</SelectItem>
                {uniqueBairros.map((bairro) => (
                  <SelectItem key={bairro} value={bairro}>
                    {bairro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Padrão do Público</label>
            <Select
              value={filters.padrao_publico}
              onValueChange={(value) => onFiltersChange({ ...filters, padrao_publico: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os padrões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os padrões</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingFilters;
