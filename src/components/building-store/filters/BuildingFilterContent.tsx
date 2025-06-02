
import React from 'react';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

interface BuildingFilterContentProps {
  filters: BuildingFilters;
  onFilterChange: (filters: Partial<BuildingFilters>) => void;
  onResetFilters: () => void;
  isLoading: boolean;
  buildingsCount: number;
  hasActiveFilters: boolean;
}

const venueTypeOptions = [
  { value: 'Residencial', label: 'Residencial' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Misto', label: 'Misto' }
];

const standardProfileOptions = [
  { value: 'alto', label: 'Alto padrão' },
  { value: 'medio', label: 'Médio padrão' },
  { value: 'normal', label: 'Padrão normal' }
];

const amenitiesOptions = [
  { value: 'piscina', label: 'Piscina' },
  { value: 'academia', label: 'Academia' },
  { value: 'playground', label: 'Playground' },
  { value: 'salao_festas', label: 'Salão de festas' },
  { value: 'quadra_esportes', label: 'Quadra de esportes' },
  { value: 'churrasqueira', label: 'Churrasqueira' },
  { value: 'portaria_24h', label: 'Portaria 24h' },
  { value: 'elevador', label: 'Elevador' }
];

const neighborhoodOptions = [
  'Vila A',
  'Vila B', 
  'Vila C',
  'Centro',
  'Jardim das Flores',
  'Morumbi',
  'Porto Meira',
  'Jardim Jupira',
  'KLP',
  'Três Lagoas'
];

const sortOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'audience-desc', label: 'Maior público' },
  { value: 'views-desc', label: 'Mais visualizações' },
  { value: 'panels-desc', label: 'Mais painéis' }
];

const BuildingFilterContent: React.FC<BuildingFilterContentProps> = ({
  filters,
  onFilterChange,
  isLoading,
  buildingsCount
}) => {

  const handleVenueTypeChange = (venueType: string, checked: boolean) => {
    const newVenueTypes = checked
      ? [...filters.venueType, venueType]
      : filters.venueType.filter(v => v !== venueType);
    onFilterChange({ venueType: newVenueTypes });
  };

  const handleStandardProfileChange = (profile: string, checked: boolean) => {
    const newProfiles = checked
      ? [...filters.standardProfile, profile]
      : filters.standardProfile.filter(p => p !== profile);
    onFilterChange({ standardProfile: newProfiles });
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const newAmenities = checked
      ? [...filters.amenities, amenity]
      : filters.amenities.filter(a => a !== amenity);
    onFilterChange({ amenities: newAmenities });
  };

  return (
    <div className="space-y-6">
      
      {/* Results Counter */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        {isLoading ? (
          'Carregando...'
        ) : (
          `${buildingsCount} prédio${buildingsCount !== 1 ? 's' : ''} encontrado${buildingsCount !== 1 ? 's' : ''}`
        )}
      </div>

      {/* Sort By */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Ordenar por
        </Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange({ sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar ordenação" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Neighborhood */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Bairro
        </Label>
        <Select
          value={filters.neighborhood || 'all'}
          onValueChange={(value) => onFilterChange({ neighborhood: value === 'all' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os bairros" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os bairros</SelectItem>
            {neighborhoodOptions.map(neighborhood => (
              <SelectItem key={neighborhood} value={neighborhood}>
                {neighborhood}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Venue Type */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Tipo de local
        </Label>
        <div className="space-y-3">
          {venueTypeOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`venue-${option.value}`}
                checked={filters.venueType.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleVenueTypeChange(option.value, checked as boolean)
                }
              />
              <Label 
                htmlFor={`venue-${option.value}`}
                className="text-sm font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Faixa de preço (R$/mês)
        </Label>
        <div className="px-1">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => onFilterChange({ priceRange: value as [number, number] })}
            max={10000}
            min={0}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>R$ {filters.priceRange[0]}</span>
            <span>R$ {filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Audience Minimum */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Público mínimo estimado
        </Label>
        <div className="px-1">
          <Slider
            value={[filters.audienceMin]}
            onValueChange={(value) => onFilterChange({ audienceMin: value[0] })}
            max={50000}
            min={0}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0</span>
            <span className="text-center font-medium">
              {filters.audienceMin > 0 ? `${filters.audienceMin.toLocaleString('pt-BR')}+` : 'Qualquer'}
            </span>
            <span>50.000+</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Standard Profile */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Padrão do público
        </Label>
        <div className="space-y-3">
          {standardProfileOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`profile-${option.value}`}
                checked={filters.standardProfile.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleStandardProfileChange(option.value, checked as boolean)
                }
              />
              <Label 
                htmlFor={`profile-${option.value}`}
                className="text-sm font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Comodidades do prédio
        </Label>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {amenitiesOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${option.value}`}
                checked={filters.amenities.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleAmenityChange(option.value, checked as boolean)
                }
              />
              <Label 
                htmlFor={`amenity-${option.value}`}
                className="text-sm font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuildingFilterContent;
