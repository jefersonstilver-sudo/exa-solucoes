
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  DollarSign, 
  Users, 
  Star,
  Wifi,
  Car,
  Shield,
  Gamepad2,
  Dumbbell,
  MapPin
} from 'lucide-react';
import type { BuildingFilters } from '@/hooks/useBuildingStore';

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
    { value: 'Residencial', label: 'Residencial', icon: Building2 },
    { value: 'Comercial', label: 'Comercial', icon: Building2 },
    { value: 'Misto', label: 'Misto', icon: Building2 }
  ];

  const standardProfiles = [
    { value: 'alto', label: 'Alto Padrão', color: 'bg-purple-100 text-purple-800' },
    { value: 'medio', label: 'Médio Padrão', color: 'bg-blue-100 text-blue-800' },
    { value: 'normal', label: 'Padrão Normal', color: 'bg-gray-100 text-gray-800' }
  ];

  const amenitiesList = [
    { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { value: 'estacionamento', label: 'Estacionamento', icon: Car },
    { value: 'seguranca', label: 'Segurança 24h', icon: Shield },
    { value: 'area_lazer', label: 'Área de Lazer', icon: Gamepad2 },
    { value: 'academia', label: 'Academia', icon: Dumbbell }
  ];

  const FilterSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#3C1361]" />
        <Label className="text-base font-semibold text-gray-900">{title}</Label>
      </div>
      {children}
      <Separator className="my-4" />
    </div>
  );

  return (
    <div className={`space-y-6 ${compact ? 'text-sm' : ''}`}>
      {/* Raio de Busca */}
      <FilterSection title="Raio de Busca" icon={MapPin}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Distância máxima</span>
            <Badge variant="secondary" className="bg-[#3C1361]/10 text-[#3C1361]">
              {filters.radius/1000}km
            </Badge>
          </div>
          <Slider
            value={[filters.radius]}
            onValueChange={(value) => onFilterChange({ radius: value[0] })}
            max={20000}
            min={1000}
            step={1000}
            className="w-full"
            disabled={loading}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1km</span>
            <span>20km</span>
          </div>
        </div>
      </FilterSection>

      {/* Tipo de Prédio */}
      <FilterSection title="Tipo de Prédio" icon={Building2}>
        <div className="space-y-3">
          {venueTypes.map((type) => (
            <label key={type.value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
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
              <type.icon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Padrão do Público */}
      <FilterSection title="Padrão do Público" icon={Star}>
        <div className="space-y-3">
          {standardProfiles.map((profile) => (
            <label key={profile.value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
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
              <Badge className={`${profile.color} border-0 text-xs`}>
                {profile.label}
              </Badge>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Faixa de Preço */}
      <FilterSection title="Faixa de Preço" icon={DollarSign}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Preço mensal</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              R$ {filters.priceRange[0]} - R$ {filters.priceRange[1]}
            </Badge>
          </div>
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
          <div className="flex justify-between text-xs text-gray-500">
            <span>R$ 0</span>
            <span>R$ 1.000+</span>
          </div>
        </div>
      </FilterSection>

      {/* Público Mínimo */}
      <FilterSection title="Público Mínimo" icon={Users}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Audiência mínima</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filters.audienceMin.toLocaleString()} pessoas
            </Badge>
          </div>
          <Slider
            value={[filters.audienceMin]}
            onValueChange={(value) => onFilterChange({ audienceMin: value[0] })}
            max={50000}
            min={0}
            step={1000}
            className="w-full"
            disabled={loading}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>50K+</span>
          </div>
        </div>
      </FilterSection>

      {/* Comodidades */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-[#3C1361]" />
          <Label className="text-base font-semibold text-gray-900">Comodidades</Label>
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {amenitiesList.map((amenity) => (
            <label key={amenity.value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
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
              <amenity.icon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {amenity.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuildingFilters;
