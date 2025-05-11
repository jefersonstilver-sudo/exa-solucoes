
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Panel } from '@/types/panel';
import { AmenityList } from './AmenityList';
import { PanelStats } from './PanelStats';
import { PriceSection } from './PriceSection';
import { Clock, Monitor, ArrowUp, Users, Eye, Tag, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PanelCardProps {
  panel: Panel;
  inCart: boolean;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({ panel, inCart, onAddToCart }) => {
  const isCommercial = panel.buildings?.location_type === 'commercial';
  
  // Simulate pricing based on panel info
  const calculatePrice = (panel: Panel, days: number) => {
    // Base price calculation
    const basePrice = isCommercial ? 150 : 100; // Higher base price for commercial
    
    // Location factor varies by type and location
    let locationFactor = 1;
    
    if (isCommercial) {
      // Commercial pricing based on venue type and traffic
      const trafficVolume = panel.buildings?.monthly_traffic || 30000;
      locationFactor = trafficVolume > 50000 ? 1.8 : 
                       trafficVolume > 20000 ? 1.5 : 1.3;
    } else {
      // Residential pricing based on neighborhood
      locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                      panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    }
    
    // Apply discount based on duration
    let discount = 0;
    if (days >= 90) discount = 0.15;
    else if (days >= 60) discount = 0.10;
    else if (days >= 30) discount = 0.05;
    
    return Math.round(basePrice * locationFactor * days * (1 - discount));
  };
  
  // Generate data for panel display
  const monthlyViews = isCommercial 
    ? (panel.buildings?.monthly_traffic || Math.floor(Math.random() * 50000) + 30000)
    : (Math.floor(Math.random() * 50000) + 10000);
    
  const estimatedResidents = isCommercial 
    ? 0 // No residents for commercial
    : (Math.floor(Math.random() * 800) + 200);
    
  const price = calculatePrice(panel, 30);
  const price60 = calculatePrice(panel, 60);
  const price90 = calculatePrice(panel, 90);
  const installDate = new Date(2024, Math.floor(Math.random() * 5), Math.floor(Math.random() * 28) + 1);
  const lastSync = panel.ultima_sync ? new Date(panel.ultima_sync) : new Date();
  const lastSyncFormatted = formatDistanceToNow(lastSync, { addSuffix: true, locale: ptBR });
  const screenCount = Math.floor(Math.random() * 2) + 1;
  const resolution = panel.resolucao || '1080x1920';
  const mode = panel.modo || 'indoor';
  
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Generate venue type tag (for commercial locations)
  const getVenueTypeTag = () => {
    if (!isCommercial || !panel.buildings?.venue_type) return null;
    
    return (
      <Badge variant="secondary" className="bg-[#00F894]/10 text-[#00F894] border border-[#00F894]/20">
        {panel.buildings.venue_type}
      </Badge>
    );
  };

  // Format audience profile for display
  const formatAudienceProfile = () => {
    if (!isCommercial || !panel.buildings?.audience_profile?.length) return null;
    
    return panel.buildings.audience_profile.join(', ');
  };

  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card className={`overflow-hidden border ${isCommercial ? 'border-[#00F894]' : 'border-gray-200'} hover:shadow-enhanced transition-all duration-300`}>
        <CardContent className="p-0">
          {/* Type indicator - top left */}
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className={isCommercial 
              ? "bg-[#00F894] text-gray-900 shadow-md"
              : "bg-[#7C3AED] text-white shadow-md"
            }>
              <div className="flex items-center gap-1.5">
                {isCommercial ? (
                  <Building className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Users className="h-3.5 w-3.5 mr-1" />
                )}
                {isCommercial ? 'Comercial' : 'Residencial'}
              </div>
            </Badge>
          </div>
          
          {/* Building image - full width */}
          <div className="relative h-64 w-full">
            <img 
              src={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
              alt={panel.buildings?.nome || 'Building image'}
              className="h-full w-full object-cover"
            />
            
            {/* Venue type tag (for commercial) */}
            {getVenueTypeTag() && (
              <div className="absolute top-14 left-4">
                {getVenueTypeTag()}
              </div>
            )}
            
            {/* Status indicator - top right */}
            <div className="absolute top-4 right-4 bg-white rounded-full shadow-md px-3 py-1.5 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${panel.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              <span className="text-xs font-medium text-gray-800">
                {panel.status === 'online' ? 'Ativo' : 'Em instalação'}
              </span>
            </div>

            {/* Mode and resolution - bottom left */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Badge>
              <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm">
                {resolution}
              </Badge>
            </div>
          </div>
          
          <div className="p-6">
            {/* Building info */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-indexa-purple mb-1">
                {panel.buildings?.nome || 'Nome do Edifício'}
              </h3>
              
              <p className="text-gray-600 mb-1">
                {panel.buildings?.endereco || 'Endereço'}, {panel.buildings?.bairro || 'Bairro'}
              </p>
              
              <div className="flex flex-wrap gap-2 text-xs mt-2">
                <div className="flex items-center text-gray-500">
                  <Monitor className="h-3.5 w-3.5 mr-1" />
                  <span>{mode === 'indoor' ? 'Painel interno' : 'Painel externo'}</span>
                </div>
                
                <div className="flex items-center text-gray-500">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>Instalado: {installDate.toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center text-gray-500">
                  <ArrowUp className="h-3.5 w-3.5 mr-1" />
                  <span>Última sincronização: {lastSyncFormatted}</span>
                </div>
              </div>
            </div>
            
            {/* Commercial-specific data */}
            {isCommercial && panel.buildings?.peak_hours && (
              <div className="mb-4 bg-gray-50 p-3 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium text-gray-700 text-xs">Horário de pico:</span>
                    <div className="text-sm">{panel.buildings.peak_hours}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700 text-xs">Público alvo:</span>
                    <div className="text-sm">{formatAudienceProfile() || 'Geral'}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Technical data - panel ID etc */}
            <div className="bg-gray-50 p-3 rounded-md mb-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-gray-700">ID Painel:</span> {panel.id.substring(0, 8)}...
                </div>
                <div>
                  <span className="font-medium text-gray-700">Código:</span> {panel.code}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Building ID:</span> {panel.building_id.substring(0, 8)}...
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tipo:</span> {Math.random() > 0.5 ? 'Smart TV' : 'Digital Signage'}
                </div>
              </div>
            </div>
            
            {/* Amenities for residential or features for commercial */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-1.5">
                {isCommercial ? 'Categorias de Interesse:' : 'Comodidades do condomínio:'}
              </p>
              <AmenityList 
                randomCount={Math.floor(Math.random() * 4) + 2} 
                isCommercial={isCommercial}
              />
            </div>
            
            {/* Stats section */}
            <PanelStats 
              estimatedResidents={estimatedResidents} 
              monthlyViews={monthlyViews}
              screenCount={screenCount}
              resolution={resolution}
              mode={mode}
              isCommercial={isCommercial}
              peakHours={panel.buildings?.peak_hours}
            />
            
            {/* Price and CTA section */}
            <PriceSection 
              price={price}
              price60={price60}
              price90={price90}
              inCart={inCart} 
              panel={panel} 
              onAddToCart={onAddToCart} 
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
