
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Panel } from '@/types/panel';
import { AmenityList } from './AmenityList';
import { PanelStats } from './PanelStats';
import { PriceSection } from './PriceSection';
import { Clock, Monitor, ArrowUp, Users, MapPin, Building, Star, Info, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PanelCardProps {
  panel: Panel;
  inCart: boolean;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({ panel, inCart, onAddToCart }) => {
  // Simulate pricing based on panel info
  const calculatePrice = (panel: Panel, days: number) => {
    // Base price calculation
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                          panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    
    // Apply discount based on duration
    let discount = 0;
    if (days >= 90) discount = 0.15;
    else if (days >= 60) discount = 0.10;
    else if (days >= 30) discount = 0.05;
    
    return Math.round(basePrice * locationFactor * days * (1 - discount));
  };
  
  // Generate data for panel display
  const monthlyViews = Math.floor(Math.random() * 50000) + 10000;
  const estimatedResidents = Math.floor(Math.random() * 800) + 200;
  const price = calculatePrice(panel, 30);
  const price60 = calculatePrice(panel, 60);
  const price90 = calculatePrice(panel, 90);
  const installDate = new Date(2024, Math.floor(Math.random() * 5), Math.floor(Math.random() * 28) + 1);
  const lastSync = panel.ultima_sync ? new Date(panel.ultima_sync) : new Date();
  const lastSyncFormatted = formatDistanceToNow(lastSync, { addSuffix: true, locale: ptBR });
  const screenCount = Math.floor(Math.random() * 2) + 1;
  const resolution = panel.resolucao || '1080x1920';
  const mode = panel.modo || 'indoor';
  const impactScore = Math.floor(Math.random() * 50) + 50; // 50-100 scale
  const visualRating = Math.floor(Math.random() * 2) + 3; // 3-5 scale
  
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card className="overflow-hidden border border-gray-200 hover:shadow-enhanced transition-all duration-300 hover:border-indexa-purple">
        <CardContent className="p-0">
          {/* Building image - full width */}
          <div className="relative h-64 w-full">
            <img 
              src={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
              alt={panel.buildings?.nome || 'Building image'}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
            
            {/* Status indicator - top right */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-4 right-4 bg-white rounded-full shadow-md px-3 py-1.5 flex items-center gap-1.5 cursor-help">
                    <span className={`w-2.5 h-2.5 rounded-full ${panel.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    <span className="text-xs font-medium text-gray-800">
                      {panel.status === 'online' ? 'Ativo' : 'Em instalação'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Última atualização: {lastSyncFormatted}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Mode and resolution - bottom left */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Badge>
              <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm">
                {resolution}
              </Badge>
              <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm flex items-center gap-1">
                <Monitor className="h-3 w-3" /> {screenCount} {screenCount === 1 ? 'Tela' : 'Telas'}
              </Badge>
            </div>
          </div>
          
          <div className="p-6">
            {/* Building info */}
            <div className="mb-6 border-b pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-indexa-purple mb-1 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-indexa-purple" />
                    {panel.buildings?.nome || 'Nome do Edifício'}
                  </h3>
                  
                  <p className="text-gray-600 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    {panel.buildings?.endereco || 'Endereço'}, {panel.buildings?.bairro || 'Bairro'}
                  </p>
                </div>
                
                <div className="bg-indexa-purple/10 rounded-lg p-2 flex flex-col items-center">
                  <div className="text-xs text-gray-600 mb-1">Impacto</div>
                  <div className="text-xl font-bold text-indexa-purple">{impactScore}</div>
                  <div className="text-[10px] text-gray-500">de 100</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-y-2 gap-x-6 mt-3 text-xs">
                <div className="flex items-center text-gray-600">
                  <Monitor className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
                  <span>{mode === 'indoor' ? 'Painel interno' : 'Painel externo'}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
                  <span>Instalado: {installDate.toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <ArrowUp className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
                  <span>Atualizado: {lastSyncFormatted}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Users className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
                  <span>Aprox. {estimatedResidents} residentes</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Star className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
                  <span>Qualidade visual: {visualRating}/5</span>
                </div>
              </div>
            </div>
            
            {/* Amenities row with horizontal scroll */}
            <div className="mb-6 border-b pb-4">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1.5 text-indexa-purple" />
                Comodidades do condomínio:
              </p>
              <AmenityList randomCount={Math.floor(Math.random() * 6) + 5} />
            </div>
            
            {/* Stats section */}
            <div className="mb-6 border-b pb-4">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <BarChart3 className="h-4 w-4 mr-1.5 text-indexa-purple" />
                Métricas de audiência:
              </p>
              <PanelStats 
                estimatedResidents={estimatedResidents} 
                monthlyViews={monthlyViews}
                screenCount={screenCount}
                resolution={resolution}
                mode={mode}
              />
            </div>
            
            {/* Technical data - panel ID etc */}
            <div className="bg-gray-50 p-3 rounded-md mb-6 text-xs">
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
