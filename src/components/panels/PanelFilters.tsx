
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { FilterOptions } from '@/types/filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface PanelFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onSearch: (location: string) => void;
  loading: boolean;
}

const neighborhoodOptions = [
  'Moema', 'Vila Olímpia', 'Pinheiros', 'Itaim Bibi', 'Jardins', 
  'Vila Mariana', 'Brooklin', 'Campo Belo', 'Tatuapé', 'Santana'
];

const facilityOptions = [
  { id: 'pool', label: 'Piscina' },
  { id: 'gym', label: 'Academia' },
  { id: 'playground', label: 'Playground' },
  { id: 'pet-area', label: 'Pet area' },
  { id: 'party-room', label: 'Salão de festas' },
  { id: 'grill', label: 'Churrasqueira' }
];

const profileOptions = [
  { id: 'high-end', label: 'Alto padrão' },
  { id: 'mid', label: 'Médio padrão' },
  { id: 'standard', label: 'Padrão' }
];

const radiusOptions = [
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 3000, label: '3km' },
  { value: 5000, label: '5km' },
  { value: 10000, label: '10km' }
];

const PanelFilters: React.FC<PanelFiltersProps> = ({ 
  filters, 
  onFilterChange, 
  onSearch,
  loading
}) => {
  const [searchInput, setSearchInput] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput);
    }
  };
  
  const handleFacilityChange = (facilityId: string, checked: boolean) => {
    const newFacilities = checked 
      ? [...filters.facilities, facilityId]
      : filters.facilities.filter(f => f !== facilityId);
      
    onFilterChange({ facilities: newFacilities });
  };
  
  const handleProfileChange = (profileId: string, checked: boolean) => {
    const newProfiles = checked 
      ? [...filters.buildingProfile, profileId]
      : filters.buildingProfile.filter(p => p !== profileId);
      
    onFilterChange({ buildingProfile: newProfiles });
  };
  
  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked 
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status);
      
    onFilterChange({ status: newStatus });
  };
  
  const resetFilters = () => {
    onFilterChange({
      radius: 5000,
      neighborhood: '',
      status: ['online'],
      buildingProfile: [],
      facilities: [],
      minMonthlyViews: 0
    });
    setSearchInput('');
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Filter className="mr-2 h-5 w-5" /> Filtros
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="text-sm text-muted-foreground"
        >
          Limpar
        </Button>
      </div>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Input
            placeholder="Digite endereço ou bairro..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-10"
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="absolute right-1 top-1 h-7 w-7 p-0" 
            disabled={!searchInput.trim() || loading}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Buscar</span>
          </Button>
        </div>
      </form>
      
      <Separator className="my-4" />
      
      {/* Radius selection */}
      <div className="mb-6">
        <Label className="block mb-2">Raio de busca</Label>
        <Select 
          value={filters.radius.toString()} 
          onValueChange={(value) => onFilterChange({ radius: parseInt(value) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar raio" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Distância</SelectLabel>
              {radiusOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {/* Neighborhood selection */}
      <div className="mb-6">
        <Label className="block mb-2">Bairro</Label>
        <Select 
          value={filters.neighborhood} 
          onValueChange={(value) => onFilterChange({ neighborhood: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar bairro" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Bairros</SelectLabel>
              {/* Fixed: Changed empty string value to "all" */}
              <SelectItem value="all">Todos os bairros</SelectItem>
              {neighborhoodOptions.map(neighborhood => (
                <SelectItem key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {/* Status filters */}
      <div className="mb-6">
        <Label className="block mb-2">Status do painel</Label>
        <div className="space-y-2">
          <div className="flex items-center">
            <Checkbox 
              id="status-online"
              checked={filters.status.includes('online')}
              onCheckedChange={(checked) => 
                handleStatusChange('online', checked as boolean)
              }
            />
            <label 
              htmlFor="status-online"
              className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ativos
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="status-installing"
              checked={filters.status.includes('installing')}
              onCheckedChange={(checked) => 
                handleStatusChange('installing', checked as boolean)
              }
            />
            <label 
              htmlFor="status-installing"
              className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Em instalação
            </label>
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Building profile */}
      <div className="mb-6">
        <Label className="block mb-2">Perfil do prédio</Label>
        <div className="space-y-2">
          {profileOptions.map(profile => (
            <div key={profile.id} className="flex items-center">
              <Checkbox 
                id={`profile-${profile.id}`}
                checked={filters.buildingProfile.includes(profile.id)}
                onCheckedChange={(checked) => 
                  handleProfileChange(profile.id, checked as boolean)
                }
              />
              <label 
                htmlFor={`profile-${profile.id}`}
                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {profile.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Facilities */}
      <div className="mb-6">
        <Label className="block mb-2">Comodidades</Label>
        <div className="grid grid-cols-2 gap-2">
          {facilityOptions.map(facility => (
            <div key={facility.id} className="flex items-center">
              <Checkbox 
                id={`facility-${facility.id}`}
                checked={filters.facilities.includes(facility.id)}
                onCheckedChange={(checked) => 
                  handleFacilityChange(facility.id, checked as boolean)
                }
              />
              <label 
                htmlFor={`facility-${facility.id}`}
                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {facility.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Minimum monthly views */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label>Visualizações mensais mínimas</Label>
          <span className="text-sm font-semibold">
            {filters.minMonthlyViews > 0 
              ? `${filters.minMonthlyViews.toLocaleString('pt-BR')}+` 
              : 'Qualquer'}
          </span>
        </div>
        <Slider
          defaultValue={[0]}
          max={10000}
          step={500}
          value={[filters.minMonthlyViews]}
          onValueChange={(values) => {
            onFilterChange({ minMonthlyViews: values[0] });
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">0</span>
          <span className="text-xs text-muted-foreground">10.000+</span>
        </div>
      </div>
      
      <Button 
        onClick={resetFilters}
        variant="outline"
        className="w-full"
      >
        <X className="mr-2 h-4 w-4" />
        Limpar Filtros
      </Button>
    </div>
  );
};

export default PanelFilters;
