
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BuildingFilters } from '@/hooks/useBuildingStore';

interface BuildingFiltersProps {
  filters: BuildingFilters;
  onFilterChange: (filters: Partial<BuildingFilters>) => void;
  loading?: boolean;
  compact?: boolean;
}

const BuildingFilters: React.FC<BuildingFiltersProps> = ({
  filters,
  onFilterChange,
  loading = false,
  compact = false
}) => {
  const venueTypes = [
    { value: 'Residencial', label: 'Residencial' },
    { value: 'Comercial', label: 'Comercial' },
    { value: 'Misto', label: 'Misto' }
  ];

  const standardProfiles = [
    { value: 'alto', label: 'Alto Padrão' },
    { value: 'medio', label: 'Médio Padrão' },
    { value: 'normal', label: 'Padrão Normal' }
  ];

  const amenitiesList = [
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'estacionamento', label: 'Estacionamento' },
    { value: 'seguranca', label: 'Segurança 24h' },
    { value: 'area_lazer', label: 'Área de Lazer' },
    { value: 'academia', label: 'Academia' },
    { value: 'piscina', label: 'Piscina' },
    { value: 'playground', label: 'Playground' },
    { value: 'salao_festas', label: 'Salão de Festas' }
  ];

  return (
    <div className={`space-y-6 ${compact ? 'text-sm' : ''}`}>
      {/* Raio de Busca */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Raio de busca: {filters.radius/1000}km</Label>
        <Slider
          value={[filters.radius]}
          onValueChange={(value) => onFilterChange({ radius: value[0] })}
          max={20000}
          min={1000}
          step={1000}
          className="w-full"
          disabled={loading}
        />
      </div>

      {/* Tipo de Prédio */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tipo de Prédio</Label>
        <div className="space-y-2">
          {venueTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`venue-${type.value}`}
                checked={filters.venueType.includes(type.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFilterChange({
                      venueType: [...filters.venueType, type.value]
                    });
                  } else {
                    onFilterChange({
                      venueType: filters.venueType.filter(v => v !== type.value)
                    });
                  }
                }}
                disabled={loading}
              />
              <Label htmlFor={`venue-${type.value}`} className="text-sm">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Padrão do Público */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Padrão do Público</Label>
        <div className="space-y-2">
          {standardProfiles.map((profile) => (
            <div key={profile.value} className="flex items-center space-x-2">
              <Checkbox
                id={`profile-${profile.value}`}
                checked={filters.standardProfile.includes(profile.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFilterChange({
                      standardProfile: [...filters.standardProfile, profile.value]
                    });
                  } else {
                    onFilterChange({
                      standardProfile: filters.standardProfile.filter(p => p !== profile.value)
                    });
                  }
                }}
                disabled={loading}
              />
              <Label htmlFor={`profile-${profile.value}`} className="text-sm">
                {profile.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Faixa de Preço */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Faixa de Preço: R$ {filters.priceRange[0]} - R$ {filters.priceRange[1]}
        </Label>
        <div className="px-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => onFilterChange({ priceRange: value as [number, number] })}
            max={1000}
            min={0}
            step={50}
            className="w-full"
            disabled={loading}
          />
        </div>
      </div>

      {/* Público Mínimo */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Público Mínimo: {filters.audienceMin.toLocaleString()}
        </Label>
        <Slider
          value={[filters.audienceMin]}
          onValueChange={(value) => onFilterChange({ audienceMin: value[0] })}
          max={50000}
          min={0}
          step={1000}
          className="w-full"
          disabled={loading}
        />
      </div>

      {/* Comodidades */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Comodidades</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {amenitiesList.map((amenity) => (
            <div key={amenity.value} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity.value}`}
                checked={filters.amenities.includes(amenity.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFilterChange({
                      amenities: [...filters.amenities, amenity.value]
                    });
                  } else {
                    onFilterChange({
                      amenities: filters.amenities.filter(a => a !== amenity.value)
                    });
                  }
                }}
                disabled={loading}
              />
              <Label htmlFor={`amenity-${amenity.value}`} className="text-sm">
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuildingFilters;
