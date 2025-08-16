
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  MapPin,
  Sparkles
} from 'lucide-react';
import type { BuildingFilters } from '@/hooks/useBuildingStore';
import { motion } from 'framer-motion';

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
  // Local state for radius slider to prevent flickering
  const [localRadius, setLocalRadius] = useState(filters.radius);

  // Sync local radius with filter changes from external sources
  useEffect(() => {
    setLocalRadius(filters.radius);
  }, [filters.radius]);

  const venueTypes = [
    { value: 'Residencial', label: 'Residencial', icon: Building2 },
    { value: 'Comercial', label: 'Comercial', icon: Building2 }
  ];

  const FilterSection = ({ title, icon: Icon, children, delay = 0 }: { title: string, icon: any, children: React.ReactNode, delay?: number }) => (
    <motion.div 
      className="space-y-4"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center gap-3 group">
        <div className="p-2 rounded-lg bg-[#3C1361]/10 group-hover:bg-[#3C1361]/20 transition-colors duration-200">
          <Icon className="h-4 w-4 text-[#3C1361]" />
        </div>
        <Label className="text-base font-semibold text-gray-900 group-hover:text-[#3C1361] transition-colors duration-200">{title}</Label>
        <Sparkles className="h-3 w-3 text-[#3C1361]/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
      <div className="pl-4 border-l-2 border-gray-100">
        {children}
      </div>
      <Separator className="my-6 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${compact ? 'text-sm' : ''}`}>
      {/* Distância Máxima */}
      <FilterSection title="Distância Máxima" icon={MapPin} delay={0.1}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">Distância máxima</span>
            <Badge variant="secondary" className="bg-gradient-to-r from-[#3C1361]/10 to-[#3C1361]/20 text-[#3C1361] border-0 shadow-sm">
              {localRadius/1000}km
            </Badge>
          </div>
          <div className="px-2">
            <Slider
              value={[localRadius]}
              onValueChange={(value) => setLocalRadius(value[0])}
              onValueCommit={(value) => onFilterChange({ radius: value[0] })}
              max={20000}
              min={1000}
              step={500}
              className="w-full"
              disabled={loading}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>1km</span>
            <span>20km</span>
          </div>
        </div>
      </FilterSection>

      {/* Tipo de Prédio */}
      <FilterSection title="Tipo de Prédio" icon={Building2} delay={0.2}>
        <div className="space-y-3">
          {venueTypes.map((type) => (
            <motion.label 
              key={type.value} 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent p-3 rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-200/50"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
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
                className="border-2 border-gray-300 data-[state=checked]:border-[#3C1361] data-[state=checked]:bg-[#3C1361]"
              />
              <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-[#3C1361]/10 transition-colors duration-200">
                <type.icon className="h-4 w-4 text-gray-600 group-hover:text-[#3C1361] transition-colors duration-200" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#3C1361] transition-colors duration-200">
                {type.label}
              </span>
            </motion.label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default BuildingFilters;
