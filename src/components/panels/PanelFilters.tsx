
import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
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
import { motion } from 'framer-motion';

interface PanelFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onSearch: (location: string) => void;
  loading: boolean;
  compact?: boolean;
}

const neighborhoodOptions = [
  'Vila A', 'Vila B', 'Vila C', 'Centro', 'Jardim das Flores', 
  'Morumbi', 'Porto Meira', 'Jardim Jupira', 'KLP', 'Três Lagoas'
];

const facilityOptions = [
  { id: 'pool', label: 'Piscina' },
  { id: 'gym', label: 'Academia' },
  { id: 'playground', label: 'Brinquedoteca' },
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
  loading,
  compact = false
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    radius: true,
    neighborhood: true,
    status: true,
    buildingProfile: true,
    facilities: true,
    views: false
  });
  
  // Make sure filters is properly initialized with default values
  const safeFilters: FilterOptions = {
    radius: filters?.radius || 500,
    neighborhood: filters?.neighborhood || '',
    status: filters?.status || [],
    buildingProfile: filters?.buildingProfile || [],
    facilities: filters?.facilities || [],
    minMonthlyViews: filters?.minMonthlyViews || 0,
    buildingAge: filters?.buildingAge || 'all',
    buildingType: filters?.buildingType || 'all'
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput);
    }
  };
  
  const handleFacilityChange = (facilityId: string, checked: boolean) => {
    const newFacilities = checked 
      ? [...safeFilters.facilities, facilityId]
      : safeFilters.facilities.filter(f => f !== facilityId);
      
    onFilterChange({ facilities: newFacilities });
  };
  
  const handleProfileChange = (profileId: string, checked: boolean) => {
    const newProfiles = checked 
      ? [...safeFilters.buildingProfile, profileId]
      : safeFilters.buildingProfile.filter(p => p !== profileId);
      
    onFilterChange({ buildingProfile: newProfiles });
  };
  
  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked 
      ? [...safeFilters.status, status]
      : safeFilters.status.filter(s => s !== status);
      
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
  
  // Animation variants
  const sectionVariants = {
    open: { height: 'auto', opacity: 1, marginBottom: 16 },
    closed: { height: 0, opacity: 0, marginBottom: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl p-5 border shadow-md ${compact ? 'text-sm' : ''}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-[#2B0A3D]`}>Filtros</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-[#00FFAB]"
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
            className="pr-10 border-[#2B0A3D] focus-visible:ring-[#00FFAB] rounded-lg"
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="absolute right-1 top-1 h-7 w-7 p-0 bg-[#2B0A3D] hover:bg-[#00FFAB] transition-all rounded-md" 
            disabled={!searchInput.trim() || loading}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="sr-only">Buscar</span>
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Ex: Avenida Paraná, Vila A, Rua Jorge Sanwais 1500
        </div>
      </form>
      
      <Separator className="my-4" />
      
      {/* Radius selection */}
      <div className="mb-5">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('radius')}
        >
          <Label className="font-medium text-[#2B0A3D] flex items-center">
            Raio de busca
          </Label>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${expandedSections.radius ? 'rotate-180' : ''}`} 
          />
        </div>
        
        <motion.div
          variants={sectionVariants}
          animate={expandedSections.radius ? 'open' : 'closed'}
          initial="open"
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <Select 
            value={safeFilters.radius.toString()} 
            onValueChange={(value) => onFilterChange({ radius: parseInt(value) })}
          >
            <SelectTrigger className="w-full mt-3 rounded-lg">
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
        </motion.div>
      </div>
      
      {/* Neighborhood selection */}
      <div className="mb-5">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('neighborhood')}
        >
          <Label className="font-medium text-[#2B0A3D] flex items-center">
            Bairro
          </Label>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${expandedSections.neighborhood ? 'rotate-180' : ''}`} 
          />
        </div>
        
        <motion.div
          variants={sectionVariants}
          animate={expandedSections.neighborhood ? 'open' : 'closed'}
          initial="open"
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <Select 
            value={safeFilters.neighborhood || "all"} 
            onValueChange={(value) => onFilterChange({ neighborhood: value })}
          >
            <SelectTrigger className="w-full mt-3 rounded-lg">
              <SelectValue placeholder="Selecionar bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Bairros</SelectLabel>
                <SelectItem value="all">Todos os bairros</SelectItem>
                {neighborhoodOptions.map(neighborhood => (
                  <SelectItem key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </motion.div>
      </div>
      
      {/* Status filters */}
      <div className="mb-5">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('status')}
        >
          <Label className="font-medium text-[#2B0A3D] flex items-center">
            Status do painel
          </Label>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${expandedSections.status ? 'rotate-180' : ''}`} 
          />
        </div>
        
        <motion.div
          variants={sectionVariants}
          animate={expandedSections.status ? 'open' : 'closed'}
          initial="open"
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="space-y-3 mt-3">
            <div className="flex items-center">
              <Checkbox 
                id="status-online"
                checked={safeFilters.status.includes('online')}
                onCheckedChange={(checked) => 
                  handleStatusChange('online', checked as boolean)
                }
                className="border-[#2B0A3D] data-[state=checked]:bg-[#2B0A3D]"
              />
              <label 
                htmlFor="status-online"
                className="ml-2 text-sm font-medium leading-none"
              >
                Ativos
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="status-installing"
                checked={safeFilters.status.includes('installing')}
                onCheckedChange={(checked) => 
                  handleStatusChange('installing', checked as boolean)
                }
                className="border-[#2B0A3D] data-[state=checked]:bg-[#2B0A3D]"
              />
              <label 
                htmlFor="status-installing"
                className="ml-2 text-sm font-medium leading-none"
              >
                Em instalação
              </label>
            </div>
          </div>
        </motion.div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Building profile */}
      <div className="mb-5">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('buildingProfile')}
        >
          <Label className="font-medium text-[#2B0A3D] flex items-center">
            Perfil do prédio
          </Label>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${expandedSections.buildingProfile ? 'rotate-180' : ''}`} 
          />
        </div>
        
        <motion.div
          variants={sectionVariants}
          animate={expandedSections.buildingProfile ? 'open' : 'closed'}
          initial="open"
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="space-y-3 mt-3">
            {profileOptions.map(profile => (
              <div key={profile.id} className="flex items-center">
                <Checkbox 
                  id={`profile-${profile.id}`}
                  checked={safeFilters.buildingProfile.includes(profile.id)}
                  onCheckedChange={(checked) => 
                    handleProfileChange(profile.id, checked as boolean)
                  }
                  className="border-[#2B0A3D] data-[state=checked]:bg-[#2B0A3D]"
                />
                <label 
                  htmlFor={`profile-${profile.id}`}
                  className="ml-2 text-sm font-medium leading-none"
                >
                  {profile.label}
                </label>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Facilities */}
      <div className="mb-5">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('facilities')}
        >
          <Label className="font-medium text-[#2B0A3D] flex items-center">
            Comodidades
          </Label>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${expandedSections.facilities ? 'rotate-180' : ''}`} 
          />
        </div>
        
        <motion.div
          variants={sectionVariants}
          animate={expandedSections.facilities ? 'open' : 'closed'}
          initial="open"
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 gap-3 mt-3">
            {facilityOptions.map(facility => (
              <div key={facility.id} className="flex items-center">
                <Checkbox 
                  id={`facility-${facility.id}`}
                  checked={safeFilters.facilities.includes(facility.id)}
                  onCheckedChange={(checked) => 
                    handleFacilityChange(facility.id, checked as boolean)
                  }
                  className="border-[#2B0A3D] data-[state=checked]:bg-[#2B0A3D]"
                />
                <label 
                  htmlFor={`facility-${facility.id}`}
                  className="ml-2 text-sm font-medium leading-none"
                >
                  {facility.label}
                </label>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Minimum monthly views */}
      <div className="mb-5">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('views')}
        >
          <Label className="font-medium text-[#2B0A3D] flex items-center">
            Visualizações mensais mínimas
          </Label>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${expandedSections.views ? 'rotate-180' : ''}`} 
          />
        </div>
        
        <motion.div
          variants={sectionVariants}
          animate={expandedSections.views ? 'open' : 'closed'}
          initial="open"
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">
                {safeFilters.minMonthlyViews > 0 
                  ? `${safeFilters.minMonthlyViews.toLocaleString('pt-BR')}+` 
                  : 'Qualquer'}
              </span>
            </div>
            <Slider
              defaultValue={[0]}
              max={10000}
              step={500}
              value={[safeFilters.minMonthlyViews]}
              onValueChange={(values) => {
                onFilterChange({ minMonthlyViews: values[0] });
              }}
              className="[&>span]:bg-[#2B0A3D]"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs text-gray-500">10.000+</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      <Button 
        onClick={resetFilters}
        variant="outline"
        className="w-full hover:border-[#00FFAB] hover:text-[#00FFAB] transition-all mt-2"
      >
        <X className="mr-2 h-4 w-4" />
        Limpar Filtros
      </Button>
    </motion.div>
  );
};

export default PanelFilters;
